/*
 * Boneco articulado da Aurora (usado quando ela está parada).
 * Coordenadas internas = pixels da folha de partes (arte/boneco/montagem.json).
 *
 * Detalhes animados por código:
 *  - respiração: o peito sobe e desce; cabeça, braços, cabelo e tranças acompanham
 *  - piscar: aberto → semicerrado → fechado → semicerrado, em intervalos aleatórios (às vezes duas vezes)
 *  - cabelo de trás: malha deformável (MeshPlane) que balança e reage ao movimento
 *  - tranças e mecha: cordas (MeshRope) com física de corrente (Verlet)
 *  - dedos: a mão da frente alterna entre relaxada e fechada, com pequenos ajustes de ângulo
 *  - túnica: a barra balança
 */
import { Assets, Container, MeshPlane, MeshRope, Point, Sprite } from '../vendor/pixi.min.mjs';

const PASTA = 'assets/boneco/';
const PES = { x: 214, y: 486 };          // ponto dos pés na montagem (vira a origem do boneco)
export const ALTURA_BONECO = 480;          // altura visual da montagem, do topo da tiara aos pés

const TEXTURAS = [
  'cabelo_tras', 'aljava', 'braco_inteiro_2', 'perna_1', 'perna_2', 'tunica_barra', 'shorts',
  'tronco_peitoral', 'cabeca_olhos_abertos', 'cabeca_olhos_semicerrados', 'cabeca_olhos_fechados',
  'braco_superior', 'mao_aberta', 'mao_fechada', 'mao_segurando_arco', 'mao_apontando',
  'tranca_esquerda_corda', 'tranca_direita_corda', 'mecha_2_corda',
];

export async function carregarBoneco() {
  const montagem = await (await fetch(PASTA + 'montagem.json')).json();
  const tex = {};
  await Promise.all(TEXTURAS.map(async (n) => { tex[n] = await Assets.load(PASTA + n + '.png'); }));
  return new Boneco(montagem, tex);
}

/** Corrente de pontos para cabelo (Verlet), em coordenadas do boneco. */
class Corrente {
  constructor(ancora, comprimento, n, rigidez) {
    this.n = n;
    this.seg = comprimento / (n - 1);
    this.rigidez = rigidez;
    this.p = []; this.ant = [];
    for (let i = 0; i < n; i++) {
      this.p.push({ x: ancora.x, y: ancora.y + i * this.seg });
      this.ant.push({ x: ancora.x, y: ancora.y + i * this.seg });
    }
  }
  passo(ancora, dt, forca) {
    const g = 1400;
    for (let i = 1; i < this.n; i++) {
      const p = this.p[i], a = this.ant[i];
      const vx = (p.x - a.x) * 0.94, vy = (p.y - a.y) * 0.94;
      a.x = p.x; a.y = p.y;
      // força para a forma de descanso (trança pendurada reta), deixa o cabelo com "mola"
      const rx = ancora.x - p.x, ry = ancora.y + i * this.seg - p.y;
      p.x += vx + (forca.x * dt * dt) + rx * this.rigidez;
      p.y += vy + (g + forca.y) * dt * dt + ry * this.rigidez * 0.3;
    }
    this.p[0].x = ancora.x; this.p[0].y = ancora.y;
    for (let k = 0; k < 6; k++) {
      for (let i = 1; i < this.n; i++) {
        const a = this.p[i - 1], b = this.p[i];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const corr = (d - this.seg) / d;
        if (i === 1) { b.x -= dx * corr; b.y -= dy * corr; }
        else { a.x += dx * corr * 0.5; a.y += dy * corr * 0.5; b.x -= dx * corr * 0.5; b.y -= dy * corr * 0.5; }
      }
    }
  }
}

/** Malha que balança: guarda as posições originais e desloca as de baixo. */
class MalhaQueBalanca {
  constructor(textura, vx, vy) {
    this.malha = new MeshPlane({ texture: textura, verticesX: vx, verticesY: vy });
    this.buffer = this.malha.geometry.attributes.aPosition.buffer;
    this.original = Float32Array.from(this.buffer.data);
    this.h = textura.height; this.w = textura.width;
  }
  deformar(fn) {
    const d = this.buffer.data, o = this.original;
    for (let i = 0; i < d.length; i += 2) {
      const u = o[i] / this.w, v = o[i + 1] / this.h;
      const [dx, dy] = fn(u, v);
      d[i] = o[i] + dx; d[i + 1] = o[i + 1] + dy;
    }
    this.buffer.update();
  }
}

