// ===== CÉU ESTRELADO DA LUNA MIND =====
// Desenha o fundo em um <canvas> com três camadas de profundidade:
//   longe  → muitas estrelas minúsculas e apagadas, cintilam devagar;
//   meio   → menos estrelas, um pouco maiores;
//   perto  → poucas estrelas com brilho suave; algumas são "estrelas de cristal"
//            de 4 pontas, a mesma forma da estrela do símbolo da marca.
//
// Decisões:
// - Puramente decorativo (aria-hidden no HTML) e atrás de todo o conteúdo.
// - Gerador pseudoaleatório com semente fixa: o céu é o mesmo a cada visita
//   (sensação de lugar conhecido) e não "pula" ao redimensionar.
// - "Reduzir movimento" do sistema: desenha uma vez, sem cintilar nem parallax.
// - Pausa quando a aba fica oculta e limita a ~30 quadros/s (economia de bateria).
// - Sem JavaScript, as estrelas em CSS (style.css) continuam como reserva.
(() => {
    "use strict";
    const canvas = document.getElementById("ceu");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ponteiroFino = window.matchMedia("(hover: hover) and (pointer: fine)");
    document.documentElement.classList.add("ceu-ativo");            // o CSS esconde as estrelas de reserva

    // Mulberry32: gerador simples e determinístico a partir de uma semente.
    function gerador(semente) {
        return () => {
            semente |= 0; semente = (semente + 0x6d2b79f5) | 0;
            let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Cores tiradas da paleta: prata, cristal (lilás-azulado) e um âmbar raro (estrelas mais quentes).
    const CORES = ["255,255,255", "223,230,255", "200,211,250", "243,227,195"];
    const CAMADAS = [
        { nome: "longe", densidade: 9000, raio: [0.35, 0.85], alfa: [0.25, 0.6], parallax: 2, velocidade: [0.25, 0.7] },
        { nome: "meio", densidade: 32000, raio: [0.8, 1.35], alfa: [0.45, 0.8], parallax: 5, velocidade: [0.35, 0.9] },
        { nome: "perto", densidade: 160000, raio: [1.3, 2.0], alfa: [0.7, 1.0], parallax: 10, velocidade: [0.2, 0.5] },
    ];

    let estrelas = [], largura = 0, altura = 0, dpr = 1;
    let alvoX = 0, alvoY = 0, atualX = 0, atualY = 0;                // parallax suavizado (interpolação)
    let quadro = null, ultimo = 0;

    function criarEstrelas() {
        const aleatorio = gerador(20260407);
        const area = largura * altura;
        estrelas = [];
        CAMADAS.forEach((camada, nivel) => {
            const quantidade = Math.max(nivel === 2 ? 5 : 20, Math.round(area / camada.densidade));
            for (let i = 0; i < quantidade; i++) {
                const entre = ([a, b]) => a + aleatorio() * (b - a);
                estrelas.push({
                    nivel,
                    x: aleatorio() * largura,
                    y: aleatorio() * altura,
                    raio: entre(camada.raio),
                    alfa: entre(camada.alfa),
                    cor: CORES[aleatorio() < 0.06 ? 3 : Math.floor(aleatorio() * 3)],
                    fase: aleatorio() * Math.PI * 2,
                    velocidade: entre(camada.velocidade),
                    // Todas as estrelas próximas (as que têm halo) usam a forma de 4 pontas da marca.
                    // Antes só 40% usavam; as outras apareciam como bolinhas brilhantes.
                    // O sorteio continua sendo consumido para não mudar a posição das outras estrelas.
                    cristal: nivel === 2 && (aleatorio(), true),
                });
            }
        });
    }

    function ajustarTamanho() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);              // acima de 2x não melhora e custa mais
        largura = window.innerWidth;
        altura = window.innerHeight;
        canvas.width = Math.round(largura * dpr);
        canvas.height = Math.round(altura * dpr);
        canvas.style.width = largura + "px";
        canvas.style.height = altura + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        criarEstrelas();
        desenhar(performance.now());
    }

    function desenharCristal(x, y, r, cor, alfa) {
        // Estrela de 4 pontas: dois losangos finos cruzados + um ponto de luz no centro.
        const braco = r * 4.2, fino = r * 0.55;
        ctx.fillStyle = `rgba(${cor},${alfa})`;
        ctx.beginPath();
        ctx.moveTo(x, y - braco); ctx.lineTo(x + fino, y); ctx.lineTo(x, y + braco); ctx.lineTo(x - fino, y); ctx.closePath();
        ctx.moveTo(x - braco * 0.8, y); ctx.lineTo(x, y - fino); ctx.lineTo(x + braco * 0.8, y); ctx.lineTo(x, y + fino); ctx.closePath();
        ctx.fill();
    }

    function desenhar(agora) {
        const t = agora / 1000;
        const parado = reduzir.matches;
        ctx.clearRect(0, 0, largura, altura);
        atualX += (alvoX - atualX) * 0.06;                            // aproxima devagar: movimento macio
        atualY += (alvoY - atualY) * 0.06;
        for (const e of estrelas) {
            const camada = CAMADAS[e.nivel];
            const brilho = parado ? e.alfa : e.alfa * (0.62 + 0.38 * Math.sin(t * e.velocidade + e.fase));
            const x = e.x + (parado ? 0 : atualX * camada.parallax);
            const y = e.y + (parado ? 0 : atualY * camada.parallax);
            if (e.nivel === 2) {
                // halo suave das estrelas próximas
                const halo = ctx.createRadialGradient(x, y, 0, x, y, e.raio * 6);
                halo.addColorStop(0, `rgba(${e.cor},${brilho * 0.35})`);
                halo.addColorStop(1, `rgba(${e.cor},0)`);
                ctx.fillStyle = halo;
                ctx.fillRect(x - e.raio * 6, y - e.raio * 6, e.raio * 12, e.raio * 12);
                if (e.cristal) { desenharCristal(x, y, e.raio * 0.6, e.cor, brilho); continue; }
            }
            ctx.fillStyle = `rgba(${e.cor},${brilho})`;
            ctx.beginPath();
            ctx.arc(x, y, e.raio, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animar(agora) {
        quadro = requestAnimationFrame(animar);
        if (agora - ultimo < 33) return;                              // ~30 quadros por segundo bastam
        ultimo = agora;
        desenhar(agora);
    }

    function iniciar() {
        parar();
        if (reduzir.matches || document.hidden) { desenhar(performance.now()); return; }
        quadro = requestAnimationFrame(animar);
    }

    function parar() {
        if (quadro) cancelAnimationFrame(quadro);
        quadro = null;
    }

    let espera = null;
    window.addEventListener("resize", () => {                          // espera o redimensionamento terminar
        clearTimeout(espera);
        espera = setTimeout(ajustarTamanho, 150);
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? parar() : iniciar()));
    reduzir.addEventListener?.("change", iniciar);
    window.addEventListener("pointermove", (evento) => {
        if (!ponteiroFino.matches) return;                            // no toque não há parallax
        alvoX = (evento.clientX / largura - 0.5) * -1;                // -0,5..0,5: o céu vai levemente ao contrário
        alvoY = (evento.clientY / altura - 0.5) * -1;
    }, { passive: true });

    ajustarTamanho();
    iniciar();
})();
