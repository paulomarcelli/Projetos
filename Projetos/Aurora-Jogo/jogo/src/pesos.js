/*
 * Pesos do cabelo (gerados por ferramentas/pesos_cabelo.py): quanto cada ponto do desenho pode se mexer.
 * Zero no corpo (o peito, as costas e a armadura ficam parados) e até 1 no cabelo solto.
 * Também: MolaCabelo, o atraso e o balanço do cabelo (mola amortecida + ondas que descem até as pontas).
 */

/** Lê um PNG de pesos e devolve { w, h, data } (RGBA de 0 a 255). */
export async function lerPesos(url) {
  const img = await createImageBitmap(await (await fetch(url)).blob());
  const cv = new OffscreenCanvas(img.width, img.height);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: c.getImageData(0, 0, img.width, img.height).data };
}

/** Peso (0..1) do canal pedido no ponto (x, y), em px da imagem de pesos, com interpolação bilinear. */
export function amostrar(p, x, y, canal = 0) {
  const fx = Math.min(p.w - 1.001, Math.max(0, x)), fy = Math.min(p.h - 1.001, Math.max(0, y));
  const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
  const v = (xx, yy) => p.data[(yy * p.w + xx) * 4 + canal];
  const a = v(x0, y0) * (1 - tx) + v(x0 + 1, y0) * tx;
  const b = v(x0, y0 + 1) * (1 - tx) + v(x0 + 1, y0 + 1) * tx;
  return (a * (1 - ty) + b * ty) / 255;
}

/**
 * Mola do cabelo: o cabelo não segue o vento na hora; acelera, passa um pouco do ponto e volta.
 * `alvo` é para onde o vento e o movimento empurram; `valor` é onde o cabelo está.
 */
export class MolaCabelo {
  constructor(rigidez = 38, amortecimento = 0.32) { this.k = rigidez; this.c = 2 * Math.sqrt(rigidez) * amortecimento; this.valor = 0; this.vel = 0; this.t = 0; }
  atualizar(dt, alvo) {
    this.t += dt;
    const passos = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / passos;
    for (let i = 0; i < passos; i++) {
      this.vel += (this.k * (alvo - this.valor) - this.c * this.vel) * h;
      this.valor += this.vel * h;
    }
    return this.valor;
  }
  /**
   * Deslocamento num ponto do cabelo. `desce` vai de 0 (raiz) a 1 (ponta); `forcaVento` é |vento| (0..1).
   * A ponta atrasa em relação à raiz (onda que desce) e tremula mais quando venta forte.
   */
  deslocamento(desce, forcaVento) {
    const t = this.t, curva = Math.pow(Math.max(0, desce), 1.25);
    const onda = Math.sin(t * 2.1 - desce * 2.6) * (0.25 + 0.75 * desce);
    const tremula = (Math.sin(t * 9.3 - desce * 6.5) * 0.6 + Math.sin(t * 13.7 - desce * 9.1) * 0.4) * forcaVento * desce;
    return { dx: curva * this.valor + onda * 0.18 * Math.abs(this.valor) + tremula * 3.2, dy: tremula * 1.1 };
  }
}

/**
 * Corrente do cabelo (física melhor que a MolaCabelo): N pontos da raiz (fixa) até a ponta, cada um preso à sua pose
 * (mais firme perto da raiz) e aos vizinhos. Por isso o movimento DESCE como uma onda: a raiz responde primeiro, a
 * ponta atrasa e passa do ponto. Recebe a inércia do corpo (impulsos de aceleração): ao pular o cabelo fica para
 * baixo, caindo ele sobe, ao pousar ele cai e quica, ao virar ele chicoteia. Balança em arco (a ponta sobe um pouco
 * quando vai para o lado), não só desliza. Mesma interface da MolaCabelo: atualizar(dt, alvo) e deslocamento().
 * Unidades: px da célula do desenho; acelerações em px/s².
 */
