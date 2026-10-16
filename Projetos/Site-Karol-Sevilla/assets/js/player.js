/* ==========================================================================
   player.js — "player honesto" e filtros de músicas
   O site NÃO toca áudio. Selecionar uma faixa só atualiza a barra inferior
   com o título, o contexto e os links oficiais (que abrem em nova aba).
   Os dados vêm do próprio HTML: cada faixa é um elemento com id="faixa-<id>",
   atributos data-titulo / data-contexto e uma lista .track__links com os links.
   ========================================================================== */
(function () {
  'use strict';

  var KS = window.KS = window.KS || {};
  var CHAVE = 'ks-faixa';          // nome usado no sessionStorage

  var el = {};                     // referências aos elementos do player

  // Lê os dados de uma faixa a partir do HTML. Retorna null se o id não existir.
  function lerFaixa(id) {
    var linha = document.getElementById('faixa-' + id);
    if (!linha) return null;
    var links = Array.prototype.map.call(linha.querySelectorAll('.track__links a'), function (a) {
      return { rotulo: a.textContent.trim(), url: a.href, nome: a.getAttribute('aria-label') || a.textContent.trim() };
    });
    return {
      id: id,
      titulo: linha.dataset.titulo,
      contexto: linha.dataset.contexto,
      links: links
    };
  }

  // Cria um link externo seguro (textContent, nunca innerHTML)
  function criarLink(link, classeExtra) {
    var a = document.createElement('a');
    a.className = 'btn btn--secondary btn--sm' + (classeExtra ? ' ' + classeExtra : '');
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.rotulo;
    a.setAttribute('aria-label', link.nome);
    return a;
  }

  function preencherLista(ul, faixa) {
    ul.replaceChildren();
    faixa.links.forEach(function (link) {
      var li = document.createElement('li');
      li.appendChild(criarLink(link));
      ul.appendChild(li);
    });
    if (!faixa.links.length) {
      var li = document.createElement('li');
      li.className = 'note';
      li.textContent = 'Sem link oficial confirmado nesta pesquisa.';
      ul.appendChild(li);
    }
  }

  // Seleciona uma faixa: atualiza estado, barra do player e botões aria-pressed
  function selecionar(id, opcoes) {
    var faixa = lerFaixa(id);
    if (!faixa) return;
    KS.state.faixaId = id;

    el.titulo.textContent = faixa.titulo;
    el.contexto.textContent = faixa.contexto;
    el.player.classList.add('has-track');
    preencherLista(el.links, faixa);

    el.detalhes.textContent = 'Detalhes';
    el.detalhes.href = '#faixa-' + id;
    el.detalhes.setAttribute('aria-label', 'Detalhes de ' + faixa.titulo);
    el.abrir.hidden = false;
    el.abrir.setAttribute('aria-label', 'Ouvir ' + faixa.titulo + ' nas plataformas oficiais');

    // pequena animação na capa (desligada com movimento reduzido via CSS)
    if (!(opcoes && opcoes.silencioso)) {
      el.player.classList.remove('is-changing');
      void el.player.offsetWidth; // reinicia a animação
      el.player.classList.add('is-changing');
    }

    // todos os botões que selecionam esta faixa ficam "pressionados"
    document.querySelectorAll('[data-select]').forEach(function (botao) {
      var ativo = botao.dataset.select === id;
      botao.setAttribute('aria-pressed', String(ativo));
      var item = botao.closest('.track, .card');
      if (item) item.classList.toggle('is-selected', ativo);
    });

    try { sessionStorage.setItem(CHAVE, id); } catch (e) { /* armazenamento bloqueado: segue sem lembrar */ }
  }

  /* ---------- Folha de links (celular) ---------- */
  function abrirFolha() {
    var faixa = lerFaixa(KS.state.faixaId);
    if (!faixa) return;
    el.folhaFaixa.textContent = faixa.titulo + ' · ' + faixa.contexto;
    preencherLista(el.folhaLista, faixa);
    if (typeof el.folha.showModal === 'function') el.folha.showModal();
    else el.folha.setAttribute('open', '');
  }

  function fecharFolha() {
    if (typeof el.folha.close === 'function') el.folha.close();
    else el.folha.removeAttribute('open');
    el.abrir.focus(); // devolve o foco para quem abriu
  }

  /* ---------- Filtros da lista de faixas ---------- */
  function filtrar(filtro) {
    KS.state.filtro = filtro;
    var visiveis = 0;
    document.querySelectorAll('.tracklist .track').forEach(function (linha) {
      var mostra = filtro === 'todas' || linha.dataset.grupo === filtro;
      linha.classList.toggle('is-filtered-out', !mostra);
      if (mostra) visiveis++;
    });
    document.querySelectorAll('[data-filtro]').forEach(function (chip) {
      chip.setAttribute('aria-pressed', String(chip.dataset.filtro === filtro));
    });
    var status = document.getElementById('filtro-status');
    if (status) status.textContent = visiveis + (visiveis === 1 ? ' música na lista' : ' músicas na lista');
  }

  function iniciar() {
    el.player = document.querySelector('.player');
    el.titulo = document.getElementById('player-titulo');
    el.contexto = document.getElementById('player-contexto');
    el.links = document.getElementById('player-links');
    el.detalhes = document.getElementById('player-detalhes');
    el.abrir = document.getElementById('player-abrir');
    el.folha = document.getElementById('folha-links');
    el.folhaFaixa = document.getElementById('folha-faixa');
    el.folhaLista = document.getElementById('folha-lista');

    // Um único "ouvinte" no documento trata todos os botões (delegação de eventos)
    document.addEventListener('click', function (evento) {
      var botao = evento.target.closest('[data-select]');
      if (botao) { selecionar(botao.dataset.select); return; }
      var chip = evento.target.closest('[data-filtro]');
      if (chip) filtrar(chip.dataset.filtro);
    });

    el.abrir.addEventListener('click', abrirFolha);
    document.getElementById('folha-fechar').addEventListener('click', fecharFolha);
    // clicar fora do conteúdo (no fundo escuro) fecha a folha
    el.folha.addEventListener('click', function (evento) {
      if (evento.target === el.folha) fecharFolha();
    });
    el.folha.addEventListener('cancel', function () { // tecla Esc
      setTimeout(function () { el.abrir.focus(); }, 0);
    });

    // Recupera a faixa escolhida antes (mesma aba)
    var salva = null;
    try { salva = sessionStorage.getItem(CHAVE); } catch (e) { salva = null; }
    if (salva && lerFaixa(salva)) selecionar(salva, { silencioso: true });
  }

  KS.player = { iniciar: iniciar, selecionar: selecionar, filtrar: filtrar };
})();
