**Veredito: aprovado com ressalvas.** Nenhum achado alto. Dois médios (foco perdido no editor; registro de IA exportado com fontes que não existem na lista e sem a marca de exemplo) devem ser corrigidos antes de publicar a prévia; os baixos podem ficar para depois.

# Revisão da implementação do novo design (FutuRI) — Iris

Revisora: Sabrina · 22/11/2026 · revisão enxuta, a pedido (limite de uso).
Escopo: as mudanças sem commit em `Projetos/Iris/frontend` (32 arquivos alterados e os novos `Observatorio`, `Documentos`,
`Versao`, `RegistroDeIA`, `LinhaDeEntrega`). Nenhum código foi editado.

## O que foi testado e como

| Item | Como | Resultado |
|---|---|---|
| `npm run build:previa` | rodado | passa (2,8 s); saem `PaginaObservatorio-*.js`, `PaginaDocumentos-*.js` e `observatorio-*.js` |
| 1280 e 1920 px | prévia (`vite --mode previa`) no navegador do app, `#observatorio` e `#documento`; medido `scrollWidth` e elementos além da borda | sem rolagem horizontal e sem elemento vazando nas duas telas e nas duas larguras; console sem erros |
| Foco por teclado | Tab pela página do Observatório inteira, com registro do elemento focado, `:focus-visible` e contorno; no editor, Enter em Editar e em Descartar | todo controle recebe foco com contorno visível (ciano 2 px; no menu lateral, claro a 55%). Defeito M1 no editor |
| Leque e selo de cenário | leitura do código | o leque é SVG `aria-hidden`; o realce vem dos cartões, que respondem a `onFocus`/`onBlur` além do mouse (`SecaoCenarios.tsx:127-130`). Ok |
| Contraste da folha clara (WCAG AA) | cálculo dos pares de `globais.css:997-1016` sobre a folha (#f3f4f1 no tema escuro, #fff no claro) e sobre o fundo do trecho sugerido (âmbar 12%) | todos passam 4,5:1. O pior: âmbar e positivo sobre o sugerido no tema escuro, 4,86 e 4,87; texto-3 4,88; ouro como texto daria 4,00, mas não é usado como texto na folha. Selo do cenário (branco sobre ouro) 5,07 |
| Reduzir movimento | leitura das regras (o navegador do app não emula a preferência) | a revelação do leque desliga (ver B1, que é frágil mas funciona); as transições novas do leque são de opacidade (200 ms); a página usa `MotionConfig reducedMotion="user"` |
| Dados de exemplo e marca | texto renderizado e `grep` em `src`, `public` e `index.html` | "Dados de exemplo" aparece no Observatório, na lista e no editor; nenhuma imagem; FECAP e FutuRI só em `PaginaLanding.tsx:133`, na frase combinada |
| Exportação do registro (.md) | clique em "Exportar registro de IA e fontes" com o blob capturado | baixa `registro-ia-brasil-entre-tarifas.md`; sem dado pessoal, chave ou endereço interno; o conteúdo reflete as decisões. Defeitos M2 e B2 |

Não testado: 390 px (fora do pedido), leitor de tela real, impressão do "Exportar PDF com anexos", navegadores além do Chromium do app.

## Achados

### Alta

Nenhum.

### Média

**M1. O foco some depois de Editar e de Descartar no trecho sugerido.** Dona: Karol.
`src/pages/Documentos/PaginaDocumentos.tsx:78-84` (e o efeito em `:94-117`).
Passos: abrir `#documento`, focar "Editar" com o teclado, Enter. Esperado: foco no `textarea`. Obtido: foco vai para o
`body` (o botão Editar sai da tela e nada recebe o foco). O mesmo com "Descartar" e "Aceitar": o trecho some e o foco cai
no `body`; quem usa teclado volta para o começo da página. Também não há aviso (`aria-live`) de que a decisão foi
registrada. Sugestão: focar o `textarea` ao editar e, depois da decisão, focar o parágrafo seguinte ou o título da seção
(com `tabIndex={-1}`), mais uma mensagem curta numa região `role="status"`. (WCAG 2.4.3 e 4.1.3.)

**M2. O registro exportado cita fontes que não estão na lista e não diz que é exemplo.** Dona: Karol.
`src/previa/observatorio-exemplo.ts:27` e `:36` (registros citam [3] [5] [7] [8] [9] e [3] [4] [5] [6] [7]) contra
`:108-111` (só existem [3], [5] e [7]); `registroComoTexto` em `PaginaDocumentos.tsx:30-43`.
O `.md` sai com "fontes [3] [5] [7] [8] [9]" e a seção Fontes só tem três itens: a rastreabilidade, que é o objetivo do
registro, quebra. E o arquivo, que sai da página, não leva "Dados de exemplo" (a tela leva, `:132`). Sugestão: completar
as fontes do exemplo (ou citar só as que existem) e, com `PREVIA`, pôr "Dados de exemplo" no cabeçalho do `.md`.

### Baixa

**B1. A regra de "reduzir movimento" do leque funciona por acaso.** Dona: Karol. `src/styles/globais.css:978-980`
contra `:958-961`. A regra vertical (mais específica) vem depois do `@media (prefers-reduced-motion: reduce)` e repõe o
`animation-name`; só não anima porque a duração ficou em 0 s pelo `animation: none`. Mudar a duração ali religa a
animação. Sugestão: pôr `.leque-futuros[data-vertical]` também dentro do bloco de movimento reduzido.

**B2. O texto do registro fica contraditório depois da decisão.** Dona: Karol. `PaginaDocumentos.tsx:112` com
`observatorio-exemplo.ts:25`. Sai "…ainda não revisada. Descartado na revisão." Sugestão: substituir a frase em vez de
anexar, ou tirar "ainda não revisada" do dado.

**B3. Download pode falhar em alguns navegadores.** Dona: Karol. `PaginaDocumentos.tsx:45-52`. O link não entra no
documento e `revokeObjectURL` roda logo depois do `click()`. Funciona no Chromium; no Firefox e no Safari mais antigos pode
cancelar. Sugestão: revogar num `setTimeout`.

**B4. Na prévia, `#observatorio` é ao mesmo tempo âncora da landing e entrada do app.** Dona: Karol.
`src/pages/Landing/PaginaLanding.tsx:25` e `src/app/main.tsx:29`. Quem clica no menu da landing e recarrega a página cai
em `/app/observatorio`, não na seção. Só na prévia.

## Segurança

Nada encontrado: o texto editado entra como nó de texto (sem `dangerouslySetInnerHTML`), o `.md` é texto puro baixado
pelo próprio usuário, sem segredo, e-mail ou dado pessoal (revisor aparece como "Equipe 3"). O `id` do documento vai para a
rota com `encodeURIComponent` (`src/config/rotas.ts:33`).

## Pode publicar?

Com ressalvas: corrigir M1 e M2 antes. A publicação (commit, merge, deploy) aguarda aprovação do Paulo.
