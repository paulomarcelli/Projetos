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
| `correndo_provisorio` | 4 | 10 | sim | 1 pose + balanço por código. **Trocar por 6–8 poses reais de corrida** |
| `ataque_lamina` | 4 | 14 | não | 1 pose + preparação e avanço por código |
| `pulo` | 3 | 12 | não | 1 pose + achatar e esticar por código |
| `cambalhota` | 8 | 16 | sim | 1 pose girada 360° (Salto da Lua) |
| `dano` | 4 | 12 | não | pose de corrida + piscada branca e vermelha |
| `vitoria` | 4 | 8 | sim | 1 pose + pulinhos por código |

## Origem (registro de arte)
- Poses originais: geradas pelo autor do projeto com IA (Google Gemini) a partir da ficha da Aurora
  (`arte/referencias/aurora-conceito-01.jpg`), em `arte/poses-originais/`.
- Recorte, escala, alinhamento e quadros extras: `ferramentas/recortar.py` e `ferramentas/montar_folha.py`.
- Conteúdo gerado por IA: declarar ao publicar (ex.: questionário de conteúdo de IA da Steam).

## Refazer a folha
```bash
python3 ferramentas/recortar.py arte/poses-originais/*.webp --saida arte/sprites/recortes
python3 ferramentas/montar_folha.py
```
Para adicionar uma pose nova: coloque a imagem em `arte/poses-originais/`, rode o recorte, meça a altura da
cabeça (tiara ao queixo) e registre em `POSES` dentro de `ferramentas/montar_folha.py`.

## Pendências
- Pulo e vitória estão **de frente**; no jogo (visão lateral) o ideal é o pulo **de perfil**.
- Faltam poses: parada de perfil, corrida (6–8 quadros), queda, puxar e atirar com o arco, esquiva.
- O rastro do golpe está desenhado junto da pose do ataque; separado, poderia ser um efeito próprio no jogo.
- As penas das flechas vieram coloridas; a ficha pede cinza e prata.
