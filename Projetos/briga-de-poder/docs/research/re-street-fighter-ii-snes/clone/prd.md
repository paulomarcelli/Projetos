# Clone requirements: Street Fighter II SNES
Updated: 2026-10-31 · Status: draft

Requisitos para o BRIGA DE PODER tirados deste estudo. Não é um clone do jogo estudado.

## Problem and users

Jogadores brasileiros no navegador, no computador e no celular, que conhecem as convenções de jogos de luta e esperam regras consistentes.

## Launch blockers

| Barrier | Severity | Owner | Start by |
|---|---|---|---|
| BR-001 | blocks launch | equipe de arte e design | já (todas as fases) |
| BR-002 | blocks launch | equipe | já (clean room) |
| BR-003 | adds lead time | responsável pelo projeto + jurídico | antes da Fase 7 |
| BR-004 | blocks feature | responsável pelo projeto | antes da Fase 4 |

## Core loop

Escolher lutador → luta em melhor de 3 rounds com relógio → combos, defesa e agarrões → vitória → próxima luta ou revanche.

## Scope by priority

| Priority | Feature | Rules | Screens | Notes |
|---|---|---|---|---|
| P1 (Fase 2) | F-001 Rounds | R-001 a R-005 | S-002 | |
| P1 (Fase 2) | F-003, F-004, F-005 Combate base | R-008 a R-013 | S-002 | simulação em quadros fixos |
| P2 (Fase 2–4) | F-006, F-007, F-008 Agarrão, queda, combos | R-014 a R-018 | S-002 | |
| P2 (Fase 3) | F-002, F-009 Controles e comandos | R-023 a R-027 | S-002 | toque com buffer maior (Q-004) |
| P2 (Fase 3) | F-012 Entrega Web e toque | R-020 a R-022 | S-001 | |
| P3 (Fase 4) | F-010 Tontura | R-019 | S-002 | opcional (Q-005) |
| P3 (Fase 5) | F-011 Modo solo | R-006, R-007 | S-003, S-004 | mapa e bônus com identidade própria |
| P3 (Fase 6) | F-013 Online | R-028 | S-001 | relay WebSocket primeiro, rollback depois |

## Non-goals

- Reproduzir personagens, golpes, números de quadros, sons ou telas do jogo estudado.
- Emular SNES ou carregar ROMs.

## Data model

See `data-model/erd.mmd` and `data-model/types.ts`.

## Build order

1. Start long lead-time approvals and launch blockers (they run in parallel): Q-002 e Q-003.
2. Data model and persistence: E-001 a E-004 como Resources e estado copiável.
3. Core loop screens: tela de luta com HUD.
4. Rules in `clone/parity.md`, P1 first.
5. Secondary features, after the barriers they depend on.

## Open questions

See `questions.md`.
