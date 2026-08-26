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