/* Painel (vida, mana, moedas) e menu de evolução da Fogueira Lunar. */
import { Assets, Container, FillGradient, Graphics, Sprite, Text } from '../vendor/pixi.min.mjs';
import { ATRIBUTOS, custoNivel } from './progresso.js';

const estilo = (tam, cor = '#efeaff', peso = '500') => ({ fill: cor, fontSize: tam, fontFamily: 'system-ui, sans-serif', fontWeight: peso });

/**
 * Painel de vida e mana: moldura de prata com a lua (arte do Figma, assets/hud/moldura.png), retrato da Aurora no
 * medalhão, barras com degradê e brilho, "dano atrasado" (a parte perdida fica clara e escorre depois), pulso vermelho
 * com pouca vida, número da vida e da mana, nível e moedas de prata.
 * Coordenadas internas = pixels da moldura (631 × 183); o painel inteiro é escalado para a tela.
 */
export async function carregarHud() {
  const [moldura, retrato] = await Promise.all([Assets.load('assets/hud/moldura.png'), Assets.load('assets/hud/retrato.png')]);
  return { moldura, retrato };
}

const VIDA = { x: 190, y: 54, w: 416, h: 22, cima: '#ff8a94', baixo: '#b3173a' };
const MANA = { x: 190, y: 106, w: 315, h: 22, cima: '#a99cff', baixo: '#3f2fc4' };
const JANELA = { x: 91, y: 91, r: 50 };

export class Painel {
  constructor(arte) {
    this.raiz = new Container();
    this.raiz.position.set(14, 36);
    this.raiz.scale.set(0.62);
    this.pulso = new Graphics();                 // brilho vermelho atrás quando a vida está baixa
    const moldura = new Sprite(arte.moldura);
    // retrato no medalhão (recortado em círculo)
    const retrato = new Sprite(arte.retrato);
    retrato.anchor.set(0.5); retrato.width = retrato.height = JANELA.r * 2 + 4;
    retrato.position.set(JANELA.x, JANELA.y);
    const mascara = new Graphics().circle(JANELA.x, JANELA.y, JANELA.r).fill('#ffffff');
    retrato.mask = mascara;
    this.barras = new Graphics();
    this.brilho = new Graphics();                // reflexo que passa pelas barras de tempos em tempos
    this.brilho.blendMode = 'add';
    const est = (t, cor) => ({ fill: cor, fontSize: t, fontFamily: 'system-ui, sans-serif', fontWeight: '800', stroke: { color: '#120d26', width: 4 } });
    this.txVida = new Text({ text: '', style: est(17, '#fff1f3') });
    this.txMana = new Text({ text: '', style: est(17, '#efeaff') });
    this.txVida.anchor.set(1, 0.5); this.txMana.anchor.set(1, 0.5);
    this.txVida.position.set(VIDA.x + VIDA.w - 10, VIDA.y + VIDA.h / 2);
    this.txMana.position.set(MANA.x + MANA.w - 10, MANA.y + MANA.h / 2);
    this.nivel = new Text({ text: '', style: est(18, '#f4f0ff') });
    this.nivel.anchor.set(0.5);
    this.nivel.position.set(JANELA.x, JANELA.y + JANELA.r + 22);
    this.selo = new Graphics();
    this.moeda = new Graphics();
    this.moedas = new Text({ text: '', style: est(20, '#e8e4ff') });
    this.moedas.position.set(232, 140);
    this.moeda.position.set(212, 152);
    this.moeda.circle(0, 0, 11).fill('#cfd3e8').stroke({ color: '#5a5878', width: 2.5 })
      .circle(0, 0, 7).stroke({ color: '#8f93b3', width: 1.5 }).circle(2, -1, 4).fill('#cfd3e8');
    this.moeda.circle(-1.5, 0, 4).fill('#8f93b3');
    this.raiz.addChild(this.pulso, moldura, retrato, mascara, this.barras, this.brilho, this.txVida, this.txMana, this.selo, this.nivel, this.moeda, this.moedas);
    this.vidaAtrasada = null; this.manaAtrasada = null; this.esperaVida = 0; this.antes = performance.now();
    this.ultimaVida = null; this.batida = 0;
  }

