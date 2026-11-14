---
name: mobile-games
description: Princípios de desenvolvimento de jogos para celular. Input por toque, bateria, desempenho, lojas de apps.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Desenvolvimento de jogos para celular

> Limitações da plataforma e princípios de otimização.

---

## 1. Pontos de atenção da plataforma

### Principais limitações

| Limitação | Estratégia |
|------------|----------|
| **Input por toque** | Áreas de toque grandes, gestos |
| **Bateria** | Limitar o uso de CPU/GPU |
| **Temperatura** | Reduzir o ritmo quando esquentar |
| **Tamanho de tela** | UI responsiva |
| **Interrupções** | Pausar ao ir para segundo plano |

---

## 2. Princípios de input por toque

### Toque vs controle

| Toque | Desktop/console |
|-------|-----------------|
| Impreciso | Preciso |
| A mão cobre a tela | Nada cobre a tela |
| Poucos botões | Muitos botões |
| Gestos disponíveis | Botões/analógicos |

### Boas práticas

- Alvo de toque mínimo: 44x44 pontos
- Feedback visual ao tocar
- Evite exigir timing preciso
- Suporte retrato e paisagem

---

## 3. Metas de desempenho

### Controle de temperatura

| Ação | Gatilho |
|--------|---------|
| Reduzir a qualidade | Aparelho morno |
| Limitar o FPS | Aparelho quente |
| Pausar efeitos | Temperatura crítica |

### Otimização de bateria

- 30 FPS muitas vezes basta
- Suspenda o processamento quando pausado
- Use o mínimo de GPS/rede
- O modo escuro economiza bateria em telas OLED

---

## 4. Requisitos das lojas de apps

### iOS (App Store)

| Requisito | Observação |
|-------------|------|
| Rótulos de privacidade | Obrigatório |
| Exclusão de conta | Se existir criação de conta |
| Capturas de tela | Para todos os tamanhos de aparelho |

### Android (Google Play)

| Requisito | Observação |
|-------------|------|
| Nível desejado da API | SDK do ano atual |
| 64 bits | Obrigatório |
| Android App Bundle (AAB) | Recomendado |

---

## 5. Modelos de monetização

| Modelo | Ideal para |
|-------|----------|
| **Premium** | Jogos de qualidade, público fiel |
| **Grátis + compras no app (IAP)** | Casuais, baseados em progressão |
| **Anúncios** | Hipercasuais, alto volume |
| **Assinatura** | Atualizações de conteúdo, multiplayer |

---

## 6. Antipadrões

| ❌ Não faça | ✅ Faça |
|----------|-------|
| Usar controles de desktop no celular | Projetar para o toque |
| Ignorar o consumo de bateria | Monitorar a temperatura |
| Forçar a paisagem | Respeitar a preferência do jogador |
| Manter a rede sempre ligada | Guardar em cache e sincronizar |

---

> **Lembre-se:** o celular é a plataforma mais limitada. Respeite a bateria e a atenção do jogador.