class Boneco {
  constructor(montagem, tex) {
    this.tex = tex;
    this.t = 0;
    this.raiz = new Container();
    this.raiz.pivot.set(PES.x, PES.y);
    const pos = Object.fromEntries(montagem.pecas.map((p) => [p.nome, p]));
    const sprite = (nome, pai, chave = nome) => {
      const s = new Sprite(tex[chave]);
      s.position.set(pos[nome].x, pos[nome].y);
      pai.addChild(s);
      return s;
    };

    // camadas que ficam paradas (pernas) e a parte de cima, que respira
    this.cima = new Container();          // tudo que sobe e desce com a respiração
    this.cabelo = new MalhaQueBalanca(tex.cabelo_tras, 8, 10);
    this.cabelo.malha.position.set(pos.cabelo_tras.x, pos.cabelo_tras.y);
    this.cima.addChild(this.cabelo.malha);
    sprite('aljava', this.cima);

    this.tranca1 = this.criarTranca(tex.tranca_esquerda_corda, { x: 168, y: 86 }, 8, 0.035);
    this.cima.addChild(this.tranca1.corda);

    this.bracoTras = sprite('braco_inteiro_2', this.cima);
    this.bracoTras.pivot.set(70, 10);
    this.bracoTras.position.set(pos.braco_inteiro_2.x + 70, pos.braco_inteiro_2.y + 10);

    this.raiz.addChild(this.cima);
    sprite('perna_2', this.raiz);
    sprite('perna_1', this.raiz);
    this.tunica = new MalhaQueBalanca(tex.tunica_barra, 6, 6);
    this.tunica.malha.position.set(pos.tunica_barra.x, pos.tunica_barra.y);
    this.raiz.addChild(this.tunica.malha);
    sprite('shorts', this.raiz);

    // frente: tronco, cabeça, mecha, trança da frente e braço da frente
    this.frente = new Container();
    this.tronco = sprite('tronco_peitoral', this.frente);
    this.tronco.pivot.set(46, 120); // cintura
    this.tronco.position.set(pos.tronco_peitoral.x + 46, pos.tronco_peitoral.y + 120);
    this.cabeca = sprite('cabeca_olhos_abertos', this.frente);
    this.cabeca.pivot.set(55, 100); // pescoço
    this.cabeca.position.set(pos.cabeca_olhos_abertos.x + 55, pos.cabeca_olhos_abertos.y + 100);
    this.mecha = this.criarTranca(tex.mecha_2_corda, { x: 180, y: 64 }, 5, 0.05);
    this.frente.addChild(this.mecha.corda);
    this.tranca2 = this.criarTranca(tex.tranca_direita_corda, { x: 203, y: 97 }, 8, 0.035);
    this.frente.addChild(this.tranca2.corda);

    this.braco = new Sprite(tex.braco_superior);
    this.braco.pivot.set(23, 8);
    this.ombro = { x: 228, y: 126 };
    this.braco.position.set(this.ombro.x, this.ombro.y);
    this.mao = new Sprite(tex.mao_aberta);
    this.mao.anchor.set(0.1, 0.5);
    this.mao.position.set(23, 104);        // pulso, em coordenadas do braço
    this.mao.rotation = 1.45;
    this.braco.addChild(this.mao);
    this.frente.addChild(this.braco);
    this.raiz.addChild(this.frente);

    this.proximaPiscada = 1.5;
    this.piscando = -1;
    this.proximoGesto = 3;
    this.gesto = -1;
    this.forca = { x: 0, y: 0 };
  }

  criarTranca(textura, ancora, n, rigidez) {
    const cadeia = new Corrente(ancora, textura.width, n, rigidez);
    const pontos = cadeia.p.map((q) => new Point(q.x, q.y));
    const corda = new MeshRope({ texture: textura, points: pontos });
    return { cadeia, pontos, corda, ancora };
  }

