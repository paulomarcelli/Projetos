// ===== VÍDEO DA LUNA =====
// Cada quadro é desenhado em função do tempo: renderizar(t) sempre gera a mesma imagem para o mesmo t.
// O renderizar.py chama renderizar(quadro / 30) e fotografa a tela, quadro a quadro.
// Textos e tempos das legendas vêm do roteiro.json (configuração central).

let R;                       // roteiro.json
const cenas = [];            // { id, inicio, fim, el, atualizar(t) }
const W = 1920, H = 1080;
const mostrarLegendas = !new URLSearchParams(location.search).has("sem-legendas");

// ---------- movimento ----------
const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => limitar((t - a) / (b - a));
const suave = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const saida = (x) => 1 - Math.pow(1 - x, 3);
const mistura = (a, b, p) => a + (b - a) * p;

function h(tag, props = {}, ...filhos) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === "class") el.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "html") el.innerHTML = v;
        else el.setAttribute(k, v);
    }
    for (const f of filhos.flat()) if (f != null) el.append(f.nodeType ? f : document.createTextNode(f));
    return el;
}
function s(tag, props = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(props)) el.setAttribute(k, v);
    return el;
}
function em(el, x, y, largura) { // posiciona em px
    Object.assign(el.style, { left: `${x}px`, top: `${y}px` });
    if (largura) el.style.width = `${largura}px`;
    el.classList.add("abs");
    return el;
}
function centralizado(y, ...filhos) { // faixa de largura total com o conteúdo no centro
    return h("div", { class: "abs", style: { left: "0", right: "0", top: `${y}px`, display: "flex", justifyContent: "center" } }, ...filhos);
}

