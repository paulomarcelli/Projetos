// ===== ABERTURA DE BOAS-VINDAS DA LUNA MIND =====
// Animação de entrada feita só com CSS (opacity/transform); aqui ficam o tempo e o encerramento.
// - Aparece uma vez por sessão do navegador (sessionStorage: some ao fechar a aba; nada pessoal é guardado).
// - Toque, clique, Esc, Enter ou "Pular" encerram na hora.
// - Com "reduzir movimento" no sistema, vira um fade curto, sem deslocamentos.
(() => {
    "use strict";
    const raiz = document.documentElement;
    const intro = document.getElementById("intro");
    if (!intro) return;
    if (!raiz.classList.contains("intro-ativa")) { intro.remove(); return; }

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || raiz.classList.contains("menos-animacao");
    const DURACAO = reduzir ? 2200 : 4600;                       // tempo da abertura antes de sair sozinha
    let saindo = false;

    function encerrar() {
        if (saindo) return;
        saindo = true;
        try { sessionStorage.setItem("luna.intro", "1"); } catch (e) { /* modo privado: tudo bem */ }
        intro.classList.add("intro--saindo");
        raiz.classList.add("intro-saindo");                      // a interface aparece enquanto a intro some
        setTimeout(() => {
            raiz.classList.remove("intro-ativa", "intro-saindo");
            intro.remove();
        }, reduzir ? 250 : 750);
    }

    const relogio = setTimeout(encerrar, DURACAO);
    const pular = () => { clearTimeout(relogio); encerrar(); };
    intro.addEventListener("click", pular);
    document.addEventListener("keydown", function tecla(e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.removeEventListener("keydown", tecla);
            pular();
        }
    });
})();
