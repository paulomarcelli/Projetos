# F.R.E.Y.A. — Marvel Knowledge Engine

Inteligência prospectiva sobre o Universo Cinematográfico Marvel (MCU). Recebe um tema, acontecimento ou
questão de investigação e devolve **uma análise prospectiva estruturada** e o **grafo** das entidades e
relações que a sustentam. Não é um chatbot: não conversa, não guarda histórico de mensagens, não responde
perguntas livres.

```
questão ─► Hybrid RAG (Qdrant + BM25 + RRF) ─┐
        └► GraphRAG (Neo4j)  ────────────────┼─► registro de evidências ─► motor prospectivo ─► validador
                                             │                                     │
                                             └──────────────── grafo da investigação (nós, arestas, evidências, animação)
```

- **Hybrid RAG:** busca vetorial (embedding multilíngue, Qdrant) + BM25 (Elasticsearch, analisadores pt/en),
  fundidas por Reciprocal Rank Fusion. Cada trecho mantém documento, URL e captura da fonte.
- **GraphRAG:** grafo tipado no Neo4j (personagens, organizações, acontecimentos, locais, artefatos,
  tecnologias, obras, pessoas reais). Toda aresta guarda a evidência literal e a fonte. Recupera vizinhança,
  caminhos reais entre entidades e a trajetória de cada personagem (momentos e aparições por ano).
- **Motor prospectivo:** monta um dossiê (pontes, tensões, centralidade, trajetórias, lacunas) e sintetiza
  contexto, atores, relações sistêmicas, variáveis, tendências, incertezas críticas, desdobramentos e cenários.
  Cada afirmação é `confirmado`, `inferencia` ou `hipotese` e cita evidências; o validador recusa o que não
  se sustenta.

A arquitetura completa está em [docs/ARQUITETURA.md](docs/ARQUITETURA.md) e a auditoria da versão anterior
(Manus) em [docs/AUDITORIA.md](docs/AUDITORIA.md). O relatório desta entrega está em
[docs/RELATORIO.md](docs/RELATORIO.md).

## Requisitos

- Python 3.11+
- Docker Compose v2 (Qdrant, Elasticsearch, Neo4j)
- Opcional: chave da OpenAI (ou de um revendedor compatível, com `OPENAI_BASE_URL`) para o motor prospectivo;
  sem ela, o motor roda no modo determinístico, sem cenários

## Instalação

```bash
cp .env.example .env            # defina NEO4J_PASSWORD (e OPENAI_API_KEY, se tiver)
docker compose up -d
python -m venv .venv && source .venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu   # opcional: torch só para CPU, mais leve
pip install -e '.[dev]'
```

O modelo de embedding (`paraphrase-multilingual-MiniLM-L12-v2`, ~470 MB) é baixado na primeira indexação.

## Servidor (online, com o RAG e o GraphRAG prontos)

```bash
cp .env.example .env            # NEO4J_PASSWORD, OPENAI_API_KEY (e OPENAI_BASE_URL, se for revendedor), FREYA_CORS_ORIGENS
docker compose up -d --build
curl http://SEU-SERVIDOR:8000/saude
```

O `docker compose` sobe a API e os três bancos. Na **primeira** subida a API roda `freya preparar`:
coleta marvel.com no próprio servidor (o repositório não traz esse conteúdo; ~45 min), junta com os corpora da
wiki que já vêm no repositório e indexa tudo no Qdrant, no Elasticsearch e no Neo4j. Depois disso:

- reiniciar não reindexa: a assinatura dos corpora fica no volume `freya_estado` e os bancos guardam os índices;
- atualizar um corpus no repositório e rodar `docker compose up -d --build` reindexa sozinho;
- `GET /saude` mostra o motor e o tamanho da base (`base.hybrid.chunks`, `base.grafo.nos`).

Só a API (porta 8000) fica exposta; os bancos escutam em 127.0.0.1. Para o frontend chamar a API pelo
navegador, liste o endereço dele em `FREYA_CORS_ORIGENS`. Recursos mínimos: ~4 GB de RAM e ~10 GB de disco
(imagem da API ~3 GB, Elasticsearch ~2 GB). Em produção, coloque um proxy com HTTPS (Caddy, Nginx) na frente da porta 8000.