// aparece (e some) com deslize, desfoque e escala
function mostrar(el, t, inicio, fim = Infinity, { dur = 0.8, y = 26, x = 0, blur = 6, escala = 1, durSaida = 0.6 } = {}) {
    const pe = saida(prog(t, inicio, inicio + dur));
    const ps = fim === Infinity ? 0 : suave(prog(t, fim - durSaida, fim));
    const o = pe * (1 - ps);
    const d = 1 - pe;
    el.style.opacity = o;
    el.style.visibility = o < 0.002 ? "hidden" : "visible";
    el.style.transform = `translate(${x * d}px, ${y * d - ps * 14}px) scale(${mistura(escala, 1, pe)})`;
    el.style.filter = blur && d > 0.002 ? `blur(${(blur * d).toFixed(2)}px)` : "none";
    return o;
}
function desenhar(caminho, t, inicio, dur = 0.9) { // traço que "se desenha"
    caminho.__L ??= caminho.getTotalLength();
    const p = suave(prog(t, inicio, inicio + dur));
    caminho.style.strokeDasharray = `${caminho.__L} ${caminho.__L}`;
    caminho.style.strokeDashoffset = `${caminho.__L * (1 - p)}`;
    caminho.style.opacity = p > 0 ? 1 : 0;
    return p;
}
function seta(svgEl, d, { cor = "var(--linha)", largura = 2, ponta = true, tracejado = false } = {}) {
    const c = s("path", { d, fill: "none", stroke: cor, "stroke-width": largura, "stroke-linecap": "round", "marker-end": ponta ? "url(#ponta)" : "" });
    if (tracejado) c.dataset.tracejado = "1";
    svgEl.append(c);
    return c;
}
function camadaSvg() {
    const el = s("svg", { class: "camada-svg", viewBox: `0 0 ${W} ${H}` });
    const defs = s("defs");
    const m = s("marker", { id: "ponta", viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    m.append(s("path", { d: "M0,0 L10,5 L0,10 z", fill: "#b7c3f2" }));
    defs.append(m);
    el.append(defs);
    return el;
}
const leg = (cena, k) => R.legendas.filter((l) => l.cena === cena)[k];
const L = (cena, k) => leg(cena, k).inicio;
const imagem = (src, extra = {}) => h("img", { src, alt: "", ...extra });
const LOGO = "../web/logo.png";

function novaCena(id, montar) {
    const dados = R.cenas.find((c) => c.id === id);
    const el = h("div", { class: "cena", id: `cena-${id}` });
    document.getElementById("cenas").append(el);
    const atualizar = montar(el, dados);
    cenas.push({ ...dados, el, atualizar });
}


// ---------- céu: estrelas e rede de partículas (sempre as mesmas, semente fixa) ----------
function aleatorio(semente) {
    return () => { semente |= 0; semente = (semente + 0x6d2b79f5) | 0; let x = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
const sorteio = aleatorio(7);
const estrelas = Array.from({ length: 260 }, () => ({ x: sorteio() * W, y: sorteio() * H, r: sorteio() * 1.3 + 0.35, f: sorteio() * 1.4 + 0.4, fase: sorteio() * 6.3 }));
const particulas = Array.from({ length: 92 }, () => ({ x: sorteio() * W, y: sorteio() * H, vx: (sorteio() - 0.5) * 16, vy: (sorteio() - 0.5) * 10, fase: sorteio() * 6.3 }));

function intensidadeRede(t) {
    if (t < 12) return prog(t, 0.2, 3.2) * (1 - 0.55 * prog(t, 8.5, 12));
    if (t > 155) return mistura(0.45, 0.85, prog(t, 155, 162)) * (1 - prog(t, 168, 174));
    return 0.45;
}

function desenharCeu(ctx, t) {
    ctx.clearRect(0, 0, W, H);
    for (const e of estrelas) {
        const a = (0.22 + 0.6 * (0.5 + 0.5 * Math.sin(t * e.f + e.fase))) * (1 - prog(t, 172, 175));
        ctx.fillStyle = `rgba(235, 240, 255, ${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.283); ctx.fill();
    }
    const I = intensidadeRede(t);
    if (I < 0.01) return;
    const pts = particulas.map((p) => ({
        x: (((p.x + p.vx * t) % W) + W) % W,
        y: (((p.y + p.vy * t + Math.sin(t * 0.3 + p.fase) * 14) % H) + H) % H,
    }));
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
            if (d < 175) {
                ctx.strokeStyle = `rgba(183, 195, 242, ${(I * (1 - d / 175) * 0.32).toFixed(3)})`;
                ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
            }
        }
        ctx.fillStyle = `rgba(214, 222, 255, ${(I * 0.75).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.7, 0, 6.283); ctx.fill();
    }
}


// ---------- 1. abertura ----------
function cenaAbertura(el) {
    const svgEl = camadaSvg();
    const ondas = [];
    for (let k = 0; k < 5; k++) { // linhas de "fala": ondas suaves que viram texto
        let d = "";
        for (let x = 520; x <= 1400; x += 12) {
            const env = Math.sin(((x - 520) / 880) * Math.PI);
            const y = 410 + k * 62 + Math.sin(x * 0.017 + k * 1.3) * 12 * env + Math.sin(x * 0.051 + k) * 4 * env;
            d += `${x === 520 ? "M" : "L"}${x},${y.toFixed(1)} `;
        }
        ondas.push(seta(svgEl, d, { cor: "rgba(183,195,242,0.55)", largura: 1.6, ponta: false }));
    }
    const logoImg = imagem(LOGO, { style: "width:230px;display:block;filter:drop-shadow(0 0 6px rgba(222,230,255,.9)) drop-shadow(0 0 24px rgba(183,195,242,.6))" });
    const logo = centralizado(170, logoImg);
    const faisca = h("div", { class: "abs", style: { left: "948px", top: "175px", width: "24px", height: "24px",
        background: "radial-gradient(circle,#fff 0 1.5px,transparent 3px),linear-gradient(90deg,transparent,#fff,transparent) center/100% 1.5px no-repeat,linear-gradient(0deg,transparent,#fff,transparent) center/1.5px 100% no-repeat",
        filter: "drop-shadow(0 0 6px #b7c3f2)" } });
    const letras = [...R.titulo].map((c) => h("span", { style: { display: "inline-block", whiteSpace: "pre" } }, c));
    const titulo = h("div", { class: "titulo", style: { fontSize: "150px", fontWeight: "500" } }, letras);
    const linhaTitulo = centralizado(420, titulo);
    const sub = centralizado(640, h("div", { class: "sub", style: { fontSize: "34px", color: "#d4dcf0", fontWeight: "300" } }, R.subtitulo));
    el.append(svgEl, logo, faisca, linhaTitulo, sub);

    return (t) => {
        ondas.forEach((o, k) => { desenhar(o, t, 0.4 + k * 0.22, 2.4); o.style.opacity = String(Number(o.style.opacity) * (1 - prog(t, 3.2, 5.0))); });
        mostrar(logo, t, 2.3, Infinity, { dur: 1.4, y: 20, blur: 10, escala: 0.94 });
        const brilho = 0.6 + 0.4 * Math.sin(t * 0.8);
        logoImg.style.filter = `drop-shadow(0 0 ${4 + 3 * brilho}px rgba(222,230,255,.9)) drop-shadow(0 0 ${16 + 14 * brilho}px rgba(183,195,242,${0.4 + 0.3 * brilho}))`;
        const pf = Math.max(prog(t, 4.6, 5.6), prog(t, 9.0, 10.0));
        const fa = Math.sin(pf * Math.PI);
        faisca.style.opacity = fa;
        faisca.style.transform = `scale(${0.4 + fa}) rotate(${pf * 90}deg)`;
        letras.forEach((l, i) => mostrar(l, t, 3.0 + i * 0.13, Infinity, { dur: 1.0, y: 34, blur: 14 }));
        titulo.style.letterSpacing = `${mistura(0.38, 0.12, suave(prog(t, 3.0, 5.2)))}em`;
        mostrar(sub, t, 5.6, Infinity, { dur: 1.2, y: 16, blur: 4 });
    };
}


// ---------- 2. propósito ----------
function cenaProposito(el) {
    const c = (k) => L("proposito", k);
    const titulo = em(h("div", { class: "titulo" }, "Conversa de apoio,", h("br"), "por texto ou por voz."), 120, 190, 660);
    const intro = em(h("div", { class: "sub" }, "Uma aplicação web que ajuda a pessoa a entender o que sente e a dar um próximo passo."), 120, 352, 620);
    const itens = ["Organizar pensamentos", "Refletir sobre situações difíceis", "Considerar outras perspectivas"].map((texto, i) =>
        em(h("div", { style: { display: "flex", alignItems: "center", gap: "18px", fontSize: "29px" } },
            h("span", { class: "marca-item", style: { width: "38px", height: "38px", fontSize: "20px" } }, "✓"), texto), 120, 466 + i * 64, 680));
    const aviso = em(h("div", { class: "card", style: { padding: "18px 24px", borderColor: "rgba(243,217,164,.45)", fontSize: "21px", lineHeight: "1.42" } },
        h("div", { class: "tag fora", style: { display: "inline-block", marginBottom: "10px" } }, "Limite"),
        h("div", {}, "Não substitui psicólogos, diagnóstico nem atendimento de emergência. Em crise: CVV 188 · SAMU 192.")), 120, 676, 600);
    const inicio = imagem("capturas/computador-inicio.png");
    const conversa = imagem("capturas/computador-conversa.png");
    const tela = em(h("div", { class: "notebook empilhado" }, inicio, conversa), 820, 170, 990);
    const selo = em(h("div", { class: "tag exemplo" }, "Resposta-modelo das instruções · exemplo"), 1440, 192);
    const celular = em(h("div", { class: "celular" }, imagem("capturas/celular-inicio.png")), 1590, 330, 250);
    el.append(tela, celular, selo, titulo, intro, ...itens, aviso);

    return (t) => {
        mostrar(titulo, t, 12.4, Infinity, { y: 30, blur: 8 });
        mostrar(intro, t, 13.0);
        itens.forEach((it, i) => mostrar(it, t, c(1) + 0.3 + i * 0.5, Infinity, { x: -20, y: 0 }));
        mostrar(aviso, t, c(2) + 0.2);
        mostrar(tela, t, 12.6, Infinity, { dur: 1.2, y: 40, blur: 10, escala: 0.96 });
        tela.style.transform += ` scale(${mistura(1, 1.025, prog(t, 13, 28))})`;
        conversa.style.opacity = suave(prog(t, c(1) - 0.2, c(1) + 0.8));
        mostrar(selo, t, c(1) + 0.6);
        mostrar(celular, t, 14.2, Infinity, { dur: 1.1, y: 60, blur: 6 });
    };
}


// ---------- 3. arquitetura ----------
const CAMADAS = [
    { nome: "Interface", desc: "HTML, CSS e JavaScript, sem framework.", chips: ["index.html", "script.js", "voz.js"] },
    { nome: "Servidor", desc: "Python + Flask: valida e não guarda conversas.", chips: ["app.py"] },
    { nome: "Segurança", desc: "Regras em código, antes e depois da IA.", chips: ["seguranca.py"] },
    { nome: "Motor da Luna", desc: "Instruções, últimas 30 mensagens, memória autorizada.", chips: ["luna.py"] },
    { nome: "Serviços externos", desc: "Modelo de linguagem e voz do navegador.", chips: ["Google Gemini API", "Web Speech API"] },
];
function cenaArquitetura(el) {
    const c = (k) => L("arquitetura", k);
    const Y = (i) => 200 + i * 134;
    const titulo = em(h("div", { class: "titulo", style: { fontSize: "54px" } }, "Arquitetura em camadas"), 120, 104, 900);
    const svgEl = camadaSvg();
    const bandas = CAMADAS.map((cam, i) => {
        const b = h("div", { class: "banda card", style: { top: `${Y(i)}px` } },
            h("div", { class: "nome" }, cam.nome), h("div", { class: "desc" }, cam.desc),
            h("div", { class: "chips" }, cam.chips.map((x) => h("span", { class: "chip mono" }, x))));
        return b;
    });
    const esqueletos = CAMADAS.map((_, i) => h("div", { class: "banda", style: { top: `${Y(i)}px`, border: "1.5px dashed rgba(183,195,242,.28)" } }));
    // trilhos: ida (esquerda, de cima pra baixo) e volta (direita, de baixo pra cima)
    const ida = [], volta = [];
    const rotIda = ["POST /chat: mensagem + histórico (JSON)", "pedido validado", "nível de risco", "instruções + contexto"];
    const rotVolta = ["resposta + contatos de ajuda", "resposta verificada", "texto da resposta", "JSON: necessidade, resposta, lembrar"];
    const rotulos = [];
    for (let i = 0; i < 4; i++) {
        ida.push(seta(svgEl, `M390,${Y(i) + 52} L390,${Y(i + 1) + 44}`));
        volta.push(seta(svgEl, `M1530,${Y(i + 1) + 52} L1530,${Y(i) + 62}`));
        const ri = em(h("div", { class: "rotulo-seta", style: { textAlign: "right" } }, h("b", {}, rotIda[i])), 130, Y(i) + 82, 240);
        const rv = em(h("div", { class: "rotulo-seta" }, h("b", {}, rotVolta[i])), 1552, Y(i) + 82, 250);
        rotulos.push([ri, rv]);
    }
    const ganchos = CAMADAS.flatMap((_, i) => [seta(svgEl, `M390,${Y(i) + 52} L420,${Y(i) + 52}`, { ponta: false }), seta(svgEl, `M1500,${Y(i) + 52} L1530,${Y(i) + 52}`, { ponta: false })]);
    const pacoteIda = h("div", { class: "ponto" }), pacoteVolta = h("div", { class: "ponto" });
    const semBanco = em(h("div", { style: { display: "flex", gap: "12px" } },
        h("span", { class: "chip" }, "Sem banco de dados"), h("span", { class: "chip" }, "Histórico e memória: opcionais, no navegador (localStorage)")), 420, 862);
    el.append(svgEl, ...esqueletos, ...bandas, ...rotulos.flat(), pacoteIda, pacoteVolta, titulo, semBanco);
    const revela = [c(1), c(2), c(3), c(4), c(4) + 2.4];

    return (t) => {
        mostrar(titulo, t, 28.4);
        esqueletos.forEach((e, i) => { mostrar(e, t, 28.9 + i * 0.2, Infinity, { y: 10, blur: 0 }); e.style.opacity = String(Number(e.style.opacity) * (1 - prog(t, revela[i], revela[i] + 0.6))); });
        bandas.forEach((b, i) => {
            mostrar(b, t, revela[i], Infinity, { y: 18, blur: 6, escala: 0.985 });
            const ativa = i < 4 ? prog(t, revela[i], revela[i] + 0.4) * (1 - prog(t, revela[i + 1] - 0.3, revela[i + 1] + 0.3)) : prog(t, revela[4], revela[4] + 0.4) * (1 - prog(t, c(5), c(5) + 0.5));
            b.style.borderColor = `rgba(183,195,242,${(0.16 + 0.6 * ativa).toFixed(3)})`;
            b.style.boxShadow = `0 18px 60px rgba(3,6,22,.45), 0 0 ${(40 * ativa).toFixed(1)}px rgba(183,195,242,${(0.25 * ativa).toFixed(3)})`;
        });
        ganchos.forEach((g, k) => desenhar(g, t, revela[Math.floor(k / 2)] + 0.3, 0.4));
        ida.forEach((p, i) => { desenhar(p, t, revela[i + 1] - 0.1, 0.8); mostrar(rotulos[i][0], t, revela[i + 1] + 0.3, Infinity, { x: 14, y: 0, blur: 3 }); });
        volta.forEach((p, k) => { const i = 3 - k; desenhar(p, t, c(5) + 0.3 + k * 0.55, 0.7); mostrar(rotulos[i][1], t, c(5) + 0.6 + k * 0.55, Infinity, { x: -14, y: 0, blur: 3 }); });
        mostrar(semBanco, t, c(5) + 0.4);
        // uma mensagem desce pela ida e a resposta sobe pela volta
        const pi = prog(t, c(5) + 2.2, c(5) + 3.6), pv = prog(t, c(5) + 3.7, c(5) + 5.1);
        Object.assign(pacoteIda.style, { left: "390px", top: `${mistura(Y(0) + 52, Y(4) + 52, suave(pi))}px`, opacity: pi > 0 && pi < 1 ? 1 : 0 });
        Object.assign(pacoteVolta.style, { left: "1530px", top: `${mistura(Y(4) + 52, Y(0) + 52, suave(pv))}px`, opacity: pv > 0 && pv < 1 ? 1 : 0 });
    };
}


// ---------- 4. o caminho de uma mensagem ----------
const ETAPAS = [
    ["Interface", "envia texto + histórico"], ["app.py", "valida o pedido"], ["seguranca.py", "avalia o risco"],
    ["luna.py", "instruções + contexto"], ["Gemini", "gera a resposta"], ["Verificação", "regras em código"], ["Tela", "mostra e pode ler em voz alta"],
];
function cenaMensagem(el) {
    const c = (k) => L("mensagem", k);
    const X = (i) => 210 + i * 250, YN = 420;
    const balao = centralizado(150, h("div", { class: "balao-usuario" }, "Estou ansioso porque acho que minha amiga está se afastando."));
    const nota = centralizado(262, h("div", { class: "sub", style: { fontSize: "22px", fontStyle: "italic" } },
        "O modelo pode sugerir interpretações alternativas. Ele não sabe o que a amiga sente ou pensa."));
    const svgEl = camadaSvg();
    const base = seta(svgEl, `M${X(0)},${YN} L${X(6)},${YN}`, { cor: "rgba(183,195,242,.22)", ponta: false });
    const trilho = seta(svgEl, `M${X(0)},${YN} L${X(6)},${YN}`, { cor: "#b7c3f2", largura: 2.5, ponta: false });
    const nos = ETAPAS.map((_, i) => em(h("div", { class: "no" }, String(i + 1)), X(i), YN));
    const rotulos = ETAPAS.map(([a, b], i) => em(h("div", { class: "no-rotulo" }, h("strong", {}, a), h("span", {}, b)), X(i), YN + 60));
    const nivel = em(h("div", { class: "tag codigo", style: { background: "rgba(10,18,48,.9)" } }, "nível: nenhum"), X(2) - 66, YN + 128);
    const pacote = h("div", { class: "ponto" });
    const blocos = [
        `<span class="c">POST /chat</span>\n{ <span class="k">"mensagem"</span>: <span class="s">"Estou ansioso porque acho que…"</span>,\n  <span class="k">"historico"</span>: [ <span class="c">…até 30 mensagens anteriores…</span> ],\n  <span class="k">"memoria_ativa"</span>: false, <span class="k">"modo_voz"</span>: false }`,
        `<span class="c">seguranca.avaliar(mensagem, mensagens_anteriores)</span>\n→ <span class="k">nivel</span>: <span class="s">"nenhum"</span>   <span class="k">categorias</span>: []   <span class="k">sinais</span>: []\n<span class="c">níveis possíveis: nenhum · atencao · alto · imediato</span>`,
        `<span class="c">Gemini ← instruções da Luna + últimas mensagens + mensagem atual</span>\n→ { <span class="k">"necessidade"</span>: <span class="s">"reflexao"</span>,\n    <span class="k">"resposta"</span>: <span class="s">"…"</span>,  <span class="k">"lembrar"</span>: null }\n<span class="c">formato real · conteúdo ilustrativo</span>`,
        `<span class="c">verificar_resposta(texto, avaliacao)</span>\n✓ sem promessa de segredo ou de proteção\n✓ sem incentivo a parar tratamento\n✓ contatos de ajuda incluídos quando há risco`,
    ].map((html) => centralizado(600, h("div", { class: "card bloco-codigo", html, style: { minWidth: "1060px" } })));
    el.append(svgEl, ...nos, ...rotulos, nivel, pacote, balao, nota, ...blocos);

    // trajeto do pacote: [inicio, fim, de, para]
    const trechos = [[c(1) + 0.4, c(1) + 2.2, 0, 1], [c(2) + 0.2, c(2) + 1.6, 1, 2], [c(3) + 0.1, c(3) + 1.0, 2, 3], [c(3) + 1.1, c(3) + 2.3, 3, 4], [c(4) + 0.1, c(4) + 1.1, 4, 5], [c(4) + 1.2, c(4) + 2.3, 5, 6]];
    const janelas = [[c(1) + 0.3, c(2)], [c(2), c(3)], [c(3), c(4)], [c(4), 85]];

    return (t) => {
        mostrar(balao, t, 60.6, Infinity, { y: 20 });
        let posicao = 0;
        for (const [a, b, de, para] of trechos) if (t >= a) posicao = mistura(de, para, suave(prog(t, a, b)));
        const andando = trechos.some(([a, b]) => t > a && t < b);
        Object.assign(pacote.style, { left: `${mistura(X(0), X(6), posicao / 6)}px`, top: `${YN}px`, opacity: t > trechos[0][0] && posicao < 6 ? (andando ? 1 : 0.85) : 0 });
        base.style.opacity = 1; desenhar(base, t, 61.2, 1.4);
        trilho.style.strokeDasharray = `${trilho.__L ??= trilho.getTotalLength()}`;
        trilho.style.strokeDashoffset = `${trilho.__L * (1 - posicao / 6)}`;
        nos.forEach((n, i) => {
            mostrar(n, t, 61.0 + i * 0.15, Infinity, { y: 12, blur: 4, escala: 0.8 });
            const aceso = limitar(posicao - i + 1);
            n.style.borderColor = aceso > 0.5 ? "#b7c3f2" : "rgba(183,195,242,.55)";
            n.style.boxShadow = aceso > 0.5 ? "0 0 26px rgba(183,195,242,.55)" : "none";
            n.style.color = aceso > 0.5 ? "#fff" : "#a9b5d4";
            mostrar(rotulos[i], t, 61.2 + i * 0.15, Infinity, { y: 10, blur: 3 });
        });
        mostrar(nivel, t, c(2) + 1.6, Infinity, { y: 10 });
        blocos.forEach((b, i) => mostrar(b, t, janelas[i][0], i < 3 ? janelas[i][1] + 0.3 : Infinity, { y: 16, blur: 4, durSaida: 0.4 }));
        mostrar(nota, t, c(3) + 2.4, Infinity, { y: 10 });
    };
}


// ---------- 5. instruções ----------
function cenaInstrucoes(el) {
    const c = (k) => L("instrucoes", k);
    const itens = ["Compreender o contexto", "Acolher sem julgar", "Separar fatos de interpretações", "Considerar outras explicações", "Evitar conclusões precipitadas", "Reconhecer os limites da IA"];
    const linhas = itens.map((x) => h("div", { class: "item" }, h("span", { class: "marca-item" }, "✓"), x));
    const cartao = em(h("div", { class: "card", style: { padding: "34px 40px" } },
        h("div", { class: "eyebrow" }, "Instruções da Luna"), h("div", { class: "mono", style: { fontSize: "18px", color: "#a9b5d4", margin: "8px 0 14px" } }, "trecho resumido · luna.py"), linhas), 120, 170, 720);
    const fato = h("span", { class: "realce" }, "Ela demorou para responder.");
    const interp = h("span", { class: "realce" }, "Então não gosta mais de mim.");
    const inicial = em(h("div", { class: "card", style: { padding: "30px 36px", borderColor: "rgba(242,201,201,.35)" } },
        h("div", { class: "eyebrow", style: { color: "#f2c9c9" } }, "Interpretação inicial"),
        h("div", { class: "citacao", style: { marginTop: "14px" } }, "“", fato, " ", interp, "”")), 940, 170, 860);
    const legenda = em(h("div", { style: { display: "flex", gap: "14px", alignItems: "center" } },
        h("span", { class: "tag codigo" }, "fato"), h("span", { class: "sub", style: { fontSize: "21px" } }, "a demora"),
        h("span", { class: "tag fora", style: { marginLeft: "18px", color: "#f2c9c9", borderColor: "rgba(242,201,201,.55)" } }, "interpretação"), h("span", { class: "sub", style: { fontSize: "21px" } }, "o motivo imaginado")), 940, 420);
    const alternativa = em(h("div", { class: "card", style: { padding: "30px 36px", borderColor: "rgba(183,195,242,.5)", boxShadow: "0 0 50px rgba(183,195,242,.14)" } },
        h("div", { class: "eyebrow" }, "Perspectiva alternativa"),
        h("div", { class: "citacao", style: { marginTop: "14px" } }, "“A demora é um fato. O motivo ainda é desconhecido e pode ter diferentes explicações.”")), 940, 500, 860);
    const rodape = em(h("div", { class: "chip", style: { fontSize: "21px", borderColor: "rgba(243,217,164,.5)", color: "#f3d9a4" } },
        "Comportamento desejado, não garantia de acerto"), 940, 790);
    el.append(cartao, inicial, legenda, alternativa, rodape);

    return (t) => {
        mostrar(cartao, t, 85.5, Infinity, { y: 30, blur: 8 });
        linhas.forEach((l, i) => mostrar(l, t, (i < 2 ? 86.2 : c(1)) + (i < 2 ? i * 0.6 : (i - 2) * 0.55), Infinity, { x: -16, y: 0, blur: 3 }));
        mostrar(inicial, t, c(2) + 0.2, Infinity, { y: 24 });
        const pr = suave(prog(t, c(3) + 0.1, c(3) + 0.9));
        fato.style.background = `rgba(183,195,242,${(0.2 * pr).toFixed(3)})`;
        interp.style.background = `rgba(242,201,201,${(0.16 * pr).toFixed(3)})`;
        mostrar(legenda, t, c(3) + 0.6, Infinity, { y: 10 });
        mostrar(alternativa, t, c(3) + 1.8, Infinity, { y: 24 });
        mostrar(rodape, t, c(4) + 0.3, Infinity, { y: 12 });
    };
}


// ---------- 6. voz, memória e ferramentas ----------
function cenaVoz(el) {
    const c = (k) => L("voz", k);
    const CX = 700, CY = 500, RAIO = 230;
    const svgEl = camadaSvg();
    const arcos = [0, 1, 2, 3].map((q) => {
        const a1 = (-90 + q * 90 + 14) * Math.PI / 180, a2 = (-90 + (q + 1) * 90 - 14) * Math.PI / 180;
        return seta(svgEl, `M${CX + RAIO * Math.cos(a1)},${CY + RAIO * Math.sin(a1)} A${RAIO},${RAIO} 0 0 1 ${CX + RAIO * Math.cos(a2)},${CY + RAIO * Math.sin(a2)}`);
    });
    const NOS = [["Microfone", "a pessoa fala"], ["Reconhecimento de fala", "no navegador"], ["Luna", "servidor + Gemini"], ["Síntese de voz", "no navegador"]];
    const nos = NOS.map(([a, b], q) => {
        const ang = (-90 + q * 90) * Math.PI / 180;
        const n = h("div", { class: "card", style: { padding: "14px 20px", textAlign: "center", width: "250px", marginLeft: "-125px", marginTop: "-42px" } },
            h("div", { style: { fontSize: "23px", fontWeight: "600" } }, a), h("div", { class: "sub", style: { fontSize: "18px" } }, b));
        return em(n, CX + RAIO * Math.cos(ang), CY + RAIO * Math.sin(ang));
    });
    const barras = Array.from({ length: 5 }, () => h("span", { style: { width: "6px", height: "16px", borderRadius: "3px", background: "#b7c3f2", display: "block" } }));
    const estado = h("div", { class: "eyebrow", style: { fontSize: "18px", textAlign: "center", marginTop: "14px" } }, "ouvindo");
    const centro = em(h("div", { style: { width: "220px", marginLeft: "-110px", marginTop: "-40px" } },
        h("div", { style: { display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", height: "48px" } }, barras), estado), CX, CY);
    const ponto = h("div", { class: "ponto" });
    const controles = em(h("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap", width: "720px" } },
        ["Pausar", "Retomar", "Interromper", "Encerrar"].map((x) => h("span", { class: "chip" }, x)),
        h("span", { class: "chip", style: { borderStyle: "dashed" } }, "microfone desligado enquanto ela fala")), 360, 790);
    const celular = em(h("div", { class: "celular" }, imagem("capturas/celular-voz.png")), 1290, 150, 330);
    const parteA = h("div", { class: "cena", style: { opacity: 1 } }, svgEl, ...nos, centro, ponto, controles, celular);

    const passos = [["1", "A Luna sugere", "“Quer que eu lembre disto nas próximas conversas?”"], ["2", "A pessoa confirma", "Lembrar  ·  Agora não"], ["3", "Fica no navegador", "Ver, corrigir e apagar nas configurações"]];
    const cartoes = passos.map(([n, a, b], i) => em(h("div", { class: "card", style: { padding: "28px 30px", height: "220px" } },
        h("div", { class: "no", style: { position: "static", margin: "0 0 16px", width: "56px", height: "56px", fontSize: "26px" } }, n),
        h("div", { style: { fontSize: "28px", fontWeight: "600" } }, a), h("div", { class: "sub", style: { fontSize: "21px", marginTop: "8px" } }, b)), 150 + i * 560, 300, 500));
    const setasMem = camadaSvg();
    const sm = [0, 1].map((i) => seta(setasMem, `M${662 + i * 560},410 L${700 + i * 560},410`));
    const extras = em(h("div", { style: { display: "flex", gap: "12px" } },
        h("span", { class: "chip" }, "Desligada por padrão"), h("span", { class: "chip" }, "Nunca sugerida em conversa de risco"), h("span", { class: "chip" }, "Servidor não guarda nada")), 150, 580);
    const memTitulo = em(h("div", { class: "titulo", style: { fontSize: "52px" } }, "Memória com consentimento"), 150, 170);
    const parteB = h("div", { class: "cena", style: { opacity: 1 } }, memTitulo, setasMem, ...cartoes, extras);

    const hoje = em(h("div", { class: "card", style: { padding: "36px 40px", height: "330px" } },
        h("span", { class: "tag codigo" }, "Hoje, no código"),
        h("div", { class: "citacao", style: { fontSize: "42px", margin: "20px 0 14px" } }, "Um modelo, uma chamada por mensagem"),
        h("div", { class: "sub" }, "Sem agentes, sem ferramentas externas, sem busca em documentos. A segurança é código comum, não outra IA.")), 150, 300, 780);
    const futuro = em(h("div", { class: "card", style: { padding: "36px 40px", height: "330px", borderStyle: "dashed", borderColor: "rgba(169,181,212,.55)", background: "rgba(17,27,68,.45)" } },
        h("span", { class: "tag futuro" }, "Visão futura · não implementado"),
        h("div", { class: "citacao", style: { fontSize: "42px", margin: "20px 0 14px", color: "#c9d2ea" } }, "Conversa por voz em tempo real"),
        h("div", { class: "sub" }, "Com a Gemini Live API, a pessoa poderia interromper falando, sem tocar em botões.")), 990, 300, 780);
    const parteC = h("div", { class: "cena", style: { opacity: 1 } }, hoje, futuro);
    el.append(parteA, parteB, parteC);

    return (t) => {
        const fimA = c(2) - 0.2, fimB = c(3) - 0.2;
        mostrar(parteA, t, 110.2, fimA, { y: 0, blur: 0, dur: 0.6 });
        mostrar(parteB, t, fimA, fimB, { y: 0, blur: 0, dur: 0.6 });
        mostrar(parteC, t, fimB, Infinity, { y: 0, blur: 0, dur: 0.6 });
        arcos.forEach((a, q) => desenhar(a, t, 110.8 + q * 0.35, 0.6));
        nos.forEach((n, q) => mostrar(n, t, 110.6 + q * 0.35, Infinity, { y: 12, blur: 4 }));
        mostrar(centro, t, 111.6);
        const giro = Math.max(0, t - 112.2) / 4.2;            // uma volta a cada 4,2 s
        const ang = -Math.PI / 2 + (giro % 1) * 2 * Math.PI;
        Object.assign(ponto.style, { left: `${CX + RAIO * Math.cos(ang)}px`, top: `${CY + RAIO * Math.sin(ang)}px`, opacity: t > 112.2 ? 1 : 0 });
        const quarto = Math.floor((giro % 1) * 4);
        estado.textContent = ["ouvindo", "pensando", "falando", "falando"][quarto];
        barras.forEach((b, i) => {
            const amp = quarto === 1 ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 5 - i * 0.9)) * 0.4 : quarto >= 2 ? 0.5 + 0.5 * Math.sin(t * 9 + i * 1.3) : 0.35 + 0.3 * Math.sin(t * 3 + i);
            b.style.height = `${(10 + 34 * Math.abs(amp)).toFixed(1)}px`;
            b.style.opacity = quarto === 1 ? String(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 4 - i * 1.2))) : "1";
        });
        mostrar(controles, t, c(1) + 0.3);
        mostrar(celular, t, 110.8, Infinity, { y: 50, blur: 6, dur: 1.1 });
        mostrar(memTitulo, t, fimA + 0.1);
        cartoes.forEach((k, i) => mostrar(k, t, fimA + 0.3 + i * 0.6, Infinity, { y: 22 }));
        sm.forEach((p, i) => desenhar(p, t, fimA + 0.8 + i * 0.6, 0.4));
        mostrar(extras, t, fimA + 2.4);
        mostrar(hoje, t, fimB + 0.2, Infinity, { y: 22 });
        mostrar(futuro, t, fimB + 1.0, Infinity, { y: 22 });
    };
}


// ---------- 7. segurança ----------
const NIVEIS = [
    ["nenhum", "A IA responde normalmente", "#a9b5d4"],
    ["atenção", "A IA pergunta, com delicadeza, como a pessoa está", "#b7c3f2"],
    ["alto", "A IA em modo segurança + cartão com contatos de ajuda", "#f3d9a4"],
    ["imediato", "Texto revisado, sem IA, + cartão com contatos de ajuda", "#f2c9c9"],
];
function cenaSeguranca(el) {
    const c = (k) => L("seguranca", k);
    const titulo = em(h("div", { class: "titulo", style: { fontSize: "52px" } }, "Segurança e responsabilidade"), 120, 104, 1200);
    const caixa = (rot, texto, tag, cls = "codigo") => h("div", { class: "card", style: { padding: "18px 24px", display: "flex", alignItems: "center", gap: "16px" } },
        tag ? h("span", { class: `tag ${cls}` }, tag) : null, h("div", {}, h("div", { style: { fontSize: "24px", fontWeight: "600" } }, rot), texto ? h("div", { class: "sub", style: { fontSize: "19px" } }, texto) : null));
    const msg = em(caixa("Mensagem recebida", "texto + mensagens recentes"), 120, 196, 380);
    const aval = em(caixa("Avaliação de risco", "seguranca.avaliar()", "no código"), 590, 196, 470);
    const svgEl = camadaSvg();
    const s1 = seta(svgEl, "M505,240 L582,240");
    const raia = (i) => 330 + i * 86;
    const pills = NIVEIS.map(([n, , cor], i) => em(h("div", { style: { width: "190px", padding: "12px 0", textAlign: "center", borderRadius: "999px", fontWeight: "700", fontSize: "21px", letterSpacing: ".06em", color: cor, border: `1.5px solid ${cor}`, background: "rgba(10,18,48,.85)" } }, n), 120, raia(i), 190));
    const saidas = NIVEIS.map(([, txt], i) => em(h("div", { class: "card", style: { padding: "14px 22px", fontSize: "22px" } }, txt), 400, raia(i) - 4, 880));
    const linhas = NIVEIS.map((_, i) => seta(svgEl, `M318,${raia(i) + 24} L392,${raia(i) + 24}`));
    const verif = em(caixa("Verificação da resposta", "bloqueia promessa de segredo e incentivo a parar tratamento · garante os contatos", "no código"), 120, 690, 1160);
    const humano = em(caixa("Encaminhamento humano", "CVV 188 · SAMU 192 · Polícia 190 · Ligue 180 · Disque 100", "fora do sistema", "fora"), 120, 800, 1160);
    const nota = em(h("div", { class: "sub", style: { fontSize: "19px", fontStyle: "italic" } }, "Detecção por padrões de texto: uma rede de proteção, não um diagnóstico."), 1100, 200, 300);
    const celular = em(h("div", { class: "celular" }, imagem("capturas/celular-crise.png")), 1430, 160, 320);
    el.append(svgEl, titulo, msg, aval, ...pills, ...saidas, verif, humano, nota, celular);

    return (t) => {
        mostrar(titulo, t, 135.4);
        mostrar(msg, t, c(0) + 0.6, Infinity, { x: -16, y: 0 });
        desenhar(s1, t, c(0) + 1.3, 0.5);
        mostrar(aval, t, c(0) + 1.6, Infinity, { x: -16, y: 0 });
        pills.forEach((p, i) => mostrar(p, t, c(1) + 0.2 + i * 0.45, Infinity, { x: -14, y: 0, blur: 3 }));
        linhas.forEach((l, i) => desenhar(l, t, c(1) + 0.5 + i * 0.45, 0.4));
        saidas.forEach((sd, i) => mostrar(sd, t, c(1) + 0.7 + i * 0.45, Infinity, { x: -14, y: 0, blur: 3 }));
        mostrar(verif, t, c(1) + 2.6, Infinity, { y: 14 });
        const realce = suave(prog(t, c(2) + 0.1, c(2) + 0.8));
        saidas[3].style.borderColor = `rgba(242,201,201,${(0.16 + 0.6 * realce).toFixed(3)})`;
        saidas[3].style.boxShadow = `0 0 ${(36 * realce).toFixed(1)}px rgba(242,201,201,${(0.25 * realce).toFixed(3)})`;
        saidas.slice(0, 3).forEach((sd) => { sd.style.opacity = String(Number(sd.style.opacity) * (1 - 0.45 * realce * (1 - prog(t, c(3), c(3) + 0.6)))); });
        mostrar(humano, t, c(3) + 0.2, Infinity, { y: 14 });
        mostrar(nota, t, c(3) + 1.0, Infinity, { y: 8 });
        mostrar(celular, t, c(2) + 0.6, Infinity, { y: 50, blur: 6, dur: 1.1 });
    };
}


// ---------- 8. encerramento ----------
const ANEL = ["Interface", "Servidor Flask", "Segurança", "Motor da Luna", "Gemini API"];
function cenaEncerramento(el) {
    const CX = 960, CY = 450, RX = 450, RY = 255;
    const svgEl = camadaSvg();
    const raios = ANEL.map(() => { const p = s("path", { fill: "none", stroke: "rgba(183,195,242,.35)", "stroke-width": "1.5" }); svgEl.append(p); return p; });
    const lados = ANEL.map(() => { const p = s("path", { fill: "none", stroke: "rgba(183,195,242,.6)", "stroke-width": "2" }); svgEl.append(p); return p; });
    const chips = ANEL.map((x) => em(h("div", { class: "chip", style: { fontSize: "24px", padding: "12px 22px", background: "rgba(17,27,68,.9)", whiteSpace: "nowrap" } }, x), 0, 0));
    const logoImg = imagem(LOGO, { style: "width:200px;display:block" });
    const logo = em(h("div", { style: { width: "200px", marginLeft: "-100px", marginTop: "-110px" } }, logoImg), CX, CY);
    const numeros = centralizado(800, h("div", { style: { display: "flex", gap: "14px" } },
        h("span", { class: "chip", style: { fontSize: "22px" } }, "45 testes automáticos"), h("span", { class: "chip", style: { fontSize: "22px" } }, "12 cenários de avaliação preparados")));
    const anel = h("div", { class: "cena", style: { opacity: 1 } }, svgEl, ...chips, logo, numeros);
    const fimLogo = centralizado(180, imagem(LOGO, { style: "width:170px;display:block;filter:drop-shadow(0 0 6px rgba(222,230,255,.9)) drop-shadow(0 0 22px rgba(183,195,242,.6))" }));
    const fimTitulo = centralizado(400, h("div", { class: "titulo", style: { fontSize: "140px", letterSpacing: ".12em" } }, R.titulo));
    const fimFrase = centralizado(590, h("div", { class: "sub", style: { fontSize: "36px", color: "#d4dcf0", fontWeight: "300" } }, R.frase_final));
    const fimCredito = centralizado(690, h("div", { class: "sub", style: { fontSize: "20px", letterSpacing: ".08em" } }, R.credito));
    el.append(anel, fimLogo, fimTitulo, fimFrase, fimCredito);
    let medidas;

    return (t) => {
        medidas ??= chips.map((c) => [c.offsetWidth, c.offsetHeight]);
        const giro = (t - 155) * 0.05;
        const P = ANEL.map((_, i) => { const a = -Math.PI / 2 + i * (2 * Math.PI / 5) + giro; return [CX + RX * Math.cos(a), CY + RY * Math.sin(a)]; });
        chips.forEach((c, i) => {
            Object.assign(c.style, { left: `${P[i][0] - medidas[i][0] / 2}px`, top: `${P[i][1] - medidas[i][1] / 2}px` });
            mostrar(c, t, 155.6 + i * 0.3, Infinity, { y: 14, blur: 4, escala: 0.9 });
        });
        P.forEach((p, i) => {
            const q = P[(i + 1) % 5];
            raios[i].setAttribute("d", `M${CX},${CY} L${p[0]},${p[1]}`);
            lados[i].setAttribute("d", `M${p[0]},${p[1]} L${q[0]},${q[1]}`);
            raios[i].__L = lados[i].__L = undefined;
            desenhar(raios[i], t, 156.0 + i * 0.3, 0.8);
            desenhar(lados[i], t, 157.6 + i * 0.3, 0.8);
        });
        mostrar(logo, t, 155.8, Infinity, { y: 0, blur: 8, escala: 0.9, dur: 1.2 });
        const b = 0.6 + 0.4 * Math.sin(t * 0.9);
        logoImg.style.filter = `drop-shadow(0 0 ${4 + 3 * b}px rgba(222,230,255,.9)) drop-shadow(0 0 ${16 + 14 * b}px rgba(183,195,242,${0.4 + 0.3 * b}))`;
        mostrar(numeros, t, L("encerramento", 1) + 0.3, Infinity, { y: 12 });
        anel.style.opacity = String(1 - suave(prog(t, 166.6, 167.8)));
        anel.style.transform = `scale(${mistura(1, 0.94, suave(prog(t, 166.6, 167.8)))})`;
        mostrar(fimLogo, t, 167.6, Infinity, { dur: 1.4, y: 16, blur: 8 });
        mostrar(fimTitulo, t, 168.0, Infinity, { dur: 1.6, y: 20, blur: 12 });
        mostrar(fimFrase, t, 169.0, Infinity, { dur: 1.2, y: 12 });
        mostrar(fimCredito, t, 169.8, Infinity, { dur: 1.2, y: 8, blur: 2 });
    };
}


// ---------- montagem, HUD e legendas ----------
const progresso = [];
function montarHud() {
    const barra = document.getElementById("hud-progresso");
    for (const c of R.cenas) { const i = h("i"); barra.append(h("div", {}, i)); progresso.push([c, i]); }
}

function atualizarHud(t) {
    const atual = R.cenas.find((c) => t >= c.inicio && t < c.fim) ?? R.cenas.at(-1);
    const visivel = (t > 12.6 && t < 166.6 ? 1 : 0) * (1 - prog(t, 166, 166.6)) * Math.max(prog(t, 12.4, 13.4), t > 13.4 ? 1 : 0);
    const rotulo = document.getElementById("hud-rotulo");
    document.getElementById("hud-texto").textContent = atual.rotulo;
    const borda = Math.min(prog(t, atual.inicio + 0.2, atual.inicio + 0.9), 1 - prog(t, atual.fim - 0.5, atual.fim));
    rotulo.style.opacity = String(visivel * borda);
    document.getElementById("hud-progresso").style.opacity = String(visivel * 0.9);
    for (const [c, i] of progresso) i.style.width = `${(prog(t, c.inicio, c.fim) * 100).toFixed(2)}%`;
}

function atualizarLegenda(t) {
    const caixa = document.getElementById("legenda");
    const l = mostrarLegendas ? R.legendas.find((x) => t >= x.inicio - 0.2 && t < x.fim + 0.2) : null;
    if (!l) { caixa.style.opacity = "0"; return; }
    if (caixa.textContent !== l.texto) caixa.textContent = l.texto;
    caixa.style.opacity = String(Math.min(prog(t, l.inicio - 0.2, l.inicio + 0.15), 1 - prog(t, l.fim - 0.15, l.fim + 0.2)));
}

window.renderizar = (t) => {
    desenharCeu(ctx, t);
    for (const c of cenas) {
        const dentro = t >= c.inicio - 0.1 && t <= c.fim + 0.1;
        c.el.style.display = dentro ? "block" : "none";
        if (!dentro) continue;
        const entrada = c.inicio === 0 ? 1 : prog(t, c.inicio, c.inicio + 0.7);
        const saidaCena = c.id === "encerramento" ? 1 : 1 - prog(t, c.fim - 0.7, c.fim);   // o fim escurece pelo #preto
        c.el.style.opacity = String(Math.min(entrada, saidaCena));
        c.atualizar(t);
    }
    atualizarHud(t);
    atualizarLegenda(t);
    document.getElementById("preto").style.opacity = String(suave(prog(t, 173, 175)));
};

let ctx;
window.pronto = (async () => {
    R = await (await fetch("roteiro.json")).json();
    ctx = document.getElementById("ceu").getContext("2d");
    novaCena("abertura", cenaAbertura);
    novaCena("proposito", cenaProposito);
    novaCena("arquitetura", cenaArquitetura);
    novaCena("mensagem", cenaMensagem);
    novaCena("instrucoes", cenaInstrucoes);
    novaCena("voz", cenaVoz);
    novaCena("seguranca", cenaSeguranca);
    novaCena("encerramento", cenaEncerramento);
    montarHud();
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
    for (const c of cenas) { c.el.style.display = "block"; }   // medir caminhos com tudo no lugar
    window.renderizar(0);
    return { duracao: R.duracao, fps: R.fps };
})();
