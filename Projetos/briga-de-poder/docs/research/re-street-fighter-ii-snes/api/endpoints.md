# Endpoints

IDs in paths are `:id`. Shapes and types only; no real values.

Nenhuma API de dados: a página só carrega arquivos estáticos do emulador.

| Method | Template | Triggered by | Request shape | Response shape | Evidence |
|---|---|---|---|---|---|
| GET | /EJS/loader.js, /EJS/emulator.min.js, /EJS/emu-css.min.css, /EJS/webrtc-adapter.js | abrir a página | none | script/CSS | [net EV-003] |
