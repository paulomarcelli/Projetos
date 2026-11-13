# Sprites da Aurora

| Arquivo | O que é |
|---------|---------|
| `aurora_folha.png` | Folha de sprites: 6 animações, células de 384×384, uma animação por linha |
| `aurora_folha.json` | Posição de cada quadro, FPS e se a animação repete |
| `aurora_spriteframes.tres` | Recurso `SpriteFrames` do Godot 4 (usar num `AnimatedSprite2D`) |
| `previas/*.gif` | Prévias animadas sobre o fundo índigo do jogo |
| `recortes/*.png` | Cada pose original recortada, com transparência |

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
python3 ferramentas/montar_folha.py
```
Para adicionar uma pose nova: coloque a imagem em `arte/poses-originais/`, rode o recorte, meça a altura da
cabeça (tiara ao queixo) e registre em `POSES` dentro de `ferramentas/montar_folha.py`.

## Pendências
- Falta a folha do arco (pegar a flecha, puxar, mirar, soltar).
- As folhas do Gemini vieram em resolução baixa (cada quadro com ~250 px); no jogo ficam um pouco mais suaves que as poses soltas.
  Pedir as próximas folhas com menos quadros por imagem ou em resolução maior.
- O desenho das folhas tem corpo um pouco mais curto que o das poses soltas (variação do Gemini); a escala foi igualada pela cabeça.
- O rastro do golpe está desenhado junto da pose do ataque; separado, poderia ser um efeito próprio no jogo.
