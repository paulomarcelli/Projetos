/*
 * Iluminação natural da floresta à noite (tudo em código, barato):
 *  - noite: a tela escurece de leve perto do chão (o céu fica claro, o chão pesa);
 *  - luzes do mundo (somadas): o brilho violeta das Fogueiras Lunares iluminando o chão em volta e a névoa;
 *  - raios de luar: feixes suaves saindo da lua do céu pintado, balançando devagar;
 *  - vinheta: bordas da tela um pouco mais escuras, puxando o olho para o meio.
 */
import { Container, Graphics, Sprite, Texture } from '../vendor/pixi.min.mjs';
import { manchaSuave } from './fase.js';

function texturaVinheta() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(128, 118, 60, 128, 128, 182);
  d.addColorStop(0, 'rgba(6,4,18,0)'); d.addColorStop(0.65, 'rgba(6,4,18,0.18)'); d.addColorStop(1, 'rgba(6,4,18,0.62)');
  g.fillStyle = d; g.fillRect(0, 0, 256, 256);
  return Texture.from(c);
}
function texturaNoite() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d');
  const d = g.createLinearGradient(0, 0, 0, 256);
  d.addColorStop(0, 'rgba(10,8,32,0)'); d.addColorStop(0.45, 'rgba(10,8,32,0.04)'); d.addColorStop(1, 'rgba(10,8,32,0.34)');
  g.fillStyle = d; g.fillRect(0, 0, 4, 256);
  return Texture.from(c);
}

export class Luz {
  constructor() {
    this.noite = new Sprite(texturaNoite());          // tela: escurece embaixo
    this.mundo = new Container(); this.mundo.blendMode = 'add';   // luzes no mundo (mesma câmera da cena)
    this.raios = new Graphics(); this.raios.blendMode = 'add';    // tela: feixes de luar
    this.vinheta = new Sprite(texturaVinheta());
    this.fontes = [];
    this.t = 0;
  }
  /** luz de uma fogueira: um halo largo no ar e uma mancha no chão */
  fogueira(x, chaoY, cor = 0x8f7cff) {
    const ar = new Sprite(manchaSuave()); ar.anchor.set(0.5); ar.tint = cor; ar.position.set(x, chaoY - 90); ar.scale.set(6.5, 5);
    const chao = new Sprite(manchaSuave()); chao.anchor.set(0.5); chao.tint = cor; chao.position.set(x, chaoY + 6); chao.scale.set(7, 1.3);
    this.mundo.addChild(ar, chao);
    this.fontes.push({ ar, chao, fase: Math.random() * 6 });
  }
  /** cena: o container do mundo (copia a câmera); lua: posição da lua na tela */
  atualizar(dt, W, H, cena, lua) {
    this.t += dt;
    this.noite.width = W; this.noite.height = H;
    this.vinheta.width = W; this.vinheta.height = H;
    this.mundo.position.copyFrom(cena.position); this.mundo.scale.copyFrom(cena.scale);
    for (const f of this.fontes) {
      const tremula = 0.85 + 0.1 * Math.sin(this.t * 7 + f.fase) + 0.05 * Math.sin(this.t * 17 + f.fase * 2);
      f.ar.alpha = 0.16 * tremula; f.chao.alpha = 0.22 * tremula;
    }
    // feixes de luar: leque de raios da lua para baixo-esquerda
    const g = this.raios; g.clear();
    if (!lua) return;
    for (let i = 0; i < 5; i++) {
      const ang = 2.05 + i * 0.13 + Math.sin(this.t * 0.12 + i * 1.7) * 0.03;   // ~117° a ~170°: para baixo e para a esquerda
      const larg = 0.035 + (i % 2) * 0.02;
      const L = Math.max(W, H) * 1.6;
      const a1 = ang - larg, a2 = ang + larg;
      const alfa = 0.028 + 0.018 * Math.sin(this.t * 0.35 + i * 2.1);
      g.poly([lua.x, lua.y, lua.x + Math.cos(a1) * L, lua.y + Math.sin(a1) * L, lua.x + Math.cos(a2) * L, lua.y + Math.sin(a2) * L])
        .fill({ color: 0xcfd8ff, alpha: Math.max(0.008, alfa) });
    }
  }
}
