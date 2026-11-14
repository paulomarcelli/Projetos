---
name: 2d-games
description: Princípios de desenvolvimento de jogos 2D. Sprites, tilemaps, física, câmera.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento de jogos 2D

> Princípios para os sistemas de jogos 2D.

---

## 1. Sistemas de sprites

### Organização dos sprites

| Componente | Para que serve |
|-----------|---------|
| **Atlas** | Junta texturas e reduz draw calls *(pedidos de desenho à GPU)* |
| **Animação** | Sequências de frames |
| **Pivô** | Origem da rotação/escala |
| **Camadas** | Controle da ordem no eixo Z |

### Princípios de animação

- Taxa de frames: 8-24 FPS é o comum
- Comprimir e esticar (squash and stretch) para dar impacto
- Antecipação (anticipation) antes da ação
- Continuidade (follow-through) depois da ação

---

## 2. Design de tilemaps

### Pontos de atenção dos tiles

| Fator | Recomendação |
|--------|----------------|
| **Tamanho** | 16x16, 32x32, 64x64 |
| **Auto-tiling** | Use no terreno |
| **Colisão** | Formas simplificadas |

### Camadas

| Camada | Conteúdo |
|-------|---------|
| Fundo | Cenário sem interação |
| Terreno | Chão onde se anda |
| Props | Objetos interativos |
| Primeiro plano | Sobreposição com parallax |

---

## 3. Física 2D

### Formas de colisão

| Forma | Caso de uso |
|-------|----------|
| Caixa | Objetos retangulares |
| Círculo | Bolas, formas arredondadas |
| Cápsula | Personagens |
| Polígono | Formas complexas |

### Pontos de atenção da física

- Pixel-perfect vs baseado em física
- Timestep fixo *(passo de tempo fixo)* para ter consistência
- Camadas para filtrar colisões

---

## 4. Sistemas de câmera

### Tipos de câmera

| Tipo | Uso |
|------|-----|
| **Seguir** | Acompanha o jogador |
| **Look-ahead** | Antecipa o movimento |
| **Vários alvos** | Dois jogadores |
| **Por sala** | Metroidvania |

### Tremida de tela

- Duração curta (50-200 ms)
- Intensidade diminuindo
- Use com moderação

---

## 5. Padrões por gênero

### Jogo de plataforma

- Coyote time (tolerância depois de sair da beirada)
- Buffer de pulo
- Altura de pulo variável

### Visão de cima (top-down)

- Movimento em 8 direções ou livre
- Mira manual ou mira automática
- Decida se haverá rotação ou não

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Usar texturas separadas | Usar atlas |
| Usar formas de colisão complexas | Simplificar a colisão |
| Deixar a câmera tremendo | Seguir com suavidade |
| Misturar pixel-perfect com física | Escolher uma abordagem |

---

> **Lembre-se:** 2D é clareza. Cada pixel precisa comunicar.
