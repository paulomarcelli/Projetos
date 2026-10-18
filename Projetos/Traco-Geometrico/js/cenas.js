// ================================================================
// cenas.js — cenas do Phaser: fundo compartilhado, Menu e Game
// ================================================================

// Liga o nome do herói (data-level do HTML) à classe da fase dele (polimorfismo: todas são Fase)
const FASES = {
    'Homem-Aranha':   FaseAranha,
    'Homem de Ferro': FaseFerro,
    'Hulk':           FaseHulk,
    'Gaviao':         FaseGaviao,
    'DrEstranho':     FaseEstranho,
    'Wanda':          FaseWanda
};

// CENA BASE: GeometricScene
// Cenário compartilhado que provê o fundo e elementos visuais reutilizáveis.
class GeometricScene extends Phaser.Scene {

    // Constrói o fundo do jogo com cor sólida, grade vetorial, formas flutuantes animadas e o chão visual base.
    // tema = conjunto de cores (TEMAS.padrao se não passar nada)
    createBackdrop(tema = TEMAS.padrao) {
        // Define a cor de fundo da câmera
        this.cameras.main.setBackgroundColor(tema.fundo);

        // Desenha a grade de linhas de fundo
        const grid = this.add.graphics();
        grid.lineStyle(1, tema.grade, 0.08);
        for (let x = 0; x <= 1280; x += 80) grid.lineBetween(x, 0, x, 720);
        for (let y = 0; y <= 720; y += 80) grid.lineBetween(0, y, 1280, y);

        // Renderiza retângulos flutuantes no cenário com animação tween suave
        const floatingShapes = [
          [100, 220, 76],
          [1150, 180, 110],
          [250, 460, 44],
          [1040, 440, 58]
        ];

        floatingShapes.forEach(([x, y, size], i) => {
            const shape = this.add
            .rectangle(x, y, size, size, tema.forma, 0.12)
            .setStrokeStyle(2, tema.bordaForma, 0.25)
            .setAngle(15 + i * 12);

            // Anima apenas se a preferência de movimento reduzido não estiver ativa
            if (!reducedMotion.matches) {
                this.tweens.add({
                    targets: shape,
                    y: y - 24,
                    angle: shape.angle + 20,
                    duration: 3200 + i * 600,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.InOut'
                });
            }
        });

        // Faixa e linha brilhante que formam a estética do chão no fundo
        this.add.rectangle(640, 690, 1280, 60, tema.faixa);
        this.add.rectangle(640, 661, 1280, 2, tema.linha, 0.8);

        // Faixa e linha brilhante do teto
        this.add.rectangle(640, 50, 1280, 100, tema.faixa);
        this.add.rectangle(640, 100, 1280, 2, tema.linha, 0.8);
    }
}

// CENA 1: MenuScene
// Gerencia a interface do menu principal e a transição para o jogo.
class MenuScene extends GeometricScene {
    constructor() {
        super('Menu');
    }

    // Recebe dados (abrirSelecao = true quando volta da tela de conclusão)
    init(data) {
        // Guarda se deve abrir direto a seleção de fases
        this.abrirSelecao = !!(data && data.abrirSelecao);
    }

    create() {
        // Desenha o cenário de fundo estático/animado
        this.createBackdrop();
        this.starting = false;
        // Cor do fundo do menu muda devagar (azul → roxo → magenta → verde-azulado), como nos jogos de ritmo
        const cores = [0x2f5bd1, 0x7a2fd1, 0xd12f8a, 0x1fa58f];
        const veu = this.add.rectangle(640, 360, 1280, 720, cores[0], 0.22).setDepth(1);
        const contador = { t: 0 };
        if (!reducedMotion.matches) this.tweens.add({ targets: contador, t: cores.length, duration: 16000, repeat: -1, onUpdate: () => {
            // Duas cores vizinhas e quanto falta de uma pra outra
            const i = Math.floor(contador.t) % cores.length, f = contador.t % 1;
            const a = Phaser.Display.Color.IntegerToColor(cores[i]), b = Phaser.Display.Color.IntegerToColor(cores[(i + 1) % cores.length]);
            const m = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, Math.round(f * 100));
            veu.setFillStyle(Phaser.Display.Color.GetColor(m.r, m.g, m.b), 0.22);
        } });

