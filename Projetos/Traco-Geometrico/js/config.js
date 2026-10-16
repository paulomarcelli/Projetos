// ================================================================
// config.js — configurações gerais do jogo (carregado primeiro)
// ================================================================

// Check de acessibilidade: identifica se o usuário prefere movimentos reduzidos no sistema operacional
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// CONFIGURAÇÕES DE MOVIMENTO (valores padrão; cada fase pode sobrescrever)
const MOVIMENTO = {
    forcaPulo: 700,       // velocidade inicial do pulo pra cima
    giroNoAr: 330,        // graus por segundo que o cubo gira enquanto está no ar
    coyoteTime: 90,       // ms que ainda dá pra pular depois de sair da beirada
    jumpBuffer: 120,      // ms que um aperto feito um pouco antes de cair ainda vale
    telaX: 260,           // posição X NA TELA onde o cubo aparece (a câmera segue ele)
    chaoY: 660,           // Y do topo do chão
    tetoY: 100,           // Y da parte de baixo do teto (linha brilhante em 100)
    gravidade: 2500       // Mesma gravidade do config do Phaser
};

// TEMAS DE CORES: um por fase (usados no fundo, no chão, no fade e no HUD)
const TEMAS = {
    // Tema azul padrão (menu)
    padrao: {
        fundo: '#101a46',     // Cor de fundo da câmera
        grade: 0x7096ef,      // Cor das linhas da grade
        forma: 0x3657bc,      // Cor das formas flutuantes
        bordaForma: 0x668eff, // Borda das formas flutuantes
        faixa: 0x0a1233,      // Cor das faixas do chão e do teto
        linha: 0x68e5ee,      // Cor das linhas brilhantes
        texto: '#ecf4ff',     // Cor do texto do HUD
        fade: [16, 26, 70]    // Cor (RGB) da transição de entrada/saída
    },
    // Homem-Aranha: cidade à noite
    aranha: {
        fundo: '#0b1026', grade: 0x5b6bb5, forma: 0x1e2652, bordaForma: 0x5b6bb5,
        faixa: 0x05070f, linha: 0xff5a6e, texto: '#ffe3e7', fade: [40, 12, 40]
    },
    // Homem de Ferro: cidade futurista
    ferro: {
        fundo: '#06141f', grade: 0x29e3ff, forma: 0x0f3b52, bordaForma: 0x29e3ff,
        faixa: 0x041019, linha: 0x29e3ff, texto: '#e8f4ff', fade: [60, 30, 10]
    },
    // Hulk: cidade em ruínas
    hulk: {
        fundo: '#1a1d1a', grade: 0x8fae7a, forma: 0x3a403a, bordaForma: 0x6fdc4a,
        faixa: 0x141614, linha: 0x8fae7a, texto: '#e6f5dc', fade: [26, 29, 26]
    },
    // Gavião Arqueiro: base de segurança
    gaviao: {
        fundo: '#120f1f', grade: 0x8c5cff, forma: 0x1f1a33, bordaForma: 0x8c5cff,
        faixa: 0x0b0914, linha: 0x8c5cff, texto: '#e2d6ff', fade: [30, 20, 60]
    },
    // Doutor Estranho: dimensão normal
    estranho: {
        fundo: '#0d0b1e', grade: 0x6b5cff, forma: 0x2a2060, bordaForma: 0xffa53d,
        faixa: 0x07061a, linha: 0xffa53d, texto: '#fff1dc', fade: [60, 30, 10]
    },
    // Doutor Estranho: dimensão espelhada
    espelho: {
        fundo: '#170a26', grade: 0xb46bff, forma: 0x4b1d6b, bordaForma: 0xff7ad9,
        faixa: 0x0a0414, linha: 0xff7ad9, texto: '#ffe0f6', fade: [60, 10, 60]
    },
    // Wanda: realidade carmesim
    wanda: {
        fundo: '#0d0205', grade: 0x6b0f1f, forma: 0x3a0812, bordaForma: 0x8a1530,
        faixa: 0x070103, linha: 0xb3122e, texto: '#ffd6dd', fade: [60, 0, 12]
    }
};

