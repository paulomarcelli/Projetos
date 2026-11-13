// Copia o PixiJS e as artes para dentro de jogo/ (o site publicado não usa node_modules).
// Uso: npm run preparar
// A Aurora parada (assets/viva) é gerada por `python3 ferramentas/compor_viva.py` (na pasta Aurora-Jogo).
import { cpSync, mkdirSync } from 'node:fs';
const raiz = new URL('..', import.meta.url).pathname;
mkdirSync(raiz + 'vendor', { recursive: true });
cpSync(raiz + 'node_modules/pixi.js/dist/pixi.min.mjs', raiz + 'vendor/pixi.min.mjs');
cpSync(raiz + '../arte/sprites/aurora_folha.png', raiz + 'assets/sprites/aurora_folha.png');
cpSync(raiz + '../arte/sprites/aurora_folha.json', raiz + 'assets/sprites/aurora_folha.json');
cpSync(raiz + '../arte/sprites/aurora_folha_cabelo.png', raiz + 'assets/sprites/aurora_folha_cabelo.png'); // pesos do cabelo (ferramentas/pesos_cabelo.py)
cpSync(raiz + '../arte/sprites/flecha', raiz + 'assets/sprites/flecha', { recursive: true });
mkdirSync(raiz + 'assets/sprites/sombra', { recursive: true });   // criatura (ferramentas/fatiar_sombra.py)
for (const f of ['sombra_folha.png', 'sombra_folha.json']) cpSync(raiz + '../arte/sprites/sombra/' + f, raiz + 'assets/sprites/sombra/' + f);
console.log('pronto: vendor/ e assets/');
