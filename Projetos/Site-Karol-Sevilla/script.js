const botoesMusica = document.querySelectorAll("[data-musica]");
const mensagem = document.getElementById("mensagem");
const imagemMusica = document.getElementById("imagemMusica");

botoesMusica.forEach((botao) => {
    botao.addEventListener("click", () => {
        const musica = botao.dataset.musica;
        const imagem = botao.dataset.imagem;

        mensagem.textContent = `Você escolheu ${musica}!`;
        imagemMusica.alt = `Imagem relacionada à música ${musica}`;
        imagemMusica.src = imagem;
        imagemMusica.hidden = false;
    });
});

imagemMusica.addEventListener("error", () => {
    imagemMusica.hidden = true;
    mensagem.textContent = "A música foi selecionada, mas a imagem não pôde ser carregada.";
});
