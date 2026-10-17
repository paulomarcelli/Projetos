# Dados do mapa — WAR: As Crônicas de Nárnia

> Dono: Agente 2. Fonte única no código: `packages/shared/src/map/narnia.ts` (`NARNIA_MAP`).
> Helpers em `packages/shared/src/map/index.ts`: `getTerritory`, `neighbors`, `areAdjacent`, `territoriesOfRegion`, `getRegion`, `REGION_IDS`.

## 1. Fonte e método

- Arte de referência: `docs/referencias/mapa-narnia-original.webp` (2000×1125, com legenda) e o recorte do tabuleiro `packages/client/public/assets/mapa-narnia.webp` (2000×888, mesmas coordenadas para y < 888).
- Os 42 nomes e os bônus vêm da legenda. Correções de texto: "Cair Paavel" na legenda é **Cair Paravel**. O rótulo corrompido "Yelmaráino" no mapa é **Vale Telmarino**. **Fortaleza do Mar** não tem rótulo no mapa: é a área do castelo na costa oeste de Telmar, entre Porto Ocidental e Baía dos Exilados (castelo em ≈ 235, 430).
- As fronteiras foram lidas em recortes ampliados da arte (2× a 4×). Também foi gerada uma sobreposição de âncoras e arestas sobre a arte para conferência visual.
- **Áreas sem rótulo** (interpretação):
  - a área da **cabeça do leão** no centro de Nárnia (≈ 800–1010, 290–470) foi considerada parte do **How de Aslan**, porque o leão é Aslan e a área fica logo abaixo do rótulo;
  - a área do **castelo** no centro de Arquelândia (≈ 1180–1400, 290–410) foi considerada parte de **Anvard** (Anvard é o castelo-capital);
  - a **serra** entre Ruínas de Telmar e a neve (≈ 450–605, 120–300) pertence às **Ruínas de Telmar**, porque não há linha separando-a do rótulo;
  - a **cordilheira** entre Passagem do Norte e o rio de Pico Gelado (≈ 1060–1115) foi tratada como divisa entre esses dois territórios;
  - a margem oeste do rio Calormeno, acima do Oásis, foi considerada parte do **Rio Calormeno**.
- **Rios como fronteira:** os rios desenhados com contorno preto (o grande rio entre Nárnia e Arquelândia, os rios ao redor do leão e o rio Calormeno) contam como **fronteira terrestre** (`land`), como no WAR clássico. Não há mar entre as margens.

## 2. Regiões

| id | Nome | Bônus | Cor | Territórios |
|---|---|---|---|---|
| `narnia` | Reino de Nárnia | +5 | `#D4A537` (dourado) | 7 |
| `norte` | Terras do Norte | +4 | `#A9D3EA` (azul-gelo) | 7 |
| `arquelandia` | Arquelândia | +3 | `#5E9E57` (verde) | 7 |
| `calormania` | Calormânia | +5 | `#E07B39` (laranja) | 7 |
| `telmar` | Terras de Telmar | +4 | `#8C8A3E` (oliva) | 7 |
| `ilhas` | Ilhas Orientais | +3 | `#3B7DC4` (azul) | 7 |

## 3. Territórios

`Âncora` = centro do rótulo (ou da área, quando não há rótulo) em pixels da arte 2000×888. Os símbolos das cartas estão equilibrados: 14 espadas, 14 escudos e 14 coroas, alternados dentro de cada região.

