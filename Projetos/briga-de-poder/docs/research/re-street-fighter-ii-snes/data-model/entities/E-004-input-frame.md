# E-004 InputFrame
Product term: entrada do quadro · Parent: E-002 · Status: draft

## Fields

| Field | Type | Required | Default | Constraints or enum | Source |
|---|---|---|---|---|---|
| frame | int | yes | | | [doc SRC-002] |
| bits | int (16 bits) | yes | 0 | 4 direções + 6 ataques + agarrão + defesa | [doc SRC-001] [doc SRC-002] |

## Relations

| Relation | Target | Cardinality | On delete | Source |
|---|---|---|---|---|
| de um lutador | E-002 | N:1 | remove | [doc SRC-002] |

## Lifecycle

Criada a cada quadro; enviada pela rede no online; usada para ressimular no rollback.

## System fields

| Field | Set when | Source |
|---|---|---|
| frame | ao ler os dispositivos | [doc SRC-002] |

## Rules

- R-023, R-026, R-028

## Not tested

- Formato de pacote de rede: Fase 6.
