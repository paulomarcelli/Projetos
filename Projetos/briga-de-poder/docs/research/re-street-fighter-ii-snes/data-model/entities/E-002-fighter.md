# E-002 Fighter
Product term: lutador · Parent: E-003 · Status: draft

## Fields

| Field | Type | Required | Default | Constraints or enum | Source |
|---|---|---|---|---|---|
| health | int | yes | máximo do personagem | 0..max | [doc SRC-001] |
| position | Vector2i (ponto fixo) | yes | | dentro da arena | [doc SRC-002] |
| velocity | Vector2i | yes | 0 | | [doc SRC-002] |
| facing | int | yes | | -1 ou 1 | [doc SRC-002] |
| state | enum | yes | idle | idle, walk, crouch, jump, block, attack, hitstun, blockstun, knockdown, wakeup, dizzy, thrown | [doc SRC-002] |
| state_frame | int | yes | 0 | | [doc SRC-002] |
| current_attack | E-001 id | no | | | [doc SRC-002] |
| combo_count | int | yes | 0 | | [doc SRC-002] |
| stun_meter | int | yes | 0 | | [doc SRC-002] |
| charge_frames | Dictionary | yes | {} | quadros segurando trás/baixo | [doc SRC-002] |
| input_history | Array[int] | yes | [] | últimos N quadros (bitmask) | [doc SRC-002] |

## Relations

| Relation | Target | Cardinality | On delete | Source |
|---|---|---|---|---|
| tem golpes | E-001 | 1:N | remove | [doc SRC-001] |
| luta em | E-003 | N:1 | remove | [doc SRC-001] |

## Lifecycle

Estados em `state`; transições pelas regras de combate.

## System fields

| Field | Set when | Source |
|---|---|---|
| state_frame | zera a cada troca de estado | [doc SRC-002] |

## Rules

- R-009, R-015, R-016, R-019, R-023, R-025, R-026

## Not tested

- Limiar de tontura (Q-005).
