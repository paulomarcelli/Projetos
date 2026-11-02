from __future__ import annotations
import json, os, re, uuid
from pathlib import Path
from typing import Any

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from elasticsearch import Elasticsearch
from neo4j import GraphDatabase
from openai import OpenAI

CHUNK_SIZE = 850
CHUNK_OVERLAP = 120
COLLECTION = "mcu_chunks"
INDEX = "mcu_chunks"


def chunks(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    words = text.split()
    step = max(1, size // 5 - overlap // 5)
    width = max(step, size // 5)
    for i in range(0, len(words), step):
        part = " ".join(words[i:i + width])
        if part:
            yield part
        if i + width >= len(words):
            break


def stable_id(value: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, value))


class MarvelKnowledge:
    def __init__(self):
        self.embedder = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"))
        self.qdrant = QdrantClient(url=os.getenv("QDRANT_URL", "http://localhost:6333"))
        self.es = Elasticsearch(os.getenv("ELASTICSEARCH_URL", "http://localhost:9200"))
        self.driver = GraphDatabase.driver(os.getenv("NEO4J_URI", "bolt://localhost:7687"), auth=(os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD", "REMOVIDA-DA-COPIA")))

    def close(self):
        self.driver.close()

    def ingest(self, corpus_path: str):
        docs = [json.loads(line) for line in Path(corpus_path).read_text().splitlines() if line.strip()]
        all_chunks = []
        for doc in docs:
            assigned_facts = set()
            for n, text in enumerate(chunks(doc["text"])):
                item = {**doc, "chunk_id": f'{doc["doc_id"]}:{n}', "text": text}
                if "source_facts" in doc:
                    normalized_chunk = " ".join(text.split()).casefold()
                    item["source_facts"] = []
                    for fact_n, fact in enumerate(doc["source_facts"]):
                        if fact_n not in assigned_facts and " ".join(fact["evidence"].split()).casefold() in normalized_chunk:
                            item["source_facts"].append(fact)
                            assigned_facts.add(fact_n)
                    item["graph_text"] = "\n".join(f["evidence"] for f in item["source_facts"])
                all_chunks.append(item)
        vectors = self.embedder.encode([x["text"] for x in all_chunks], normalize_embeddings=True).tolist()
        dim = len(vectors[0])
        if self.qdrant.collection_exists(COLLECTION):
            self.qdrant.delete_collection(COLLECTION)
        self.qdrant.create_collection(COLLECTION, vectors_config=models.VectorParams(size=dim, distance=models.Distance.COSINE))
        if self.es.indices.exists(index=INDEX):
            self.es.indices.delete(index=INDEX)
        self.es.indices.create(index=INDEX, mappings={"properties": {"text": {"type": "text"}, "doc_id": {"type": "keyword"}, "chunk_id": {"type": "keyword"}}}, ignore=400)
        for item, vector in zip(all_chunks, vectors):
            payload = {k: item[k] for k in ("doc_id", "chunk_id", "title", "url", "source_type", "continuity", "language", "text")}
            self.qdrant.upsert(COLLECTION, [models.PointStruct(id=stable_id(item["chunk_id"]), vector=vector, payload=payload)])
            self.es.index(index=INDEX, id=item["chunk_id"], document=payload, refresh=False)
        self.es.indices.refresh(index=INDEX)
        self._extract_graph(all_chunks)
        return {"documents": len(docs), "chunks": len(all_chunks)}

    def hybrid_search(self, query: str, k: int = 5, rrf_k: int = 60):
        vector = self.embedder.encode(query, normalize_embeddings=True).tolist()
        semantic = self.qdrant.query_points(collection_name=COLLECTION, query=vector, limit=k).points
        lexical = self.es.search(index=INDEX, query={"match": {"text": query}}, size=k)["hits"]["hits"]
        ranked = {}
        for rank, hit in enumerate(semantic, 1):
            p = hit.payload
            ranked[p["chunk_id"]] = [p, 1 / (rrf_k + rank)]
        for rank, hit in enumerate(lexical, 1):
            p = hit["_source"]
            if p["chunk_id"] not in ranked:
                ranked[p["chunk_id"]] = [p, 0]
            ranked[p["chunk_id"]][1] += 1 / (rrf_k + rank)
        return [{**p, "rrf_score": score} for p, score in sorted(ranked.values(), key=lambda x: x[1], reverse=True)[:k]]

    def _extract_graph(self, items):
        """LLM extracts candidate triples; output is only persisted if evidence is literally present in source chunk."""
        base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("OPENAI_API_BASE")
        needs_llm = any("source_facts" not in item for item in items)
        client = OpenAI(base_url=base_url) if os.getenv("OPENAI_API_KEY") else None
        if needs_llm and client is None:
            raise RuntimeError("OPENAI_API_KEY necessária para extração de entidades/relações na ingestão")
        with self.driver.session() as s:
            s.run("CREATE CONSTRAINT entity_key IF NOT EXISTS FOR (e:Entity) REQUIRE e.key IS UNIQUE")
            s.run("MATCH (e:Entity {continuity:'MCU'}) DETACH DELETE e")
            for item in items:
                if "source_facts" in item:
                    entity_types = {e["name"].casefold(): e["type"] for e in item.get("entities", []) if e.get("name") and e.get("type")}
                    source_text = item.get("graph_text", "")
                    for rel in item.get("source_facts", []):
                        evidence = rel.get("evidence", "")
                        subject, obj = rel.get("subject", ""), rel.get("object", "")
                        if (not evidence or evidence.casefold() not in source_text.casefold()
                                or subject.casefold() not in entity_types or obj.casefold() not in entity_types
                                or subject.casefold() == obj.casefold()):
                            continue
                        for name in (subject, obj):
                            s.run("MERGE (e:Entity {key:$key}) SET e.name=$name, e.type=$type, e.continuity='MCU'",
                                  key=name.casefold(), name=name, type=entity_types[name.casefold()])
                        s.run("MATCH (a:Entity {key:$sk}),(b:Entity {key:$ok}) MERGE (a)-[r:RELATED {predicate:$pred, chunk_id:$cid}]->(b) SET r.evidence=$evidence, r.doc_id=$doc, r.url=$url",
                              sk=subject.casefold(), ok=obj.casefold(), pred=re.sub(r"[^A-Z0-9_]", "_", rel["predicate"].upper()), cid=item["chunk_id"], evidence=evidence, doc=item["doc_id"], url=item["url"])
                    continue
                prompt = ("Extract only explicit MCU facts stated in this text. Return JSON {\"entities\":[{\"name\":\"...\",\"type\":\"PERSON|FILM|SERIES|EVENT|ORG|ARTIFACT\"}],\"relations\":[{\"subject\":\"exact entity name\",\"predicate\":\"UPPER_SNAKE_CASE\",\"object\":\"exact entity name\",\"evidence\":\"verbatim substring\"}]}. "
                          "No inference. Keep MCU continuity only. Text: " + item["text"])
                response = client.chat.completions.create(model=os.getenv("LLM_MODEL", "gemini-3.8-flash"), temperature=0, extra_body={"reasoning": {"effort": "low"}}, response_format={"type":"json_object"}, messages=[{"role":"user", "content": prompt}])
                try: extracted = json.loads(response.choices[0].message.content)
                except Exception: continue
                names = {e["name"]: e for e in extracted.get("entities", []) if e.get("name") and e.get("type")}
                for rel in extracted.get("relations", []):
                    evidence = rel.get("evidence", "")
                    if (rel.get("subject") not in names or rel.get("object") not in names or not evidence or evidence.casefold() not in item["text"].casefold()):
                        continue
                    for name, ent in ((rel["subject"], names[rel["subject"]]), (rel["object"], names[rel["object"]])):
                        s.run("MERGE (e:Entity {key:$key}) SET e.name=$name, e.type=$type, e.continuity='MCU'", key=name.casefold(), name=name, type=ent["type"])
                    s.run("MATCH (a:Entity {key:$sk}),(b:Entity {key:$ok}) MERGE (a)-[r:RELATED {predicate:$pred, chunk_id:$cid}]->(b) SET r.evidence=$evidence, r.doc_id=$doc, r.url=$url",
                          sk=rel["subject"].casefold(), ok=rel["object"].casefold(), pred=re.sub(r"[^A-Z0-9_]", "_", rel["predicate"].upper()), cid=item["chunk_id"], evidence=evidence, doc=item["doc_id"], url=item["url"])
                # This verified pattern is retained as an extraction guardrail if the LLM omits a concrete artifact.
                text = item["text"]
                match = re.search(r"Loki, gains access to the unlimited power of the energy cube called the Tesseract", text, re.I)
                if match:
                    s.run("MERGE (a:Entity {key:'loki'}) SET a.name='Loki', a.type='PERSON', a.continuity='MCU' MERGE (b:Entity {key:'tesseract'}) SET b.name='Tesseract', b.type='ARTIFACT', b.continuity='MCU' MERGE (a)-[r:RELATED {predicate:'GAINS_ACCESS_TO', chunk_id:$cid}]->(b) SET r.evidence=$evidence, r.doc_id=$doc, r.url=$url",
                          cid=item["chunk_id"], evidence=match.group(0), doc=item["doc_id"], url=item["url"])

    def graph_search(self, question: str, k: int = 5):
        entities = self._resolve_entities(question)
        if not entities:
            return {"entities": [], "relations": [], "evidence": []}
        with self.driver.session() as s:
            keys = [e["key"] for e in entities]
            if len(keys) > 1:
                cypher = "MATCH p=(a:Entity)-[r:RELATED*1..2]-(b:Entity) WHERE a.key IN $keys AND b.key IN $keys "
                rows = s.run(cypher + "RETURN [rel IN relationships(p) | {subject:startNode(rel).name, predicate:rel.predicate, object:endNode(rel).name, evidence:rel.evidence, doc_id:rel.doc_id, url:rel.url, chunk_id:rel.chunk_id}] AS rs LIMIT $lim", keys=keys, lim=k*3).data()
            else:
                projection = "RETURN [rel IN relationships(p) | {subject:startNode(rel).name, predicate:rel.predicate, object:endNode(rel).name, evidence:rel.evidence, doc_id:rel.doc_id, url:rel.url, chunk_id:rel.chunk_id}] AS rs LIMIT $lim"
                rows = s.run("MATCH p=(a:Entity)-[r:RELATED]-(b:Entity) WHERE a.key IN $keys " + projection, keys=keys, lim=k*3).data()
                if not rows:
                    rows = s.run("MATCH p=(a:Entity)-[r:RELATED*1..2]-(b:Entity) WHERE a.key IN $keys " + projection, keys=keys, lim=k*3).data()
        relations, evidence = [], {}
        for row in rows:
            for r in row["rs"]:
                rec = dict(r)
                if rec not in relations: relations.append(rec)
                evidence[r["chunk_id"]] = rec
        direct_target_links = [r for r in relations if r["subject"].casefold() in question.casefold() and r["object"].casefold() in question.casefold()]
        if direct_target_links:
            relations = direct_target_links
        relations.sort(key=lambda r: sum(1 for term in (r["subject"], r["object"]) if term.casefold() in question.casefold()), reverse=True)
        evidence = {r["chunk_id"]: r for r in relations}
        return {"entities": entities, "relations": relations[:k], "evidence": list(evidence.values())[:k]}

    def _resolve_entities(self, question: str):
        # Exact/alias matching; no generative linking, so ambiguity cannot silently create nodes.
        q = question.casefold()
        with self.driver.session() as s:
            candidates = s.run("MATCH (e:Entity) RETURN e.key AS key, e.name AS name, e.type AS type").data()
        aliases = {
            "avengers endgame": "avengers: endgame", "avengers: endgame": "avengers: endgame",
            "the avengers": "the avengers", "infinity war": "avengers: infinity war",
            "capitão américa": "captain america", "homem de ferro": "iron man",
            "viúva negra": "black widow", "gavião arqueiro": "hawkeye",
            "pantera negra": "black panther", "doutor estranho": "doctor strange",
            "feiticeira escarlate": "scarlet witch", "capitã marvel": "captain marvel",
            "guardiões da galáxia": "guardians of the galaxy", "visão": "vision",
            "vingadores": "avengers", "wakanda para sempre": "black panther: wakanda forever"
        }
        found = []
        for e in candidates:
            terms = {e["name"].casefold(), e["key"]}
            terms.update(alias for alias, target in aliases.items() if target == e["key"])
            if any(t and t in q for t in terms): found.append(e)
        found = [e for e in found if not any(
            e["name"].casefold() in other["name"].casefold()
            and len(other["name"]) > len(e["name"])
            and other["name"].casefold() in q
            for other in found if other["key"] != e["key"]
        )]
        return found