  atualizar(vida, vidaMax, mana, manaMax, moedas, nivel) {
    const agora = performance.now(), dt = Math.min(0.1, (agora - this.antes) / 1000); this.antes = agora;
    const fv = Math.max(0, vida / vidaMax), fm = Math.max(0, mana / manaMax);
    if (this.vidaAtrasada === null) { this.vidaAtrasada = fv; this.manaAtrasada = fm; this.ultimaVida = fv; }
    if (fv < this.ultimaVida - 0.001) { this.esperaVida = 0.45; this.batida = 1; }     // apanhou: a barra treme
    this.ultimaVida = fv;
    // a parte perdida espera um instante e escorre; ao curar, a barra atrasada acompanha na hora
    this.esperaVida -= dt;
    if (this.vidaAtrasada < fv) this.vidaAtrasada = fv;
    else if (this.esperaVida <= 0) this.vidaAtrasada = Math.max(fv, this.vidaAtrasada - dt * 0.6);
    this.manaAtrasada = this.manaAtrasada < fm ? fm : Math.max(fm, this.manaAtrasada - dt * 0.9);
    this.batida = Math.max(0, this.batida - dt * 3);

    const g = this.barras; g.clear();
    const barra = (B, f, atrasada, corAtrasada) => {
      const r = B.h / 2;
      if (atrasada > f) g.roundRect(B.x, B.y, Math.max(B.h, atrasada * B.w), B.h, r).fill({ color: corAtrasada, alpha: 0.85 });
      if (f > 0) {
        const w = Math.max(B.h, f * B.w);
        const grad = new FillGradient({ type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
          colorStops: [{ offset: 0, color: B.cima }, { offset: 1, color: B.baixo }] });
        g.roundRect(B.x, B.y, w, B.h, r).fill(grad);
        g.roundRect(B.x + 4, B.y + 3, Math.max(0, w - 8), B.h * 0.32, B.h * 0.16).fill({ color: '#ffffff', alpha: 0.32 });   // reflexo
        g.roundRect(B.x, B.y + B.h - 4, w, 4, 2).fill({ color: '#000000', alpha: 0.18 });
      }
    };
    barra(VIDA, fv, this.vidaAtrasada, '#ffe6cf');
    barra(MANA, fm, this.manaAtrasada, '#d9d2ff');
    // reflexo que corre pelas barras a cada 4 s
    const fase = (agora / 1000) % 4 / 4;
    this.brilho.clear();
    for (const [B, f] of [[VIDA, fv], [MANA, fm]]) {
      const x = B.x + fase * (B.w + 80) - 40;
      if (x < B.x + f * B.w - 10) this.brilho.poly([x, B.y, x + 22, B.y, x + 8, B.y + B.h, x - 14, B.y + B.h]).fill({ color: '#ffffff', alpha: 0.22 });
    }
    // pouca vida: pulso vermelho atrás da moldura
    this.pulso.clear();
    if (fv < 0.3) {
      const a = (0.3 - fv) / 0.3 * (0.35 + 0.25 * Math.sin(agora / 180));
      this.pulso.roundRect(-10, 20, 640, 140, 60).fill({ color: '#ff2a4a', alpha: a * 0.5 });
    }
    this.barras.x = this.batida > 0 ? Math.sin(agora / 18) * 4 * this.batida : 0;
    this.txVida.text = `${Math.max(0, Math.ceil(vida))} / ${vidaMax}`;
    this.txMana.text = `${Math.max(0, Math.floor(mana))} / ${manaMax}`;
    this.nivel.text = 'Nv ' + nivel;
    const lw = this.nivel.width + 22;
    this.selo.clear().roundRect(JANELA.x - lw / 2, JANELA.y + JANELA.r + 8, lw, 28, 14).fill({ color: '#2a2150', alpha: 0.95 }).stroke({ color: '#cfd3e8', width: 2 });
    this.moedas.text = String(moedas);
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
