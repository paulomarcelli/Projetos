/* ==========================================================================
   ui.js — pequenos comportamentos de interface
   - prateleiras: setas ‹ › que rolam a lista na horizontal
   - imagens: se uma imagem falhar, vira o espaço de "imagem pendente"
   - realce: destaca por alguns segundos o trecho aberto por um link interno
   Tudo fica dentro de window.KS (um "namespace" do site) para não poluir o global.
   ========================================================================== */
(function () {
  'use strict';

  var KS = window.KS = window.KS || {};

  // true quando a pessoa pediu ao sistema para reduzir animações
  function prefereMenosMovimento() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ---------- Prateleiras ---------- */
  function iniciarPrateleiras() {
    var setas = document.querySelectorAll('.shelf__arrow');

    setas.forEach(function (seta) {
      var lista = document.getElementById(seta.getAttribute('aria-controls'));
      if (!lista) return;
      var direcao = seta.classList.contains('shelf__arrow--prev') ? -1 : 1;

      seta.addEventListener('click', function () {
        // rola quase uma "tela" da lista; sem animação se o usuário prefere menos movimento
        lista.scrollBy({
          left: direcao * lista.clientWidth * 0.8,
          behavior: prefereMenosMovimento() ? 'auto' : 'smooth'
        });
      });
    });

    // Desabilita a seta quando não há mais para onde rolar
    document.querySelectorAll('.shelf__list').forEach(function (lista) {
      var anterior = document.querySelector('.shelf__arrow--prev[aria-controls="' + lista.id + '"]');
      var proxima = document.querySelector('.shelf__arrow--next[aria-controls="' + lista.id + '"]');
      if (!anterior || !proxima) return;

      var agendado = false;
      function atualizar() {
        agendado = false;
        var fim = lista.scrollWidth - lista.clientWidth - 2;
        anterior.disabled = lista.scrollLeft <= 2;
        proxima.disabled = lista.scrollLeft >= fim;
      }
      // requestAnimationFrame evita recalcular a cada pixel rolado
      lista.addEventListener('scroll', function () {
        if (!agendado) { agendado = true; requestAnimationFrame(atualizar); }
      }, { passive: true });
      window.addEventListener('resize', atualizar);
      KS.atualizarPrateleiras = (KS.atualizarPrateleiras || []).concat(atualizar);
      atualizar();
    });
  }

  /* ---------- Imagens com erro ---------- */
  var PENDENTE = 'assets/img/pendente.svg';

  function tratarErroImagem(img) {
    if (img.getAttribute('src') === PENDENTE) return; // evita repetir se o próprio placeholder falhar
    img.src = PENDENTE;
    img.classList.add('is-pending');
    if (img.alt) img.alt = 'Imagem indisponível: ' + img.alt;
  }

  function iniciarImagens() {
    document.querySelectorAll('img').forEach(function (img) {
      // imagem que já falhou antes deste script rodar
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') {
        tratarErroImagem(img);
      }
      img.addEventListener('error', function () { tratarErroImagem(img); });
    });
  }

  /* ---------- Realce de trecho ---------- */
  var timerRealce = null;

  function realcar(el) {
    document.querySelectorAll('.is-target').forEach(function (antigo) {
      antigo.classList.remove('is-target');
    });
    el.classList.add('is-target');
    clearTimeout(timerRealce);
    timerRealce = setTimeout(function () { el.classList.remove('is-target'); }, 4000);
  }

  KS.ui = {
    prefereMenosMovimento: prefereMenosMovimento,
    iniciarPrateleiras: iniciarPrateleiras,
    iniciarImagens: iniciarImagens,
    realcar: realcar
  };
})();
