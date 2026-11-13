/*
 * Fogueira Lunar: ponto de descanso e salvamento (desenho original do jogo).
 * Pedras em círculo e uma chama prateada e lilás, a cor do sangue de lua da Aurora.
 */
import { Container, Graphics } from '../vendor/pixi.min.mjs';

export class Fogueira {
  constructor(id, x, chaoY) {
    this.id = id; this.x = x; this.chaoY = chaoY;
    this.raiz = new Container();
    this.raiz.position.set(x, chaoY);
    this.brilho = new Graphics();
    this.pedras = new Graphics();
    this.chama = new Graphics();
    this.faiscas = [];
    this.camadaFaiscas = new Graphics();
    this.raiz.addChild(this.brilho, this.pedras, this.chama, this.camadaFaiscas);
    // pedras: elipse de pedras achatadas
    const cores = ['#6b6488', '#57507a', '#7a7398'];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const px = Math.cos(a) * 34, py = Math.sin(a) * 9 + 2;
      this.pedras.ellipse(px, py, 11, 7).fill(cores[i % 3]).stroke({ color: '#231c3d', width: 2 });
    }
    this.pedras.rect(-22, -6, 44, 6).fill('#3b2a24');           // lenha
    this.pedras.rect(-16, -10, 32, 5).fill('#4a3328');
    this.t = Math.random() * 10;
    this.acesa = false;      // fica mais forte depois do primeiro descanso
  }

  atualizar(dt, perto, vento = 0) {
    this.t += dt;
    const t = this.t, forca = this.acesa ? 1 : 0.7;
    const pulso = 0.85 + 0.15 * Math.sin(t * 7) * Math.sin(t * 3.1);
    this.brilho.clear()
      .ellipse(0, 0, 150 * forca, 40 * forca).fill({ color: '#b9a8ff', alpha: 0.14 * pulso })
      .circle(0, -40, 90 * forca * pulso).fill({ color: '#d8ccff', alpha: (perto ? 0.16 : 0.1) * pulso });
    this.chama.clear();
    const camadas = [['#7b5cff', 1.0, 0.85], ['#b9a8ff', 0.75, 0.9], ['#eef0ff', 0.45, 1]];
    for (const [cor, esc, alfa] of camadas) {
      const h = 64 * esc * forca * (0.9 + 0.12 * Math.sin(t * 11 + esc * 5));
      const l = 22 * esc * forca;
      const ondula = 4 * Math.sin(t * 6 + esc * 3) + vento * 14 * (1.2 - esc * 0.4); // a chama deita com o vento
      this.chama.poly([-l, -4, -l * 0.5 + ondula * 0.5, -h * 0.55, ondula, -h, l * 0.5 + ondula * 0.5, -h * 0.5, l, -4]).fill({ color: cor, alpha: alfa });
    }
    // faíscas subindo
    if (Math.random() < dt * 14 * forca) this.faiscas.push({ x: (Math.random() - 0.5) * 30, y: -20, vy: -60 - Math.random() * 60, vida: 1 + Math.random() });
    this.camadaFaiscas.clear();
    for (const f of this.faiscas) {
      f.vida -= dt; f.y += f.vy * dt; f.x += (Math.sin(t * 4 + f.y * 0.05) * 12 + vento * 90) * dt;
      this.camadaFaiscas.circle(f.x, f.y, 1.8).fill({ color: '#e6deff', alpha: Math.max(0, f.vida) });
    }
    this.faiscas = this.faiscas.filter((f) => f.vida > 0);
  }
}
