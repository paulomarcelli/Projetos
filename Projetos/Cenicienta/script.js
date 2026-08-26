// 1. Pega os elementos que você quer observar
const secoes = document.querySelectorAll('#sobre-karol-sevilla, #sobre-musica'); // Seleciona todas as seções com os IDs "sobre-karol-sevilla" e "sobre-musica"

// 2. Cria o "observador" - o que ele faz quando percebe uma mudança
const observador = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(entrada) {
        if (entrada.isIntersecting) {
            entrada.target.classList.add("visible");
        }
    });
}, { threshold: 0.2 });

// 3. Faz o observador começar a observar os elementos
secoes.forEach(function(secao) {
    observador.observe(secao);
});

// Seleciona o vídeo local que está dentro da área de vídeo da página.
const video = document.querySelector('#video-background video');

// Verifica se o elemento de vídeo foi encontrado antes de configurar o tempo inicial.
if (video) {
    // Define o ponto em que o vídeo deve começar: 48 segundos.
    const inicioVideo = 48;

    // Aguarda o carregamento dos metadados para que o navegador conheça a duração do vídeo.
    video.addEventListener('loadedmetadata', function() {
        video.currentTime = inicioVideo;
    });

    // Desativa o loop automático para controlar o reinício a partir dos 48 segundos.
    video.loop = false;

    // Quando o vídeo termina, volta aos 48 segundos e reproduz novamente.
    video.addEventListener('ended', function() {
        video.currentTime = inicioVideo;
        video.play();
    });
}