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
