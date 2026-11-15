// Escritório pela nuvem: a página online ouve o tópico do ntfy.sh em que o escritório (no computador do Paulo ou numa
// sessão do Claude na nuvem) publica um resumo a cada mudança, e remonta o mesmo retrato que o servidor local manda.
// É só leitura: pedidos e tarefas continuam sendo feitos no escritório aberto no computador.
const SERVIDOR = 'https://ntfy.sh';
const CHAVE = 'escritorio.nuvem';
const SEM_SINAL_MS = 20 * 60_000; // escritório que some sem avisar (sessão na nuvem encerrada): para de valer
const valido = t => /^[A-Za-z0-9_-]{16,64}$/.test(String(t || ''));

// O link traz o tópico em #nuvem=…; a página guarda (neste navegador) e tira do endereço, para não vazar num print.
export function topicoDaPagina() {
  const doLink = new URLSearchParams(location.hash.slice(1)).get('nuvem');
  if (doLink !== null) {
    try {
      if (valido(doLink)) localStorage.setItem(CHAVE, doLink);
      else localStorage.removeItem(CHAVE);
    } catch {
      // sem armazenamento: vale só nesta visita
    }
    history.replaceState(null, '', location.pathname + location.search);
    return valido(doLink) ? doLink : null;
  }
  try {
    const guardado = localStorage.getItem(CHAVE);
    return valido(guardado) ? guardado : null;
  } catch {
    return null;
  }
}

export function esquecerTopico() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada guardado
  }
}

const METRICAS_VAZIAS = { execucoes: 0, concluidas: 0, erros: 0, tempoMedioMs: null, custoUsd: null };

// Resumo (v1, servidor/nuvem.mjs) → retrato no formato do servidor local.
export function remontar(r) {
  const tarefas = (r.tf || []).map(([id, agente, titulo, status, projeto, dependeDe, tipo, criadaEm, iniciadaEm, concluidaEm]) => ({
    id, agente, titulo, status, projeto, dependeDe: dependeDe || [], tipo, criadaEm, iniciadaEm, concluidaEm, descricao: '', origem: 'claude-code',
  }));
  const porId = new Map(tarefas.map(t => [t.id, t]));
  for (const t of tarefas) {
    const pendentes = t.dependeDe.map(d => porId.get(d)).filter(d => d && d.status !== 'concluida');
    t.bloqueadaPor = pendentes.map(d => d.id);
    t.travada = pendentes.some(d => d.status === 'erro');
    t.pronta = t.status === 'fila' && !pendentes.length;
  }
  const projetos = new Map();
  for (const t of tarefas) {
    if (!t.projeto || t.tipo === 'plano' || t.status === 'cancelada') continue;
    if (!projetos.has(t.projeto)) projetos.set(t.projeto, { nome: t.projeto, total: 0, concluidas: 0, andamento: 0, erro: 0, criadoEm: t.criadaEm, atualizadoEm: 0, ids: [] });
    const p = projetos.get(t.projeto);
    p.total += 1;
    p.ids.push(t.id);
    if (t.status === 'concluida') p.concluidas += 1;
    if (t.status === 'andamento') p.andamento += 1;
    if (t.status === 'erro') p.erro += 1;
    p.atualizadoEm = Math.max(p.atualizadoEm, t.concluidaEm || t.iniciadaEm || t.criadaEm || 0);
  }
  const equipe = Object.entries(r.eq || {}).map(([id, [estado, desde, atividade, tarefaId, esperando, nome, papel, cor]]) => ({
    id, nome: nome || id, papel: papel || 'Agente', cor: cor || '#7a8aa6', descricao: papel || '', inspiracao: null,
    arquivo: `.claude/agents/${id}.md`, ferramentasDeclaradas: null, skills: [], semIdentidade: false, avatarPessoal: null,
    estado: { estado, desde, atividade: atividade || null, tarefaId, execId: null, fonte: 'nuvem', esperando: esperando || [], esperandoAgora: esperando || [] },
    metricas: METRICAS_VAZIAS, integracoes: null, trilha: [], trilhaAoVivo: false,
    naFila: tarefas.filter(t => t.agente === id && t.status === 'fila').length,
  }));
  return {
    agora: Date.now(),
    nuvem: { origem: r.o, publicadoEm: r.t },
    sistema: {
      nome: 'Escritório do Paulo',
      executor: { disponivel: false, simulacao: false, versao: '', motivo: 'na nuvem a página só acompanha' },
      ganchos: { instalados: true, ultimoEvento: null },
      config: {},
      fluxos: [],
    },
    hoje: { concluidas: r.hj?.[0] || 0, execucoes: 0, custoUsd: r.hj?.[1] ?? null },
    equipe,
    tarefas,
    projetos: [...projetos.values()].filter(p => p.total > 0).sort((a, b) => b.atualizadoEm - a.atualizadoEm),
    historico: (r.h || []).map(([quando, tipo, agente, texto]) => ({ quando, tipo, agente, texto })),
  };
}

// Mais de um escritório pode publicar no mesmo tópico (o do computador e o de uma sessão na nuvem). Vale o que tem
// alguém em atividade; empatando, o mais recente. Quem avisou que fechou ou sumiu há muito tempo sai da conta.
export function escolher(fontes, agora = Date.now()) {
  const vivas = [...fontes.values()].filter(r => !r.fim && agora - r.t < SEM_SINAL_MS);
  if (!vivas.length) return null;
  const ativa = r => Object.values(r.eq || {}).some(e => !['disponivel', 'concluido'].includes(e[0]));
  vivas.sort((a, b) => Number(ativa(b)) - Number(ativa(a)) || b.t - a.t);
  return vivas[0];
}

export function ligarNuvem(topico, { aoReceber, aoSituacao }) {
  const fontes = new Map(); // instância do escritório -> último resumo
  let atual = null;
  const anotar = texto => {
    let r;
    try {
      r = JSON.parse(texto);
    } catch {
      return false;
    }
    if (!r || r.v !== 1 || !r.i) return false;
    const antes = fontes.get(r.i);
    if (antes && antes.t > r.t) return false;
    fontes.set(r.i, r);
    return true;
  };
  const decidir = () => {
    const melhor = escolher(fontes);
    if (!melhor) {
      atual = null;
      aoSituacao('vazio');
      return;
    }
    if (melhor === atual) return;
    atual = melhor;
    aoReceber(remontar(melhor));
  };

  // 1) o que já está guardado no ntfy (as últimas horas), 2) o que chegar daqui para frente
  fetch(`${SERVIDOR}/${topico}/json?poll=1&since=12h`)
    .then(r => (r.ok ? r.text() : ''))
    .then(texto => {
      for (const linha of texto.split('\n')) {
        try {
          const m = JSON.parse(linha);
          if (m.event === 'message') anotar(m.message);
        } catch {
          // linha vazia
        }
      }
      decidir();
    })
    .catch(() => aoSituacao('sem-rede'));

  const fonte = new EventSource(`${SERVIDOR}/${topico}/sse`);
  fonte.addEventListener('open', () => aoSituacao('ao-vivo'));
  fonte.onmessage = evento => {
    try {
      const m = JSON.parse(evento.data);
      if (m.event === 'message' && anotar(m.message)) decidir();
    } catch {
      // mensagem que não é do escritório
    }
  };
  fonte.onerror = () => aoSituacao('reconectando');
  // fontes que somem sem avisar deixam de valer com o tempo
  const relogio = setInterval(decidir, 60_000);
  return () => {
    fonte.close();
    clearInterval(relogio);
  };
}
