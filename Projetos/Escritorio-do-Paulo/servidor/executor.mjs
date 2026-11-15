// Executa um agente de verdade: `claude -p --agent <nome> --output-format stream-json` e lê o fluxo de eventos.
// Cada ferramenta usada, cada passagem para outro agente e o resultado final (com tempo e custo) viram eventos
// para o escritório. Nada aqui inventa estado: se o processo não emitiu, o painel não mostra.
import { spawn, spawnSync } from 'node:child_process';
import { traduzirFerramenta, ehChamadaDeAgente, resumirIntegracoes } from './atividade.mjs';

export function criarExecutor({ raizRepo, config, aoEvento }) {
  const binario = process.env.ESCRITORIO_CLAUDE_BIN || 'claude';
  const simulacao = Boolean(process.env.ESCRITORIO_CLAUDE_BIN);
  const ativas = new Map(); // execId -> { processo, agente, tarefaId, temporizador }
  let situacao = null;

  function verificar() {
    if (situacao) return situacao;
    try {
      const r = spawnSync(binario, ['--version'], { encoding: 'utf8', timeout: 8000, shell: process.platform === 'win32' });
      if (r.status === 0) situacao = { disponivel: true, versao: (r.stdout || '').trim().split('\n')[0], binario, simulacao };
      else situacao = { disponivel: false, motivo: (r.stderr || r.error?.message || 'não respondeu').trim().slice(0, 200), binario, simulacao };
    } catch (erro) {
      situacao = { disponivel: false, motivo: erro.message, binario, simulacao };
    }
    return situacao;
  }

  function iniciar({ execId, agente, tarefaId, prompt }) {
    const args = ['-p', prompt, '--agent', agente, '--output-format', 'stream-json', '--verbose', '--permission-mode', config.permissao || 'acceptEdits'];
    const modelo = process.env.ESCRITORIO_MODELO || config.modelo;
    if (modelo) args.push('--model', modelo);
    if (config.ferramentasPermitidas?.length) args.push('--allowedTools', ...config.ferramentasPermitidas);

    const processo = spawn(binario, args, {
      cwd: raizRepo,
      env: { ...process.env, ESCRITORIO_EXEC_ID: execId, ESCRITORIO_TAREFA: tarefaId || '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const registro = { processo, agente, tarefaId, encerrada: false };
    ativas.set(execId, registro);

    const subagentes = new Map(); // tool_use_id -> tipo do subagente
    let resultado = null;
    let limiteAtingido = false;
    let erroDeSaida = '';
    let resto = '';
    const emitir = evento => aoEvento({ execId, tarefaId, ...evento });

    const tratar = d => {
      if (d.type === 'system' && d.subtype === 'init') {
        emitir({ tipo: 'integracoes', agente, modelo: d.model, integracoes: resumirIntegracoes(d.mcp_servers), sessao: d.session_id });
        return;
      }
      if (d.type === 'rate_limit_event' && d.rate_limit_info?.status === 'rejected') {
        limiteAtingido = true;
        return;
      }
      if (d.type === 'assistant' && Array.isArray(d.message?.content)) {
        const quem = d.parent_tool_use_id ? subagentes.get(d.parent_tool_use_id) || agente : agente;
        for (const bloco of d.message.content) {
          if (bloco.type === 'tool_use') {
            const t = traduzirFerramenta(bloco.name, bloco.input);
            if (ehChamadaDeAgente(bloco.name) && bloco.input?.subagent_type) {
              const sub = String(bloco.input.subagent_type).toLowerCase();
              subagentes.set(bloco.id, sub);
              emitir({ tipo: 'subagente-inicio', de: quem, agente: sub, chamada: bloco.id, descricao: bloco.input.description || '' });
            }
            emitir({ tipo: 'atividade', agente: quem, estado: t.estado, texto: t.texto, ferramenta: bloco.name });
          } else if (bloco.type === 'text' && bloco.text?.trim()) {
            emitir({ tipo: 'atividade', agente: quem, estado: 'pensando', texto: 'Escrevendo a resposta' });
          } else if (bloco.type === 'thinking') {
            emitir({ tipo: 'atividade', agente: quem, estado: 'pensando', texto: 'Pensando no próximo passo' });
          }
        }
        return;
      }
      if (d.type === 'user' && Array.isArray(d.message?.content)) {
        for (const bloco of d.message.content) {
          if (bloco.type !== 'tool_result') continue;
          if (subagentes.has(bloco.tool_use_id)) {
            const sub = subagentes.get(bloco.tool_use_id);
            emitir({ tipo: 'subagente-fim', agente: sub, chamada: bloco.tool_use_id, ok: !bloco.is_error });
            if (!d.parent_tool_use_id) emitir({ tipo: 'atividade', agente, estado: 'pensando', texto: `Recebeu a entrega de ${sub}` });
          } else {
            const quem = d.parent_tool_use_id ? subagentes.get(d.parent_tool_use_id) || agente : agente;
            emitir({ tipo: 'atividade', agente: quem, estado: 'pensando', texto: 'Analisando o resultado' });
          }
        }
        return;
      }
      if (d.type === 'result') resultado = d;
    };

    processo.stdout.setEncoding('utf8');
    processo.stdout.on('data', pedaco => {
      resto += pedaco;
      let quebra;
      while ((quebra = resto.indexOf('\n')) !== -1) {
        const linha = resto.slice(0, quebra).trim();
        resto = resto.slice(quebra + 1);
        if (!linha) continue;
        try {
          tratar(JSON.parse(linha));
        } catch {
          // linha que não é JSON (aviso do terminal): ignora
        }
      }
    });
    processo.stderr.setEncoding('utf8');
    processo.stderr.on('data', pedaco => {
      erroDeSaida = (erroDeSaida + pedaco).slice(-2000);
    });

    const encerrar = dados => {
      if (registro.encerrada) return;
      registro.encerrada = true;
      clearTimeout(registro.temporizador);
      ativas.delete(execId);
      emitir({ tipo: 'fim', agente, ...dados });
    };

    processo.on('error', erro => {
      const falta = erro.code === 'ENOENT';
      encerrar({ ok: false, erro: falta ? `O comando "${binario}" não foi encontrado. Instale o Claude Code e entre na sua conta.` : erro.message });
    });
    processo.on('close', codigo => {
      if (registro.cancelada) return encerrar({ ok: false, cancelada: true, erro: registro.motivoCancelamento || 'Execução cancelada.' });
      const texto = resultado?.result ?? '';
      const base = { duracaoMs: resultado?.duration_ms ?? null, custoUsd: resultado?.total_cost_usd ?? null, turnos: resultado?.num_turns ?? null };
      if (limiteAtingido && !texto) return encerrar({ ok: false, erro: 'Limite de uso da conta do Claude atingido. Tente de novo quando a janela reabrir.', ...base });
      if (!resultado) return encerrar({ ok: false, erro: `O Claude Code encerrou sem resultado (código ${codigo}). ${erroDeSaida.trim().split('\n').pop() || ''}`.trim() });
      if (resultado.is_error || codigo !== 0) return encerrar({ ok: false, erro: (texto || resultado.subtype || `Código de saída ${codigo}`).slice(0, 600), resultado: texto, ...base });
      encerrar({ ok: true, resultado: texto, ...base });
    });

    const limite = (config.tempoMaximoMin || 30) * 60_000;
    registro.temporizador = setTimeout(() => cancelar(execId, `Passou do tempo máximo de ${config.tempoMaximoMin || 30} min.`), limite);
    registro.temporizador.unref?.();

    emitir({ tipo: 'inicio', agente, pid: processo.pid });
    return execId;
  }

  function cancelar(execId, motivo = 'Execução cancelada pelo Paulo.') {
    const registro = ativas.get(execId);
    if (!registro) return false;
    registro.cancelada = true;
    registro.motivoCancelamento = motivo;
    registro.processo.kill('SIGTERM');
    setTimeout(() => registro.encerrada || registro.processo.kill('SIGKILL'), 4000).unref?.();
    return true;
  }

  return {
    verificar,
    iniciar,
    cancelar,
    ativas: () => [...ativas.entries()].map(([execId, r]) => ({ execId, agente: r.agente, tarefaId: r.tarefaId })),
    encerrarTudo: () => {
      for (const id of ativas.keys()) cancelar(id, 'O Escritório foi fechado.');
    },
  };
}