export class CorrenteCabelo {
  constructor({ nos = 8, rigidez = 36, amortecimento = 0.3, acoplamento = 70, inercia = 0.05, comprimento = 170, limite = 70 } = {}) {
    this.n = nos; this.k = rigidez; this.c = 2 * Math.sqrt(rigidez) * amortecimento; this.acop = acoplamento;
    this.inercia = inercia; this.L = comprimento; this.limite = limite;
    this.x = new Float32Array(nos); this.y = new Float32Array(nos); this.vx = new Float32Array(nos); this.vy = new Float32Array(nos);
    this.impX = 0; this.impY = 0; this.t = 0; this.valor = 0;
  }
  /** aceleração do corpo neste passo (px/s², no referencial dela: +x = para a frente), durante dt segundos */
  empurrar(ax, ay, dt) { this.impX += -ax * dt * this.inercia; this.impY += -ay * dt * this.inercia; }
  /** ela virou de lado: o cabelo, que estava atrás, continua indo e passa pela frente (chicote) */
  virar(forca = 1) { for (let i = 1; i < this.n; i++) { const d = i / (this.n - 1); this.x[i] = -this.x[i] * 0.5; this.vx[i] += 260 * forca * d; } }
  atualizar(dt, alvo) {
    this.t += dt;
    const n = this.n, passos = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / passos;
    // os impulsos de inércia viram velocidade, mais forte nas pontas
    for (let i = 1; i < n; i++) { const d = i / (n - 1); this.vx[i] += this.impX * (0.3 + 0.7 * d); this.vy[i] += this.impY * (0.3 + 0.7 * d); }
    this.impX = 0; this.impY = 0;
    for (let p = 0; p < passos; p++) {
      // desvio de cada ponto em relação à pose que o vento/movimento pedem (a ligação entre vizinhos age no desvio:
      // assim ela atrasa a onda sem impedir o cabelo de chegar ao alvo)
      const alvoDe = (j) => alvo * Math.pow(j / (n - 1), 1.25);
      for (let i = 1; i < n; i++) {
        const d = i / (n - 1);
        const kx = this.k * (1.5 - 0.9 * d), ky = this.k * (1.8 - 0.9 * d);     // raiz firme, ponta solta
        const viz = i < n - 1;
        const e = this.x[i] - alvoDe(i), eAnt = this.x[i - 1] - alvoDe(i - 1), eProx = viz ? this.x[i + 1] - alvoDe(i + 1) : e;
        const ax = -kx * e + this.acop * (eAnt - e) + this.acop * 0.5 * (eProx - e) - this.c * this.vx[i];
        const ay = ky * (0 - this.y[i]) + this.acop * (this.y[i - 1] - this.y[i]) + (viz ? this.acop * 0.5 * (this.y[i + 1] - this.y[i]) : 0) - this.c * this.vy[i];
        this.vx[i] += ax * h; this.vy[i] += ay * h;
      }
      for (let i = 1; i < n; i++) {
        this.x[i] = Math.max(-this.limite, Math.min(this.limite, this.x[i] + this.vx[i] * h));
        this.y[i] = Math.max(-this.limite * 0.6, Math.min(this.limite * 0.6, this.y[i] + this.vy[i] * h));
      }
    }
    this.valor = this.x[n - 1];
    return this.valor;
  }
  /** deslocamento {dx, dy} num ponto do cabelo: desce 0 (raiz) … 1 (ponta); forcaVento 0..1 faz as pontas tremularem */
  deslocamento(desce, forcaVento) {
    const f = Math.min(1, Math.max(0, desce)) * (this.n - 1), i = Math.min(this.n - 2, Math.floor(f)), u = f - i;
    const dx = this.x[i] * (1 - u) + this.x[i + 1] * u;
    let dy = this.y[i] * (1 - u) + this.y[i + 1] * u;
    dy -= (dx * dx) / (2 * this.L) * desce;                                    // arco: ao ir para o lado, a ponta sobe
    const t = this.t;
    const tremula = (Math.sin(t * 9.3 - desce * 6.5) * 0.6 + Math.sin(t * 13.7 - desce * 9.1) * 0.4) * forcaVento * desce;
    const onda = Math.sin(t * 2.1 - desce * 2.6) * desce * 0.12 * Math.abs(this.valor);
    return { dx: dx + onda + tremula * 3.2, dy: dy + tremula * 1.1 };
  }
}