// CONFIGURAÇÃO DE CADA FASE (velocidade de corrida, comprimento até a chegada, tema)
const CONFIG_FASES = {
    'Hulk':           { nome: 'HULK',            tema: 'hulk',     velocidade: 450, comprimento: 21100, bpm: 128, raiz: 55,  dificuldade: 'Normal' },
    'Homem de Ferro': { nome: 'HOMEM DE FERRO',  tema: 'ferro',    velocidade: 540, comprimento: 21800, bpm: 140, raiz: 73.4, dificuldade: 'Difícil' },
    'Gaviao':         { nome: 'GAVIÃO ARQUEIRO', tema: 'gaviao',   velocidade: 400, comprimento: 21000, bpm: 120, raiz: 61.7, dificuldade: 'Normal' },
    'Homem-Aranha':   { nome: 'HOMEM-ARANHA',    tema: 'aranha',   velocidade: 420, comprimento: 15000, bpm: 132, raiz: 65.4, dificuldade: 'Fácil' },
    'DrEstranho':     { nome: 'DOUTOR ESTRANHO', tema: 'estranho', velocidade: 470, comprimento: 20600, bpm: 124, raiz: 58.3, dificuldade: 'Difícil' },
    'Wanda':          { nome: 'WANDA MAXIMOFF',  tema: 'wanda',    velocidade: 470, comprimento: 16200, bpm: 136, raiz: 51.9, dificuldade: 'Insano' }
};

// MODO DE TESTE (usado só pelos testes automáticos: deixa o cubo invencível)
const MODO_TESTE = { invencivel: false, semAbertura: false };

// INFORMAÇÕES DOS HERÓIS (painel "Heróis" do menu e cartões da seleção)
const HEROIS_INFO = {
    'Homem-Aranha':   { habilidade: 'Teia: segure no ar pra balançar; E = puxão', cor: '#ff5a6e' },
    'Homem de Ferro': { habilidade: 'Voo: segure pra subir; E = repulsor', cor: '#ffc23d' },
    'Hulk':           { habilidade: 'Fúria: cresce e atravessa o que quebra (E)', cor: '#6fdc4a' },
    'Gaviao':         { habilidade: 'Arco: E ou clique acerta alvos e abre caminho', cor: '#a77bff' },
    'DrEstranho':     { habilidade: 'Portais (Q), dimensão espelho e Joia do Tempo (E)', cor: '#3dff8a' },
    'Wanda':          { habilidade: 'Realidade: E troca entre vermelha ◆ e azul ●', cor: '#ff2a4d' }
};

// Ícone e estrelas de cada dificuldade (desenho próprio, sem assets de outros jogos)
const DIFICULDADES = {
    'Fácil':   { estrelas: 2, cor: '#3ad1ff' },
    'Normal':  { estrelas: 3, cor: '#3dff8a' },
    'Difícil': { estrelas: 5, cor: '#ffd400' },
    'Insano':  { estrelas: 8, cor: '#ff4d6d' }
};

// CORES POR SEÇÃO (como os "gatilhos de cor" dos jogos de ritmo): a cada checkpoint o cenário
// muda de tom suavemente. Uma cor por trecho: início, depois do 1º, 2º, 3º (e 4º) checkpoint.
const CORES_SECOES = {
    'Homem-Aranha':   [0x1f3a93, 0x6a1b9a, 0xb3122e, 0x0b6e8a],
    'Homem de Ferro': [0x8f1219, 0xb8860b, 0x0b6e8a, 0xff7b00],
    'Hulk':           [0x2f7d1f, 0x6a8f12, 0x5a1f8f, 0x0f8f6a, 0x8f1f3a],
    'Gaviao':         [0x4b2a7a, 0x1f5f8f, 0x8f2a4b, 0x2a8f5f, 0x6a2a8f],
    'DrEstranho':     [0x1d2a6b, 0x6b3a0a, 0x0a6b4a, 0x5a0a6b],
    'Wanda':          [0x4a0716, 0x7a0a2a, 0x2a0a4a, 0x8a0f1f]
};

// ABERTURA NO RITMO de cada fase (um símbolo por batida; legenda em criarAbertura no fase.js)
// Cada herói tem uma mistura diferente de obstáculos clássicos
const ABERTURAS = {
    'Hulk':         '^.^.2..B.S.._P.O.',
    'Gaviao':       '^.m.^..2..p.D..O.',
    'DrEstranho':   '^..3..D.._o..O.',
    'Wanda':        '^.2..m.p.._.O.',
    'Homem-Aranha': '^..S..2.._P.O.'
};
