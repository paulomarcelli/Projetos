import type { Caso, Comparacao, Evento, Resultado, ResumoSimulacao, Saude, SimulacaoEntrada } from "./tipos";

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) { super(mensagem); }
}

const BASE = "/api";

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(BASE + caminho, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
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
  listar: () => pedir<ResumoSimulacao[]>("/simulacoes"),
  obter: (id: string) => pedir<Resultado>(`/simulacoes/${encodeURIComponent(id)}`),
  eventos: (id: string, desde: number) => pedir<Evento[]>(`/simulacoes/${encodeURIComponent(id)}/eventos?desde=${desde}`),
  apagar: (id: string) => pedir<void>(`/simulacoes/${encodeURIComponent(id)}`, { method: "DELETE" }),
  comparar: (a: string, b: string) => pedir<Comparacao>(`/comparar?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`),
};
