// Espelho na nuvem: publica um resumo do escritório num tópico do ntfy.sh, para a página online acompanhar a equipe
// de qualquer lugar (inclusive quando o escritório roda numa sessão do Claude na nuvem, que não alcança o computador
// do Paulo). Só sai o estado de cada agente e as tarefas; nunca o texto das conversas, entregas ou conteúdo de arquivo.
//
// O ntfy.sh gratuito aceita 250 mensagens por dia por IP (e o IP da nuvem é compartilhado), então o espelho só
// publica quando algo que importa muda (estado de um agente, tarefa que começa ou termina) e espera pelo menos
// INTERVALO_MS entre duas publicações; a mudança que chega no meio da espera sai no fim dela.
import crypto from 'node:crypto';

export const SERVIDOR_PADRAO = 'https://ntfy.sh';
export const LIMITE_BYTES = 3900; // o ntfy transforma em anexo o que passa de 4096 bytes
const INTERVALO_MS = 20_000;
const FRESCOR_MS = 180_000;
const MAX_TAREFAS = 12;

const corte = (texto, n) => {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

export const topicoValido = t => /^[A-Za-z0-9_-]{16,64}$/.test(String(t || ''));
export const novoTopico = () => `escritorio-${crypto.randomBytes(12).toString('hex')}`;

// O resumo compacto (v1). A página online faz o caminho de volta em web/js/nuvem.js.
export function resumir(r, { origem, instancia }) {
  const eq = {};
  for (const a of r.equipe) {
    const e = a.estado || {};
    eq[a.id] = [e.estado || 'disponivel', e.desde || null, corte(e.atividade, 70), e.tarefaId || null, e.esperandoAgora || e.esperando || [], a.nome, a.papel, a.cor];
  }
  const abertas = r.tarefas.filter(t => ['fila', 'andamento', 'erro'].includes(t.status));
  const fechadas = r.tarefas.filter(t => !['fila', 'andamento', 'erro'].includes(t.status)).sort((a, b) => (b.concluidaEm || b.criadaEm) - (a.concluidaEm || a.criadaEm));
  const tarefas = [...abertas.slice(-MAX_TAREFAS), ...fechadas].slice(0, MAX_TAREFAS);
  const resumo = {
    v: 1, o: origem, i: instancia, t: r.agora,
    eq,
    tf: tarefas.map(t => [t.id, t.agente, corte(t.titulo, 60), t.status, t.projeto ? corte(t.projeto, 40) : null, t.dependeDe || [], t.tipo || 'entrega', t.criadaEm || null, t.iniciadaEm || null, t.concluidaEm || null]),
    h: r.historico.slice(0, 8).map(h => [h.quando, h.tipo, h.agente || null, corte(h.texto, 80)]),
    hj: [r.hoje.concluidas, r.hoje.custoUsd],
  };
  // Cabe numa mensagem: corta histórico, depois tarefas fechadas, depois textos.
  const tamanho = () => Buffer.byteLength(JSON.stringify(resumo));
  while (tamanho() > LIMITE_BYTES && resumo.h.length) resumo.h.pop();
  while (tamanho() > LIMITE_BYTES && resumo.tf.length > abertas.length) resumo.tf.pop();
  while (tamanho() > LIMITE_BYTES && resumo.tf.length) resumo.tf.pop();
  if (tamanho() > LIMITE_BYTES) for (const id of Object.keys(eq)) eq[id][2] = '';
  return resumo;
}

// O que, mudando, merece uma mensagem na hora: alguém começa, passa a esperar, termina ou falha, e a situação das
// tarefas. Trocar entre pesquisando, pensando e trabalhando na mesma execução acontece a cada ferramenta: isso (e a
// frase do que está fazendo) só vai junto, ou num refresco a cada FRESCOR_MS.
const EM_ATIVIDADE = new Set(['trabalhando', 'pensando', 'pesquisando', 'revisao']);
export function assinatura(resumo) {
  const categoria = e => (EM_ATIVIDADE.has(e) ? 'ativo' : e);
  return JSON.stringify([Object.entries(resumo.eq).map(([id, e]) => [id, categoria(e[0]), e[3], e[4]]), resumo.tf.map(t => [t[0], t[1], t[3]])]);
}
const detalhe = resumo => JSON.stringify(Object.entries(resumo.eq).map(([id, e]) => [id, e[0], e[2]]));

export function criarEspelho({ topico, retrato, origem = 'pc', servidor = SERVIDOR_PADRAO, intervaloMs = INTERVALO_MS, frescorMs = FRESCOR_MS, enviar = null, registrar = () => {} }) {
  if (!topicoValido(topico)) throw new Error('Tópico da nuvem inválido: use de 16 a 64 letras, números, - ou _.');
  const instancia = crypto.randomBytes(4).toString('hex');
  const url = `${servidor.replace(/\/+$/, '')}/${topico}`;
  let ultimaAssinatura = null;
  let ultimoDetalhe = null;
  let ultimoEnvio = 0;
  let pausaAte = 0;
  let agendado = null;
  let soRefresco = false; // o que está agendado é só o refresco da frase (uma mudança de verdade passa na frente)
  let enviando = false;
  let publicadas = 0;

  const mandar = enviar || (async corpo => {
    const resposta = await fetch(url, { method: 'POST', body: corpo, headers: { 'Content-Type': 'text/plain; charset=utf-8', Tags: 'office' } });
    if (resposta.status === 429) {
      const espera = Number(/t=(\d+)/.exec(resposta.headers.get('ratelimit') || '')?.[1]) || 600;
      return { limite: espera };
    }
    if (!resposta.ok) throw new Error(`ntfy respondeu ${resposta.status}`);
    return { ok: true };
  });

  async function publicar(forcar = false, extra = null) {
    if (enviando) return agendar();
    const resumo = extra || resumir(retrato(), { origem, instancia });
    const ass = extra ? null : assinatura(resumo);
    const det = extra ? null : detalhe(resumo);
    const soDetalhe = ass === ultimaAssinatura;
    if (!forcar && soDetalhe && (det === ultimoDetalhe || Date.now() - ultimoEnvio < frescorMs)) {
      if (det !== ultimoDetalhe) agendar(ultimoEnvio + frescorMs - Date.now(), true); // o refresco sai sozinho depois
      return;
    }
    if (Date.now() < pausaAte) return agendar(pausaAte - Date.now());
    enviando = true;
    try {
      const r = await mandar(JSON.stringify(resumo));
      if (r?.limite) {
        pausaAte = Date.now() + r.limite * 1000;
        registrar(`Nuvem: limite diário do ntfy atingido; volto a publicar em ${Math.round(r.limite / 60)} min.`);
        agendar(r.limite * 1000);
      } else {
        ultimaAssinatura = ass;
        ultimoDetalhe = det;
        ultimoEnvio = Date.now();
        publicadas += 1;
      }
    } catch (erro) {
      registrar(`Nuvem: não consegui publicar (${erro.message}).`);
      agendar(intervaloMs * 3);
    } finally {
      enviando = false;
    }
  }

  function agendar(espera = null, refresco = false) {
    if (agendado) return;
    soRefresco = refresco;
    const falta = espera ?? Math.max(0, ultimoEnvio + intervaloMs - Date.now());
    agendado = setTimeout(() => {
      agendado = null;
      soRefresco = false;
      publicar();
    }, falta);
    agendado.unref?.();
  }

  return {
    url,
    origem,
    // chamado a cada mudança do escritório: publica já se faz tempo, senão no fim da espera
    mudou() {
      if (agendado && soRefresco) {
        clearTimeout(agendado);
        agendado = null;
        soRefresco = false;
      }
      if (agendado) return;
      if (Date.now() - ultimoEnvio >= intervaloMs) publicar();
      else agendar();
    },
    abrir: () => publicar(true),
    // ao fechar, avisa que este escritório saiu (a página para de mostrar o que ele dizia)
    async fechar() {
      clearTimeout(agendado);
      agendado = null;
      try {
        await mandar(JSON.stringify({ v: 1, o: origem, i: instancia, t: Date.now(), fim: true }));
      } catch {
        // fechar sem rede: a página percebe pelo tempo sem sinal
      }
    },
    situacao: () => ({ ligada: true, origem, publicadas, pausadaAte: pausaAte > Date.now() ? pausaAte : null }),
  };
}
