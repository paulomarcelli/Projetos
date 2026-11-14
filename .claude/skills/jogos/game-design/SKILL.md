---
name: game-design
description: Princípios de game design. Estrutura do GDD, balanceamento, psicologia do jogador, progressão.
allowed-tools: Read, Glob, Grep
---

# Princípios de game design

> Pensamento de design para jogos envolventes.

---

## 1. Design do loop principal

### O teste dos 30 segundos

```
Todo jogo precisa de um loop divertido de 30 segundos:
1. AÇÃO → O jogador faz algo
2. FEEDBACK → O jogo responde
3. RECOMPENSA → O jogador se sente bem
4. REPETIR
```

### Exemplos de loop

| Gênero | Loop principal |
|-------|-----------|
| Jogo de plataforma | Correr → Pular → Aterrissar → Coletar |
| Jogo de tiro | Mirar → Atirar → Abater → Pegar o loot |
| Quebra-cabeça | Observar → Pensar → Resolver → Avançar |
| RPG | Explorar → Lutar → Subir de nível → Equipar |

---

## 2. Documento de game design (GDD)

### Seções essenciais

| Seção | Conteúdo |
|---------|---------|
| **Pitch** | Descrição em uma frase |
| **Loop principal** *(core loop)* | 30 segundos de gameplay |
| **Mecânicas** | Como os sistemas funcionam |
| **Progressão** | Como o jogador avança |
| **Estilo de arte** | Direção visual |
| **Áudio** | Direção sonora |

### Princípios

- Mantenha o documento vivo (atualize sempre)
- Imagens ajudam a comunicar
- Menos é mais (comece pequeno)

---

## 3. Psicologia do jogador

### Tipos de motivação

| Tipo | Movido por |
|------|-----------|
| **Conquistador (Achiever)** | Metas, completar tudo |
| **Explorador (Explorer)** | Descobertas, segredos |
| **Socializador (Socializer)** | Interação, comunidade |
| **Assassino (Killer)** | Competição, domínio |

### Esquemas de recompensa

| Esquema | Efeito | Uso |
|----------|--------|-----|
| **Fixo** | Previsível | Recompensas por marco |
| **Variável** | Viciante | Drops de loot |
| **Por proporção** | Baseado em esforço | Jogos de grind |

---

## 4. Balanceamento da dificuldade

### Estado de flow

```
Difícil demais → Frustração → Desiste
Fácil demais → Tédio → Desiste
Na medida → Flow → Engajamento
```

### Estratégias de balanceamento

| Estratégia | Como |
|----------|-----|
| **Dinâmica** | Ajusta à habilidade do jogador |
| **Escolha** | Deixa o jogador escolher |
| **Acessibilidade** | Opções para todos |

---

## 5. Design de progressão

### Tipos de progressão

| Tipo | Exemplo |
|------|---------|
| **Habilidade** | O jogador fica melhor |
| **Poder** | O personagem fica mais forte |
| **Conteúdo** | Novas áreas são liberadas |
| **História** | A narrativa avança |

### Princípios de ritmo

- Vitórias cedo (fisgue rápido)
- Aumente o desafio aos poucos
- Momentos de descanso entre os de intensidade
- Escolhas com significado

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Projetar isolado | Fazer playtest o tempo todo |
| Polir antes de ser divertido | Prototipar primeiro |
| Impor um único jeito de jogar | Dar espaço à expressão do jogador |
| Punir em excesso | Recompensar o progresso |

---

> **Lembre-se:** a diversão se descobre iterando, não se projeta no papel.
