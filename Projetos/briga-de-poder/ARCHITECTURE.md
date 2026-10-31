# Arquitetura — BRIGA DE PODER

A plataforma principal é a **Web**. Cada decisão abaixo parte do que o navegador permite, e só depois do desktop.

## 1. Decisões da Fase 1

| Decisão | Escolha | Por quê |
|---|---|---|
| Engine | Godot 4.4.1-stable, GDScript | Versão estável validada no ambiente; exportação Web madura. |
| Renderer | **Compatibility** (WebGL 2) | Único renderer suportado na Web; o mesmo no celular e no desktop evita diferenças visuais. |
| Threads na Web | **Desativadas** (`variant/thread_support=false`) | Sem threads não há exigência de `SharedArrayBuffer`, portanto nem dos cabeçalhos COOP/COEP. Roda em qualquer hospedagem estática e no Safari do iOS. Custo: áudio e carregamento rodam no laço principal. Para um jogo 2D isso é aceitável. |
| Resolução | Base 1920×1080, `stretch=canvas_items`, `aspect=expand` | A interface é desenhada uma vez em 1080p e escala. `expand` aproveita telas mais largas (celulares 19,5:9) sem faixas pretas; a arena futura terá área segura 16:9. |
| Canvas | `canvas_resize_policy=2` (adaptativo) | O canvas segue o tamanho da janela do navegador e a densidade da tela. |
| Orientação | Paisagem; em retrato no celular, aviso "Gire o aparelho" e jogo pausado | O navegador nem sempre permite travar a orientação, então o jogo trata o caso em vez de presumir. |
| Persistência | `ConfigFile` em `user://settings.cfg` | Na Web, o Godot grava `user://` no IndexedDB do site; nada de cookies ou servidor. |
| Áudio de interface | Sintetizado em tempo de execução | Zero bytes extras no carregamento e nenhuma licença de terceiros. O áudio só toca após o primeiro gesto (regra de autoplay dos navegadores). |
| Fontes | Bungee (títulos) e Barlow Condensed (texto), OFL | Identidade de "cartaz de luta" própria e legível em telas pequenas. |
| Física | 60 ticks/s, até 4 passos por quadro | Base para a simulação de luta em quadros fixos (ver seção 3). |
| Interface | Tema único (`assets/ui/theme.tres`), botões inclinados, foco visível em ciano | Navegação completa por teclado e controle; o foco nunca some. |

## 2. Autoloads (serviços globais)

Carregados nesta ordem, cada um com uma responsabilidade:

1. **PlatformInfo** — Web? celular? tela de toque? retrato? pode fechar o jogo? Usa as feature tags `web`, `web_android`, `web_ios`.
2. **Settings** — lê, valida (faixas e tipos), aplica e salva as configurações. Valores corrompidos voltam ao padrão.
3. **InputDetector** — descobre o dispositivo em uso a partir do último evento (teclado/mouse, controle, toque). Ignora o mouse emulado pelo toque e o ruído do analógico.
4. **AudioManager** — conjunto de 6 players no barramento SFX; sons de interface.
5. **SceneManager** — troca de cena com cortina e carregamento em segundo plano (`load_threaded_request`, que na Web sem threads carrega aos poucos no laço principal). Mostra "Carregando…" só se demorar.
6. **GameManager** — estado do jogo (MENU, CHARACTER_SELECT, FIGHT, PAUSED), registro de cenas, pausa por perda de foco, aviso de orientação.

Barramentos de áudio: `Master` ← `Music`, `SFX`.

## 3. Plano para o combate (Fase 2) já pensando no online

O motor de luta será construído desde o início para permitir **rollback** depois, sem reescrita:

- **Simulação em quadros fixos de 60 Hz**, separada da renderização. A lógica avança só em `_physics_process` (ou num laço próprio com acumulador), nunca com `delta` variável.
- **Entrada por quadro como bitmask** (8 direções + 6 botões cabem em 16 bits). A simulação só lê esse valor, nunca `Input` direto. Assim o mesmo motor aceita teclado, toque, IA ou entrada vinda da rede.
- **Estado da luta serializável e copiável** (posições, velocidades, vida, energia, estado e quadro de cada golpe, temporizador, semente aleatória). Copiar e restaurar esse estado é o que o rollback exige.
- **Determinismo:** matemática em inteiros ou ponto fixo para posição e velocidade (o float do WebAssembly é IEEE, mas manter inteiros elimina dúvidas entre navegadores); nenhum uso de `randf()` global, só um gerador com semente no estado; nada de física do Godot (corpos rígidos) na lógica de luta: colisão de hitbox/hurtbox com retângulos próprios.
- **Visual separado da lógica:** animações e efeitos leem o estado, não o alteram.
- **Dados em Resources** (`data/characters`, `data/movesets`): quadros de startup/active/recovery, dano, hitstun e caixas por golpe.

## 4. Plano de rede (Fase 6) — o que o navegador permite

- **ENet / UDP não existem no navegador.** O `ENetMultiplayerPeer` não funciona na exportação Web. Não será usado.
- **WebSocket** (`WebSocketPeer` / `WebSocketMultiplayerPeer`) funciona na Web. Será a primeira opção: um **servidor de retransmissão** (relay) leve e um serviço de **matchmaking**, ambos fora do Godot (ex.: Node.js), trocando apenas as entradas por quadro.
- **WebRTC** (`WebRTCPeerConnection`) também funciona na Web e permite canal não confiável (parecido com UDP) entre os jogadores, mas precisa de sinalização e de servidores STUN/TURN. Avaliar depois que o WebSocket estiver validado, para reduzir latência.
- **Rollback no estilo GGPO:** cada cliente simula com previsão da entrada do adversário, volta ao último quadro confirmado quando a entrada real chega e ressimula. Só será declarado funcional depois de testado com latência e perda de pacotes simuladas.
- **MultiplayerAPI de alto nível (RPC, sincronizadores)** não é adequada para luta com rollback; a rede será feita sobre os pacotes diretamente.

## 5. Desempenho na Web

- Arquivo `.wasm` do Godot: ~43,7 MB sem compressão (cerca de 10 MB com gzip/brotli no servidor). É o maior custo do primeiro carregamento; o `.pck` do jogo hoje tem ~0,24 MB.
- Personagens e arenas serão carregados sob demanda (`SceneManager` já usa carregamento em segundo plano).
- Qualidade "Automática" usa "Baixa" no celular. "Reduzir efeitos" congela fundos animados e, nas próximas fases, corta partículas e tremores de tela.
- Compressão de textura ETC2/ASTC ativada para celulares, S3TC/BPTC para desktop.

## 6. Estrutura de pastas

Só existem as pastas que já têm uso. As próximas entram junto com o código que precisar delas:

| Agora | Entra na fase |
|---|---|
| `assets/fonts`, `assets/ui`, `scenes/menus`, `scripts/{core,platform,input,audio,ui}`, `shaders`, `tests` | 1 |
| `scenes/fighting`, `scripts/combat`, `data/characters`, `data/movesets`, `assets/characters`, `assets/stages`, `tests/combat` | 2 |
| `scenes/mobile` (controles de toque) | 3 |
| `scripts/characters`, `scripts/abilities`, `scripts/ai`, `resources/attacks` | 4 |
| `scenes/character_select`, `assets/effects`, `assets/audio` | 5 |
| `scripts/multiplayer`, `scenes/multiplayer`, `server/` (relay e matchmaking), `tests/multiplayer` | 6 |
