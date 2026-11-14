/*
 * Objetos com física e vida na fase (skills game-feel e physics-tuning: passo fixo, molas, verlet):
 *  - Bolsa: moedas de prata que flutuam e brilham; ao pegar, sobem e somem com brilho.
 *  - Pingente: gelo pendurado; treme quando a Aurora se aproxima (aviso), cai com gravidade, machuca e se estilhaça.
 *    Uma flecha também derruba. O primeiro da ravina cai NA FRENTE dela: ensina antes de cobrar.
 *  - Ponte: ponte de corda em verlet (tábuas e corrimão) que cede sob o peso dela e balança com o vento.
 *  - Particulas: neve que cai dos galhos, cacos de gelo e o bafo frio (da Aurora e dos animais).
 *  - Sombra: sombra de contato no chão, menor e mais clara quanto mais alto ela está.
 * A colisão continua nos sólidos da fase (fisica.js); aqui é só o que se vê e o que acontece.
 */
import { Container, Graphics, Sprite, Text } from '../vendor/pixi.min.mjs';
import { manchaSuave } from './fase.js';

const G = 1700;           // gravidade dos objetos soltos (px/s²)

/** chão (topo de um sólido) logo abaixo de (x, y) */
export function chaoAbaixo(mundo, x, y) {
  let melhor = null;
  for (const s of mundo) {
    if (s.tipo === 'invisivel' || x < s.x || x > s.x + s.w || s.y < y - 2) continue;
    if (!melhor || s.y < melhor) melhor = s.y;
  }
  return melhor;
}

export class Particulas {
  constructor() { this.raiz = new Container(); this.lista = []; }
  /** p: { x, y, vx, vy, vida, raio, cor, alfa, gravidade, cresce, chao } */
  soltar(p) {
    const g = new Sprite(manchaSuave()); g.anchor.set(0.5); g.tint = p.cor ?? 0xffffff;
    g.position.set(p.x, p.y); g.width = g.height = (p.raio ?? 4) * 2;
    this.raiz.addChild(g);
    this.lista.push({ g, vx: 0, vy: 0, gravidade: 0, cresce: 0, alfa: 0.9, ...p, total: p.vida });
  }
  /** neve caindo de um galho: torrões que caem e se desfazem no chão */
  neveDoGalho(x0, x1, y, mundo, n = 8) {
    for (let i = 0; i < n; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      this.soltar({ x, y: y + 6, vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 60, vida: 2.5, raio: 3 + Math.random() * 4,
        gravidade: G * 0.55, chao: chaoAbaixo(mundo, x, y + 20), alfa: 0.95 });
    }
  }
  cacos(x, y, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * Math.random();
      this.soltar({ x, y, vx: Math.cos(a) * (80 + Math.random() * 220), vy: Math.sin(a) * (120 + Math.random() * 260), vida: 0.6 + Math.random() * 0.4,
        raio: 2 + Math.random() * 2.5, cor: 0xd8ecff, gravidade: G, alfa: 1 });
    }
    this.soltar({ x, y: y - 6, vida: 0.5, raio: 26, cor: 0xeaf4ff, alfa: 0.5, cresce: 60 });
  }
  /** bafo frio: nuvenzinha que sai da boca, sobe, cresce e some */
  bafo(x, y, dir, forca = 1) {
    for (let i = 0; i < 3; i++) {
      this.soltar({ x: x + dir * i * 3, y: y + (Math.random() - 0.5) * 3, vx: dir * (18 + Math.random() * 14) * forca, vy: -8 - Math.random() * 8,
        vida: 1.1 + Math.random() * 0.5, raio: 3 + i, cor: 0xf2f5ff, alfa: 0.32 * forca, cresce: 9 });
    }
  }
  atualizar(dt, vento = 0) {
    for (const p of this.lista) {
      p.vida -= dt;
      p.vy += p.gravidade * dt;
      p.vx += vento * 25 * dt;
      p.g.x += p.vx * dt; p.g.y += p.vy * dt;
      if (p.chao != null && p.g.y >= p.chao - 2) {
        // torrão de neve: espalha um pouquinho e some no chão
        p.g.y = p.chao - 2; p.vy = 0; p.vx *= 0.5; p.gravidade = 0; p.chao = null; p.vida = Math.min(p.vida, 0.35); p.cresce = 14;
      }
      if (p.cresce) { const r = p.g.width / 2 + p.cresce * dt; p.g.width = p.g.height = r * 2; }
      p.g.alpha = p.alfa * Math.min(1, p.vida / (p.total * 0.4));
    }
    for (let i = this.lista.length - 1; i >= 0; i--) if (this.lista[i].vida <= 0) { this.lista[i].g.destroy(); this.lista.splice(i, 1); }
  }
}

