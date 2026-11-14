---
name: web-games
description: Princípios de desenvolvimento de jogos para navegador. Escolha do framework, WebGPU, otimização, PWA.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento de jogos para navegador

> Escolha do framework e princípios específicos do navegador.

---

## 1. Escolha do framework

### Árvore de decisão

```
Que tipo de jogo?
│
├── Jogo 2D
│   ├── Recursos completos de game engine? → Phaser
│   └── Força bruta de renderização? → PixiJS
│
├── Jogo 3D
│   ├── Engine completa (física, XR)? → Babylon.js
│   └── Foco em renderização? → Three.js
│
└── Híbrido / Canvas
    └── Sob medida → Canvas/WebGL puro
```

### Comparação (2025)

| Framework | Tipo | Ideal para |
|-----------|------|----------|
| **Phaser 4** | 2D | Recursos completos de jogo |
| **PixiJS 8** | 2D | Renderização, UI |
| **Three.js** | 3D | Visualizações, leve |
| **Babylon.js 7** | 3D | Engine completa, XR |

---

## 2. Adoção do WebGPU

### Suporte dos navegadores (2025)

| Navegador | Suporte |
|---------|---------|
| Chrome | ✅ Desde a v113 |
| Edge | ✅ Desde a v113 |
| Firefox | ✅ Desde a v131 |
| Safari | ✅ Desde a 18.0 |
| **Total** | **~73%** no mundo |

### Decisão

- **Projetos novos**: use WebGPU com fallback para WebGL
- **Suporte a navegadores antigos**: comece com WebGL
- **Detecção de recurso**: confira `navigator.gpu`

---

## 3. Princípios de desempenho

### Limitações do navegador

| Limitação | Estratégia |
|------------|----------|
| Sem acesso a arquivos locais | Bundling de assets, CDN |
| Aba em segundo plano desacelerada | Pausar quando escondida |
| Franquia de dados do celular | Comprimir os assets |
| Autoplay de áudio | Exigir interação do usuário |

### Prioridade de otimização

1. **Compressão de assets**: KTX2, Draco, WebP
2. **Lazy loading**: carregar sob demanda
3. **Object pooling** (reaproveitar objetos em vez de criar e destruir): evitar o GC
4. **Batching de draw calls** (juntar pedidos de desenho à GPU): reduzir as trocas de estado
5. **Web Workers**: tirar o cálculo pesado do thread principal

---

## 4. Estratégia de assets

### Formatos de compressão

| Tipo | Formato |
|------|--------|
| Texturas | KTX2 + Basis Universal |
| Áudio | WebM/Opus (fallback: MP3) |
| Modelos 3D | glTF + Draco/Meshopt |

### Estratégia de carregamento

| Etapa | O que carregar |
|-------|------|
| Inicialização | Assets essenciais, <2 MB |
| Gameplay | Streaming sob demanda |
| Segundo plano | Pré-carregar a próxima fase |

---

## 5. PWA para jogos

### Vantagens

- Jogar offline
- Instalar na tela inicial
- Modo tela cheia
- Notificações push

### Requisitos

- Service worker para o cache
- Web app manifest
- HTTPS

---

## 6. Tratamento do áudio

### Requisitos do navegador

- O contexto de áudio exige interação do usuário
- Crie o AudioContext no primeiro clique/toque
- Retome o contexto se ele estiver suspenso

### Boas práticas

- Use a Web Audio API
- Faça pooling das fontes de áudio
- Pré-carregue os sons comuns
- Comprima em WebM/Opus

---

## 7. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Carregar todos os assets de início | Carregamento progressivo |
| Ignorar a visibilidade da aba | Pausar quando escondida |
| Travar esperando o áudio carregar | Lazy loading do áudio |
| Pular a compressão | Comprimir tudo |
| Supor conexão rápida | Lidar com redes lentas |

---

> **Lembre-se:** o navegador é a plataforma mais acessível. Respeite as limitações dele.
