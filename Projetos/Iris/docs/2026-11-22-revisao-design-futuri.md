# IRIS · Revisão de design e novo Design System (22/11/2026)

Feito pela Sofia. Nada mudou no código e não houve commit.

**Figma:** [IRIS · Design System e telas (Observatório)](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7)
**Design System em texto:** [`docs/design-system.md`](design-system.md)

## 1. Pedido

Revisar o visual da IRIS e redesenhar no Figma o Design System e quatro telas para atender laboratórios de prospectiva
como o FutuRI Lab: landing, investigação com o leque, modo Observatório e editor de policy brief com fontes e registro
de uso de IA.

## 2. A ideia

**O cenário é um objeto versionado.** Cada futuro tem versão e data de revisão, cada frase tem fonte, e o uso de IA
fica declarado. É isso que separa a IRIS de "mais uma landing de IA" e é exatamente o que o lab precisa: método
visível, revisão por ciclo e transparência no uso de IA.

Partes da `design-skills` usadas: `figma-design-workflow` (fluxo no Figma), `taste-skill` em pt-BR (regras da casa e
o roteiro de telas de app, `references/pt-BR/app-screens.md`), `critique-visual-hierarchy` (revisão do antes) e
`design-token` (camadas e nomes). No Figma: `figma-use`, `figma-generate-library` e `figma-generate-design`.

## 3. Revisão do antes

Capturas da prévia publicada, feitas pelo Chrome sem janela (protocolo CDP, `deviceScaleFactor` 1), em
`docs/revisao-design/antes/`: `landing-1440.png`, `landing-390.png`, `investigacao-1440.png`, `investigacao-768.png`,
`investigacao-390.png`, `cenario-b-1440.png`, `app-1440.png`.

### Visual

1. **A landing é o modelo genérico de landing de IA**, e a própria `DESIGN.md` admite isso. Selo em pílula acima do
   título, brilho azul atrás do globo, fileira de fichas que rola, cartões de recurso com ilustração em cima, barras
   cinza no lugar do texto ("Análise explicada") e um quadro de demonstração com metade vazia. Nada disso diz o que a
   IRIS faz de diferente.
2. **Ouro e âmbar se confundem.** `#F2C45A` e `#E9B45B` são quase o mesmo amarelo. Na investigação aparecem lado a
   lado: as letras A/B/C, o horizonte "2027–2030", os ramos do leque e o número "02" usam os dois sem que dê para
   saber qual é qual. O README diz "ouro para os cenários"; a `DESIGN.md` diz "letra âmbar".
3. **Rótulos em caixa-alta espaçada e em mono** ("01 · DIAGNÓSTICO ATUAL", "IRIS · INVESTIGAÇÃO PROSPECTIVA",
   "IRIS / CENÁRIOS / CENÁRIO B"): três vozes por seção, pequenas e frias, e o mono fora de dado.
4. **O leque, a melhor ideia visual do produto, é pequeno.** Ocupa metade da largura a 1440 px, com a outra metade
   vazia, e **some no celular e no tablet** (só aparece a partir de `md`).
5. **Duas linguagens.** Landing azul com brilho e "cristal"; app preto e plano. Parecem produtos diferentes.

### Conteúdo

6. **Nenhuma marca de tempo nos cenários.** Não há versão nem "próxima revisão" no cartão nem no cabeçalho, embora o
   produto fale em revisão de premissas e histórico de versões.
7. **Não há lugar para turma, ciclo nem entrega**, nem para escrever o policy brief ou o boletim a partir da análise.
8. **O método não aparece.** É uma das lacunas do site do lab, e a IRIS poderia preenchê-la.

### Código (para a Karol, sem mexer agora)

9. Na prévia a 1440 px o índice "01 02 03" fica numa pílula que não segue o padrão de abas da `DESIGN.md` (traço
   ciano de 2 px).
10. A 390 px a barra de abas da seção 03 corta "Evidências" sem indicar rolagem nas capturas (a regra do degradê na
    borda existe, conferir se está ativa).

## 4. O que mudou (só no Figma e na documentação)

**Arquivo novo no Figma** `qm53WCtzVvhaEdFttNzio7`. O arquivo antigo "Iris — Interface de análise" citado na
`DESIGN.md` não tem link no repositório, então não foi reaproveitado.

- **Fundamentos:** 35 variáveis (coleção Cor com os modos Escuro e Claro, coleção Medida) com descrição e sintaxe CSS;
  13 estilos de texto; amostras, escala e as regras que não mudam.
- **Componentes:** Marca IRIS, Botão (6 variantes), Ficha, Selo de cenário, Marca epistêmica (6 tipos), Citação,
  Versão (3), Linha de fonte (2), Registro de uso de IA (2), Cartão de cenário (2), Item do índice, Item do menu, Campo
  de pergunta, Linha de entrega (3). Todos ligados às variáveis.
- **Telas · desktop:** Landing, Investigação com o leque, Observatório, Editor de policy brief, montadas com
  instâncias.
- **Telas · celular:** Investigação com o leque vertical.
- **Documentos:** `docs/design-system.md` (novo) e este relatório.

### Decisões de design

1. **Ouro é cheio, âmbar é traço.** O selo do cenário vira um quadrado cheio de ouro com a letra escura; ramos,
   horizonte e hipótese continuam âmbar, sempre em traço, tracejado ou itálico. Assim os dois amarelos param de
   competir. Seleção continua ciano.
