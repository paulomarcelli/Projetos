/*
 * Desenho de uma fase a partir dos dados (fases/*.json), em camadas (skill 2d-games):
 *   fundo (main.js) · cenário atrás (pinheiros, troncos dos galhos) · terreno (neve, rocha, tronco caído, galhos)
 *   · objetos (placas, rastros, alvos, cervo) · primeiro plano (névoa) — e o HUD da fase (título e cena final).
 * Tudo desenhado em código (traço original do jogo). A lógica de colisão fica em fisica.js / nivel.js.
 */
import { Container, Graphics, Sprite, Text, Texture } from '../vendor/pixi.min.mjs';
import { FUNDO } from './nivel.js';

const NEVE = '#e7edf9', NEVE_SOMBRA = '#b9c3de', CONTORNO = '#15102a';

function aleatorio(semente) {
  let s = semente % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

let texNevoa = null;
/** Mancha suave (degradê radial) para névoa e brilhos. */
export function manchaSuave() {
  if (texNevoa) return texNevoa;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  d.addColorStop(0, 'rgba(255,255,255,0.9)'); d.addColorStop(0.5, 'rgba(255,255,255,0.35)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, 128, 128);
  texNevoa = Texture.from(c);
  return texNevoa;
}

/** Camada de neve no topo de um bloco, com borda de baixo ondulada e um pouco de beiral nos lados. */
function capaDeNeve(g, x, y, w, esp, sorte) {
  const pts = [x - 4, y + 2, x - 2, y - 3, x + w + 2, y - 3, x + w + 4, y + 2];
  for (let px = x + w; px >= x; px -= 18) pts.push(px, y + esp * (0.55 + sorte() * 0.6));
  g.poly(pts).fill(NEVE).stroke({ color: CONTORNO, width: 2, join: 'round' });
  g.rect(x + 2, y - 1, w - 4, 3).fill({ color: '#ffffff', alpha: 0.7 });
}

/** Terreno: um desenho para cada tipo de sólido. */
export function desenharTerreno(fase) {
  const g = new Graphics();
  for (const s of fase.solidos) {
    if (s.tipo === 'invisivel') continue;   // limite da fase
    const sorte = aleatorio(Math.round(s.x * 7 + s.y * 13));
    const fundoY = Math.min(s.y + s.h, FUNDO + 200);
    if (s.tipo === 'galho') {
      g.roundRect(s.x, s.y, s.w, s.h, s.h / 2).fill('#5b3e2c').stroke({ color: CONTORNO, width: 2 });
      g.moveTo(s.x + 10, s.y + s.h * 0.55).lineTo(s.x + s.w - 14, s.y + s.h * 0.5).stroke({ color: '#3d291e', width: 2 });
      g.moveTo(s.x + s.w - 8, s.y + 4).lineTo(s.x + s.w + 14, s.y - 10).stroke({ color: '#4a3324', width: 4, cap: 'round' });
      capaDeNeve(g, s.x + 4, s.y, s.w - 8, 7, sorte);
      continue;
    }
    if (s.tipo === 'tronco') {
      // tronco caído enorme: casca, anéis na ponta e neve por cima
      g.rect(s.x, s.y, s.w, fundoY - s.y).fill('#2c2440');
      g.roundRect(s.x - 6, s.y, s.w + 12, 70, 30).fill('#5a3d2b').stroke({ color: CONTORNO, width: 3 });
      for (let x = s.x + 30; x < s.x + s.w - 20; x += 54) g.moveTo(x, s.y + 22).lineTo(x + 26, s.y + 26).stroke({ color: '#3b281d', width: 3 });
      g.ellipse(s.x + s.w + 4, s.y + 35, 16, 33).fill('#9a7653').stroke({ color: CONTORNO, width: 3 });
      g.ellipse(s.x + s.w + 4, s.y + 35, 8, 18).stroke({ color: '#6e5238', width: 2 });
      capaDeNeve(g, s.x, s.y, s.w, 12, sorte);
      continue;
    }
    // neve e rocha: bloco de terra/rocha com pedras, faixa de sombra e neve no topo
    const corpo = s.tipo === 'rocha' ? '#3a3455' : '#2d2643';
    g.rect(s.x, s.y, s.w, fundoY - s.y).fill(corpo).stroke({ color: CONTORNO, width: 3 });
    g.rect(s.x, s.y + 12, s.w, 18).fill({ color: '#0d0a1c', alpha: 0.28 });
    const n = Math.floor((s.w * Math.min(300, fundoY - s.y)) / 5200);
    for (let i = 0; i < n; i++) {
      const px = s.x + 10 + sorte() * (s.w - 20), py = s.y + 40 + sorte() * Math.min(260, fundoY - s.y - 50);
      const r = 4 + sorte() * 9;
      g.ellipse(px, py, r * 1.4, r).fill(s.tipo === 'rocha' ? '#4b4569' : '#3a3253').stroke({ color: '#1d1733', width: 1.5 });
    }
    if (s.tipo === 'rocha') {
      for (let i = 0; i < 3; i++) {
        const px = s.x + 20 + sorte() * (s.w - 40);
        g.moveTo(px, s.y + 30).lineTo(px + 8, s.y + 60).lineTo(px - 4, s.y + 90).stroke({ color: '#221c3a', width: 2 });
      }
    }
    if (s.y > -300) capaDeNeve(g, s.x, s.y, s.w, s.tipo === 'rocha' ? 9 : 14, sorte);
  }
  return g;
}

function pinheiro(g, x, y, h, sorte) {
  g.rect(x - 7, y - h * 0.25, 14, h * 0.25).fill('#2a1f1b');
  const camadas = 4;
  for (let i = 0; i < camadas; i++) {
    const topo = y - h + (i * h * 0.62) / camadas, base = topo + h * 0.38, larg = h * (0.18 + i * 0.075);
    g.poly([x, topo, x + larg, base, x - larg, base]).fill('#1c2b36').stroke({ color: CONTORNO, width: 2, join: 'round' });
    g.poly([x, topo + 2, x + larg * 0.55, topo + (base - topo) * 0.55, x + larg * 0.2, topo + (base - topo) * 0.48,
      x - larg * 0.1, topo + (base - topo) * 0.58, x - larg * 0.5, topo + (base - topo) * 0.5]).fill({ color: NEVE, alpha: 0.9 });
    g.moveTo(x - larg + 4, base - 2).lineTo(x + larg - 4, base - 2).stroke({ color: NEVE_SOMBRA, width: 3, alpha: 0.6 + sorte() * 0.3 });
  }
}

/** Cenário atrás da Aurora: pinheiros e os troncos que seguram os galhos. */
export function desenharCenario(fase) {
  const g = new Graphics();
  const sorte = aleatorio(fase.id.length * 911);
  for (const p of fase.pinheiros ?? []) pinheiro(g, p.x, p.y, p.h, sorte);
  for (const t of fase.troncos ?? []) {
    g.rect(t.x - 13, t.topo, 26, t.base - t.topo).fill('#3a2a22').stroke({ color: CONTORNO, width: 2 });
    for (let y = t.topo + 30; y < t.base - 10; y += 48) g.moveTo(t.x - 6, y).lineTo(t.x + 4, y + 14).stroke({ color: '#2a1d17', width: 2 });
    g.ellipse(t.x, t.topo + 4, 15, 7).fill(NEVE).stroke({ color: CONTORNO, width: 2 });
  }
  return g;
}

/** Pegadas do cervo na neve: pares de cascos a cada passo, levando para o caminho certo. */
export function desenharRastros(fase) {
  const g = new Graphics();
  for (const r of fase.rastros ?? []) {
    let lado = 0;
    for (let x = r.de; x <= r.ate; x += 44) {
      const dy = lado ? -3 : 2; lado ^= 1;
      g.ellipse(x, r.y - 4 + dy, 3.2, 1.6).fill({ color: '#7f8bb3', alpha: 0.75 });
      g.ellipse(x + 6, r.y - 4 + dy, 3.2, 1.6).fill({ color: '#7f8bb3', alpha: 0.75 });
    }
  }
  return g;
}

/** Placa de madeira com uma dica. */
export function criarPlaca(p) {
  const raiz = new Container();
  const texto = new Text({ text: p.texto, style: { fill: '#f1ecff', fontSize: 15, fontWeight: '600', fontFamily: 'system-ui, sans-serif',
    stroke: { color: '#1a1230', width: 4 } } });
  texto.anchor.set(0.5, 1);
  const w = texto.width + 26;
  const g = new Graphics();
  g.rect(-4, -70, 8, 70).fill('#4a3324').stroke({ color: CONTORNO, width: 2 });
  g.roundRect(-w / 2, -108, w, 40, 6).fill('#5d4230').stroke({ color: CONTORNO, width: 2.5 });
  g.moveTo(-w / 2 + 6, -96).lineTo(w / 2 - 6, -96).stroke({ color: '#7a583f', width: 2 });
  g.roundRect(-w / 2 + 2, -110, w - 4, 6, 3).fill(NEVE);
  texto.position.set(0, -76);
  raiz.addChild(g, texto);
  raiz.position.set(p.x, p.y);
  return raiz;
}

/** Alvo de palha num poste: some quando leva uma flecha ou um golpe. */
export class Alvo {
  constructor(x, chaoY) {
    this.x = x; this.chaoY = chaoY; this.inteiro = true; this.queda = 0;
    this.raiz = new Container();
    const g = new Graphics();
    g.rect(-4, -70, 8, 70).fill('#4a3324').stroke({ color: CONTORNO, width: 2 });
    this.disco = new Graphics();
    this.disco.circle(0, 0, 26).fill('#d9b46b').stroke({ color: CONTORNO, width: 2.5 });
    this.disco.circle(0, 0, 17).fill('#b0463b');
    this.disco.circle(0, 0, 10).fill('#e8cf94');
    this.disco.circle(0, 0, 4).fill('#b0463b');
    for (let a = 0; a < 6; a++) {
      const an = (a / 6) * Math.PI * 2;
      this.disco.moveTo(Math.cos(an) * 20, Math.sin(an) * 20).lineTo(Math.cos(an) * 26, Math.sin(an) * 26).stroke({ color: '#a8854a', width: 1.5 });
    }
    this.disco.position.set(0, -92);
    this.raiz.addChild(g, this.disco);
    this.raiz.position.set(x, chaoY);
  }
  get caixa() { return { x: this.x - 26, y: this.chaoY - 118, w: 52, h: 52 }; }
  quebrar() { if (!this.inteiro) return false; this.inteiro = false; this.queda = 0.5; return true; }
  atualizar(dt) {
    if (this.inteiro) { this.disco.rotation = Math.sin(performance.now() / 700 + this.x) * 0.04; return; }
    if (this.queda > 0) {
      this.queda -= dt;
      this.disco.y += 260 * dt; this.disco.rotation += 6 * dt; this.disco.alpha = Math.max(0, this.queda / 0.5);
    }
  }
}

/** Cervo (traço original): pasta e levanta a cabeça; ao ser acertado, cai de lado. */
export class Cervo {
  constructor(x, chaoY, direcao = -1) {
    this.x = x; this.chaoY = chaoY; this.vivo = true; this.t = 0; this.queda = 0;
    this.raiz = new Container();
    this.corpo = new Container();
    const g = new Graphics();
    const pata = (px, inclina) => g.poly([px - 5, -62, px + 5, -62, px + 4 + inclina, -6, px + inclina, 0, px - 4 + inclina, -6])
      .fill('#5e4232').stroke({ color: CONTORNO, width: 2, join: 'round' });
    pata(-34, -2); pata(-20, 2); pata(26, -2); pata(38, 3);
    g.ellipse(0, -78, 52, 26).fill('#7c5a43').stroke({ color: CONTORNO, width: 2.5 });
    g.ellipse(4, -66, 38, 12).fill({ color: '#b49272', alpha: 0.8 });
    g.ellipse(-50, -86, 9, 7).fill('#f3ece2').stroke({ color: CONTORNO, width: 2 });     // rabo
    this.cabeca = new Container();
    const c = new Graphics();
    c.poly([0, 0, 12, -6, 30, -48, 18, -56, 4, -20]).fill('#7c5a43').stroke({ color: CONTORNO, width: 2.5, join: 'round' }); // pescoço
    c.ellipse(34, -60, 18, 11).fill('#7c5a43').stroke({ color: CONTORNO, width: 2.5 });
    c.ellipse(48, -56, 7, 6).fill('#5e4232');
    c.circle(31, -63, 2.6).fill('#120d22');
    c.ellipse(20, -72, 7, 4).fill('#6a4c39').stroke({ color: CONTORNO, width: 1.5 });     // orelha
    const chifre = (bx, flip) => {
      c.moveTo(bx, -68).lineTo(bx - 4 * flip, -92).lineTo(bx - 14 * flip, -108).stroke({ color: '#d9c7a4', width: 4, cap: 'round' });
      c.moveTo(bx - 3 * flip, -84).lineTo(bx + 8 * flip, -98).stroke({ color: '#d9c7a4', width: 3.5, cap: 'round' });
      c.moveTo(bx - 8 * flip, -98).lineTo(bx - 2 * flip, -114).stroke({ color: '#d9c7a4', width: 3, cap: 'round' });
    };
    chifre(28, 1); chifre(36, -1);
    this.cabeca.addChild(c);
    this.cabeca.position.set(38, -86);
    this.corpo.addChild(g, this.cabeca);
    this.raiz.addChild(this.corpo);
    this.raiz.position.set(x, chaoY);
    this.raiz.scale.x = -direcao;   // o desenho olha para a direita; direcao -1 = olhando para a esquerda
  }
  get caixa() { return { x: this.x - 60, y: this.chaoY - 120, w: 120, h: 120 }; }
  ferir() { if (!this.vivo) return false; this.vivo = false; this.queda = 0; return true; }
  atualizar(dt) {
    this.t += dt;
    if (this.vivo) {
      // pasta (cabeça baixa) e levanta para olhar em volta, respirando
      const ciclo = (Math.sin(this.t * 0.7) + 1) / 2;
      this.cabeca.rotation = 0.9 * Math.max(0, ciclo - 0.35) / 0.65;
      this.corpo.scale.y = 1 + 0.012 * Math.sin(this.t * 2.4);
      return;
    }
    this.queda = Math.min(1, this.queda + dt * 2.2);
    const e = 1 - (1 - this.queda) ** 3;
    this.corpo.rotation = -1.45 * e; this.corpo.y = -8 * e;
    this.cabeca.rotation = 0.4 * e;
  }
}

/** Névoa do vale: manchas suaves que derivam devagar perto do chão (primeiro plano). */
export class Nevoa {
  constructor(fase) {
    this.raiz = new Container();
    this.manchas = [];
    const tex = manchaSuave(), sorte = aleatorio(4242);
    const ini = fase.solidos.reduce((m, s) => Math.min(m, s.x), 0), fim = fase.solidos.reduce((m, s) => Math.max(m, s.x + s.w), 0);
    for (let x = ini; x < fim; x += 320) {
      const s = new Sprite(tex); s.anchor.set(0.5); s.tint = 0xd8dcf2;
      const base = { x: x + sorte() * 200, y: 560 + sorte() * 160, sx: 4 + sorte() * 3, sy: 0.9 + sorte() * 0.6, a: 0.1 + sorte() * 0.1, fase: sorte() * 6 };
      s.position.set(base.x, base.y); s.scale.set(base.sx, base.sy); s.alpha = base.a;
      this.raiz.addChild(s); this.manchas.push({ s, ...base });
    }
    // névoa densa do abismo, cobrindo o fim dos blocos lá embaixo
    const abismo = new Graphics();
    for (let i = 0; i < 6; i++) abismo.rect(ini - 400, 880 + i * 40, fim - ini + 800, 400).fill({ color: '#cfd4ee', alpha: 0.06 + i * 0.03 });
    this.raiz.addChildAt(abismo, 0);
    this.t = 0;
  }
  atualizar(dt, vento) {
    this.t += dt;
    for (const m of this.manchas) {
      m.s.x = m.x + Math.sin(this.t * 0.15 + m.fase) * 60 + vento * 40;
      m.s.alpha = m.a * (0.8 + 0.2 * Math.sin(this.t * 0.4 + m.fase));
    }
  }
}

const estilo = (tam, cor = '#efeaff', peso = '600') => ({ fill: cor, fontSize: tam, fontFamily: 'system-ui, sans-serif', fontWeight: peso });

/** Título da fase no começo (aparece e some sozinho). */
export class Titulo {
  constructor(fase) {
    this.raiz = new Container();
    this.sub = new Text({ text: fase.subtitulo.toUpperCase(), style: { ...estilo(15, '#b9a8ff', '700'), letterSpacing: 4 } });
    this.nome = new Text({ text: fase.titulo, style: { ...estilo(42, '#f4f0ff', '700'), stroke: { color: '#120d26', width: 6 } } });
    this.sub.anchor.set(0.5); this.nome.anchor.set(0.5);
    this.raiz.addChild(this.sub, this.nome);
    this.t = 0; this.raiz.alpha = 0;
  }
  atualizar(dt, W, H) {
    this.t += dt;
    const a = this.t < 0.8 ? this.t / 0.8 : this.t < 3.2 ? 1 : Math.max(0, 1 - (this.t - 3.2) / 1);
    this.raiz.alpha = a; this.raiz.visible = a > 0;
    this.sub.position.set(W / 2, H * 0.28 - 34); this.nome.position.set(W / 2, H * 0.28 + 6);
  }
}

/** Cena do fim da fase: escurece, mostra as falas uma a uma (E, Enter ou toque avança). */
export class CenaFinal {
  constructor(fase) {
    this.falas = fase.fim ?? [];
    this.raiz = new Container(); this.raiz.visible = false;
    this.veu = new Graphics();
    this.quem = new Text({ text: '', style: { ...estilo(16, '#b9a8ff', '700'), letterSpacing: 2 } });
    this.fala = new Text({ text: '', style: { ...estilo(24, '#f4f0ff', '500'), wordWrap: true, wordWrapWidth: 760, lineHeight: 36, align: 'center' } });
    this.dica = new Text({ text: 'E  continuar', style: estilo(14, '#9d93c8', '600') });
    for (const t of [this.quem, this.fala, this.dica]) t.anchor.set(0.5, 0);
    this.raiz.addChild(this.veu, this.quem, this.fala, this.dica);
    this.ativa = false; this.i = 0; this.t = 0; this.acabou = false;
  }
  comecar() { this.ativa = true; this.raiz.visible = true; this.i = 0; this.t = 0; this.mostrar(); }
  mostrar() {
    if (this.i >= this.falas.length) {
      this.quem.text = 'FIM DA FASE 1';
      this.fala.text = 'Continua em: A Tinta que Escorre';
      this.dica.text = 'R  jogar de novo';
      this.acabou = true;
      return;
    }
    const f = this.falas[this.i];
    this.quem.text = f.quem; this.fala.text = f.fala;
  }
  avancar() { if (!this.ativa || this.acabou) return; this.i += 1; this.mostrar(); }
  atualizar(dt, W, H) {
    if (!this.ativa) return;
    this.t += dt;
    this.veu.clear().rect(0, 0, W, H).fill({ color: '#0a0716', alpha: Math.min(0.88, this.t * 0.9) });
    this.fala.style.wordWrapWidth = Math.min(760, W - 80);
    this.quem.position.set(W / 2, H * 0.36); this.fala.position.set(W / 2, H * 0.36 + 34); this.dica.position.set(W / 2, H * 0.36 + 60 + this.fala.height);
    const a = Math.min(1, Math.max(0, (this.t - 0.6) * 2));
    this.quem.alpha = this.fala.alpha = this.dica.alpha = a;
  }
}
