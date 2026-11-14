/*
 * Aurora sentando na Fogueira Lunar (arte gerada no Figma: 8 quadros em células iguais, assets/sprites/sentar_folha_*).
 * Skill 2d-games: antecipação (afunda antes), poses-chave seguradas, continuação (assenta e respira), e fusão entre
 * quadros. O quadro sentado tem quadril e botas no chão: não flutua. Quadros alinhados pela cabeça
 * (ferramentas/montar_folha_figma.py sentar): ao sentar, a cabeça desce quase reta.
 * Duas camadas, como a Aurora em movimento (ferramentas/pesos_cabelo.py sentar): corpo fixo + cabelo numa malha com a
 * física do cabelo (CorrenteCabelo): ao descer e ao levantar as pontas atrasam e assentam por último.
 */
import { Assets, Rectangle, Texture } from '../vendor/pixi.min.mjs';
import { nitida } from './aurora_viva.js';
import { lerPesos } from './pesos.js';
import { QuadrosVivos } from './vento.js';

const DESCER = [['sentar_0', 0.12], ['sentar_1', 0.15], ['sentar_2', 0.16], ['sentar_3', 0.17], ['sentada_0', 0.26]];
const SUBIR = [['sentada_0', 0.13], ['sentar_3', 0.14], ['sentar_2', 0.14], ['sentar_1', 0.15], ['sentar_0', 0.12]];
const SENTADA = ['sentada_0', 'sentada_1', 'sentada_2', 'sentada_3'];   // apoiada · mãos nos joelhos · olhos fechados · pensativa

export async function carregarSentar() {
  const [corpo, mecha] = await Promise.all(['corpo', 'mecha'].map(async (c) => nitida(await Assets.load(`assets/sprites/sentar_folha_${c}.webp`))));
  const pesos = await lerPesos('assets/sprites/sentar_folha_cabelo.png');
  const meta = await (await fetch('assets/sprites/sentar_folha.json')).json();
  const recorte = (fonte, [x, y, w, h], e = 1) => new Texture({ source: fonte.source, frame: new Rectangle(x * e, y * e, w * e, h * e) });
  const tex = {};
  for (const [n, p] of Object.entries(meta.pecas)) tex[n] = { corpo: recorte(corpo, p.quadro), mecha: recorte(mecha, p.quadro, 0.5) };
  return { tex, meta, pesos };
}

const anim = (tex, seq, extra = {}) => ({
  texturas: seq.map(([n]) => tex[n].corpo), mechas: seq.map(([n]) => tex[n].mecha),
  duracoes: seq.map(([, d]) => d), fps: 10, loop: false, fundir: 0.1, ...extra,
});

export class Sentar {
  /** alturaVisual: altura dela em pé no mundo (o quadro em pé vira essa altura) */
  constructor(arte, alturaVisual) {
    const { tex, meta, pesos } = arte;
    this.descer = anim(tex, DESCER);
    this.subir = anim(tex, SUBIR, { fundir: 0.09 });
    this.sentadaAnim = anim(tex, SENTADA.map((n) => [n, 1]), { fundir: 0.14 });
    this.vivo = new QuadrosVivos(tex.sentar_0.corpo, tex.sentar_0.mecha, meta.base, pesos, 0.25);
    this.raiz = this.vivo.raiz; this.raiz.visible = false;
    // altura do desenho em pé dentro da célula (o quadro de pé ocupa da base até o topo da cabeça)
    const alturaEmPe = meta.altura_em_pe ?? 373;
    // 0,9: o desenho do Figma tem cabeça e cabelo maiores; um pouco menor, a massa casa com a Aurora em pé
    this.escala = (alturaVisual / alturaEmPe) * 0.9;
    this.estado = 'parado';     // descendo · sentada · subindo · saindo · parado
  }
  get ativo() { return this.estado !== 'parado'; }
  get duracaoSubir() { return this.subir.duracoes.reduce((a, b) => a + b, 0); }

  comecar(aoSentar) {
    this.aoSentar = aoSentar; this.raiz.visible = true; this.raiz.alpha = 1;
    this.estado = 'descendo'; this.vivo.tocar(this.descer);
  }
  levantar(aoLevantar) { this.aoLevantar = aoLevantar; this.estado = 'subindo'; this.vivo.tocar(this.subir); }
  /** interrompe (ela andou ou caiu): some na hora */
  parar() { this.estado = 'parado'; this.raiz.visible = false; }
  rosto(i) { this.vivo.parar(i); }

  /** cabeloX: para onde o vento empurra o cabelo (px da célula); forcaVento 0..1 */
  atualizar(dt, cabeloX = 0, forcaVento = 0) {
    if (this.estado === 'parado') return;
    const fim = this.vivo.t >= this.vivo.duracoes?.reduce((a, b) => a + b, 0);
    if (this.estado === 'descendo' && fim) {
      this.estado = 'sentada';
      this.vivo.tocar(this.sentadaAnim); this.vivo.parar(1);
      this.vivo.empurrar(0, -2400 / (1 / 60), 1 / 60);         // assentou: o cabelo cai e quica por último
      this.repouso = { t: 0, piscar: 2.2 + Math.random() * 2, pensar: 6 + Math.random() * 5, rosto: null, ate: 0 };
      this.aoSentar?.();
    } else if (this.estado === 'subindo' && fim) {
      this.estado = 'saindo'; this.saindo = 0.12; this.aoLevantar?.();
    }
    if (this.estado === 'sentada') {
      // pisca de vez em quando; às vezes olha o fogo, pensativa
      const r = this.repouso;
      r.t += dt; r.piscar -= dt; r.pensar -= dt;
      if (r.rosto && r.t >= r.ate) { r.rosto = null; this.rosto(1); }
      if (!r.rosto && r.piscar <= 0) { r.rosto = 'piscar'; r.ate = r.t + 0.16; r.piscar = 2.6 + Math.random() * 3; this.rosto(2); }
      if (!r.rosto && r.pensar <= 0) { r.rosto = 'pensar'; r.ate = r.t + 2.6 + Math.random() * 1.5; r.pensar = 9 + Math.random() * 6; this.rosto(3); }
    }
    if (this.estado === 'saindo') {
      this.saindo -= dt; this.raiz.alpha = Math.max(0, this.saindo / 0.12);
      if (this.saindo <= 0) this.parar();
    }
    this.vivo.atualizar(dt, cabeloX, forcaVento);
  }

  /** pés (x, y), lado (1 = direita), sx/sy: achatar e respirar */
  posicionar(x, y, lado, sx = 1, sy = 1) {
    this.raiz.position.set(x, y);
    this.raiz.scale.set(this.escala * lado * sx, this.escala * sy);   // o desenho olha para a direita
  }
  set tint(cor) { this.vivo.tint = cor; }
}
