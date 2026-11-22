# IRIS · Design System

Arquivo do Figma: [IRIS · Design System e telas (Observatório)](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7)
(páginas Capa, Fundamentos, Componentes, Telas · desktop, Telas · celular). Revisão de 22/11/2026, feita pela Sofia.

Este documento é o que a Karol implementa. O que não está aqui não vai para o código: peça à Sofia antes.
As regras antigas continuam em `frontend/docs/DESIGN.md`; onde os dois divergem, vale este documento.

## A ideia

O cenário é um objeto versionado: cada futuro tem versão e data de revisão, cada frase tem fonte, e tudo o que a IA
escreveu fica marcado até alguém revisar.

## Tokens

Coleção **Cor** no Figma, com os modos **Escuro** (padrão) e **Claro**. No código, cada token vira
`--color-<nome>` (o mesmo nome do Figma, sem o prefixo do grupo). Os valores que já existem em
`frontend/src/styles/variaveis.css` não mudam; os novos estão marcados.

| Token (Figma) | CSS | Escuro | Claro | Uso |
|---|---|---|---|---|
| superficie/abismo | `--color-abismo` | `#080C12` | `#F4F6F9` | Fundo do app e campos |
| superficie/mar | `--color-mar` | `#0B1119` | `#EAEEF4` | Landing: alterna seções por tom; mesa do editor |
| superficie/institucional | `--color-institucional` | `#0F1620` | `#FFFFFF` | Painéis e cartões |
| superficie/grafite | `--color-grafite` | `#16202C` | `#E4E9F0` | Hover, botão secundário, faixas |
| superficie/grafite-alto | `--color-grafite-alto` | `#1D2836` | `#D8DFE8` | Hover do secundário |
| superficie/folha **(novo)** | `--color-folha` | `#F3F4F1` | `#FFFFFF` | Folha do documento. A folha usa sempre o modo Claro |
| texto/principal | `--color-texto` | `#E3E8EF` | `#0B1220` | Texto principal |
| texto/apoio | `--color-texto-2` | `#AAB5C5` | `#334256` | Texto de apoio |
| texto/auxiliar | `--color-texto-3` | `#94A0B4` | `#56647A` | Rótulos e metadados |
| texto/folha **(novo)** | `--color-folha-tinta` | `#15181D` | `#15181D` | Tinta da folha (reserva; a folha já usa o modo Claro) |
| linha/fina | `--color-linha` | `#9AAAC0` a 14% | `#0B1220` a 12% | Divisórias |
| linha/forte | `--color-linha-forte` | `#9AAAC0` a 26% | `#0B1220` a 22% | Bordas de campos e fichas |
| sentido/ciano | `--color-ciano` | `#52C7E8` | `#0A6F91` | Ação, seleção, foco, vínculo com fonte |
| sentido/ciano-texto | `--color-ciano-texto` | `#8FDAF0` | `#075B78` | Links e números de citação |
| sentido/ciano-suave | `--color-ciano-suave` | ciano a 12% | ciano a 10% | Fundo de seleção |
| sentido/ouro | `--color-ouro` | `#F2C45A` | `#8A6A00` | Cenário como objeto: **sempre cheio** (selo, versão em vigor, filete do núcleo) |
| sentido/ouro-suave **(novo)** | `--color-ouro-suave` | ouro a 10% | ouro a 10% | Reserva para a faixa da seção de cenários |
| sentido/ambar | `--color-ambar` | `#E9B45B` | `#8A5600` | Hipótese, incerteza, horizonte: **sempre traço**, tracejado ou itálico |
| sentido/ambar-suave | `--color-ambar-suave` | âmbar a 12% | âmbar a 12% | Fundo de incerteza e de texto sugerido pela IA |
| estado/positivo | `--color-positivo` | `#6CCB9A` | `#1B6F45` | Só estado real (conferido, entregue) |
| estado/negativo | `--color-negativo` | `#EF8A7C` | `#A8352A` | Só erro real |

Coleção **Medida** (modo Padrão):

| Token | Valor | CSS |
|---|---|---|
| espaco/1 … espaco/10 | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 | `--espaco-1` … `--espaco-10` (novos) |
| raio/fino, raio/padrao, raio/painel | 3, 6, 10 | `--radius-fino`, `--radius-padrao`, `--radius-painel` |

### Tipografia (estilos de texto no Figma)

Inter no texto; IBM Plex Mono **só em dado** (datas, versões, prazos, números de citação). Source Serif 4 só na marca.

| Estilo | Fonte | Tamanho / entrelinha | Uso |
|---|---|---|---|
| Display/Landing | Inter Regular | 64 / 1,04, −2,5% | Título do herói (no celular, 40) |
| Título/Manchete | Inter Regular | 40 / 1,1 | Títulos das seções da landing |
| Título/Página | Inter Regular | 30 / 1,2 | Título de página e de seção da investigação (24 no celular) |
| Título/Seção | Inter Medium | 21 / 1,35 | Títulos de painel e cartão |
| Texto/Leitura | Inter Regular | 17 / 1,65 | Texto analítico |
| Texto/Corpo · Corpo forte | Inter Regular · Medium | 16 / 1,6 | Interface |
| Texto/Legenda | Inter Regular | 14 / 1,5 | Apoio |
| Texto/Rótulo | Inter Medium | 13 / 1,45 | Rótulos (inicial maiúscula, nunca caixa-alta espaçada) |
| Dado/Mono · Mono forte | IBM Plex Mono Regular · Medium | 13 / 1,45 | Datas, versões, citações |
| Folha/Título | Inter Semi Bold | 28 / 1,2 | Título do documento |
| Folha/Texto | Inter Regular | 16 / 1,75 | Texto do documento |

