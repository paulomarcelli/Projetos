/*
 * Vento: brisa constante + rajadas de vez em quando, com folhas voando em duas camadas
 * (atrás do cenário, pequenas; na frente da câmera, grandes) para dar profundidade (parallax).
 * `forca` vai de -1 (soprando para a esquerda) a 1 (para a direita).
 */
import { Container, Graphics, MeshPlane } from '../vendor/pixi.min.mjs';

const CORES = ['#7c9a5a', '#a3b86c', '#c9a25a', '#8a6a9e', '#5f8a7a'];

export class Vento {
  constructor() {
    this.forca = 0;
    this.t = 0;
    this.proximaRajada = 6 + Math.random() * 6;
    this.rajada = null;                // { dir, duracao, t }
    this.atras = new Container();      // folhas atrás do mundo
    this.frente = new Container();     // folhas na frente do mundo
    this.folhas = [];
  }

  /** Força uma rajada agora (para testes e eventos de fase). */
  soprar(dir = Math.random() < 0.5 ? -1 : 1, duracao = 3.5) { this.rajada = { dir, duracao, t: 0 }; }

  atualizar(dt, largura, altura, deslocCamera) {
    this.t += dt;
    const brisa = 0.12 * Math.sin(this.t * 0.6) + 0.06 * Math.sin(this.t * 1.7);
    let rajada = 0;
    this.proximaRajada -= dt;
    if (!this.rajada && this.proximaRajada <= 0) { this.soprar(); this.proximaRajada = 9 + Math.random() * 10; }
    if (this.rajada) {
      const r = this.rajada; r.t += dt;
      const sobe = Math.min(1, r.t / 0.7), desce = Math.min(1, Math.max(0, (r.duracao - r.t) / 1.2));
      rajada = r.dir * Math.min(sobe, desce) * (0.85 + 0.15 * Math.sin(r.t * 9));
      if (r.t >= r.duracao) this.rajada = null;
    }
    this.forca = Math.max(-1, Math.min(1, brisa + rajada));

    // folhas: muitas durante a rajada, poucas na brisa
    const intensidade = Math.abs(rajada);
    const taxa = 2 + intensidade * 38;
    if (Math.random() < taxa * dt) this.criarFolha(Math.random() < 0.4 ? 'frente' : 'atras', largura, altura);
    for (const f of this.folhas) {
      f.vida -= dt;
      const vx = this.forca * f.vel + 20 * Math.sin(this.t * 2 + f.fase);
      f.g.x += vx * dt - deslocCamera * f.parallax;   // parallax: a câmera arrasta mais a camada da frente
      f.g.y += (f.queda + 30 * Math.sin(this.t * 3 + f.fase)) * dt;
      f.g.rotation += f.giro * dt * (0.5 + intensidade);
      f.g.scale.y = f.esc * Math.abs(Math.sin(this.t * f.vira + f.fase));
      if (f.g.x < -80 || f.g.x > largura + 80 || f.g.y > altura + 60) f.vida = 0;
    }
    for (let i = this.folhas.length - 1; i >= 0; i--) {
      if (this.folhas[i].vida <= 0) { this.folhas[i].g.destroy(); this.folhas.splice(i, 1); }
    }
  }

  criarFolha(camada, largura, altura) {
    const frente = camada === 'frente';
    const g = new Graphics();
    const tam = frente ? 9 + Math.random() * 9 : 3 + Math.random() * 3;
    g.ellipse(0, 0, tam, tam * 0.45).fill({ color: CORES[(Math.random() * CORES.length) | 0], alpha: frente ? 0.85 : 0.55 });
    g.moveTo(-tam, 0).lineTo(tam, 0).stroke({ color: '#2a2146', width: 1, alpha: 0.5 });
    if (frente) g.alpha = 0.9;
    const daEsquerda = this.forca >= 0;
    g.x = daEsquerda ? -40 : largura + 40;
    g.y = Math.random() * altura * (frente ? 0.9 : 0.7);
    (frente ? this.frente : this.atras).addChild(g);
    this.folhas.push({
      g, vida: 8, vel: (frente ? 900 : 380) + Math.random() * 300, queda: 20 + Math.random() * 50,
      giro: (Math.random() - 0.5) * 8, vira: 2 + Math.random() * 4, fase: Math.random() * 6,
      esc: 1, parallax: frente ? 1.35 : 0.5,
    });
  }
}

/** Animações desenhadas numa malha, para o cabelo seguir o vento e o movimento. */
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class QuadrosVivos {
  constructor(texInicial, base) {
    this.raiz = new Container();
    this.malha = new MeshPlane({ texture: texInicial, verticesX: 14, verticesY: 18 });
    this.malha.position.set(-texInicial.width / 2, -base);
    this.raiz.addChild(this.malha);
    this.buf = this.malha.geometry.attributes.aPosition.buffer;
    this.orig = Float32Array.from(this.buf.data);
    this.w = texInicial.width; this.h = texInicial.height;
    this.texturas = [texInicial]; this.fps = 10; this.loop = true; this.velocidade = 1;
    this.t = 0; this.quadro = 0; this.tt = 0;
  }
  get currentFrame() { return this.quadro; }
  tocar(anim) {
    this.texturas = anim.texturas; this.fps = anim.fps; this.loop = anim.loop;
    this.velocidade = 1; this.t = 0; this.quadro = 0; this.parado = false;
    this.malha.texture = this.texturas[0];
  }
  parar(i) { this.parado = true; this.quadro = i; this.malha.texture = this.texturas[i]; }

  /** cabeloX: deslocamento do cabelo em px da célula (negativo = para trás). */
  atualizar(dt, cabeloX) {
    this.tt += dt;
    if (!this.parado) {
      this.t += dt * this.velocidade;
      const n = this.texturas.length;
      let q = Math.floor(this.t * this.fps);
      q = this.loop ? q % n : Math.min(q, n - 1);
      if (q !== this.quadro) { this.quadro = q; this.malha.texture = this.texturas[q]; }
    }
    const d = this.buf.data, o = this.orig, W = this.w, H = this.h;
    for (let i = 0; i < d.length; i += 2) {
      const u = o[i] / W, v = o[i + 1] / H;
      // cabelo: atrás da cabeça e das costas (lado esquerdo da célula, da nuca à cintura)
      const peso = (1 - suave(0.4, 0.55, u)) * suave(0.12, 0.3, v) * (1 - suave(0.58, 0.7, v));
      const desce = Math.min(1, Math.max(0, (v - 0.12) / 0.45));
      d[i] = o[i] + peso * desce * (cabeloX + 1.5 * Math.sin(this.tt * 6 + v * 5) * Math.min(1, Math.abs(cabeloX) / 6));
      d[i + 1] = o[i + 1] + peso * desce * 0.8 * Math.sin(this.tt * 4 + u * 6);
    }
    this.buf.update();
  }
}
