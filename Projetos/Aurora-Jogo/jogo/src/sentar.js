/*
 * Aurora sentando na Fogueira Lunar (arte gerada no Figma: assets/sprites/sentar_folha.*, 8 quadros).
 * Skill 2d-games: antecipação (afunda antes), poses-chave seguradas, continuação (assenta e respira), e fusão entre
 * quadros (o anterior some por cima do novo). O quadro sentado tem quadril e botas no chão: não flutua.
 * Quadros alinhados pela cabeça (ferramentas/montar_folha_figma.py sentar): ao sentar, a cabeça desce quase reta.
 */
import { Assets, Container, Rectangle, Sprite, Texture } from '../vendor/pixi.min.mjs';
import { nitida } from './aurora_viva.js';

const DESCER = [['sentar_0', 0.12], ['sentar_1', 0.15], ['sentar_2', 0.16], ['sentar_3', 0.17], ['sentada_0', 0.26]];
const SUBIR = [['sentada_0', 0.13], ['sentar_3', 0.14], ['sentar_2', 0.14], ['sentar_1', 0.15], ['sentar_0', 0.12]];
const FUNDIR = 0.1;

export async function carregarSentar() {
  const folha = nitida(await Assets.load('assets/sprites/sentar_folha.webp'));
  const meta = await (await fetch('assets/sprites/sentar_folha.json')).json();
  const tex = {};
  for (const [n, p] of Object.entries(meta.pecas)) {
    const [x, y, w, h] = p.quadro;
    tex[n] = new Texture({ source: folha.source, frame: new Rectangle(x, y, w, h) });
  }
  return { tex, meta };
}

export class Sentar {
  /** alturaVisual: altura dela em pé no mundo (o quadro em pé da folha vira essa altura) */
  constructor(arte, alturaVisual) {
    this.tex = arte.tex; this.meta = arte.meta;
    // 0,9: o desenho do Figma tem cabeça e cabelo maiores; um pouco menor, a massa casa com a Aurora em pé
    this.escala = (alturaVisual / arte.meta.pecas.sentar_0.quadro[3]) * 0.9;
    this.raiz = new Container(); this.raiz.visible = false;
    this.atual = new Sprite(); this.fantasma = new Sprite(); this.fantasma.alpha = 0;
    this.raiz.addChild(this.atual, this.fantasma);
    this.estado = 'parado';     // descendo · sentada · subindo · saindo · parado
    this.seq = null; this.t = 0; this.fantasmaT = 0; this.nome = null;
    this.aoSentar = null; this.aoLevantar = null;
  }
  get ativo() { return this.estado !== 'parado'; }
  get duracaoSubir() { return SUBIR.reduce((a, [, d]) => a + d, 0); }

  mostrar(nome) {
    if (nome === this.nome) return;
    if (this.nome) { this.fantasma.texture = this.atual.texture; this.fantasma.anchor.copyFrom(this.atual.anchor); this.fantasma.alpha = 1; this.fantasmaT = FUNDIR; }
    const p = this.meta.pecas[nome];
    this.atual.texture = this.tex[nome];
    this.atual.anchor.set(p.ancora[0] / p.quadro[2], p.ancora[1] / p.quadro[3]);
    this.nome = nome;
  }
  tocarSeq(seq, fim) { this.seq = seq; this.t = 0; this.fimSeq = fim; this.mostrar(seq[0][0]); }

  comecar(aoSentar) {
    this.aoSentar = aoSentar; this.nome = null; this.raiz.visible = true; this.raiz.alpha = 1;
    this.estado = 'descendo';
    this.tocarSeq(DESCER, () => {
      this.estado = 'sentada';
      this.repouso = { t: 0, piscar: 2.2 + Math.random() * 2, pensar: 6 + Math.random() * 5, rosto: null, ate: 0 };
      this.mostrar('sentada_1');
      this.aoSentar?.();
    });
  }
  levantar(aoLevantar) {
    this.aoLevantar = aoLevantar;
    this.estado = 'subindo';
    this.tocarSeq(SUBIR, () => { this.estado = 'saindo'; this.saindo = 0.12; this.aoLevantar?.(); });
  }
  /** interrompe (ela andou ou caiu): some na hora */
  parar() { this.estado = 'parado'; this.raiz.visible = false; this.seq = null; }

  atualizar(dt) {
    if (this.estado === 'parado') return;
    if (this.seq) {
      this.t += dt;
      let t = this.t, i = 0;
      while (i < this.seq.length - 1 && t >= this.seq[i][1]) { t -= this.seq[i][1]; i += 1; }
      this.mostrar(this.seq[i][0]);
      const total = this.seq.reduce((a, [, d]) => a + d, 0);
      if (this.t >= total) { const fim = this.fimSeq; this.seq = null; fim?.(); }
    }
    if (this.estado === 'sentada') {
      // pisca de vez em quando; às vezes olha o fogo, pensativa
      const r = this.repouso;
      r.t += dt; r.piscar -= dt; r.pensar -= dt;
      if (r.rosto && r.t >= r.ate) { r.rosto = null; this.mostrar('sentada_1'); }
      if (!r.rosto && r.piscar <= 0) { r.rosto = 'piscar'; r.ate = r.t + 0.16; r.piscar = 2.6 + Math.random() * 3; this.mostrar('sentada_2'); }
      if (!r.rosto && r.pensar <= 0) { r.rosto = 'pensar'; r.ate = r.t + 2.6 + Math.random() * 1.5; r.pensar = 9 + Math.random() * 6; this.mostrar('sentada_3'); }
    }
    if (this.estado === 'saindo') {
      this.saindo -= dt; this.raiz.alpha = Math.max(0, this.saindo / 0.12);
      if (this.saindo <= 0) this.parar();
    }
    if (this.fantasmaT > 0) { this.fantasmaT = Math.max(0, this.fantasmaT - dt); this.fantasma.alpha = this.fantasmaT / FUNDIR; }
  }

  /** pés (x, y), lado (1 = direita), sx/sy: achatar e respirar */
  posicionar(x, y, lado, sx = 1, sy = 1) {
    this.raiz.position.set(x, y);
    this.raiz.scale.set(this.escala * lado * sx, this.escala * sy);   // o desenho olha para a direita
  }
  set tint(cor) { this.atual.tint = cor; this.fantasma.tint = cor; }
}
