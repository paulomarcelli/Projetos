---
name: multiplayer
description: Princípios de desenvolvimento de jogos multiplayer. Arquitetura, rede, sincronização.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Desenvolvimento de jogos multiplayer

> Princípios de arquitetura de rede e de sincronização.

---

## 1. Escolha da arquitetura

### Árvore de decisão

```
Que tipo de multiplayer?
│
├── Competitivo / Tempo real
│   └── Servidor dedicado (autoritativo)
│
├── Cooperativo / Casual
│   └── Baseado em host (um jogador é o servidor)
│
├── Por turnos
│   └── Cliente-servidor (simples)
│
└── Massivo (MMO)
    └── Servidores distribuídos
```

### Comparação

| Arquitetura | Latência | Custo | Segurança |
|--------------|---------|------|----------|
| **Dedicado** | Baixa | Alto | Forte |
| **P2P** | Variável | Baixo | Fraca |
| **Baseado em host** | Média | Baixo | Média |

---

## 2. Princípios de sincronização

### Estado vs input

| Abordagem | O que sincronizar | Ideal para |
|----------|-----------|----------|
| **Sincronização de estado** | Estado do jogo | Simples, poucos objetos |
| **Sincronização de input** | Inputs dos jogadores | Jogos de ação |
| **Híbrida** | Os dois | A maioria dos jogos |

### Compensação de lag

| Técnica | Para que serve |
|-----------|---------|
| **Predição** | O cliente prevê o servidor |
| **Interpolação** | Suaviza os jogadores remotos |
| **Reconciliação** | Corrige as previsões erradas |
| **Compensação de lag** | Volta no tempo para detectar acertos |

---

## 3. Otimização de rede

### Redução de banda

| Técnica | Economia |
|-----------|---------|
| **Compressão delta** | Envia só o que mudou |
| **Quantização** | Reduz a precisão |
| **Prioridade** | Dados importantes primeiro |
| **Área de interesse** | Só as entidades próximas |

### Taxas de atualização

| Tipo | Taxa |
|------|------|
| Posição | 20-60 Hz |
| Vida | Quando muda |
| Inventário | Quando muda |
| Chat | Ao enviar |

---

## 4. Princípios de segurança

### Autoridade do servidor

```
Cliente: "Acertei o inimigo"
Servidor: Validar → o projétil acertou mesmo?
         → o jogador estava num estado válido?
         → o tempo era possível?
```

### Anti-cheat

| Trapaça | Prevenção |
|-------|------------|
| Speed hack | O servidor valida o movimento |
| Aimbot | O servidor valida a linha de visão |
| Duplicar itens | O servidor é dono do inventário |
| Wall hack | Não enviar dados ocultos |

---

## 5. Matchmaking

### Pontos de atenção

| Fator | Impacto |
|--------|--------|
| **Habilidade** | Partidas justas |
| **Latência** | Conexão jogável |
| **Tempo de espera** | Paciência do jogador |
| **Tamanho do grupo** | Jogar em grupo |

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Confiar no cliente | Tratar o servidor como autoridade |
| Enviar tudo | Enviar só o necessário |
| Ignorar a latência | Projetar para 100-200 ms |
| Sincronizar posições exatas | Interpolar/prever |

---

> **Lembre-se:** nunca confie no cliente. O servidor é a fonte da verdade.