  /** Movimento do corpo no mundo (aceleração em px/s²), para o cabelo reagir. */
  sentir(acelX, acelY, direcao) {
    this.forca.x = -acelX * direcao * 0.9;
    this.forca.y = -acelY * 0.4;
  }

  atualizar(dt) {
    this.t += dt;
    const t = this.t;

    // respiração: ciclo de ~3,6 s; o peito sobe ~2 px e o tronco estica 1,2%
    const resp = Math.sin((t / 3.6) * Math.PI * 2);
    const sobe = -2.2 * (resp * 0.5 + 0.5);
    this.tronco.scale.y = 1 + 0.012 * (resp * 0.5 + 0.5);
    this.cima.y = sobe;
    this.cabeca.y = this.cabeca.y0 ?? (this.cabeca.y0 = this.cabeca.y);
    this.cabeca.y = this.cabeca.y0 + sobe;
    this.cabeca.rotation = 0.012 * Math.sin(t * 0.9) + 0.006 * resp;
    this.braco.y = this.ombro.y + sobe;
    this.braco.rotation = -0.2 + 0.025 * resp + 0.01 * Math.sin(t * 1.7); // braço solto ao lado do corpo
    this.bracoTras.rotation = -0.02 - 0.02 * resp;

    // piscar
    this.proximaPiscada -= dt;
    if (this.proximaPiscada <= 0 && this.piscando < 0) {
      this.piscando = 0;
      this.proximaPiscada = 2.2 + Math.random() * 3.3;
      this.duasVezes = Math.random() < 0.2;
    }
    if (this.piscando >= 0) {
      this.piscando += dt;
      const p = this.piscando;
      const seq = [[0.05, 'semicerrados'], [0.11, 'fechados'], [0.16, 'semicerrados']];
      const atual = seq.find(([fim]) => p < fim);
      this.cabeca.texture = this.tex['cabeca_olhos_' + (atual ? atual[1] : 'abertos')];
      if (!atual) {
        this.piscando = -1;
        if (this.duasVezes) { this.duasVezes = false; this.proximaPiscada = 0.12; } // piscada dupla
      }
    }

    // dedos: de vez em quando fecha a mão e relaxa de novo
    this.proximoGesto -= dt;
    if (this.proximoGesto <= 0 && this.gesto < 0) { this.gesto = 0; this.proximoGesto = 4 + Math.random() * 4; }
    if (this.gesto >= 0) {
      this.gesto += dt;
      const g = this.gesto;
      this.mao.texture = g < 0.12 ? this.tex.mao_aberta : g < 0.75 ? this.tex.mao_fechada : this.tex.mao_aberta;
      if (g > 0.9) this.gesto = -1;
    }
    this.mao.rotation = 1.45 + 0.05 * Math.sin(t * 1.3) + 0.03 * resp;

    // brisa leve + reação ao movimento, que vai se acalmando
    const brisa = 18 * Math.sin(t * 0.7) + 10 * Math.sin(t * 1.9);
    const fx = this.forca.x + brisa;
    this.forca.x *= 0.9; this.forca.y *= 0.9;

    // cabelo de trás: quanto mais para baixo, mais balança
    this.cabelo.deformar((u, v) => {
      const peso = Math.pow(v, 1.6);
      return [peso * (3 * Math.sin(t * 1.4 + v * 2.4) + fx * 0.012), peso * 1.2 * Math.sin(t * 1.1 + u * 3) + v * sobe * 0.5];
    });
    this.tunica.deformar((u, v) => {
      const peso = v * v;
      return [peso * (1.6 * Math.sin(t * 1.8 + u * 2.5) + fx * 0.006), 0];
    });

    // tranças e mecha
    for (const tr of [this.tranca1, this.mecha, this.tranca2]) {
      const ancora = { x: tr.ancora.x, y: tr.ancora.y + sobe };
      tr.cadeia.passo(ancora, Math.min(dt, 1 / 30), { x: fx, y: this.forca.y });
      tr.cadeia.p.forEach((q, i) => tr.pontos[i].set(q.x, q.y));
    }
  }
}
