// O motor do escritório: guarda as tarefas, acompanha as execuções reais e calcula o estado de cada agente.
// Um agente só aparece trabalhando, pensando ou pesquisando enquanto existe uma execução viva dele. Sem execução,
// o estado sai das tarefas (aguardando outro agente) ou do último resultado (concluído, com erro), ou é "disponível".
import fs from 'node:fs';
import path from 'node:path';
import { criarLoja } from './loja.mjs';
import { carregarEquipe } from './equipe.mjs';
import * as T from './tarefas.mjs';
import { ajustarParaRevisao } from './atividade.mjs';
import { criarExecutor } from './executor.mjs';
import { criarTradutorDeGanchos } from './ganchos.mjs';
import { FLUXOS, listaDeFluxos } from './fluxos.mjs';

const MAX_EXECUCOES = 400;
const MAX_TRILHA = 40;
const curto = (t, n) => (String(t || '').length > n ? `${String(t).slice(0, n - 1)}…` : String(t || ''));

export function criarMotor({ raizRepo, pastaProjeto, pastaDados, config }) {
  const loja = criarLoja(pastaDados);
  const arquivoEquipe = path.join(pastaProjeto, 'equipe.json');
  const estado = loja.ler('tarefas.json', { tarefas: [], seq: 0 });
  let execucoes = loja.ler('execucoes.json', []);
  const ativas = new Map(); // execId -> execução viva
  const assinantes = new Set();
  let ultimoGancho = loja.ler('sistema.json', {}).ultimoGancho || null;
  let equipe = carregarEquipe(raizRepo, arquivoEquipe);

  const salvarTarefas = () => loja.gravar('tarefas.json', estado);
  const salvarExecucoes = () => {
    execucoes = execucoes.slice(-MAX_EXECUCOES);
    loja.gravar('execucoes.json', execucoes);
  };
  const idsAgentes = () => equipe.map(a => a.id);
  const agentePorId = id => equipe.find(a => a.id === id) || null;
  const nomeDe = id => agentePorId(id)?.nome || id || 'alguém';

  function registrar(tipo, dados) {
    const linha = { quando: Date.now(), tipo, ...dados };
    loja.anexar('historico.jsonl', linha);
    return linha;
  }

  // ---------- avisos para a interface (SSE), agrupados para não mandar um quadro por evento ----------
  let pendente = null;
  function notificar() {
    if (pendente) return;
    pendente = setTimeout(() => {
      pendente = null;
      const dados = `event: estado\ndata: ${JSON.stringify(retrato())}\n\n`;
      for (const escrever of assinantes) escrever(dados);
    }, 80);
    pendente.unref?.();
  }

  // ---------- execuções vivas ----------
  function abrirExecucao({ id, agente, tarefaId, fonte, aPedidoDe = null, pai = null }) {
    const agora = Date.now();
    const exec = {
      id, agente, tarefaId, fonte, aPedidoDe, pai,
      inicio: agora, ultimoSinal: agora,
      estado: 'pensando', desde: agora, atividade: 'Lendo o pedido',
      esperando: [], trilha: [], ferramentas: 0, integracoes: null, modelo: null,
    };
    ativas.set(id, exec);
    return exec;
  }

  function marcarAtividade(exec, { estado: novo, texto, ferramenta }) {
    const agora = Date.now();
    exec.ultimoSinal = agora;
    if (novo && novo !== exec.estado) {
      exec.estado = novo;
      exec.desde = agora;
    }
    if (novo !== 'aguardando') exec.esperando = [];
    if (ferramenta) exec.ferramentas += 1;
    if (texto && texto !== exec.atividade) {
      exec.atividade = texto;
      // A trilha guarda os passos com ferramenta; "pensando" entre um passo e outro não entra.
      if (ferramenta) {
        exec.trilha.push({ quando: agora, texto, estado: novo });
        if (exec.trilha.length > MAX_TRILHA) exec.trilha.shift();
      }
    }
  }

  function fecharExecucao(exec, { ok, erro = null, cancelada = false, duracaoMs = null, custoUsd = null, turnos = null }) {
    ativas.delete(exec.id);
    const fim = Date.now();
    const registro = {
      id: exec.id, agente: exec.agente, tarefaId: exec.tarefaId, fonte: exec.fonte, aPedidoDe: exec.aPedidoDe,
      inicio: exec.inicio, fim, duracaoMs: duracaoMs ?? fim - exec.inicio, custoUsd, turnos,
      ok: Boolean(ok), cancelada, erro, visto: false, ferramentas: exec.ferramentas,
      integracoes: exec.integracoes, modelo: exec.modelo, trilha: exec.trilha.slice(-MAX_TRILHA),
    };
    execucoes.push(registro);
    salvarExecucoes();
    return registro;
  }

  // ---------- eventos do executor (execuções disparadas pelo escritório) ----------
  function aoEventoDoExecutor(ev) {
    const exec = ativas.get(ev.execId);
    if (ev.tipo === 'integracoes' && exec) {
      exec.integracoes = ev.integracoes;
      exec.modelo = ev.modelo;
    } else if (ev.tipo === 'atividade') {
      const alvo = ev.agente === exec?.agente ? exec : [...ativas.values()].find(e => e.pai === ev.execId && e.agente === ev.agente);
      if (alvo) marcarAtividade(alvo, ev);
    } else if (ev.tipo === 'subagente-inicio' && exec && agentePorId(ev.agente)) {
      const filho = abrirExecucao({ id: `${ev.execId}:${ev.chamada}`, agente: ev.agente, tarefaId: exec.tarefaId, fonte: 'executor', aPedidoDe: ev.de, pai: ev.execId });
      filho.atividade = curto(ev.descricao, 70) || 'Lendo o pedido';
      const quemPediu = ev.de === exec.agente ? exec : [...ativas.values()].find(e => e.pai === ev.execId && e.agente === ev.de);
      if (quemPediu) {
        marcarAtividade(quemPediu, { estado: 'aguardando', texto: `Aguardando ${nomeDe(ev.agente)}` });
        quemPediu.esperando = [ev.agente];
      }
      registrar('colaboracao', { agente: ev.agente, tarefaId: exec.tarefaId, de: ev.de, texto: `${nomeDe(ev.de)} passou um trabalho para ${nomeDe(ev.agente)}: ${curto(ev.descricao, 80)}` });
    } else if (ev.tipo === 'subagente-fim') {
      const filho = ativas.get(`${ev.execId}:${ev.chamada}`);
      if (filho) {
        fecharExecucao(filho, { ok: ev.ok, erro: ev.ok ? null : 'O subagente terminou com erro.' });
        registrar('colaboracao', { agente: filho.agente, tarefaId: filho.tarefaId, texto: `${nomeDe(filho.agente)} devolveu o trabalho para ${nomeDe(filho.aPedidoDe)}` });
      }
    } else if (ev.tipo === 'fim' && exec) {
      for (const filho of [...ativas.values()].filter(e => e.pai === ev.execId)) fecharExecucao(filho, { ok: false, erro: 'A execução principal terminou antes.' });
      const registro = fecharExecucao(exec, ev);
      concluirTarefaDaExecucao(registro, ev);
      agendar();
    }
    notificar();
  }

  const executor = criarExecutor({ raizRepo, config, aoEvento: aoEventoDoExecutor });

  function concluirTarefaDaExecucao(registro, ev) {
    const tarefa = T.porId(estado, registro.tarefaId);
    if (!tarefa) return;
    const agora = Date.now();
    if (ev.cancelada) {
      tarefa.status = 'fila';
      tarefa.auto = false;
      tarefa.iniciadaEm = null;
      registrar('tarefa', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${tarefa.id} voltou para a fila: ${ev.erro}` });
    } else if (!ev.ok) {
      tarefa.status = 'erro';
      tarefa.erro = curto(ev.erro || 'Erro sem mensagem.', 600);
      tarefa.concluidaEm = agora;
      if (ev.resultado) guardarEntrega(tarefa, ev.resultado);
      registrar('erro', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${nomeDe(tarefa.agente)} parou com erro em ${tarefa.id}: ${curto(tarefa.erro, 140)}` });
    } else if (tarefa.tipo === 'plano') {
      guardarEntrega(tarefa, ev.resultado);
      const plano = T.extrairPlano(ev.resultado || '');
      try {
        if (!plano) throw new T.ErroDeTarefa('O coordenador não devolveu o plano no formato combinado (bloco json com "tarefas").');
        const r = T.aplicarPlano(estado, plano, equipe, { auto: Boolean(tarefa.planoAuto), origem: 'coordenador', projeto: tarefa.projeto });
        tarefa.status = 'concluida';
        tarefa.concluidaEm = agora;
        tarefa.projeto = r.projeto;
        tarefa.entrega.resumo = `Plano do projeto "${r.projeto}" com ${r.tarefas.length} tarefas: ${r.tarefas.map(t => `${t.id} ${nomeDe(t.agente)}`).join(', ')}.`;
        registrar('plano', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${nomeDe(tarefa.agente)} montou o plano de "${r.projeto}": ${r.tarefas.length} tarefas` });
        for (const aviso of r.avisos) registrar('regra', { agente: 'sofia', tarefaId: tarefa.id, texto: aviso });
      } catch (erro) {
        tarefa.status = 'erro';
        tarefa.erro = erro.message;
        tarefa.concluidaEm = agora;
        registrar('erro', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `O plano de ${tarefa.id} não pôde ser criado: ${erro.message}` });
      }
    } else {
      tarefa.status = 'concluida';
      tarefa.concluidaEm = agora;
      tarefa.erro = null;
      guardarEntrega(tarefa, ev.resultado);
      registrar('entrega', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${nomeDe(tarefa.agente)} concluiu ${tarefa.id}: ${tarefa.titulo}` });
    }
    salvarTarefas();
  }

  function guardarEntrega(tarefa, texto) {
    const inteiro = String(texto || '').trim();
    tarefa.entrega = { resumo: curto(inteiro, 1200) || 'Concluída sem texto de entrega.', em: Date.now(), tamanho: inteiro.length };
    if (inteiro) loja.gravarTexto(path.join('entregas', `${tarefa.id}.md`), inteiro);
  }

  // ---------- ganchos (execuções em conversas do Claude Code) ----------
  const externas = new Map(); // chave do gancho -> execId
  const receberGanchoTraduzido = criarTradutorDeGanchos({
    ehDaEquipe: id => Boolean(agentePorId(id)),
    iniciar({ chave, agente, titulo, prompt }) {
      // Se o pedido cita uma tarefa que já existe na fila desse agente (T-0000), a execução é dela.
      const citada = /\bT-\d{4}\b/.exec(`${titulo} ${prompt}`)?.[0];
      let tarefa = citada ? T.porId(estado, citada) : null;
      if (tarefa && (tarefa.agente !== agente || tarefa.status !== 'fila')) tarefa = null;
      if (!tarefa) {
        tarefa = T.criarTarefa(estado, { titulo: curto(titulo, 150), descricao: curto(prompt, 4000), agente, origem: 'claude-code' }, idsAgentes());
      }
      tarefa.status = 'andamento';
      tarefa.iniciadaEm = Date.now();
      tarefa.execucoes.push(chave);
      abrirExecucao({ id: chave, agente, tarefaId: tarefa.id, fonte: 'gancho' });
      externas.set(chave, chave);
      salvarTarefas();
      registrar('tarefa', { agente, tarefaId: tarefa.id, texto: `${nomeDe(agente)} começou ${tarefa.id} numa conversa do Claude Code: ${tarefa.titulo}` });
    },
    atividade(chave, dados) {
      const exec = ativas.get(chave);
      if (exec) marcarAtividade(exec, dados);
    },
    terminar(chave, { ok, resultado }) {
      const exec = ativas.get(chave);
      if (!exec) return;
      const registro = fecharExecucao(exec, { ok });
      concluirTarefaDaExecucao(registro, { ok, resultado });
      externas.delete(chave);
      agendar();
    },
  });

  function receberGancho(payload) {
    ultimoGancho = Date.now();
    const r = receberGanchoTraduzido(payload);
    if (!r.ignorado) notificar();
    return r;
  }

  // Execução vinda de gancho que parou de dar sinal (conversa fechada no meio): encerra como erro em vez de
  // deixar o agente "trabalhando" para sempre.
  function varrerSemSinal() {
    const limite = (config.semSinalMin || 15) * 60_000;
    let mudou = false;
    for (const exec of [...ativas.values()]) {
      if (exec.fonte !== 'gancho' || Date.now() - exec.ultimoSinal < limite) continue;
      const registro = fecharExecucao(exec, { ok: false, erro: `Sem sinal do Claude Code há ${config.semSinalMin || 15} min.` });
      concluirTarefaDaExecucao(registro, { ok: false, erro: registro.erro });
      mudou = true;
    }
    if (mudou) notificar();
    loja.gravar('sistema.json', { ultimoGancho });
  }
  const varredura = setInterval(varrerSemSinal, 60_000);
  varredura.unref?.();

  // ---------- estado visível de cada agente ----------
  function estadoDe(id) {
    const vivas = [...ativas.values()].filter(e => e.agente === id).sort((a, b) => b.inicio - a.inicio);
    if (vivas.length) {
      const e = vivas[0];
      const tarefa = T.porId(estado, e.tarefaId);
      return {
        estado: ajustarParaRevisao(e.estado, tarefa?.tipo), desde: e.desde, atividade: e.atividade,
        tarefaId: e.tarefaId, execId: e.id, fonte: e.fonte, esperando: e.esperando, esperandoAgora: e.esperando, inicio: e.inicio, aPedidoDe: e.aPedidoDe,
      };
    }
    const ultima = [...execucoes].reverse().find(x => x.agente === id);
    if (ultima && !ultima.ok && !ultima.cancelada && !ultima.visto) {
      return { estado: 'erro', desde: ultima.fim, atividade: curto(ultima.erro, 120), tarefaId: ultima.tarefaId, execId: ultima.id, fonte: ultima.fonte, esperando: [] };
    }
    // Aguardando: tem tarefa na fila presa em outra que está andando (ou num projeto em execução automática).
    for (const t of estado.tarefas) {
      if (t.agente !== id || t.status !== 'fila') continue;
      const { pendentes, travada } = T.bloqueio(estado, t);
      if (!pendentes.length) continue;
      const emCurso = pendentes.some(p => p.status === 'andamento');
      if (!emCurso && !t.auto) continue;
      const donos = [...new Set(pendentes.map(p => p.agente).filter(a => a && a !== id))];
      const agora = [...new Set(pendentes.filter(p => p.status === 'andamento').map(p => p.agente).filter(a => a && a !== id))];
      const desde = Math.max(t.criadaEm, ...pendentes.map(p => p.iniciadaEm || 0));
      return {
        estado: 'aguardando', desde, tarefaId: t.id, execId: null, fonte: 'tarefas', esperando: donos, esperandoAgora: agora, travada,
        atividade: travada ? `Parada: ${pendentes.map(p => p.id).join(', ')} não terminou` : `Espera ${pendentes.map(p => `${p.id} (${nomeDe(p.agente)})`).join(', ')}`,
      };
    }
    const janela = (config.concluidoPorMin || 10) * 60_000;
    if (ultima && ultima.ok && !ultima.visto && Date.now() - ultima.fim < janela) {
      const t = T.porId(estado, ultima.tarefaId);
      return { estado: 'concluido', desde: ultima.fim, atividade: t ? `Entregou ${t.id}` : 'Entregou a tarefa', tarefaId: ultima.tarefaId, execId: ultima.id, fonte: ultima.fonte, esperando: [] };
    }
    return { estado: 'disponivel', desde: ultima?.fim || null, atividade: null, tarefaId: null, execId: null, fonte: null, esperando: [] };
  }

  function metricasDe(id) {
    const minhas = execucoes.filter(x => x.agente === id && !x.cancelada);
    const boas = minhas.filter(x => x.ok);
    const comCusto = minhas.filter(x => typeof x.custoUsd === 'number');
    return {
      execucoes: minhas.length,
      concluidas: boas.length,
      erros: minhas.length - boas.length,
      tempoMedioMs: boas.length ? Math.round(boas.reduce((s, x) => s + (x.duracaoMs || 0), 0) / boas.length) : null,
      custoUsd: comCusto.length ? Number(comCusto.reduce((s, x) => s + x.custoUsd, 0).toFixed(4)) : null,
    };
  }

  function ganchosInstalados() {
    for (const nome of ['settings.json', 'settings.local.json']) {
      try {
        if (fs.readFileSync(path.join(raizRepo, '.claude', nome), 'utf8').includes('ganchos/enviar.mjs')) return true;
      } catch {
        // arquivo ausente
      }
    }
    return false;
  }

  // A equipe é relida do disco no máximo a cada 2 s: agente novo em .claude/agents aparece sem reiniciar.
  let equipeLidaEm = Date.now();
  function avatarPessoal(id) {
    for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'svg']) {
      if (fs.existsSync(path.join(pastaProjeto, 'web', 'avatares', 'pessoais', `${id}.${ext}`))) return `avatares/pessoais/${id}.${ext}`;
    }
    return null;
  }

  function retrato() {
    const agora = Date.now();
    if (agora - equipeLidaEm > 2000) {
      equipe = carregarEquipe(raizRepo, arquivoEquipe);
      equipeLidaEm = agora;
    }
    const meiaNoite = new Date(agora).setHours(0, 0, 0, 0);
    const deHoje = execucoes.filter(x => x.fim >= meiaNoite && !x.cancelada);
    const comCusto = deHoje.filter(x => typeof x.custoUsd === 'number');
    return {
      agora,
      sistema: {
        nome: 'Escritório do Paulo',
        executor: executor.verificar(),
        ganchos: { instalados: ganchosInstalados(), ultimoEvento: ultimoGancho },
        config: { paralelas: config.paralelas || 2, modelo: process.env.ESCRITORIO_MODELO || config.modelo || null, permissao: config.permissao || 'acceptEdits' },
        fluxos: listaDeFluxos(),
      },
      hoje: {
        concluidas: estado.tarefas.filter(t => t.status === 'concluida' && t.concluidaEm >= meiaNoite).length,
        execucoes: deHoje.length,
        custoUsd: comCusto.length ? Number(comCusto.reduce((soma, x) => soma + x.custoUsd, 0).toFixed(4)) : null,
      },
      equipe: equipe.map(a => {
        const est = estadoDe(a.id);
        const viva = est.execId ? ativas.get(est.execId) : null;
        const ultima = [...execucoes].reverse().find(x => x.agente === a.id);
        return {
          ...a,
          avatarPessoal: avatarPessoal(a.id),
          estado: est,
          metricas: metricasDe(a.id),
          integracoes: viva?.integracoes || [...execucoes].reverse().find(x => x.agente === a.id && x.integracoes)?.integracoes || null,
          trilha: viva ? viva.trilha.slice(-12) : (ultima?.trilha || []).slice(-12),
          trilhaAoVivo: Boolean(viva),
          naFila: estado.tarefas.filter(t => t.agente === a.id && t.status === 'fila').length,
        };
      }),
      tarefas: estado.tarefas.map(t => {
        const { pendentes, travada } = T.bloqueio(estado, t);
        return { ...t, bloqueadaPor: pendentes.map(p => p.id), travada, pronta: t.status === 'fila' && pendentes.length === 0 };
      }),
      projetos: T.projetos(estado),
      historico: loja.ultimasLinhas('historico.jsonl', 150).reverse(),
    };
  }

  // ---------- ações ----------
  function montarPrompt(tarefa) {
    const linhas = [];
    if (tarefa.tipo === 'plano') {
      linhas.push(`Pedido do Paulo (${tarefa.id} do Escritório do Paulo):`, '', tarefa.descricao || tarefa.titulo, '');
      linhas.push(`Agentes da equipe: ${equipe.filter(a => a.id !== tarefa.agente).map(a => `${a.id} (${a.papel})`).join(', ')}.`);
      linhas.push('Monte o plano e responda com ele no bloco json do formato descrito no seu arquivo de agente. Não execute as tarefas: só planeje.');
      return linhas.join('\n');
    }
    linhas.push(`Tarefa ${tarefa.id} do Escritório do Paulo${tarefa.projeto ? ` · projeto "${tarefa.projeto}"` : ''}`, '', `Título: ${tarefa.titulo}`);
    if (tarefa.descricao) linhas.push('', 'O que fazer:', tarefa.descricao);
    const anteriores = tarefa.dependeDe.map(id => T.porId(estado, id)).filter(d => d?.entrega);
    if (anteriores.length) {
      linhas.push('', 'Entregas das tarefas anteriores (leia antes de começar):');
      for (const d of anteriores) {
        const inteiro = loja.lerTexto(path.join('entregas', `${d.id}.md`)) || d.entrega.resumo;
        linhas.push('', `— ${d.id} · ${nomeDe(d.agente)} · ${d.titulo}`, curto(inteiro, 3500));
      }
    }
    linhas.push('', 'Siga o seu arquivo de agente e o agentes/PROTOCOLO.md. Termine a resposta com o bloco ENTREGA.');
    return linhas.join('\n');
  }

  function iniciarTarefa(id, { automatico = false } = {}) {
    const tarefa = T.porId(estado, id);
    if (!tarefa) throw new T.ErroDeTarefa(`A tarefa ${id} não existe.`);
    if (!['fila', 'erro'].includes(tarefa.status)) throw new T.ErroDeTarefa(`A tarefa ${id} já está ${tarefa.status === 'andamento' ? 'em andamento' : tarefa.status}.`);
    if (!tarefa.agente) throw new T.ErroDeTarefa('Atribua a tarefa a um agente antes de iniciar.');
    if (!agentePorId(tarefa.agente)) throw new T.ErroDeTarefa(`O agente "${tarefa.agente}" não existe mais na equipe.`);
    const { pendentes } = T.bloqueio(estado, tarefa);
    if (pendentes.length) throw new T.ErroDeTarefa(`Ainda espera ${pendentes.map(p => `${p.id} (${nomeDe(p.agente)})`).join(', ')}.`);
    if ([...ativas.values()].some(e => e.agente === tarefa.agente)) throw new T.ErroDeTarefa(`${nomeDe(tarefa.agente)} já está em outra tarefa.`);
    const situacao = executor.verificar();
    if (!situacao.disponivel) throw new T.ErroDeTarefa(`O Claude Code não está disponível nesta máquina (${situacao.motivo || 'comando não encontrado'}). Sem ele o escritório não executa agentes.`);
    const emExecucao = executor.ativas().length;
    if (automatico && emExecucao >= (config.paralelas || 2)) return null;

    const execId = `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    tarefa.status = 'andamento';
    tarefa.iniciadaEm = Date.now();
    tarefa.concluidaEm = null;
    tarefa.erro = null;
    tarefa.execucoes.push(execId);
    abrirExecucao({ id: execId, agente: tarefa.agente, tarefaId: tarefa.id, fonte: 'executor' });
    salvarTarefas();
    registrar('tarefa', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${nomeDe(tarefa.agente)} começou ${tarefa.id}: ${tarefa.titulo}` });
    executor.iniciar({ execId, agente: tarefa.agente, tarefaId: tarefa.id, prompt: montarPrompt(tarefa) });
    notificar();
    return execId;
  }

  // Começa sozinho o que está marcado como automático e ficou pronto.
  function agendar() {
    if (!executor.verificar().disponivel) return;
    for (const tarefa of estado.tarefas) {
      if (!tarefa.auto || !T.pronta(estado, tarefa) || !tarefa.agente) continue;
      if ([...ativas.values()].some(e => e.agente === tarefa.agente)) continue;
      if (executor.ativas().length >= (config.paralelas || 2)) break;
      try {
        iniciarTarefa(tarefa.id, { automatico: true });
      } catch (erro) {
        registrar('erro', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `${tarefa.id} não pôde começar: ${erro.message}` });
      }
    }
  }

  const acoes = {
    criarTarefa(dados) {
      const tarefa = T.criarTarefa(estado, { ...dados, origem: dados.origem || 'painel' }, idsAgentes());
      salvarTarefas();
      registrar('tarefa', { agente: tarefa.agente, tarefaId: tarefa.id, texto: `Nova tarefa ${tarefa.id}${tarefa.agente ? ` para ${nomeDe(tarefa.agente)}` : ''}: ${tarefa.titulo}` });
      if (dados.iniciar) iniciarTarefa(tarefa.id);
      else agendar();
      notificar();
      return tarefa;
    },
    editarTarefa(id, mudancas) {
      const tarefa = T.porId(estado, id);
      if (!tarefa) throw new T.ErroDeTarefa(`A tarefa ${id} não existe.`);
      if (mudancas.status !== undefined) {
        if (tarefa.status === 'andamento') throw new T.ErroDeTarefa('A tarefa está em andamento: cancele a execução primeiro.');
        if (mudancas.status === 'concluida') {
          tarefa.status = 'concluida';
          tarefa.concluidaEm = Date.now();
          tarefa.erro = null;
          tarefa.entrega = tarefa.entrega || { resumo: 'Marcada como concluída pelo Paulo, sem execução de agente.', em: Date.now(), manual: true };
          registrar('tarefa', { agente: tarefa.agente, tarefaId: id, texto: `${id} marcada como concluída pelo Paulo` });
        } else if (mudancas.status === 'cancelada') {
          tarefa.status = 'cancelada';
          tarefa.concluidaEm = Date.now();
          registrar('tarefa', { agente: tarefa.agente, tarefaId: id, texto: `${id} cancelada pelo Paulo` });
        } else if (mudancas.status === 'fila') {
          tarefa.status = 'fila';
          tarefa.concluidaEm = null;
          tarefa.erro = null;
          registrar('tarefa', { agente: tarefa.agente, tarefaId: id, texto: `${id} voltou para a fila` });
        } else {
          throw new T.ErroDeTarefa('Situação inválida para a tarefa.');
        }
      }
      const { status: _fora, ...resto } = mudancas;
      if (Object.keys(resto).length) T.editarTarefa(estado, id, resto, idsAgentes());
      salvarTarefas();
      agendar();
      notificar();
      return tarefa;
    },
    removerTarefa(id) {
      const tarefa = T.removerTarefa(estado, id);
      salvarTarefas();
      registrar('tarefa', { agente: tarefa.agente, tarefaId: id, texto: `${id} excluída: ${tarefa.titulo}` });
      notificar();
      return tarefa;
    },
    iniciarTarefa,
    cancelarExecucao(id) {
      const tarefa = T.porId(estado, id);
      if (!tarefa || tarefa.status !== 'andamento') throw new T.ErroDeTarefa(`A tarefa ${id} não está em andamento.`);
      const exec = [...ativas.values()].find(e => e.tarefaId === id && !e.pai);
      if (!exec) throw new T.ErroDeTarefa('Não achei a execução dessa tarefa.');
      if (exec.fonte === 'gancho') {
        const registro = fecharExecucao(exec, { ok: false, cancelada: true, erro: 'Desligada do painel pelo Paulo (a conversa no Claude Code continua lá).' });
        concluirTarefaDaExecucao(registro, { ok: false, cancelada: true, erro: registro.erro });
      } else {
        executor.cancelar(exec.id);
      }
      notificar();
      return tarefa;
    },
    // Pedido à coordenação: vira uma tarefa de plano para quem coordena (em equipe.json, "coordena": true), que devolve
    // as tarefas da equipe.
    pedido({ pedido, auto }) {
      const texto = String(pedido || '').trim();
      if (!texto) throw new T.ErroDeTarefa('Escreva o pedido.');
      const coordenador = equipe.find(a => a.coordena)?.id || null;
      if (!coordenador) throw new T.ErroDeTarefa('Ninguém na equipe coordena ("coordena": true em equipe.json). Crie as tarefas direto ou use um fluxo.');
      const tarefa = T.criarTarefa(estado, { titulo: `Planejar: ${curto(texto.split('\n')[0], 110)}`, descricao: texto, agente: coordenador, tipo: 'plano', origem: 'painel' }, idsAgentes());
      tarefa.planoAuto = Boolean(auto);
      salvarTarefas();
      registrar('pedido', { agente: coordenador, tarefaId: tarefa.id, texto: `Novo pedido para ${nomeDe(coordenador)}: ${curto(texto, 140)}` });
      iniciarTarefa(tarefa.id);
      return tarefa;
    },
    plano({ plano, auto, origem }) {
      const r = T.aplicarPlano(estado, plano, equipe, { auto: Boolean(auto), origem: origem || 'plano' });
      salvarTarefas();
      registrar('plano', { agente: null, tarefaId: r.tarefas[0]?.id, texto: `Plano de "${r.projeto}" criado: ${r.tarefas.length} tarefas` });
      for (const aviso of r.avisos) registrar('regra', { agente: 'sofia', tarefaId: r.tarefas[0]?.id, texto: aviso });
      agendar();
      notificar();
      return r;
    },
    fluxo({ fluxo, projeto, pedido, auto }) {
      const modelo = FLUXOS[fluxo];
      if (!modelo) throw new T.ErroDeTarefa('Esse fluxo não existe.');
      const nome = String(projeto || '').trim();
      if (!nome) throw new T.ErroDeTarefa('Dê um nome ao projeto.');
      return acoes.plano({ plano: modelo.plano(nome, String(pedido || nome).trim()), auto, origem: 'fluxo' });
    },
    // Liga ou desliga a execução automática das tarefas de um projeto.
    projeto(nome, { auto }) {
      const tarefas = estado.tarefas.filter(t => t.projeto === nome && t.status === 'fila');
      if (!tarefas.length) throw new T.ErroDeTarefa('Esse projeto não tem tarefas na fila.');
      for (const t of tarefas) t.auto = Boolean(auto);
      salvarTarefas();
      registrar('projeto', { agente: null, tarefaId: tarefas[0].id, texto: auto ? `Projeto "${nome}" em execução: cada tarefa começa quando a anterior termina` : `Projeto "${nome}" pausado` });
      if (auto) agendar();
      notificar();
      return { projeto: nome, tarefas: tarefas.length };
    },
    // "Visto": tira o agente do estado concluído ou com erro.
    reconhecer(id) {
      for (const x of execucoes) if (x.agente === id) x.visto = true;
      salvarExecucoes();
      notificar();
      return { ok: true };
    },
    entrega(id) {
      const tarefa = T.porId(estado, id);
      if (!tarefa) throw new T.ErroDeTarefa(`A tarefa ${id} não existe.`);
      return { id, texto: loja.lerTexto(path.join('entregas', `${id}.md`)) || tarefa.entrega?.resumo || '' };
    },
  };

  // Ao abrir: o que estava "em andamento" quando o escritório fechou não tem mais execução viva.
  let recuperadas = 0;
  for (const t of estado.tarefas) {
    if (t.status !== 'andamento') continue;
    t.status = 'erro';
    t.erro = 'O Escritório foi fechado enquanto esta tarefa rodava. Inicie de novo para repetir.';
    t.concluidaEm = Date.now();
    recuperadas += 1;
  }
  if (recuperadas) {
    salvarTarefas();
    registrar('sistema', { agente: null, texto: `${recuperadas} tarefa(s) estavam em andamento quando o Escritório fechou e ficaram marcadas com erro` });
  }

  return {
    retrato,
    acoes,
    receberGancho,
    assinar(escrever) {
      assinantes.add(escrever);
      return () => assinantes.delete(escrever);
    },
    fechar() {
      clearInterval(varredura);
      clearTimeout(pendente);
      executor.encerrarTudo();
    },
    _interno: { estado, ativas, executor, varrerSemSinal },
  };
}