2. **Versão em tudo.** Cabeçalho, cartão e documento mostram "v3 · em vigor" e "revisar em 12/02/2027". A faixa
   "Desde a v2" diz o que mudou e leva ao monitoramento. No leque, sinal novo vira um ponto ciano no ramo.
3. **O leque vira a imagem principal**: largura total na investigação, herói da landing e versão vertical no
   celular.
4. **Rótulos com inicial maiúscula, sem caixa-alta espaçada; mono só em dado.**
5. **Landing reescrita em cinco blocos:** herói ("Cenários que dizem de onde vieram.", campo de pergunta e o leque
   real), método em cinco etapas, Observatório, IA declarada e fechamento com o nome. Sem selo em pílula, sem brilho,
   sem cartões com ícone. A menção ao lab é só texto: "Pensado para laboratórios de prospectiva como o FutuRI Lab". Sem
   logo nem marca da FECAP ou do lab.
6. **Observatório:** ciclo em fichas, linha do semestre (chamada, revisões de cenário, prazos e hoje), entregas da
   turma com a versão do cenário usada, cenários do observatório e o resumo do uso de IA da turma. Responde "o que a
   turma entrega e quando".
7. **Editor:** a folha é sempre clara (o que vai ser entregue), sobre a mesa escura. Texto sugerido pela IA fica em
   fundo âmbar até alguém aceitar, editar ou descartar. Painel com as fontes (conferida ou não) e o registro de uso de
   IA, e o botão "Exportar registro de IA e fontes".

Os dados das telas são de exemplo e marcados assim. Os ciclos 2025.2 e 2026.1 vêm do briefing; nomes de equipes e de
fontes são fictícios.

## 5. Capturas

- Antes: `docs/revisao-design/antes/` (prévia publicada, 1440, 768 e 390 px).
- Depois (exportadas do Figma): `docs/revisao-design/depois/landing-1440.png`, `investigacao-1440.png`,
  `observatorio-1440.png`, `editor-1440.png`, `investigacao-390.png`.

## 6. Conferido em

- Prévia publicada em 1440 × 900, 768 × 1024 e 390 × 844 (celular emulado com toque). Primeira tentativa com o Chrome
  sem janela cortava o layout em 390 px (largura mínima da janela); refeito por CDP e conferido no navegador interno
  (`scrollWidth` 375 = largura da tela, sem rolagem lateral).
- Nas capturas de página inteira, o menu lateral para de pintar depois da primeira dobra e o leque não se revela (a
  animação depende da rolagem real): são efeitos da captura, não defeitos do site.
- Cada tela do Figma conferida por captura depois de montar; corrigidos: largura das variantes, rótulos sobrepostos
  no leque e na linha do semestre, altura do editor e das colunas da landing, texto da ferramenta cortado no registro
  de IA.
- Contraste: os pares de texto vêm da `DESIGN.md` (já conferidos em AA). Letra escura sobre ouro `#F2C45A` dá cerca de
  12:1. Não medi os pares novos da folha clara.

## 7. Ficou de fora

- Celular da landing, do Observatório e do editor; tema claro das telas (os tokens já têm o modo).
- Ícones do menu (marcadores no Figma).
- Protótipo navegável.
- Checagem de fatos sobre o FutuRI Lab: usei só o que veio no briefing e não pus nenhuma afirmação sobre o lab nas
  telas além da frase "pensado para laboratórios de prospectiva como o FutuRI Lab".

## 8. Tarefas de implementação (para a Karol, em ordem)

1. **Tokens.** Acrescentar a `variaveis.css` `--color-folha`, `--color-ouro-suave` e a escala `--espaco-1` a
   `--espaco-10`, com os nomes do `design-system.md`.
2. **Selo de cenário.** Trocar a letra âmbar com contorno pelo quadrado cheio de ouro com letra `abismo`; selecionado
   com anel ciano de 2 px. Ajustar a `DESIGN.md` (§4.3, "Selo de cenário").
3. **Rótulos.** Trocar os rótulos em caixa-alta espaçada e em mono (cabeçalho da investigação, cabeçalhos de seção,
   trilha do cenário) por `Texto/Rótulo`; mono só em datas, versões e citações.
4. **Índice da investigação** como o componente Item do índice (número em mono, traço ciano de 2 px), no lugar da
   pílula.
5. **Versão e próxima revisão** no cabeçalho e nos cartões (componente Versão) e a faixa "Desde a vN", lendo o
   histórico de versões que o contrato de monitoramento já prevê. Sem dado do servidor, mostrar a versão do exemplo.
6. **Leque** em largura total, com o ponto de sinal novo e a legenda; versão vertical abaixo de `md` (hoje ele some).
7. **Landing** nova, na ordem: herói com o leque real, método em cinco etapas, Observatório, IA declarada, fechamento.
   Tirar o selo em pílula, o brilho, as barras cinza e os cartões com ilustração.
8. **Observatório** (`/app/observatorio`): ciclos, linha do semestre, entregas, cenários do observatório e resumo de
   IA. Estados vazios honestos enquanto não houver servidor.
9. **Editor de documento** (`/app/documentos/:id`): folha clara, tipos (policy brief, boletim, dossiê), texto
   sugerido pela IA marcado, painel de fontes e registro de IA, exportação em PDF com os anexos.
10. **Registro de uso de IA** como dado de verdade (quando, pedido, o que fez, fontes, revisão) e exportável; definir o
    contrato com o servidor antes de mostrar números.
11. Conferir a 390, 768, 1280 e 1920 px, o foco por teclado em cada componente e "reduzir movimento" no leque.
