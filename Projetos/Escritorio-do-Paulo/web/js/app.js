// Interface do Escritório do Paulo. Recebe do servidor local o retrato da equipe (estados, tarefas, histórico) e
// desenha o escritório. Nada aqui decide o estado de um agente: a tela só mostra o que o servidor informou.
import { avatar } from './avatares.js';
import { ICONES, ROTULOS, ESTADOS_ATIVOS } from './telas.js';
import { criarMapa } from './mapa.js';

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
// Todo texto que vem de fora (títulos, entregas, mensagens dos agentes) passa por aqui antes de virar HTML.
const esc = texto => String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Aberta pelo endereço online (GitHub Pages), a página conversa com o Escritório que roda no computador do Paulo
// (127.0.0.1). Aberta pelo próprio servidor local, usa caminhos relativos.
const LOCAL = ['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname);
const PORTA = new URLSearchParams(location.search).get('porta') || '4310';
const BASE = LOCAL ? '' : `http://127.0.0.1:${PORTA}`;

let E = null; // último retrato recebido
let desvio = 0; // relógio do servidor menos o do navegador
let conexao = 'abrindo';
let agenteAberto = null;
let tarefaAberta = null;
let projetoFoco = null;
let mostrarConcluidas = false;

// ---------- utilidades ----------
const agora = () => Date.now() + desvio;
const agentePorId = id => E?.equipe.find(a => a.id === id) || null;
const tarefaPorId = id => E?.tarefas.find(t => t.id === id) || null;
const nomeDe = id => agentePorId(id)?.nome || id || 'sem dono';
const hora = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
function duracao(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}
const ha = ts => (ts ? (agora() - ts < 5000 ? 'agora' : `há ${duracao(agora() - ts)}`) : '');
const dolar = v => (typeof v === 'number' ? `US$ ${v.toFixed(v < 1 ? 3 : 2).replace('.', ',')}` : '—');
const listar = nomes => (nomes.length <= 1 ? nomes.join('') : `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`);
const chip = estado => `<span class="chip" data-estado="${estado}">${ICONES[estado] || ''}${ROTULOS[estado] || estado}</span>`;
const situacaoDaTarefa = t => (t.status === 'fila' ? (t.bloqueadaPor.length ? 'espera' : 'pronta') : t.status);
const NOME_SITUACAO = { andamento: 'Em andamento', espera: 'Aguardando outra tarefa', pronta: 'Pronta para começar', concluida: 'Concluída', erro: 'Com erro', cancelada: 'Cancelada' };
const ORIGEM = { painel: 'criada no painel', coordenador: 'plano do Steve', fluxo: 'fluxo pronto', plano: 'plano enviado', terminal: 'criada pelo terminal', 'claude-code': 'conversa no Claude Code' };

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(BASE + caminho, { method: metodo, headers: corpo ? { 'Content-Type': 'application/json' } : undefined, body: corpo ? JSON.stringify(corpo) : undefined });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'O Escritório não conseguiu fazer isso.');
  return dados;
}

let temporizadorAviso;
function avisar(texto) {
  const el = $('#aviso');
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => (el.hidden = true), 6000);
}
const tentar = async (acao, ...args) => {
  try {
    return await acao(...args);
  } catch (erro) {
    avisar(erro.message);
    return null;
  }
};

const imagemDoAgente = a => (a.avatarPessoal ? `<img src="${esc(`${BASE ? `${BASE}/` : ''}${a.avatarPessoal}`)}" alt="${esc(a.nome)}">` : avatar(a.avatar, esc(a.nome)));

// ---------- topo ----------
function renderSistema() {
  const s = E.sistema;
  const ao = conexao === 'ao-vivo';
  const exec = s.executor;
  $('#sistema').innerHTML = `
    <span class="sinal" data-ok="${ao ? 'sim' : 'aviso'}" title="Ligação com o servidor local"><i></i>${ao ? 'Ao vivo' : 'Reconectando…'}</span>
    <span class="sinal" data-ok="${exec.disponivel ? 'sim' : 'nao'}" title="${esc(exec.disponivel ? 'É o Claude Code que executa os agentes' : exec.motivo || '')}"><i></i>${exec.disponivel ? `Claude Code ${esc((exec.versao || '').split(' ')[0])}` : 'Claude Code ausente'}</span>
    <span class="sinal" data-ok="${s.ganchos.instalados ? 'sim' : 'aviso'}" title="Os ganchos avisam o escritório quando você usa um agente numa conversa do Claude Code"><i></i>${s.ganchos.instalados ? 'Ganchos ligados' : 'Ganchos desligados'}</span>`;

  const faixas = [];
  if (exec.simulacao) faixas.push(`<p class="faixa" data-tipo="aviso">${ICONES.erro}Simulação: o Escritório está usando um Claude de teste. Estas execuções não são reais.</p>`);
  if (!exec.disponivel) faixas.push(`<p class="faixa" data-tipo="erro">${ICONES.erro}O Claude Code não foi encontrado nesta máquina. O Escritório mostra as tarefas, mas não consegue executar agentes até ele estar instalado e com a conta conectada.</p>`);
  $('#faixas').innerHTML = faixas.join('');
}

