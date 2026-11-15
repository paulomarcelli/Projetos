// Regras das tarefas: criação, dependências, o que está pronto para começar e os planos do coordenador.
// Funções puras sobre { tarefas, seq }: quem grava é o servidor.

export const STATUS = ['fila', 'andamento', 'concluida', 'erro', 'cancelada'];
export const TIPOS = ['entrega', 'revisao', 'plano'];

export class ErroDeTarefa extends Error {}

const limpar = (texto, max) => String(texto ?? '').replace(/\s+$/g, '').slice(0, max);

export function novoId(estado) {
  estado.seq = (estado.seq || 0) + 1;
  return `T-${String(estado.seq).padStart(4, '0')}`;
}

export function porId(estado, id) {
  return estado.tarefas.find(t => t.id === id) || null;
}

// Uma dependência nova não pode fechar um ciclo (A espera B que espera A).
function fechaCiclo(estado, idTarefa, dependeDe) {
  const visitados = new Set();
  const pilha = [...dependeDe];
  while (pilha.length) {
    const id = pilha.pop();
    if (id === idTarefa) return true;
    if (visitados.has(id)) continue;
    visitados.add(id);
    const t = porId(estado, id);
    if (t) pilha.push(...t.dependeDe);
  }
  return false;
}

export function criarTarefa(estado, dados, idsAgentes, agora = Date.now()) {
  const titulo = limpar(dados.titulo, 160).trim();
  if (!titulo) throw new ErroDeTarefa('A tarefa precisa de um título.');
  const agente = dados.agente ? String(dados.agente).toLowerCase() : null;
  if (agente && !idsAgentes.includes(agente)) throw new ErroDeTarefa(`Não existe o agente "${agente}" na equipe.`);
  const dependeDe = [...new Set((dados.dependeDe || []).map(String))];
  for (const id of dependeDe) {
    if (!porId(estado, id)) throw new ErroDeTarefa(`A tarefa ${id}, de que esta depende, não existe.`);
  }
  const tipo = TIPOS.includes(dados.tipo) ? dados.tipo : 'entrega';
  const tarefa = {
    id: novoId(estado),
    titulo,
    descricao: limpar(dados.descricao, 6000),
    agente,
    projeto: limpar(dados.projeto, 80).trim() || null,
    tipo,
    dependeDe,
    status: 'fila',
    auto: Boolean(dados.auto),
    origem: dados.origem || 'painel',
    criadaEm: agora,
    iniciadaEm: null,
    concluidaEm: null,
    entrega: null,
    erro: null,
    execucoes: [],
  };
  estado.tarefas.push(tarefa);
  return tarefa;
}

export function editarTarefa(estado, id, mudancas, idsAgentes) {
  const t = porId(estado, id);
  if (!t) throw new ErroDeTarefa(`A tarefa ${id} não existe.`);
  if (t.status === 'andamento') throw new ErroDeTarefa('A tarefa está em andamento: cancele a execução antes de editar.');
  if (mudancas.titulo !== undefined) {
    const titulo = limpar(mudancas.titulo, 160).trim();
    if (!titulo) throw new ErroDeTarefa('A tarefa precisa de um título.');
    t.titulo = titulo;
  }
  if (mudancas.descricao !== undefined) t.descricao = limpar(mudancas.descricao, 6000);
  if (mudancas.projeto !== undefined) t.projeto = limpar(mudancas.projeto, 80).trim() || null;
  if (mudancas.agente !== undefined) {
    const agente = mudancas.agente ? String(mudancas.agente).toLowerCase() : null;
    if (agente && !idsAgentes.includes(agente)) throw new ErroDeTarefa(`Não existe o agente "${agente}" na equipe.`);
    t.agente = agente;
  }
  if (mudancas.tipo !== undefined && TIPOS.includes(mudancas.tipo)) t.tipo = mudancas.tipo;
  if (mudancas.auto !== undefined) t.auto = Boolean(mudancas.auto);
  if (mudancas.dependeDe !== undefined) {
    const dependeDe = [...new Set(mudancas.dependeDe.map(String))].filter(d => d !== id);
    for (const d of dependeDe) if (!porId(estado, d)) throw new ErroDeTarefa(`A tarefa ${d} não existe.`);
    if (fechaCiclo(estado, id, dependeDe)) throw new ErroDeTarefa('Essa dependência fecharia um ciclo entre as tarefas.');
    t.dependeDe = dependeDe;
  }
  return t;
}

