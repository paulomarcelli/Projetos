// A tela do aparelho: um canvas 2D vira textura. Mostra uma foto da Karol (recorte "cover" na proporção da tela),
// a barra de status e, na seção Fotografe, a interface da câmera (zoom, disparador, contador). Só redesenha quando muda.
import * as THREE from 'three';

const W = 720, H = 1560; // 73,4 × 158,9 mm na mesma proporção

export function createScreen() {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const state = { img: null, mode: 'foto', zoom: '1×', flash: 0, shots: 0, time: '14:21' };

  function cover(img) {
    const s = Math.max(W / img.width, H / img.height);
    const w = img.width * s, h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) * 0.35, w, h);
  }
  const mono = (px, wt = 500) => `${wt} ${px}px "Geist Mono Variable", ui-monospace, monospace`;

  function draw() {
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);
    if (state.img) cover(state.img);
    // degradê de leitura em cima e embaixo
    let g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 220);
    g = ctx.createLinearGradient(0, H - 420, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 420, W, 420);
    // barra de status
    ctx.fillStyle = '#f2f0eb';
    ctx.font = mono(30, 600);
    ctx.textBaseline = 'middle';
    ctx.fillText(state.time, 54, 62);
    ctx.textAlign = 'right';
    ctx.fillText('5G  ▮▮▮▮  100%', W - 54, 62);
    ctx.textAlign = 'left';

    if (state.mode === 'camera') {
      // interface da câmera: chips de zoom, disparador e contador de fotos
      const zs = ['0,6', '1×', '3×', '5×'];
      const cy = H - 330;
      zs.forEach((z, i) => {
        const x = W / 2 + (i - 1.5) * 110;
        const on = z === state.zoom;
        ctx.beginPath(); ctx.arc(x, cy, on ? 40 : 32, 0, Math.PI * 2);
        ctx.fillStyle = on ? 'rgba(191,224,255,.95)' : 'rgba(10,10,11,.55)'; ctx.fill();
        ctx.fillStyle = on ? '#0a0a0b' : '#f2f0eb';
        ctx.font = mono(on ? 26 : 22, 600); ctx.textAlign = 'center'; ctx.fillText(z, x, cy + 1);
      });
      ctx.beginPath(); ctx.arc(W / 2, H - 170, 74, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = '#f2f0eb'; ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H - 170, 60, 0, Math.PI * 2); ctx.fillStyle = '#f2f0eb'; ctx.fill();
      ctx.font = mono(26, 500); ctx.textAlign = 'left'; ctx.fillStyle = '#f2f0eb';
      ctx.fillText(String(state.shots).padStart(4, '0'), 60, H - 170);
      ctx.textAlign = 'right'; ctx.fillText('200 MP', W - 60, H - 170);
      ctx.textAlign = 'left';
    } else {
      ctx.font = `800 ${64}px "Archivo Variable", system-ui, sans-serif`;
      ctx.fillStyle = '#f2f0eb';
      ctx.fillText('KAROL°', 60, H - 150);
      ctx.font = mono(24, 500); ctx.fillStyle = 'rgba(242,240,235,.75)';
      ctx.fillText('GALAXY S26 ULTRA · CONCEITO', 62, H - 92);
    }
    if (state.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${state.flash})`; ctx.fillRect(0, 0, W, H); }
    tex.needsUpdate = true;
  }

  return {
    tex,
    state,
    set(patch) { Object.assign(state, patch); draw(); },
    draw,
  };
}
