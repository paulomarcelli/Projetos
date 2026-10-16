/* ==========================================================================
   app.js — estado do site e roteador por hash (#inicio, #historia, ...)
   Como funciona:
   1. O endereço termina com um "hash" (ex.: #capitulo-2).
   2. O roteador mostra a <section class="view"> com esse id e esconde as outras.
   3. Se o hash for o id de algo DENTRO de uma view (ex.: #cap2-teste ou #fonte-33),
      abre a view certa, rola até o elemento e o realça.
   4. Se o hash não existir, volta para #inicio e mostra um aviso.
   O hash nunca vai ao servidor, então o GitHub Pages não dá erro 404.
   ========================================================================== */
(function () {
  'use strict';

  var KS = window.KS = window.KS || {};

  // Estado único do site (um objeto simples, fácil de inspecionar no console)
  KS.state = {
    view: 'inicio',   // view atual
    faixaId: null,    // faixa selecionada no player
    marcoId: null,    // último marco clicado na linha do tempo
    filtro: 'todas'   // filtro da lista de faixas
  };

  // Ordem da narrativa (usada pelos botões ‹ › da barra superior)
  var ORDEM = ['inicio', 'historia', 'capitulo-1', 'capitulo-2', 'capitulo-3', 'musica', 'licoes', 'creditos'];
  // Itens de menu que ficam "ativos" para cada view
  var PAI = { 'capitulo-1': 'historia', 'capitulo-2': 'historia', 'capitulo-3': 'historia' };

  var main, aviso, tituloTopo, botaoAnterior, botaoProximo;

  function nomeDaView(id) {
    var view = document.getElementById(id);
    return view ? view.dataset.title : '';
  }

  // Descobre qual view mostrar para um hash. Retorna { view, alvo } ou null.
  function resolver(hash) {
    var id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return { view: 'inicio', alvo: null };
    if (ORDEM.indexOf(id) !== -1) return { view: id, alvo: null };

    var alvo = document.getElementById(id);
    if (!alvo || !main.contains(alvo)) return null;
    var view = alvo.closest('.view');
    return view ? { view: view.id, alvo: alvo } : null;
  }

  // Atualiza menus, título, botões ‹ › e foco
  function mostrarView(id, alvo, moverFoco) {
    var mudouDeView = id !== KS.state.view;
    KS.state.view = id;

    document.querySelectorAll('.view').forEach(function (view) {
      view.classList.toggle('is-active', view.id === id);
    });

    // aria-current="page" no item certo da lateral e da barra de abas (F24)
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      var nav = link.dataset.nav;
      var naBarraDeAbas = link.classList.contains('tabbar__link');
      var atual = nav === id || (naBarraDeAbas && PAI[id] === nav);
      if (atual) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
      link.classList.toggle('is-parent', !naBarraDeAbas && PAI[id] === nav);
    });

    var nome = nomeDaView(id);
    document.title = (id === 'inicio' ? 'Karol Sevilla: história, superação e música' : nome + ' · Karol Sevilla') + ' | fã-site';
    tituloTopo.textContent = nome;

    // Botões de etapa anterior / próxima com nome dinâmico
    var pos = ORDEM.indexOf(id);
    var anterior = ORDEM[pos - 1];
    var proximo = ORDEM[pos + 1];
    botaoAnterior.disabled = !anterior;
    botaoProximo.disabled = !proximo;
    botaoAnterior.setAttribute('aria-label', anterior ? 'Etapa anterior: ' + nomeDaView(anterior) : 'Etapa anterior');
    botaoProximo.setAttribute('aria-label', proximo ? 'Próxima etapa: ' + nomeDaView(proximo) : 'Próxima etapa');

    if (alvo) {
      // rola até o trecho, realça e leva o foco para lá (leitores de tela leem o trecho)
      if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
      alvo.scrollIntoView({ block: 'start', behavior: KS.ui.prefereMenosMovimento() ? 'auto' : 'smooth' });
      KS.ui.realcar(alvo);
      if (moverFoco) alvo.focus({ preventScroll: true });
    } else if (mudouDeView || moverFoco) {
      main.scrollTop = 0;
      if (moverFoco) {
        var titulo = document.querySelector('#' + id + ' h1, #' + id + ' h2');
        if (titulo) titulo.focus({ preventScroll: true });
      }
    }

    // a linha do tempo marca o último marco visitado
    document.querySelectorAll('.timeline__link').forEach(function (link) {
      if (link.dataset.marco === KS.state.marcoId) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });

    // prateleiras recalculam as setas quando ficam visíveis
    (KS.atualizarPrateleiras || []).forEach(function (fn) { fn(); });
  }

  function aoMudarHash(evento) {
    // Link "Pular para o conteúdo": fica na view atual e só move o foco para o <main>
    if (location.hash === '#conteudo') {
      history.replaceState(null, '', '#' + (KS.state.view || 'inicio'));
      if (!KS.state.view) mostrarView('inicio', null, false);
      main.focus();
      return;
    }
    var rota = resolver(location.hash);
    var veioDeNavegacao = Boolean(evento); // na carga inicial não roubamos o foco

    if (!rota) {
      // Hash desconhecido: volta para o Início com mensagem de estado vazio
      aviso.textContent = 'O endereço "' + location.hash + '" não existe neste site. Você voltou ao Início.';
      aviso.hidden = false;
      history.replaceState(null, '', '#inicio');
      mostrarView('inicio', null, veioDeNavegacao);
      return;
    }
    if (rota.view !== 'inicio') aviso.hidden = true;
    mostrarView(rota.view, rota.alvo, veioDeNavegacao);
  }

  function irPara(id) {
    location.hash = '#' + id;
  }

  function iniciar() {
    main = document.getElementById('conteudo');
    aviso = document.getElementById('aviso-rota');
    tituloTopo = document.getElementById('titulo-view');
    botaoAnterior = document.getElementById('passo-anterior');
    botaoProximo = document.getElementById('passo-proximo');

    KS.ui.iniciarImagens();
    KS.ui.iniciarPrateleiras();
    KS.player.iniciar();

    botaoAnterior.addEventListener('click', function () { irPara(ORDEM[ORDEM.indexOf(KS.state.view) - 1]); });
    botaoProximo.addEventListener('click', function () { irPara(ORDEM[ORDEM.indexOf(KS.state.view) + 1]); });

    // Guarda o marco clicado (o link em si já leva ao trecho do capítulo)
    document.querySelector('.timeline').addEventListener('click', function (evento) {
      var link = evento.target.closest('.timeline__link');
      if (link) KS.state.marcoId = link.dataset.marco;
    });

    // Clicar de novo num link para o hash atual não dispara "hashchange": tratamos aqui
    document.addEventListener('click', function (evento) {
      var link = evento.target.closest('a[href^="#"]');
      if (link && link.getAttribute('href') === location.hash) {
        evento.preventDefault();
        aoMudarHash(evento);
      }
    });

    window.addEventListener('hashchange', aoMudarHash);
    KS.state.view = null; // força a primeira renderização
    aoMudarHash(null);
  }

  // Os scripts têm "defer": quando este roda, o HTML já foi lido
  iniciar();
})();