        // Acessa e prepara os elementos de UI do DOM (HTML)
        const menu = document.getElementById('menu');
        const play = document.getElementById('play-button');
        const levelSelect = document.getElementById('level-select');
        const levelButtons = document.querySelectorAll('.level-btn');
        const backBtn = document.getElementById('back-button');

        // Reseta o estado inicial (caso o jogador tenha morrido e voltado pro menu)
        menu.hidden = false;
        menu.classList.remove('is-leaving');
        menu.inert = false;
        play.disabled = false;
        levelSelect.hidden = true;
        levelSelect.style.opacity = "1";
        backBtn.hidden = true;
        document.getElementById('ability-button').hidden = true;
        document.getElementById('fase-concluida').hidden = true;
        document.getElementById('menu-status').innerHTML = 'ou pressione <kbd>Enter</kbd>';
        // Marca as fases já concluídas (✓ nos botões) e preenche dificuldade/progresso dos cartões
        Progresso.marcarBotoes(); Progresso.preencherCartoes();

        // CARROSSEL DA SELEÇÃO: um cartão por vez, setas e bolinhas
        const pontos = document.getElementById('sel-pontos');
        const setaAnt = document.getElementById('sel-ant'), setaProx = document.getElementById('sel-prox');
        // Fase aparecendo (lembra a última escolhida enquanto o jogo está aberto)
        this.indice = MenuScene.ultimoIndice || 0;
        // Bolinhas (uma por fase)
        pontos.innerHTML = '';
        levelButtons.forEach((btn, i) => { const d = document.createElement('i'); d.addEventListener('click', () => mostrar(i)); pontos.appendChild(d); });
        // Mostra o cartão i (com volta: depois do último vem o primeiro)
        const mostrar = (i, foco = true) => {
            // Índice dentro do intervalo
            this.indice = (i + levelButtons.length) % levelButtons.length;
            // Liga só o cartão atual
            levelButtons.forEach((btn, k) => btn.classList.toggle('ativa', k === this.indice));
            // Bolinha atual
            [...pontos.children].forEach((d, k) => d.classList.toggle('ativa', k === this.indice));
            // Lembra
            MenuScene.ultimoIndice = this.indice;
            // Foco no cartão (Enter joga)
            if (foco && !levelSelect.hidden) levelButtons[this.indice].focus({ preventScroll: true });
        };
        // Setas
        const anterior = () => { som.tocar('clique'); mostrar(this.indice - 1); };
        const proxima = () => { som.tocar('clique'); mostrar(this.indice + 1); };
        setaAnt.addEventListener('click', anterior); setaProx.addEventListener('click', proxima);
        // Teclado ← →
        const onEsq = () => { if (!levelSelect.hidden && !this.starting) anterior(); };
        const onDir = () => { if (!levelSelect.hidden && !this.starting) proxima(); };
        this.input.keyboard.on('keydown-LEFT', onEsq); this.input.keyboard.on('keydown-RIGHT', onDir);
        // Começa no cartão lembrado
        mostrar(this.indice, false);

