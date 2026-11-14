---
name: game-art
description: Princípios de arte para jogos. Escolha do estilo visual, pipeline de assets, fluxo de animação.
allowed-tools: Read, Glob, Grep
---

# Princípios de arte para jogos

> Pensamento de design visual para jogos: escolha do estilo, pipelines de assets e direção de arte.

---

## 1. Escolha do estilo de arte

### Árvore de decisão

```
Que sensação o jogo deve passar?
│
├── Nostálgico / Retrô
│   ├── Paleta limitada? → Pixel art
│   └── Cara de desenhado à mão? → Vetor / estilo Flash
│
├── Realista / Imersivo
│   ├── Orçamento alto? → PBR 3D
│   └── Realismo estilizado? → Texturas pintadas à mão
│
├── Acessível / Casual
│   ├── Formas limpas? → Flat / Minimalista
│   └── Sensação suave? → Gradiente / Sombras suaves
│
└── Único / Experimental
    └── Defina um guia de estilo próprio
```

### Matriz de comparação de estilos

| Estilo | Velocidade de produção | Habilidade exigida | Escalabilidade | Ideal para |
|-------|------------------|-------------|-------------|----------|
| **Pixel art** | Média | Média | Difícil de contratar | Indie, retrô |
| **Vetor/Flat** | Rápida | Baixa | Fácil | Celular, casual |
| **Pintado à mão** | Lenta | Alta | Média | Fantasia, estilizado |
| **PBR 3D** | Lenta | Alta | Pipeline AAA | Jogos realistas |
| **Low-poly** | Rápida | Média | Fácil | Indie 3D |
| **Cel-shaded** | Média | Média | Média | Anime, desenho animado |

---

## 2. Decisões de pipeline de assets

### Pipeline 2D

| Etapa | Opções de ferramenta | Resultado |
|-------|--------------|--------|
| **Conceito** | Papel, Procreate, Photoshop | Folha de referência |
| **Criação** | Aseprite, Photoshop, Krita | Sprites individuais |
| **Atlas** | TexturePacker, Aseprite | Spritesheet |
| **Animação** | Spine, DragonBones, quadro a quadro | Dados de animação |
| **Integração** | Importação na engine | Assets prontos para o jogo |

### Pipeline 3D

| Etapa | Opções de ferramenta | Resultado |
|-------|--------------|--------|
| **Conceito** | Arte 2D, blockout | Referência |
| **Modelagem** | Blender, Maya, 3ds Max | Mesh high-poly |
| **Retopologia** | Blender, ZBrush | Mesh pronta para o jogo |
| **UV/Texturização** | Substance Painter, Blender | Mapas de textura |
| **Rigging** | Blender, Maya | Rig de esqueleto |
| **Animação** | Blender, Maya, Mixamo | Clipes de animação |
| **Exportação** | FBX, glTF | Pronto para a engine |

---

## 3. Decisões de teoria das cores

### Escolha da paleta

| Objetivo | Estratégia | Exemplo |
|------|----------|---------|
| **Harmonia** | Complementares ou análogas | Jogos de natureza |
| **Contraste** | Diferenças fortes de saturação | Jogos de ação |
| **Clima** | Temperatura quente/fria | Terror, aconchegante |
| **Legibilidade** | Contraste de valor acima de matiz | Clareza do gameplay |

### Princípios de cor

- **Hierarquia:** os elementos importantes devem saltar aos olhos
- **Consistência:** o mesmo objeto = a mesma família de cores
- **Contexto:** as cores parecem diferentes conforme o fundo
- **Acessibilidade:** não dependa só da cor

---

## 4. Princípios de animação

### Os 12 princípios (aplicados a jogos)

| Princípio | Aplicação no jogo |
|-----------|------------------|
| **Comprimir e esticar (squash & stretch)** | Arcos de pulo, impactos |
| **Antecipação** | Preparação antes do ataque |
| **Encenação** | Silhuetas claras |
| **Continuidade** | Cabelo e capa depois do movimento |
| **Aceleração e desaceleração** | Easing nas transições |
| **Arcos** | Trajetórias naturais de movimento |
| **Ação secundária** | Respirar, piscar |
| **Timing** | Número de frames = peso/velocidade |
| **Exagero** | Legível à distância |
| **Apelo** | Design marcante |

### Guia de número de frames

| Tipo de ação | Frames típicos | Sensação |
|-------------|----------------|------|
| Respiração parada (idle) | 4-8 | Sutil |
| Ciclo de caminhada | 6-12 | Suave |
| Ciclo de corrida | 4-8 | Enérgica |
| Ataque | 3-6 | Seca e rápida |
| Morte | 8-16 | Dramática |

---

## 5. Decisões de resolução e escala

### Resolução 2D por plataforma

| Plataforma | Resolução base | Escala dos sprites |
|----------|-----------------|--------------|
| Celular | 1080p | Personagens de 64-128 px |
| Desktop | 1080p-4K | Personagens de 128-256 px |
| Pixel art | 320x180 a 640x360 | Personagens de 16-32 px |

### Regra da consistência

Escolha uma unidade base e não saia dela:
- Pixel art: trabalhe em 1x e amplie (nunca reduza)
- Arte HD: defina o DPI e mantenha a proporção
- 3D: 1 unidade = 1 metro (padrão do mercado)

---

## 6. Organização dos assets

### Convenção de nomes

```
[type]_[object]_[variant]_[state].[ext]

Exemplos:
spr_player_idle_01.png
tex_stone_wall_normal.png
mesh_tree_oak_lod2.fbx
```

### Princípio da estrutura de pastas

```
assets/
├── characters/
│   ├── player/
│   └── enemies/
├── environment/
│   ├── props/
│   └── tiles/
├── ui/
├── effects/
└── audio/
```

---

## 7. Antipadrões

| Não faça | Faça |
|-------|-----|
| Misturar estilos de arte sem critério | Definir e seguir um guia de estilo |
| Trabalhar só na resolução final | Criar na resolução de origem |
| Ignorar a legibilidade da silhueta | Testar na distância do gameplay |
| Detalhar demais o fundo | Concentrar o detalhe na área do jogador |
| Pular o teste de cores | Testar na tela de destino |

---

> **Lembre-se:** a arte serve ao gameplay. Se não ajuda o jogador, é enfeite.
