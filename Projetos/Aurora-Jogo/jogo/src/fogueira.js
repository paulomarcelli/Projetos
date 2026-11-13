/*
 * Fogueira Lunar: ponto de descanso e salvamento (desenho original do jogo, feito em código).
 * Camadas, de trás para a frente:
 *   halo (degradê aditivo) · pedra da lua (lua crescente gravada que brilha) · pedras de trás · lenha em cruz
 *   com brasas · chama (línguas curvas em 3 tons: violeta, lilás e miolo quase branco) · labaredas soltas ·
 *   pedras da frente · brasas subindo · fumaça.
 * A chama deita com o vento e fica mais forte depois do primeiro descanso (acesa).
 */
import { Container, Graphics, Sprite, Texture } from '../vendor/pixi.min.mjs';

/** Degradê radial branco → transparente, desenhado uma vez e usado por todos os brilhos. */
let texBrilho = null;
function brilho() {
  if (texBrilho) return texBrilho;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d;
  g.fillRect(0, 0, 128, 128);
  texBrilho = Texture.from(c);
  return texBrilho;
}

/** Número pseudoaleatório fixo por semente (as pedras saem iguais a cada vez que o jogo abre). */
function aleatorio(semente) {
  let s = semente;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Língua de fogo: gota alongada com a ponta deslocada (inclinação). */
function lingua(g, x, largura, altura, inclina, y = 0) {
  const w = largura, h = altura, p = x + inclina;
  g.moveTo(x - w, y)
    .bezierCurveTo(x - w * 1.15, y - h * 0.38, p - w * 0.55, y - h * 0.68, p, y - h)
    .bezierCurveTo(p + w * 0.6, y - h * 0.62, x + w * 1.15, y - h * 0.34, x + w, y)
    .quadraticCurveTo(x, y + w * 0.55, x - w, y)
    .closePath();
}

/** Pedra irregular com sombra embaixo, luz em cima e contorno escuro. */
function pedra(g, x, y, rx, ry, cor, clara, sorte) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = 0.82 + sorte() * 0.22;
    pts.push(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r);
  }
  g.poly(pts).fill(cor).stroke({ color: '#17112a', width: 2, join: 'round' });
  g.ellipse(x - rx * 0.18, y - ry * 0.35, rx * 0.55, ry * 0.32).fill({ color: clara, alpha: 0.55 });
  g.ellipse(x + rx * 0.1, y + ry * 0.45, rx * 0.7, ry * 0.25).fill({ color: '#120d22', alpha: 0.35 });
}

/** Pontos de uma lua crescente: o círculo (cx, cy, r1) menos o círculo deslocado (dx, dy) de raio r2. */
function crescente(cx, cy, r1, dx, dy, r2, n = 20) {
  const d = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
  const a = Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
  const b = Math.acos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));
  const pts = [];
  for (let i = 0; i <= n; i++) {   // arco de fora, pelo lado oposto ao deslocamento
    const t = phi + a + (2 * Math.PI - 2 * a) * (i / n);
    pts.push(cx + r1 * Math.cos(t), cy + r1 * Math.sin(t));
  }
  for (let i = 0; i <= n; i++) {   // arco de dentro, voltando
    const t = phi + Math.PI + b - 2 * b * (i / n);
    pts.push(cx + dx + r2 * Math.cos(t), cy + dy + r2 * Math.sin(t));
  }
  return pts;
}

const LINGUAS = [
  { x: -13, h: 0.55, w: 7 }, { x: -6, h: 0.82, w: 9 }, { x: 1, h: 1, w: 11 },
  { x: 8, h: 0.78, w: 9 }, { x: 14, h: 0.5, w: 6 },
];
const CAMADAS = [
  { cor: 0x5636e8, esc: 1.0, alfa: 0.95, sobe: 0, soma: false },    // borda violeta
  { cor: 0x9f84ff, esc: 0.72, alfa: 0.9, sobe: 2, soma: false },    // lilás
  { cor: 0xf3efff, esc: 0.4, alfa: 0.85, sobe: 3, soma: true },     // miolo quase branco (soma luz)
];
const ALTURA_CHAMA = 84;
const ESCALA = 1.35;   // tamanho no mundo (a Aurora tem 210 px de altura)

