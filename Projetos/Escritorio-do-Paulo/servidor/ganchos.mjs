// Ganchos (hooks) do Claude Code: quando o Paulo usa um agente numa conversa normal (no VS Code, no terminal ou no
// app), o Claude Code avisa o escritório a cada passo. Este módulo traduz esses avisos nos mesmos eventos que o
// executor emite. Execuções disparadas pelo próprio escritório chegam marcadas e são ignoradas aqui: para elas a
// fonte é o fluxo de eventos do processo, e contar duas vezes mostraria o mesmo trabalho em dobro.
import { traduzirFerramenta, ehChamadaDeAgente } from './atividade.mjs';

export function criarTradutorDeGanchos({ ehDaEquipe, iniciar, atividade, terminar }) {
  const chamadasPendentes = new Map(); // sessão -> [{ agente, descricao, prompt }]
  const subagentes = new Map(); // agent_id -> chave da execução externa
  const sessoes = new Map(); // sessão iniciada com --agent -> chave da execução externa

  return function receber(p) {
    if (!p || typeof p !== 'object' || p.escritorio_exec) return { ignorado: true };
    const evento = p.hook_event_name;
    const sessao = String(p.session_id || '');
    const tipo = p.agent_type ? String(p.agent_type).toLowerCase() : null;

    // 1. A conversa principal chama um agente: guarda o pedido para casar com o início do subagente.
    if (evento === 'PreToolUse' && !p.agent_id && ehChamadaDeAgente(p.tool_name) && p.tool_input?.subagent_type) {
      const agente = String(p.tool_input.subagent_type).toLowerCase();
      if (ehDaEquipe(agente)) {
        const fila = chamadasPendentes.get(sessao) || [];
        fila.push({ agente, descricao: p.tool_input.description || '', prompt: p.tool_input.prompt || '' });
        chamadasPendentes.set(sessao, fila.slice(-20));
      }
    }

    // 2. Subagente: começa, usa ferramentas e termina.
    if (p.agent_id) {
      if (!tipo || !ehDaEquipe(tipo)) return { ignorado: true };
      const id = String(p.agent_id);
      if (evento === 'SubagentStart') {
        const fila = chamadasPendentes.get(sessao) || [];
        const i = fila.findIndex(c => c.agente === tipo);
        const chamada = i === -1 ? null : fila.splice(i, 1)[0];
        const chave = `g-${id}`;
        subagentes.set(id, chave);
        iniciar({ chave, agente: tipo, titulo: chamada?.descricao || 'Tarefa pedida no Claude Code', prompt: chamada?.prompt || '' });
        return { ok: true };
      }
      const chave = subagentes.get(id);
      if (!chave) return { ignorado: true };
      if (evento === 'PreToolUse') {
        const t = traduzirFerramenta(p.tool_name, p.tool_input);
        atividade(chave, { estado: t.estado, texto: t.texto, ferramenta: p.tool_name });
      } else if (evento === 'PostToolUse') {
        atividade(chave, { estado: 'pensando', texto: 'Analisando o resultado' });
      } else if (evento === 'SubagentStop') {
        subagentes.delete(id);
        terminar(chave, { ok: true, resultado: p.last_assistant_message || '' });
      }
      return { ok: true };
    }

    // 3. Conversa aberta direto com um agente (claude --agent <nome>): cada pedido do Paulo é uma tarefa.
    if (tipo && ehDaEquipe(tipo)) {
      const chave = sessoes.get(sessao);
      if (evento === 'UserPromptSubmit') {
        if (chave) terminar(chave, { ok: true, resultado: '' });
        const nova = `s-${sessao.slice(0, 8)}-${Date.now().toString(36)}`;
        sessoes.set(sessao, nova);
        const texto = String(p.prompt || '').trim();
        iniciar({ chave: nova, agente: tipo, titulo: texto.split('\n')[0].slice(0, 120) || 'Conversa no Claude Code', prompt: texto });
      } else if (evento === 'PreToolUse' && chave) {
        const t = traduzirFerramenta(p.tool_name, p.tool_input);
        atividade(chave, { estado: t.estado, texto: t.texto, ferramenta: p.tool_name });
      } else if (evento === 'PostToolUse' && chave) {
        atividade(chave, { estado: 'pensando', texto: 'Analisando o resultado' });
      } else if (evento === 'Stop' && chave) {
        sessoes.delete(sessao);
        terminar(chave, { ok: true, resultado: p.last_assistant_message || '' });
      }
      return { ok: true };
    }
    return { ignorado: true };
  };
}
