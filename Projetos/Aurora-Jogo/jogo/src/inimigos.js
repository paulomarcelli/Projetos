/*
 * Criaturas provisórias: sombras de névoa que patrulham e soltam moedas de prata.
 * (Desenho provisório feito em código; a arte final virá das fichas dos personagens.)
 */
import { Container, Graphics } from '../vendor/pixi.min.mjs';

export class Sombra {
  constructor(x, chaoY, limite, moedas = 40) {
    this.inicio = { x, limite };
    this.chaoY = chaoY;
    this.moedas = moedas;
    this.raiz = new Container();
    this.corpo = new Graphics();
    this.raiz.addChild(this.corpo);
    this.reiniciar();
  }

  reiniciar() {
    this.x = this.inicio.x; this.dir = 1; this.vida = 30; this.viva = true;
    this.piscaDano = 0; this.morrendo = 0; this.t = Math.random() * 5;
    this.raiz.visible = true; this.raiz.alpha = 1;
  }

  get caixa() { return { x: this.x - 26, y: this.chaoY - 70, w: 52, h: 70 }; }

  ferir(dano, direcao) {
    if (!this.viva) return false;
    this.vida -= dano; this.piscaDano = 0.15; this.x += direcao * 14;
    if (this.vida <= 0) { this.viva = false; this.morrendo = 0.6; return true; }
    return false;
  }

  atualizar(dt) {
    this.t += dt;
    if (this.viva) {
      this.x += this.dir * 55 * dt;
      if (Math.abs(this.x - this.inicio.x) > this.inicio.limite) this.dir *= -1;
    } else if (this.morrendo > 0) {
      this.morrendo -= dt; this.raiz.alpha = Math.max(0, this.morrendo / 0.6);
      if (this.morrendo <= 0) this.raiz.visible = false;
    }
    this.piscaDano = Math.max(0, this.piscaDano - dt);
    const t = this.t, g = this.corpo;
    g.clear();
    const cor = this.piscaDano > 0 ? '#ffffff' : '#2b2148';
    const ondula = (i) => 6 * Math.sin(t * 5 + i);
    g.poly([-26, 0, -24, -40, -14, -66 + ondula(1) * 0.3, 0, -72, 14, -66, 24, -40, 26, 0, 14, ondula(2), 0, -4 + ondula(3), -14, ondula(4)])
      .fill({ color: cor, alpha: 0.92 }).stroke({ color: '#8f7cff', width: 2, alpha: 0.6 });
    const olho = this.dir > 0 ? 6 : -6;
    g.circle(olho - 7, -48, 4).fill('#c9b8ff').circle(olho + 7, -48, 4).fill('#c9b8ff');
    this.raiz.position.set(this.x, this.chaoY + 2 * Math.sin(t * 2));
  }
}
