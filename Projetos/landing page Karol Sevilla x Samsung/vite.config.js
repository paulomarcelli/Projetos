import { defineConfig } from 'vite';

// Manifesto da tela de carga: o build escreve no index.html a lista do que a primeira tela precisa, com o tamanho
// de cada arquivo (o pedaço do 3D, o CSS e as fontes latinas). motion/loader.js baixa o JS por stream contando os
// bytes e marca CSS e fontes pelo Resource Timing: o contador mostra KB reais, nunca um tempo fingido.
const carga = () => {
  let base = '/';
  return {
    name: 'carga',
    apply: 'build',
    configResolved(c) { base = c.base; },
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const list = [];
        const size = (x) => (typeof x === 'string' ? Buffer.byteLength(x) : x.byteLength);
        // o que a entrada importa direto já chegou quando a carga roda (é ela mesma): fica de fora
        const loaded = new Set();
        const walk = (name) => { if (loaded.has(name)) return; loaded.add(name); bundle[name]?.imports?.forEach(walk); };
        Object.values(bundle).filter((f) => f.type === 'chunk' && f.isEntry).forEach((f) => walk(f.fileName));
        for (const f of Object.values(bundle)) {
          if (f.type === 'chunk' && !loaded.has(f.fileName)) list.push({ u: base + f.fileName, b: size(f.code), k: 'js' });
          else if (f.type === 'asset' && /\.css$/.test(f.fileName)) list.push({ u: base + f.fileName, b: size(f.source), k: 'css' });
          else if (f.type === 'asset' && /(archivo|geist-mono)-latin-w.*\.woff2$/.test(f.fileName)) list.push({ u: base + f.fileName, b: size(f.source), k: 'font' });
        }
        return { html, tags: [{ tag: 'script', attrs: { type: 'application/json', id: 'carga' }, children: JSON.stringify(list), injectTo: 'head' }] };
      },
    },
  };
};

export default defineConfig({
  plugins: [carga()],
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