## Componentes (página Componentes)

| Componente | Variantes | Regra |
|---|---|---|
| Marca IRIS | — | Símbolo + "IRIS" em Source Serif 4; 26 px no menu e na landing |
| Botão | Tipo: Primário, Secundário, Fantasma × Estado: Padrão, Foco | Primário ciano; o ouro não é cor de botão. Foco: anel ciano de 2 px afastado 2 px |
| Ficha | Padrão, Ativa | Filtros, ciclos, tipo de documento |
| Selo de cenário | Padrão, Selecionado | Quadrado cheio em ouro com a letra; selecionado ganha anel ciano. **Muda o código atual**: hoje a letra é âmbar sobre contorno |
| Marca epistêmica | Fato, Evidência, Inferência, Hipótese, Incerteza, Cenário | Glifo de 16 px + palavra |
| Citação | — | `[5]` em mono, ciano-texto, sem fundo |
| Versão | Em vigor, Anterior, Rascunho | Ponto de ouro só na versão em vigor; rascunho com borda tracejada |
| Linha de fonte | Conferida, Não conferida | "Conferida" em verde (estado real); "não conferida no texto" em âmbar |
| Registro de uso de IA | Revisado, Aguardando revisão | Quando, pedido, o que a IA fez, fontes usadas, quem revisou. Aguardando: borda âmbar tracejada |
| Cartão de cenário | Padrão, Em foco | Arquétipo + horizonte (âmbar), selo + nome, ideia, primeiro sinal, versão + próxima revisão, "Abrir o cenário" |
| Item do índice | Padrão, Atual | Número em mono + nome; atual com traço ciano de 2 px |
| Item do menu | Padrão, Ativo | Ativo: fundo grafite e traço ciano à esquerda |
| Campo de pergunta | Padrão, Foco | Botão de enviar dentro, à direita |
| Linha de entrega | Em andamento, Em revisão, Entregue | Entrega da turma: tipo, título, equipe, versão do cenário usada, prazo, estado |

## Padrões

- **Leque dos futuros.** O presente em traço sólido; cada incerteza é uma coluna com losango âmbar; os ramos em âmbar
  tracejado até os selos de ouro. O cenário em foco acende o ramo em ciano. Sinal novo desde a última versão: ponto
  ciano no ramo. No celular o leque fica vertical (o tempo desce) e os selos vão para baixo. Hoje o leque some abaixo
  de `md`: no novo desenho ele aparece em todos os tamanhos.
- **Versão em tudo.** Investigação, cenário e documento mostram a versão em vigor e a próxima revisão. A faixa "Desde a
  vN" resume o que mudou e leva ao monitoramento.
- **Observatório.** Ciclo (fichas por semestre), linha do semestre com chamada, revisões de cenário (quadrado de ouro),
  prazos das entregas (círculo vazado) e "hoje" em ciano; entregas da turma; cenários do observatório com versão.
- **Folha do documento.** Sempre clara (modo Claro aplicado na folha), sobre a mesa `mar`. Texto sugerido pela IA fica
  com fundo âmbar-suave e filete âmbar até alguém aceitar, editar ou descartar. A exportação leva o registro de IA e
  as fontes como anexo.
- **Separação.** Plataforma separa por linha fina; landing separa por degrau de tom. Gradiente só no fundo do mapa.
- **Estados.** Vazio: diz o que vai aparecer e oferece a ação. Carregando: esqueleto. Erro: só com causa real.
  Foco: sempre ciano.
- **Movimento.** Os tokens de `variaveis.css` continuam. Ramos do leque revelam do presente para o horizonte (600 ms,
  `--ease-saida`), uma vez; com "reduzir movimento", aparecem prontos.

## Telas

| Tela | Nó no Figma |
|---|---|
| Landing (desktop) | [13:219](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7?node-id=13-219) |
| Investigação com o leque (desktop) | [6:2](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7?node-id=6-2) |
| Observatório (desktop) | [8:118](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7?node-id=8-118) |
| Editor de policy brief (desktop) | [12:167](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7?node-id=12-167) |
| Investigação (celular, 390) | [14:2](https://www.figma.com/design/qm53WCtzVvhaEdFttNzio7?node-id=14-2) |

## O que ainda falta

- Celular da landing, do Observatório e do editor (o editor no celular deve ser só leitura e registro).
- Tema claro das telas (os tokens já têm o modo Claro).
- Ícones do menu: no Figma são marcadores; no código, continuar com os ícones atuais.
- Estados vazio, carregando e erro do Observatório e do editor desenhados como telas.
- Página de metodologia pública (o passo "Como um cenário é construído" da landing é o resumo dela).
