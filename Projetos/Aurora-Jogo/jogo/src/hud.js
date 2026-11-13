/* Painel (vida, mana, moedas) e menu de evolução da Fogueira Lunar. */
import { Container, Graphics, Text } from '../vendor/pixi.min.mjs';
import { ATRIBUTOS, custoNivel } from './progresso.js';

const estilo = (tam, cor = '#efeaff', peso = '500') => ({ fill: cor, fontSize: tam, fontFamily: 'system-ui, sans-serif', fontWeight: peso });

export class Painel {
  constructor() {
    this.raiz = new Container();
    this.barras = new Graphics();
    this.moedas = new Text({ text: '', style: estilo(16, '#e8e4ff', '600') });
    this.raiz.addChild(this.barras, this.moedas);
    this.raiz.position.set(16, 40);
  }
  atualizar(vida, vidaMax, mana, manaMax, moedas, nivel) {
    const g = this.barras; g.clear();
    const barra = (y, valor, max, cor, largura) => {
      g.roundRect(0, y, largura, 14, 7).fill({ color: '#000000', alpha: 0.45 });
      g.roundRect(0, y, Math.max(0, (valor / max) * largura), 14, 7).fill(cor);
      g.roundRect(0, y, largura, 14, 7).stroke({ color: '#ffffff', alpha: 0.25, width: 1 });
    };
    barra(0, vida, vidaMax, '#d9465b', 120 + vidaMax * 1.2);
    barra(20, mana, manaMax, '#7b6cff', 120 + manaMax * 1.2);
    this.moedas.text = `Nível ${nivel}   ·   ${moedas} moedas de prata`;
    this.moedas.position.set(0, 42);
  }
}

export class MenuFogueira {
  constructor() {
    this.raiz = new Container();
    this.raiz.visible = false;
    this.fundo = new Graphics();
    this.texto = new Text({ text: '', style: { ...estilo(18), lineHeight: 30, wordWrap: true, wordWrapWidth: 440 } });
    this.raiz.addChild(this.fundo, this.texto);
    this.mensagem = '';
  }
  mostrar(progresso, derivados, largura, altura) {
    const custo = custoNivel(progresso.nivel);
    const linhas = Object.entries(ATRIBUTOS).map(([chave, a], i) =>
      `${i + 1}   ${a.nome}  ${progresso.atributos[chave]}   —  ${a.descricao}`);
    this.texto.text = [
      'FOGUEIRA LUNAR', '',
      `Nível ${progresso.nivel}   ·   ${progresso.moedas} moedas de prata`,
      `Próximo nível: ${custo} moedas${progresso.moedas < custo ? '  (faltam ' + (custo - progresso.moedas) + ')' : ''}`, '',
      ...linhas, '',
      `Vida ${derivados.vidaMax}  ·  Mana ${derivados.manaMax}  ·  Lâmina ${derivados.danoLamina}  ·  Flecha ${derivados.danoFlecha}`,
      this.mensagem, '', 'E   levantar',
    ].join('\n');
    const w = 500, h = this.texto.height + 48;
    this.fundo.clear().roundRect(0, 0, w, h, 16).fill({ color: '#120d26', alpha: 0.88 }).stroke({ color: '#b9a8ff', alpha: 0.5, width: 2 });
    this.texto.position.set(28, 24);
    this.raiz.position.set(largura - w - 40, Math.max(20, (altura - h) / 2));
    this.raiz.visible = true;
  }
  esconder() { this.raiz.visible = false; this.mensagem = ''; }
}
