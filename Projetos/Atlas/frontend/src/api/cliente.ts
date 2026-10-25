import type { CadastroEntrada, Caso, Comparacao, Evento, Membro, Perfil, Resultado, ResumoSimulacao, Saude, SimulacaoEntrada, Turma } from "./tipos";

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

const BASE = "/api";

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    // X-ATLAS: cabeçalho de proteção exigido pelo servidor em requisições que alteram dados (bloqueia formulários forjados)
    r = await fetch(BASE + caminho, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", "X-ATLAS": "1", ...(init?.headers ?? {}) } });
  } catch {
    throw new ErroApi(0, "Não foi possível falar com o servidor do ATLAS. Ele está em execução?");
  }
  if (r.status === 204) return undefined as T;
  const corpo = await r.json().catch(() => null);
  if (!r.ok) {
    const det = corpo?.detail;
    const msg = typeof det === "string" ? det : Array.isArray(det) ? det.map((d: { msg?: string }) => d.msg).join("; ") : `Erro HTTP ${r.status}`;
    throw new ErroApi(r.status, msg);
  }
  return corpo as T;
}

export const api = {
  saude: () => pedir<Saude>("/saude"),
  casos: () => pedir<Caso[]>("/casos"),
  caso: (id: string) => pedir<Caso>(`/casos/${encodeURIComponent(id)}`),
  criar: (e: SimulacaoEntrada) => pedir<{ id: string; status: string }>("/simulacoes", { method: "POST", body: JSON.stringify(e) }),
  listar: (turmaId?: string) => pedir<ResumoSimulacao[]>(turmaId ? `/simulacoes?turma_id=${encodeURIComponent(turmaId)}` : "/simulacoes"),
  obter: (id: string) => pedir<Resultado>(`/simulacoes/${encodeURIComponent(id)}`),
  eventos: (id: string, desde: number) => pedir<Evento[]>(`/simulacoes/${encodeURIComponent(id)}/eventos?desde=${desde}`),
  apagar: (id: string) => pedir<void>(`/simulacoes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  comparar: (a: string, b: string) => pedir<Comparacao>(`/comparar?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`),

  // contas
  eu: () => pedir<Perfil>("/auth/eu"),
  entrar: (email: string, senha: string) => pedir<{ usuario: Perfil }>("/auth/entrar", { method: "POST", body: JSON.stringify({ email, senha }) }),
  cadastrar: (d: CadastroEntrada) => pedir<{ usuario: Perfil; turma: Turma | null; codigo_invalido: boolean }>("/auth/cadastro", { method: "POST", body: JSON.stringify(d) }),
  sair: () => pedir<void>("/auth/sair", { method: "POST" }),
  exportarConta: () => pedir<Record<string, unknown>>("/conta/exportar"),
  excluirConta: () => pedir<{ excluido: boolean; simulacoes: number; turmas: number }>("/conta", { method: "DELETE" }),

  // turmas
  turmas: () => pedir<Turma[]>("/turmas"),
  turma: (id: string) => pedir<Turma>(`/turmas/${encodeURIComponent(id)}`),
  criarTurma: (nome: string) => pedir<Turma>("/turmas", { method: "POST", body: JSON.stringify({ nome }) }),
  entrarTurma: (codigo: string) => pedir<Turma>("/turmas/entrar", { method: "POST", body: JSON.stringify({ codigo }) }),
  membros: (id: string) => pedir<Membro[]>(`/turmas/${encodeURIComponent(id)}/membros`),
  removerMembro: (id: string, membro: string) => pedir<void>(`/turmas/${encodeURIComponent(id)}/membros/${encodeURIComponent(membro)}`, { method: "DELETE" }),
  novoCodigo: (id: string) => pedir<Turma>(`/turmas/${encodeURIComponent(id)}/codigo`, { method: "POST" }),
  definirCenario: (id: string, caso_id: string | null, orientacao: string | null) => pedir<Turma>(`/turmas/${encodeURIComponent(id)}/cenario`, { method: "PUT", body: JSON.stringify({ caso_id, orientacao }) }),
  excluirTurma: (id: string) => pedir<void>(`/turmas/${encodeURIComponent(id)}`, { method: "DELETE" }),

  // administração
  adminResumo: () => pedir<{ usuarios: Record<string, number>; turmas: number; simulacoes: number; uso_hoje: Record<string, number> }>("/admin/resumo"),
};
