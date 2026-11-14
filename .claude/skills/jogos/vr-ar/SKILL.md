---
name: vr-ar
description: Princípios de desenvolvimento em VR/AR (realidade virtual e aumentada). Conforto, interação, requisitos de desempenho.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento em VR/AR

> Princípios de experiências imersivas.

---

## 1. Escolha da plataforma

### Plataformas de VR

| Plataforma | Caso de uso |
|----------|----------|
| **Quest** | Autônomo, sem fio |
| **PCVR** | Alta fidelidade |
| **PSVR** | Mercado de console |
| **WebXR** | No navegador |

### Plataformas de AR

| Plataforma | Caso de uso |
|----------|----------|
| **ARKit** | Dispositivos iOS |
| **ARCore** | Dispositivos Android |
| **WebXR** | AR no navegador |
| **HoloLens** | Empresas |

---

## 2. Princípios de conforto

### Prevenção do enjoo de movimento

| Causa | Solução |
|-------|----------|
| **Locomoção** | Teleporte, giro em etapas (snap turn) |
| **FPS baixo** | Manter 90 FPS |
| **Tremor de câmera** | Evitar ou reduzir ao mínimo |
| **Aceleração brusca** | Movimento gradual |

### Opções de conforto

- Vinheta durante o movimento
- Giro em etapas vs giro contínuo
- Modos sentado vs em pé
- Calibração de altura

---

## 3. Requisitos de desempenho

### Metas

| Plataforma | FPS | Resolução |
|----------|-----|------------|
| Quest 2 | 72-90 | 1832x1920 |
| Quest 3 | 90-120 | 2064x2208 |
| PCVR | 90 | 2160x2160+ |
| PSVR2 | 90-120 | 2000x2040 |

### Orçamento por frame

- VR exige tempos de frame constantes
- Um único frame perdido = tremida visível (judder)
- 90 FPS = orçamento de 11,11 ms

---

## 4. Princípios de interação

### Interação com controle

| Tipo | Uso |
|------|-----|
| **Apontar + clicar** | UI, objetos distantes |
| **Agarrar** | Manipulação |
| **Gesto** | Magia, ações especiais |
| **Físico** | Arremessar, balançar |

### Rastreamento das mãos

- Mais imersivo, mas menos preciso
- Bom para: social, casual
- Difícil para: ação, precisão

---

## 5. Design espacial

### Escala do mundo

- 1 unidade = 1 metro (essencial)
- Os objetos precisam parecer do tamanho certo
- Teste com medidas reais

### Pistas de profundidade

| Pista | Importância |
|-----|------------|
| Estéreo | Profundidade principal |
| Paralaxe de movimento | Secundária |
| Sombras | Apoio no chão |
| Oclusão | Camadas |

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Mover a câmera sem o jogador | Deixar o jogador controlar a câmera |
| Cair abaixo de 90 FPS | Manter a taxa de frames |
| Usar texto de UI minúsculo | Usar texto grande e legível |
| Ignorar o comprimento do braço | Ajustar a escala ao alcance do jogador |

---

> **Lembre-se:** conforto não é opcional. Jogador enjoado não joga.
