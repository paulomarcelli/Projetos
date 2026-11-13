/*
 * Aurora parada "viva": um único desenho inteiro (alta resolução), deformado por regiões
 * (princípio do Live2D). As variações do mesmo desenho trocam olhos e mão:
 *  - respiração: ombros e peito sobem e descem; a cabeça acompanha
 *  - piscar: olhos abertos → semicerrados → abertos (às vezes duas vezes)
 *  - dedos: a mão solta fecha e abre com transição suave (duas malhas sobrepostas)
 *  - cabelo solto e tranças: oscilam com a brisa, com o vento e com o movimento
 * Regiões em px da imagem: assets/viva/aurora_viva.json (gerado por ferramentas/compor_viva.py).
 */
import { Assets, Container, MeshPlane } from '../vendor/pixi.min.mjs';

const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const dentro = (caixa, x, y, borda) =>
  suave(caixa[0] - borda, caixa[0] + borda, x) * (1 - suave(caixa[2] - borda, caixa[2] + borda, x)) *
  suave(caixa[1] - borda, caixa[1] + borda, y) * (1 - suave(caixa[3] - borda, caixa[3] + borda, y));

export async function carregarAuroraViva() {
  const meta = await (await fetch('assets/viva/aurora_viva.json')).json();
  const tex = {};
  await Promise.all(meta.texturas.map(async (n) => { tex[n] = await Assets.load(`assets/viva/aurora_${n}.png`); }));
  return new AuroraViva(tex, meta);
}

class AuroraViva {
  constructor(tex, meta) {
    this.tex = tex; this.m = meta;
    this.altura = meta.altura;
    this.raiz = new Container();
    const malha = () => {
      const m = new MeshPlane({ texture: tex.olhos_abertos_mao_aberta, verticesX: 22, verticesY: 40 });
      m.position.set(-meta.pes[0], -meta.pes[1]);
      this.raiz.addChild(m);
      return m;
    };
    this.base = malha();
    this.sobre = malha();              // camada para a transição suave da mão
    this.sobre.alpha = 0;
    this.orig = Float32Array.from(this.base.geometry.attributes.aPosition.buffer.data);
    this.t = 0; this.forca = 0;
    this.olhos = 'abertos'; this.mao = 'aberta'; this.maoAlvo = 'aberta'; this.fade = 1;
    this.proximaPiscada = 1.8; this.piscando = -1; this.duasVezes = false;
    this.proximoGesto = 3.5; this.gesto = -1;
  }

  textura(olhos, mao) { return this.tex[`olhos_${olhos === 'abertos' ? 'abertos' : 'semi'}_mao_${mao}`]; }

  sentir(acelX, _acelY, direcao) { this.forca += -acelX * direcao * 0.00004; }

  /** ventoLocal: força do vento no lado para onde ela olha (-1..1). */
  atualizar(dt, ventoLocal = 0) {
    this.t += dt;
    const t = this.t, M = this.m;

    // piscar
    this.proximaPiscada -= dt;
    if (this.proximaPiscada <= 0 && this.piscando < 0) {
      this.piscando = 0; this.proximaPiscada = 2.4 + Math.random() * 3.2; this.duasVezes = Math.random() < 0.22;
    }
    if (this.piscando >= 0) {
      this.piscando += dt;
      this.olhos = this.piscando < 0.13 ? 'semi' : 'abertos';
      if (this.piscando >= 0.13) { this.piscando = -1; if (this.duasVezes) { this.duasVezes = false; this.proximaPiscada = 0.16; } }
    }
    // dedos: fecha a mão por um instante e relaxa de novo
    this.proximoGesto -= dt;
    if (this.proximoGesto <= 0 && this.gesto < 0) { this.gesto = 0; this.proximoGesto = 4 + Math.random() * 5; }
    if (this.gesto >= 0) {
      this.gesto += dt;
      const alvo = this.gesto < 0.9 ? 'fechada' : 'aberta';
      if (alvo !== this.maoAlvo) { this.maoAlvo = alvo; this.fade = 0; }
      if (this.gesto > 1.1) this.gesto = -1;
    }
    if (this.fade < 1) {
      this.fade = Math.min(1, this.fade + dt / 0.14);
      if (this.fade >= 1) this.mao = this.maoAlvo;
    }
    this.base.texture = this.textura(this.olhos, this.mao);
    this.sobre.texture = this.textura(this.olhos, this.maoAlvo);
    this.sobre.alpha = this.mao === this.maoAlvo ? 0 : this.fade;

    // deformação
    const resp = Math.sin((t / 3.6) * Math.PI * 2) * 0.5 + 0.5;          // 0..1
    const balanco = Math.sin(t * 0.9);
    this.forca *= 0.92;
    const vento = 0.5 * Math.sin(t * 1.3) + 0.3 * Math.sin(t * 2.3) + this.forca * 60 + ventoLocal * 4.5;
    const bufs = [this.base.geometry.attributes.aPosition.buffer, this.sobre.geometry.attributes.aPosition.buffer];
    const d = bufs[0].data, o = this.orig;
    const alturaCabelo = M.cabelo[3] - M.cabelo[1];
    for (let i = 0; i < d.length; i += 2) {
      const x = o[i], y = o[i + 1];
      // respiração: acima da cintura sobe; mais forte nos ombros
      const acima = 1 - suave(M.ombro_y, M.cintura_y, y);
      let dy = -9 * resp * acima;
      let dx = 3 * resp * dentro(M.peito, x, y, 25);                       // peito vai um pouco para a frente
      // cabeça: balanço leve em volta do pescoço
      const cabeca = 1 - suave(M.pescoco_y - 30, M.pescoco_y + 10, y);
      dx += 2.2 * balanco * cabeca * ((M.pescoco_y - y) / 120);
      // cabelo solto atrás: mais solto embaixo
      const c = dentro(M.cabelo, x, y, 40);
      const desce = Math.min(1, Math.max(0, (y - M.cabelo[1]) / alturaCabelo));
      dx += c * Math.pow(desce, 1.3) * (10 * Math.sin(t * 1.5 + desce * 3) + vento * 9);
      dy += c * desce * 2.5 * Math.sin(t * 1.1 + x * 0.02);
      // tranças na frente
      const tr = dentro(M.tranca, x, y, 18);
      const desceT = Math.min(1, Math.max(0, (y - M.tranca[1]) / (M.tranca[3] - M.tranca[1])));
      dx += tr * desceT * (5 * Math.sin(t * 1.7 + 1.2) + vento * 4.5);
      d[i] = x + dx; d[i + 1] = y + dy;
    }
    bufs[1].data.set(d);
    bufs[0].update(); bufs[1].update();
  }
}