export class Fogueira {
  constructor(id, x, chaoY) {
    this.id = id; this.x = x; this.chaoY = chaoY;
    this.raiz = new Container();
    this.raiz.position.set(x, chaoY);
    this.raiz.scale.set(ESCALA);
    this.t = Math.random() * 10;
    this.acesa = false;      // fica mais forte depois do primeiro descanso
    this.fases = LINGUAS.map(() => Math.random() * 10);
    this.labaredas = []; this.faiscas = []; this.fumaca = [];
    const sorte = aleatorio(id.length * 7919 + 13);
    const tex = brilho();

    // halo grande e o brilho no chão (aditivos)
    this.halo = new Sprite(tex); this.halo.anchor.set(0.5); this.halo.blendMode = 'add'; this.halo.tint = 0x9d86ff;
    this.halo.position.set(0, -46);
    this.chao = new Sprite(tex); this.chao.anchor.set(0.5); this.chao.blendMode = 'add'; this.chao.tint = 0xb7a6ff;

    // cinza e terra queimada sob a fogueira
    const base = new Graphics();
    base.ellipse(0, 4, 60, 11).fill({ color: '#120d20', alpha: 0.75 });
    base.ellipse(0, 2, 34, 6).fill({ color: '#2a2238', alpha: 0.9 });

    // pedra da lua: pedra em pé atrás do fogo, com uma lua crescente gravada que brilha
    this.pedraLua = new Container();
    const pl = new Graphics();
    pl.poly([-15, 4, -17, -22, -11, -44, 0, -52, 11, -45, 16, -24, 15, 4]).fill('#4a4468').stroke({ color: '#17112a', width: 2.5, join: 'round' });
    pl.poly([-11, -40, 0, -48, 9, -42, 4, -30, -8, -26]).fill({ color: '#6d6790', alpha: 0.7 });
    pl.poly([6, -40, 13, -24, 12, 2, 4, 2]).fill({ color: '#2c2645', alpha: 0.6 });
    this.lua = new Graphics();
    this.lua.poly(crescente(0, -28, 8, 3.6, -2, 7)).fill('#e9e4ff');
    this.luaBrilho = new Sprite(tex); this.luaBrilho.anchor.set(0.5); this.luaBrilho.blendMode = 'add';
    this.luaBrilho.tint = 0xc8b8ff; this.luaBrilho.position.set(-1, -28); this.luaBrilho.scale.set(0.42);
    this.pedraLua.addChild(pl, this.luaBrilho, this.lua);
    this.pedraLua.position.set(-46, -6);
    this.pedraLua.scale.set(0.95);

    // pedras: as de trás menores e mais escuras, as da frente maiores e mais claras
    const tras = new Graphics(), frente = new Graphics();
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const px = Math.cos(a) * 38, py = Math.sin(a) * 9;
      const naFrente = Math.sin(a) > 0;
      if (naFrente) pedra(frente, px, py + 3, 12 + sorte() * 3, 8 + sorte() * 2, '#5f5884', '#9a93c0', sorte);
      else pedra(tras, px, py, 9 + sorte() * 3, 6 + sorte() * 2, '#433d63', '#6f6894', sorte);
    }

    // lenha em cruz, com casca e pontas cortadas
    const lenha = new Container();
    for (const [ang, dy] of [[-0.42, -6], [0.38, -6], [0.04, -2]]) {
      const tora = new Graphics();
      tora.roundRect(-30, -5, 60, 10, 5).fill('#4b3328').stroke({ color: '#1a100c', width: 2 });
      tora.moveTo(-20, -2).lineTo(-6, -2).moveTo(4, 2).lineTo(18, 2).stroke({ color: '#2f1f18', width: 1.5 });
      tora.ellipse(29, 0, 3, 5).fill('#a07e5a').stroke({ color: '#1a100c', width: 1.5 });
      tora.rotation = ang; tora.position.set(0, dy);
      lenha.addChild(tora);
    }
    // brasas na lenha (pulsam no atualizar)
    this.brasas = new Graphics();
    this.brasas.blendMode = 'add';
    lenha.addChild(this.brasas);

    // chama: uma camada por tom (as claras somam luz)
    this.camadas = CAMADAS.map((c) => {
      const g = new Graphics();
      if (c.soma) g.blendMode = 'add';
      return g;
    });
    this.camadaLabaredas = new Graphics();
    this.camadaFaiscas = new Graphics(); this.camadaFaiscas.blendMode = 'add';
    this.camadaFumaca = new Graphics();
    this.nucleo = new Sprite(tex); this.nucleo.anchor.set(0.5); this.nucleo.blendMode = 'add'; this.nucleo.tint = 0xe7e0ff;
    this.nucleo.position.set(0, -14);

