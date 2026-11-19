# HELA Fase 4 (Integração) · plano de implementação

> **Para quem executa:** `superpowers` (executing-plans + test-driven-development + verification-before-completion).
> Cada tarefa: teste que falha → código mínimo → teste passa. Commit e push a cada bloco, só com os caminhos da tarefa.

**Objetivo:** ligar a HELA ao Claude Code pelos mecanismos oficiais: Skill, servidor MCP (8 ferramentas) e os 6
hooks, com o caminho do `UserPromptSubmit` abaixo de 300 ms (revisão F3-A2) e a origem decidida pela porta (F3-A4).

**Especificação:** `docs/prompt-mestre.md` (Parte A, seção 9), `docs/referencia-claude-code.md` (fatos dos hooks, MCP
e transcript), `docs/seguranca.md` (A1, A2, A3, A6, A7), `docs/revisoes/2026-11-19-fase3.md` (F3-A2, F3-A4, F3-M2,
F3-B2), `docs/api.md`.

## Restrições globais

- A suíte continua passando: `.venv/bin/pytest -W error` (437 no começo).
- O caminho do hook (`hela.integration.hooks` até o fim do `UserPromptSubmit`) não importa `pydantic`, `networkx` nem
  `hela.core.engine` (teste por subprocesso). O `Engine` só entra, com import tardio, no `Stop`.
- Os hooks nunca saem com código diferente de 0, nunca escrevem no stdout além de um único JSON, e o `Stop` nunca
  imprime nada.
- Nunca guardar `content`, `originalFile`, `base64` nem o conteúdo de arquivo de `Read`, `Write` e `Edit`.
- Testes com `HOME` e `HELA_HOME` temporários; chaves falsas montadas em tempo de execução.
- Nenhum instalador nesta fase: nada é escrito no `~/.claude` real.

## Bloco 1 · F3-A2 (critério de pronto) e migração 3

1. **Migração 3:** `meta.vectors_version` sobe por gatilho em `DELETE` e em `UPDATE OF embedding, embedding_model` de
   `memories` (inserção é seguida pelo maior `rid`); `procedures.approved_language`; tabela `transcript_cursors`.
2. **Funções puras fora dos módulos pesados:** `hela/memory/fusion.py` (RRF, ordenação, recência) e
   `hela/core/relevance.py` (`query_terms`, `coverage`); a busca e o Router passam a importar de lá.
3. **`hela/memory/vector_cache.py`:** vetores num `.npy` em `HELA_HOME/cache/`, aberto com `mmap`; reconstrói quando o
   contador muda; acrescenta só as linhas novas (maior `rid`) sem reconstruir; gravação atômica.
4. **`hela/integration/light_config.py`:** lê só as chaves que o hook usa, sem pydantic; padrões iguais aos do
   `HelaConfig` (teste de igualdade).
5. **`hela/integration/light_recall.py`:** os passos do Router que dão o contexto (regras, FTS5, cosseno pelo cache,
   ativação, RRF, relevância, confiança, otimizador, invólucro), com prazo interno de 250 ms; seleciona as mesmas
   memórias que o `Engine.recall` (teste de equivalência).
6. **Medição:** `scripts/medir_hook.py` (processo novo, 10.000 memórias, outro processo gravando). Critério: p95 < 300 ms.

## Bloco 2 · F3-A4 na porta e hooks

7. **Origem pela porta:** o hook grava a ferramenta que trouxe o texto; `hela/integration/web_taint.py` diz se a
   sessão (ou as sessões abertas no mesmo diretório) teve `WebFetch`/`WebSearch`; o `Engine.learn` recebe a origem
   da porta (`door_origin`), que prevalece sobre a declarada quando é web.
8. **`hela/integration/hooks.py`:** `hela-hook <evento>`, fail-open, `HELA_DISABLED`, prazo, log redigido em
   `HELA_HOME/logs/`.
9. **Eventos:** `SessionStart` (sessão + contexto curto e fixo), `UserPromptSubmit` (tarefa, offset do transcript,
   recall leve), `PostToolUse` e `PostToolUseFailure` (observação resumida e redigida; ignora `mcp__hela__*`),
   `Stop` (tokens do provedor e `compute_cost`, sem imprimir), `SessionEnd` (varredura final e fecha a sessão).
10. **`hela/integration/transcript.py`:** soma o `usage` das linhas `assistant`, deduplicado por `message.id`, com cursor
    por arquivo (principal e `subagents/agent-*.jsonl`).

## Bloco 3 · MCP e Skill

11. **`hela/integration/mcp_server.py`:** import compatível (v2 primeiro, depois v1); 8 ferramentas sobre
    `Engine.<op>(door="mcp")`; só `ToolError` volta ao Claude; sem aprovar, aplicar evolução, apagar ou importar.
12. **`.claude/skills/hela/SKILL.md`:** quando usar cada ferramenta, o que é dado e o que é instrução, limites.

## Bloco 4 · Médios do validador

13. **F3-M2:** a aprovação guarda a linguagem; mudar a linguagem invalida.
14. **F3-B2:** `approve` sai do `Literal` do `ProcedureRequest`.

## Fecho

15. Documentação (`docs/api.md`, `docs/arquitetura.md` ADR-22+, `docs/plano.md` seção 8), memória da Karol.
16. Teste com o `claude` de verdade num `HOME` isolado, se couber no tempo (custo pequeno, como o da Sabrina).
