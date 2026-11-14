// Copia o PixiJS e as artes para dentro de jogo/ (o site publicado não usa node_modules).
// Uso: npm run preparar
// A Aurora parada (assets/viva) é gerada por `python3 ferramentas/compor_viva.py` (na pasta Aurora-Jogo).
import { cpSync, mkdirSync } from 'node:fs';
const raiz = new URL('..', import.meta.url).pathname;
mkdirSync(raiz + 'vendor', { recursive: true });
cpSync(raiz + 'node_modules/pixi.js/dist/pixi.min.mjs', raiz + 'vendor/pixi.min.mjs');
// a Aurora em movimento usa as duas camadas (corpo fixo + cabelo); a folha inteira fica só em arte/sprites
for (const c of ['corpo', 'mecha']) cpSync(raiz + `../arte/sprites/aurora_folha_${c}.png`, raiz + `assets/sprites/aurora_folha_${c}.png`);
cpSync(raiz + '../arte/sprites/aurora_folha.json', raiz + 'assets/sprites/aurora_folha.json');
cpSync(raiz + '../arte/sprites/aurora_folha_cabelo.png', raiz + 'assets/sprites/aurora_folha_cabelo.png'); // pesos do cabelo (ferramentas/pesos_cabelo.py)
cpSync(raiz + '../arte/sprites/flecha', raiz + 'assets/sprites/flecha', { recursive: true });
mkdirSync(raiz + 'assets/sprites/sombra', { recursive: true });   // criatura (ferramentas/fatiar_sombra.py)
for (const f of ['sombra_folha.png', 'sombra_folha.json']) cpSync(raiz + '../arte/sprites/sombra/' + f, raiz + 'assets/sprites/sombra/' + f);
for (const f of ['crianca_folha.png', 'crianca_folha.json']) cpSync(raiz + '../arte/sprites/' + f, raiz + 'assets/sprites/' + f);   // Aurora criança (ferramentas/montar_folha_crianca.py)
for (const f of ['prologo_folha.webp', 'prologo_folha.json']) cpSync(raiz + '../arte/sprites/' + f, raiz + 'assets/sprites/' + f);   // arte do Prólogo (Figma → ferramentas/montar_folha_figma.py)
for (const f of ['floresta_folha.webp', 'floresta_folha.json']) cpSync(raiz + '../arte/sprites/' + f, raiz + 'assets/sprites/' + f);   // arte da Fase 1 (Figma)
// os fundos pintados (assets/fundos) já ficam em jogo/: são gerados de arte/figma (ver docs/ARQUITETURA.md)
console.log('pronto: vendor/ e assets/');