    this.raiz.addChild(this.halo, this.chao, base, this.pedraLua, tras, lenha, this.camadaFumaca, ...this.camadas,
      this.camadaLabaredas, this.nucleo, frente, this.camadaFaiscas);
  }

  atualizar(dt, perto, vento = 0) {
    this.t += dt;
    const t = this.t, forca = this.acesa ? 1 : 0.72;
    const pulso = 0.86 + 0.08 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1);

    // luz
    this.halo.scale.set((2.1 + (perto ? 0.25 : 0)) * forca * pulso, 1.7 * forca * pulso);
    this.halo.alpha = (perto ? 0.3 : 0.22) * pulso;
    this.chao.scale.set(1.5 * forca * pulso, 0.26 * forca);
    this.chao.alpha = 0.4 * pulso;
    this.nucleo.scale.set(0.34 * forca * pulso, 0.26 * forca * pulso);
    this.nucleo.alpha = 0.55;
    this.luaBrilho.alpha = 0.35 + 0.45 * forca * pulso;
    this.lua.alpha = 0.75 + 0.25 * pulso;

    // brasas na lenha
    this.brasas.clear();
    for (let i = 0; i < 6; i++) {
      const bx = -18 + i * 7, by = -4 + Math.sin(i * 2.1) * 3;
      const a = 0.35 + 0.35 * Math.sin(t * (3 + i) + i * 1.7);
      this.brasas.circle(bx, by, 2.2).fill({ color: 0xd9c8ff, alpha: Math.max(0, a) * forca });
    }

    // chama: cada língua tremula na sua fase; o vento inclina mais a ponta das línguas altas
    for (let c = 0; c < CAMADAS.length; c++) {
      const cam = CAMADAS[c], g = this.camadas[c];
      g.clear();
      for (let i = 0; i < LINGUAS.length; i++) {
        const L = LINGUAS[i], f = this.fases[i];
        const tremor = 0.84 + 0.12 * Math.sin(t * 9 + f) + 0.07 * Math.sin(t * 17 + f * 2.3);
        const h = ALTURA_CHAMA * L.h * cam.esc * forca * tremor;
        const inclina = vento * 30 * (h / ALTURA_CHAMA) + Math.sin(t * 5.3 + f) * 3.2 * cam.esc;
        lingua(g, L.x * (0.75 + 0.25 * cam.esc), L.w * cam.esc * forca, h, inclina);
        g.fill({ color: cam.cor, alpha: cam.alfa });
        g.position.y = -cam.sobe - 4;
      }
      // base arredondada que junta as línguas (sem ela o pé da chama fica reto)
      g.ellipse(0, -2, 19 * cam.esc * forca, 7 * cam.esc).fill({ color: cam.cor, alpha: cam.alfa });
    }

    // labaredas que se soltam da ponta e somem subindo
    if (Math.random() < dt * 7 * forca) {
      this.labaredas.push({ x: (Math.random() - 0.5) * 16, y: -ALTURA_CHAMA * 0.55 * forca, vy: -70 - Math.random() * 40,
        vida: 0.45, total: 0.45, w: 4 + Math.random() * 3 });
    }
    this.camadaLabaredas.clear();
    for (const l of this.labaredas) {
      l.vida -= dt; l.y += l.vy * dt; l.x += vento * 60 * dt;
      const k = Math.max(0, l.vida / l.total);
      lingua(this.camadaLabaredas, l.x, l.w * k, 16 * k + 4, vento * 6, l.y);
      this.camadaLabaredas.fill({ color: 0x9f84ff, alpha: 0.55 * k });
    }
    this.labaredas = this.labaredas.filter((l) => l.vida > 0);

    // brasas subindo, piscando
    if (Math.random() < dt * 16 * forca) {
      this.faiscas.push({ x: (Math.random() - 0.5) * 26, y: -24, vy: -55 - Math.random() * 70, vida: 1 + Math.random() * 0.9,
        fase: Math.random() * 6, r: 1.1 + Math.random() * 1.3 });
    }
    this.camadaFaiscas.clear();
    for (const f of this.faiscas) {
      f.vida -= dt; f.y += f.vy * dt; f.vy *= 0.995;
      f.x += (Math.sin(t * 3 + f.y * 0.06 + f.fase) * 16 + vento * 95) * dt;
      const pisca = 0.6 + 0.4 * Math.sin(t * 18 + f.fase);
      const a = Math.max(0, Math.min(1, f.vida)) * pisca;
      this.camadaFaiscas.circle(f.x, f.y, f.r).fill({ color: 0xf2ecff, alpha: a });
      this.camadaFaiscas.circle(f.x, f.y, f.r * 1.8).fill({ color: 0x9d86ff, alpha: a * 0.15 });
    }
    this.faiscas = this.faiscas.filter((f) => f.vida > 0);

    // fumaça leve acima da chama
    if (Math.random() < dt * 2.2) {
      this.fumaca.push({ x: (Math.random() - 0.5) * 10, y: -ALTURA_CHAMA * 0.9 * forca, r: 6, vida: 2.4, total: 2.4 });
    }
    this.camadaFumaca.clear();
    for (const s of this.fumaca) {
      s.vida -= dt; s.y -= 22 * dt; s.r += 7 * dt; s.x += (vento * 40 + Math.sin(t + s.y * 0.05) * 6) * dt;
      const k = Math.max(0, s.vida / s.total);
      this.camadaFumaca.circle(s.x, s.y, s.r).fill({ color: 0x7c7499, alpha: 0.05 * k * (1 - k) * 4 });
    }
    this.fumaca = this.fumaca.filter((s) => s.vida > 0);
  }
}
