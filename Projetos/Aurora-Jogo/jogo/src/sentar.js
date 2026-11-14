/*
 * Aurora sentando na Fogueira Lunar, com os desenhos dela (folha do Gemini, os mesmos da personagem: antes usamos
 * quadros do Figma, mas o traço ficava diferente). Skill 2d-games: antecipação, poses-chave seguradas, continuação e
 * fusão entre quadros; cabelo com a física da CorrenteCabelo (camada própria, como na Aurora em movimento).
 *
 * Por que ela "flutuava": nesses desenhos o arco está deitado no chão NA FRENTE dela (mais perto da câmera), então
 * fica mais baixo que o corpo; o encaixe usa a parte mais baixa (o arco) e o corpo ficava ~25 px acima do chão.
 * Agora cada quadro desce o que precisa (DESLOC, medido com ferramentas/montar_folha.py: base do corpo sem o arco):
 * quadril e botas no chão, o arco deitado na neve à frente.
 */
import { QuadrosVivos } from './vento.js';

// px (célula) que cada quadro desce: sentar = [em pé, agachada, mão no chão, sentando]; sentada = corpo sentado
const DESLOC_SENTAR = [0, 0, 20, 25], DESLOC_SENTADA = 27;
const SENTADA = { normal: 0, pensativa: 2, olhosFechados: 11 };   // índices dos 3 desenhos dentro de animacoes.sentada

export class Sentar {
  /** animacoes: as da Aurora (main.js); pesos/base: os da folha dela; escala: a dos quadros em movimento */
  constructor(animacoes, pesos, base, escala) {
    const a = animacoes;
    this.descer = { ...a.sentar, duracoes: [0.16, 0.2, 0.17, 0.3], fundir: 0.1, desloc: DESLOC_SENTAR };
    this.subir = { ...a.levantar, duracoes: [0.14, 0.15, 0.16, 0.24], fundir: 0.09, desloc: [...DESLOC_SENTAR].reverse() };
    this.sentadaAnim = { ...a.sentada, fundir: 0.14, desloc: a.sentada.texturas.map(() => DESLOC_SENTADA) };
    this.vivo = new QuadrosVivos(a.sentar.texturas[0], a.sentar.mechas[0], base, pesos, 0.25);
    this.raiz = this.vivo.raiz; this.raiz.visible = false;
    this.escala = escala;
    this.estado = 'parado';     // descendo · sentada · subindo · saindo · parado
  }
  get ativo() { return this.estado !== 'parado'; }
  get duracaoSubir() { return this.subir.duracoes.reduce((s, d) => s + d, 0); }

  comecar(aoSentar) {
    this.aoSentar = aoSentar; this.raiz.visible = true; this.raiz.alpha = 1;
    this.estado = 'descendo'; this.vivo.tocar(this.descer);
  }
  levantar(aoLevantar) { this.aoLevantar = aoLevantar; this.estado = 'subindo'; this.vivo.tocar(this.subir); }
  /** interrompe (ela andou ou caiu): some na hora */
  parar() { this.estado = 'parado'; this.raiz.visible = false; }

  /** cabeloX: para onde o vento empurra o cabelo (px da célula); forcaVento 0..1 */
  atualizar(dt, cabeloX = 0, forcaVento = 0) {
    if (this.estado === 'parado') return;
    const fim = this.vivo.duracoes && this.vivo.t >= this.vivo.duracoes.reduce((s, d) => s + d, 0);
    if (this.estado === 'descendo' && fim) {
      this.estado = 'sentada';
      this.vivo.tocar(this.sentadaAnim); this.vivo.parar(SENTADA.normal);
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
      if (r.rosto && r.t >= r.ate) { r.rosto = null; this.vivo.parar(SENTADA.normal); }
      if (!r.rosto && r.piscar <= 0) { r.rosto = 'piscar'; r.ate = r.t + 0.16; r.piscar = 2.6 + Math.random() * 3; this.vivo.parar(SENTADA.olhosFechados); }
      if (!r.rosto && r.pensar <= 0) { r.rosto = 'pensar'; r.ate = r.t + 2.6 + Math.random() * 1.5; r.pensar = 9 + Math.random() * 6; this.vivo.parar(SENTADA.pensativa); }
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
    this.raiz.scale.set(this.escala * lado * sx, this.escala * sy);
  }
  set tint(cor) { this.vivo.tint = cor; }
}