## Base de conhecimento

Três camadas de fonte, todas da continuidade cinematográfica, cada fato marcado com a sua confiabilidade
(`oficial` > `enciclopedia` > `wiki_fas`):

1. **Coleta oficial de marvel.com** (`freya coletar`): páginas de filmes, séries e perfis *on-screen* de
   personagens, partindo da cronologia oficial do MCU. Lê só os blocos `live_action` (os de quadrinhos são
   descartados e contados). Respeita o `robots.txt`, espera 2 s entre requisições, identifica-se como
   F.R.E.Y.A. e guarda uma cópia de cada página em `data/raw/` (com data e hash) para conferir as evidências.
   **O conteúdo de marvel.com não vai para o repositório** (`data/raw/`, `coletado/` e `unificado/` estão no
   `.gitignore`): os Termos de Uso da Marvel não permitem redistribuí-lo, e cada servidor o coleta sozinho.
   Os corpora da wiki (`data/corpus/wiki/` e `extraido/`, CC BY-SA, com atribuição) estão no repositório.
2. **Corpus da Manus** (`data/corpus/manus_corpus.jsonl`): 37 páginas oficiais resumidas, migradas para o
   modelo novo (identidades tipadas, predicados normalizados, direção corrigida).
3. **Aprofundamento** (`freya aprofundar`), a partir das entidades oficiais:
   - **wiki do MCU** (marvelcinematicuniverse.fandom.com, CC BY-SA 3.0, fonte secundária): para cada personagem
     oficial, a página cuja identidade confere; dela vêm filiações (atuais e antigas), parentes, aliados e
     inimigos com a nuance da relação ("Adoptive Brother, Former Teammate"), estado (vivo/morto) e a biografia
     em capítulos cronológicos ancorados nas obras citadas (logo, no ano). Trechos que a própria wiki marca
     como de canonicidade incerta são descartados. Das páginas de obra vêm o enredo e as aparições
     (personagens, organizações, locais, acontecimentos, artefatos);
   - **extração de relações dos enredos** pelo modelo de linguagem: só entre entidades já existentes, só
     predicados da ontologia, e só com citação literal conferida no texto; cada fato leva a obra e o ano;
   - **Wikipedia** (CC BY-SA 4.0): o módulo existe (`coleta/wikipedia.py`), mas a Wikimedia bloqueia o acesso
     automatizado em alguns ambientes; rode de uma rede que ela aceite.

```bash
freya coletar                   # marvel.com, ~45 min; retoma de onde parou
freya aprofundar                # wiki do MCU + extração dos enredos (usa o modelo; ~1 h)
freya ingerir                   # unifica, resolve entidades, valida e indexa nos três serviços
```

`freya ingerir` grava `data/corpus/unificado/` e `relatorio.json` (entidades fundidas, nomes ambíguos,
fatos descartados e por quê).

## Uso

```bash
freya investigar "Qual o futuro dos Vingadores depois de Thanos?" --horizonte "após Avengers: Endgame"
freya servir                     # API em http://127.0.0.1:8000 (documentação em /docs)
```

Sem os serviços, use `--modo memoria` (indexa em memória a cada execução).

## Interface (front-end)

A pasta `frontend/` contém a aplicação web da F.R.E.Y.A. (identidade Scarlet Reality):
- dashboard com o explorador do grafo;
- nova análise;
- a análise estruturada em 9 seções, com evidências e cenários ligados ao grafo;
- histórico, guardados, configurações de tipografia e perfil;
- modo claro e escuro com o Scarlet Reality Shift.

Para testar no seu computador (no VS Code, por exemplo), use dois terminais:

```bash
# terminal 1 — a API (sem Docker: modo memória; leva ~5 min para montar a base)
freya servir --modo memoria

# terminal 2 — a interface
cd frontend
npm install
npm run dev                      # abre em http://localhost:5173
```