export function removerTarefa(estado, id) {
  const t = porId(estado, id);
  if (!t) throw new ErroDeTarefa(`A tarefa ${id} não existe.`);
  if (t.status === 'andamento') throw new ErroDeTarefa('A tarefa está em andamento: cancele a execução antes de excluir.');
  const dependentes = estado.tarefas.filter(o => o.dependeDe.includes(id) && !['concluida', 'cancelada'].includes(o.status));
  if (dependentes.length) {
    throw new ErroDeTarefa(`${dependentes.map(d => d.id).join(', ')} depende(m) desta tarefa. Exclua ou edite essas antes.`);
  }
  estado.tarefas = estado.tarefas.filter(o => o.id !== id);
  for (const o of estado.tarefas) o.dependeDe = o.dependeDe.filter(d => d !== id);
  return t;
}

// O que ainda segura uma tarefa: dependências que não terminaram. "travada" = uma delas deu erro ou foi cancelada.
export function bloqueio(estado, tarefa) {
  const pendentes = [];
  let travada = false;
  for (const id of tarefa.dependeDe) {
    const dep = porId(estado, id);
    if (!dep || dep.status === 'concluida') continue;
    pendentes.push(dep);
    if (dep.status === 'erro' || dep.status === 'cancelada') travada = true;
  }
  return { pendentes, travada };
}

export function pronta(estado, tarefa) {
  return tarefa.status === 'fila' && bloqueio(estado, tarefa).pendentes.length === 0;
}

export function projetos(estado) {
  const mapa = new Map();
  for (const t of estado.tarefas) {
    if (!t.projeto) continue;
    if (!mapa.has(t.projeto)) mapa.set(t.projeto, { nome: t.projeto, total: 0, concluidas: 0, andamento: 0, erro: 0, criadoEm: t.criadaEm, atualizadoEm: 0, ids: [] });
    const p = mapa.get(t.projeto);
    if (t.tipo === 'plano') continue; // o plano do coordenador organiza o projeto, não conta como entrega dele
    if (t.status === 'cancelada') continue;
    p.total += 1;
    p.ids.push(t.id);
    if (t.status === 'concluida') p.concluidas += 1;
    if (t.status === 'andamento') p.andamento += 1;
    if (t.status === 'erro') p.erro += 1;
    p.atualizadoEm = Math.max(p.atualizadoEm, t.concluidaEm || t.iniciadaEm || t.criadaEm);
  }
  return [...mapa.values()].filter(p => p.total > 0).sort((a, b) => b.atualizadoEm - a.atualizadoEm);
}

