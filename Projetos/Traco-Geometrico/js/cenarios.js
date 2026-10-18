// ================================================================
// cenarios.js — CENÁRIOS TEMÁTICOS de cada fase (direção de arte, rodada 7)
// Camadas de fundo, iluminação, partículas e elementos animados por herói.
// Também implementa as REAÇÕES do cenário aos poderes (Fase.cenarioReagir).
//
// Regras de arte (REA_ESQUEMA.md):
//   · triângulo = perigo, SEMPRE: o cenário usa só retângulos, círculos, arcos, linhas e polígonos de 6+ lados;
//   · o cenário fica mais escuro e com menos contraste que os objetos neon (obstáculos sempre legíveis);
//   · texturas desenhadas UMA vez; poucos objetos animados (reciclados conforme a câmera anda);
//   · movimento reduzido (prefers-reduced-motion) desliga as animações ambientes.
//
// Profundidades (todas atrás do véu de seção em -50):
//   -99 céu · -98 nuvens/nebulosa · -96 silhuetas longe · -93 animados longe · -92 camada média
//   -88 quadrados de fundo · -86 feixes · -84 camada perto · -80 animados perto · -60 reações
// ================================================================

const Cenarios = {
    // ---------------------------------------------------------------
    // UTILIDADES
    // ---------------------------------------------------------------

    // Mistura duas cores (t de 0 a 1)
    mistura(a, b, t) {
        const c1 = Phaser.Display.Color.IntegerToColor(a), c2 = Phaser.Display.Color.IntegerToColor(b);
        return Phaser.Display.Color.GetColor(
            Math.round(c1.red + (c2.red - c1.red) * t),
            Math.round(c1.green + (c2.green - c1.green) * t),
            Math.round(c1.blue + (c2.blue - c1.blue) * t));
    },

    // Gera uma textura uma vez só (nas próximas tentativas reaproveita)
    textura(cena, chave, w, h, desenhar) {
        if (cena.textures.exists(chave)) return chave;
        const g = cena.make.graphics({ x: 0, y: 0, add: false });
        desenhar(g, w, h);
        g.generateTexture(chave, w, h);
        g.destroy();
        return chave;
    },

    // Céu fixo na tela: degradê vertical em faixas finas (topo → meio → horizonte) + extras por cima
    ceu(fase, chave, cores, extra) {
        const k = this.textura(fase.cena, chave, 1280, 560, (g, w, h) => {
            const passos = 40;
            for (let i = 0; i < passos; i++) {
                const t = i / (passos - 1);
                const cor = t < 0.5 ? this.mistura(cores[0], cores[1], t * 2) : this.mistura(cores[1], cores[2], (t - 0.5) * 2);
                g.fillStyle(cor, 1); g.fillRect(0, Math.floor(i * h / passos), w, Math.ceil(h / passos) + 1);
            }
            if (extra) extra(g, w, h);
        });
        return fase.cena.add.image(640, 380, k).setScrollFactor(0).setDepth(-99);
    },

    // Camada de paralaxe com as cores próprias (sem o tingimento da seção)
    camada(fase, fator, prof, desenhar, largura = 2048) {
        return fase.camadaParalaxe(fator, prof, desenhar, largura, { tingir: false });
    },

    // Estrelas espalhadas (pontinhos de brilho variado) na parte de cima do céu
    estrelas(g, w, h, semente, qtd = 120, cor = 0xffffff, altura = 0.6) {
        const rnd = new Phaser.Math.RandomDataGenerator([semente]);
        for (let i = 0; i < qtd; i++) {
            g.fillStyle(cor, rnd.realInRange(0.15, 0.7));
            g.fillRect(rnd.between(0, w), rnd.between(0, h * altura), rnd.pick([1, 1, 2]), rnd.pick([1, 1, 2]));
        }
    },

    // Registra uma animação por quadro (dt em ms reais) — desligada com movimento reduzido
    animar(fase, fn) {
        if (reducedMotion.matches) return;
        if (!fase.animacoesCenario) {
            fase.animacoesCenario = [];
            let antes = fase.cena.time.now;
            const passo = () => {
                if (fase.pausado) { antes = fase.cena.time.now; return; }
                const agora = fase.cena.time.now, dt = Math.min(50, Math.max(0, agora - antes)); antes = agora;
                const sx = fase.cena.cameras.main.scrollX;
                for (const f of fase.animacoesCenario) f(dt, agora, sx);
            };
            fase.cena.events.on('postupdate', passo);
            fase.cena.events.once('shutdown', () => fase.cena.events.off('postupdate', passo));
        }
        fase.animacoesCenario.push(fn);
    },

    // Objetos fixos na tela que "andam" com a câmera numa camada de fator f e voltam pelo outro lado
    // (poucos objetos cobrem a fase inteira). Cada objeto ganha .baseX (posição dentro do ciclo).
    reciclar(fase, objs, fator, ciclo, margem = 200) {
        objs.forEach((o, i) => { if (o.baseX === undefined) o.baseX = i * ciclo / objs.length; });
        const posicionar = (sx) => objs.forEach((o) => {
            const x = ((o.baseX - sx * fator) % ciclo + ciclo) % ciclo - margem;
            o.x = x;
        });
        posicionar(fase.cena.cameras.main.scrollX);
        this.animar(fase, (dt, agora, sx) => posicionar(sx));
        return objs;
    },

    // Partículas ambientes fixas na tela (área = retângulo da tela), pequenas pra não atrapalhar a leitura
    particulas(fase, cfg, prof = -87) {
        if (reducedMotion.matches) return null;
        return fase.cena.add.particles(0, 0, 'faisca', Object.assign({
            x: { min: 0, max: 1280 }, y: { min: 120, max: 640 }, lifespan: 4000, frequency: 160,
            scale: { start: 0.45, end: 0 }, alpha: { start: 0.5, end: 0 }, speedY: { min: -20, max: -6 }
        }, cfg)).setScrollFactor(0).setDepth(prof);
    },

    // Clarão colorido rápido atrás dos obstáculos (reações a poderes)
    clarao(fase, cor, alpha = 0.16, dur = 280) {
        const r = fase.cena.add.rectangle(640, 380, 1280, 560, cor, alpha).setScrollFactor(0).setDepth(-60);
        fase.cena.tweens.add({ targets: r, alpha: 0, duration: reducedMotion.matches ? 1 : dur, onComplete: () => r.destroy() });
    },

    // Anel que cresce e some (posição na TELA), atrás dos obstáculos
    anelTela(fase, x, y, cor, r0 = 20, r1 = 420, dur = 700, espessura = 4) {
        if (reducedMotion.matches) return;
        const g = fase.cena.add.graphics().setScrollFactor(0).setDepth(-60).setPosition(x, y);
        const estado = { r: r0, a: 0.7 };
        fase.cena.tweens.add({
            targets: estado, r: r1, a: 0, duration: dur, ease: 'Cubic.Out',
            onUpdate: () => { g.clear(); g.lineStyle(espessura, cor, estado.a).strokeCircle(0, 0, estado.r); },
            onComplete: () => g.destroy()
        });
    },

    // Polígono regular (6+ lados) — usado em mandalas e ondas hex (nunca triângulos)
    poligono(n, r, giro = 0) {
        const pts = [];
        for (let i = 0; i < n; i++) { const a = giro + i / n * Math.PI * 2; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
        return pts;
    },

    // Posição do jogador na tela
    jogadorTela(fase) {
        const cam = fase.cena.cameras.main;
        return { x: fase.player.x - cam.scrollX, y: fase.player.y - cam.scrollY };
    },

    // Prepara a fase pro cenário detalhado (quadrados e feixes mais discretos por cima do cenário)
    preparar(fase) {
        fase.cenarioDetalhado = true;
        fase.estadoCenario = { criadoEm: fase.cena.time.now };
    },

    // ---------------------------------------------------------------
    // HOMEM-ARANHA — cidade à noite: céu com lua, skyline em camadas, caixas d'água,
    // antenas piscando, holofotes varrendo o céu e janelas acendendo
    // ---------------------------------------------------------------
    aranha(fase) {
        this.preparar(fase);
        const cena = fase.cena;
        // Céu noturno: azul profundo → horizonte com brilho da cidade
        this.ceu(fase, 'cen-aranha-ceu', [0x040822, 0x0b1d5c, 0x2b3f9e], (g, w, h) => {
            this.estrelas(g, w, h, 'aranha-estrelas', 140, 0xcfe0ff, 0.55);
            // Brilho da cidade no horizonte (faixas largas e transparentes)
            for (let i = 0; i < 6; i++) { g.fillStyle(0x6a7dff, 0.035); g.fillRect(0, h - 60 - i * 30, w, 60 + i * 30); }
            // Lua cheia com crateras e halo
            g.fillStyle(0xdfe8ff, 0.08); g.fillCircle(1010, 120, 92);
            g.fillStyle(0xdfe8ff, 0.12); g.fillCircle(1010, 120, 70);
            g.fillStyle(0xeef3ff, 1); g.fillCircle(1010, 120, 50);
            g.fillStyle(0xc8d3f0, 1); g.fillCircle(992, 108, 9); g.fillCircle(1024, 134, 12); g.fillCircle(1028, 102, 5);
        });
        // Nuvens finas passando devagar (camada própria que anda sozinha)
        const nuvens = this.camada(fase, 0.02, -98, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['aranha-nuvens']);
            for (let i = 0; i < 9; i++) { g.fillStyle(0xaabfff, 0.06); g.fillEllipse(rnd.between(0, L), rnd.between(140, 330), rnd.between(260, 520), rnd.between(24, 44)); }
        });
        this.animar(fase, (dt) => { nuvens.tilePositionX += dt * 0.006; });
        // Skyline distante: torres em degraus com pináculos e janelinhas
        this.camada(fase, 0.05, -96, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['aranha-longe']);
            for (let x = 0; x < L - 60; x += rnd.between(40, 90)) {
                const w = rnd.between(40, 80), h = rnd.between(160, 360), y = 660 - h;
                g.fillStyle(0x0c1a52, 1); g.fillRect(x, y, w, h);
                // Recuos no topo (art déco) e pináculo
                if (rnd.frac() > 0.5) { g.fillRect(x + w * 0.2, y - 30, w * 0.6, 30); g.fillRect(x + w * 0.35, y - 55, w * 0.3, 25); g.fillRect(x + w * 0.48, y - 95, 3, 40); }
                g.fillStyle(0x8fb0ff, 0.35);
                for (let jy = y + 10; jy < 640; jy += 14) for (let jx = x + 5; jx < x + w - 5; jx += 9) if (rnd.frac() > 0.78) g.fillRect(jx, jy, 3, 4);
            }
        });
        // Prédios do meio com janelas acesas, caixas d'água e letreiros
        this.camada(fase, 0.15, -92, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['aranha-meio']);
            for (let x = 0; x < L - 120; x += rnd.between(110, 190)) {
                const w = rnd.between(90, 140), h = rnd.between(170, 300), y = 660 - h;
                g.fillStyle(0x0a1648, 1); g.fillRect(x, y, w, h);
                g.lineStyle(2, 0x2a4ab8, 0.5); g.lineBetween(x, y, x + w, y);
                // Janelas (algumas acesas em amarelo, outras em azul de TV)
                for (let jy = y + 16; jy < 640; jy += 22) for (let jx = x + 10; jx < x + w - 14; jx += 18) {
                    const r = rnd.frac();
                    g.fillStyle(r > 0.82 ? 0xffd98a : r > 0.7 ? 0x7fd0ff : 0x08113a, r > 0.7 ? 0.7 : 1); g.fillRect(jx, jy, 9, 12);
                }
                // Caixa d'água: tanque com tampa arredondada e pernas
                if (rnd.frac() > 0.45) {
                    const cx = x + rnd.between(20, w - 40);
                    g.fillStyle(0x070f33, 1); g.fillRect(cx, y - 42, 26, 28); g.fillEllipse(cx + 13, y - 42, 30, 12);
                    g.lineStyle(3, 0x070f33, 1); g.lineBetween(cx + 3, y - 14, cx, y); g.lineBetween(cx + 23, y - 14, cx + 26, y);
                }
                // Letreiro de cobertura
                if (rnd.frac() > 0.75) { g.fillStyle(0x070f33, 1); g.fillRect(x + 10, y - 34, w - 20, 26); g.lineStyle(2, 0xff3b55, 0.45); g.strokeRect(x + 14, y - 30, w - 28, 18); }
            }
        });
        // Telhados perto: escadas de incêndio, aparelhos de ar e parapeitos
        this.camada(fase, 0.38, -84, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['aranha-perto']);
            for (let x = 0; x < L - 200; x += rnd.between(220, 360)) {
                const w = rnd.between(160, 240), h = rnd.between(80, 150), y = 660 - h;
                g.fillStyle(0x060d2c, 1); g.fillRect(x, y, w, h);
                g.fillStyle(0x0d1b55, 1); g.fillRect(x - 4, y - 6, w + 8, 6);
                // Ar-condicionado
                g.fillStyle(0x0d1b55, 1); g.fillRect(x + 20, y - 22, 34, 16); g.lineStyle(1, 0x2a4ab8, 0.5); g.strokeCircle(x + 37, y - 14, 6);
                // Escada de incêndio em zigue-zague (linhas)
                g.lineStyle(2, 0x1d2f80, 0.8);
                for (let k = 0; k < 3; k++) { const yy = y + 20 + k * 30; g.lineBetween(x + w - 50, yy, x + w - 10, yy); g.lineBetween(x + w - 50, yy, x + w - 10, yy + 30); }
            }
        });
        // Holofotes varrendo o céu (feixes largos e transparentes saindo do horizonte)
        const holofotes = [0, 1].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-97);
            g.fillStyle(0xbfd4ff, 0.05).fillRect(-14, -620, 28, 620);
            g.fillStyle(0xbfd4ff, 0.04).fillRect(-30, -620, 60, 620);
            g.y = 660; g.baseX = i * 700 + 250; g.fase0 = i * 2;
            return g;
        });
        this.reciclar(fase, holofotes, 0.06, 1400, 100);
        this.animar(fase, (dt, agora) => holofotes.forEach((h) => { h.rotation = Math.sin(agora / 2600 + h.fase0) * 0.5; }));
        // Antenas com luz vermelha piscando
        const antenas = [0, 1, 2, 3].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-93);
            const alto = 120 + (i % 2) * 60;
            g.lineStyle(2, 0x0a1648, 1).lineBetween(0, 0, 0, alto);
            g.lineStyle(1, 0x0a1648, 1).lineBetween(-8, alto * 0.5, 0, alto * 0.3).lineBetween(8, alto * 0.5, 0, alto * 0.3);
            g.y = 660 - 230 - alto; g.luz = cena.add.circle(0, g.y, 4, 0xff3b55).setScrollFactor(0).setDepth(-93);
            g.baseX = i * 380 + 120; g.fase0 = i * 0.7;
            return g;
        });
        this.reciclar(fase, antenas, 0.15, 1520, 60);
        this.animar(fase, (dt, agora) => antenas.forEach((a) => { a.luz.x = a.x; a.luz.setAlpha(Math.sin(agora / 380 + a.fase0 * 4) > 0.3 ? 1 : 0.15); }));
        // Janelas que acendem e apagam (grupinhos na camada do meio)
        const janelas = [0, 1, 2, 3, 4, 5].map((i) => {
            const r = cena.add.rectangle(0, 360 + (i % 3) * 70, 9, 12, 0xffd98a, 0).setScrollFactor(0).setDepth(-91);
            r.baseX = i * 300 + 60; r.fase0 = i * 1.3; return r;
        });
        this.reciclar(fase, janelas, 0.15, 1800, 60);
        this.animar(fase, (dt, agora) => janelas.forEach((j) => j.setAlpha(Math.sin(agora / 1700 + j.fase0) > 0.2 ? 0.8 : 0)));
    },

    // ---------------------------------------------------------------
    // HOMEM DE FERRO — metrópole futurista ao entardecer: sol baixo, torres com anéis,
    // pontes aéreas, hologramas e trilhas de luz de carros voadores
    // ---------------------------------------------------------------
    ferro(fase) {
        this.preparar(fase);
        const cena = fase.cena;
        this.ceu(fase, 'cen-ferro-ceu', [0x14030c, 0x6a0e1e, 0xff8a3a], (g, w, h) => {
            this.estrelas(g, w, h, 'ferro-estrelas', 50, 0xffe2c0, 0.3);
            // Sol baixo com faixas (o céu passa na frente em listras horizontais)
            g.fillStyle(0xffb347, 0.12); g.fillCircle(820, 470, 190);
            g.fillStyle(0xffc94d, 1); g.fillCircle(820, 470, 130);
            for (let k = 0; k < 7; k++) { g.fillStyle(this.mistura(0xb8301c, 0xff8a3a, k / 7), 1); g.fillRect(690, 440 + k * 18, 260, 4 + k); }
            // Nuvens alongadas douradas
            const rnd = new Phaser.Math.RandomDataGenerator(['ferro-nuvens']);
            for (let i = 0; i < 10; i++) { g.fillStyle(0xffd38a, 0.08); g.fillEllipse(rnd.between(0, w), rnd.between(120, 380), rnd.between(200, 460), rnd.between(8, 18)); }
        });
        // Torres distantes com topo arredondado, bordas douradas e uma torre com anel
        this.camada(fase, 0.05, -96, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['ferro-longe']);
            for (let x = 0; x < L - 80; x += rnd.between(60, 120)) {
                const w = rnd.between(34, 70), h = rnd.between(200, 430), y = 660 - h;
                g.fillStyle(0x2a0710, 1); g.fillRect(x, y, w, h); g.fillCircle(x + w / 2, y, w / 2);
                g.lineStyle(1, 0xffb347, 0.25); g.lineBetween(x + 2, y, x + 2, 660);
                if (rnd.frac() > 0.85) { g.lineStyle(3, 0xffb347, 0.35); g.strokeEllipse(x + w / 2, y + 40, w + 70, 18); }
            }
        });
        // Pontes aéreas e torres médias com faixas de janela
        this.camada(fase, 0.17, -92, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['ferro-meio']);
            let anterior = null;
            for (let x = 0; x < L - 140; x += rnd.between(160, 260)) {
                const w = rnd.between(60, 100), h = rnd.between(220, 380), y = 660 - h;
                g.fillStyle(0x3a0912, 1); g.fillRect(x, y, w, h);
                g.fillStyle(0x52101a, 1); g.fillRect(x + 6, y - 20, w - 12, 20);
                g.fillStyle(0xffc23d, 0.22);
                for (let jy = y + 12; jy < 640; jy += 16) g.fillRect(x + 6, jy, w - 12, 3);
                if (anterior && rnd.frac() > 0.3) {
                    const py = Math.max(anterior.y, y) + 40;
                    g.fillStyle(0x2a0710, 1); g.fillRect(anterior.x + anterior.w, py, x - anterior.x - anterior.w, 10);
                    g.lineStyle(1, 0x29e3ff, 0.35); g.lineBetween(anterior.x + anterior.w, py + 5, x, py + 5);
                }
                anterior = { x, y, w };
            }
        });
        // Plataformas de pouso perto, com luzes ciano
        this.camada(fase, 0.42, -84, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['ferro-perto']);
            for (let x = 0; x < L - 220; x += rnd.between(260, 420)) {
                const w = rnd.between(140, 220), y = 660 - rnd.between(60, 120);
                g.fillStyle(0x1e050a, 1); g.fillRect(x, y, w, 660 - y);
                g.fillStyle(0x3a0912, 1); g.fillRect(x - 10, y - 8, w + 20, 8);
                g.fillStyle(0x29e3ff, 0.55); for (let k = 0; k < 5; k++) g.fillRect(x + 10 + k * (w - 20) / 4, y - 11, 4, 3);
            }
        });
        // Trilhas de luz: carros voadores cruzando a cidade em faixas (andam sozinhos)
        const trilhas = [];
        if (!reducedMotion.matches) for (let i = 0; i < 7; i++) {
            const cor = i % 3 === 0 ? 0x29e3ff : 0xffd38a;
            const r = cena.add.rectangle(0, 210 + i * 46, Phaser.Math.Between(40, 90), 2, cor, 0.55).setScrollFactor(0).setDepth(-91);
            r.vel = (i % 2 ? -1 : 1) * Phaser.Math.Between(260, 520); r.x = Phaser.Math.Between(0, 1280);
            trilhas.push(r);
        }
        this.animar(fase, (dt) => trilhas.forEach((t) => { t.x += t.vel * dt / 1000; if (t.x > 1360) t.x = -80; if (t.x < -80) t.x = 1360; }));
        // Hologramas: painéis ciano com linhas de varredura que piscam
        const hologramas = [0, 1, 2].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-91);
            g.lineStyle(2, 0x29e3ff, 0.6).strokeRect(-46, -30, 92, 60);
            g.fillStyle(0x29e3ff, 0.08).fillRect(-46, -30, 92, 60);
            g.lineStyle(1, 0x29e3ff, 0.35); for (let y = -24; y < 30; y += 8) g.lineBetween(-40, y, 40, y);
            g.lineStyle(2, 0xffd38a, 0.5).strokeCircle(-20, 0, 12).lineBetween(0, -6, 34, -6).lineBetween(0, 6, 26, 6);
            g.y = 260 + i * 60; g.baseX = i * 600 + 200; g.fase0 = i;
            return g;
        });
        this.reciclar(fase, hologramas, 0.17, 1800, 120);
        fase.estadoCenario.brilhoHolo = 0;
        this.animar(fase, (dt, agora) => {
            fase.estadoCenario.brilhoHolo = Math.max(0, fase.estadoCenario.brilhoHolo - dt / 300);
            hologramas.forEach((h) => h.setAlpha(Math.min(1, (Math.sin(agora / 90 + h.fase0) > -0.85 ? 0.55 : 0.15) + fase.estadoCenario.brilhoHolo)));
        });
    },

    // ---------------------------------------------------------------
    // HULK — cidade em ruínas: névoa gama, prédios tombados com vigas expostas,
    // colunas de fumaça, faíscas e raios verdes no céu
    // ---------------------------------------------------------------
    hulk(fase) {
        this.preparar(fase);
        const cena = fase.cena;
        this.ceu(fase, 'cen-hulk-ceu', [0x050d06, 0x163a12, 0x4f8a24], (g, w, h) => {
            // Névoa gama (manchas verdes) e nuvens de fumaça escura
            const rnd = new Phaser.Math.RandomDataGenerator(['hulk-ceu']);
            for (let i = 0; i < 12; i++) { g.fillStyle(0x9dff5a, 0.04); g.fillEllipse(rnd.between(0, w), rnd.between(250, 520), rnd.between(300, 600), rnd.between(60, 140)); }
            for (let i = 0; i < 10; i++) { g.fillStyle(0x020602, 0.3); g.fillEllipse(rnd.between(0, w), rnd.between(40, 220), rnd.between(260, 520), rnd.between(50, 110)); }
        });
        // Skyline quebrado ao longe (prédios com pedaços faltando e alguns inclinados)
        this.camada(fase, 0.06, -96, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['hulk-longe']);
            for (let x = 0; x < L - 80; x += rnd.between(55, 110)) {
                const w = rnd.between(45, 90), h = rnd.between(140, 330), y = 660 - h, t = rnd.between(-12, 12);
                g.fillStyle(0x0c200d, 1);
                g.fillPoints([{ x, y: 660 }, { x: x + w, y: 660 }, { x: x + w + t, y }, { x: x + t, y }], true);
                // Pedaço arrancado do topo (degrau)
                g.fillStyle(0x163a12, 1); if (rnd.frac() > 0.5) g.fillRect(x + t + w * 0.55, y - 1, w * 0.45, rnd.between(20, 50));
            }
        });
        // Prédios destruídos no meio, com vigas expostas e buracos de janela
        this.camada(fase, 0.2, -92, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['hulk-meio']);
            for (let x = 0; x < L - 160; x += rnd.between(170, 280)) {
                const w = rnd.between(90, 150), h = rnd.between(170, 290), y = 660 - h;
                g.fillStyle(0x10260f, 1); g.fillRect(x, y + 30, w, h - 30);
                // Andares de cima destruídos: só a estrutura de vigas
                g.lineStyle(3, 0x1d3f18, 1);
                for (let k = 0; k <= 3; k++) g.lineBetween(x + k * w / 3, y + 30, x + k * w / 3 + rnd.between(-6, 6), y - 10);
                g.lineBetween(x, y + 6, x + w * 0.8, y + 2);
                g.lineStyle(2, 0x1d3f18, 1); g.lineBetween(x, y + 30, x + w / 3, y + 6); g.lineBetween(x + w / 3, y + 30, x + 2 * w / 3, y + 6);
                // Buracos de janela (alguns com brilho verde de dentro)
                for (let jy = y + 46; jy < 640; jy += 30) for (let jx = x + 10; jx < x + w - 18; jx += 24) {
                    const r = rnd.frac(); g.fillStyle(r > 0.9 ? 0x9dff5a : 0x061206, r > 0.9 ? 0.35 : 1); if (r > 0.2) g.fillRect(jx, jy, 12, 16);
                }
            }
        });
        // Entulho perto: montes de concreto, postes tortos e carros amassados
        const rnd = new Phaser.Math.RandomDataGenerator(['hulk']);
        this.camada(fase, 0.55, -84, (c3, L) => {
            for (let x = 30; x < L - 200; x += rnd.between(240, 420)) {
                c3.fillStyle(0x0b1d0a, 1);
                for (let k = 0; k < 5; k++) c3.fillRect(x + k * 18 + rnd.between(-6, 6), 660 - rnd.between(12, 40) + k * 2, rnd.between(26, 44), 50);
            }
            fase.desenharEntulho(c3, L, rnd);
        });
        // Colunas de fumaça subindo de incêndios (partículas recicladas por ponto)
        if (!reducedMotion.matches) {
            const focos = [0, 1, 2].map((i) => {
                const brasa = cena.add.circle(0, 640, 26, 0xff8a2a, 0.12).setScrollFactor(0).setDepth(-91);
                brasa.baseX = i * 560 + 180;
                brasa.fumaca = cena.add.particles(0, 0, 'faisca', {
                    x: 0, y: 630, lifespan: 5200, frequency: 260, speedY: { min: -40, max: -24 }, speedX: { min: -8, max: 14 },
                    scale: { start: 2.4, end: 7 }, alpha: { start: 0.16, end: 0 }, tint: 0x0a140a
                }).setScrollFactor(0).setDepth(-92);
                return brasa;
            });
            this.reciclar(fase, focos, 0.2, 1680, 120);
            this.animar(fase, (dt, agora) => focos.forEach((f) => { f.fumaca.x = f.x; f.setAlpha(0.08 + 0.06 * Math.sin(agora / 140 + f.baseX)); }));
        }
        // Raios gama: de vez em quando um raio verde corta o céu (e na fúria, sempre)
        const raio = cena.add.graphics().setScrollFactor(0).setDepth(-97);
        fase.estadoCenario.proximoRaio = cena.time.now + 2500;
        fase.estadoCenario.disparaRaio = (forte) => {
            raio.clear();
            let x = Phaser.Math.Between(150, 1130), y = 110;
            raio.lineStyle(forte ? 5 : 3, 0xb8ff7a, 0.9);
            raio.beginPath(); raio.moveTo(x, y);
            while (y < 420) { x += Phaser.Math.Between(-40, 40); y += Phaser.Math.Between(30, 60); raio.lineTo(x, y); }
            raio.strokePath(); raio.setAlpha(1);
            cena.tweens.add({ targets: raio, alpha: 0, duration: 380 });
            this.clarao(fase, 0x9dff5a, forte ? 0.14 : 0.07, 300);
        };
        this.animar(fase, (dt, agora) => {
            if (agora > fase.estadoCenario.proximoRaio) { fase.estadoCenario.disparaRaio(false); fase.estadoCenario.proximoRaio = agora + Phaser.Math.Between(3500, 7000); }
            // Fúria liga: raio forte (mesmo sem o aviso do Agente dos poderes)
            const furia = fase.emFuria ? fase.emFuria() : false;
            if (furia && !fase.estadoCenario.furiaVista) Cenarios.reagir(fase, 'furia');
            fase.estadoCenario.furiaVista = furia;
        });
        // Poeira na frente (já existia)
        fase.criarPoeiraAmbiente();
    },

    // ---------------------------------------------------------------
    // GAVIÃO ARQUEIRO — base tática à noite: hangares, torre de controle, radares girando,
    // holofotes varrendo, contêineres, cercas e luzes de pista em sequência
    // ---------------------------------------------------------------
    gaviao(fase) {
        this.preparar(fase);
        const cena = fase.cena;
        this.ceu(fase, 'cen-gaviao-ceu', [0x07021a, 0x23094d, 0x5a2a9a], (g, w, h) => {
            this.estrelas(g, w, h, 'gaviao-estrelas', 90, 0xe6d8ff, 0.5);
            for (let i = 0; i < 5; i++) { g.fillStyle(0xb8ff5a, 0.025); g.fillRect(0, h - 40 - i * 24, w, 40 + i * 24); }
        });
        // Hangares (telhado arredondado) e torre de controle ao longe
        this.camada(fase, 0.05, -96, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['gaviao-longe']);
            for (let x = 0; x < L - 300; x += rnd.between(260, 420)) {
                const w = rnd.between(180, 260), h = rnd.between(70, 110), y = 660 - h;
                g.fillStyle(0x16063a, 1); g.fillRect(x, y, w, h); g.fillEllipse(x + w / 2, y, w, 70);
                g.fillStyle(0x0c0326, 1); g.fillRect(x + w * 0.3, y + 20, w * 0.4, h - 20);
                if (rnd.frac() > 0.5) {
                    const tx = x + w + 40;
                    g.fillStyle(0x16063a, 1); g.fillRect(tx, 660 - 260, 26, 260); g.fillRect(tx - 22, 660 - 300, 70, 40);
                    g.fillStyle(0xb8ff5a, 0.5); g.fillRect(tx - 16, 660 - 292, 58, 14);
                }
            }
        });
        // Contêineres empilhados, passarelas e cercas no meio
        this.camada(fase, 0.18, -92, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['gaviao-meio']);
            const cores = [0x2a0f5a, 0x1d2a5a, 0x3a1450];
            for (let x = 0; x < L - 200; x += rnd.between(200, 320)) {
                const pilha = rnd.between(1, 3);
                for (let k = 0; k < pilha; k++) {
                    const cx = x + rnd.between(-10, 10), cy = 660 - (k + 1) * 46, cw = rnd.between(110, 150);
                    g.fillStyle(rnd.pick(cores), 1); g.fillRect(cx, cy, cw, 44);
                    g.lineStyle(1, 0x0c0326, 0.8); for (let r = cx + 8; r < cx + cw; r += 10) g.lineBetween(r, cy + 3, r, cy + 41);
                }
                // Passarela treliçada (linhas cruzadas) e cerca de arame (grade)
                g.lineStyle(2, 0x3a1a6a, 0.9); g.lineBetween(x + 160, 400, x + 300, 400); g.lineBetween(x + 160, 420, x + 300, 420);
                for (let k = 0; k < 7; k++) g.lineBetween(x + 160 + k * 20, 400, x + 180 + k * 20, 420);
                g.lineStyle(1, 0x5a3a9a, 0.35);
                for (let k = 0; k < 10; k++) { g.lineBetween(x + k * 14, 600, x + k * 14 + 30, 660); g.lineBetween(x + k * 14 + 30, 600, x + k * 14, 660); }
            }
        });
        // Barreiras de segurança perto, com listras de alerta e postes de holofote
        this.camada(fase, 0.45, -84, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['gaviao-perto']);
            for (let x = 0; x < L - 200; x += rnd.between(280, 460)) {
                g.fillStyle(0x12052e, 1); g.fillRect(x, 628, 120, 32);
                g.lineStyle(5, 0xb8ff5a, 0.25); for (let k = 0; k < 6; k++) g.lineBetween(x + 6 + k * 20, 656, x + 18 + k * 20, 632);
                g.fillStyle(0x12052e, 1); g.fillRect(x + 170, 470, 6, 190); g.fillRect(x + 158, 466, 30, 10);
                g.fillStyle(0xe6ffb8, 0.6); g.fillRect(x + 162, 476, 22, 4);
            }
        });
        // Holofotes varrendo (verde-limão bem transparente)
        const feixes = [0, 1].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-97);
            g.fillStyle(0xe6ffb8, 0.05).fillRect(-18, -600, 36, 600);
            g.y = 660; g.baseX = i * 650 + 300; g.fase0 = i * 3;
            return g;
        });
        this.reciclar(fase, feixes, 0.05, 1300, 100);
        this.animar(fase, (dt, agora) => feixes.forEach((f) => { f.rotation = Math.sin(agora / 1900 + f.fase0) * 0.7; }));
        // Radares girando no alto dos prédios do meio
        const radares = [0, 1, 2].map((i) => {
            const base = cena.add.rectangle(0, 660 - 160, 6, 60, 0x2a0f5a).setOrigin(0.5, 0).setScrollFactor(0).setDepth(-91);
            const prato = cena.add.ellipse(0, 660 - 168, 54, 22, 0x3a1a6a).setStrokeStyle(2, 0xb8ff5a, 0.5).setScrollFactor(0).setDepth(-91);
            base.prato = prato; base.baseX = i * 520 + 150; base.fase0 = i;
            return base;
        });
        this.reciclar(fase, radares, 0.18, 1560, 80);
        this.animar(fase, (dt, agora) => radares.forEach((r) => { r.prato.x = r.x; r.prato.scaleX = Math.cos(agora / 700 + r.fase0); }));
        // Luzes de pista acendendo em sequência rente ao chão
        const luzes = [];
        for (let i = 0; i < 16; i++) { const c = cena.add.circle(0, 652, 3, 0xb8ff5a, 0.2).setScrollFactor(0).setDepth(-83); c.baseX = i * 100; c.indice = i; luzes.push(c); }
        this.reciclar(fase, luzes, 0.45, 1600, 40);
        this.animar(fase, (dt, agora) => { const atual = Math.floor(agora / 90) % 16; luzes.forEach((l) => l.setAlpha(l.indice === atual ? 1 : 0.2)); });
    },

    // ---------------------------------------------------------------
    // DOUTOR ESTRANHO (especial) — santuário místico entre dimensões:
    // céu com nebulosas, círculo mágico gigante em dois anéis, arcos e cúpulas flutuantes,
    // estantes arcanas suspensas, portais ao fundo, selos girando e faíscas de energia.
    // Tudo existe em duas versões (Normal e Espelho) e gira conforme o relógio da fase
    // (a Joia do Tempo desacelera e REVERTE o cenário junto).
    // ---------------------------------------------------------------
    estranho(fase) {
        this.preparar(fase);
        const cena = fase.cena, est = fase.estadoCenario;
        est.porDim = { N: [], E: [] };
        const paletas = {
            N: { ceu: [0x05061c, 0x16194f, 0x3a2470], neb: [0x7a2ad0, 0x10a08a], pedra: 0x12153e, pedra2: 0x1b1f55, ouro: 0xffa53d, brilho: 0xffd27a, livro: [0xffa53d, 0x2adf9a, 0xa04adf, 0xd03a4a] },
            E: { ceu: [0x0c0214, 0x2a0a3c, 0x521a4e], neb: [0xff4ad2, 0x2ad0ff], pedra: 0x240a34, pedra2: 0x34104a, ouro: 0xff7ad9, brilho: 0xffc2ee, livro: [0xff7ad9, 0x2ad0ff, 0xffd27a, 0x8a4aff] }
        };
        // Cada camada é desenhada "de pé"; no Espelho a mesma arte é virada de cabeça pra baixo
        // (flipY + deslocamento de 40 px = mesma conta do espelharY: y → 760 - y)
        const virar = (tile, dim) => { if (dim === 'E') { tile.setFlipY(true); tile.y = 40; } return tile; };
        ['N', 'E'].forEach((dim) => {
            const p = paletas[dim], marca = (o) => { o.dimensao = dim; est.porDim[dim].push(o); return o; };
            // Céu com nebulosas e estrelas
            marca(this.ceu(fase, `cen-estranho-ceu-${dim}`, p.ceu, (g, w, h) => {
                const rnd = new Phaser.Math.RandomDataGenerator(['nebulosa' + dim]);
                for (let i = 0; i < 16; i++) { g.fillStyle(rnd.pick(p.neb), 0.05); g.fillEllipse(rnd.between(0, w), rnd.between(40, h - 60), rnd.between(260, 620), rnd.between(80, 200)); }
                this.estrelas(g, w, h, 'estranho-estrelas' + dim, 160, 0xfff0d8, 0.95);
            }));
            // Arquitetura flutuante ao longe: arcos com colunas, cúpulas e ilhas de pedra suspensas
            marca(virar(this.camada(fase, 0.05, dim === 'E' ? -95.5 : -96, (g, L) => {
                const rnd = new Phaser.Math.RandomDataGenerator(['santuario' + dim]);
                for (let x = 40; x < L - 260; x += rnd.between(240, 380)) {
                    const base = rnd.between(400, 520), w = rnd.between(120, 180), topo = base - rnd.between(110, 170);
                    // Ilha de pedra com degraus de rocha pendurada embaixo
                    g.fillStyle(p.pedra, 1); g.fillRect(x - 20, base, w + 40, 18);
                    for (let k = 1; k < 4; k++) g.fillRect(x - 20 + k * 14, base + 18 + (k - 1) * 14, w + 40 - k * 28, 14);
                    // Duas colunas com arco no meio (e um arco dourado por dentro)
                    g.fillRect(x, topo, 18, base - topo); g.fillRect(x + w - 18, topo, 18, base - topo);
                    g.lineStyle(14, p.pedra, 1); g.beginPath(); g.arc(x + w / 2, topo, w / 2 - 9, Math.PI, Math.PI * 2); g.strokePath();
                    g.lineStyle(2, p.ouro, 0.3); g.beginPath(); g.arc(x + w / 2, topo, w / 2 - 18, Math.PI, Math.PI * 2); g.strokePath();
                    // Cúpula com mastro em cima de algumas
                    if (rnd.frac() > 0.5) { g.fillStyle(p.pedra2, 1); g.fillEllipse(x + w / 2, topo - w / 2 + 6, w * 0.7, w * 0.5); g.fillRect(x + w / 2 - 2, topo - w / 2 - 40, 4, 30); }
                    // Janela circular com brilho dourado
                    g.fillStyle(p.ouro, 0.18); g.fillCircle(x + w / 2, topo + 30, 12);
                }
            }), dim));
            // Estantes arcanas suspensas por correntes (livros coloridos) e lanternas
            marca(virar(this.camada(fase, 0.18, dim === 'E' ? -91.5 : -92, (g, L) => {
                const rnd = new Phaser.Math.RandomDataGenerator(['biblioteca' + dim]);
                for (let x = 20; x < L - 220; x += rnd.between(260, 420)) {
                    const y = rnd.between(220, 460), w = rnd.between(110, 160), andares = rnd.between(2, 3);
                    g.lineStyle(2, p.pedra2, 1); g.lineBetween(x + 10, 100, x + 10, y); g.lineBetween(x + w - 10, 100, x + w - 10, y);
                    g.fillStyle(0x1a0f24, 1); g.fillRect(x, y, w, andares * 34 + 6);
                    for (let a = 0; a < andares; a++) {
                        const prat = y + 4 + a * 34;
                        for (let bx = x + 6; bx < x + w - 10;) {
                            const bw = rnd.between(5, 10), bh = rnd.between(20, 28);
                            g.fillStyle(rnd.pick(p.livro), 0.55); g.fillRect(bx, prat + 30 - bh, bw, bh);
                            bx += bw + 1;
                        }
                        g.fillStyle(0x2a1a36, 1); g.fillRect(x, prat + 30, w, 4);
                    }
                    const lx = x + w + 40, ly = rnd.between(180, 300);
                    g.lineStyle(1, p.pedra2, 1); g.lineBetween(lx, 100, lx, ly);
                    g.fillStyle(p.brilho, 0.12); g.fillCircle(lx, ly + 10, 22); g.fillStyle(p.ouro, 0.7); g.fillRect(lx - 6, ly, 12, 18);
                }
            }), dim));
            // Escadas impossíveis perto (identidade da fase), com leve ondulação dimensional
            const escadas = marca(virar(this.camada(fase, 0.36, dim === 'E' ? -83.5 : -84, (g, L) => {
                const rnd = new Phaser.Math.RandomDataGenerator(['escadas' + dim]);
                for (let x = 40; x < L - 220; x += rnd.between(280, 440)) {
                    g.fillStyle(p.pedra2, 0.9);
                    for (let d = 0; d < 7; d++) g.fillRect(x + d * 22, 600 - d * 28, 24, 12);
                    g.lineStyle(2, p.ouro, 0.22); g.lineBetween(x + 170, 330, x + 250, 290);
                }
            }), dim));
            escadas.distorce = true; escadas.yBase = escadas.y;
        });
        // Círculo mágico gigante (desenho da fase em this.mandala) + anel externo girando ao contrário
        est.anelExterno = cena.add.graphics().setScrollFactor(0).setDepth(-94.5).setPosition(820, 380);
        est.anelInterno = cena.add.graphics().setScrollFactor(0).setDepth(-94.4).setPosition(820, 380);
        this.desenharCirculoMagico(fase, paletas.N.ouro);
        // Portais ao fundo: anéis de faíscas girando com interior escuro
        const portais = [0, 1, 2].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-93);
            g.y = 220 + (i % 2) * 140; g.raio = 46 + (i % 3) * 14; g.baseX = i * 640 + 300; g.fase0 = i;
            return g;
        });
        est.portaisFundo = portais;
        this.reciclar(fase, portais, 0.1, 1920, 150);
        // Selos arcanos flutuando (círculos com quadrados girados e pontos)
        const selos = [0, 1, 2, 3, 4, 5].map((i) => {
            const g = cena.add.graphics().setScrollFactor(0).setDepth(-90);
            g.y0 = 180 + (i * 67) % 380; g.baseX = i * 320 + 80; g.fase0 = i * 1.7; g.tam = 14 + (i % 3) * 6;
            return g;
        });
        est.selos = selos;
        this.reciclar(fase, selos, 0.3, 1920, 60);
        this.desenharPortaisESelos(fase, paletas.N);
        // Faíscas de energia subindo (douradas, laranja e esmeralda), bem pequenas
        est.faiscas = this.particulas(fase, { tint: [0xffa53d, 0xffd27a, 0x2adf9a], frequency: 120, speedY: { min: -26, max: -8 }, speedX: { min: -6, max: 6 } }, -89);
        // Animação: tudo gira pelo relógio da fase (Joia desacelera e reverte junto)
        est.giro = 0;
        this.animar(fase, (dt, agora) => {
            const f = fase.fatorTempo === undefined ? 1 : fase.fatorTempo;
            est.giro += dt / 1000 * f;
            est.anelExterno.rotation = -est.giro * 0.08;
            est.anelInterno.rotation = est.giro * 0.14;
            portais.forEach((p) => { p.rotation = est.giro * (0.6 + p.fase0 * 0.15) * (p.fase0 % 2 ? -1 : 1); });
            selos.forEach((s) => { s.rotation = est.giro * 0.5 + s.fase0; s.y = s.y0 + Math.sin(est.giro * 0.9 + s.fase0) * 10; });
            // Distorção sutil (ondulação) nas camadas marcadas
            (fase.camadas || []).forEach((c) => { if (c.distorce) c.y = c.yBase + Math.sin(est.giro * 1.3) * 3; });
            // Faíscas acompanham o tempo (devagar com a Joia, descem quando o tempo reverte)
            if (est.faiscas) est.faiscas.timeScale = Math.max(0.15, Math.abs(f));
            // Detecta a Joia pelo estado real da fase (funciona mesmo sem o aviso explícito)
            const joia = !!fase.joiaAtiva, rev = !!fase.revertendo;
            if (joia && !est.joiaVista) Cenarios.reagir(fase, 'joiaInicio');
            if (joia && rev !== !!est.revVista) Cenarios.reagir(fase, 'joiaReverso');
            if (!joia && est.joiaVista) Cenarios.reagir(fase, 'joiaFim');
            // Pulsação esmeralda enquanto a Joia está ativa
            if (est.veuJoia && est.joiaVista) est.veuJoia.setAlpha(0.13 + 0.05 * Math.sin(agora / 160));
        });
        // Começa na Normal
        this.mostrarDimensao(fase, 'N');
    },

    // Círculo mágico em dois anéis: externo com runas quadradas, interno com estrela de quadrados e hexágono
    desenharCirculoMagico(fase, cor) {
        const est = fase.estadoCenario, a = est.anelExterno, b = est.anelInterno;
        a.clear(); b.clear();
        a.lineStyle(2, cor, 0.16).strokeCircle(0, 0, 330).strokeCircle(0, 0, 312);
        for (let i = 0; i < 36; i++) {
            const ang = i / 36 * Math.PI * 2, x = Math.cos(ang) * 321, y = Math.sin(ang) * 321;
            a.fillStyle(cor, i % 3 ? 0.12 : 0.24); a.fillRect(x - 3, y - 3, 6, 6);
        }
        b.lineStyle(2, cor, 0.14);
        b.strokePoints(this.poligono(4, 230, 0), true); b.strokePoints(this.poligono(4, 230, Math.PI / 4), true);
        b.strokePoints(this.poligono(6, 150, 0), true); b.strokeCircle(0, 0, 170);
        b.lineStyle(2, 0x2adf9a, 0.12).strokeCircle(0, 0, 96);
    },

    // Redesenha portais do fundo e selos na cor da dimensão
    desenharPortaisESelos(fase, p) {
        const est = fase.estadoCenario;
        est.portaisFundo.forEach((g) => {
            g.clear();
            g.fillStyle(0x0a0420, 0.55).fillCircle(0, 0, g.raio - 6);
            g.fillStyle(p.neb[0], 0.12).fillCircle(0, 0, g.raio - 14);
            g.lineStyle(5, p.ouro, 0.4).strokeCircle(0, 0, g.raio);
            for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.fillStyle(p.brilho, 0.5); g.fillRect(Math.cos(a) * (g.raio + 7) - 2, Math.sin(a) * (g.raio + 7) - 2, 4, 4); }
        });
        est.selos.forEach((g) => {
            g.clear();
            g.lineStyle(2, p.ouro, 0.3).strokeCircle(0, 0, g.tam);
            g.strokePoints(this.poligono(4, g.tam * 0.75, Math.PI / 4), true);
            g.fillStyle(p.brilho, 0.35).fillCircle(0, 0, 2.5);
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.fillRect(Math.cos(a) * g.tam - 1.5, Math.sin(a) * g.tam - 1.5, 3, 3); }
        });
        this.desenharCirculoMagico(fase, p.ouro);
    },

    // Mostra só o cenário da dimensão ativa (chamado pela troca de paleta da fase)
    mostrarDimensao(fase, dim) {
        const est = fase.estadoCenario;
        if (!est || !est.porDim) return;
        ['N', 'E'].forEach((d) => est.porDim[d].forEach((o) => o.setVisible(d === dim)));
        const p = dim === 'E'
            ? { neb: [0xff4ad2, 0x2ad0ff], ouro: 0xff7ad9, brilho: 0xffc2ee }
            : { neb: [0x7a2ad0, 0x10a08a], ouro: 0xffa53d, brilho: 0xffd27a };
        if (est.portaisFundo) this.desenharPortaisESelos(fase, p);
    },

    // ---------------------------------------------------------------
    // WANDA — realidade do caos: céu carmesim com redemoinho hex, casas de subúrbio distorcidas,
    // cercas e postes tortos, névoa escarlate correndo, fragmentos flutuando e ondas hex
    // ---------------------------------------------------------------
    wanda(fase) {
        this.preparar(fase);
        const cena = fase.cena, est = fase.estadoCenario;
        this.ceu(fase, 'cen-wanda-ceu', [0x050002, 0x22030a, 0x6a0a1c], (g, w, h) => {
            this.estrelas(g, w, h, 'wanda-estrelas', 40, 0xffb3c0, 0.4);
            for (let i = 0; i < 6; i++) { g.fillStyle(0xff2a3d, 0.03); g.fillRect(0, h - 50 - i * 28, w, 50 + i * 28); }
        });
        // Redemoinho hex no céu (anéis hexagonais girando)
        est.vortice = cena.add.graphics().setScrollFactor(0).setDepth(-97.5).setPosition(980, 230);
        const desenharVortice = (cor) => {
            est.vortice.clear();
            for (let k = 0; k < 6; k++) est.vortice.lineStyle(3, cor, 0.05 + k * 0.025).strokePoints(this.poligono(6, 170 - k * 26, k * 0.25), true);
            est.vortice.fillStyle(cor, 0.06).fillCircle(0, 0, 30);
        };
        est.desenharVortice = desenharVortice;
        desenharVortice(0xff2a3d);
        // Casas distorcidas ao longe
        this.camada(fase, 0.05, -96, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['wanda-longe']);
            for (let x = 0; x < L - 120; x += rnd.between(90, 150)) {
                const w = rnd.between(70, 110), h = rnd.between(70, 120), t = rnd.between(-18, 18), y = 660 - h;
                g.fillStyle(0x16020a, 1); g.fillPoints([{ x, y: 660 }, { x: x + w, y: 660 }, { x: x + w + t, y }, { x: x + t, y }], true);
                g.fillRect(x + t - 8, y - 12, w + 16, 12); g.fillRect(x + t + w * 0.65, y - 34, 12, 24);
            }
        });
        // Rua de subúrbio no meio: casas com janelas acesas, cercas e postes tortos
        this.camada(fase, 0.2, -92, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['wanda']);
            for (let x = 0; x < L - 200; x += rnd.between(180, 260)) {
                const w = rnd.between(100, 140), h = rnd.between(100, 160), t = rnd.between(-14, 14), y = 660 - h;
                g.fillStyle(0x1f030c, 1); g.fillPoints([{ x, y: 660 }, { x: x + w, y: 660 }, { x: x + w + t, y }, { x: x + t, y }], true);
                g.fillRect(x + t - 10, y - 14, w + 20, 14); g.fillRect(x + w / 2 + t - 12, y - 40, 24, 26);
                // Janelas com luz âmbar/carmesim e uma porta
                g.fillStyle(0xff6a4d, 0.35); g.fillRect(x + 16, y + 24, 18, 22); g.fillRect(x + w - 34, y + 24, 18, 22);
                g.fillStyle(0x0d0105, 1); g.fillRect(x + w / 2 - 10, 660 - 40, 20, 40);
                // Cerca de estacas
                g.fillStyle(0x2a0510, 1); for (let k = 0; k < 8; k++) g.fillRect(x + w + 10 + k * 10, 632, 5, 28);
                g.fillRect(x + w + 8, 640, 82, 4);
                // Poste torto com luz
                const px = x + w + 100;
                g.lineStyle(4, 0x2a0510, 1); g.lineBetween(px, 660, px + 14, 520); g.lineBetween(px + 14, 520, px + 34, 516);
                g.fillStyle(0xff2a3d, 0.12); g.fillCircle(px + 34, 522, 20);
            }
        });
        // Névoa escarlate correndo (anda sozinha além do paralaxe)
        const nevoa = this.camada(fase, 0.3, -84, (g, L) => {
            const rnd = new Phaser.Math.RandomDataGenerator(['wanda-nevoa']);
            for (let i = 0; i < 14; i++) { g.fillStyle(0xff2a4d, 0.05); g.fillEllipse(rnd.between(0, L), rnd.between(480, 650), rnd.between(320, 640), rnd.between(30, 70)); }
        });
        est.nevoa = nevoa;
        this.animar(fase, (dt) => { nevoa.tilePositionX += dt * 0.02; });
        // Fragmentos flutuando (pedaços de parede e telha girando devagar)
        const frags = [];
        for (let i = 0; i < 9; i++) {
            const r = cena.add.rectangle(0, 0, 10 + (i % 3) * 8, 6 + (i % 2) * 6, 0x3a0614).setStrokeStyle(1, 0xff2a3d, 0.4).setScrollFactor(0).setDepth(-90);
            r.y0 = 170 + (i * 53) % 360; r.baseX = i * 200 + 40; r.fase0 = i * 0.9; frags.push(r);
        }
        this.reciclar(fase, frags, 0.25, 1800, 60);
        this.animar(fase, (dt, agora) => frags.forEach((f) => { f.rotation += dt / 1000 * (0.3 + f.fase0 * 0.05); f.y = f.y0 + Math.sin(agora / 900 + f.fase0) * 14; }));
        // Ondas hex de tempos em tempos + redemoinho girando
        est.proximaOnda = cena.time.now + 1500;
        this.animar(fase, (dt, agora) => {
            est.vortice.rotation += dt / 1000 * 0.15;
            if (agora > est.proximaOnda) { this.ondaHex(fase, Phaser.Math.Between(200, 1100), Phaser.Math.Between(200, 520), est.corOnda || 0xff2a3d); est.proximaOnda = agora + Phaser.Math.Between(2200, 3800); }
            // Troca de realidade detectada pelo estado real da fase
            if (fase.realidade && fase.realidade !== est.realidadeVista) Cenarios.reagir(fase, 'realidade', { realidade: fase.realidade });
        });
    },

    // Onda hexagonal crescendo (posição na tela), atrás dos obstáculos
    ondaHex(fase, x, y, cor, r1 = 160) {
        if (reducedMotion.matches) return;
        const g = fase.cena.add.graphics().setScrollFactor(0).setDepth(-88).setPosition(x, y);
        const e = { r: 10, a: 0.35 };
        fase.cena.tweens.add({
            targets: e, r: r1, a: 0, duration: 1400, ease: 'Sine.Out',
            onUpdate: () => { g.clear(); g.lineStyle(3, cor, e.a).strokePoints(this.poligono(6, e.r, 0.3), true); },
            onComplete: () => g.destroy()
        });
    },

    // ---------------------------------------------------------------
    // REAÇÕES DO CENÁRIO AOS PODERES (contrato com Fase.cenarioReagir)
    // Idempotentes: podem vir do aviso explícito do poder ou da detecção pelo estado da fase.
    // ---------------------------------------------------------------
    reagir(fase, evento, dados = {}) {
        const est = fase.estadoCenario;
        if (!est) return;
        const agora = fase.cena.time.now;
        switch (evento) {
            // Joia do Tempo: véu esmeralda atrás dos obstáculos, onda verde e runas no círculo mágico
            case 'joiaInicio': {
                if (est.joiaVista) return;
                est.joiaVista = true; est.revVista = !!fase.revertendo;
                if (!est.veuJoia) est.veuJoia = fase.cena.add.rectangle(640, 380, 1280, 560, 0x2adf9a, 0).setScrollFactor(0).setDepth(-61);
                fase.cena.tweens.killTweensOf(est.veuJoia);
                fase.cena.tweens.add({ targets: est.veuJoia, alpha: 0.15, duration: reducedMotion.matches ? 1 : 260 });
                const pt = this.jogadorTela(fase);
                this.anelTela(fase, pt.x, pt.y, 0x2adf9a, 20, 700, 900, 5);
                if (est.anelInterno) this.desenharCirculoMagico(fase, 0x2adf9a);
                if (est.faiscas) est.faiscas.setParticleTint(0x2adf9a);
                break;
            }
            case 'joiaReverso': {
                est.revVista = !!fase.revertendo;
                const pt = this.jogadorTela(fase);
                // Anel que ENCOLHE (tempo voltando)
                this.anelTela(fase, pt.x, pt.y, 0x7affc8, 520, 20, 700, 4);
                this.clarao(fase, 0x2adf9a, 0.1, 240);
                break;
            }
            case 'joiaFim': {
                if (!est.joiaVista) return;
                est.joiaVista = false; est.revVista = false;
                if (est.veuJoia) { fase.cena.tweens.killTweensOf(est.veuJoia); fase.cena.tweens.add({ targets: est.veuJoia, alpha: 0, duration: reducedMotion.matches ? 1 : 700 }); }
                if (est.anelInterno) this.desenharCirculoMagico(fase, fase.dim === 'E' ? 0xff7ad9 : 0xffa53d);
                if (est.faiscas) est.faiscas.setParticleTint(0xffa53d);
                break;
            }
            // Portais: clarão dourado curto e o círculo mágico "respira"
            case 'portalAbre':
            case 'portalFecha': {
                if (agora - (est.ultimoPortal || 0) < 120) return;
                est.ultimoPortal = agora;
                this.clarao(fase, 0xffb347, evento === 'portalAbre' ? 0.14 : 0.08, 260);
                if (est.anelExterno && !reducedMotion.matches) fase.cena.tweens.add({ targets: [est.anelExterno, est.anelInterno], scale: 1.08, duration: 160, yoyo: true });
                break;
            }
            // Troca de dimensão: luz muda de cor e as camadas "dobram" (o espaço vira)
            case 'dimensao': {
                if (agora - (est.ultimaDim || 0) < 200) return;
                est.ultimaDim = agora;
                const dim = (dados && dados.dim) || fase.dim;
                this.clarao(fase, dim === 'E' ? 0xff7ad9 : 0xffa53d, 0.2, 380);
                if (!reducedMotion.matches) (fase.camadas || []).forEach((c) => { if (c.visible) fase.cena.tweens.add({ targets: c, scaleY: { from: 0.94, to: 1 }, duration: 320, ease: 'Back.Out' }); });
                break;
            }
            // Hulk: raio gama forte e clarão verde
            case 'furia': {
                if (est.disparaRaio) est.disparaRaio(true);
                break;
            }
            // Homem de Ferro: hologramas acendem com o disparo
            case 'repulsor': {
                est.brilhoHolo = 0.6;
                break;
            }
            // Wanda: onda hex grande e o céu muda de tom com a realidade
            case 'realidade': {
                const real = (dados && dados.realidade) || fase.realidade;
                if (real === est.realidadeVista) return;
                const primeira = est.realidadeVista === undefined;
                est.realidadeVista = real;
                est.corOnda = real === 'B' ? 0x4a8aff : 0xff2a3d;
                if (est.desenharVortice) est.desenharVortice(est.corOnda);
                if (est.nevoa) est.nevoa.setTint(real === 'B' ? 0x8ab4ff : 0xffffff);
                if (!primeira) { const pt = this.jogadorTela(fase); this.ondaHex(fase, pt.x, pt.y, est.corOnda, 420); }
                break;
            }
            // Flechas e teia: o cenário fica quieto (são frequentes demais pra piscar a tela)
            default: break;
        }
    }
};
