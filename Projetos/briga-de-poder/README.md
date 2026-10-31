# BRIGA DE PODER

Jogo de luta 2D 1 contra 1, satírico, feito em **Godot 4.4 (GDScript)** para rodar **direto no navegador**, no computador e no celular.

> Obra de ficção e sátira. Os personagens são caricaturas de figuras públicas e nada do que acontece no jogo é real.

## Estado atual: Fase 1 (fundação) concluída

| Funciona hoje | Ainda não existe |
|---|---|
| Menu inicial com layout próprio para desktop e para toque | Combate (Fase 2) |
| Configurações salvas no navegador (volume, tela cheia, qualidade, reduzir efeitos) | Controles de toque na luta (Fase 3) |
| Créditos com licenças | Personagens e seleção (Fases 4 e 5) |
| Detecção automática de teclado, controle ou toque | Multiplayer online (Fase 6) |
| Aviso para girar o celular e pausa quando a aba perde o foco | |
| Exportação Web sem threads (funciona em qualquer hospedagem estática) | |

As opções Jogar, Multiplayer, Treinamento e Personagens aparecem no menu **desativadas e marcadas "em breve"**, com a fase em que chegam.

## Requisitos

- Godot **4.4.1-stable** (versão usada e testada). Outras 4.4.x devem funcionar.
- Modelos de exportação (export templates) da mesma versão, para gerar a versão Web.
- Python 3 (só para servir a pasta localmente) e um navegador com WebGL 2.

## Rodar

```bash
# abrir no editor
godot --path . -e

# rodar o jogo nativo (útil para depurar)
godot --path .

# testes automáticos (sem janela); sai com código 1 se algo falhar
# num clone novo, rode o --import duas vezes: na primeira o Godot avisa "No loader found"
# porque o tema é lido antes de as fontes serem importadas; a segunda sai limpa
godot --headless --path . --import
godot --headless --path . --import
godot --headless --path . res://tests/test_runner.tscn
```

## Gerar e testar a versão Web

```bash
mkdir -p build/web
godot --headless --path . --export-release "Web" build/web/index.html
cd build/web && python3 -m http.server 8000
# abrir http://localhost:8000
```

A exportação usa a variante **sem threads**, então **não** precisa dos cabeçalhos COOP/COEP: funciona em GitHub Pages, Netlify, itch.io ou qualquer servidor de arquivos. O servidor só precisa entregar `.wasm` com o tipo `application/wasm` (o `http.server` do Python já faz isso).

Instalar os modelos de exportação sem o editor: baixe `Godot_v4.4.1-stable_export_templates.tpz` da página de releases do Godot, descompacte e copie o conteúdo da pasta `templates/` para `~/.local/share/godot/export_templates/4.4.1.stable/` (Linux).

### Testes no navegador

`tests/browser/shot.js` (capturas e cliques) e `tests/browser/rotate.js` (giro do celular) usam Playwright com Chromium, com a pasta `build/web` servida em `http://127.0.0.1:8765`:

```bash
node tests/browser/shot.js menu 1920 1080 0     # desktop
node tests/browser/shot.js celular 844 390 1    # celular deitado (emulação Pixel 7, toque)
node tests/browser/rotate.js                    # abre em pé e gira para deitado
```

Capturas da Fase 1 em `docs/screenshots/`.

## Controles do menu

- **Teclado:** setas para navegar, Enter para confirmar, Esc para voltar.
- **Controle:** direcional ou analógico, botão A/Cruz para confirmar, B/Círculo para voltar.
- **Toque:** tocar nos botões.

## Estrutura

```
project.godot            configuração (renderer Compatibility, 1920×1080, autoloads)
export_presets.cfg       predefinição de exportação Web
assets/fonts, assets/ui  fontes (OFL), tema e ícone
scenes/menus/            menu inicial, configurações, créditos
scripts/core/            Settings, SceneManager, GameManager
scripts/platform/        PlatformInfo (Web, celular, toque, orientação)
scripts/input/           InputDetector (teclado, controle ou toque)
scripts/audio/           AudioManager (sons de interface sintetizados)
scripts/ui/              scripts das telas
shaders/                 fundo animado do menu
tests/                   testes automáticos
```

Estudo de mecânicas do gênero (regras e testes de aceitação para as Fases 2–6): [docs/research/re-street-fighter-ii-snes/REPORT.html](docs/research/re-street-fighter-ii-snes/REPORT.html)

Documentos: [ARCHITECTURE.md](ARCHITECTURE.md) · [ROADMAP.md](ROADMAP.md) · [GAME_DESIGN_DOCUMENT.md](GAME_DESIGN_DOCUMENT.md) · [CHANGELOG.md](CHANGELOG.md) · [TODO.md](TODO.md)

## Licenças de terceiros

- Godot Engine — MIT.
- Fontes Bungee e Barlow Condensed — SIL Open Font License 1.1 (textos em `assets/fonts/`).
- Sons de interface — gerados pelo próprio código.
