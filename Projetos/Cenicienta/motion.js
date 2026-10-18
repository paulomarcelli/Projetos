// =====================================================================
// motion.js — MOVIMENTO (Agente 3)
// ---------------------------------------------------------------------
// Aqui vai o JavaScript das animações (por exemplo, numerar os filhos de
// [data-reveal-stagger] com a variável --i). Roda depois do script.js
// (os dois usam "defer" no index.html).
//
// O QUE ESTE ARQUIVO FAZ (o resto é CSS puro, no motion.css):
//   1. Acompanha a preferência "reduzir movimento" do sistema, ao vivo.
//   2. Numera filhos (--i) para as entradas em sequência (stagger).
//   3. Numera mensagens novas do mural que chegam juntas.
//   4. "Chacoalha" o campo do formulário quando ele fica inválido.
//   5. Cria a purpurina de meia-noite no hero (e pausa quando não aparece).
//   6. Inclina a capa da música seguindo o mouse.
//
// IMPORTANTE: a revelação ao rolar (.is-visible) já é feita pelo script.js.
// Aqui NÃO criamos outro observador para isso; só completamos o que falta.
// Tudo fica dentro de uma função "embrulho" (IIFE) para as variáveis daqui
// não se misturarem com as do script.js.
// =====================================================================
(function () {
    'use strict';

    // Quantos itens, no máximo, entram "um depois do outro".
    // Do 8º em diante, todos entram juntos (senão a lista demora demais).
    const MAX_STAGGER = 8;

    // matchMedia "pergunta" ao navegador se a media query vale agora,
    // e avisa (evento "change") quando a pessoa muda a configuração.
    const pedeMenosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    function reduzMovimento() {
        return pedeMenosMovimento.matches;
    }


    // -----------------------------------------------------------------
    // 1. Preferência "reduzir movimento" — aplicada e acompanhada ao vivo
    // -----------------------------------------------------------------
    // html.reduz-movimento é um "espelho" da media query (está no contrato).
    // A fonte da verdade continua sendo o @media do CSS.
    function aplicarPreferencia() {
        document.documentElement.classList.toggle('reduz-movimento', reduzMovimento());

        if (reduzMovimento()) {
            removerPurpurina();
        } else {
            criarPurpurina();
        }
    }

    // addEventListener('change') é o jeito novo; addListener é o antigo (Safari < 14).
    if (pedeMenosMovimento.addEventListener) {
        pedeMenosMovimento.addEventListener('change', aplicarPreferencia);
    } else if (pedeMenosMovimento.addListener) {
        pedeMenosMovimento.addListener(aplicarPreferencia);
    }


    // -----------------------------------------------------------------
    // 2. Numerar filhos para o stagger (--i = 0, 1, 2...)
    // -----------------------------------------------------------------
    // O CSS usa --i para calcular o atraso de cada filho: --i × 60ms.
    function numerarFilhos(pai) {
        Array.prototype.forEach.call(pai.children, function (filho, indice) {
            filho.style.setProperty('--i', Math.min(indice, MAX_STAGGER - 1));
        });
    }

    // O mural também entra em sequência quando aparece na tela
    // (se já tiver mensagens salvas). Marcamos a lista daqui do JS.
    const listaMensagens = document.getElementById('lista-mensagens');
    if (listaMensagens) {
        listaMensagens.setAttribute('data-reveal-stagger', '');
    }

    document.querySelectorAll('[data-reveal-stagger]').forEach(numerarFilhos);

    // Links do menu do celular: entram em sequência quando o menu abre.
    const menu = document.getElementById('menu-principal');
    if (menu) {
        numerarFilhos(menu);
    }


    // -----------------------------------------------------------------
    // 3. Mensagens novas no mural
    // -----------------------------------------------------------------
    // MutationObserver = um "vigia" que avisa quando algo muda dentro de um elemento.
    // Aqui ele avisa quando entram itens novos na lista. Se chegarem vários
    // de uma vez, cada um ganha seu --i (0, 1, 2...) e eles entram em sequência.
    // A animação em si é do CSS (.mensagem.is-new no motion.css).
    if (listaMensagens && 'MutationObserver' in window) {
        const vigiaMural = new MutationObserver(function (mudancas) {
            let posicao = 0;
            mudancas.forEach(function (mudanca) {
                mudanca.addedNodes.forEach(function (no) {
                    if (no.nodeType !== 1) {
                        return; // ignora textos/espaços; só elementos (<li>) interessam
                    }
                    no.style.setProperty('--i', Math.min(posicao, MAX_STAGGER - 1));
                    posicao = posicao + 1;
                });
            });
        });
        vigiaMural.observe(listaMensagens, { childList: true });
    }


    // -----------------------------------------------------------------
    // 4. "Chacoalhar" o campo inválido (uma vez só, menos de 300ms)
    // -----------------------------------------------------------------
    // Usamos a Web Animations API (elemento.animate), que é nativa do navegador.
    // O chacoalhão acontece quando o campo GANHA a classe .is-invalid
    // e também quando a pessoa tenta enviar de novo com o campo ainda errado.
    const form = document.getElementById('form-mensagem');
    const ultimoChacoalhao = new WeakMap(); // guarda quando cada campo chacoalhou

    function chacoalhar(campo) {
        if (reduzMovimento() || !campo.animate) {
            return; // com "reduzir movimento" fica só a cor vermelha, sem tremer
        }
        const agora = Date.now();
        if (agora - (ultimoChacoalhao.get(campo) || 0) < 400) {
            return; // acabou de chacoalhar: não repete em seguida
        }
        ultimoChacoalhao.set(campo, agora);

        const alvo = campo.querySelector('.campo__input') || campo;
        alvo.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(2px)' },
                { transform: 'translateX(0)' }
            ],
            { duration: 280, easing: 'ease-out' }
        );
    }

    if (form && 'MutationObserver' in window) {
        // Vigia a troca de classes dos .campo dentro do formulário.
        const vigiaCampos = new MutationObserver(function (mudancas) {
            mudancas.forEach(function (mudanca) {
                const el = mudanca.target;
                const ficouInvalido = el.classList.contains('campo') &&
                    el.classList.contains('is-invalid') &&
                    !(mudanca.oldValue || '').split(' ').includes('is-invalid');
                if (ficouInvalido) {
                    chacoalhar(el);
                }
            });
        });
        vigiaCampos.observe(form, {
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true
        });

        // Tentou enviar de novo e o campo continua inválido? Chacoalha outra vez.
        // setTimeout(..., 0) espera o script.js terminar a validação primeiro.
        form.addEventListener('submit', function () {
            setTimeout(function () {
                form.querySelectorAll('.campo.is-invalid').forEach(chacoalhar);
            }, 0);
        });
    }


    // -----------------------------------------------------------------
    // 5. Purpurina de meia-noite no hero
    // -----------------------------------------------------------------
    // Cria até 12 pontinhos de brilho (decoração pura: aria-hidden e sem clique).
    // O movimento é 100% CSS (animação lenta de 5 a 9 segundos).
    const hero = document.querySelector('.hero');
    const QUANTIDADE_BRILHOS = 12;
    let camadaBrilhos = null;
    let heroNaTela = true;

    // Número aleatório entre "min" e "max".
    function sortear(min, max) {
        return min + Math.random() * (max - min);
    }

    function criarPurpurina() {
        if (!hero || camadaBrilhos || reduzMovimento()) {
            return; // sem hero, já criada, ou a pessoa pediu menos movimento
        }

        camadaBrilhos = document.createElement('div');
        camadaBrilhos.className = 'brilhos';
        camadaBrilhos.setAttribute('aria-hidden', 'true');

        for (let i = 0; i < QUANTIDADE_BRILHOS; i++) {
            const brilho = document.createElement('span');
            brilho.className = 'brilho';
            // Cada brilho ganha posição (%), tamanho, duração e atraso diferentes.
            // O atraso começa em 1s para não competir com a entrada do título.
            brilho.style.setProperty('--x', sortear(4, 94).toFixed(1) + '%');
            brilho.style.setProperty('--y', sortear(10, 80).toFixed(1) + '%');
            brilho.style.setProperty('--tam', Math.round(sortear(4, 9)) + 'px');
            brilho.style.setProperty('--dur', sortear(5, 9).toFixed(2) + 's');
            brilho.style.setProperty('--atraso', sortear(1, 6).toFixed(2) + 's');
            camadaBrilhos.appendChild(brilho);
        }

        // Entra logo depois do overlay escuro (fica por cima dele, mas atrás do texto).
        const overlay = hero.querySelector('.hero__overlay');
        hero.insertBefore(camadaBrilhos, overlay ? overlay.nextSibling : hero.firstChild);
        atualizarPausa();
    }

    function removerPurpurina() {
        if (camadaBrilhos) {
            camadaBrilhos.remove();
            camadaBrilhos = null;
        }
    }

    // Pausa a purpurina quando ela não está sendo vista:
    // o hero saiu da tela OU a aba do navegador está escondida.
    function atualizarPausa() {
        if (!camadaBrilhos) {
            return;
        }
        const pausar = !heroNaTela || document.hidden;
        camadaBrilhos.toggleAttribute('data-pausado', pausar);
    }

    if (hero && 'IntersectionObserver' in window) {
        // Este observador NÃO é o da revelação: ele só liga/desliga a purpurina.
        const vigiaHero = new IntersectionObserver(function (entradas) {
            heroNaTela = entradas[0].isIntersecting;
            atualizarPausa();
        });
        vigiaHero.observe(hero);
    }

    document.addEventListener('visibilitychange', atualizarPausa);


    // -----------------------------------------------------------------
    // 6. Capa da música: inclina seguindo o mouse
    // -----------------------------------------------------------------
    // Só em computador com mouse (hover + ponteiro fino) e sem "reduzir movimento".
    // O JS só calcula dois números (--rx e --ry, em graus); quem desenha é o CSS.
    // requestAnimationFrame junta vários movimentos do mouse num só quadro (mais leve).
    const capa = document.querySelector('.capa img');
    const temMouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const INCLINACAO_MAX = 6; // graus

    if (capa) {
        let quadroPendente = 0;
        let ultimoEvento = null;

        capa.addEventListener('pointermove', function (evento) {
            if (!temMouse.matches || reduzMovimento()) {
                return;
            }
            ultimoEvento = evento;
            if (quadroPendente) {
                return; // já tem um cálculo marcado para o próximo quadro
            }
            quadroPendente = requestAnimationFrame(function () {
                quadroPendente = 0;
                const caixa = capa.getBoundingClientRect();
                // De -0.5 (borda esquerda/topo) a +0.5 (borda direita/base)
                const px = (ultimoEvento.clientX - caixa.left) / caixa.width - 0.5;
                const py = (ultimoEvento.clientY - caixa.top) / caixa.height - 0.5;
                capa.style.setProperty('--ry', (px * 2 * INCLINACAO_MAX).toFixed(2) + 'deg');
                capa.style.setProperty('--rx', (-py * 2 * INCLINACAO_MAX).toFixed(2) + 'deg');
            });
        });

        capa.addEventListener('pointerleave', function () {
            capa.style.removeProperty('--rx');
            capa.style.removeProperty('--ry');
        });
    }


    // -----------------------------------------------------------------
    // Começa! Aplica a preferência atual (cria ou não a purpurina).
    // -----------------------------------------------------------------
    aplicarPreferencia();
})();
