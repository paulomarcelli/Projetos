// A equipe vem de dois lugares: os agentes reais do Claude Code (.claude/agents/*.md, com nome, descrição e
// ferramentas) e a identidade de cada um no escritório (equipe.json: papel, cor, avatar, posto).
// Agente novo em .claude/agents aparece sozinho, com uma identidade padrão, até ganhar a sua entrada no equipe.json.
import fs from 'node:fs';
import path from 'node:path';

// Lê o cabeçalho "--- chave: valor ---" de um arquivo de agente. Valores entre aspas duplas são JSON.
export function lerCabecalho(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(texto);
  if (!m) return { dados: {}, corpo: texto };
  const dados = {};
  for (const linha of m[1].split(/\r?\n/)) {
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linha);
    if (!par) continue;
    let valor = par[2].trim();
    if (valor.startsWith('"')) {
      try {
        valor = JSON.parse(valor);
      } catch {
        valor = valor.replace(/^"|"$/g, '');
      }
    } else if (valor.startsWith("'")) {
      valor = valor.replace(/^'|'$/g, '');
    }
    dados[par[1]] = valor;
  }
  return { dados, corpo: texto.slice(m[0].length) };
}

const CORES_PADRAO = ['#8aa0c8', '#c8a08a', '#8ac8a0', '#c88aa0'];

export function carregarEquipe(raizRepo, arquivoEquipe) {
  let identidade = { ordem: [], agentes: {} };
  try {
    identidade = JSON.parse(fs.readFileSync(arquivoEquipe, 'utf8'));
  } catch {
    // sem equipe.json: todos os agentes entram com a identidade padrão
  }
  const pastaAgentes = path.join(raizRepo, '.claude', 'agents');
  const encontrados = new Map();
  let arquivos = [];
  try {
    arquivos = fs.readdirSync(pastaAgentes).filter(a => a.endsWith('.md'));
  } catch {
    // pasta ausente: equipe vazia
  }
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(path.join(pastaAgentes, arquivo), 'utf8');
    const { dados } = lerCabecalho(texto);
    const id = String(dados.name || arquivo.replace(/\.md$/, '')).toLowerCase();
    encontrados.set(id, {
      id,
      arquivo: path.posix.join('.claude/agents', arquivo),
      descricao: String(dados.description || ''),
      modelo: dados.model || 'inherit',
      ferramentasDeclaradas: dados.tools ? String(dados.tools).split(',').map(t => t.trim()).filter(Boolean) : null,
      skills: dados.skills ? String(dados.skills).split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  }

  const ordem = [...(identidade.ordem || [])];
  for (const id of encontrados.keys()) if (!ordem.includes(id)) ordem.push(id);

  const equipe = [];
  let extra = 0;
  for (const id of ordem) {
    const real = encontrados.get(id);
    const visual = identidade.agentes?.[id];
    if (!real) continue; // identidade sem arquivo de agente não entra: o escritório só mostra agente que existe
    const padrao = {
      nome: id.charAt(0).toUpperCase() + id.slice(1),
      papel: 'Agente',
      inspiracao: null,
      cor: CORES_PADRAO[extra % CORES_PADRAO.length],
      avatar: 'padrao',
      tela: 'codigo',
      personalidade: '',
      ferramentas: [],
    };
    if (!visual) extra += 1;
    equipe.push({ ...padrao, ...(visual || {}), ...real, posto: equipe.length + 1, semIdentidade: !visual });
  }
  return equipe;
}
