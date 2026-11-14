---
name: 3d-games
description: Princípios de desenvolvimento de jogos 3D. Renderização, shaders, física, câmeras.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento de jogos 3D

> Princípios para os sistemas de jogos 3D.

---

## 1. Pipeline de renderização

### Etapas

```
1. Processamento de vértices → Transforma a geometria
2. Rasterização → Converte em pixels
3. Processamento de fragmentos → Colore os pixels
4. Saída → Para a tela
```

### Princípios de otimização

| Técnica | Para que serve |
|-----------|---------|
| **Frustum culling** | Não renderiza o que está fora da tela |
| **Occlusion culling** | Não renderiza o que está escondido |
| **LOD** *(nível de detalhe)* | Menos detalhe à distância |
| **Batching** | Junta draw calls *(pedidos de desenho à GPU)* |

---

## 2. Princípios de shaders

### Tipos de shader

| Tipo | Para que serve |
|------|---------|
| **Vertex** | Posição, normais |
| **Fragment/pixel** | Cor, iluminação |
| **Compute** | Cálculo de uso geral |

### Quando escrever shaders próprios

- Efeitos especiais (água, fogo, portais)
- Renderização estilizada (toon, esboço)
- Otimização de desempenho
- Identidade visual única

---

## 3. Física 3D

### Formas de colisão

| Forma | Caso de uso |
|-------|----------|
| **Caixa** | Prédios, caixotes |
| **Esfera** | Bolas, checagens rápidas |
| **Cápsula** | Personagens |
| **Mesh** | Terreno (caro) |

### Princípios

- Colliders simples, visual complexo
- Filtragem por camadas
- Raycasting para linha de visão

---

## 4. Sistemas de câmera

### Tipos de câmera

| Tipo | Uso |
|------|-----|
| **Terceira pessoa** | Ação, aventura |
| **Primeira pessoa** | Imersão, FPS (tiro em primeira pessoa) |
| **Isométrica** | Estratégia, RPG |
| **Orbital** | Inspeção, editores |

### Sensação da câmera

- Seguir com suavidade (lerp)
- Evitar atravessar o cenário
- Look-ahead no movimento
- Mudar o FOV para passar velocidade

---

## 5. Iluminação

### Tipos de luz

| Tipo | Uso |
|------|-----|
| **Direcional** | Sol, lua |
| **Pontual** | Lâmpadas, tochas |
| **Spot** | Lanterna, palco |
| **Ambiente** | Iluminação de base |

### Ponto de atenção de desempenho

- Sombras em tempo real são caras
- Faça o bake *(pré-calcular)* sempre que der
- Shadow cascades para mundos grandes

---

## 6. Nível de detalhe (LOD)

### Estratégia de LOD

| Distância | Modelo |
|----------|-------|
| Perto | Detalhe completo |
| Média | 50% dos triângulos |
| Longe | 25% ou billboard |

---

## 7. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Usar mesh colliders em todo lugar | Usar formas simples |
| Usar sombras em tempo real no celular | Usar sombras com bake ou blob shadows |
| Usar um LOD só para todas as distâncias | Usar LOD por distância |
| Deixar shaders sem otimizar | Medir com profiler e simplificar |

---

> **Lembre-se:** 3D é ilusão. Crie a impressão de detalhe, não o detalhe em si.
