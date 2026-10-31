# Changelog

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
