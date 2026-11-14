/*
 * Caixa de diálogo no pé da tela: nome de quem fala, texto aparecendo letra a letra e "E  continuar".
 * Falas sem `quem` são narração (em itálico, outra cor). E / Enter / Espaço: completa o texto ou passa para a próxima.
 */
import { Container, Graphics, Text } from '../vendor/pixi.min.mjs';

const fonte = 'system-ui, sans-serif';
const LETRAS_POR_SEGUNDO = 48;

export class CaixaDialogo {
  constructor() {
    this.raiz = new Container(); this.raiz.visible = false;
    this.fundo = new Graphics();
    this.quem = new Text({ text: '', style: { fill: '#c9b8ff', fontSize: 15, fontFamily: fonte, fontWeight: '700', letterSpacing: 2 } });
    this.fala = new Text({ text: '', style: { fill: '#f4f0ff', fontSize: 21, fontFamily: fonte, fontWeight: '500', wordWrap: true, wordWrapWidth: 760, lineHeight: 30 } });
    this.dica = new Text({ text: 'E  continuar', style: { fill: '#9d93c8', fontSize: 13, fontFamily: fonte, fontWeight: '600' } });
    this.dica.anchor.set(1, 1);
    this.raiz.addChild(this.fundo, this.quem, this.fala, this.dica);
    this.falas = []; this.i = 0; this.letras = 0; this.t = 0;
    this.ativa = false; this.aoTerminar = null; this.aoMostrar = null;
  }

  /** falas: [{ quem, fala, ... }]; aoMostrar(fala, i) a cada fala nova; aoTerminar() depois da última. */
  comecar(falas, { aoTerminar = null, aoMostrar = null } = {}) {
    this.falas = falas; this.i = 0; this.aoTerminar = aoTerminar; this.aoMostrar = aoMostrar;
    this.ativa = true; this.raiz.visible = true; this.t = 0;
    this.mostrar();
  }

  get atual() { return this.falas[this.i]; }
  get completa() { return this.letras >= (this.atual?.fala.length ?? 0); }

  mostrar() {
    const f = this.atual;
    this.letras = 0;
    this.quem.text = f.quem ?? '';
    const narracao = !f.quem;
    this.fala.style.fontStyle = narracao ? 'italic' : 'normal';
    this.fala.style.fill = narracao ? '#d9d2f2' : '#f4f0ff';
    this.fala.text = '';
    this.aoMostrar?.(f, this.i);
  }

  avancar() {
    if (!this.ativa) return;
    if (!this.completa) { this.letras = this.atual.fala.length; return; }
    this.i += 1;
    if (this.i >= this.falas.length) {
      this.ativa = false; this.raiz.visible = false;
      this.aoTerminar?.();
      return;
    }
    this.mostrar();
  }

  /** esconder sem terminar (a cena usa a tela inteira, como o título AURORA) */
  set oculta(v) { this.raiz.alpha = v ? 0 : 1; }

  atualizar(dt, W, H) {
    if (!this.ativa) return;
    this.t += dt;
    const f = this.atual;
    this.letras = Math.min(f.fala.length, this.letras + dt * LETRAS_POR_SEGUNDO);
    this.fala.text = f.fala.slice(0, Math.floor(this.letras));
    const largura = Math.min(860, W - 32), altura = 132;
    const x = (W - largura) / 2, y = H - altura - 18;
    this.fundo.clear()
      .roundRect(x, y, largura, altura, 14).fill({ color: '#0d0a1c', alpha: 0.86 })
      .roundRect(x + 0.5, y + 0.5, largura - 1, altura - 1, 14).stroke({ width: 1.5, color: '#8f7cff', alpha: 0.55 });
    this.fala.style.wordWrapWidth = largura - 48;
    const temNome = !!f.quem;
    this.quem.position.set(x + 24, y + 16);
    this.fala.position.set(x + 24, y + (temNome ? 42 : 26));
    this.dica.position.set(x + largura - 18, y + altura - 12);
    this.dica.alpha = this.completa ? 0.6 + 0.4 * Math.sin(this.t * 4) : 0;
  }
}
