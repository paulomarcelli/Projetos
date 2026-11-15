// Monta uma folha de contato (várias capturas lado a lado) para a revisão.
// Uso: node folha.cjs <saida.png> <colunas> <larguraDaMiniatura> <subpasta ou .> <prefixo dos arquivos>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [saida, colunas, larg, sub, prefixo] = process.argv.slice(2);
(async () => {
  const dir = path.join(__dirname, sub);
  const arqs = fs.readdirSync(dir).filter(a => a.startsWith(prefixo) && a.endsWith('.png') && !a.includes('fundo')).sort();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: colunas * (+larg + 12) + 12, height: 600 } });
  const itens = arqs.map(a => {
    const dados = fs.readFileSync(path.join(dir, a)).toString('base64');
    return `<figure><img src="data:image/png;base64,${dados}" width="${larg}"><figcaption>${a}</figcaption></figure>`;
  }).join('');
  await p.setContent(`<style>body{margin:12px;background:#333;display:grid;grid-template-columns:repeat(${colunas},${larg}px);gap:12px;font:11px monospace;color:#fff}figure{margin:0}img{display:block}figcaption{padding:3px 0}</style>${itens}`);
  await p.screenshot({ path: path.join(__dirname, saida), fullPage: true });
  console.log(saida, arqs.length);
  await b.close();
})();
