/*
 * Criaturas: sombras de névoa que patrulham e soltam moedas de prata.
 * Arte do Gemini (folha arte/poses-originais/folha_sombra.png → ferramentas/fatiar_sombra.py):
 * 4 quadros andando (flutuando) e 3 de dano/morte (contrai, vira névoa clara, se desfaz).
 */
import { Assets, Container, Rectangle, Sprite, Texture } from '../vendor/pixi.min.mjs';
import { nitida } from './aurora_viva.js';

let ARTE = null;   // texturas compartilhadas por todas as sombras

/** Carrega a folha da sombra uma vez (chamar antes de criar as criaturas). */
export async function carregarSombras() {
  const folha = nitida(await Assets.load('assets/sprites/sombra/sombra_folha.png'));
  const meta = await (await fetch('assets/sprites/sombra/sombra_folha.json')).json();
  const tex = (q) => q.map(([x, y, w, h]) => new Texture({ source: folha.source, frame: new Rectangle(x, y, w, h) }));
  ARTE = { andar: tex(meta.animacoes.andar), morrer: tex(meta.animacoes.morrer), escala: meta.escala };
}

const MORTE = 0.6;          // duração da morte (s)
const ALTURA_CORPO = 56;    // centro do corpo acima do chão (flutua um pouco)

export class Sombra {
  constructor(x, chaoY, limite, moedas = 40) {
    if (!ARTE) throw new Error('chame carregarSombras() antes de criar as sombras');
    this.inicio = { x, limite };
    this.chaoY = chaoY;
    this.moedas = moedas;
    this.raiz = new Container();
    this.corpo = new Sprite(ARTE.andar[0]);
    this.corpo.anchor.set(0.5);
    // clarão do golpe: a mesma imagem somada por cima (clareia sem perder o desenho)
    this.brilho = new Sprite(ARTE.andar[0]);
    this.brilho.anchor.set(0.5); this.brilho.blendMode = 'add'; this.brilho.alpha = 0;
    this.raiz.addChild(this.corpo, this.brilho);
    this.reiniciar();
  }

  reiniciar() {
    this.x = this.inicio.x; this.dir = 1; this.vida = 30; this.viva = true;
    this.piscaDano = 0; this.morrendo = 0; this.t = Math.random() * 5;
    this.vx = 0; this.atordoada = 0;   // empurrão do golpe e tempo atordoada (não anda)
    this.raiz.visible = true; this.raiz.alpha = 1;
  }

  get caixa() { return { x: this.x - 26, y: this.chaoY - 70, w: 52, h: 70 }; }
  /** área que machuca a Aurora: só o miolo da criatura (a névoa das bordas não encosta) */
  get caixaToque() { return { x: this.x - 16, y: this.chaoY - 60, w: 32, h: 60 }; }

  ferir(dano, direcao) {
    if (!this.viva) return false;
    this.vida -= dano; this.piscaDano = 0.15;
    this.vx = direcao * 420; this.atordoada = 0.4;   // é jogada para trás e fica um instante parada
    if (this.vida <= 0) { this.viva = false; this.morrendo = MORTE; return true; }
    return false;
  }

  atualizar(dt) {
    this.t += dt;
    this.x += this.vx * dt; this.vx *= Math.pow(0.0025, dt);     // o empurrão freia rápido
    if (this.viva) {
      this.atordoada = Math.max(0, this.atordoada - dt);
      if (this.atordoada <= 0) this.x += this.dir * 55 * dt;
      const longe = this.x - this.inicio.x;
      if (Math.abs(longe) > this.inicio.limite) { this.dir = -Math.sign(longe); this.x = this.inicio.x + Math.sign(longe) * this.inicio.limite; }
    } else if (this.morrendo > 0) {
      this.morrendo -= dt;
      if (this.morrendo <= 0) this.raiz.visible = false;
    }
    this.piscaDano = Math.max(0, this.piscaDano - dt);
    const t = this.t;

    // quadro: andando em loop; atordoada mostra o quadro contraído; morrendo passa pelos 3 de morte
    let tex, sobe = 0, expande = 1;
    if (!this.viva) {
      const p = 1 - Math.max(0, this.morrendo) / MORTE;          // 0 → 1
      tex = ARTE.morrer[Math.min(2, Math.floor(p * 3))];
      sobe = -18 * p; expande = 1 + 0.25 * p;
      this.raiz.alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    } else if (this.atordoada > 0) {
      tex = ARTE.morrer[0];
    } else {
      tex = ARTE.andar[Math.floor(t * 7) % ARTE.andar.length];
    }
    this.corpo.texture = this.brilho.texture = tex;
    this.brilho.alpha = this.piscaDano > 0 ? 0.85 * this.piscaDano / 0.15 : 0;

    // olha para onde anda (o desenho olha para a direita); "respira" esticando de leve
    const olhar = this.viva ? this.dir : (this.corpo.scale.x >= 0 ? 1 : -1);
    const resp = 1 + 0.035 * Math.sin(t * 3.2);
    const e = ARTE.escala * expande;
    this.corpo.scale.set(olhar * e / resp, e * resp);
    this.brilho.scale.copyFrom(this.corpo.scale);

    // atordoada: tremida e inclinada para trás
    const treme = this.atordoada > 0 ? Math.sin(t * 70) * 2.5 * this.atordoada / 0.4 : 0;
    this.raiz.rotation = this.atordoada > 0 ? -Math.sign(this.vx || 1) * 0.18 * this.atordoada / 0.4 : 0;
    this.raiz.position.set(this.x + treme, this.chaoY - ALTURA_CORPO + 4 * Math.sin(t * 2) + sobe);
  }
}
