/*
 * Mapa de luz 2D (técnica clássica): as luzes são desenhadas numa textura que começa com a cor do ambiente
 * (branco = sem efeito, índigo escuro = noite) e somam brilho; essa textura MULTIPLICA a cena. Assim o escuro não
 * apaga as cores (como o véu preto de antes) e cada vela, lanterna, cone de visão ou janela ilumina de verdade
 * a parede e o chão, com bordas suaves. Texturas de luz feitas uma vez em canvas.
 */
import { Container, RenderTexture, Sprite, Texture } from '../vendor/pixi.min.mjs';

function canvas(w, h, desenhar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  return Texture.from(c);
}
let texturas = null;
/** radial (miolo forte, queda suave), cone (fatia de ±abertura saindo da esquerda) e feixe (luar de janela) */
export function texturasDeLuz(abertura = 0.45) {
  if (texturas) return texturas;
  const radial = canvas(256, 256, (g) => {
    const d = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    d.addColorStop(0.6, 'rgba(255,255,255,0.25)'); d.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = d; g.fillRect(0, 0, 256, 256);
  });
  const cone = canvas(512, 512, (g) => {
    g.filter = 'blur(9px)';
    const d = g.createRadialGradient(0, 256, 0, 0, 256, 500);
    d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.5, 'rgba(255,255,255,0.55)'); d.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = d;
    g.beginPath(); g.moveTo(0, 256);
    g.arc(0, 256, 500, -abertura, abertura); g.closePath(); g.fill();
  });
  const feixe = canvas(128, 512, (g) => {
    g.filter = 'blur(10px)';
    const d = g.createLinearGradient(0, 0, 0, 512);
    d.addColorStop(0, 'rgba(255,255,255,0.9)'); d.addColorStop(0.7, 'rgba(255,255,255,0.35)'); d.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = d;
    g.beginPath(); g.moveTo(44, 10); g.lineTo(84, 10); g.lineTo(118, 500); g.lineTo(10, 500); g.closePath(); g.fill();
  });
  texturas = { radial, cone, feixe };
  return texturas;
}

export class MapaDeLuz {
  constructor(app) {
    this.app = app;
    this.mundo = new Container();                 // luzes em coordenadas do mundo (copia a câmera); não vai ao palco
    this.rt = RenderTexture.create({ width: 64, height: 64, resolution: 0.5 });
    this.sprite = new Sprite(this.rt); this.sprite.blendMode = 'multiply';
    this.ambiente = 0xffffff;
  }
  /** cria uma luz (sprite somado) no mundo; textura: 'radial' | 'cone' | 'feixe' */
  luz(textura, x, y, { cor = 0xffffff, alfa = 1, escala = 1, ancora = [0.5, 0.5] } = {}) {
    const s = new Sprite(texturasDeLuz()[textura]);
    s.anchor.set(...ancora); s.position.set(x, y); s.tint = cor; s.alpha = alfa; s.blendMode = 'add';
    if (typeof escala === 'number') s.scale.set(escala); else s.scale.set(escala[0], escala[1]);
    this.mundo.addChild(s);
    return s;
  }
  atualizar(W, H, cena) {
    if (this.rt.width !== W || this.rt.height !== H) {
      // recria (o resize da RenderTexture não atualiza o alvo de render já usado)
      const velha = this.rt;
      this.rt = RenderTexture.create({ width: W, height: H, resolution: 0.5 });
      this.sprite.texture = this.rt;
      velha.destroy(true);
    }
    this.mundo.position.copyFrom(cena.position); this.mundo.scale.copyFrom(cena.scale);
    this.app.renderer.render({ container: this.mundo, target: this.rt, clear: true, clearColor: this.ambiente });
    this.sprite.position.set(0, 0);
  }
}