export class Bolsa {
  constructor(d) {
    this.x = d.x; this.y = d.y; this.moedas = d.moedas; this.pega = false; this.t = Math.random() * 6;
    this.raiz = new Container();
    this.brilho = new Sprite(manchaSuave()); this.brilho.anchor.set(0.5); this.brilho.tint = 0xcfd8ff; this.brilho.blendMode = 'add';
    this.brilho.width = this.brilho.height = 90;
    const g = new Graphics()
      .ellipse(0, 0, 15, 13).fill('#7a5234').stroke({ color: '#2a1a10', width: 2 })
      .rect(-7, -16, 14, 6).fill('#5a3a22').stroke({ color: '#2a1a10', width: 1.5 })
      .moveTo(-8, -11).lineTo(8, -11).stroke({ color: '#c9b089', width: 2 })
      .circle(0, 2, 5).fill('#d9dcf0').stroke({ color: '#6a6c88', width: 1.5 })
      .circle(-1.5, 0.5, 1.5).fill('#ffffff');
    this.saco = g;
    this.raiz.addChild(this.brilho, g);
    this.raiz.position.set(d.x, d.y - 26);
  }
  get caixa() { return { x: this.x - 18, y: this.y - 50, w: 36, h: 50 }; }
  pegar() { if (this.pega) return false; this.pega = true; this.sumir = 0.6; return true; }
  atualizar(dt) {
    this.t += dt;
    if (this.pega) {
      this.sumir -= dt; this.raiz.y -= 90 * dt; this.raiz.alpha = Math.max(0, this.sumir / 0.6);
      this.raiz.scale.set(1 + (0.6 - this.sumir));
      if (this.sumir <= 0) this.raiz.visible = false;
      return;
    }
    this.saco.y = Math.sin(this.t * 2.2) * 4;                  // flutua
    this.saco.rotation = Math.sin(this.t * 1.7) * 0.08;
    this.brilho.alpha = 0.35 + 0.2 * Math.sin(this.t * 3.1);
  }
}

export class Pingente {
  constructor(d, mundo) {
    this.x = d.x; this.y0 = d.y; this.y = d.y; this.vy = 0; this.estado = 'pendurado'; this.t = 0;
    this.comp = 46 + (Math.round(d.x) % 3) * 12;
    this.chao = chaoAbaixo(mundo, d.x, d.y + 10);
    this.g = new Graphics()
      .poly([-9, 0, 9, 0, 1.5, this.comp, -1.5, this.comp]).fill({ color: '#cfe6ff', alpha: 0.92 }).stroke({ color: '#5f7ea8', width: 1.5 })
      .poly([-3, 2, 2, 2, 0, this.comp * 0.8]).fill({ color: '#ffffff', alpha: 0.75 });
    this.g.position.set(d.x, d.y);
  }
  get caixa() { return { x: this.x - 8, y: this.y, w: 16, h: this.comp }; }
  derrubar() { if (this.estado === 'pendurado' || this.estado === 'tremendo') { this.estado = 'caindo'; this.vy = 0; } }
  /** ax: x da Aurora (pés), dir: para onde ela anda, vx: velocidade; devolve 'quebrou' quando bate no chão */
  atualizar(dt, ax, dir, vx = 0) {
    this.t += dt;
    if (this.estado === 'pendurado') {
      // começa a tremer quando ela chega perto (vindo na direção dele): é o aviso. O gatilho cresce com a velocidade
      // dela, para o gelo cair NA FRENTE de quem vem correndo (dá tempo de frear) e não na cabeça
      const frente = (this.x - ax) * (dir || 1);
      if (frente > -20 && frente < 80 + Math.abs(vx) * 0.62) { this.estado = 'tremendo'; this.t = 0; }
    } else if (this.estado === 'tremendo') {
      this.g.x = this.x + Math.sin(this.t * 70) * 2.2 * Math.min(1, this.t * 3);
      if (this.t > 0.55) this.derrubar();
    } else if (this.estado === 'caindo') {
      this.vy += G * dt; this.y += this.vy * dt;
      this.g.position.set(this.x, this.y);
      if (this.chao != null && this.y + this.comp >= this.chao) { this.estado = 'quebrado'; this.g.visible = false; return 'quebrou'; }
    }
    return null;
  }
}

