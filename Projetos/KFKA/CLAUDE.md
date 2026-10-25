# KFKA — contexto do projeto (para Claude Code)

## Objetivo
Protótipo navegável **só de design** da plataforma KFKA, que faz o acompanhamento escolar bimestral (Projeto Interdisciplinar 2º ADS, FECAP 2026). Requisitos em `docs/PRD.md` e `docs/AUDITORIA_REQUISITOS.md`.

## Stack
- HTML + CSS + JS puro, sem build, sem módulos ES. Abre direto pelo `index.html`.
- SPA com roteador por hash (`KFKA.route`). Os dados fictícios ficam em `js/data.js`, expostos por `KFKA.api`.
- Fase funcional futura: Node/Express + MySQL. Só `KFKA.api` muda para `fetch()`.

## Estrutura
```
index.html            → carrega CSS e scripts na ordem
css/tokens.css        → cores, fontes, espaço, raios (fonte única da verdade)
css/base.css          → reset e utilitários
css/layout.css        → menu, topo, páginas públicas, login
css/components.css    → botões, campos, status, tabelas, modais…
css/pages.css         → estilos por página + impressão + documentação
js/core.js            → ícones, logo (KFKA.mark), roteador, toast, modal, validação
js/data.js            → dados fictícios + KFKA.api
js/shell.js           → layout logado compartilhado
js/pages/*.js         → uma área por arquivo (publico, admin, professor, familia, docs)
tests/                → Playwright: crawl.js, flows.js, shots.js
docs/, agents/        → PRD, auditoria, pesquisa, revisores de SEO e segurança
```

## Convenções
- Textos em pt-BR, tom acolhedor. Médias com vírgula (`KFKA.fmtMedia`).
- Cores sempre por token (`var(--teal)`), nunca hex solto em componente novo.
- Todo texto vindo do usuário passa por `KFKA.esc()` antes de ir para `innerHTML`.
- Toda ação mostra `KFKA.toast` com o selo de simulação local.
- Status sempre com texto + ícone + cor (`KFKA.status`).
- Comentários em português explicando o porquê.
- Movimento (skills emil-design-eng/animate): só `transform`/`opacity`, curvas `--ease-out`/`--ease-in-out`/`--ease-drawer`, UI abaixo de 300ms, saída mais rápida que a entrada, `:active` com `scale(var(--press-scale))`, hover só em `@media (hover: hover) and (pointer: fine)`. Nunca `transition: all`, `ease-in` ou `scale(0)`.
- Menos movimento: os tokens `--enter-y`, `--enter-scale`, `--lift`, `--press-scale` e `--motion` zeram sozinhos; use-os em vez de valores fixos.
- Impeccable: sem sobretítulo (eyebrow) acima de título, sem barra lateral grossa em cartões, sem cartão dentro de cartão, sem gradiente/brilho genérico (use `--brand-arcs`).
- Pior caso (break-ui): `index.html?dados=pior` troca para nomes/e-mails/textos extremos; rode `node tests/pior-caso.js` depois de mexer em listas e cartões. Plural com `KFKA.plural(n, 'aluno')`.

## Limites
- Não criar backend, banco, autenticação real nem persistência nesta fase.
- Nunca colocar chaves de API, senhas ou tokens no código.
- A família nunca vê relatório não publicado ou de aluno não vinculado (`KFKA.api.relsDaFamilia`).
- Rodar `node tests/crawl.js` e `node tests/flows.js` depois de qualquer mudança.
