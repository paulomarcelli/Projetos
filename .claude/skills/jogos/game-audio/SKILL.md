---
name: game-audio
description: Princípios de áudio para jogos. Sound design, integração de música, sistemas de áudio adaptativo.
allowed-tools: Read, Glob, Grep
---

# Princípios de áudio para jogos

> Sound design e integração de música para experiências de jogo imersivas.

---

## 1. Sistema de categorias de áudio

### Definição das categorias

| Categoria | Comportamento | Exemplos |
|----------|----------|----------|
| **Música** | Em loop, crossfade, ducking (abaixar uma faixa quando outra entra) | Música de fundo (BGM), música de combate |
| **SFX** | Toca uma vez, posicionado em 3D | Passos, impactos |
| **Ambiente** | Em loop, camada de fundo | Vento, multidão, floresta |
| **UI** | Imediato, sem 3D | Cliques de botão, notificações |
| **Voz** | Prioridade, dispara o ducking | Diálogo, narrador |

### Hierarquia de prioridade

```
Quando os sons disputam canais:

1. Voz (a mais alta: sempre audível)
2. SFX do jogador (feedback essencial)
3. SFX dos inimigos (importante para o gameplay)
4. Música (clima, mas pode sofrer ducking)
5. Ambiente (a mais baixa: pode cair)
```

---

## 2. Decisões de sound design

### Como criar os SFX

| Abordagem | Quando usar | Prós e contras |
|----------|-------------|------------|
| **Gravação** | Necessidade realista | Alta qualidade, consome tempo |
| **Síntese** | Ficção científica, retrô, UI | Único, exige habilidade |
| **Samples de biblioteca** | Produção rápida | Sons comuns, licenciamento |
| **Camadas** | Sons complexos | Melhores resultados, mais trabalho |

### Estrutura das camadas

| Camada | Para que serve | Exemplo: tiro |
|-------|---------|------------------|
| **Ataque** | Transiente inicial | Clique, estalo |
| **Corpo** | Caráter principal | Estrondo, explosão |
| **Cauda** | Decaimento, sala | Reverb, eco |
| **Tempero** | O toque especial | Cápsula caindo, mecanismo |

---

## 3. Integração da música

### Sistema de estados da música

```
Estado do jogo → Resposta da música
│
├── Menu → Tema calmo, que fica em loop
├── Exploração → Ambiente, atmosférica
├── Combate detectado → Transição para tensão
├── Combate em curso → Música de batalha completa
├── Vitória → Stinger + transição calma
├── Derrota → Stinger sombrio
└── Chefe → Faixa única, com várias fases
```

### Técnicas de transição

| Técnica | Quando usar | Sensação |
|-----------|----------|------|
| **Crossfade** | Mudança suave de clima | Gradual |
| **Stinger** (trecho curto que marca um evento) | Evento imediato | Dramática |
| **Mixagem de stems** | Intensidade dinâmica | Sem emendas |
| **Sincronizado com o compasso** | Gameplay rítmico | Musical |
| **Ponto de fila** | Próxima pausa natural | Limpa |

---

## 4. Decisões de áudio adaptativo

### Parâmetros de intensidade

| Parâmetro | Afeta | Exemplo |
|-----------|---------|---------|
| **Nível de ameaça** | Intensidade da música | Número de inimigos |
| **Vida** | Filtro, reverb | Vida baixa = som abafado |
| **Velocidade** | Andamento, energia | Velocidade na corrida |
| **Ambiente** | Reverb, EQ | Caverna vs ar livre |
| **Hora do dia** | Clima, volume | Noite = mais silencioso |

### Vertical vs horizontal

| Sistema | O que muda | Ideal para |
|--------|--------------|----------|
| **Vertical (camadas)** | Adiciona/remove camadas de instrumentos | Escalar a intensidade |
| **Horizontal (segmentos)** | Trechos de música diferentes | Mudanças de estado |
| **Combinado** | Os dois | Trilhas adaptativas AAA |

---

## 5. Decisões de áudio 3D

### Espacialização

| Elemento | Posicionado em 3D? | Motivo |
|---------|----------------|--------|
| Passos do jogador | Não (ou sutil) | Sempre audível |
| Passos dos inimigos | Sim | Noção de direção |
| Tiros | Sim | Noção do combate |
| Música | Não | Clima, não diegética |
| Zona de ambiente | Sim (área) | Ambiental |
| Sons de UI | Não | Feedback da interface |

### Comportamento com a distância

| Distância | Comportamento do som |
|----------|----------------|
| **Perto** | Volume cheio, frequências completas |
| **Média** | Queda de volume, corte dos agudos |
| **Longe** | Volume baixo, filtro passa-baixa |
| **Máxima** | Silêncio ou só um indício no ambiente |

---

## 6. Pontos de atenção por plataforma

### Escolha do formato

| Plataforma | Formato recomendado | Motivo |
|----------|-------------------|--------|
| PC | OGG Vorbis, WAV | Qualidade, sem licenciamento |
| Console | Específico da plataforma | Certificação |
| Celular | MP3, AAC | Tamanho, compatibilidade |
| Web | WebM/Opus, MP3 de fallback | Suporte dos navegadores |

### Orçamento de memória

| Tipo de jogo | Orçamento de áudio | Estratégia |
|-----------|--------------|----------|
| Casual para celular | 10-50 MB | Comprimido, menos variações |
| Indie de PC | 100-500 MB | Foco na qualidade |
| AAA | 1+ GB | Qualidade total, muitas variações |

---

## 7. Hierarquia da mixagem

### Referência de equilíbrio de volume

| Categoria | Nível relativo | Observações |
|----------|----------------|-------|
| **Voz** | 0 dB (referência) | Sempre clara |
| **SFX do jogador** | -3 a -6 dB | Em destaque, mas sem agredir |
| **Música** | -6 a -12 dB | Base, sofre ducking para a voz |
| **SFX dos inimigos** | -6 a -9 dB | Importantes, mas sem dominar |
| **Ambiente** | -12 a -18 dB | Fundo sutil |

### Regras de ducking

| Quando | Abaixar o quê | Quanto |
|------|-----------|--------|
| A voz toca | Música, ambiente | -6 a -9 dB |
| Explosão | Tudo, menos a explosão | Ducking breve |
| Menu aberto | Áudio do gameplay | -3 a -6 dB |

---

## 8. Antipadrões

| Não faça | Faça |
|-------|-----|
| Tocar o mesmo som sem parar | Usar variações (3-5 por som) |
| Deixar tudo no volume máximo | Usar uma hierarquia de mixagem adequada |
| Ignorar o silêncio | O silêncio cria contraste |
| Uma só música em loop para sempre | Oferecer variedade e transições |
| Pular o áudio no protótipo | Áudio provisório faz diferença |

---

> **Lembre-se:** 50% da experiência do jogo é áudio. Um jogo no mudo perde metade da alma.