        // PAINÉIS (Heróis e Como jogar)
        const painelHerois = document.getElementById('painel-herois'), painelAjuda = document.getElementById('painel-ajuda');
        // Lista de heróis (gerada a partir do config.js, na ordem da seleção)
        document.getElementById('lista-herois').innerHTML = [...levelButtons].map((btn) => {
            const h = btn.getAttribute('data-level'), cfg = CONFIG_FASES[h], info = HEROIS_INFO[h];
            return `<div class="heroi-item" style="--cor:${info.cor}"><i class="heroi-cubo"></i><b>${cfg.nome}</b><span>${info.habilidade}</span></div>`;
        }).join('');
        // Abre um painel (esconde o menu)
        const abrirPainel = (painel) => { som.tocar('clique'); menu.hidden = true; painel.hidden = false; painel.querySelector('.painel-fechar').focus({ preventScroll: true }); };
        // Fecha qualquer painel aberto
        const fecharPaineis = () => { if (painelHerois.hidden && painelAjuda.hidden) return false; painelHerois.hidden = true; painelAjuda.hidden = true; menu.hidden = false; play.focus({ preventScroll: true }); return true; };
        const abrirHerois = () => abrirPainel(painelHerois), abrirAjuda = () => abrirPainel(painelAjuda);
        document.getElementById('herois-button').addEventListener('click', abrirHerois);
        document.getElementById('ajuda-button').addEventListener('click', abrirAjuda);
        const fechadores = document.querySelectorAll('.painel-fechar');
        fechadores.forEach((b) => b.addEventListener('click', fecharPaineis));
        painelHerois.hidden = true; painelAjuda.hidden = true;

        // Botão de som do canto
        const botaoSom = document.getElementById('som-button');
        const textoSom = () => { botaoSom.textContent = som.mudo ? 'SOM: OFF' : 'SOM: ON'; botaoSom.classList.toggle('mudo', som.mudo); };
        const alternarSom = () => { som.alternarMudo(); textoSom(); };
        botaoSom.addEventListener('click', alternarSom); textoSom(); botaoSom.hidden = false;

        // Botão "Jogar" abre a seleção de fases
        const OpenLevelSelect = () => {
            menu.hidden = true;
            levelSelect.hidden = false;
            backBtn.hidden = false;
            // Som de clique
            som.tocar('clique');
            // Atualiza os cartões e foca o atual (Enter joga).
            // setTimeout: espera o Enter que abriu a seleção terminar; senão esse mesmo Enter "aperta" o botão focado
            Progresso.preencherCartoes();
            setTimeout(() => mostrar(this.indice), 0);
        }

        // Botão de voltar (da seleção de fases para o menu principal)
        const CloseLevelSelect = () => {
            if (this.starting) return;
            levelSelect.hidden = true;
            backBtn.hidden = true;
            menu.hidden = false;
            play.focus({ preventScroll: true });
        }

        // Enter no menu principal abre a seleção (o texto do menu promete isso)
        const onEnter = () => {
            // Só funciona se o menu principal estiver aparecendo
            if (!menu.hidden) OpenLevelSelect();
        };

        // ESC na seleção de fases volta pro menu principal
        const onEsc = () => {
            // Painel aberto: fecha ele
            if (fecharPaineis()) return;
            // Só funciona se a seleção estiver aparecendo
            if (!levelSelect.hidden) CloseLevelSelect();
        };

