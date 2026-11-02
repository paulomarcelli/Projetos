# Respostas reais da API (só para testes)

Estes arquivos são **respostas reais capturadas** da API da F.R.E.Y.A. em 2026-11-02 (base indexada: 12.874 trechos,
5.711 nós, motor `modelo` com `gpt-5.6-terra`). Nada aqui foi escrito à mão nem editado; o JSON só foi reindentado.
Servem **apenas para testes** (componentes, páginas, tipos). A interface nunca os importa fora de `*.test.ts(x)`.

| Arquivo | Chamada |
|---|---|
| `investigacao-real.json` | `GET /investigacoes/32aa2add9f5b` — "Como a relação entre Thor e Loki pode evoluir?" (horizonte "após Avengers: Endgame"), concluída: 3 cenários, 177 evidências |
| `grafo-real.json` | `GET /investigacoes/32aa2add9f5b/grafo` — 99 nós, 169 arestas, 175 evidências, 3 caminhos entre as focais |
| `expansao-real.json` | `GET /investigacoes/32aa2add9f5b/grafo/expandir?no=character:loki&limite=5` |
| `caminho-real.json` | `GET /investigacoes/32aa2add9f5b/grafo/caminho?de=character:thor-thor-odinson&para=character:loki` |
| `investigacao-fora-do-dominio.json` | `GET /investigacoes/e94eec4fda3c` — "Quais são os possíveis impactos de uma escalada entre China e Taiwan nos próximos cinco anos?" |
| `grafo-fora-do-dominio.json` | `GET /investigacoes/e94eec4fda3c/grafo` — 1 nó (`location:china`), 0 arestas |

A questão fora do domínio (China e Taiwan) mostra o comportamento honesto do motor: estado `concluida`, 8 evidências
(trechos recuperados sem relação real com o tema), 3 cenários condicionais, 6 limitações explícitas e 15 afirmações
rebaixadas e 2 removidas pela validação. A interface precisa deixar isso claro.

Os ids existem no banco local da API de desenvolvimento, mas podem ser excluídos a qualquer momento; testes que
precisam da API viva usam `api.integracao.test.ts`, não estes ids.