| id | Nome | Região | Âncora (x, y) | Símbolo |
|---|---|---|---|---|
| `cair-paravel` | Cair Paravel | Reino de Nárnia | 1095, 409 | espada |
| `beruna` | Beruna | Reino de Nárnia | 1018, 247 | escudo |
| `lantern-waste` | Lantern Waste | Reino de Nárnia | 1055, 494 | coroa |
| `grande-rio` | Grande Rio | Reino de Nárnia | 877, 514 | espada |
| `mesa-de-pedra` | Mesa de Pedra | Reino de Nárnia | 721, 479 | escudo |
| `bosques-de-narnia` | Bosques de Nárnia | Reino de Nárnia | 700, 308 | coroa |
| `how-de-aslan` | How de Aslan | Reino de Nárnia | 863, 263 | espada |
| `ettinsmoor` | Ettinsmoor | Terras do Norte | 587, 113 | escudo |
| `harfang` | Harfang | Terras do Norte | 733, 135 | coroa |
| `terras-dos-gigantes` | Terras dos Gigantes | Terras do Norte | 877, 116 | espada |
| `passagem-do-norte` | Passagem do Norte | Terras do Norte | 1002, 108 | escudo |
| `pico-gelado` | Pico Gelado | Terras do Norte | 1189, 103 | coroa |
| `desfiladeiro-branco` | Desfiladeiro Branco | Terras do Norte | 1282, 163 | espada |
| `lago-congelado` | Lago Congelado | Terras do Norte | 1418, 148 | escudo |
| `anvard` | Anvard | Arquelândia | 1227, 271 | coroa |
| `vale-verde` | Vale Verde | Arquelândia | 1432, 271 | espada |
| `colinas-de-arquelandia` | Colinas de Arquelândia | Arquelândia | 1470, 362 | escudo |
| `fortaleza-da-fronteira` | Fortaleza da Fronteira | Arquelândia | 1521, 484 | coroa |
| `passagem-sul` | Passagem Sul | Arquelândia | 1238, 474 | espada |
| `rio-das-colinas` | Rio das Colinas | Arquelândia | 1355, 536 | escudo |
| `campo-real` | Campo Real | Arquelândia | 1494, 568 | coroa |
| `tashbaan` | Tashbaan | Calormânia | 732, 645 | espada |
| `deserto-de-calormania` | Deserto de Calormânia | Calormânia | 947, 630 | escudo |
| `oasis-dourado` | Oásis Dourado | Calormânia | 1107, 692 | coroa |
| `rio-calormeno` | Rio Calormeno | Calormânia | 1252, 641 | espada |
| `cidade-murada` | Cidade Murada | Calormânia | 1273, 765 | escudo |
| `costa-sul` | Costa Sul | Calormânia | 1083, 790 | coroa |
| `estrada-das-caravanas` | Estrada das Caravanas | Calormânia | 853, 773 | espada |
| `castelo-de-telmar` | Castelo de Telmar | Terras de Telmar | 393, 115 | escudo |
| `porto-ocidental` | Porto Ocidental | Terras de Telmar | 215, 255 | coroa |
| `ruinas-de-telmar` | Ruínas de Telmar | Terras de Telmar | 405, 255 | espada |
| `floresta-ocidental` | Floresta Ocidental | Terras de Telmar | 435, 395 | escudo |
| `fortaleza-do-mar` | Fortaleza do Mar | Terras de Telmar | 250, 385 | coroa |
| `vale-telmarino` | Vale Telmarino | Terras de Telmar | 510, 505 | espada |
| `baia-dos-exilados` | Baía dos Exilados | Terras de Telmar | 318, 552 | escudo |
| `ilhas-solitarias` | Ilhas Solitárias | Ilhas Orientais | 1710, 193 | coroa |
| `felimath` | Felimath | Ilhas Orientais | 1814, 276 | espada |
| `avra` | Avra | Ilhas Orientais | 1676, 385 | escudo |
| `doorn` | Doorn | Ilhas Orientais | 1841, 428 | coroa |
| `galma` | Galma | Ilhas Orientais | 1703, 561 | espada |
| `terebintia` | Terebintia | Ilhas Orientais | 1822, 647 | escudo |
| `ilha-oriental` | Ilha Oriental | Ilhas Orientais | 1712, 759 | coroa |

## 4. Conexões (89: 76 terrestres + 13 marítimas)

