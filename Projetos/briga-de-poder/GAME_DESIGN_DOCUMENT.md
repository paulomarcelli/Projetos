# Game Design Document — BRIGA DE PODER (v0.1)

## Conceito
Jogo de luta 2D HD, 1 contra 1, com caricaturas de figuras públicas, sátira política e humor de internet. Joga-se pelo navegador, no computador e no celular, sem instalar nada.

## Pilares
1. **Abre e joga:** uma URL, nenhuma instalação, carrega rápido.
2. **Toque de verdade:** no celular, controles e telas próprios, não a versão de PC encolhida.
3. **Luta séria, tema debochado:** regras de combate reais (quadros, hitbox, rounds) com personagens exagerados.
4. **Pronto para o online:** simulação determinística desde o primeiro golpe.

## Regras de conteúdo
- Sátira tratada como ficção; nenhum acontecimento inventado é apresentado como fato.
- O elenco é equilibrado entre campos políticos; ninguém é retratado como herói ou vilão oficial.
- Identidade visual, nomes de golpes e assets originais; nada copiado de Street Fighter, Mortal Kombat ou outros jogos.
- Pessoas sem notoriedade pública não terão imagem identificável sem autorização.

## Modos
| Modo | Fase |
|---|---|
| Jogar (local, 1x1) | 2 |
| Treinamento (boneco e IA) | 4 |
| Seleção de personagens | 5 |
| Multiplayer online | 6 |

## Combate (alvo)
Movimento, pulo, agachar, defesa, golpes leve/médio/forte, especiais por comando, supremo com barra de energia, combos e cancelamentos, hitstun, knockback, knockdown, vitória por nocaute ou tempo, melhor de 3 rounds. Simulação a 60 quadros por segundo.

## Elenco planejado
Lula, Jair Bolsonaro, Eduarda Campopiano*, Renan Santos, Tiririca, Donald Trump, Vladimir Putin, Javier Milei.
\* Notoriedade pública a confirmar antes da criação (ver TODO).
Cada um terá aparência, estilo de luta, atributos, golpes e animações próprios. Nenhum personagem foi criado ainda.

## Direção de arte
Cartoon caricatural em 2D HD, cores de cartaz de luta noturno: roxo-noite (#0D0A19, #120B26), dourado (#FFC23D), rosa-vermelho (#FF4D6D), ciano para foco e destaques (#3DE0FF). Títulos em Bungee, texto em Barlow Condensed.
