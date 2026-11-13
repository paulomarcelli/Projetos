/*
 * Interface do sistema especialista: mostra as perguntas, coleta as respostas,
 * chama a base de conhecimento (que usa o motor de inferência) e explica o resultado.
 */
(function () {
  const { perguntas, NOMES, avaliar } = window.BaseConhecimento;

  const DESCRICOES = {
    conservador: 'Você prioriza a segurança do seu dinheiro e prefere rendimentos previsíveis, mesmo que menores.',
    moderado: 'Você busca equilíbrio: aceita alguma oscilação em parte do dinheiro para ter um retorno maior no médio prazo.',
    arrojado: 'Você aceita oscilações fortes no curto prazo em troca de um potencial de retorno maior no longo prazo.',
  };
  const TITULOS_ALERTA = { reserva: 'Primeiro passo: reserva de emergência', 'reserva-parcial': 'Complete sua reserva', divida: 'Antes de investir: quite as dívidas caras' };

  const $ = (id) => document.getElementById(id);
  const telas = { inicio: $('tela-inicio'), pergunta: $('tela-pergunta'), resultado: $('tela-resultado') };
  const respostas = {};
  let atual = 0;

  function mostrar(nome, focoId) {
    for (const [chave, tela] of Object.entries(telas)) tela.hidden = chave !== nome;
    window.scrollTo({ top: 0 });
    $(focoId).focus();
  }

  function renderPergunta() {
    const p = perguntas[atual];
    $('progresso-texto').textContent = `Pergunta ${atual + 1} de ${perguntas.length}`;
    $('progresso-barra').style.width = `${(atual / perguntas.length) * 100}%`;
    $('titulo-pergunta').textContent = p.texto;
    $('ajuda-pergunta').hidden = !p.ajuda;
    $('ajuda-pergunta').textContent = p.ajuda || '';

    const lista = $('opcoes');
    lista.replaceChildren(...p.opcoes.map((opcao, i) => {
      const div = document.createElement('div');
      div.className = 'opcao';
      const input = document.createElement('input');
      Object.assign(input, { type: 'radio', name: p.id, id: `${p.id}-${i}`, value: String(i), checked: respostas[p.id] === i });
      input.addEventListener('change', () => { respostas[p.id] = i; $('btn-proxima').disabled = false; });
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = opcao.texto;
      div.append(input, label);
      return div;
    }));

    $('btn-proxima').disabled = respostas[p.id] === undefined;
    $('btn-proxima').textContent = atual === perguntas.length - 1 ? 'Ver meu perfil' : 'Próxima';
    $('btn-voltar').textContent = atual === 0 ? 'Início' : 'Voltar';
    // reinicia a animação de entrada a cada pergunta
    telas.pergunta.style.animation = 'none'; void telas.pergunta.offsetWidth; telas.pergunta.style.animation = '';
  }

  function renderResultado() {
    const { fatos, trilha } = avaliar(respostas);
    const perfil = fatos.perfil;
    const cor = getComputedStyle(document.documentElement).getPropertyValue(`--${perfil}`);

    $('resultado-destaque').dataset.perfil = perfil;
    $('titulo-resultado').textContent = NOMES[perfil];
    $('resultado-descricao').textContent = DESCRICOES[perfil];

    $('alertas').replaceChildren(...fatos.alertas.map((a) => {
      const p = document.createElement('p');
      p.className = 'alerta';
      p.setAttribute('role', 'note');
      const forte = document.createElement('strong');
      forte.textContent = TITULOS_ALERTA[a.tipo] || 'Atenção';
      p.append(forte, a.texto);
      return p;
    }));

    $('carteira').replaceChildren(...fatos.carteira.map((item, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="carteira-topo"><span></span><span>${item.percentual}%</span></div>
        <div class="carteira-trilho"><div class="carteira-barra"></div></div><p class="carteira-desc"></p>`;
      li.querySelector('.carteira-topo span').textContent = item.nome;
      li.querySelector('.carteira-desc').textContent = item.descricao;
      const barra = li.querySelector('.carteira-barra');
      barra.style.width = `${item.percentual}%`;
      barra.style.setProperty('--cor-perfil', cor);
      barra.style.animationDelay = `${i * 70}ms`;
      return li;
    }));

    $('raciocinio').replaceChildren(...trilha.map((passo) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="regra-id"></span><span class="regra-nome"></span><span class="regra-explicacao"></span>';
      li.querySelector('.regra-id').textContent = passo.id;
      li.querySelector('.regra-nome').textContent = passo.nome;
      li.querySelector('.regra-explicacao').textContent = passo.explicacao;
      return li;
    }));

    mostrar('resultado', 'titulo-resultado');
  }

  $('btn-comecar').addEventListener('click', () => { atual = 0; renderPergunta(); mostrar('pergunta', 'titulo-pergunta'); });
  $('btn-voltar').addEventListener('click', () => {
    if (atual === 0) { mostrar('inicio', 'titulo-inicio'); return; }
    atual -= 1; renderPergunta(); $('titulo-pergunta').focus();
  });
  $('form-pergunta').addEventListener('submit', (e) => {
    e.preventDefault();
    if (respostas[perguntas[atual].id] === undefined) return;
    if (atual < perguntas.length - 1) { atual += 1; renderPergunta(); $('titulo-pergunta').focus(); }
    else renderResultado();
  });
  $('btn-refazer').addEventListener('click', () => {
    for (const chave of Object.keys(respostas)) delete respostas[chave];
    mostrar('inicio', 'titulo-inicio');
  });
})();
