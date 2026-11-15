// Traduz o uso de uma ferramenta do Claude Code no estado visível do agente e numa frase curta.
// É a única ponte entre "o que a execução está fazendo" e "o que o escritório mostra".
import path from 'node:path';

export const ESTADOS = ['disponivel', 'trabalhando', 'pensando', 'pesquisando', 'aguardando', 'revisao', 'concluido', 'erro'];

const curto = (texto, max = 70) => {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};
const arquivo = caminho => (caminho ? path.basename(String(caminho)) : 'um arquivo');

// Ferramentas que disparam outro agente
export const ehChamadaDeAgente = nome => nome === 'Agent' || nome === 'Task';

export function traduzirFerramenta(nome, entrada = {}) {
  const n = String(nome || '');
  if (ehChamadaDeAgente(n)) {
    return { estado: 'aguardando', texto: `Passou para ${entrada.subagent_type || 'outro agente'}: ${curto(entrada.description || '', 50)}` };
  }
  if (n === 'Read') return { estado: 'pesquisando', texto: `Lendo ${arquivo(entrada.file_path)}` };
  if (n === 'Grep') return { estado: 'pesquisando', texto: `Procurando "${curto(entrada.pattern, 40)}" no projeto` };
  if (n === 'Glob') return { estado: 'pesquisando', texto: `Procurando arquivos ${curto(entrada.pattern, 40)}` };
  if (n === 'WebSearch') return { estado: 'pesquisando', texto: `Buscando na internet: ${curto(entrada.query, 50)}` };
  if (n === 'WebFetch') return { estado: 'pesquisando', texto: `Lendo ${curto(String(entrada.url || '').replace(/^https?:\/\//, ''), 50)}` };
  if (n === 'Skill') return { estado: 'pesquisando', texto: `Consultando a skill ${curto(entrada.skill, 40)}` };
  if (n === 'ToolSearch' || n === 'ListSkills' || n === 'SearchSkills') return { estado: 'pesquisando', texto: 'Procurando a ferramenta certa' };
  if (n === 'Edit' || n === 'NotebookEdit') return { estado: 'trabalhando', texto: `Editando ${arquivo(entrada.file_path || entrada.notebook_path)}` };
  if (n === 'Write') return { estado: 'trabalhando', texto: `Escrevendo ${arquivo(entrada.file_path)}` };
  if (n === 'Bash') return { estado: 'trabalhando', texto: `No terminal: ${curto(entrada.description || entrada.command, 56)}` };
  if (n === 'TaskCreate' || n === 'TaskUpdate' || n === 'TodoWrite') return { estado: 'pensando', texto: 'Organizando o plano em tarefas' };
  if (/figma/i.test(n)) {
    const acao = n.split('__').pop();
    const leitura = /^(get_|search_|whoami|list_)/.test(acao);
    return { estado: leitura ? 'pesquisando' : 'trabalhando', texto: leitura ? 'Olhando o arquivo no Figma' : 'Trabalhando no Figma' };
  }
  if (/notion/i.test(n)) return { estado: 'pesquisando', texto: 'Consultando o Notion' };
  if (n.startsWith('mcp__')) return { estado: 'trabalhando', texto: `Usando ${curto(n.split('__').slice(1).join(' · '), 44)}` };
  return { estado: 'trabalhando', texto: `Usando ${curto(n, 44)}` };
}

// Numa tarefa de revisão, "trabalhando" aparece como "em revisão".
export function ajustarParaRevisao(estado, tipoDaTarefa) {
  return tipoDaTarefa === 'revisao' && estado === 'trabalhando' ? 'revisao' : estado;
}

// Integrações que importam para a equipe, a partir da lista de servidores MCP que a execução informa ao começar.
export function resumirIntegracoes(servidores = []) {
  const achar = palavra => servidores.filter(s => new RegExp(palavra, 'i').test(s.name || ''));
  const situacao = lista => {
    if (!lista.length) return 'ausente';
    if (lista.some(s => s.status === 'connected')) return 'conectado';
    if (lista.some(s => s.status === 'needs-auth')) return 'precisa de autorização';
    if (lista.some(s => s.status === 'pending')) return 'conectando';
    return 'falhou';
  };
  return { figma: situacao(achar('figma')), notion: situacao(achar('notion')), github: situacao(achar('github')) };
}
