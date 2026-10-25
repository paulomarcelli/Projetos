# ATLAS — Geopolitical Simulation Engine

Demonstração acadêmica (FECAP) de um motor de **simulação geopolítica condicional**. O usuário escolhe um caso, ajusta variáveis de contexto, horizonte e premissas; três agentes de IA pesquisam, analisam e revisam, enquanto um **motor determinístico** calcula os índices. O resultado separa sempre **fatos verificados, interpretações, premissas, hipóteses e incertezas**.

> **Análise condicional, não previsão.** O ATLAS mostra o que pode acontecer *se* as premissas escolhidas valerem. Ele não é uma ferramenta de previsão científica validada, e os índices não são probabilidades.

## Funcionalidades

- **Fluxo completo:** escolher o caso → configurar variáveis, horizonte e premissas → acompanhar os agentes ao vivo → ver o resultado → revisar premissas e comparar.
- **5 casos prontos** (tarifas EUA–China, sanções à Rússia, Estreito de Taiwan, exportação de semicondutores, Mercosul–UE) e um **caso personalizado** descrito livremente.
- **Resultado:** resumo executivo com a natureza de cada afirmação; três cenários (continuidade, escalada, desescalada) com gatilhos e indicadores; impactos econômicos, diplomáticos e estratégicos (gráfico e tabela); atores (mapa-múndi e análise de interesses, incentivos, capacidades e restrições); matriz 3×3 de riscos e oportunidades; fontes e evidências rastreáveis; premissas, condições, incertezas e limitações; relatório do Verifier por rodada; índices do motor com a fórmula.
- **Comparação** entre duas simulações (variáveis, premissas, índices e conclusões que mudaram), com aviso de que comparar não demonstra causalidade.
- **Histórico** persistente em SQLite, com busca, filtro e exclusão confirmada na própria tela.
- **Modo demonstrativo** claramente identificado, que funciona sem nenhuma credencial.

## Arquitetura

```
frontend (React + TS + Vite + Tailwind)  ──/api──▶  backend (FastAPI)
  Painel · Nova simulação · Execução             ├─ motor.py         índices determinísticos e comparação
  Resultado · Comparar · Histórico               ├─ orquestrador.py  Researcher → Analyst → Verifier (+ revisões)
  Configurações                                  ├─ agentes/         os três agentes e o contexto (orçamento + cache)
                                                 ├─ provedores/      GeminiLLM | DemoLLM · TavilyBusca | DemoBusca
                                                 ├─ persistencia.py  SQLite: simulações, eventos, cache, uso diário
                                                 └─ seguranca.py     limpeza e delimitação de conteúdo da web
```

A simulação roda em segundo plano. Cada etapa grava **eventos** no banco, e a tela de execução consulta `GET /api/simulacoes/{id}/eventos?desde=N`, de modo que o progresso exibido é real. Todas as saídas entre agentes são validadas pelos contratos Pydantic (`atlas/modelos.py`) antes de seguir adiante.

### Agentes e orquestração

| Agente | Papel | Proteções |
|---|---|---|
| **Researcher** | Busca na web (Tavily), deduplica fontes (F1, F2…) e extrai evidências (E1, E2…) com status confirmado, alegado ou incerto, além da relação com as hipóteses. | Evidência que cita fonte inexistente ou nenhuma fonte é descartada. Falha de busca vira lacuna registrada, nunca conteúdo inventado. |
| **Analyst** | Atores, três cenários, impactos com mecanismo causal, matriz de riscos, relações e confiança. | Recebe evidências, índices e premissas de forma estruturada. Saída fora do contrato é rejeitada. |
| **Verifier** | Regras determinísticas mais revisão por IA. | Bloqueia "fato" sem evidência confirmada, citações inexistentes, probabilidades numéricas sem metodologia, cenários faltando, incoerência com o motor e atores fora do caso. |

O **orquestrador** devolve o trabalho ao Analyst (ou ao Researcher, com novas consultas) quando há problemas críticos, no máximo `ATLAS_MAX_REVISOES` vezes. Se os problemas persistirem, a simulação termina como **parcial**, com os pontos listados. Erros externos (cota, chave, timeout) preservam o que já foi obtido.

### Motor determinístico (em código, testado)

- `n_i = (valor − mín)/(máx − mín)`
- `g_i = n_i` se a variável empurra para a escalada; `1 − n_i` se ela contém a crise
- Índice da dimensão = `100·Σ(w·g)/Σw · f_h`, com fator de horizonte `f_h = 0,85 + 0,30·min(h,24)/24`
- Propensão de escalada = `100·Σ(|e|·g)/Σ|e|`
- Faixas: abaixo de 34 é baixo; abaixo de 67, moderado; acima disso, alto

Os pesos estão explícitos em `atlas/casos.py`. São escolhas de modelagem, não calibradas com dados históricos.

## Integrações