No desenvolvimento, a interface chama `/api/...` e o Vite repassa para `http://127.0.0.1:8000`, então não precisa de
CORS. Em produção, defina `VITE_FREYA_API` com o endereço da API e coloque a origem do site em `FREYA_CORS_ORIGENS`.
Testes: `npm test` (unidade) e `FREYA_API_INTEGRACAO=1 npx vitest run src/test/integracao` (contra a API real).
Arquitetura, contratos e o que ainda falta no backend: [docs/FRONTEND.md](docs/FRONTEND.md).

### API

| Método | Rota | O que faz |
|---|---|---|
| POST | `/investigacoes` | cria uma investigação `{questao, horizonte?}` e a executa em segundo plano |
| GET | `/investigacoes?guardadas=&limite=` | histórico (mais recentes primeiro), com filtro de guardadas |
| GET | `/investigacoes/{id}` | estado, etapas, análise prospectiva, evidências e se está guardada |
| DELETE | `/investigacoes/{id}` | exclui (409 enquanto a investigação roda) |
| PUT / DELETE | `/investigacoes/{id}/guardada` | guarda ou remove dos guardados |
| GET | `/investigacoes/{id}/grafo` | grafo da investigação (contrato abaixo) |
| GET | `/investigacoes/{id}/grafo/expandir?no=` | vizinhos de um nó, com evidências |
| GET | `/investigacoes/{id}/grafo/caminho?de=&para=` | caminhos entre dois nós (`existe: false` se não houver) |
| GET | `/investigacoes/{id}/evidencias/{eid}` | uma evidência e sua fonte |
| GET | `/saude` | modo do motor e armazenamento do grafo |

### Grafo para o frontend

`GET /investigacoes/{id}/grafo` devolve a estrutura que um frontend desenha e anima (não é imagem):

- `nos`: `id`, `rotulo`, `tipo`, `papel` (`focal`, `ponte`, `trajetoria`, `contexto`), `relevancia` (0–1), `grau`, `cenarios`
- `arestas`: `origem`, `destino`, `predicado`, `rotulo` (pt), `dirigida`, `tipo_epistemico`, `peso`, `evidencias`, `ordem`, `ano`, `em_caminhos`, `cenarios`
- `evidencias`: texto literal ou campo da página, URL, documento, captura
- `sequencia`: passos de revelação (focais → caminhos → relações diretas → trajetórias → contexto)
- `caminhos`: caminhos entre as entidades focais, para destacar
- `cenarios`: nós e arestas que cada cenário mobiliza
- `legenda`: tipos de nó e de relação presentes, com rótulos em português

## Testes

```bash
pytest                          # unidade: sem serviços e sem chamadas pagas (modelo simulado)
pytest -m integracao            # integração: precisa de docker compose up -d e NEO4J_PASSWORD
```

Os testes do motor, do grafo e da API usam um corpus sintético (entidades fictícias Alfa, Beta, Gama):
nenhum fato do MCU é inventado nos testes. Os testes do leitor de marvel.com usam trechos reais capturados.

## Estrutura

```
src/freya/
  conhecimento/   ontologia, modelos, corpus, migração da Manus, resolução de entidades, ingestão
    coleta/       coletor de marvel.com e leitor das páginas (só live_action)
  hybrid/         chunking, índices (Qdrant, Elasticsearch, memória), recuperador com RRF
  graph/          armazenamento (Neo4j, NetworkX), reconhecimento de entidades, recuperador
  evidencias/     registro de evidências (ids E1, E2… compartilhados pelos três mecanismos)
  llm/            interface com o modelo (OpenAI) e modelo simulado
  prospectivo/    modelos da análise, motor, validador epistêmico
  grafo_visual/   grafo da investigação para o frontend
  investigacao/   orquestrador e persistência (SQLite)
  api/            FastAPI
legado/manus/     entrega original da Manus, preservada para referência
```

## Segurança e procedência

- Nenhum segredo no código: tudo vem do `.env` (fora do git). `NEO4J_PASSWORD` é obrigatória.
- Só continuidade MCU: o corpus recusa documentos de outra continuidade e o leitor descarta blocos de quadrinhos.
- Toda relação no grafo tem evidência literal e fonte; o motor só cita evidências do registro.
