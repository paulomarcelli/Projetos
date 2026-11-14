---
name: jogos
description: Orquestrador de desenvolvimento de jogos. Direciona para as skills de cada plataforma conforme o que o projeto precisa.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Desenvolvimento de jogos

> **Skill orquestradora** que traz os princípios centrais e direciona para as sub-skills especializadas.

---

## Quando usar esta skill

Você está trabalhando num projeto de desenvolvimento de jogos. Esta skill ensina os PRINCÍPIOS do desenvolvimento de jogos e indica a sub-skill certa conforme o contexto.

---

## Roteamento para as sub-skills

### Escolha da plataforma

| Se o jogo for para... | Use a sub-skill |
|------------------------|---------------|
| Navegadores (HTML5, WebGL) | `jogos/web-games` |
| Celular (iOS, Android) | `jogos/mobile-games` |
| PC (Steam, desktop) | `jogos/pc-games` |
| Óculos de VR/AR | `jogos/vr-ar` |

### Escolha da dimensão

| Se o jogo for... | Use a sub-skill |
|-------------------|---------------|
| 2D (sprites, tilemaps) | `jogos/2d-games` |
| 3D (meshes, shaders) | `jogos/3d-games` |

### Áreas especializadas

| Se você precisa de... | Use a sub-skill |
|----------------|---------------|
| GDD, balanceamento, psicologia do jogador | `jogos/game-design` |
| Multiplayer, rede | `jogos/multiplayer` |
| Estilo visual, pipeline de assets, animação | `jogos/game-art` |
| Sound design, música, áudio adaptativo | `jogos/game-audio` |

---

## Princípios centrais (todas as plataformas)

### 1. O game loop

Todo jogo, seja qual for a plataforma, segue este padrão:

```
INPUT  → Lê as ações do jogador
UPDATE → Processa a lógica do jogo (timestep fixo)
RENDER → Desenha o frame (interpolado)
```

**Regra do timestep fixo** *(passo de tempo fixo)*:
- Física/lógica: taxa fixa (ex.: 50 Hz)
- Renderização: o mais rápido possível
- Interpole entre os estados para o visual ficar suave

---

### 2. Matriz de escolha de padrões

| Padrão | Quando usar | Exemplo |
|---------|----------|---------|
| **Máquina de estados** | 3-5 estados bem definidos | Jogador: parado→andando→pulando |
| **Object pooling** *(reaproveitar objetos em vez de criar e destruir)* | Criar e destruir com frequência | Balas, partículas |
| **Observer/eventos** | Comunicação entre sistemas | Vida→atualiza a UI |
| **ECS** *(Entity Component System)* | Milhares de entidades parecidas | Unidades de RTS, partículas |
| **Command** | Desfazer, replay, rede | Gravação de input |
| **Behavior tree** *(árvore de comportamento)* | Decisões complexas de IA | IA dos inimigos |

**Regra de decisão:** comece com máquina de estados. Só adicione ECS quando o desempenho exigir.

---

### 3. Abstração de input

Abstraia o input em AÇÕES, não em teclas cruas:

```
"jump"  → Espaço, botão A do controle, toque na tela
"move"  → WASD, analógico esquerdo, joystick virtual
```

**Por quê:** permite multiplataforma e controles remapeáveis.

---

### 4. Orçamento de desempenho (60 FPS = 16,67 ms)

| Sistema | Orçamento |
|--------|--------|
| Input | 1 ms |
| Física | 3 ms |
| IA | 2 ms |
| Lógica do jogo | 4 ms |
| Renderização | 5 ms |
| Folga | 1,67 ms |

**Prioridade de otimização:**
1. Algoritmo (O(n²) → O(n log n))
2. Batching (reduzir as draw calls, os pedidos de desenho à GPU)
3. Pooling (evitar picos de GC *(coleta de lixo)*)
4. LOD (nível de detalhe conforme a distância)
5. Culling (não desenhar o que não aparece)

---

### 5. Escolha da IA pela complexidade

| Tipo de IA | Complexidade | Quando usar |
|---------|------------|----------|
| **FSM** | Simples | 3-5 estados, comportamento previsível |
| **Behavior tree** | Média | Modular, fácil para o designer |
| **GOAP** | Alta | Emergente, baseada em planejamento |
| **Utility AI** | Alta | Decisões por pontuação |

---

### 6. Estratégia de colisão

| Tipo | Ideal para |
|------|----------|
| **AABB** | Retângulos, checagens rápidas |
| **Círculo** | Objetos redondos, barato |
| **Spatial hash** | Muitos objetos de tamanho parecido |
| **Quadtree** | Mundos grandes, tamanhos variados |

---

## Antipadrões (universais)

| Não faça | Faça |
|-------|-----|
| Atualizar tudo a cada frame | Usar eventos, dirty flags *(marcar o que mudou)* |
| Criar objetos em hot loops *(trechos executados o tempo todo)* | Object pooling |
| Não guardar nada em cache | Guardar as referências em cache |
| Otimizar sem medir com profiler | Medir com profiler primeiro |
| Misturar input com lógica | Ter uma camada de abstração de input |

---

## Exemplos de roteamento

### Exemplo 1: "Quero fazer um jogo de plataforma 2D que rode no navegador"
→ Comece com `jogos/web-games` para escolher o framework
→ Depois `jogos/2d-games` para os padrões de sprite/tilemap
→ Consulte `jogos/game-design` para o level design

### Exemplo 2: "Jogo de quebra-cabeça para celular, iOS e Android"
→ Comece com `jogos/mobile-games` para o input por toque e as lojas
→ Use `jogos/game-design` para o balanceamento dos quebra-cabeças

### Exemplo 3: "Jogo de tiro em VR multiplayer"
→ `jogos/vr-ar` para conforto e imersão
→ `jogos/3d-games` para a renderização
→ `jogos/multiplayer` para a rede

---

> **Lembre-se:** jogos ótimos nascem da iteração, não da perfeição. Faça o protótipo rápido e depois dê o polimento.
