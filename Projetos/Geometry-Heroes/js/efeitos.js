// ================================================================
// efeitos.js — efeitos visuais reaproveitados por todas as fases
// ================================================================

// Classe Efeitos: uma instância por cena (recebe a cena no construtor)
class Efeitos {
    constructor(cena) {
        // Guarda a cena (pra criar objetos e tweens)
        this.cena = cena;
        // Com movimento reduzido, usa 1/3 das partículas
        this.fator = reducedMotion.matches ? 0.33 : 1;
    }

    // Duração de animação: 1 ms se o jogador prefere menos movimento
    dur(ms) {
        // Retorna 1 ou o valor pedido
        return reducedMotion.matches ? 1 : ms;
    }

    // Explosão de partículas (estilhaços) numa posição, com uma cor
    estilhacos(x, y, cor, n = 10, velocidade = 220) {
        // Cria um emissor de partículas com a textura 'faisca'
        const emissor = this.cena.add.particles(x, y, 'faisca', {
            // Velocidade aleatória de cada partícula
            speed: { min: velocidade * 0.3, max: velocidade },
            // Caem com gravidade
            gravityY: 600,
            // Vida de cada partícula (ms)
            lifespan: { min: 300, max: 650 },
            // Encolhem até sumir
            scale: { start: 1.2, end: 0 },
            // Cor
            tint: cor,
            // Não fica soltando sem parar (só a explosão abaixo)
            emitting: false
        });
        // Fica acima do cenário
        emissor.setDepth(20);
        // Solta n partículas de uma vez
        emissor.explode(Math.max(1, Math.round(n * this.fator)));
        // Apaga o emissor depois que as partículas somem
        this.cena.time.delayedCall(800, () => emissor.destroy());
        // Impactos grandes (morte, bloco destruído, drone abatido) ganham também pixels 8-bit
        if (n >= 8) this.pixels(x, y, cor, Math.round(n * 0.6), velocidade * 0.9);
    }

    // ---------------------------------------------------------------
    // EFEITOS 8-BIT (pixel art): quadradinhos duros, sem brilho somado, que mudam de tamanho e de
    // transparência em DEGRAUS (steps) — o "piscar" dos jogos antigos. Poucos pixels e vida curta,
    // pra dar o toque retrô sem poluir a tela.
    // ---------------------------------------------------------------

    // Textura de um pixel "gordo" (6×6), gerada uma vez
    texturaPixel() {
        if (this.cena.textures.exists('pixel8')) return;
        const g = this.cena.make.graphics({ add: false });
        g.fillStyle(0xffffff, 1).fillRect(0, 0, 6, 6);
        g.generateTexture('pixel8', 6, 6); g.destroy();
    }

    // Explosão de pixels (impacto, destruição, morte). opcoes: { cima: só pra cima (pulo), gravidade }
    pixels(x, y, cor, n = 8, velocidade = 200, opcoes = {}) {
        this.texturaPixel();
        const emissor = this.cena.add.particles(x, y, 'pixel8', {
            speed: { min: velocidade * 0.35, max: velocidade },
            angle: opcoes.cima ? { min: 200, max: 340 } : { min: 0, max: 360 },
            gravityY: opcoes.gravidade !== undefined ? opcoes.gravidade : 500,
            lifespan: { min: 220, max: 420 },
            // Tamanho e alpha em degraus (3 "quadros" de animação, como sprite 8-bit)
            scale: { start: 1.2, end: 0.4, steps: 3 },
            alpha: { start: 1, end: 0.2, steps: 3 },
            tint: cor, emitting: false
        }).setDepth(21);
        emissor.explode(Math.max(1, Math.round(n * this.fator)));
        this.cena.time.delayedCall(600, () => emissor.destroy());
    }

    // Anel de pixels que se abre em degraus (poder ativado, portal abrindo/fechando)
    anelPixels(x, y, cor, raio = 34, n = 12, ms = 260) {
        if (reducedMotion.matches) return;
        this.texturaPixel();
        const cores = Array.isArray(cor) ? cor : [cor];
        const estado = { r: raio * 0.35 };
        const px = [];
        for (let i = 0; i < n; i++) px.push(this.cena.add.image(x, y, 'pixel8').setTint(cores[i % cores.length]).setDepth(21));
        const posicionar = () => px.forEach((p, i) => {
            const a = i / n * Math.PI * 2;
            // Posição arredondada em múltiplos de 3 px: o anel "anda" na grade, como pixel art
            p.setPosition(x + Math.round(Math.cos(a) * estado.r / 3) * 3, y + Math.round(Math.sin(a) * estado.r / 3) * 3);
        });
        posicionar();
        this.cena.tweens.add({ targets: estado, r: raio, duration: this.dur(ms), ease: 'Stepped', easeParams: [4], onUpdate: posicionar });
        this.cena.tweens.add({ targets: px, alpha: 0, duration: this.dur(ms), delay: this.dur(ms * 0.5), ease: 'Stepped', easeParams: [3], onComplete: () => px.forEach((p) => p.destroy()) });
    }

