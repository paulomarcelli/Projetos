/*
 * Fauna da floresta (arte do Figma): lebres e pássaros que vivem na fase e fogem quando a Aurora chega perto.
 * Só enfeitam: não têm colisão nem dano. Aparecem de novo no lugar quando a Aurora está longe.
 * Detalhes de cada um (skill game-ai: percepção e reação em grupo):
 *  - lebre: limpa o rosto, dá pulinhos, foge em zigue-zague chutando neve, deixa pegadas, bafo frio;
 *  - pássaro: bica, dá pulinhos, vira; quando um voa, os vizinhos se assustam e voam também (bando), e quem
 *    estava num galho derruba neve ao levantar voo.
 */
import { Container } from '../vendor/pixi.min.mjs';
import { pecaFloresta, trocarPeca } from './fase.js';

const PERTO_LEBRE = 230, PERTO_PASSARO = 260, LONGE = 1000;

class Lebre {
  constructor(x, y, chao) {
    this.x0 = x; this.y0 = y; this.chao = chao;
    this.spr = pecaFloresta('lebre_sentada');
    this.reiniciar();
  }
  reiniciar() {
    this.x = this.x0; this.y = this.y0; this.estado = 'sentada'; this.t = Math.random() * 3; this.relogio = 2 + Math.random() * 3;
    this.dir = Math.random() < 0.5 ? -1 : 1; this.spr.alpha = 1; this.spr.visible = true; this.pulo = 0;
  }
  atualizar(dt, ax) {
    this.t += dt; this.relogio -= dt;
    const dist = Math.abs(ax - this.x);
    if (this.estado === 'sumiu') { if (dist > LONGE && this.relogio <= 0) this.reiniciar(); return; }
    if (this.estado !== 'fugindo' && dist < PERTO_LEBRE) { this.estado = 'fugindo'; this.dir = ax < this.x ? 1 : -1; this.relogio = 2.2; }
    if (this.estado === 'sentada' && this.relogio <= 0) {
      // às vezes limpa o rosto, às vezes dá uns pulinhos por perto
      if (Math.random() < 0.5) { this.estado = 'limpando'; this.relogio = 1.4; }
      else { this.estado = 'pulando'; this.relogio = 0.9 + Math.random() * 0.8; this.dir = Math.random() < 0.5 ? -1 : 1; }
    } else if (this.estado === 'limpando' && this.relogio <= 0) { this.estado = 'sentada'; this.relogio = 2 + Math.random() * 3; }
    else if (this.estado === 'pulando' && this.relogio <= 0) { this.estado = 'sentada'; this.relogio = 2 + Math.random() * 3; }
    let nome = 'lebre_sentada';
    if (this.estado === 'limpando') nome = 'lebre_limpa';
    if (this.estado === 'pulando' || this.estado === 'fugindo') {
      const vel = this.estado === 'fugindo' ? 330 : 110;
      const nx = this.x + this.dir * vel * dt;
      // não pula para fora do chão dela
      if (nx < this.chao.x + 10 || nx > this.chao.x + this.chao.w - 10) {
        if (this.estado === 'fugindo') { this.spr.alpha -= dt * 3; } else { this.dir *= -1; }
      } else this.x = nx;
      const ciclo = (this.t * (this.estado === 'fugindo' ? 3.2 : 2.2)) % 1;
      // pousou (fim do pulo): pegadas e, fugindo, neve chutada para trás
      if (this.cicloAntes > 0.8 && ciclo < 0.2 && this.fx) {
        this.fx.neve.marcarBicho(this.x, this.y, 'pata', this.dir);
        if (this.estado === 'fugindo') this.fx.neve.levantar(this.x - this.dir * 8, this.y, 3, this.dir, 0.55);
      }
      this.cicloAntes = ciclo;
      nome = ciclo < 0.25 ? 'lebre_pulo_0' : ciclo < 0.75 ? 'lebre_pulo_1' : 'lebre_pulo_2';
      this.pulo = Math.sin(Math.min(1, ciclo / 0.85) * Math.PI) * (this.estado === 'fugindo' ? 26 : 12);
      if (this.estado === 'fugindo') {
        if (this.relogio <= 0.8) this.spr.alpha = Math.max(0, this.spr.alpha - dt * 1.4);
        if (this.spr.alpha <= 0) { this.estado = 'sumiu'; this.spr.visible = false; this.relogio = 6; }
      }
    } else this.pulo = 0;
    // bafo frio quando está sentada, quietinha
    this.bafoT = (this.bafoT ?? Math.random() * 2) - dt;
    if (this.bafoT <= 0 && this.fx && this.estado !== 'fugindo') { this.fx.part.bafo(this.x + this.dir * 14, this.y - 30, this.dir, 0.45); this.bafoT = 1.8 + Math.random(); }
    trocarPeca(this.spr, nome);
    const e = 46 / 288;
    this.spr.scale.set(e * this.dir, e);
    this.spr.position.set(this.x, this.y - this.pulo + 2);
  }
}

