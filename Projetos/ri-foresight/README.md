# RI Foresight

Plataforma de inteligência artificial para **prospectiva geopolítica e Relações Internacionais**: investigar questões internacionais, consultar evidências científicas, analisar atores e relações causais e construir cenários futuros fundamentados em fontes.

> **Estado: Fase 1 (fundação técnica).** Hoje existe apenas a base: API, configuração, banco com pgvector, migrações e um cliente de LLM isolado. Nenhuma funcionalidade de pesquisa ou de cenários foi implementada ainda.

## Escopo da Fase 1

Implementado:

- API FastAPI com `GET /health` (o processo está de pé) e `GET /health/ready` (as dependências estão prontas), com documentação automática.
- Configuração por variáveis de ambiente, validada ao iniciar, sem vazar valores nos erros.
- PostgreSQL 16 com **pgvector** via Docker Compose; SQLAlchemy 2; Alembic com uma migração que habilita a extensão `vector`.
- Cliente da OpenAI isolado, com timeout, tentativas, tradução de erros e substituível nos testes.
- Testes automatizados, linting e formatação (Ruff).

**Fora do escopo** (deliberadamente): ingestão de documentos, embeddings e busca vetorial, RAG, GraphRAG, extração de entidades, agentes, motor de prospectiva, geração de cenários, interface web, autenticação e monitoramento de notícias.

## Arquitetura

```text
ri-foresight/
├── app/
│   ├── main.py              → create_app(): cria a API e registra as rotas
│   ├── core/config.py       → Settings (pydantic-settings) e validação
│   ├── api/routes_health.py → /health e /health/ready
│   ├── db/
│   │   ├── base.py          → Base do SQLAlchemy + convenção de nomes (sem modelos ainda)
│   │   └── session.py       → engine, sessão por requisição, checagens do banco
│   └── llm/client.py        → LLMClient (Protocol) + OpenAIClient + erros próprios
├── migrations/              → Alembic (env.py usa a mesma configuração da API)
│   └── versions/0001_habilitar_pgvector.py
├── tests/                   → unitários (sem rede) e de integração (PostgreSQL real)
├── docker-compose.yml       → PostgreSQL + pgvector (somente desenvolvimento)
├── .env.example · alembic.ini · pyproject.toml · uv.lock
```

### Decisões e justificativas

| Decisão | Por quê |
|---|---|
| `create_app()` + `uvicorn --factory` | Importar o módulo não lê configuração nem abre conexão; os testes criam a aplicação com a configuração que quiserem. |
| `/health` separado de `/health/ready` | Liveness e readiness respondem a perguntas diferentes: a API pode estar de pé com o banco fora do ar. O `/health` nunca consulta dependências. |
| Prontidão = banco acessível **e** pgvector habilitado | `pgvector: missing` indica migração pendente. O LLM aparece só como informativo (`optional`): checá-lo custaria dinheiro e dependeria de serviço externo. |
| Respostas de saúde só com estados curtos | Nenhuma URL, usuário, mensagem de erro ou configuração sai pela API. Os logs registram o *tipo* do erro, nunca o texto (que pode conter a URL do banco). |
| `DATABASE_URL` e `OPENAI_API_KEY` como `SecretStr` | `print`, `repr` e logs mostram `**********`. |
| Banco e chave opcionais na inicialização | A API sobe sem eles e informa o que falta; a chave só é exigida quando o cliente de LLM é criado. |
| Driver psycopg 3, `postgresql://` normalizado para `postgresql+psycopg://` | Um driver moderno e mantido; aceitar a forma curta evita erro de digitação. |
| `LLMClient` como Protocol | O resto do sistema não conhece o SDK. Trocar de provedor ou simular nos testes não exige reescrever consumidores. |
| Chat Completions (e `OPENAI_BASE_URL` opcional) | Interface aceita também por serviços compatíveis; o SDK oficial é usado para timeout e tentativas. |
| Convenção de nomes no `Base.metadata` | Índices e chaves com nomes previsíveis tornam as migrações futuras estáveis. |
| Uma única migração, sem tabelas | A Fase 1 só habilita o `vector`. Modelar tabelas agora seria especulação. |
| Downgrade sem `CASCADE` | Se houver colunas `vector`, o PostgreSQL recusa em vez de apagar dados em silêncio. |

## Pré-requisitos