/** Ponte de corda: pontos em verlet presos nas pontas; o peso dela afunda as tábuas perto dos pés. */
export class Ponte {
  constructor(s) {
    this.s = s; this.n = 13;
    this.p = []; this.ant = [];
    for (let i = 0; i < this.n; i++) {
      const x = s.x + (s.w * i) / (this.n - 1), y = s.y + Math.sin((i / (this.n - 1)) * Math.PI) * 6;
      this.p.push({ x, y }); this.ant.push({ x, y });
    }
    this.seg = (s.w / (this.n - 1)) * 1.015;
    this.raiz = new Container();
    this.g = new Graphics();
    this.raiz.addChild(this.g);
  }
  atualizar(dt, pe, vento = 0) {
    const n = this.n, p = this.p, a = this.ant;
    for (let i = 1; i < n - 1; i++) {
      const vx = (p[i].x - a[i].x) * 0.985, vy = (p[i].y - a[i].y) * 0.985;
      a[i].x = p[i].x; a[i].y = p[i].y;
      p[i].x += vx + vento * 4 * dt; p[i].y += vy + 600 * dt * dt;
      // o peso dela: empurra para baixo os pontos perto dos pés
      if (pe && Math.abs(pe.y - this.s.y) < 30) {
        const d = Math.abs(p[i].x - pe.x);
        if (d < 40) p[i].y += (1 - d / 40) * 900 * dt * dt * (1 + Math.abs(pe.vx) / 300);
      }
    }
    for (let k = 0; k < 6; k++) {
      p[0].x = this.s.x; p[0].y = this.s.y; p[n - 1].x = this.s.x + this.s.w; p[n - 1].y = this.s.y;
      for (let i = 0; i < n - 1; i++) {
        const dx = p[i + 1].x - p[i].x, dy = p[i + 1].y - p[i].y, d = Math.hypot(dx, dy) || 1, f = (d - this.seg) / d / 2;
        if (i > 0) { p[i].x += dx * f; p[i].y += dy * f; }
        if (i + 1 < n - 1) { p[i + 1].x -= dx * f; p[i + 1].y -= dy * f; }
      }
    }
    // a ponte não sobe acima da linha de colisão e não desce mais que 16 px (a Aurora pisa na colisão reta)
    for (let i = 1; i < n - 1; i++) p[i].y = Math.min(this.s.y + 16, Math.max(this.s.y - 1, p[i].y));
    this.desenhar();
  }
  desenhar() {
    const g = this.g.clear(), p = this.p, n = this.n, x0 = this.s.x, x1 = this.s.x + this.s.w, y = this.s.y;
    // postes e corrimão (corda que cai em curva, presa nos postes)
    for (const x of [x0, x1]) g.rect(x - 5, y - 64, 10, 74).fill('#4a3020').stroke({ color: '#1e130c', width: 2 });
    g.moveTo(x0, y - 60);
    for (let i = 1; i < n; i++) g.lineTo(p[i].x, p[i].y - 52 + (i === n - 1 ? -8 : 0));
    g.stroke({ color: '#8a6a44', width: 3 });
    for (let i = 1; i < n - 1; i += 2) g.moveTo(p[i].x, p[i].y - 52).lineTo(p[i].x, p[i].y + 2).stroke({ color: '#6e5235', width: 1.5 });
    // cordas de baixo e tábuas
    g.moveTo(p[0].x, p[0].y + 4);
    for (let i = 1; i < n; i++) g.lineTo(p[i].x, p[i].y + 4);
    g.stroke({ color: '#5a4028', width: 3 });
    for (let i = 0; i < n - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2, ang = Math.atan2(p[i + 1].y - p[i].y, p[i + 1].x - p[i].x);
      const w = this.seg * 0.82, h = 8, c = Math.cos(ang), s = Math.sin(ang);
      const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].flatMap(([u, v]) => [mx + u * c - v * s, my + u * s + v * c]);
      g.poly(pts).fill(i % 2 ? '#7a5636' : '#6b4a2e').stroke({ color: '#2a1a10', width: 1.5 });
      g.poly(pts.slice(0, 4).concat([pts[2], pts[3] + 2, pts[0], pts[1] + 2])).fill({ color: '#e7edf9', alpha: 0.75 });   // neve na tábua
    }
  }
}

/** Sombra de contato: elipse escura nos pés, menor e mais clara quanto mais alto. */
export class Sombra {
  constructor(largura = 70) { this.g = new Sprite(manchaSuave()); this.g.anchor.set(0.5); this.g.tint = 0x05040e; this.larg = largura; }
  atualizar(x, pesY, chaoY) {
    if (chaoY == null) { this.g.visible = false; return; }
    const alto = Math.max(0, chaoY - pesY), f = Math.max(0, 1 - alto / 320);
    this.g.visible = f > 0.02;
    this.g.position.set(x, chaoY + 2);
    this.g.width = this.larg * (0.5 + 0.5 * f); this.g.height = 14 * (0.5 + 0.5 * f);
    this.g.alpha = 0.5 * f;
  }
}

/** texto que sobe e some (moedas pegas) */
export function textoQueSobe(cena, x, y, texto, cor = '#e8e4ff') {
  const t = new Text({ text: texto, style: { fill: cor, fontSize: 18, fontWeight: '800', fontFamily: 'system-ui, sans-serif', stroke: { color: '#120d26', width: 4 } } });
  t.anchor.set(0.5); t.position.set(x, y); cena.addChild(t);
  return { t, vida: 1.2 };
}
