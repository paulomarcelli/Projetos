console.log("Ola Karol Sevilla!"); // Mostra uma mensagem no console

// Pegando as músicas pelo ID
const Mariposas = document.getElementById("Mariposas"); // Pega a música Mariposas pelo ID
const MasLinda = document.getElementById("Mas-Linda"); // Pega a música Mas Linda pelo ID
const OtroMood = document.getElementById("Otro-Mood"); // Pega a música Otro Mood pelo ID
const UnaNocheMas = document.getElementById("Una-noche-mas"); // Pega a música Una noche mas pelo ID

// Pegando mensagem e imagem
const mensagem = document.getElementById("mensagem"); // Pega a mensagem pelo ID
const imagemMusica = document.getElementById("imagemMusica"); // Pega a imagem da música pelo ID


// Mariposas
Mariposas.addEventListener("click", function() { // Cria um evento quando clicar em Mariposas
    console.log("Você clicou em Mariposas!"); // Mostra uma mensagem no console
    mensagem.textContent = "Você escolheu Mariposas!"; // Mostra a música escolhida na página
    imagemMusica.src = "https://static.wikia.nocookie.net/soyluna/images/5/58/VaRAlbum1.jpg/revision/latest?cb=20260714131735"; // Define a imagem de Mariposas
    imagemMusica.style.display = "block"; // Mostra a imagem da música
});


// Mas Linda
MasLinda.addEventListener("click", function() { // Cria um evento quando clicar em Mas Linda
    console.log("Você clicou em Mas Linda!"); // Mostra uma mensagem no console
    mensagem.textContent = "Você escolheu Mas Linda!"; // Mostra a música escolhida na página
    imagemMusica.src = "https://static.wikia.nocookie.net/soyluna/images/5/58/VaRAlbum1.jpg/revision/latest?cb=20260714131735"; // Define a imagem de Mas Linda
    imagemMusica.style.display = "block"; // Mostra a imagem da música
});


// Otro Mood
OtroMood.addEventListener("click", function() { // Cria um evento quando clicar em Otro Mood
    console.log("Você clicou em Otro Mood!"); // Mostra uma mensagem no console
    mensagem.textContent = "Você escolheu Otro Mood!"; // Mostra a música escolhida na página
    imagemMusica.src = "https://i.scdn.co/image/ab67616d0000b27357170d220209e59f8f03ae77"; // Define a imagem de Otro Mood
    imagemMusica.style.display = "block"; // Mostra a imagem da música
});


// Una Noche Mas
UnaNocheMas.addEventListener("click", function() { // Cria um evento quando clicar em Una noche mas
    console.log("Você clicou em Una noche mas!"); // Mostra uma mensagem no console
    mensagem.textContent = "Você escolheu Una noche mas!"; // Mostra a música escolhida na página
    imagemMusica.src = "https://i.scdn.co/image/ab67616d0000b273ebf2fb016fea94ae8ecb252a"; // Define a imagem de Una noche mas
    imagemMusica.style.display = "block"; // Mostra a imagem de Una noche mas
});