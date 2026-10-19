/* =====================================================================
   UNA NOCHE MÁS · motion.js
   ---------------------------------------------------------------------
   JavaScript das animações. Roda depois de script.js (os dois "defer").
   Dono: Agente 3. Contrato de classes: docs/DESIGN_SYSTEM.md §5.

   O que este arquivo faz (o resto é CSS puro, em motion.css):
     1. Escalonamento: garante --i nos filhos de [data-reveal-stagger].
     2. Abertura do hero: espera a fonte do título (no máximo 700 ms)
        para a coreografia não trocar de fonte no meio.
     3. Indicador de rolagem: pausa a linha que "pinga" fora da tela.
     4. Parallax sutil em peças decorativas ([data-parallax]).
   Sem bibliotecas. Respeita "reduzir movimento", inclusive se a pessoa
   mudar a preferência com a página aberta.
   ===================================================================== */
(function () {
    "use strict";

    // Preferências do sistema. matchMedia devolve um objeto que avisa
    // quando a resposta muda (evento "change").
    var mqReduzir = window.matchMedia("(prefers-reduced-motion: reduce)");
    var mqMouse = window.matchMedia("(pointer: fine)");
    var temObservador = "IntersectionObserver" in window;


    /* -----------------------------------------------------------------
       1. ESCALONAMENTO ([data-reveal-stagger])
       Cada filho recebe --i (0, 1, 2...), limitado a 8, se o HTML ainda
       não tiver. O CSS usa --i para atrasar cada um 60 ms. Quem põe
       .is-visible no grupo é o script.js (não criamos outro observador).
       ----------------------------------------------------------------- */
    document.querySelectorAll("[data-reveal-stagger]").forEach(function (grupo) {
        Array.prototype.forEach.call(grupo.children, function (filho, indice) {
            if (!filho.style.getPropertyValue("--i")) {
                filho.style.setProperty("--i", String(Math.min(indice, 8)));
            }
        });
    });


    /* -----------------------------------------------------------------
       2. ABERTURA DO HERO: esperar a fonte
       A coreografia é CSS (roda sozinha, mesmo se este arquivo falhar).
       Se a Playfair ainda não chegou, pausamos só as animações da
       abertura (nomes "unm-hero-*") e soltamos quando a fonte carregar,
       ou depois de 700 ms, o que vier primeiro. Como elas usam
       fill-mode "backwards", as peças ficam invisíveis enquanto esperam.
       (A linha que "pinga" fica de fora: ela é controlada pelo CSS.)
       ----------------------------------------------------------------- */
    var hero = document.querySelector(".hero");

    if (hero && !mqReduzir.matches && document.fonts &&
        document.fonts.status !== "loaded" && hero.getAnimations) {

        var animacoesDaAbertura = hero.getAnimations({ subtree: true }).filter(function (animacao) {
            return typeof animacao.animationName === "string" &&
                   animacao.animationName.indexOf("unm-hero-") === 0;
        });

        animacoesDaAbertura.forEach(function (animacao) { animacao.pause(); });

        var soltar = function () {
            animacoesDaAbertura.forEach(function (animacao) {
                if (animacao.playState === "paused") animacao.play();
            });
        };

        Promise.race([
            document.fonts.ready,
            new Promise(function (resolver) { setTimeout(resolver, 700); })
        ]).then(soltar, soltar);
    }


    /* -----------------------------------------------------------------
       3. INDICADOR DE ROLAGEM: pausa fora da tela
       A linha que "pinga" é infinita. Quando o hero sai da tela, a
       classe .is-fora-da-tela pausa a animação (motion.css): zero
       trabalho para algo que ninguém está vendo.
       ----------------------------------------------------------------- */
    if (hero && temObservador) {
        new IntersectionObserver(function (entradas) {
            hero.classList.toggle("is-fora-da-tela", !entradas[0].isIntersecting);
        }).observe(hero);
    }


    /* -----------------------------------------------------------------
       4. PARALLAX ([data-parallax="fator"])
       Peças decorativas andam um pouco mais devagar que a página.
       Regras:
         - só decoração (lua, polaroids do dueto, eco do hero);
         - usamos a propriedade "translate", que não briga com o
           "rotate" (inclinação) nem com o "transform" (hover);
         - no máximo ±40 px (limite macio, com tanh);
         - IntersectionObserver liga cada peça só quando ela está perto
           da tela, e um único listener de rolagem (passivo) agenda no
           máximo um cálculo por quadro (requestAnimationFrame);
         - desligado com "reduzir movimento" e em telas de toque
           (lá a rolagem é do sistema e o parallax "treme").
       ----------------------------------------------------------------- */
    var LIMITE_PX = 40;

    // O eco repetido do hero ainda não tem data-parallax no HTML:
    // ele recebe um fator pequeno aqui (só é visível a partir de 1100 px).
    var eco = document.querySelector(".hero__eco");
    if (eco && !eco.hasAttribute("data-parallax")) {
        eco.setAttribute("data-parallax", "0.06");
    }

    var pecas = Array.prototype.map.call(document.querySelectorAll("[data-parallax]"), function (el) {
        return {
            el: el,
            fator: parseFloat(el.getAttribute("data-parallax")) || 0,
            centro: 0,      // centro da peça na página (sem contar o parallax)
            referencia: 0,  // distância em que a peça fica no lugar (0 px)
            atual: 0,       // último valor aplicado (evita escrever à toa)
            naTela: false
        };
    });

    var ligado = false;
    var quadroAgendado = false;
    var vigiaParallax = null;

    // Distância do topo da página até o elemento, somando offsetTop.
    // offsetTop ignora transform/translate/rotate, então a medida não
    // muda por causa do próprio parallax nem da animação de abertura.
    function topoNaPagina(el) {
        var topo = 0;
        while (el) {
            topo += el.offsetTop;
            el = el.offsetParent;
        }
        return topo;
    }

    function medir() {
        var meiaTela = window.innerHeight / 2;
        pecas.forEach(function (peca) {
            peca.centro = topoNaPagina(peca.el) + peca.el.offsetHeight / 2;
            // Peças que já começam acima do meio da tela (as do hero) ficam
            // paradas no carregamento e só se mexem quando a página rola.
            var distanciaInicial = peca.centro - meiaTela;
            peca.referencia = distanciaInicial < 0 ? distanciaInicial : 0;
        });
    }

    function calcular() {
        quadroAgendado = false;
        var meioDaTela = window.scrollY + window.innerHeight / 2;

        pecas.forEach(function (peca) {
            if (!peca.naTela) return;
            var distancia = peca.centro - meioDaTela;
            var y = -(distancia - peca.referencia) * peca.fator;
            // Limite "macio": tanh aproxima de ±40 px devagar, sem a peça
            // bater num teto e parar de repente.
            y = LIMITE_PX * Math.tanh(y / LIMITE_PX);
            if (Math.abs(y - peca.atual) < 0.1) return;   // nada mudou
            peca.atual = y;
            peca.el.style.translate = "0 " + y.toFixed(1) + "px";
        });
    }

    function agendar() {
        if (quadroAgendado || !ligado) return;
        quadroAgendado = true;
        window.requestAnimationFrame(calcular);
    }

    function aoRolar() {
        // só trabalha se alguma peça estiver na tela
        for (var i = 0; i < pecas.length; i++) {
            if (pecas[i].naTela) { agendar(); return; }
        }
    }

    function aoRedimensionar() {
        if (!ligado) return;
        medir();
        agendar();
    }

    function ligarParallax() {
        if (ligado || !pecas.length || !temObservador) return;
        ligado = true;
        medir();

        vigiaParallax = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                pecas.forEach(function (peca) {
                    if (peca.el === entrada.target) peca.naTela = entrada.isIntersecting;
                });
            });
            agendar();
        }, { rootMargin: "20% 0px" }); // liga um pouco antes de aparecer

        pecas.forEach(function (peca) { vigiaParallax.observe(peca.el); });
        window.addEventListener("scroll", aoRolar, { passive: true });
        window.addEventListener("resize", aoRedimensionar, { passive: true });
        // Fontes e imagens mudam a altura da página: mede de novo.
        window.addEventListener("load", aoRedimensionar);
        if (document.fonts) document.fonts.ready.then(aoRedimensionar);
    }

    function desligarParallax() {
        if (!ligado) return;
        ligado = false;
        if (vigiaParallax) vigiaParallax.disconnect();
        window.removeEventListener("scroll", aoRolar);
        window.removeEventListener("resize", aoRedimensionar);
        window.removeEventListener("load", aoRedimensionar);
        pecas.forEach(function (peca) {
            peca.naTela = false;
            peca.atual = 0;
            peca.el.style.translate = "";   // volta à posição normal
        });
    }

    function decidirParallax() {
        if (!mqReduzir.matches && mqMouse.matches) ligarParallax();
        else desligarParallax();
    }

    decidirParallax();

    // A preferência pode mudar com a página aberta (ex.: a pessoa liga
    // "reduzir movimento" no sistema). O CSS reage sozinho; o parallax,
    // que é JS, reage aqui.
    function ouvirMudanca(mq, funcao) {
        if (mq.addEventListener) mq.addEventListener("change", funcao);
        else if (mq.addListener) mq.addListener(funcao);   // Safari antigo
    }
    ouvirMudanca(mqReduzir, decidirParallax);
    ouvirMudanca(mqMouse, decidirParallax);
})();
