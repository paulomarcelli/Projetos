// ================================================================
// main.js — configuração e inicialização do Phaser (carregado por último)
// Os outros arquivos ficam na pasta js/ (veja a ordem no index.html).
// ================================================================

// CONFIGURAÇÃO E INICIALIZAÇÃO DO PHASER
const config = {
    type: Phaser.AUTO,
    parent: 'game-canvas',
    width: 1280,
    height: 720,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: MOVIMENTO.gravidade },
            debug: false
        }
    },
    // Menu primeiro; a cena 'Game' recebe o herói e cria a fase dele
    scene: [MenuScene, GameScene]
};

// Instancia e inicia o motor do Phaser (window.jogo deixa os testes acessarem o jogo)
window.jogo = new Phaser.Game(config);