    // Poeira (partículas cinzas grandes que sobem devagar)
    poeira(x, y, cor = 0x9a9f96, n = 8) {
        // Emissor de poeira
        const emissor = this.cena.add.particles(x, y, 'faisca', {
            // Velocidade baixa
            speed: { min: 20, max: 90 },
            // Sobe um pouco
            gravityY: -40,
            // Vida longa
            lifespan: { min: 400, max: 900 },
            // Cresce enquanto some (parece fumaça)
            scale: { start: 1.2, end: 3 },
            // Começa meio transparente e some
            alpha: { start: 0.5, end: 0 },
            // Cor da poeira
            tint: cor,
            // Só explosão
            emitting: false
        });
        // Acima do cenário
        emissor.setDepth(19);
        // Solta as partículas
        emissor.explode(Math.max(1, Math.round(n * this.fator)));
        // Apaga depois
        this.cena.time.delayedCall(1000, () => emissor.destroy());
    }

    // Poeira do POUSO: curta e nítida (feedback do toque no chão, ~0,25 s). A poeira antiga crescia 3x
    // e durava até 0,9 s; com o cubo correndo, deixava manchas borradas atrás dele.
    poeiraPouso(x, y, cor = 0x9a9f96, dir = 1) {
        const emissor = this.cena.add.particles(x, y, 'faisca', {
            speedX: { min: -70, max: 70 }, speedY: { min: -40 * dir, max: -10 * dir },
            lifespan: { min: 160, max: 260 }, scale: { start: 0.7, end: 0.2 }, alpha: { start: 0.55, end: 0 },
            tint: cor, emitting: false
        }).setDepth(19);
        emissor.explode(Math.max(2, Math.round(5 * this.fator)));
        this.cena.time.delayedCall(320, () => emissor.destroy());
    }

    // Anel que cresce e some (onda de choque / acerto)
    anel(x, y, cor, raio = 26, escalaFinal = 2.4, ms = 320) {
        // Círculo vazado
        const anel = this.cena.add.circle(x, y, raio).setStrokeStyle(3, cor).setDepth(21);
        // Cresce e some
        this.cena.tweens.add({
            targets: anel,
            scale: escalaFinal,
            alpha: 0,
            duration: this.dur(ms),
            onComplete: () => anel.destroy()
        });
    }

    // Tremor de câmera (desligado com movimento reduzido)
    tremor(ms = 120, intensidade = 0.006) {
        // Só treme se o jogador não pediu menos movimento
        if (!reducedMotion.matches) this.cena.cameras.main.shake(ms, intensidade);
    }

    // Flash de cor na tela (desligado com movimento reduzido)
    flash(r, g, b, ms = 200) {
        // Só pisca se o jogador não pediu menos movimento
        if (!reducedMotion.matches) this.cena.cameras.main.flash(ms, r, g, b);
    }

    // Texto que sobe e some (ex.: "LONGE", "+1", "CLANG")
    textoFlutuante(x, y, txt, cor = '#ffffff') {
        // Cria o texto centralizado
        const t = this.cena.add.text(x, y, txt, {
            fontFamily: 'Arial, sans-serif',   // Fonte
            fontSize: '18px',                  // Tamanho
            fontStyle: 'bold',                 // Negrito
            color: cor,                        // Cor
            stroke: '#000000',                 // Contorno preto (legível em qualquer fundo)
            strokeThickness: 4                 // Espessura do contorno
        }).setOrigin(0.5).setDepth(40);
        // Sobe 40 px e some
        this.cena.tweens.add({
            targets: t,
            y: y - 40,
            alpha: 0,
            duration: this.dur(700),
            onComplete: () => t.destroy()
        });
    }

    // Fumaça vermelha (magia da Wanda e caos)
    fumacaVermelha(x, y, n = 24) {
        // Emissor de fumaça carmesim
        const fumaca = this.cena.add.particles(x, y, 'faisca', {
            // Velocidade
            speed: { min: 40, max: 180 },
            // Vida
            lifespan: { min: 250, max: 550 },
            // Cresce enquanto some
            scale: { start: 1, end: 2.2 },
            // Some aos poucos
            alpha: { start: 0.8, end: 0 },
            // Tons de vermelho
            tint: [0xff2a4d, 0xb3001b, 0xff6b81],
            // Brilho (cores somam)
            blendMode: 'ADD',
            // Só explosão
            emitting: false
        });
        // Acima do cenário
        fumaca.setDepth(20);
        // Solta as partículas
        fumaca.explode(Math.max(1, Math.round(n * this.fator)));
        // Apaga depois
        this.cena.time.delayedCall(600, () => fumaca.destroy());
    }
}