| # | A | B | Tipo | Justificativa |
|---|---|---|---|---|
| 1 | `bosques-de-narnia` | `how-de-aslan` | terra | Fronteira desenhada entre os Bosques e a encosta do How. |
| 2 | `bosques-de-narnia` | `mesa-de-pedra` | terra | Fronteira desenhada (linha leste-oeste abaixo dos Bosques). |
| 3 | `how-de-aslan` | `beruna` | terra | Fronteira desenhada a leste do How. |
| 4 | `how-de-aslan` | `cair-paravel` | terra | A área da cabeça do leão (parte do How) faz fronteira com Cair Paravel. |
| 5 | `how-de-aslan` | `grande-rio` | terra | Fronteira pelo rio que contorna a área do leão, ao sul. |
| 6 | `how-de-aslan` | `lantern-waste` | terra | Fronteira pelo rio que contorna a área do leão, a sudeste. |
| 7 | `how-de-aslan` | `mesa-de-pedra` | terra | Fronteira pelo rio a oeste da área do leão. |
| 8 | `beruna` | `cair-paravel` | terra | Fronteira desenhada entre Beruna e Cair Paravel. |
| 9 | `cair-paravel` | `lantern-waste` | terra | Fronteira desenhada ao sul de Cair Paravel. |
| 10 | `grande-rio` | `mesa-de-pedra` | terra | Fronteira desenhada a oeste do Grande Rio. |
| 11 | `grande-rio` | `lantern-waste` | terra | Fronteira pelo rio entre Grande Rio e Lantern Waste. |
| 12 | `ettinsmoor` | `harfang` | terra | Fronteira desenhada na faixa nevada. |
| 13 | `harfang` | `terras-dos-gigantes` | terra | Fronteira desenhada na faixa nevada. |
| 14 | `terras-dos-gigantes` | `passagem-do-norte` | terra | Fronteira desenhada na faixa nevada. |
| 15 | `passagem-do-norte` | `pico-gelado` | terra | Fronteira pela cordilheira/rio entre os dois. |
| 16 | `pico-gelado` | `desfiladeiro-branco` | terra | Fronteira desenhada (o Desfiladeiro fica encaixado no Pico). |
| 17 | `pico-gelado` | `lago-congelado` | terra | Fronteira curta no alto, acima do Desfiladeiro Branco. |
| 18 | `desfiladeiro-branco` | `lago-congelado` | terra | Fronteira desenhada. |
| 19 | `anvard` | `vale-verde` | terra | Fronteira desenhada. |
| 20 | `anvard` | `colinas-de-arquelandia` | terra | Fronteira desenhada a leste do castelo de Anvard. |
| 21 | `anvard` | `passagem-sul` | terra | Fronteira desenhada ao sul do castelo de Anvard. |
| 22 | `anvard` | `rio-das-colinas` | terra | Fronteira desenhada ao sul do castelo de Anvard. |
| 23 | `vale-verde` | `colinas-de-arquelandia` | terra | Fronteira desenhada. |
| 24 | `colinas-de-arquelandia` | `fortaleza-da-fronteira` | terra | Fronteira desenhada. |
| 25 | `colinas-de-arquelandia` | `rio-das-colinas` | terra | Fronteira curta desenhada no canto noroeste do Rio das Colinas. |
| 26 | `passagem-sul` | `rio-das-colinas` | terra | Fronteira desenhada. |
| 27 | `rio-das-colinas` | `fortaleza-da-fronteira` | terra | Fronteira desenhada (o rio corre até a Fortaleza). |
| 28 | `rio-das-colinas` | `campo-real` | terra | Fronteira desenhada. |
| 29 | `fortaleza-da-fronteira` | `campo-real` | terra | Fronteira desenhada. |
| 30 | `tashbaan` | `deserto-de-calormania` | terra | Fronteira desenhada. |
| 31 | `tashbaan` | `estrada-das-caravanas` | terra | Fronteira desenhada. |
| 32 | `deserto-de-calormania` | `estrada-das-caravanas` | terra | Fronteira desenhada. |
| 33 | `deserto-de-calormania` | `oasis-dourado` | terra | Fronteira desenhada. |
| 34 | `deserto-de-calormania` | `costa-sul` | terra | Fronteira desenhada ao sul do oásis do Deserto. |
| 35 | `deserto-de-calormania` | `rio-calormeno` | terra | Fronteira desenhada a oeste do rio Calormeno. |
| 36 | `oasis-dourado` | `rio-calormeno` | terra | Fronteira pelo rio Calormeno. |
| 37 | `oasis-dourado` | `costa-sul` | terra | Fronteira desenhada. |
| 38 | `estrada-das-caravanas` | `costa-sul` | terra | Fronteira desenhada. |
| 39 | `costa-sul` | `cidade-murada` | terra | Fronteira pelo rio, junto ao porto fortificado. |
| 40 | `rio-calormeno` | `cidade-murada` | terra | Mesma massa de terra; a divisa fica sob a cidade amuralhada. |
| 41 | `castelo-de-telmar` | `porto-ocidental` | terra | Fronteira curta desenhada junto à foz do rio. |
| 42 | `castelo-de-telmar` | `ruinas-de-telmar` | terra | Fronteira desenhada. |
| 43 | `porto-ocidental` | `ruinas-de-telmar` | terra | Fronteira desenhada. |
| 44 | `porto-ocidental` | `fortaleza-do-mar` | terra | Fronteira desenhada. |
| 45 | `ruinas-de-telmar` | `fortaleza-do-mar` | terra | Fronteira desenhada. |
| 46 | `ruinas-de-telmar` | `floresta-ocidental` | terra | Fronteira desenhada. |
| 47 | `fortaleza-do-mar` | `floresta-ocidental` | terra | Fronteira desenhada. |
| 48 | `fortaleza-do-mar` | `baia-dos-exilados` | terra | Fronteira desenhada. |
| 49 | `floresta-ocidental` | `baia-dos-exilados` | terra | Fronteira desenhada. |
| 50 | `floresta-ocidental` | `vale-telmarino` | terra | Fronteira desenhada. |
| 51 | `baia-dos-exilados` | `vale-telmarino` | terra | Fronteira desenhada. |
| 52 | `ilhas-solitarias` | `felimath` | mar | Rota tracejada entre as duas ilhas do norte. |
| 53 | `ilhas-solitarias` | `avra` | mar | Rota tracejada a oeste, descendo das Ilhas Solitárias até Avra. |
| 54 | `felimath` | `doorn` | mar | Rota tracejada a leste, de Felimath até Doorn. |
| 55 | `avra` | `galma` | mar | Rota tracejada a oeste, de Avra até Galma. |
| 56 | `doorn` | `galma` | mar | Rota tracejada do laço de Galma até Doorn. |
| 57 | `doorn` | `terebintia` | mar | Rota tracejada a leste, de Doorn até Terebintia. |
| 58 | `galma` | `terebintia` | mar | Rota tracejada entre Galma e Terebintia. |
| 59 | `galma` | `ilha-oriental` | mar | Rota tracejada do laço de Galma até a Ilha Oriental. |
| 60 | `terebintia` | `ilha-oriental` | mar | Rota tracejada contornando Terebintia até a Ilha Oriental. |
| 61 | `ettinsmoor` | `castelo-de-telmar` | terra | Fronteira grossa entre a neve e o Castelo de Telmar. |
| 62 | `ettinsmoor` | `ruinas-de-telmar` | terra | Fronteira grossa entre a neve e a serra das Ruínas. |
| 63 | `ettinsmoor` | `bosques-de-narnia` | terra | Fronteira curta no canto noroeste dos Bosques. |
| 64 | `harfang` | `bosques-de-narnia` | terra | Fronteira grossa (borda norte dos Bosques). |
| 65 | `harfang` | `how-de-aslan` | terra | Fronteira grossa (borda norte do How). |
| 66 | `terras-dos-gigantes` | `how-de-aslan` | terra | Fronteira grossa (borda norte do How). |
| 67 | `passagem-do-norte` | `beruna` | terra | Fronteira grossa (borda norte de Beruna). |
| 68 | `pico-gelado` | `anvard` | terra | Fronteira grossa (borda norte de Anvard). |
| 69 | `desfiladeiro-branco` | `anvard` | terra | Fronteira grossa (borda norte de Anvard). |
| 70 | `lago-congelado` | `vale-verde` | terra | Fronteira grossa (borda norte do Vale Verde). |
| 71 | `ruinas-de-telmar` | `bosques-de-narnia` | terra | Fronteira grossa a leste da serra das Ruínas. |
| 72 | `floresta-ocidental` | `bosques-de-narnia` | terra | Fronteira grossa a leste da Floresta Ocidental. |
| 73 | `floresta-ocidental` | `mesa-de-pedra` | terra | Fronteira grossa a leste da Floresta Ocidental (trecho sul). |
| 74 | `vale-telmarino` | `mesa-de-pedra` | terra | Fronteira grossa a leste do Vale Telmarino. |
| 75 | `beruna` | `anvard` | terra | Fronteira pelo grande rio que separa Nárnia de Arquelândia. |
| 76 | `cair-paravel` | `anvard` | terra | Fronteira pelo grande rio (frente ao castelo de Anvard). |
| 77 | `cair-paravel` | `passagem-sul` | terra | Fronteira pelo grande rio (trecho curto ao sul). |
| 78 | `lantern-waste` | `passagem-sul` | terra | Fronteira desenhada a leste de Lantern Waste. |
| 79 | `mesa-de-pedra` | `tashbaan` | terra | Fronteira grossa ao sul da Mesa de Pedra. |
| 80 | `mesa-de-pedra` | `deserto-de-calormania` | terra | Fronteira grossa curta no canto sudeste da Mesa de Pedra. |
| 81 | `grande-rio` | `deserto-de-calormania` | terra | Fronteira grossa ao sul do Grande Rio. |
| 82 | `lantern-waste` | `deserto-de-calormania` | terra | Fronteira grossa ao sul de Lantern Waste. |
| 83 | `lantern-waste` | `rio-calormeno` | terra | Fronteira grossa no canto sudeste de Lantern Waste. |
| 84 | `passagem-sul` | `rio-calormeno` | terra | Fronteira grossa ao sul da Passagem Sul. |
| 85 | `rio-das-colinas` | `rio-calormeno` | terra | Fronteira grossa ao sul do Rio das Colinas. |
| 86 | `baia-dos-exilados` | `tashbaan` | mar | Navio desenhado no golfo entre Telmar e Calormânia. |
| 87 | `fortaleza-da-fronteira` | `avra` | mar | A rota tracejada oeste das ilhas passa rente à costa da Fortaleza. |
| 88 | `campo-real` | `galma` | mar | Rota tracejada de Galma termina na costa de Campo Real. |
| 89 | `cidade-murada` | `ilha-oriental` | mar | Rota tracejada da Ilha Oriental segue até o navio ao largo de Cidade Murada. |

