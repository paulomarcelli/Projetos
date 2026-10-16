// ================================================================
// obstaculos.js — classe base Obstaculo + obstáculos comuns a várias fases
// (os obstáculos exclusivos de cada herói ficam no arquivo da fase dele)
// ================================================================

// CLASSE BASE: Obstaculo
// Todo obstáculo tem uma forma (shape do Phaser), uma categoria e pode reagir a golpe, tiro, toque ou ligação.
//   categoria 'solido'    → dá pra pisar em cima; bater de lado mata (na maioria das fases)
//   categoria 'mortal'    → encostar mata
//   categoria 'gatilho'   → encostar chama aoTocar() (portal, aljava, aviso...)
//   categoria 'decoracao' → só visual, sem física
class Obstaculo {
    constructor(fase, forma, categoria, id = null) {
        // Fase dona do obstáculo
        this.fase = fase;
        // Forma desenhada (retângulo, triângulo, círculo...)
        this.forma = forma;
        // A forma guarda referência de volta pro obstáculo (útil nas colisões)
        forma.obstaculo = this;
        // Categoria (define o grupo de física)
        this.categoria = categoria;
        // Identificador usado nas ligações (alvo 'a1' abre porta 'p1')
        this.id = id;
        // Ainda existe no jogo?
        this.ativo = true;
        // A fase coloca no grupo certo e na lista de obstáculos
        fase.registrar(this);
    }

    // Atualização por frame (dt já vem escalado pela Joia do Tempo); obstáculos que se movem sobrescrevem
    atualizar(dt, agora) {}

    // Reação a golpe/flecha/repulsor; retorna true se reagiu (as subclasses sobrescrevem)
    aoAcertar(dano, tipo) { return false; }

    // Chamado quando o jogador encosta (só gatilhos)
    aoTocar() {}

    // Chamado por uma ligação (ex.: alvo acertado aciona esta porta)
    acionar() {}

    // Liga/desliga a física do obstáculo
    ligarFisica(ligado) {
        // Só se tiver corpo
        if (this.forma.body) this.forma.body.enable = ligado;
    }

    // Remove o obstáculo do jogo
    destruir() {
        // Já destruído? ignora
        if (!this.ativo) return;
        // Marca como inativo
        this.ativo = false;
        // Desliga a física (apagar no meio da colisão dá erro; a fase apaga depois)
        this.ligarFisica(false);
        // Esconde a forma
        this.forma.setVisible(false);
        // Pede pra fase apagar no próximo frame
        this.fase.paraApagar.push(this);
    }
}

// BLOCO: retângulo sólido (x = borda esquerda, yTopo = topo)
class Bloco extends Obstaculo {
    constructor(fase, x, yTopo, largura, altura, cor, borda, id = null) {
        // Cria o retângulo com centro calculado a partir da borda esquerda e do topo
        const forma = fase.cena.add.rectangle(x + largura / 2, yTopo + altura / 2, largura, altura, cor)
            .setStrokeStyle(2, borda);
        // Chama a base como sólido
        super(fase, forma, 'solido', id);
    }
}

// PLATAFORMA: sólida só por cima (dá pra subir por baixo, atravessando)
class Plataforma extends Bloco {
    constructor(fase, x, yTopo, largura, cor, borda, id = null) {
        // Plataforma fina de 16 px
        super(fase, x, yTopo, largura, 16, cor, borda, id);
        // Só colide por cima (one-way)
        this.forma.body.checkCollision.down = false;
        // Não colide pelos lados
        this.forma.body.checkCollision.left = false;
        // Não colide pelos lados
        this.forma.body.checkCollision.right = false;
        // Avisa a fase pra não matar ao "bater de lado"
        this.semMorteLateral = true;
    }
}

// ESPINHO: triângulo que mata; noTeto = pendurado apontando pra baixo
class Espinho extends Obstaculo {
    constructor(fase, x, noTeto = false, cor = 0xff5d7a, borda = 0xffc2cd, yBase = null) {
        // Y do centro: encostado no chão ou no teto (ou numa base informada)
        const y = yBase !== null ? yBase - 20 : (noTeto ? MOVIMENTO.tetoY + 20 : MOVIMENTO.chaoY - 20);
        // Pontas do triângulo: pra cima (chão) ou pra baixo (teto)
        const pontos = noTeto ? [0, 0, 40, 0, 20, 40] : [0, 40, 20, 0, 40, 40];
        // Triângulo 40x40 com centro em (x+20, y)
        const forma = fase.cena.add.triangle(x + 20, y, ...pontos, cor).setStrokeStyle(2, borda);
        // Chama a base como mortal
        super(fase, forma, 'mortal');
        // Hitbox menor que o desenho (mais justo pro jogador)
        forma.body.setSize(14, 22, false).setOffset(13, noTeto ? 2 : 16);
    }
}

// DICA: texto de tutorial no mundo, que aparece quando o jogador chega perto
class Dica extends Obstaculo {
    constructor(fase, x, texto) {
        // Texto flutuando no meio da área de jogo
        const forma = fase.cena.add.text(x, 180, texto, {
            fontFamily: 'Arial, sans-serif',          // Fonte
            fontSize: '24px',                         // Tamanho
            fontStyle: 'bold',                        // Negrito
            color: fase.tema.texto,                   // Cor do tema
            stroke: '#000000',                        // Contorno preto
            strokeThickness: 5,                       // Espessura do contorno
            align: 'center'                           // Centralizado
        }).setOrigin(0, 0.5).setAlpha(0).setDepth(30);
        // Chama a base como decoração (sem física)
        super(fase, forma, 'decoracao');
    }

    // Aparece quando entra na tela e some depois que passou
    atualizar(dt) {
        // Distância do texto até o jogador
        const dx = this.forma.x - this.fase.player.x;
        // Visível enquanto está entre 900 px à frente e 300 px atrás
        const alvo = (dx < 900 && dx > -300) ? 1 : 0;
        // Aproxima o alpha suavemente
        this.forma.alpha += (alvo - this.forma.alpha) * 0.1;
    }
}

// LINHA DE CHEGADA: faixa quadriculada do chão ao teto
class LinhaChegada extends Obstaculo {
    constructor(fase, x) {
        // Graphics pra desenhar o quadriculado
        const g = fase.cena.add.graphics();
        // Quadrados de 12 px, 2 colunas
        for (let yy = MOVIMENTO.tetoY; yy < MOVIMENTO.chaoY; yy += 12) {
            // Duas colunas alternando branco e preto
            for (let c = 0; c < 2; c++) {
                // Alterna a cor
                g.fillStyle(((yy / 12) + c) % 2 === 0 ? 0xffffff : 0x111111, 0.9);
                // Desenha o quadradinho
                g.fillRect(x + c * 12, yy, 12, 12);
            }
        }
        // Chama a base como decoração (a fase confere a chegada pelo x do jogador)
        super(fase, g, 'decoracao');
    }
}
