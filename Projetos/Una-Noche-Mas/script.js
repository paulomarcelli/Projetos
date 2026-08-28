// 1. Pega todos os elementos com a classe "card" (os dois cards de compositores)
const cards = document.querySelectorAll(".card");

// 2. Cria o observador - fica de olho em quando cada card entra na tela
const observador = new IntersectionObserver(function(entradas) {
    entradas.forEach(function(entrada) {
        if (entrada.isIntersecting) {  // se o card está visível na tela
            entrada.target.classList.add("visible");  // adiciona a classe que revela ele
        }
    });
}, { threshold: 0.2 });  // só dispara quando 20% do card já estiver visível

// 3. Manda o observador vigiar cada um dos cards
cards.forEach(function(card) {
    observador.observe(card);
});


// Pega o elemento de vídeo
const videoFundo = document.querySelector("#video-background video");

// Assim que o vídeo estiver pronto para tocar, pula pro segundo desejado
videoFundo.addEventListener("loadedmetadata", function() {
    videoFundo.currentTime = 89;  // troca 15 pelo segundo que você quer que comece
});