- [uv](https://docs.astral.sh/uv/) (gerencia o Python 3.12 e as dependências travadas em `uv.lock`)
- Docker com Docker Compose (para o PostgreSQL com pgvector)

## Instalação e configuração

```bash
cd ri-foresight
uv sync                      # instala o Python 3.12 e as dependências do uv.lock
cp .env.example .env         # depois edite o .env
```

Variáveis principais (todas documentadas em `.env.example`):

| Variável | Para quê |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | Usadas pelo Docker Compose para criar o banco. **Troque a senha.** |
| `DATABASE_URL` | Usada pela API e pelo Alembic. A senha deve ser a mesma de `POSTGRES_PASSWORD`. |
| `OPENAI_API_KEY` | Sua chave. Só é necessária para usar o cliente de LLM. |
| `OPENAI_MODEL` | Modelo usado (padrão `gpt-4o-mini`). |
| `OPENAI_TIMEOUT_SECONDS`, `OPENAI_MAX_RETRIES` | Timeout (1 a 300 s) e tentativas (0 a 5). |
| `OPENAI_BASE_URL` | Opcional: serviço compatível com a API da OpenAI. |

O arquivo `.env` está no `.gitignore`. Valores inválidos fazem a API (e as migrações) pararem na inicialização com uma mensagem que cita **o nome** da variável e o motivo, nunca o valor.

## Banco de dados e migrações

```bash
docker compose up -d --wait       # sobe o PostgreSQL + pgvector e espera ficar saudável
uv run alembic upgrade head       # habilita a extensão pgvector
uv run alembic current            # deve mostrar: 0001 (head)
docker compose down               # encerra (os dados ficam no volume)
docker compose down -v            # encerra E APAGA os dados
```

O banco só escuta em `127.0.0.1`. A migração exige que o usuário possa criar extensões (o usuário da imagem é superusuário).

## Executar a API

```bash
uv run uvicorn app.main:create_app --factory --reload
```

- Documentação interativa: <http://127.0.0.1:8000/docs> (esquema em `/openapi.json`)
- `GET /health` → `{"status":"ok"}` (200)
- `GET /health/ready` → 200 `ready` ou 503 `not_ready`:

```json
{"status": "ready", "checks": {"database": "ok", "pgvector": "ok"}, "optional": {"llm": "configured"}}
```

| `checks.database` | Significado |
|---|---|
| `ok` | Conectou e executou `SELECT 1` |
| `unavailable` | Banco fora do ar, credenciais erradas ou timeout |
| `not_configured` | `DATABASE_URL` ausente |

`checks.pgvector` é `ok`, `missing` (rode as migrações) ou `unknown` (banco indisponível).

## Testar a integração com a OpenAI (manual)

Os testes automáticos nunca chamam a OpenAI. Para verificar a integração de verdade, com UMA chamada curta e paga que você mesmo dispara:

```bash
uv run python -m app.llm.client "Responda apenas: ok"
```

## Testes e qualidade

```bash
uv run pytest                       # unitários: sem chave, sem banco, sem internet
uv run ruff check . && uv run ruff format --check .
```

Os testes comuns **bloqueiam qualquer conexão fora da própria máquina**, para garantir que nenhuma chamada externa aconteça. Os testes de integração (`tests/test_db.py`) usam um PostgreSQL real e são ignorados sem `RI_TEST_DATABASE_URL`. **Use um banco de teste**: eles aplicam e desfazem a migração.

```bash
docker compose up -d --wait
docker compose exec db createdb -U ri_foresight ri_foresight_test
RI_TEST_DATABASE_URL="postgresql+psycopg://ri_foresight:SUA_SENHA@localhost:5432/ri_foresight_test" \
  uv run pytest -m integration
```

### Verificações realizadas na Fase 1

- Suíte completa: **64 testes passando** com um PostgreSQL 16.15 + pgvector real; **52 passando e 12 integração ignorados** sem banco. Ruff sem apontamentos.
- A API foi iniciada com `uvicorn` contra o PostgreSQL e os endpoints foram consultados (banco ok/parado, antes e depois da migração).
- Alembic: `upgrade`, repetição do `upgrade`, `downgrade` e `upgrade` de novo, mais o SQL offline.
- **Limitações do ambiente de desenvolvimento:** não havia servidor Docker, então o `docker-compose.yml` foi validado com `docker compose config` e a tag da imagem conferida no Docker Hub, mas **os containers não foram iniciados**. O PostgreSQL de teste foi o do sistema (pgvector 0.6.0, enquanto a imagem do Compose traz 0.8.7). A integração real com a OpenAI **não foi exercitada** (só simulada nos testes).

## Decisões para as próximas fases

Nada abaixo foi implementado; são as decisões que a Fase 2 em diante deve respeitar.

1. **Rastreabilidade**: toda afirmação servida ao usuário precisa chegar ao trecho exato de uma fonte. Planejar `documento` → `versão` → `trecho` (com posição/página e hash do texto), e guardar a procedência (origem, data de ingestão, parser usado).
2. **Metadados**: tipo de fonte (artigo, livro, relatório institucional), autoria, ano, idioma, DOI/URL e licença, em colunas próprias ou JSONB conforme a consulta exigir.
3. **Embeddings**: guardar o **modelo e a dimensão** junto de cada vetor (trocar de modelo exige reindexar). Usar `vector(N)` com um índice (HNSW ou IVFFlat) decidido com dados reais. A busca lexical pode usar `tsvector` do próprio PostgreSQL, mantendo o híbrido em um só banco.
4. **Grafo de conhecimento**: entidades (atores, eventos, conceitos) e **relações com evidências**: cada aresta aponta para os trechos que a sustentam, com confiança e método de extração. Modelar o *tipo* da relação explicitamente (menção, associação, causalidade alegada) e **nunca tratar uma relação extraída como causalidade comprovada**.
5. **Prospectiva**: variáveis, hipóteses e cenários devem referenciar as evidências usadas e separar o que é fato, inferência e suposição.
6. **Execução**: o cliente de LLM é síncrono. Quando houver endpoints que o chamem, avaliar um cliente assíncrono ou execução em segundo plano para não bloquear a API.
7. **Migrações futuras**: usar `Base.metadata` (já com convenção de nomes) e importar os modelos em `migrations/env.py` para o autogenerate.

## Próximos passos

**Fase 2 (ingestão científica):** receber, extrair e normalizar documentos; segmentar em trechos com procedência; primeiras tabelas (`documento`, `trecho`) e migrações correspondentes. Depois: embeddings e RAG híbrido, GraphRAG e o motor de prospectiva.
