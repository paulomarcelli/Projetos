// Resume os arquivos medidas-*.json para leitura. Uso: node resumo.cjs <nome>
const fs = require('fs');
const path = require('path');
const m = JSON.parse(fs.readFileSync(path.join(__dirname, `medidas-${process.argv[2]}.json`)));
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(2); };
console.log('== ', m.nome, m.largura, 'x', m.altura);
console.log('intro:', JSON.stringify(m.intro.filter(i => i.fimDaIntroMs)), 'vídeo:', JSON.stringify(m.video));
console.log('altura da página', m.medidas.alturaDaPagina, 'sobra lateral', m.medidas.sobraLateral, 'CLS', m.medidas.cls, 'LCP', JSON.stringify(m.medidas.lcp));
console.log('console:', m.console, 'falhas:', m.falhasDeRede);
console.log('títulos:', m.medidas.titulos);
console.log('fontes:', m.medidas.fontes);
console.log('peso total (kB):', m.medidas.pesoTotalKb, m.medidas.recursos.filter(r => r.kb > 30).map(r => r.url + ' ' + r.kb).join(' | '));
console.log('bordas esquerdas (x: quantos):', JSON.stringify(m.medidas.bordasEsquerdas));
const tam = {};
for (const t of m.medidas.textos) tam[t.px] = (tam[t.px] || 0) + 1;
console.log('tamanhos de texto (px: quantos):', JSON.stringify(tam));
console.log('-- textos');
for (const t of m.medidas.textos) console.log(`${t.px}px p${t.peso} ${t.cor} ${t.largura}px ${t.linhas}l ${t.caracteresPorLinha}c/l | ${t.quem} | ${t.texto}`);
console.log('-- alvos de toque');
for (const a of m.medidas.alvos) console.log(`${a.w}x${a.h} | ${a.quem} | ${a.texto}`);
if (m.fundo) { console.log('-- contraste do texto claro (#f4f4f2) sobre o filme: pior média / pior p95'); for (const f of m.fundo) console.log(f.ausente ? `ausente | ${f.nome}` : `${f.piorMedio} / ${f.piorP95} | ${f.nome} | ${f.amostras.map(a => a.contrasteMedio).join(' ')}`); }
console.log('-- contraste dos tokens');
const pares = [['tinta sobre osso', '#0a0a0a', '#ebe8e2'], ['tinta-2 sobre osso', '#6b6863', '#ebe8e2'], ['luz sobre noite', '#f4f4f2', '#0a0a0a'], ['osso sobre tinta (pílula cheia)', '#ebe8e2', '#0a0a0a']];
for (const [n, a, b] of pares) console.log(n, cr(hex(a), hex(b)));