function renderAchado() {
  const el = $('#achado');
  const comErro = E.equipe.filter(a => a.estado.estado === 'erro');
  const esperando = E.equipe.filter(a => a.estado.estado === 'aguardando');
  const ativos = E.equipe.filter(a => ESTADOS_ATIVOS.includes(a.estado.estado));
  if (comErro.length) {
    const a = comErro[0];
    el.innerHTML = `<b>${esc(a.nome)} parou com erro</b>${a.estado.tarefaId ? ` em ${esc(a.estado.tarefaId)}` : ''}. ${esc(a.estado.atividade || '')}`;
  } else if (ativos.length && esperando.length) {
    const e = esperando[0];
    el.innerHTML = `<b>${esc(listar(ativos.map(a => a.nome)))}</b> em execução. <b>${esc(e.nome)}</b> espera ${esc(listar(e.estado.esperando.map(nomeDe)) || 'outra tarefa')} ${esc(ha(e.estado.desde))}.`;
  } else if (ativos.length) {
    el.innerHTML = `<b>${esc(listar(ativos.map(a => a.nome)))}</b> em execução agora.`;
  } else if (esperando.length) {
    const e = esperando[0];
    el.innerHTML = `Ninguém em execução. <b>${esc(e.nome)}</b> espera ${esc(listar(e.estado.esperando.map(nomeDe)) || 'outra tarefa')}: ${esc(e.estado.atividade || '')}`;
  } else {
    const prontas = E.tarefas.filter(t => situacaoDaTarefa(t) === 'pronta').length;
    el.innerHTML = prontas ? `Equipe disponível. <b>${prontas} tarefa${prontas > 1 ? 's' : ''}</b> pronta${prontas > 1 ? 's' : ''} para começar.` : 'Equipe disponível. Nenhuma execução agora.';
  }
}

// ---------- parede: os números do dia ----------
function renderParede() {
  const ativos = E.equipe.filter(a => ESTADOS_ATIVOS.includes(a.estado.estado)).length;
  const esperando = E.equipe.filter(a => a.estado.estado === 'aguardando').length;
  const fila = E.tarefas.filter(t => t.status === 'fila').length;
  const marcos = [
    ['Em execução', ativos, `de ${E.equipe.length}`],
    ['Aguardando outro agente', esperando, ''],
    ['Tarefas na fila', fila, ''],
    ['Concluídas hoje', E.hoje.concluidas, ''],
    ['Custo de hoje', E.hoje.custoUsd === null ? '—' : dolar(E.hoje.custoUsd), ''],
  ];
  $('#parede').innerHTML =
    `<svg class="parede__vista" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 69h60V44h34v25h40V30h22v-9h8v9h22v39h50V48h44v21h36V36h40v33h46V52h30v17h54V26h18v-8h10v8h18v43h44V46h38v23h50V38h46v31h40V54h32v15h54V32h34v37h56" fill="none" stroke="currentColor" stroke-width="1"/></svg>` +
    marcos.map(([rotulo, valor, apoio]) => `<div class="marco" ${valor === 0 || valor === '—' ? 'data-zero' : ''}><span class="rotulo">${rotulo}</span><span class="marco__valor">${esc(valor)}${apoio ? `<small>${apoio}</small>` : ''}</span></div>`).join('');
}

// ---------- o mapa ----------
const mapa = criarMapa($('#mapa'), {
  figura: imagemDoAgente,
  aoAbrir(id) {
    agenteAberto = agenteAberto === id ? null : id;
    renderEstacoes();
    renderGaveta();
  },
});
function renderEstacoes() {
  mapa.atualizar(E.equipe, E.tarefas);
  mapa.marcarAberto(agenteAberto);
}
function caixa(el, base) {
  const r = el.getBoundingClientRect();
  const b = base.getBoundingClientRect();
  return { x: r.left - b.left + base.scrollLeft, y: r.top - b.top + base.scrollTop, w: r.width, h: r.height };
}

