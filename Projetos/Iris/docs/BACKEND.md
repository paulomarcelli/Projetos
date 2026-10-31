# Projeto Iris

Plataforma de inteligência artificial para **prospectiva geopolítica e Relações Internacionais**: investigar questões internacionais, consultar evidências científicas, analisar atores e relações causais e construir cenários futuros fundamentados em fontes.

> **Estado: Fase 2 (ingestão de documentos científicos) + interface.** A API recebe PDFs, valida, guarda, extrai o texto página por página e registra os metadados bibliográficos com a origem de cada um. A interface web (`frontend/`) traz a identidade visual, o painel inicial e as telas de documentos ligadas à API. Ainda **não** há embeddings, busca, RAG, grafo, agentes nem geração de cenários.

> ⚠️ **Sem autenticação.** Os endpoints `/documents` não têm login nem controle de acesso: quem alcançar a API pode enviar, ler e apagar documentos. Use apenas em ambiente de desenvolvimento controlado (a API escuta em `127.0.0.1` por padrão). Veja [Limites de segurança](#limites-de-segurança-antes-de-qualquer-exposição-pública).

## Escopo

### Fase 1: fundação técnica (concluída)

- API FastAPI com `GET /health` e `GET /health/ready`, com documentação automática.
- Configuração por variáveis de ambiente, validada ao iniciar, sem vazar valores nos erros.
- PostgreSQL 16 com **pgvector** via Docker Compose; SQLAlchemy 2; Alembic.
- Cliente da OpenAI isolado, com timeout, tentativas e tradução de erros.

### Fase 2: ingestão e processamento de PDFs científicos

**Objetivo:** transformar PDFs científicos em texto confiável e rastreável (documento → página), com metadados auditáveis, para que a Fase 3 possa construir a busca sobre essa base.

Implementado:

- **Upload** validado: extensão `.pdf`, tipo declarado `application/pdf`, assinatura real `%PDF-` no início do arquivo, estrutura legível pelo leitor de PDF, limite de tamanho e de páginas. Recusa arquivos vazios, corrompidos, protegidos por senha e de outro tipo.
- **Streaming**: o arquivo é copiado em blocos de 1 MB (calculando SHA-256 e tamanho ao mesmo tempo), nunca inteiro na memória. Corpos acima do limite são cortados pelo `Content-Length` ou assim que passam do limite.
- **Armazenamento** em diretório persistente configurável. O arquivo é salvo como `<id[:2]>/<id>.pdf` (UUID gerado); o nome enviado nunca vira caminho.
- **Extração por página** (pypdf), preservando número da página e acentos (pt/en/es). Páginas e documentos sem texto extraível são sinalizados; falhas de extração ficam registradas.
- **Normalização conservadora**, versionada, guardada junto com o texto bruto.
- **Metadados** do usuário (no upload), do PDF (XMP, dicionário Info, catálogo) e de uma heurística de idioma; cada campo registra a sua fonte. Desconhecido fica `null`. Funciona offline.
- **Deduplicação** por SHA-256 com restrição única no banco, segura com uploads simultâneos.
- **Estados** `pending → processing → completed | failed`, com transições validadas no código e restrições no banco.
- **Remoção consistente** de registro, páginas e arquivo.
- Migração incremental `0002` (só cria tabelas; não mexe no pgvector nem em dados existentes).

**Fora do escopo** (deliberadamente): embeddings, busca vetorial ou lexical, RAG, reranking, GraphRAG, extração de entidades, agentes, motor de prospectiva, interface web, monitoramento de notícias, OCR e autenticação.

## Arquitetura

```text
projeto-iris/
├── app/
│   ├── main.py                  → create_app(): rotas, limite de upload, tratadores de erro
│   ├── core/config.py           → Settings (pydantic-settings) e validação
│   ├── api/
│   │   ├── routes_health.py     → /health e /health/ready
│   │   ├── routes_documents.py  → /documents (upload, listagem, detalhe, páginas, remoção)
│   │   └── upload_limit.py      → middleware ASGI: 413 antes de ler corpos grandes demais
│   ├── db/
│   │   ├── base.py              → Base do SQLAlchemy + convenção de nomes
│   │   ├── models.py            → Document, DocumentPage, estados e transições
│   │   └── session.py           → engine, sessão por requisição, checagens do banco
│   ├── documents/
│   │   ├── validation.py        → nome, tipo, assinatura, tamanho, estrutura do PDF
│   │   ├── storage.py           → disco: temporário → definitivo, lixeira reversível
│   │   ├── extraction.py        → texto por página (pypdf, sem OCR)
│   │   ├── normalization.py     → normalização conservadora (versão "1")
│   │   ├── metadata.py          → metadados embutidos, idioma, combinação com o usuário
│   │   ├── processing.py        → pending → processing → completed | failed (só recebe o ID)
│   │   ├── service.py           → casos de uso (upload, listar, obter, páginas, remover)
│   │   ├── schemas.py           → entrada e saída da API (sem caminhos internos)
│   │   └── errors.py            → códigos de erro e mensagens públicas fixas
│   └── llm/client.py            → LLMClient (Protocol) + OpenAIClient
├── migrations/versions/
│   ├── 0001_habilitar_pgvector.py
│   └── 0002_documentos.py       → tabelas documents e document_pages
├── tests/                       → unitários, API sem banco e integração com PostgreSQL real
│   └── pdfs.py                  → gera PDFs pequenos nos próprios testes
└── docker-compose.yml · .env.example · alembic.ini · pyproject.toml · uv.lock
```

### Fluxo do upload

```text
POST /documents/upload
  1. middleware: Content-Length/bytes acima do limite → 413 (nada é gravado)
  2. metadados informados válidos?                    → senão 422
  3. nome .pdf + tipo application/pdf?                → senão 415
  4. cópia em streaming p/ STORAGE_DIR/.tmp: vazio 400, grande 413, sem %PDF 415
  5. pypdf abre a estrutura? senha? páginas demais?   → senão 422
  6. SHA-256 já existe?                               → 200 com o documento existente
  7. INSERT (pending) → arquivo para <id[:2]>/<id>.pdf → COMMIT
     (restrição única violada por upload simultâneo → 200 com o existente)
  8. processing (COMMIT) → extração + metadados + páginas + completed (COMMIT ÚNICO)
     qualquer falha → ROLLBACK → failed + código de erro (COMMIT)
  → 201 com o documento (status completed ou failed)
```

### Decisões e justificativas

| Decisão | Por quê |
|---|---|
| **pypdf** para extrair texto | Python puro (licença BSD), sem binários nativos nem serviços externos, mantido ativamente. Lê só estrutura e texto: **não executa JavaScript**, formulários ou anexos embutidos. A qualidade da extração é inferior à de motores como o PDFium em layouts complexos (colunas, tabelas); trocar de extrator é isolado em `extraction.py`, e cada página registra o extrator e a versão. |
| **python-multipart** | Exigido pelo FastAPI para receber `multipart/form-data` (upload de arquivo). |
| Validação **antes** do banco | Recusas não abrem conexão nem transação; testes de recusa rodam sem banco. |
| Assinatura `%PDF-` no byte 0 | Mais restrito que alguns leitores (que toleram lixo antes do cabeçalho), em troca de não aceitar arquivos disfarçados. |
| Arquivo em disco, nunca no banco | Mantém o banco leve e os backups separáveis. O banco guarda só a chave relativa, que nunca sai pela API. |
| Nome do arquivo em disco = UUID | Path traversal impossível por construção; a chave ainda é validada por regex e resolvida dentro da raiz. O nome original (sanitizado) fica só como metadado de exibição. |
| Arquivo por documento (não por hash) | Dois uploads simultâneos do mesmo PDF não disputam o mesmo arquivo; o perdedor da corrida apaga só o seu temporário. |
| Restrição única em `sha256` | A checagem prévia evita trabalho, mas quem garante a ausência de duplicatas é o banco. Um `IntegrityError` no INSERT devolve o documento que venceu. |
| Commit único para páginas + `completed` | Não existe documento `completed` sem as suas páginas. O banco ainda recusa `completed` sem `page_count`/`processed_at` e `failed` sem `error_code`. |
| `processing` gravado antes do trabalho | Se o processo morrer no meio, o documento fica em `processing` (honesto), nunca em `completed`. |
| Remoção: lixeira → commit → apagar | Se o commit falhar, o arquivo volta para o lugar; se o disco falhar, o registro não é apagado. |
| Processamento síncrono, mas isolado | `processar_documento(sessao, armazenamento, id)` não depende do HTTP. Pode ir para uma fila/worker depois sem mudar a regra. Sem Redis nem Celery nesta fase. A rota é `def` (roda em thread), então a extração não trava o servidor. |
| PDF sem texto = `completed` com `text_extractable=false` | O processamento funcionou; o PDF é que não tem camada de texto (escaneado). O aviso `no_extractable_text` deixa isso explícito para as fases seguintes filtrarem. |
| Texto bruto **e** normalizado por página | A normalização pode mudar de versão; o bruto permite refazê-la sem reprocessar o PDF. `text_sha256` permite conferir integridade. |
| Erros com código estável e mensagem fixa | Nenhuma resposta copia texto de exceção: não há como vazar caminho, URL do banco ou stack trace. |

## Interface web

![Projeto Iris](../frontend/docs/capturas/landing-desktop.png)

O frontend fica em [`frontend/`](../frontend/README.md) e usa React, Vite, TypeScript e Tailwind CSS 4. Ele
conversa com esta API por proxy em desenvolvimento, sem exigir mudanças no backend. Direção de
design, o que é real e o que ainda é estado vazio, e como rodar: veja o
[README do frontend](../frontend/README.md).

```bash
uv run uvicorn app.main:create_app --factory    # API em :8000
cd frontend && npm install && npm run dev       # interface em :5173 (landing em /, plataforma em /app)
```

## Pré-requisitos

- [uv](https://docs.astral.sh/uv/) (gerencia o Python 3.12 e as dependências travadas em `uv.lock`)
- Docker com Docker Compose (para o PostgreSQL com pgvector)
- Node.js 22+ e npm (só para a interface web)

## Instalação e configuração

```bash
cd projeto-iris
uv sync                      # instala o Python 3.12 e as dependências do uv.lock
cp .env.example .env         # depois edite o .env
```

Variáveis (todas documentadas em `.env.example`):

| Variável | Para quê |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Usadas pelo Docker Compose para criar o banco. **Troque a senha.** |
| `DATABASE_URL` | Usada pela API e pelo Alembic. A senha deve ser a mesma de `POSTGRES_PASSWORD`. |
| `STORAGE_DIR` | Diretório persistente dos PDFs (padrão `data/documents`, relativo à pasta onde a API inicia; `data/` está no `.gitignore`). |
| `MAX_UPLOAD_MB` | Tamanho máximo de cada PDF (padrão 50, de 1 a 1024). |
| `MAX_PDF_PAGES` | Páginas máximas por PDF (padrão 2000). |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`, `OPENAI_TIMEOUT_SECONDS`, `OPENAI_MAX_RETRIES` | Cliente de LLM (não usado pela ingestão). |

Valores inválidos fazem a API (e as migrações) pararem na inicialização com uma mensagem que cita **o nome** da variável e o motivo, nunca o valor.

### Armazenamento

```text
STORAGE_DIR/
├── 3f/3f2a…c9.pdf     → um arquivo por documento, nomeado pelo UUID
├── .tmp/              → uploads em andamento (apagados ao terminar ou ao falhar)
└── .trash/            → arquivos em remoção (apagados logo após o commit)
```

As pastas são criadas com permissão só do dono (`0700`). Faça backup de `STORAGE_DIR` **junto** com o banco: um sem o outro fica inconsistente.

## Banco de dados e migrações

```bash
docker compose up -d --wait       # sobe o PostgreSQL + pgvector
uv run alembic upgrade head       # 0001 (pgvector) e 0002 (documentos)
uv run alembic current            # deve mostrar: 0002 (head)
```

A `0002` é **incremental**: só cria `documents` e `document_pages` (e seus índices). Não recria o banco, não remove o pgvector e não altera dados existentes. Um banco já na `0001` só ganha as tabelas novas.

> O `downgrade` da `0002` **apaga as duas tabelas e todo o seu conteúdo** (os arquivos em disco ficam). Só rode `uv run alembic downgrade 0001` de propósito.

Tabelas:

- **`documents`**: `id` (UUID), `sha256` (único), `original_filename`, `size_bytes`, `mime_type`, `storage_key` (interno), `status`, metadados (`title`, `authors`, `publication_year`, `journal`, `publisher`, `institution`, `doi`, `source_url`, `language`), `metadata_sources`, `pdf_metadata`, `page_count`, `text_extractable`, `warnings`, `error_code`, `error_message`, `created_at`, `updated_at`, `processed_at`.
- **`document_pages`**: `document_id` (FK com `ON DELETE CASCADE`), `page_number` (único por documento), `text`, `text_raw`, `char_count`, `has_text`, `extraction_status` (`ok`, `empty`, `error`), `extraction_error`, e auditoria: `text_sha256`, `extractor`, `normalization_version`, `extracted_at`.

## Executar a API

```bash
uv run uvicorn app.main:create_app --factory --reload
```

Documentação interativa em <http://127.0.0.1:8000/docs>.

### Endpoints de documentos

| Método e caminho | Faz | Respostas |
|---|---|---|
| `POST /documents/upload` | Envia um PDF (campo `file`) e metadados opcionais | 201 novo · 200 já existia · 400 · 413 · 415 · 422 · 503 |
| `GET /documents?limit=20&offset=0&status=completed` | Lista (mais recentes primeiro; `limit` 1–100) | 200 · 422 |
| `GET /documents/{id}` | Detalhes e metadados | 200 · 404 |
| `GET /documents/{id}/pages?limit=20&offset=0&include_raw=false` | Texto por página | 200 · 404 |
| `DELETE /documents/{id}` | Remove registro, páginas e arquivo | 204 · 404 · 409 (em processamento) · 503 |

Campos opcionais do upload: `title`, `authors` (separados por `;`), `publication_year`, `journal`, `publisher`, `institution`, `doi`, `source_url` (`http`/`https`), `language` (`pt`, `en`, `es`, `pt-BR`...). O que for informado tem prioridade sobre o que vem do PDF.

**Enviar** (exemplo real, executado nesta fase):

```bash
curl -F "file=@artigo.pdf;type=application/pdf" \
     -F "title=Exemplo de artigo" -F "publication_year=2024" \
     http://127.0.0.1:8000/documents/upload
```

```json
{
  "id": "1295fd37-b0d6-4377-9510-851dc6d697f9",
  "status": "completed",
  "original_filename": "exemplo.pdf",
  "size_bytes": 1318,
  "sha256": "9ad3b8bc7d999e260f8daef016896aabce7c21a84859597208f08c882f494ba1",
  "page_count": 3,
  "text_extractable": true,
  "title": "Exemplo de artigo",
  "authors": ["Silva, Ana", "Pérez, José"],
  "publication_year": 2024,
  "language": null,
  "journal": null, "publisher": null, "institution": null, "doi": null, "source_url": null,
  "metadata_sources": {"title": "user", "authors": "pdf_info", "publication_year": "user"},
  "pdf_metadata": {"/Author": "Silva, Ana; Pérez, José"},
  "warnings": ["pages_without_text: 2"],
  "error": null,
  "duplicate": false,
  "created_at": "2026-10-27T03:20:55.336591Z",
  "updated_at": "2026-10-27T03:20:55.358236Z",
  "processed_at": "2026-10-27T03:20:55.356898Z",
  "mime_type": "application/pdf"
}
```

Enviar o mesmo arquivo de novo devolve **200** com o mesmo `id` e `"duplicate": true` (nada novo é gravado).

**Páginas:**

```bash
curl "http://127.0.0.1:8000/documents/1295fd37-b0d6-4377-9510-851dc6d697f9/pages?limit=2"
```

```json
{
  "items": [
    {"page_number": 1, "text": "Relações Internacionais: introdução", "text_raw": null,
     "char_count": 35, "has_text": true, "extraction_status": "ok", "extraction_error": null,
     "text_sha256": "3e8b08ab…41cc", "extractor": "pypdf 6.21.2",
     "normalization_version": "1", "extracted_at": "2026-10-27T03:20:55.356898Z"},
    {"page_number": 2, "text": "", "text_raw": null, "char_count": 0, "has_text": false,
     "extraction_status": "empty", "extraction_error": null, "text_sha256": null,
     "extractor": "pypdf 6.21.2", "normalization_version": "1",
     "extracted_at": "2026-10-27T03:20:55.356898Z"}
  ],
  "total": 3, "limit": 2, "offset": 0
}
```

**Remover:** `curl -X DELETE http://127.0.0.1:8000/documents/<id>` → `204`.

**Erros** têm sempre o formato `{"detail": "<mensagem>", "code": "<código>"}`, por exemplo:

```json
{"detail": "Só são aceitos arquivos com extensão .pdf.", "code": "unsupported_extension"}
```

| HTTP | `code` |
|---|---|
| 400 | `empty_file` |
| 404 | `not_found` |
| 409 | `document_processing` |
| 413 | `file_too_large` |
| 415 | `unsupported_extension`, `unsupported_media_type`, `invalid_signature` |
| 422 | `corrupted_pdf`, `encrypted_pdf`, `too_many_pages`, `invalid_metadata` |
| 500 | `internal_error` |
| 503 | `database_not_configured`, `database_unavailable`, `storage_unavailable` |

Um documento que falha no processamento é criado com `status: "failed"` e `error.code` entre `file_missing`, `pdf_unreadable`, `extraction_failed` e `processing_error`.

### Normalização do texto (versão "1")

Conservadora: **não resume, não traduz, não corrige e não interpreta**. Faz apenas: quebras de linha unificadas; Unicode NFC (acento combinado vira o caractere acentuado; NFKC não é usado para não alterar `²` ou `½`); ligaduras `ﬁ`/`ﬂ`... viram letras separadas; espaços especiais viram espaço comum; remove controles, hífen suave e caracteres invisíveis; junta espaços repetidos e deixa no máximo uma linha em branco seguida. **Não junta palavras hifenizadas** no fim da linha (o hífen pode ser parte da palavra). O texto bruto fica guardado em `text_raw`.

### Metadados: quando ficam nulos

| Campo | Fontes (em ordem) |
|---|---|
| `title` | usuário → XMP `dc:title` → Info `/Title` (ignora títulos de programa, como "Microsoft Word - x.docx") |
| `authors` | usuário → XMP `dc:creator` → Info `/Author` (separa só por `;`, pois vírgula pode ser "Sobrenome, Nome") |
| `publication_year` | usuário → XMP `prism:publicationDate`/`coverDate`. A data de criação do arquivo **não** é usada. |
| `journal` | usuário → XMP `prism:publicationName` |
| `publisher` | usuário → XMP `dc:publisher` |
| `doi` | usuário → XMP `prism:doi`/`dc:identifier` → Info `/doi` (só com formato `10.xxxx/...`). DOIs achados no corpo do texto **não** são usados: podem ser de artigos citados. |
| `institution`, `source_url` | só usuário |
| `language` | usuário → XMP `dc:language` → catálogo `/Lang` → contagem de palavras funcionais pt/en/es, com mínimo de 40 palavras e vantagem de 3× sobre o segundo idioma; senão `null` |

`metadata_sources` registra a fonte de cada campo preenchido (`user`, `xmp`, `pdf_info`, `pdf_catalog`, `heuristic`).

## Testes e qualidade

```bash
uv run pytest                       # sem banco: unitários + recusas da API
uv run ruff check . && uv run ruff format --check .
```

Com o PostgreSQL (use um **banco de teste**: as migrações são aplicadas e desfeitas e as tabelas de documentos são esvaziadas):

```bash
docker compose up -d --wait
docker compose exec db createdb -U iris iris_test
IRIS_TEST_DATABASE_URL="postgresql+psycopg://iris:SUA_SENHA@localhost:5432/iris_test" \
  uv run pytest
```

Os testes geram os próprios PDFs (`tests/pdfs.py`), não baixam nada, não usam chaves e **bloqueiam qualquer conexão fora da máquina**.

| Arquivo | Cobre |
|---|---|
| `test_documents_unit.py` | normalização, acentos, nomes maliciosos, extensão/tipo/assinatura, vazio, corrompido, senha, limite de páginas, extração por página, falha de página, metadados, DOI, idioma, transições de estado, chaves de disco |
| `test_documents_api.py` | recusas pela API sem banco (415/400/413/422), corpo grande cortado pelo middleware, metadados inválidos, banco fora do ar, nenhum vazamento de caminho |
| `test_documents_db.py` | upload válido, texto por página, acentos, PDF sem texto, metadados persistidos e nulos, duplicata (sequencial, corrida simulada e 4 threads simultâneas), listagem e paginação, 404, remoção consistente e com falhas, falhas de processamento, integridade quando o disco ou o commit falham, nomes maliciosos, migração = modelos, pgvector intacto |

### Verificações realizadas

- **Fase 2:** 189 testes passando com PostgreSQL 16 + pgvector real; 145 passando e 44 ignorados (integração) sem banco. Ruff sem apontamentos. A API foi iniciada com `uvicorn` e os cinco endpoints exercitados com `curl` (exemplos acima). Teste de mutação manual: 13 defeitos introduzidos de propósito; 11 detectados de imediato, 1 lacuna corrigida com um teste novo e 1 equivalente (não muda o comportamento).
- **Fase 1:** endpoints de saúde, migração `0001` (upgrade, repetição, downgrade) e SQL offline.
- **Limitações do ambiente:** não havia servidor Docker, então os containers do `docker-compose.yml` não foram iniciados; o PostgreSQL de teste foi o do sistema (pgvector 0.6.0; a imagem do Compose traz 0.8.7). Os testes usaram PDFs sintéticos pequenos; **não houve teste com um corpus de artigos reais**.

## Limitações conhecidas

- **PDFs escaneados não têm texto:** sem OCR nesta fase. Páginas só com imagem ficam `empty` e o documento fica com `text_extractable=false`. OCR (por exemplo, Tesseract) é trabalho futuro.
- **Qualidade da extração:** colunas, tabelas, notas de rodapé, fórmulas e cabeçalhos repetidos saem como o pypdf os lê, sem reconstrução de layout. Ordem de leitura em duas colunas pode se misturar.
- **Hifenização** no fim da linha é preservada (por decisão).
- **Metadados embutidos** costumam faltar ou estar errados em PDFs reais; o sistema prefere `null` a adivinhar. Não há consulta a Crossref/OpenAlex (seria online).
- **Idioma** só é detectado para pt, en e es.
- **Sem limite de tempo por PDF:** um PDF malicioso pode deixar a extração lenta (o pypdf limita descompressão, e `MAX_PDF_PAGES` limita o tamanho, mas não há timeout).
- **Sem reprocessamento** pela API. Um documento que ficou em `processing` porque o processo morreu não é recuperado automaticamente (e não pode ser removido enquanto estiver nesse estado; corrija no banco).
- Se o processo morrer entre gravar o arquivo e confirmar o registro, pode sobrar um arquivo órfão em `STORAGE_DIR` (nunca um registro sem arquivo).
- PDFs protegidos por senha são recusados (só os sem senha de abertura são lidos).

## Limites de segurança antes de qualquer exposição pública

Esta fase é para **desenvolvimento local**. Antes de expor a API:

1. **Autenticação e autorização** (hoje qualquer cliente envia, lê e apaga).
2. **Limite de requisições** e de uploads por usuário; cota de disco.
3. **Varredura de malware** dos arquivos recebidos (ex.: ClamAV) e isolamento do processo de extração (container sem rede, limites de CPU, memória e tempo).
4. **Timeout** por documento e processamento fora da requisição (fila/worker).
5. **TLS** e proxy reverso com limite de corpo também na borda.
6. Revisar o que `pdf_metadata` e `original_filename` exibem (vêm do arquivo enviado).
7. Política de retenção e remoção de dados, e backup coerente de banco + `STORAGE_DIR`.

## Próximos passos (Fase 3: RAG híbrido)

1. **Segmentação** das páginas em trechos (chunks) com posição exata (documento, página, deslocamento), hash e versão do segmentador, preservando a rastreabilidade até a página.
2. **Embeddings** guardados com **modelo e dimensão**; coluna `vector(N)` e índice (HNSW ou IVFFlat) escolhido com dados reais.
3. **Busca lexical** com `tsvector` do PostgreSQL (configurações por idioma: `portuguese`, `english`, `spanish`), combinada à vetorial (RAG híbrido) e, depois, reranking.
4. Usar só documentos `completed` com `text_extractable=true`; respostas sempre citando documento e página.
5. Avaliar OCR para PDFs escaneados e um extrator com reconstrução de layout para artigos em duas colunas.
6. Mover o processamento para uma fila/worker, com reprocessamento e recuperação de documentos presos em `processing`.

Depois: GraphRAG, extração de entidades e o motor de prospectiva, respeitando as decisões abaixo.

## Decisões para as próximas fases

1. **Rastreabilidade**: toda afirmação servida ao usuário precisa chegar ao trecho exato de uma fonte (documento → página → trecho), com procedência (origem, data de ingestão, extrator e versões).
2. **Embeddings**: trocar de modelo exige reindexar; por isso modelo e dimensão ficam junto de cada vetor.
3. **Grafo de conhecimento**: entidades e **relações com evidências**; cada aresta aponta para os trechos que a sustentam, com confiança e método de extração. **Nunca tratar uma relação extraída como causalidade comprovada.**
4. **Prospectiva**: variáveis, hipóteses e cenários devem referenciar as evidências usadas e separar fato, inferência e suposição.
5. **Execução**: o cliente de LLM é síncrono; endpoints que o chamem devem rodar em segundo plano.

## Testar a integração com a OpenAI (manual)

Os testes automáticos nunca chamam a OpenAI. Para verificar a integração de verdade, com UMA chamada curta e paga que você mesmo dispara:

```bash
uv run python -m app.llm.client "Responda apenas: ok"
```