## 5. Fronteiras entre regiões (portas de entrada)

- **Reino de Nárnia** (18 ligações externas). Portas de entrada: `beruna`, `bosques-de-narnia`, `cair-paravel`, `grande-rio`, `how-de-aslan`, `lantern-waste`, `mesa-de-pedra`.
- **Terras do Norte** (10 ligações externas). Portas de entrada: `desfiladeiro-branco`, `ettinsmoor`, `harfang`, `lago-congelado`, `passagem-do-norte`, `pico-gelado`, `terras-dos-gigantes`.
- **Arquelândia** (11 ligações externas). Portas de entrada: `anvard`, `campo-real`, `fortaleza-da-fronteira`, `passagem-sul`, `rio-das-colinas`, `vale-verde`.
- **Calormânia** (9 ligações externas). Portas de entrada: `cidade-murada`, `deserto-de-calormania`, `rio-calormeno`, `tashbaan`.
- **Terras de Telmar** (7 ligações externas). Portas de entrada: `baia-dos-exilados`, `castelo-de-telmar`, `floresta-ocidental`, `ruinas-de-telmar`, `vale-telmarino`.
- **Ilhas Orientais** (3 ligações externas). Portas de entrada: `avra`, `galma`, `ilha-oriental`.

Resumo das ligações entre regiões:

| | Nárnia | Norte | Arquelândia | Calormânia | Telmar | Ilhas |
|---|---|---|---|---|---|---|
| **Nárnia** | — | 5 | 4 | 5 | 4 | 0 |
| **Norte** | 5 | — | 3 | 0 | 2 | 0 |
| **Arquelândia** | 4 | 3 | — | 2 | 0 | 2 (mar) |
| **Calormânia** | 5 | 0 | 2 | — | 1 (mar) | 1 (mar) |
| **Telmar** | 4 | 2 | 0 | 1 (mar) | — | 0 |
| **Ilhas** | 0 | 0 | 2 (mar) | 1 (mar) | 0 | — |

Leitura de jogo: Nárnia (+5) está no centro e todos os seus territórios são fronteira, então é difícil de manter. Calormânia (+5) tem 4 portas. As Ilhas (+3) têm 3 portas, todas por mar.

## 6. Rotas marítimas: decisões

- **Entre as ilhas:** o mapa desenha laços tracejados ao redor das ilhas. Cada aresta `sea` entre ilhas segue um trecho tracejado contínuo entre as duas. As rotas formam uma escada: Solitárias–Felimath no topo, Avra–Galma e Felimath–Doorn–Terebintia nas laterais, Galma–Doorn e Galma–Terebintia no meio, e Galma–Ilha Oriental e Terebintia–Ilha Oriental embaixo.
- **Ilhas ↔ continente (3 rotas):**
  - `fortaleza-da-fronteira` ↔ `avra`: o arco tracejado oeste passa rente à costa da Fortaleza da Fronteira (≈ x 1600, y 450–520), que é a "fortaleza da fronteira" voltada para o mar;
  - `campo-real` ↔ `galma`: o trecho tracejado que desce a oeste de Galma termina na costa de Campo Real (≈ 1590, 555);
  - `cidade-murada` ↔ `ilha-oriental`: o tracejado a oeste da Ilha Oriental vai até o navio desenhado ao largo da costa calormena (≈ 1520, 760).
