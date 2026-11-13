/*
 * Efeitos de impacto (dano na Aurora e golpes nas criaturas), todos feitos em código:
 *  - Faiscas: estilhaços que voam do ponto do golpe, com gravidade e brilho que some
 *  - Numeros: número de dano que sobe e some (vermelho na Aurora, claro nas criaturas)
 *  - Vinheta: as bordas da tela piscam em vermelho quando a Aurora apanha
 *  - Impacto: pausa curta (hit-stop) e tremor de câmera, para o golpe ter peso
 */
import { Container, Graphics, Text } from '../vendor/pixi.min.mjs';

export class Faiscas {
  constructor() { this.raiz = new Container(); this.lista = []; }
  /** cor: hex; n: quantidade; dir: -1/1 (para onde o golpe empurra) */
  explodir(x, y, cor, n = 14, dir = 0) {
    for (let i = 0; i < n; i++) {
      const g = new Graphics();
      const comp = 5 + Math.random() * 9;
      g.moveTo(-comp / 2, 0).lineTo(comp / 2, 0).stroke({ color: cor, width: 2.2, cap: 'round' });
      g.position.set(x, y);
      const ang = dir === 0 ? Math.random() * Math.PI * 2 : (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.9;
      const vel = 220 + Math.random() * 360;
      this.raiz.addChild(g);
      this.lista.push({ g, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel - 120, vida: 0.32 + Math.random() * 0.22, total: 0.5 });
    }
  }
  atualizar(dt) {
    for (const p of this.lista) {
      p.vida -= dt; p.vy += 900 * dt; p.vx *= 0.9;
      p.g.x += p.vx * dt; p.g.y += p.vy * dt;
      p.g.rotation = Math.atan2(p.vy, p.vx);
      p.g.alpha = Math.max(0, p.vida / p.total * 1.6);
    }
    for (let i = this.lista.length - 1; i >= 0; i--) if (this.lista[i].vida <= 0) { this.lista[i].g.destroy(); this.lista.splice(i, 1); }
  }
}

export class Numeros {
  constructor() { this.raiz = new Container(); this.lista = []; }
  mostrar(x, y, texto, cor) {
    const t = new Text({ text: texto, style: { fill: cor, fontSize: 24, fontWeight: '800', fontFamily: 'system-ui, sans-serif', stroke: { color: '#120d26', width: 4 } } });
    t.anchor.set(0.5); t.position.set(x + (Math.random() - 0.5) * 20, y);
    this.raiz.addChild(t);
    this.lista.push({ t, vida: 0.9, vy: -150 });
  }
  atualizar(dt) {
    for (const n of this.lista) {
      n.vida -= dt; n.vy += 260 * dt; n.t.y += n.vy * dt;
      const s = n.vida > 0.75 ? 1 + (n.vida - 0.75) * 3 : 1;   // "pula" ao aparecer
      n.t.scale.set(s); n.t.alpha = Math.min(1, n.vida / 0.3);
    }
    for (let i = this.lista.length - 1; i >= 0; i--) if (this.lista[i].vida <= 0) { this.lista[i].t.destroy(); this.lista.splice(i, 1); }
  }
}

/** Bordas da tela em vermelho, mais fortes quanto menos vida. */
export class Vinheta {
  constructor() { this.g = new Graphics(); this.forca = 0; this.g.eventMode = 'none'; }
  piscar(f = 1) { this.forca = Math.max(this.forca, f); }
  atualizar(dt, W, H, vidaFracao) {
    this.forca = Math.max(0, this.forca - dt * 2.4);
    const base = vidaFracao < 0.3 ? 0.18 * (1 - vidaFracao / 0.3) * (0.7 + 0.3 * Math.sin(performance.now() / 260)) : 0;
    const a = Math.min(0.75, this.forca * 0.55 + base);
    const g = this.g; g.clear();
    if (a <= 0.01) return;
    const camadas = 10, larg = Math.min(W, H) * 0.22;
    for (let i = 0; i < camadas; i++) {
      const e = (larg * (i + 1)) / camadas;
      g.rect(e / 2, e / 2, W - e, H - e).stroke({ color: '#c4142b', width: larg / camadas, alpha: a * (1 - i / camadas) * 0.6 });
    }
  }
}

/** Pausa curta no impacto e tremor de câmera. */
export class Impacto {
  constructor() { this.pausa = 0; this.tremor = 0; this.dx = 0; this.dy = 0; }
  golpe(pausa, tremor) { this.pausa = Math.max(this.pausa, pausa); this.tremor = Math.max(this.tremor, tremor); }
  /** devolve true enquanto o jogo deve ficar parado (hit-stop) */
  atualizar(dt) {
    this.tremor = Math.max(0, this.tremor - dt * 38);
    const a = this.tremor;
    this.dx = (Math.random() * 2 - 1) * a; this.dy = (Math.random() * 2 - 1) * a * 0.7;
    if (this.pausa > 0) { this.pausa -= dt; return true; }
    return false;
  }
}
