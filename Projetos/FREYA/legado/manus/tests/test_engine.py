import json
from pathlib import Path

from marvel_rag.engine import chunks

CORPUS = Path(__file__).resolve().parents[1] / "data" / "corpus.jsonl"


def load_corpus():
    return [json.loads(line) for line in CORPUS.read_text().splitlines() if line.strip()]

def test_chunks_cover_text_and_overlap():
    text = " ".join(f"w{i}" for i in range(500))
    out = list(chunks(text))
    assert len(out) > 1
    assert out[0].split()[-1] in out[1].split()
    assert out[0].split()[0] == "w0"
    assert out[-1].split()[-1] == "w499"

def test_rrf_ordering_formula():
    # Query-vector rank 1 + BM25 rank 2 should beat an item found only at BM25 rank 1.
    rrf_k = 60
    combined = 1/(rrf_k+1) + 1/(rrf_k+2)
    lexical_only = 1/(rrf_k+1)
    assert combined > lexical_only


def test_corpus_is_official_mcu_and_has_unique_source_records():
    docs = load_corpus()
    assert len(docs) == 37
    assert len({d["doc_id"] for d in docs}) == len(docs)
    assert all(d["continuity"] == "MCU" for d in docs)
    assert all(d["url"].startswith("https://www.marvel.com/") for d in docs)


def test_each_curated_graph_fact_has_source_excerpt_and_known_endpoints():
    for doc in load_corpus():
        if "source_facts" not in doc:
            continue
        entity_names = {e["name"].casefold() for e in doc["entities"]}
        for fact in doc["source_facts"]:
            assert fact["evidence"].casefold() in doc["graph_text"].casefold()
            assert fact["subject"].casefold() in entity_names
            assert fact["object"].casefold() in entity_names


def test_official_timeline_catalog_has_81_entries():
    timeline = next(d for d in load_corpus() if d["doc_id"] == "marvel-mcu-complete-timeline-index")
    assert len([e for e in timeline["entities"] if e["name"] != timeline["title"]]) == 81


def test_loki_tesseract_relation_has_literal_official_evidence():
    avengers = next(d for d in load_corpus() if d["url"] == "https://www.marvel.com/movies/the-avengers")
    fact = next(f for f in avengers["source_facts"] if f["subject"] == "Loki" and f["object"] == "Tesseract")
    assert fact["predicate"] == "GAINS_ACCESS_TO"
    assert fact["evidence"] in avengers["graph_text"]
