# Rules: entrega no navegador

### R-020 O emulador não roda antes de um gesto do jogador
- Given a página carregada
- When o jogador ainda não clicou ou tocou
- Then o emulador fica parado; mesmo com início automático ele congela até a primeira interação
- Evidence: [obs EV-001] [doc SRC-003]
- Feature: F-012 · Screen: S-001

### R-021 Nada pesado é baixado antes do botão de início
- Given a página aberta e START GAME não acionado
- When a página termina de carregar
- Then só scripts e folha de estilo do emulador foram pedidos; nenhum arquivo de jogo, núcleo ou WebAssembly
- Evidence: [obs EV-003]
- Feature: F-012 · Screen: S-001

### R-022 Controle virtual de toque é configurável por zonas, direcional e botões
- Given o emulador em tela de toque
- When o controle virtual é exibido
- Then cada elemento é "zone" (analógico), "dpad" ou "button", posicionado em porcentagem nas áreas esquerda, centro, direita ou topo
- Evidence: [doc SRC-004]
- Feature: F-012 · Screen: S-001

### R-028 Netplay exige servidor próprio e servidores STUN/TURN
- Given um site quer partidas em rede
- When configura o netplay do emulador
- Then precisa de um ID único por jogo, de um servidor de netplay (porta TCP, padrão 3000) e de uma lista de servidores ICE (STUN/TURN) para o WebRTC
- Evidence: [doc SRC-005] [obs EV-004]
- Feature: F-013 · Screen: S-001