// ---------- mesa de projeto ----------
function projetoEmFoco() {
  if (!E.projetos.length) return null;
  const escolhido = E.projetos.find(p => p.nome === projetoFoco);
  if (escolhido) return escolhido;
  return E.projetos.find(p => p.concluidas < p.total) || E.projetos[0];
}
function renderMesa() {
  const mesa = $('#mesa');
  const p = projetoEmFoco();
  if (!p) {
    mesa.innerHTML = `<div class="mesa__topo"><span class="rotulo">Mesa de projeto</span></div>
      <p class="vazio"><b>Nenhum projeto ainda.</b> Faça um pedido e a equipe monta as tarefas aqui, na ordem em que uma depende da outra.</p>`;
    return;
  }
  const tarefas = p.ids.map(tarefaPorId).filter(Boolean);
  const nivel = new Map();
  const nivelDe = t => {
    if (nivel.has(t.id)) return nivel.get(t.id);
    nivel.set(t.id, 0);
    const deps = t.dependeDe.map(tarefaPorId).filter(d => d && p.ids.includes(d.id));
    const n = deps.length ? 1 + Math.max(...deps.map(nivelDe)) : 0;
    nivel.set(t.id, n);
    return n;
  };
  tarefas.forEach(nivelDe);
  const colunas = [];
  for (const t of tarefas) (colunas[nivel.get(t.id)] ||= []).push(t);
  const naFila = tarefas.filter(t => t.status === 'fila');
  const automatico = naFila.some(t => t.auto);
  const outros = E.projetos.length > 1
    ? `<select class="mesa__projetos" id="troca-projeto" aria-label="Trocar de projeto">${E.projetos.map(x => `<option value="${esc(x.nome)}" ${x.nome === p.nome ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select>`
    : '';
  const botao = naFila.length
    ? `<button class="botao botao--pequeno" type="button" data-acao="projeto" data-projeto="${esc(p.nome)}" data-auto="${automatico ? '0' : '1'}" ${E.sistema.executor.disponivel ? '' : 'disabled'}>${automatico ? 'Pausar projeto' : 'Executar projeto'}</button>`
    : '';
  mesa.innerHTML = `
    <div class="mesa__topo">
      <span class="mesa__nome" title="${esc(p.nome)}">${esc(p.nome)}</span>
      <span class="mesa__conta">${p.concluidas} de ${p.total} concluída${p.total > 1 ? 's' : ''}${p.erro ? ` · ${p.erro} com erro` : ''}</span>
      <span class="mesa__barra" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.concluidas}" aria-label="Progresso do projeto"><i style="width:${(p.concluidas / p.total) * 100}%"></i></span>
      ${outros}${botao}
    </div>
    <div class="trilho" id="trilho">
      <svg class="fios" id="fios" aria-hidden="true"></svg>
      ${colunas.filter(Boolean).map(col => `<div class="trilho__coluna">${col.map(t => `
        <button class="no" type="button" data-acao="abrir-tarefa" data-tarefa="${esc(t.id)}" data-no="${esc(t.id)}" data-status="${situacaoDaTarefa(t)}" data-tipo="${esc(t.tipo)}" title="${esc(`${t.id} · ${NOME_SITUACAO[situacaoDaTarefa(t)]}`)}">
          <i class="no__marca"></i>
          <span class="no__quem"><b>${esc(nomeDe(t.agente))}</b> · ${esc(t.id)}</span>
          <span class="no__titulo">${esc(t.titulo)}</span>
        </button>`).join('')}</div>`).join('')}
    </div>`;
  desenharFios(tarefas, p);
}
function desenharFios(tarefas, p) {
  const trilho = $('#trilho');
  const svg = $('#fios');
  if (!trilho || !svg) return;
  svg.setAttribute('width', trilho.scrollWidth);
  svg.setAttribute('height', trilho.scrollHeight);
  svg.style.width = `${trilho.scrollWidth}px`;
  const partes = [];
  for (const t of tarefas) {
    const destino = $(`[data-no="${CSS.escape(t.id)}"]`, trilho);
    for (const idDep of t.dependeDe) {
      if (!p.ids.includes(idDep)) continue;
      const dep = tarefaPorId(idDep);
      const origem = $(`[data-no="${CSS.escape(idDep)}"]`, trilho);
      if (!origem || !destino) continue;
      const o = caixa(origem, trilho);
      const d = caixa(destino, trilho);
      const x0 = o.x + o.w;
      const y0 = o.y + o.h / 2;
      const x1 = d.x;
      const y1 = d.y + d.h / 2;
      const meio = (x0 + x1) / 2;
      const vivo = dep.status === 'andamento' && t.status === 'fila';
      partes.push(`<path d="M${x0} ${y0}C${meio} ${y0} ${meio} ${y1} ${x1} ${y1}" ${vivo ? 'data-vivo' : ''} ${dep.status === 'concluida' ? 'data-feito' : ''}/>`);
    }
  }
  svg.innerHTML = partes.join('');
}

// ---------- tarefas ----------
function linhaDaTarefa(t) {
  const s = situacaoDaTarefa(t);
  const dono = t.agente ? `<b>${esc(nomeDe(t.agente))}</b>` : '<b>sem dono</b>';
  let apoio = t.projeto ? ` · ${esc(t.projeto)}` : '';
  if (s === 'andamento') {
    const a = agentePorId(t.agente);
    const fazendo = a?.estado.tarefaId === t.id ? a.estado.atividade : null;
    apoio = ` · <span class="aviso">${esc(fazendo || 'em execução')}</span>`;
  } else if (s === 'espera') {
    const quem = t.bloqueadaPor.map(id => `${id} (${nomeDe(tarefaPorId(id)?.agente)})`).join(', ');
    apoio = ` · <span class="aviso">${t.travada ? 'parada: ' : 'espera '}${esc(quem)}</span>`;
  } else if (s === 'erro') {
    apoio = ` · <span class="aviso">${esc(t.erro || 'erro')}</span>`;
  } else if (s === 'concluida') {
    apoio += ` · ${esc(hora(t.concluidaEm))}`;
  }
  const lado = s === 'pronta' && t.agente && E.sistema.executor.disponivel
    ? `<button class="botao botao--pequeno" type="button" data-acao="iniciar" data-tarefa="${esc(t.id)}">Iniciar</button>`
    : `<span class="tarefa__lado">${esc(t.id)}</span>`;
  return `<div class="tarefa" data-status="${s}" data-tipo="${esc(t.tipo)}">
    <i class="tarefa__marca"></i>
    <button type="button" data-acao="abrir-tarefa" data-tarefa="${esc(t.id)}" aria-label="${esc(`${t.id}: ${t.titulo}. ${NOME_SITUACAO[s]}`)}">
      <span class="tarefa__titulo">${esc(t.titulo)}</span>
      <span class="tarefa__linha">${s === 'pronta' ? `${esc(t.id)} · ` : ''}${dono}${apoio}</span>
    </button>
    ${lado}
  </div>`;
}
function renderTarefas() {
  const todas = E.tarefas;
  const grupos = [
    ['Em andamento', todas.filter(t => t.status === 'andamento')],
    ['Com erro', todas.filter(t => t.status === 'erro')],
    ['Aguardando outra tarefa', todas.filter(t => situacaoDaTarefa(t) === 'espera')],
    ['Prontas para começar', todas.filter(t => situacaoDaTarefa(t) === 'pronta')],
  ];
  const feitas = todas.filter(t => t.status === 'concluida' || t.status === 'cancelada').sort((a, b) => (b.concluidaEm || 0) - (a.concluidaEm || 0));
  const abertas = todas.length - feitas.length;
  $('#conta-tarefas').textContent = todas.length ? `${abertas} aberta${abertas === 1 ? '' : 's'} · ${feitas.length} encerrada${feitas.length === 1 ? '' : 's'}` : '';
  let html = grupos.filter(([, lista]) => lista.length).map(([titulo, lista]) => `<div class="grupo"><p class="grupo__titulo"><span>${titulo}</span><span>${lista.length}</span></p>${lista.map(linhaDaTarefa).join('')}</div>`).join('');
  if (feitas.length) {
    const visiveis = mostrarConcluidas ? feitas : feitas.slice(0, 4);
    html += `<div class="grupo"><p class="grupo__titulo"><span>Encerradas</span><span>${feitas.length}</span></p>${visiveis.map(linhaDaTarefa).join('')}
      ${feitas.length > 4 ? `<button class="botao botao--pequeno" type="button" data-acao="alternar-concluidas" style="margin-top:8px">${mostrarConcluidas ? 'Mostrar menos' : `Ver todas (${feitas.length})`}</button>` : ''}</div>`;
  }
  if (!todas.length) html = `<p class="vazio"><b>Nenhuma tarefa.</b> Use "Novo pedido" para a equipe planejar, ou "Nova tarefa" para dar um trabalho direto a um agente.</p>`;
  $('#tarefas').innerHTML = html;
}

function renderAtividade() {
  const itens = E.historico.slice(0, 60);
  $('#atividade').innerHTML = itens.length
    ? itens.map(h => `<div class="atividade" data-tipo="${esc(h.tipo)}"><time datetime="${new Date(h.quando).toISOString()}">${esc(hora(h.quando))}</time><p>${esc(h.texto)}</p></div>`).join('')
    : '<p class="vazio">Nada aconteceu ainda. O que a equipe fizer aparece aqui.</p>';
}

// ---------- gaveta do agente ----------
function renderGaveta() {
  const gaveta = $('#gaveta');
  const a = agentePorId(agenteAberto);
  if (!a) {
    gaveta.removeAttribute('data-aberta');
    gaveta.setAttribute('aria-hidden', 'true');
    return;
  }
  const est = a.estado;
  const tarefa = est.tarefaId ? tarefaPorId(est.tarefaId) : null;
  const fonte = est.fonte === 'gancho' ? 'numa conversa do Claude Code' : est.fonte === 'executor' ? 'iniciada pelo Escritório' : est.fonte === 'tarefas' ? 'pela ordem das tarefas' : '';
  const m = a.metricas;
  const historico = E.historico.filter(h => h.agente === a.id).slice(0, 8);
  const integ = a.integracoes;
  const avisoFigma = a.integracao === 'figma' && integ && integ.figma !== 'conectado'
    ? `<p>Na última execução pelo Escritório, o Figma estava: <b>${esc(integ.figma)}</b>. Sem ele, a ${esc(a.nome)} avisa na entrega e não cria nada no Figma.</p>`
    : '';
  const rolagem = $('.gaveta__corpo', gaveta)?.scrollTop || 0;
  gaveta.innerHTML = `
    <div class="gaveta__topo">
      <div class="gaveta__avatar">${imagemDoAgente(a)}</div>
      <div>
        <h2 class="gaveta__nome">${esc(a.nome)}</h2>
        <p class="gaveta__papel">${esc(a.papel)}</p>
        ${a.inspiracao ? `<p class="gaveta__inspira">Inspiração: ${esc(a.inspiracao)}</p>` : ''}
      </div>
      <button class="icone-botao" type="button" data-acao="fechar-gaveta" aria-label="Fechar o painel do agente">${ICONES.fechar}</button>
    </div>
    <div class="gaveta__corpo">
      <section class="secao">
        <h3>Estado atual</h3>
        <div class="secao__estado">${chip(est.estado)}${est.estado !== 'disponivel' ? `<span class="mono" data-desde="${est.desde || ''}">${esc(ha(est.desde))}</span>` : ''}
          ${['concluido', 'erro'].includes(est.estado) ? `<button class="botao botao--pequeno" type="button" data-acao="visto" data-agente="${esc(a.id)}">Marcar como visto</button>` : ''}</div>
        ${est.atividade ? `<p style="margin-top:6px">${esc(est.atividade)}</p>` : ''}
        ${est.esperando?.length ? `<p>Espera: <b>${esc(listar(est.esperando.map(nomeDe)))}</b></p>` : ''}
        ${est.estado === 'disponivel' ? `<p>Sem execução no momento.${a.naFila ? ` ${a.naFila} tarefa${a.naFila > 1 ? 's' : ''} na fila.` : ''}</p>` : ''}
      </section>
      ${tarefa ? `<section class="secao"><h3>${est.estado === 'concluido' ? 'Última tarefa' : est.estado === 'erro' ? 'Tarefa com erro' : est.estado === 'aguardando' ? 'Tarefa que espera' : 'Tarefa em andamento'}</h3>
        <p><button class="botao botao--pequeno" type="button" data-acao="abrir-tarefa" data-tarefa="${esc(tarefa.id)}">${esc(tarefa.id)}</button> ${esc(tarefa.titulo)}</p>
        ${fonte ? `<p class="rotulo">Execução ${esc(fonte)}</p>` : ''}</section>` : ''}
      ${a.trilha.length ? `<section class="secao"><h3>${a.trilhaAoVivo ? 'O que está fazendo, passo a passo' : 'Passos da última execução'}</h3>
        <ol class="lista-simples">${a.trilha.slice().reverse().map(p => `<li><time>${esc(hora(p.quando))}</time><span>${esc(p.texto)}</span></li>`).join('')}</ol></section>` : ''}
      <section class="secao"><h3>Especialidade</h3><p>${esc(a.descricao)}</p>${a.personalidade ? `<p>${esc(a.personalidade)}</p>` : ''}</section>
      <section class="secao"><h3>Desempenho</h3>
        <dl class="numeros">
          <div><dt>Concluídas</dt><dd ${m.concluidas ? '' : 'data-zero'}>${m.concluidas}</dd></div>
          <div><dt>Com erro</dt><dd ${m.erros ? '' : 'data-zero'}>${m.erros}</dd></div>
          <div><dt>Tempo médio</dt><dd ${m.tempoMedioMs ? '' : 'data-zero'}>${m.tempoMedioMs ? esc(duracao(m.tempoMedioMs)) : '—'}</dd></div>
          <div><dt>Custo total</dt><dd ${m.custoUsd ? '' : 'data-zero'}>${m.custoUsd === null ? '—' : esc(dolar(m.custoUsd))}</dd></div>
        </dl></section>
      <section class="secao"><h3>Ferramentas</h3>
        <div class="etiquetas">${a.ferramentas.map(f => `<span class="etiqueta">${esc(f)}</span>`).join('') || '<span class="etiqueta">as ferramentas da sessão</span>'}</div>
        <p style="margin-top:8px" class="rotulo">No Claude Code: ${a.ferramentasDeclaradas ? esc(a.ferramentasDeclaradas.join(', ')) : 'todas as ferramentas da sessão'}${a.skills.length ? ` · skill ${esc(a.skills.join(', '))}` : ''}</p>
        ${integ ? `<div class="etiquetas" style="margin-top:8px">${Object.entries(integ).map(([nome, s]) => `<span class="etiqueta" data-ok="${s === 'conectado' ? 'sim' : 'nao'}">${esc(nome)}: ${esc(s)}</span>`).join('')}</div>` : ''}
        ${avisoFigma}
      </section>
      <section class="secao"><h3>Histórico recente</h3>
        ${historico.length ? `<ol class="lista-simples">${historico.map(h => `<li><time>${esc(hora(h.quando))}</time><span>${esc(h.texto)}</span></li>`).join('')}</ol>` : '<p>Ainda sem histórico.</p>'}</section>
    </div>
    <div class="gaveta__pe">
      <button class="botao botao--principal" type="button" data-acao="tarefa-para" data-agente="${esc(a.id)}">Dar uma tarefa</button>
      <span class="rotulo" style="align-self:center;margin-left:auto">${esc(a.arquivo)}</span>
    </div>`;
  $('.gaveta__corpo', gaveta).scrollTop = rolagem;
  gaveta.setAttribute('data-aberta', '');
  gaveta.setAttribute('aria-hidden', 'false');
}

// ---------- detalhe da tarefa ----------
function renderDetalhe() {
  const dlg = $('#dlg-detalhe');
  const t = tarefaPorId(tarefaAberta);
  if (!t) {
    if (dlg.open) dlg.close();
    return;
  }
  const s = situacaoDaTarefa(t);
  const exec = E.sistema.executor.disponivel;
  const estadoDoChip = { andamento: t.tipo === 'revisao' ? 'revisao' : 'trabalhando', espera: 'aguardando', pronta: 'disponivel', concluida: 'concluido', erro: 'erro', cancelada: 'disponivel' }[s];
  const deps = t.dependeDe.map(tarefaPorId).filter(Boolean);
  const seguintes = E.tarefas.filter(o => o.dependeDe.includes(t.id));
  const botoes = [];
  if (s === 'pronta') botoes.push(`<button class="botao botao--principal" type="button" data-acao="iniciar" data-tarefa="${esc(t.id)}" ${exec && t.agente ? '' : 'disabled'}>Iniciar agora</button>`);
  if (s === 'andamento') botoes.push(`<button class="botao botao--perigo" type="button" data-acao="cancelar" data-tarefa="${esc(t.id)}">Cancelar a execução</button>`);
  if (s === 'erro') botoes.push(`<button class="botao botao--principal" type="button" data-acao="iniciar" data-tarefa="${esc(t.id)}" ${exec ? '' : 'disabled'}>Tentar de novo</button>`);
  if (s === 'pronta' || s === 'espera') botoes.push(`<button class="botao" type="button" data-acao="situacao" data-tarefa="${esc(t.id)}" data-para="concluida">Marcar como concluída</button>`);
  if (['concluida', 'cancelada', 'erro'].includes(s)) botoes.push(`<button class="botao" type="button" data-acao="situacao" data-tarefa="${esc(t.id)}" data-para="fila">Voltar para a fila</button>`);
  const esquerda = s === 'andamento' ? '' : `<span class="esquerda"><button class="botao botao--perigo" type="button" data-acao="excluir" data-tarefa="${esc(t.id)}">Excluir</button>${['pronta', 'espera'].includes(s) ? `<button class="botao" type="button" data-acao="situacao" data-tarefa="${esc(t.id)}" data-para="cancelada">Cancelar tarefa</button>` : ''}</span>`;
  const rolagem = $('.dialogo__corpo', dlg)?.scrollTop || 0;
  $('#detalhe').innerHTML = `
    <div class="dialogo__topo">
      <div><h2 id="dd-titulo">${esc(t.titulo)}</h2><p><span class="mono">${esc(t.id)}</span> · ${chip(estadoDoChip).replace(ROTULOS[estadoDoChip], NOME_SITUACAO[s])}</p></div>
      <button class="icone-botao" type="button" data-acao="fechar-detalhe" aria-label="Fechar">${ICONES.fechar}</button>
    </div>
    <div class="dialogo__corpo">
      <dl class="detalhe">
        <dt>Agente</dt><dd>${t.agente ? `${esc(nomeDe(t.agente))} · ${esc(agentePorId(t.agente)?.papel || '')}` : 'Sem dono'}</dd>
        <dt>Projeto e origem</dt><dd>${esc(t.projeto || 'Avulsa')} · ${esc(t.tipo === 'revisao' ? 'revisão' : t.tipo === 'plano' ? 'plano' : 'entrega')} · ${esc(ORIGEM[t.origem] || t.origem)}${t.auto && t.status === 'fila' ? ' · começa sozinha quando ficar pronta' : ''}</dd>
        ${t.descricao ? `<dt>O que fazer</dt><dd><pre>${esc(t.descricao)}</pre></dd>` : ''}
        ${deps.length ? `<dt>Depende de</dt><dd>${deps.map(d => `${esc(d.id)} ${esc(d.titulo)} (${esc(nomeDe(d.agente))}, ${esc(NOME_SITUACAO[situacaoDaTarefa(d)].toLowerCase())})`).join('<br>')}</dd>` : ''}
        ${seguintes.length ? `<dt>Quem espera esta tarefa</dt><dd>${seguintes.map(d => `${esc(d.id)} ${esc(d.titulo)} (${esc(nomeDe(d.agente))})`).join('<br>')}</dd>` : ''}
        ${t.erro ? `<dt>Erro</dt><dd><pre>${esc(t.erro)}</pre></dd>` : ''}
        ${t.entrega ? `<dt>Entrega${t.entrega.em ? ` · ${esc(hora(t.entrega.em))}` : ''}</dt><dd><pre id="texto-entrega">${esc(t.entrega.resumo)}</pre>${t.entrega.tamanho > 1200 ? `<button class="botao botao--pequeno" type="button" data-acao="entrega-inteira" data-tarefa="${esc(t.id)}" style="margin-top:6px">Ver a entrega inteira</button>` : ''}</dd>` : ''}
        <dt>Linha do tempo</dt><dd>Criada ${esc(hora(t.criadaEm))}${t.iniciadaEm ? ` · iniciada ${esc(hora(t.iniciadaEm))}` : ''}${t.concluidaEm ? ` · encerrada ${esc(hora(t.concluidaEm))}` : ''}${t.iniciadaEm && t.concluidaEm ? ` · ${esc(duracao(t.concluidaEm - t.iniciadaEm))}` : ''}${t.execucoes.length ? ` · ${t.execucoes.length} execuç${t.execucoes.length > 1 ? 'ões' : 'ão'}` : ' · nenhuma execução de agente'}</dd>
      </dl>
    </div>
    <div class="dialogo__pe">${esquerda}${botoes.join('')}</div>`;
  $('.dialogo__corpo', dlg).scrollTop = rolagem;
  if (!dlg.open) dlg.showModal();
}

// ---------- formulários ----------
function prepararFormularios() {
  $$('[data-fecha]').forEach(b => {
    if (!b.innerHTML.trim()) b.innerHTML = ICONES.fechar;
    b.addEventListener('click', () => b.closest('dialog').close());
  });
  const formPedido = $('#form-pedido');
  formPedido.addEventListener('change', () => {
    const modo = new FormData(formPedido).get('modo');
    $('#campo-projeto').hidden = modo === 'steve';
    formPedido.elements.projeto.required = modo !== 'steve';
  });
  formPedido.addEventListener('submit', async evento => {
    evento.preventDefault();
    const dados = new FormData(formPedido);
    const erro = $('[data-erro]', formPedido);
    erro.hidden = true;
    try {
      const modo = dados.get('modo');
      if (modo === 'steve') await api('POST', '/api/pedidos', { pedido: dados.get('pedido'), auto: dados.has('auto') });
      else {
        await api('POST', '/api/fluxos', { fluxo: modo, projeto: dados.get('projeto'), pedido: dados.get('pedido'), auto: dados.has('auto') });
        projetoFoco = String(dados.get('projeto')).trim();
      }
      formPedido.reset();
      $('#campo-projeto').hidden = true;
      $('#dlg-pedido').close();
    } catch (falha) {
      erro.textContent = falha.message;
      erro.hidden = false;
    }
  });

  const formTarefa = $('#form-tarefa');
  formTarefa.addEventListener('submit', async evento => {
    evento.preventDefault();
    const dados = new FormData(formTarefa);
    const erro = $('[data-erro]', formTarefa);
    erro.hidden = true;
    try {
      await api('POST', '/api/tarefas', {
        titulo: dados.get('titulo'), descricao: dados.get('descricao'), agente: dados.get('agente'), tipo: dados.get('tipo'),
        projeto: dados.get('projeto'), dependeDe: dados.getAll('dependeDe'), iniciar: evento.submitter?.value === 'iniciar',
      });
      formTarefa.reset();
      $('#dlg-tarefa').close();
    } catch (falha) {
      erro.textContent = falha.message;
      erro.hidden = false;
    }
  });

  $('#abre-pedido').addEventListener('click', () => {
    if (!E) return avisar('O escritório ainda não está conectado. Abra-o no seu computador.');
    $('#opcoes-fluxo').innerHTML = E.sistema.fluxos.map(f => `<label class="opcao" style="margin-top:6px"><input type="radio" name="modo" value="${esc(f.id)}"><div><b>Fluxo pronto: ${esc(f.nome)}</b><span>${esc(f.resumo)}</span></div></label>`).join('');
    $('[data-erro]', formPedido).hidden = true;
    $('#dlg-pedido').showModal();
    formPedido.elements.pedido.focus();
  });
  $('#abre-tarefa').addEventListener('click', () => (E ? abrirNovaTarefa() : avisar('O escritório ainda não está conectado. Abra-o no seu computador.')));
}
function abrirNovaTarefa(agente = '') {
  const form = $('#form-tarefa');
  form.elements.agente.innerHTML = E.equipe.map(a => `<option value="${esc(a.id)}" ${a.id === agente ? 'selected' : ''}>${esc(a.nome)} · ${esc(a.papel)}</option>`).join('');
  const abertas = E.tarefas.filter(t => !['cancelada'].includes(t.status)).slice(-30).reverse();
  form.elements.dependeDe.innerHTML = abertas.map(t => `<option value="${esc(t.id)}">${esc(t.id)} · ${esc(nomeDe(t.agente))} · ${esc(t.titulo)}</option>`).join('');
  $('#lista-projetos').innerHTML = E.projetos.map(p => `<option value="${esc(p.nome)}"></option>`).join('');
  $('[data-erro]', form).hidden = true;
  $('#dlg-tarefa').showModal();
  form.elements.titulo.focus();
}

// ---------- cliques ----------
document.addEventListener('click', async evento => {
  const alvo = evento.target.closest('[data-acao]');
  if (!alvo) return;
  const { acao, tarefa, agente } = alvo.dataset;
  if (acao === 'abrir-tarefa') {
    tarefaAberta = tarefa;
    renderDetalhe();
  } else if (acao === 'fechar-detalhe') {
    tarefaAberta = null;
    $('#dlg-detalhe').close();
  } else if (acao === 'fechar-gaveta') {
    agenteAberto = null;
    renderEstacoes();
    renderGaveta();
  } else if (acao === 'iniciar') {
    await tentar(api, 'POST', `/api/tarefas/${encodeURIComponent(tarefa)}/iniciar`, {});
  } else if (acao === 'cancelar') {
    await tentar(api, 'POST', `/api/tarefas/${encodeURIComponent(tarefa)}/cancelar`, {});
  } else if (acao === 'situacao') {
    await tentar(api, 'PATCH', `/api/tarefas/${encodeURIComponent(tarefa)}`, { status: alvo.dataset.para });
  } else if (acao === 'excluir') {
    if (await tentar(api, 'DELETE', `/api/tarefas/${encodeURIComponent(tarefa)}`, {})) {
      tarefaAberta = null;
      $('#dlg-detalhe').close();
    }
  } else if (acao === 'entrega-inteira') {
    const r = await tentar(api, 'GET', `/api/tarefas/${encodeURIComponent(tarefa)}/entrega`);
    if (r) {
      $('#texto-entrega').textContent = r.texto;
      alvo.remove();
    }
  } else if (acao === 'visto') {
    await tentar(api, 'POST', `/api/agentes/${encodeURIComponent(agente)}/visto`, {});
  } else if (acao === 'tarefa-para') {
    abrirNovaTarefa(agente);
  } else if (acao === 'projeto') {
    await tentar(api, 'POST', `/api/projetos/${encodeURIComponent(alvo.dataset.projeto)}`, { auto: alvo.dataset.auto === '1' });
  } else if (acao === 'alternar-concluidas') {
    mostrarConcluidas = !mostrarConcluidas;
    renderTarefas();
  }
});
document.addEventListener('change', evento => {
  if (evento.target.id === 'troca-projeto') {
    projetoFoco = evento.target.value;
    renderMesa();
  }
});
document.addEventListener('keydown', evento => {
  if (evento.key === 'Escape' && agenteAberto && !$('dialog[open]')) {
    agenteAberto = null;
    renderEstacoes();
    renderGaveta();
  }
});
$('#dlg-detalhe').addEventListener('close', () => (tarefaAberta = null));

// ---------- ciclo ----------
function renderTudo() {
  renderSistema();
  renderAchado();
  renderParede();
  renderEstacoes();
  renderMesa();
  renderTarefas();
  renderAtividade();
  renderGaveta();
  if (tarefaAberta) renderDetalhe();
}
function receber(retrato) {
  E = retrato;
  desvio = retrato.agora - Date.now();
  renderTudo();
}

function ligar() {
  const fonte = new EventSource(`${BASE}/api/eventos`);
  fonte.addEventListener('estado', evento => {
    conexao = 'ao-vivo';
    $('#fechado').hidden = true;
    receber(JSON.parse(evento.data));
  });
  fonte.onerror = () => {
    conexao = 'reconectando';
    if (E) renderSistema();
    else if (LOCAL) $('#achado').textContent = 'Sem resposta do servidor local. Confira se o Escritório está aberto no terminal.';
    else {
      $('#achado').textContent = 'Procurando o Escritório no seu computador…';
      $('#fechado').hidden = false;
    }
  };
}
if (!LOCAL) {
  $('#fechado-porta').textContent = PORTA;
  $('#fechado-tentar').addEventListener('click', () => location.reload());
}

// Relógios ("há 2 min") andam sozinhos; o retrato inteiro é pedido de novo de tempos em tempos, porque um
// "concluído" vira "disponível" pelo passar do tempo, sem evento nenhum.
setInterval(() => {
  if (!E) return;
  for (const el of $$('[data-desde]')) if (el.dataset.desde) el.textContent = ha(Number(el.dataset.desde));
}, 1000);
setInterval(() => {
  if (conexao === 'ao-vivo') fetch(`${BASE}/api/estado`).then(r => r.json()).then(receber).catch(() => {});
}, 30_000);
addEventListener('resize', () => E && renderMesa());

prepararFormularios();
ligar();