- **Google Gemini** (REST `generateContent`, saída JSON). A chave vai no header `x-goog-api-key`, só no servidor.
- **Tavily** (`POST /search`), atrás da interface `ProvedorBusca`, o que permite trocar de provedor implementando `buscar()`.
- **Cache** de buscas e de prompts idênticos (`ATLAS_CACHE_HORAS`).
- **Limites:**
  - por simulação: chamadas de IA e buscas;
  - por dia: simulações com IA;
  - por IP: 6 simulações/min;
  - corpo da requisição: 64 KB.
- **Erros tratados:** timeout, retentativa só para erros temporários, e diferenciação entre cota por minuto e cota diária (HTTP 429 do Gemini; 432/433 da Tavily). Cada um gera uma mensagem clara para o usuário.

Resultados da web são tratados como **dados não confiáveis**. Eles entram nos prompts dentro de `<dados_nao_confiaveis>` com as tags neutralizadas, e os prompts de sistema proíbem seguir instruções vindas desse conteúdo.

## Como executar

Pré-requisitos: Python 3.11+ e Node 20+.

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env        # opcional: preencha as chaves; sem elas, modo demonstrativo
uvicorn atlas.main:app --port 8000

# frontend (outro terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173 (a rota /api usa proxy para :8000)
```

Testes:

```bash
cd backend && pytest -q          # motor, segurança, provedores (HTTP simulado), agentes, orquestrador, API
cd frontend && npm test          # lógica e telas (Vitest + Testing Library)
cd frontend && npm run build     # checagem de tipos + build de produção
```

## Variáveis de ambiente

Todas ficam em `backend/.env` (veja `backend/.env.example`). O frontend nunca recebe chaves; a tela de Configurações mostra apenas se cada uma está configurada.

| Variável | Padrão | Uso |
|---|---|---|
| `GEMINI_API_KEY` | — | Ativa a IA real. Sem ela, a IA fica em modo demonstrativo. |
| `ATLAS_GEMINI_MODEL` | `gemini-3.6-flash` | Modelo do Gemini. Confira no Google AI Studio se ele está no plano gratuito do seu projeto. |
| `TAVILY_API_KEY` | — | Ativa a pesquisa na web. |
| `ATLAS_MODO` | `auto` | `demo` força o modo demonstrativo. |
| `ATLAS_DB` | `backend/atlas.db` | Arquivo SQLite. |
| `ATLAS_MAX_REVISOES` | 2 | Ciclos Verifier → Analyst. |
| `ATLAS_MAX_BUSCAS` / `ATLAS_RESULTADOS_POR_BUSCA` | 4 / 4 | Orçamento de pesquisa por simulação. |
| `ATLAS_MAX_CHAMADAS_LLM` | 8 | Teto de chamadas de IA por simulação. |
| `ATLAS_MAX_SIMULACOES_DIA` | 40 | Teto diário de simulações com IA. |
| `ATLAS_TIMEOUT_S` / `ATLAS_TENTATIVAS_API` | 45 / 2 | Timeout e retentativas. |
| `ATLAS_CACHE_HORAS` | 24 | Validade do cache. |
| `ATLAS_CORS` | localhost:5173 | Origens permitidas. |

O ATLAS não contrata planos pagos. No plano gratuito do Gemini, o Google pode usar entradas e saídas para melhorar os modelos, então não envie dados sensíveis.

## Roteiro para a apresentação acadêmica

1. **Modo demonstrativo:** rode "Escalada tarifária EUA–China" com tarifa alta e retaliação alta, 18 meses. Mostre os agentes ao vivo, a separação por natureza e a matriz de riscos.
2. **Revisar premissas:** reduza tarifa e retaliação e aumente o engajamento diplomático. Depois use **Comparar** e mostre como a propensão de escalada e as plausibilidades mudam, e o aviso de que isso não é causalidade.
3. **Com as chaves configuradas:** rode "Estreito de Taiwan" e abra **Fontes e evidências**. Cada fato aponta para uma evidência confirmada, que aponta para uma fonte com URL e data de consulta.
4. **Transparência:** abra **Motor determinístico** para mostrar a fórmula e as contribuições por variável, e **Verificação** para mostrar as rodadas.

## Limitações

- Os pesos do motor não são calibrados empiricamente, e não há interações não lineares nem choques exógenos.
- A qualidade das evidências depende dos trechos devolvidos pela busca: o ATLAS não lê o artigo completo.
- O Verifier por IA pode deixar passar erros sutis; as regras determinísticas cobrem apenas padrões verificáveis.
- O limitador de taxa fica em memória (um processo). Não há autenticação de usuários.
- O caso personalizado usa variáveis genéricas e não tem atores no mapa.

## Melhorias futuras

- Leitura do texto completo das fontes, com memória de evidências entre simulações (por exemplo, um índice LightRAG).
- Calibração dos pesos com séries históricas e análise de sensibilidade automática.
- Streaming de eventos via SSE, autenticação e limitador distribuído.
- Exportação do resultado em PDF e mais casos no catálogo.
