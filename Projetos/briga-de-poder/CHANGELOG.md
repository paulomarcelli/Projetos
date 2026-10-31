# Changelog

## [0.2.0] — 2026-10-31 — Fase 2 (primeiro combate)

### Adicionado
- Motor de luta determinístico em quadros fixos (`scripts/combat/`): andar, pular, agachar, defender (alto/baixo), golpes leve/médio/forte em pé e agachado, golpe aéreo, especial por comando, caixas de golpe e de corpo, hitstun/blockstun, dano de raspão, empurrão (com regra de parede), pausa de impacto, derrubada e levantar, combos por emenda e cancelamento em especial, redução de dano, buffer de 5 quadros, troca de golpes simultâneos.
- Rounds: melhor de 3, relógio de 90 s, vitória por nocaute ou porcentagem de vida, empate, limite de 5 rounds.
- Dois lutadores provisórios em Resources (`data/characters/`): Protótipo Rocha (lento e forte, avanço "Avalanche") e Protótipo Faísca (rápido, "Mola" invulnerável que sobe).
- Tela de luta com arena de testes, HUD (vida com rastro de dano, energia, relógio, rounds, combo, avisos), faíscas, tremor de tela (desliga com "Reduzir efeitos"), sons de impacto sintetizados.
- Pausa (Esc/P/Start ou perda de foco) com troca de adversário (jogador 2, boneco parado, boneco que defende), caixas de colisão e reinício; tela de fim com revanche.
- Teclado e controle para dois jogadores; aviso no celular de que o toque chega na Fase 3.
- "Jogar" ativado no menu.
- 53 verificações novas (110 no total), incluindo determinismo e restauração de estado.

## [0.1.0] — 2026-10-31 — Fase 1 (fundação)

### Adicionado
- Projeto Godot 4.4.1 com renderer Compatibility, base 1920×1080 (`canvas_items` + `expand`), física a 60 ticks.
- Serviços globais: PlatformInfo, Settings, InputDetector, AudioManager, SceneManager, GameManager.
- Menu inicial com layout de desktop (coluna navegável por setas/controle) e layout de toque (duas colunas, botões maiores); opções futuras desativadas e marcadas "em breve" com a fase; "Sair" oculto na Web.
- Tela de configurações (volumes, tela cheia, qualidade, reduzir efeitos, ajustes de toque para a Fase 3, restaurar padrão), salva em `user://`.
- Tela de créditos com licenças.
- Aviso "Gire o aparelho" em retrato no celular; pausa da luta quando a aba perde o foco.
- Fundo animado em shader e emblema vetorial; tema próprio com fontes OFL (Bungee, Barlow Condensed).
- Sons de interface sintetizados.
- Predefinição de exportação Web sem threads.
- 57 verificações automáticas (`tests/test_runner.tscn`).
