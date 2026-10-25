import type { Evento, NomeAgente } from "../api/tipos";
import { AGENTE } from "../lib/rotulos";

export type EstadoAgente = "aguardando" | "ativo" | "concluido" | "aviso" | "erro";
const AGENTES: NomeAgente[] = ["researcher", "analyst", "verifier"];

/** Deriva o estado de cada agente dos eventos persistidos (o progresso é real, não simulado). */
export function estadosDosAgentes(eventos: Evento[], terminou: boolean): Record<NomeAgente, EstadoAgente> {
  const est: Record<NomeAgente, EstadoAgente> = { orquestrador: "aguardando", researcher: "aguardando", analyst: "aguardando", verifier: "aguardando" };
  let ultimo: NomeAgente | null = null;
  for (const e of eventos) {
    if (e.tipo === "erro") { est[e.agente] = "erro"; continue; }
    if (e.agente !== "orquestrador" && ultimo && ultimo !== e.agente && est[ultimo] === "ativo") est[ultimo] = "concluido";
    if (e.tipo === "inicio" || e.tipo === "progresso") est[e.agente] = est[e.agente] === "erro" ? "erro" : "ativo";
    if (e.tipo === "resultado") est[e.agente] = "concluido";
    if (e.tipo === "aviso" && est[e.agente] !== "erro") est[e.agente] = "aviso";
    if (e.agente !== "orquestrador") ultimo = e.agente;
  }
  est.orquestrador = terminou ? "concluido" : eventos.length ? "ativo" : "aguardando";
  if (terminou) for (const a of AGENTES) if (est[a] === "ativo") est[a] = "concluido";
  return est;
}

const ROTULO_ESTADO: Record<EstadoAgente, string> = { aguardando: "Aguardando", ativo: "Trabalhando", concluido: "Concluído", aviso: "Com avisos", erro: "Falhou" };
const COR_ESTADO: Record<EstadoAgente, string> = { aguardando: "text-suave", ativo: "text-acento", concluido: "text-baixo", aviso: "text-moderado", erro: "text-alto" };

export function PainelAgentes({ eventos, terminou }: { eventos: Evento[]; terminou: boolean }) {
  const est = estadosDosAgentes(eventos, terminou);
  const rodadas = eventos.filter((e) => e.agente === "verifier" && e.tipo === "inicio").length;
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Agentes">
      {AGENTES.map((a, i) => {
        const s = est[a];
        const ultima = [...eventos].reverse().find((e) => e.agente === a);
        return (
          <li key={a} className={`cartao relative overflow-hidden p-4 transition-colors duration-300 ${s === "ativo" ? "border-acento/60" : ""}`}>
            {s === "ativo" && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 animate-pulso bg-acento" />}
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-suave">0{i + 1}</p>
              <p className={`text-xs font-medium ${COR_ESTADO[s]}`} aria-live="polite">{ROTULO_ESTADO[s]}{a === "verifier" && rodadas > 1 ? ` · rodada ${rodadas}` : ""}</p>
            </div>
            <p className="mt-2 font-semibold">{AGENTE[a].rotulo}</p>
            <p className="mt-0.5 text-xs text-suave">{AGENTE[a].funcao}</p>
            <p className="mt-3 min-h-[2.5rem] text-xs text-texto/80 quebra line-clamp-3">{ultima?.mensagem ?? "—"}</p>
          </li>
        );
      })}
    </ol>
  );
}

const ICONE_TIPO: Record<Evento["tipo"], string> = { inicio: "▸", progresso: "·", resultado: "✓", aviso: "!", erro: "×", fim: "■" };
const COR_TIPO: Record<Evento["tipo"], string> = { inicio: "text-acento", progresso: "text-suave", resultado: "text-baixo", aviso: "text-moderado", erro: "text-alto", fim: "text-texto" };

export function LinhaDoTempo({ eventos }: { eventos: Evento[] }) {
  if (!eventos.length) return <p className="text-sm text-suave">Aguardando o primeiro evento…</p>;
  return (
    <ol className="space-y-1.5 font-mono text-xs" aria-live="polite" aria-label="Eventos da execução">
      {eventos.map((e) => (
        <li key={e.seq} className="grid animate-entrar grid-cols-[2.2rem_6.5rem_1fr] gap-2 sm:grid-cols-[2.2rem_7.5rem_1fr]">
          <span className="text-suave">{String(e.seq).padStart(2, "0")}</span>
          <span className={COR_TIPO[e.tipo]}>{ICONE_TIPO[e.tipo]} {AGENTE[e.agente].rotulo}</span>
          <span className="min-w-0 font-sans text-texto/90 quebra">{e.mensagem}</span>
        </li>
      ))}
    </ol>
  );
}
