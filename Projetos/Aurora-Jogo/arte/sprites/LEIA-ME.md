# Sprites da Aurora

| Arquivo | O que é |
|---------|---------|
| `aurora_folha.png` | Folha de sprites: 12 animações, células de 384×384, 8 quadros por linha em sequência |
| `aurora_folha.json` | Posição de cada quadro, FPS e se a animação repete |
| `aurora_spriteframes.tres` | Recurso `SpriteFrames` do Godot 4 (usar num `AnimatedSprite2D`) |
| `previas/*.gif` | Prévias animadas sobre o fundo índigo do jogo |
| `recortes/*.png` | Cada pose original recortada, com transparência |
| `flecha/*.png` | Flecha como projétil separado: voando, voando com rastro, cravada |
| `aurora_folha_cabelo.png` | Pesos do cabelo de cada quadro (1/4 da resolução; `ferramentas/pesos_cabelo.py`) |

**Âncora:** pés no centro inferior da célula (y = 372); a cambalhota gira em torno do centro.
**Escala:** igualada pela altura da cabeça (70 px no jogo).

## Animações
| Nome | Quadros | FPS | Repete | Origem |
|------|---------|-----|--------|--------|
| `parada` | 8 | 6 | sim | 5 poses da folha 1, em vai e volta (respiração) |
| `correndo` | 8 | 12 | sim | Ciclo de corrida da folha 1 |
| `pulo` | 3 | 12 | não | Folha 2: agachar, subir, topo |
| `queda` | 1 | 8 | sim | Folha 2 |
| `aterrissar` | 2 | 12 | não | Folha 2 + volta à pose parada |
| `esquiva` | 4 | 14 | não | Rolamento da folha 2 |
| `arco_preparar` | 4 | 10 | não | Folha do arco v2: tirar a flecha, jogar o cabelo, encaixar, erguer (pegada fechada) |
| `arco_atirar` | 5 | 12 | não | Folha do arco v2: puxar, mirar (2 quadros), soltar, depois do tiro |
| `sentar` | 4 | 6 | não | Folha "sentando": de pé, agacha, apoia a mão, sentada com o arco no chão |
| `sentada` | 12 | 3 | sim | Folha "sentada" (3 quadros): inspira, expira e pisca, em sequência longa |
| `levantar` | 4 | 7 | não | `sentar` ao contrário |
| `ataque_lamina` | 4 | 14 | não | 1 pose + preparação e avanço por código |
| `cambalhota` | 8 | 16 | sim | 1 pose girada 360° (Salto da Lua) |
| `dano` | 4 | 12 | não | Pose parada + piscada branca e vermelha |
| `vitoria` | 4 | 8 | sim | 1 pose + pulinhos por código |

## Origem (registro de arte)
- Poses originais: geradas pelo autor do projeto com IA (Google Gemini) a partir da ficha da Aurora
  (`arte/referencias/aurora-conceito-01.jpg`), em `arte/poses-originais/` (imagens soltas e duas folhas).
- Recorte, separação das folhas, escala, alinhamento e quadros extras: `ferramentas/recortar.py`,
  `ferramentas/fatiar_folha.py` e `ferramentas/montar_folha.py`.
- Conteúdo gerado por IA: declarar ao publicar (ex.: questionário de conteúdo de IA da Steam).

## Refazer a folha
```bash
python3 ferramentas/recortar.py arte/poses-originais/aurora_*.webp --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_parada_corrida.webp --nomes parada:5,correndo:8 --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_pulo_esquiva.webp --nomes pulo:5,esquiva:4 --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_arco_preparar_v2.webp --nomes arco2_preparar:4 --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_arco_atirar_v2.webp --nomes arco2_atirar:4 --saida arte/sprites/recortes
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_sentar.webp --nomes sentar:4 --saida arte/sprites/recortes --separar 3
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_sentada.webp --nomes sentada:3 --saida arte/sprites/recortes
python3 ferramentas/fatiar_sombra.py arte/poses-originais/folha_sombra.png   # criatura (arte/sprites/sombra/)
python3 ferramentas/fatiar_folha.py arte/poses-originais/folha_flecha.png --nomes flecha:3 --saida arte/sprites/recortes
python3 ferramentas/montar_folha.py
python3 ferramentas/limpar_bordas.py arte/sprites/aurora_folha.png
python3 ferramentas/pesos_cabelo.py
```
Para adicionar uma pose nova: coloque a imagem em `arte/poses-originais/`, rode o recorte, meça a altura da
cabeça (tiara ao queixo) e registre em `POSES` dentro de `ferramentas/montar_folha.py`.

## Pendências
- As folhas do arco v2 ainda são três-quartos (mais de lado que as antigas, que continuam em `poses-originais/`).
- O rastro da flecha era quase branco e saiu com o fundo: fazer o rastro por código no jogo.
- As folhas do Gemini vieram em resolução baixa (cada quadro com ~250 px); no jogo ficam um pouco mais suaves que as poses soltas.
  Pedir as próximas folhas com menos quadros por imagem ou em resolução maior.
- O desenho das folhas tem corpo um pouco mais curto que o das poses soltas (variação do Gemini); a escala foi igualada pela cabeça.
- O rastro do golpe está desenhado junto da pose do ataque; separado, poderia ser um efeito próprio no jogo.
