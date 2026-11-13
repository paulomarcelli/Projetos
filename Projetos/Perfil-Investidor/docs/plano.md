# Perfil de Investidor — plano de implementação

> Para quem executa: seguir tarefa por tarefa, com teste primeiro (TDD). Design: `design.md`.

**Objetivo:** sistema especialista web (HTML/CSS/JS sem servidor) que conclui o perfil de investidor por regras e explica o raciocínio.
**Arquitetura:** base de conhecimento (dados + regras) separada do motor de inferência genérico; interface só consome os dois.
Scripts clássicos (não módulos ES) para abrir com dois cliques via `file://`; cada arquivo também exporta via `module.exports` para os testes no Node.
**Tecnologia:** HTML, CSS, JavaScript puro; testes com `node --test` (Node 18+). Sem dependências.

## Arquivos
| Arquivo | Responsabilidade |
|---------|------------------|
| `js/motor.js` | Motor de inferência genérico: encadeamento para frente, prioridade, trilha de explicação |
| `js/base-conhecimento.js` | Perguntas, pontos, regras SE→ENTÃO, carteiras de exemplo |
| `js/app.js` | Fluxo de telas, progresso, resultado e explicação |
| `index.html`, `css/estilo.css` | Estrutura e visual |
| `tests/motor.test.js` | Testes do motor |
| `tests/base-conhecimento.test.js` | Testes das regras do domínio |
| `README.md` | Documentação e passo a passo GitHub Desktop |

## Tarefa 1 — Motor de inferência (branch `perfil-investidor/feature/motor-inferencia`, issue "Motor de inferência")
- [ ] Teste: regra simples dispara quando a condição é verdadeira e adiciona fato.
- [ ] Teste: encadeamento (regra B depende do fato criado por A).
- [ ] Teste: regra não dispara duas vezes; para quando não há novidade.
- [ ] Teste: prioridade (regras de maior prioridade rodam antes).
- [ ] Teste: trilha registra id, nome e explicação de cada regra disparada, em ordem.
- [ ] Rodar e ver falhar → implementar `inferir(fatosIniciais, regras)` → rodar e ver passar → commit.

## Tarefa 2 — Base de conhecimento (branch `perfil-investidor/feature/base-de-regras`, issue "Base de conhecimento")
- [ ] Testes: respostas mais cautelosas → conservador; intermediárias → moderado; mais ousadas → arrojado.
- [ ] Testes: sem reserva → no máximo conservador + alerta; prazo < 1 ano → no máximo conservador;
      venderia na queda de 10% → no máximo moderado; dívida cara → alerta.
- [ ] Teste: carteira de exemplo soma 100% para cada perfil.
- [ ] Rodar e ver falhar → implementar perguntas, `fatosDasRespostas()`, regras e carteiras → passar → commit.

## Tarefa 3 — Interface (branch `perfil-investidor/feature/interface`, issue "Interface")
- [ ] `index.html` com telas: início, pergunta, resultado; `css/estilo.css` com a direção de arte.
- [ ] `js/app.js`: uma pergunta por tela, voltar/avançar, teclado, barra de progresso, resultado, "Como cheguei nisso", refazer.
- [ ] Verificar no navegador (Playwright): fluxo completo para os três perfis, sem erros no console, celular e desktop → commit.

## Tarefa 4 — Documentação (branch `perfil-investidor/docs/readme`, issue "Documentação")
- [ ] README: o que é, como usar, arquitetura do sistema especialista, regras, testes, aviso educacional, passo a passo GitHub Desktop → commit.

## Integração
- [ ] Cada branch mesclada em `perfil-investidor/develop` com `git merge --no-ff`; todas enviadas ao GitHub.
- [ ] Pull request `perfil-investidor/develop` → `main` com "Closes #…" das quatro issues.
