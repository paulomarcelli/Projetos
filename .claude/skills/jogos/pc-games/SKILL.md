---
name: pc-games
description: Princípios de desenvolvimento de jogos para PC e console. Escolha da engine, recursos de plataforma, estratégias de otimização.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento de jogos para PC/console

> Escolha da engine e princípios específicos de cada plataforma.

---

## 1. Escolha da engine

### Árvore de decisão

```
O que você está construindo?
│
├── Jogo 2D
│   ├── Código aberto é importante? → Godot
│   └── Equipe/assets grandes? → Unity
│
├── Jogo 3D
│   ├── Qualidade visual AAA? → Unreal
│   ├── Multiplataforma é prioridade? → Unity
│   └── Indie/código aberto? → Godot 4
│
└── Necessidades específicas
    ├── Desempenho com DOTS? → Unity
    ├── Nanite/Lumen? → Unreal
    └── Leve? → Godot
```

### Comparação

| Fator | Unity 6 | Godot 4 | Unreal 5 |
|--------|---------|---------|----------|
| 2D | Bom | Excelente | Limitado |
| 3D | Bom | Bom | Excelente |
| Aprendizado | Médio | Fácil | Difícil |
| Custo | Participação na receita | Grátis | 5% após US$ 1 milhão |
| Equipe | Qualquer | Solo a média | Média a grande |

---

## 2. Recursos de plataforma

### Integração com a Steam

| Recurso | Para que serve |
|---------|---------|
| Conquistas | Metas do jogador |
| Steam Cloud | Progresso entre dispositivos |
| Placares | Competição |
| Oficina | Mods dos usuários |
| Rich Presence | Mostrar o status no jogo |

### Requisitos dos consoles

| Plataforma | Certificação |
|----------|--------------|
| PlayStation | Conformidade com o TRC |
| Xbox | Conformidade com o XR |
| Nintendo | Lotcheck |

---

## 3. Suporte a controle

### Abstração do input

```
Mapeie AÇÕES, não botões:
- "confirm" → A (Xbox), ✕ (PS), B (Nintendo)
- "cancel" → B (Xbox), ○ (PS), A (Nintendo)
```

### Feedback háptico

| Intensidade | Uso |
|-----------|-----|
| Leve | Feedback de UI |
| Média | Impactos |
| Forte | Eventos importantes |

---

## 4. Otimização de desempenho

### Profiling primeiro

| Engine | Ferramenta |
|--------|------|
| Unity | Profiler Window |
| Godot | Debugger → Profiler |
| Unreal | Unreal Insights |

### Gargalos comuns

| Gargalo | Solução |
|------------|----------|
| Draw calls (pedidos de desenho à GPU) | Batching, atlas |
| Picos de GC (coleta de lixo) | Object pooling (reaproveitar objetos em vez de criar e destruir) |
| Física | Colliders mais simples |
| Shaders | Shaders com LOD (nível de detalhe) |

---

## 5. Princípios específicos de cada engine

### Unity 6

- DOTS para sistemas em que o desempenho é crítico
- Compilador Burst para os hot paths (trechos executados o tempo todo)
- Addressables para streaming de assets

### Godot 4

- GDScript para iterar rápido
- C# para lógica complexa
- Signals para desacoplar

### Unreal 5

- Blueprint para os designers
- C++ para desempenho
- Nanite para ambientes high-poly
- Lumen para iluminação dinâmica

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Escolher a engine pelo hype | Escolher pelas necessidades do projeto |
| Ignorar as diretrizes da plataforma | Estudar os requisitos de certificação |
| Fixar os botões de input no código | Abstrair em ações |
| Pular o profiling | Fazer profiling cedo e sempre |

---

> **Lembre-se:** a engine é uma ferramenta. Domine os princípios e depois se adapte a qualquer engine.