- **Ilhas Solitárias ↔ Lago Congelado / Vale Verde: NÃO.** Nenhum tracejado toca a costa do Norte nem a do Vale Verde. O arco superior passa entre as rochas a leste do Lago, sem chegar à costa.
- **Telmar ↔ Calormânia:** `baia-dos-exilados` ↔ `tashbaan` (mar). O navio desenhado no golfo ao sul de Telmar (≈ 340, 700) fica no caminho entre a Baía dos Exilados e a costa oeste de Tashbaan. Telmar também se liga ao continente por terra (Norte e Nárnia), então a rota é um acesso a mais, não uma necessidade de conectividade.

## 7. Ligações descartadas (próximas, mas sem fronteira)

| Par | Motivo |
|---|---|
| `lago-congelado` – `anvard` | As divisas só se tocam num ponto (≈ 1342–1351, 205), cerca de 9 px. |
| `terras-dos-gigantes` – `beruna` | Encontro em ponto na junção How/Beruna/Passagem do Norte. |
| `passagem-do-norte` – `how-de-aslan` | Idem, só um ponto. |
| `pico-gelado` – `beruna` | O canto de Beruna toca a cordilheira/rio, não o Pico. Fica de fora por dúvida. |
| `oasis-dourado` – `cidade-murada` | Só ≈ 20 px de margem de rio no canto sudeste do Oásis. A ligação Oásis → Rio Calormeno → Cidade Murada já existe. |
| `campo-real` – `rio-calormeno` | Só um canto na costa, com uma enseada de água entre os dois. |
| `vale-telmarino` – `tashbaan` | Separados por um canal de água, sem rota desenhada. A rota marítima Telmar–Calormânia escolhida é a do navio (Baía ↔ Tashbaan). |
| `castelo-de-telmar` – `fortaleza-do-mar` | Porto Ocidental fica entre os dois. |
| `bosques-de-narnia` – `grande-rio` | A área do leão e a Mesa de Pedra ficam entre os dois. |
| `avra` – `doorn` | O tracejado central passa entre as duas ilhas sem ligá-las e termina no laço de Galma. |
| `ilhas-solitarias` – `lago-congelado` / `vale-verde` | Não há rota desenhada (ver seção 6). |
| `vale-verde` – `fortaleza-da-fronteira` | Colinas de Arquelândia ficam entre os dois. |

## 8. Como trocar a arte

- A arte só afeta `anchor` (posição do marcador). Regiões, territórios, conexões, cartas e regras não mudam.
- Para outra imagem com o mesmo desenho em outra escala, multiplique as âncoras pela razão de escala e atualize `artSize`.
- Para um desenho diferente, meça de novo o centro de cada rótulo e edite a coluna x/y em `TERRITORY_ROWS` (`narnia.ts`). Rode `npx vitest run src/map` (o teste confere se as âncoras estão dentro de `artSize`).
- Se a nova arte mudar fronteiras, edite `CONNECTIONS` com uma `note` justificando, atualize as tabelas deste documento e rode os testes de mapa (simetria, conectividade) e do motor.
