# Topic: entrega no navegador
Features: F-012, F-013 · Status: draft

## Summary

A página entrega o jogo como um `<canvas>` controlado pelo EmulatorJS. O carregamento é em duas etapas: scripts leves ao abrir; arquivos pesados só depois do gesto do jogador. Toque por controle virtual configurável; rede por servidor de netplay + WebRTC.

## Behavior

- Abrir a página pede só os scripts do emulador [obs EV-003].
- O botão "START GAME" é o gesto que libera áudio e execução [obs EV-001] [doc SRC-003].
- O script `webrtc-adapter.js` é carregado mesmo sem netplay [obs EV-003].

## Scope and configuration

| Setting | Scope | Default | Evidence |
|---|---|---|---|
| ID do jogo (saves e netplay) | por jogo | 1 | [doc SRC-003] [obs EV-004] |
| Controle virtual | por site | layout do sistema | [doc SRC-004] |
| Início automático | por site | false | [doc SRC-003] |
| Servidor de netplay e ICE | por site | nenhum | [doc SRC-005] |

## Rules

- R-020, R-021, R-022, R-028

## Not tested

- Desempenho, áudio e controle virtual em celular: o jogo não foi executado (BR-002).