// Extrai o plano (bloco ```json … ```) da resposta do coordenador.
export function extrairPlano(texto) {
  const candidatos = [];
  const cerca = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let m;
  while ((m = cerca.exec(texto))) candidatos.push(m[1]);
  const abre = texto.indexOf('{');
  const fecha = texto.lastIndexOf('}');
  if (abre !== -1 && fecha > abre) candidatos.push(texto.slice(abre, fecha + 1));
  for (const c of candidatos) {
    try {
      const plano = JSON.parse(c);
      if (plano && Array.isArray(plano.tarefas)) return plano;
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

// Cria as tarefas de um plano. Aplica a regra permanente: interface nova só começa depois do Design System da Sofia.
export function aplicarPlano(estado, plano, equipe, opcoes = {}) {
  if (!plano || !Array.isArray(plano.tarefas) || plano.tarefas.length === 0) {
    throw new ErroDeTarefa('O plano não tem tarefas.');
  }
  if (plano.tarefas.length > 40) throw new ErroDeTarefa('O plano tem tarefas demais (máximo de 40).');
  const ids = equipe.map(a => a.id);
  const projeto = limpar(plano.projeto, 80).trim() || opcoes.projeto || 'Projeto sem nome';
  const itens = plano.tarefas.map((t, i) => ({
    chave: String(t.chave || `t${i + 1}`),
    agente: String(t.agente || '').toLowerCase(),
    titulo: t.titulo,
    descricao: t.descricao || '',
    dependeDe: (t.dependeDe || []).map(String),
    tipo: t.tipo === 'revisao' ? 'revisao' : 'entrega',
  }));

  const chaves = new Set();
  for (const item of itens) {
    if (chaves.has(item.chave)) throw new ErroDeTarefa(`O plano repete a chave "${item.chave}".`);
    chaves.add(item.chave);
    if (!ids.includes(item.agente)) throw new ErroDeTarefa(`O plano usa o agente "${item.agente}", que não existe na equipe.`);
    if (!String(item.titulo || '').trim()) throw new ErroDeTarefa(`A tarefa "${item.chave}" do plano está sem título.`);
  }
  for (const item of itens) {
    for (const d of item.dependeDe) {
      if (!chaves.has(d)) throw new ErroDeTarefa(`A tarefa "${item.chave}" depende de "${d}", que não está no plano.`);
    }
  }

  // Regra do Design System: quem implementa interface depende de uma tarefa da Sofia.
  const avisos = [];
  const exigem = new Set(equipe.filter(a => a.exigeDesignSystem).map(a => a.id));
  const temSofia = ids.includes('sofia');
  const deInterface = itens.filter(i => exigem.has(i.agente));
  if (temSofia && deInterface.length && !plano.designSystem) {
    let ds = itens.find(i => i.agente === 'sofia');
    if (!ds) {
      ds = {
        chave: 'design-system',
        agente: 'sofia',
        titulo: 'Design System no Figma',
        descricao:
          'Criar ou atualizar o Design System do projeto no Figma (tokens, tipografia, espaçamentos, componentes, estados e telas) e documentar em docs/design-system.md para quem vai implementar. Se o Figma não estiver disponível, dizer isso na entrega.',
        dependeDe: [],
        tipo: 'entrega',
      };
      itens.unshift(ds);
      avisos.push('O plano não tinha Design System: a tarefa da Sofia foi acrescentada (regra permanente).');
    }
    const dependeDaSofia = (item, vistos = new Set()) => {
      if (vistos.has(item.chave)) return false;
      vistos.add(item.chave);
      return item.dependeDe.some(d => {
        const dep = itens.find(i => i.chave === d);
        return dep && (dep.agente === 'sofia' || dependeDaSofia(dep, vistos));
      });
    };
    for (const item of deInterface) {
      if (!dependeDaSofia(item)) {
        item.dependeDe.push(ds.chave);
        avisos.push(`"${item.titulo}" passou a depender do Design System da Sofia.`);
      }
    }
  }

  // Ciclos dentro do plano
  const estadoVisita = new Map();
  const visita = chave => {
    if (estadoVisita.get(chave) === 2) return;
    if (estadoVisita.get(chave) === 1) throw new ErroDeTarefa('O plano tem um ciclo de dependências.');
    estadoVisita.set(chave, 1);
    for (const d of itens.find(i => i.chave === chave).dependeDe) visita(d);
    estadoVisita.set(chave, 2);
  };
  for (const item of itens) visita(item.chave);

  // Cria na ordem das dependências, para os ids já existirem.
  const criadas = new Map();
  const cria = item => {
    if (criadas.has(item.chave)) return criadas.get(item.chave);
    const deps = item.dependeDe.map(d => cria(itens.find(i => i.chave === d)).id);
    const tarefa = criarTarefa(
      estado,
      { titulo: item.titulo, descricao: item.descricao, agente: item.agente, projeto, tipo: item.tipo, dependeDe: deps, auto: opcoes.auto, origem: opcoes.origem || 'coordenador' },
      ids,
      opcoes.agora,
    );
    criadas.set(item.chave, tarefa);
    return tarefa;
  };
  for (const item of itens) cria(item);
  return { projeto, tarefas: [...criadas.values()], avisos };
}