        // Inicia o jogo ao clicar em uma fase
        const StartLevel = (event) => {
            if (this.starting) return;
            this.starting = true;

            // currentTarget = o botão (target poderia ser o <small> de dentro)
            const heroName = event.currentTarget.getAttribute('data-level');
            // Som de clique
            som.tocar('clique');

            // Animação de saída da tela de seleção
            levelSelect.style.opacity = "0";
            backBtn.hidden = true;

            const duration = reducedMotion.matches ? 0 : 480;

            // Cor da transição vem do tema da fase
            const [r, g, b] = TEMAS[CONFIG_FASES[heroName].tema].fade;

            if (duration) {
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: 1.08,
                    duration,
                    ease: 'Cubic.In'
                });
                this.cameras.main.fadeOut(duration, r, g, b);
            }

            // Transita para a cena "Game" enviando o nome do herói
            this.time.delayedCall(duration, () => {
                levelSelect.hidden = true;
                this.scene.start('Game', { hero: heroName, tentativa: 1 } );
            });
        };

        // Listeners de eventos para os botões do menu e seleção de fases
        play.addEventListener('click', OpenLevelSelect);
        backBtn.addEventListener('click', CloseLevelSelect);
        this.input.keyboard.on('keydown-ENTER', onEnter);
        this.input.keyboard.on('keydown-ESC', onEsc);

        levelButtons.forEach(btn => {
            btn.addEventListener('click', StartLevel);
        });

        // Limpeza de listeners ao encerrar/mudar esta cena
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            play.removeEventListener('click', OpenLevelSelect);
            backBtn.removeEventListener('click', CloseLevelSelect);
            this.input.keyboard.off('keydown-ENTER', onEnter);
            this.input.keyboard.off('keydown-ESC', onEsc);
            // Carrossel, painéis e som
            setaAnt.removeEventListener('click', anterior); setaProx.removeEventListener('click', proxima);
            this.input.keyboard.off('keydown-LEFT', onEsq); this.input.keyboard.off('keydown-RIGHT', onDir);
            document.getElementById('herois-button').removeEventListener('click', abrirHerois);
            document.getElementById('ajuda-button').removeEventListener('click', abrirAjuda);
            fechadores.forEach((b) => b.removeEventListener('click', fecharPaineis));
            botaoSom.removeEventListener('click', alternarSom); botaoSom.hidden = true;
            painelHerois.hidden = true; painelAjuda.hidden = true;

            levelButtons.forEach(btn => {
                btn.removeEventListener('click', StartLevel);
            });
        });

        // Voltando da tela de conclusão: abre a seleção direto
        if (this.abrirSelecao) OpenLevelSelect();
        // Senão, foco no botão Jogar
        else play.focus({ preventScroll: true });
    }
}

// CENA 2: GameScene ('Game')
// Só cria a fase certa e repassa o update — toda a lógica fica nas classes de Fase.
class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    // Recebe o herói, a tentativa e o checkpoint (se houver)
    init(data) {
        // Herói escolhido (se vier inválido, usa o Hulk)
        this.heroi = FASES[data.hero] ? data.hero : 'Hulk';
        // Número da tentativa (começa em 1)
        this.tentativa = data.tentativa || 1;
        // Checkpoint pra reaparecer ({ indice, tempo }); sem ele, a fase começa do zero
        this.checkpointSalvo = data.checkpoint || null;
        // Modo prática ({ diamantes: [...] }) ou null = partida normal
        this.pratica = data.pratica || null;
    }

    // Carrega só a arte de fundo do herói desta fase (CENARIOS_IMAGEM); sem ela, a fase usa o cenário procedural.
    // Em file:// o WebGL recusa imagens de arquivo local, então só carrega por http(s) ou se vier embutida
    // (window.DADOS_ASSETS, usado pela página de teste). Prefixo opcional: window.BASE_ASSETS.
    preload() {
        const def = (typeof CENARIOS_IMAGEM !== 'undefined') && CENARIOS_IMAGEM[this.heroi];
        const chave = 'cena-' + this.heroi;
        if (!def || this.textures.exists(chave)) return;
        const embutida = window.DADOS_ASSETS && window.DADOS_ASSETS[def.arquivo];
        if (!embutida && location.protocol === 'file:') return;
        this.load.image(chave, embutida || (window.BASE_ASSETS || '') + def.arquivo);
    }

    create() {
        // Garante que a física volta a rodar (ela é pausada quando o jogador morre)
        this.physics.resume();
        // Garante que as telas do menu estão escondidas (não podem ficar por cima do jogo)
        document.getElementById('menu').hidden = true;
        document.getElementById('level-select').hidden = true;
        document.getElementById('fase-concluida').hidden = true;
        // Pega a classe da fase pelo herói
        const ClasseFase = FASES[this.heroi];
        // Cria a fase (FaseHulk, FaseFerro...) — polimorfismo
        this.fase = new ClasseFase(this, this.heroi, this.tentativa);
        // Monta a fase (método template)
        this.fase.criar();
    }

    // Roda todo frame (Phaser chama sozinho)
    update(time, delta) {
        // Repassa pra fase
        this.fase.atualizar(time, delta);
    }
}
