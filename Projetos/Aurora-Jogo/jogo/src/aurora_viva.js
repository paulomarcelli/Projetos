/*
 * Aurora parada "viva": um único desenho inteiro, deformado por regiões (princípio do Live2D).
 * Como tudo vem do mesmo desenho, as partes nunca ficam descasadas.
 *  - respiração: ombros e peito sobem e descem; a cabeça acompanha
 *  - cabeça: balanço leve
 *  - cabelo solto (lado de trás) e tranças: oscilam e reagem ao movimento
 * Regiões em coordenadas da imagem (u = 0 esquerda → 1 direita; v = 0 topo → 1 pés).
 */
import { Assets, Container, MeshPlane } from '../vendor/pixi.min.mjs';

const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function carregarAuroraViva() {
  const tex = await Assets.load('assets/viva/aurora_parada.png');
  const meta = await (await fetch('assets/viva/aurora_parada.json')).json();
  return new AuroraViva(tex, meta);
}

class AuroraViva {
  constructor(tex, meta) {
    this.altura = meta.altura;
    this.raiz = new Container();
    this.malha = new MeshPlane({ texture: tex, verticesX: 18, verticesY: 28 });
    this.malha.position.set(-meta.pes[0], -meta.pes[1]);
    this.raiz.addChild(this.malha);
    this.buf = this.malha.geometry.attributes.aPosition.buffer;
    this.orig = Float32Array.from(this.buf.data);
    this.w = tex.width; this.h = tex.height;
    this.t = 0;
    this.forca = 0;
  }

  sentir(acelX, _acelY, direcao) { this.forca += -acelX * direcao * 0.00004; }

  /** ventoLocal: força do vento já no lado para onde ela olha (-1..1). */
  atualizar(dt, ventoLocal = 0) {
    this.t += dt;
    const t = this.t;
    const resp = Math.sin((t / 3.6) * Math.PI * 2) * 0.5 + 0.5;       // 0..1
    const balanco = Math.sin(t * 0.9);
    this.forca *= 0.92;
    const vento = 0.4 * Math.sin(t * 1.3) + 0.25 * Math.sin(t * 2.3) + this.forca * 60 + ventoLocal * 4.5;
    const d = this.buf.data, o = this.orig, W = this.w, H = this.h;
    for (let i = 0; i < d.length; i += 2) {
      const u = o[i] / W, v = o[i + 1] / H;
      // respiração: tudo acima da cintura sobe; mais forte nos ombros, some na cintura (v ≈ 0,52)
      const peso = 1 - suave(0.3, 0.52, v);
      let dy = -2.4 * resp * peso;
      // peito: leve expansão para a frente na região do tórax
      let dx = 0.8 * resp * (1 - suave(0.28, 0.48, v)) * suave(0.2, 0.3, v) * suave(0.4, 0.62, u);
      // cabeça: balanço pequeno em torno do pescoço (v ≈ 0,3)
      const cabeca = 1 - suave(0.22, 0.32, v);
      dx += 0.9 * balanco * cabeca * (0.32 - v) * 3;
      // cabelo solto atrás (lado esquerdo da imagem, do ombro para baixo)
      const cabelo = (1 - suave(0.18, 0.42, u)) * suave(0.12, 0.45, v) * (1 - suave(0.62, 0.72, v));
      dx += cabelo * (2.6 * Math.sin(t * 1.5 + v * 3) + vento * 2.2) * Math.pow(Math.min(1, Math.max(0, (v - 0.12) / 0.5)), 1.4);
      dy += cabelo * 0.6 * Math.sin(t * 1.1 + u * 4);
      // tranças na frente do ombro (meio da imagem, abaixo do queixo)
      const tranca = suave(0.38, 0.45, u) * (1 - suave(0.6, 0.68, u)) * suave(0.22, 0.3, v) * (1 - suave(0.46, 0.52, v));
      dx += tranca * (1.4 * Math.sin(t * 1.7 + 1.2) + vento * 1.1) * suave(0.22, 0.48, v);
      d[i] = o[i] + dx; d[i + 1] = o[i + 1] + dy;
    }
    this.buf.update();
  }
}