class Passaro {
  constructor(x, y) {
    this.x0 = x; this.y0 = y;
    this.spr = pecaFloresta('passaro_parado');
    this.reiniciar();
  }
  reiniciar() {
    this.x = this.x0; this.y = this.y0; this.estado = 'parado'; this.t = Math.random() * 3; this.relogio = 1 + Math.random() * 2;
    this.dir = Math.random() < 0.5 ? -1 : 1; this.spr.alpha = 1; this.spr.visible = true; this.vy = 0; this.susto = null; this.pulinho = 0;
  }
  /** levanta voo; avisa o bando (os vizinhos voam logo depois) e derruba neve se estava num galho */
  voar(dir) {
    if (this.estado === 'voando' || this.estado === 'sumiu') return;
    this.estado = 'voando'; this.dir = dir; this.vy = -190 - Math.random() * 60; this.relogio = 3; this.susto = null;
    if (this.fx) {
      if (this.noGalho) this.fx.part.neveDoGalho(this.x - 20, this.x + 20, this.y0, this.fx.mundo, 5);
      for (const b of this.fx.bando) if (b !== this && b.estado === 'parado' && Math.abs(b.x - this.x) < 240 && b.susto == null) b.susto = 0.1 + Math.random() * 0.35;
    }
  }
  atualizar(dt, ax, ay) {
    this.t += dt; this.relogio -= dt;
    const dist = Math.hypot(ax - this.x, (ay - this.y) * 0.6);
    if (this.estado === 'sumiu') { if (Math.abs(ax - this.x0) > LONGE && this.relogio <= 0) this.reiniciar(); return; }
    if (this.estado !== 'voando' && (dist < PERTO_PASSARO || this.susto <= 0)) this.voar(ax < this.x ? 1 : -1);
    if (this.susto != null) this.susto -= dt;
    let nome;
    if (this.estado === 'voando') {
      this.x += this.dir * 240 * dt; this.vy = Math.max(-260, this.vy - 60 * dt); this.y += this.vy * dt;
      nome = ['passaro_voo_0', 'passaro_voo_1', 'passaro_voo_2', 'passaro_voo_1'][Math.floor(this.t * 14) % 4];
      if (this.relogio < 1) this.spr.alpha = Math.max(0, this.relogio);
      if (this.relogio <= 0) { this.estado = 'sumiu'; this.spr.visible = false; this.relogio = 5; }
    } else {
      // parado: bica o chão, vira, e às vezes dá um pulinho para o lado
      if (this.relogio <= 0) {
        this.relogio = 0.8 + Math.random() * 2;
        if (Math.random() < 0.3) this.dir *= -1;
        if (Math.random() < 0.35) this.pulinho = 0.22;
      }
      if (this.pulinho > 0) {
        this.pulinho -= dt; this.x += this.dir * 45 * dt;
        this.y = this.y0 - Math.sin((1 - this.pulinho / 0.22) * Math.PI) * 7;
      } else this.y = this.y0;
      nome = this.relogio < 0.35 ? 'passaro_bica' : 'passaro_parado';
    }
    trocarPeca(this.spr, nome);
    const e = 26 / 162;
    this.spr.scale.set(e * this.dir, e);
    this.spr.position.set(this.x, this.y + 1);
  }
}

/** Espalha a fauna pela fase: lebres nos chãos largos de neve, pássaros nos galhos e em alguns chãos. */
export class Fauna {
  constructor(fase) {
    this.raiz = new Container();
    this.bichos = [];
    const chaos = fase.solidos.filter((s) => s.tipo === 'neve' && s.w >= 380 && s.y > 0);
    chaos.forEach((s, i) => {
      if (i % 2 === 0) this.bichos.push(new Lebre(s.x + s.w * (0.3 + 0.4 * ((i * 37) % 10) / 10), s.y, s));
      if (i % 3 === 1) this.bichos.push(new Passaro(s.x + s.w * 0.7, s.y));
    });
    fase.solidos.filter((s) => s.tipo === 'galho').forEach((s, i) => {
      if (i % 2 === 0) { const p = new Passaro(s.x + s.w * 0.45, s.y); p.noGalho = true; this.bichos.push(p); }
    });
    // um bandinho no chão da clareira e no fim da fase (fogem juntos)
    const bando = (x, y, n) => { for (let i = 0; i < n; i++) this.bichos.push(new Passaro(x + i * 34 + Math.random() * 12, y)); };
    bando(700, 640, 3); bando(7300, 500, 3);
    for (const b of this.bichos) this.raiz.addChild(b.spr);
  }
  /** efeitos do mundo: partículas (bafo, neve dos galhos), pegadas (NeveNosPes) e o chão */
  efeitos(part, neve, mundo) {
    const bando = this.bichos.filter((b) => b instanceof Passaro);
    for (const b of this.bichos) b.fx = { part, neve, mundo, bando };
  }
  atualizar(dt, ax, ay) { for (const b of this.bichos) b.atualizar(dt, ax, ay); }
}
