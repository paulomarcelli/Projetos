import { Check, Circle, X } from "lucide-react";
import { duracao, numero, plural, useAgora } from "../../hooks";
import type { Etapa, Investigacao } from "../../types/api";
import { Carregando, cx } from "../ui";

export const ETAPAS: { nome: string; titulo: string; descricao: string }[] = [
  {
    nome: "recuperacao",
    titulo: "Recuperação",
    descricao: "Busca trechos na base (RAG híbrido) e monta o subgrafo em torno das entidades da questão (GraphRAG).",
  },
  {
    nome: "analise",
    titulo: "Análise prospectiva",
    descricao: "O motor escreve contexto, atores, incertezas, cenários e consequências, citando as evidências.",
  },
  {
    nome: "validacao_e_grafo",
    titulo: "Validação e grafo",
    descricao: "Cada afirmação é conferida contra as evidências; o que não se sustenta é rebaixado ou removido.",
  },
];

type Situacao = "espera" | "andamento" | "feita" | "falhou";

function num(r: Record<string, unknown>, k: string): number | null {
  const v = r[k];
  return typeof v === "number" ? v : null;
}

/** Os números que a etapa devolveu, em frases curtas. */
export function resumoDaEtapa(e: Etapa, rotuloDaEntidade: (id: string) => string): string[] {
  const r = e.resumo ?? {};
  const linhas: string[] = [];
  if (e.nome === "recuperacao") {
    const t = num(r, "trechos");
    if (t !== null) linhas.push(plural(t, "trecho recuperado", "trechos recuperados"));
    const focais = Array.isArray(r.entidades_focais) ? (r.entidades_focais as string[]) : null;
    if (focais) linhas.push(focais.length ? `focais: ${focais.map(rotuloDaEntidade).join(", ")}` : "nenhuma entidade focal reconhecida");
    const n = num(r, "nos"),
      a = num(r, "arestas");
    if (n !== null && a !== null) linhas.push(`${plural(n, "nó", "nós")} e ${plural(a, "aresta")}`);
    const c = num(r, "caminhos");
    if (c !== null) linhas.push(plural(c, "caminho entre as focais", "caminhos entre as focais"));
  } else if (e.nome === "analise") {
    if (typeof r.modo === "string") linhas.push(r.modo === "modelo" ? `motor: modelo${typeof r.modelo === "string" ? ` (${r.modelo})` : ""}` : "motor: determinístico");
    const ev = num(r, "evidencias");
    if (ev !== null) linhas.push(plural(ev, "evidência", "evidências"));
    const ce = num(r, "cenarios");
    if (ce !== null) linhas.push(plural(ce, "cenário"));
  } else if (e.nome === "validacao_e_grafo") {
    const rb = num(r, "rebaixadas"),
      rm = num(r, "removidas"),
      ci = num(r, "citacoes_invalidas"),
      ed = num(r, "entidades_desconhecidas");
    if (rb !== null) linhas.push(`${numero(rb)} rebaixada${rb === 1 ? "" : "s"}`);
    if (rm !== null) linhas.push(`${numero(rm)} removida${rm === 1 ? "" : "s"}`);
    if (ci) linhas.push(plural(ci, "citação inválida", "citações inválidas"));
    if (ed) linhas.push(plural(ed, "entidade desconhecida", "entidades desconhecidas"));
  } else {
    for (const [k, v] of Object.entries(r)) if (typeof v === "number" || typeof v === "string") linhas.push(`${k}: ${v}`);
  }
  return linhas;
}

export interface ProgressoProps {
  investigacao: Investigacao;
  rotuloDaEntidade: (id: string) => string;
  /** mostra o "costuma levar um minuto" e o relógio */
  aoVivo?: boolean;
  className?: string;
}

/** As etapas do backend (recuperação → análise → validação), com o que cada uma já devolveu. */
export function ProgressoDaInvestigacao({ investigacao: inv, rotuloDaEntidade, aoVivo = true, className }: ProgressoProps) {
  const agora = useAgora(aoVivo && (inv.estado !== "concluida" && inv.estado !== "falhou"));
  const decorrido = agora - new Date(inv.criada_em).getTime();
  const falhou = inv.estado === "falhou";
  const conhecidas = new Set(ETAPAS.map((e) => e.nome));
  const lista = [...ETAPAS, ...inv.etapas.filter((e) => !conhecidas.has(e.nome)).map((e) => ({ nome: e.nome, titulo: e.nome, descricao: "" }))];

  const situacoes = lista.map((def): { def: typeof def; etapa?: Etapa; situacao: Situacao } => {
    const etapa = inv.etapas.find((e) => e.nome === def.nome);
    if (etapa?.fim) return { def, etapa, situacao: "feita" };
    if (etapa) return { def, etapa, situacao: falhou ? "falhou" : "andamento" };
    return { def, situacao: "espera" };
  });
  if (falhou && !situacoes.some((s) => s.situacao === "falhou")) {
    const primeira = situacoes.find((s) => s.situacao === "espera");
    if (primeira) primeira.situacao = "falhou";
  }
  const atual = situacoes.find((s) => s.situacao === "andamento");
  const rotuloVivo = inv.estado === "pendente" ? "Na fila: a análise vai começar" : atual ? `${atual.def.titulo} em andamento` : "Finalizando";

  return (
    <div className={cx("rounded-3xl border border-borda bg-superficie p-5 sm:p-7", className)}>
      {aoVivo && !falhou && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Carregando rotulo={rotuloVivo} />
          <p className="text-sm text-texto-suave fr-numeros">
            <span className="font-medium text-texto">{duracao(decorrido)}</span> desde o início · costuma levar cerca de um minuto
          </p>
        </div>
      )}
      <ol className="relative flex flex-col">
        {situacoes.map(({ def, etapa, situacao }, i) => {
          const resumo = etapa && situacao === "feita" ? resumoDaEtapa(etapa, rotuloDaEntidade) : [];
          const tempo = etapa?.fim ? new Date(etapa.fim).getTime() - new Date(etapa.inicio).getTime() : etapa ? agora - new Date(etapa.inicio).getTime() : null;
          const ultima = i === situacoes.length - 1;
          return (
            <li key={def.nome} className="relative flex gap-4 pb-6 last:pb-0" aria-current={situacao === "andamento" ? "step" : undefined}>
              {!ultima && <span aria-hidden="true" className={cx("absolute top-9 bottom-1 left-[1.0625rem] w-px", situacao === "feita" ? "bg-borda-forte" : "bg-borda")} />}
              <span
                aria-hidden="true"
                className={cx(
                  "relative grid size-9 shrink-0 place-items-center rounded-full border",
                  situacao === "feita" && "border-sucesso bg-sucesso-tinta text-sucesso",
                  situacao === "andamento" && "border-escarlate bg-escarlate-tinta text-escarlate",
                  situacao === "espera" && "border-borda-forte bg-superficie-2 text-texto-fraco",
                  situacao === "falhou" && "border-perigo bg-perigo-tinta text-perigo",
                )}
              >
                {situacao === "feita" ? (
                  <Check size={16} strokeWidth={2.25} />
                ) : situacao === "falhou" ? (
                  <X size={16} strokeWidth={2.25} />
                ) : situacao === "andamento" ? (
                  <span className="size-2.5 rounded-full bg-escarlate movimento:animate-pulse" />
                ) : (
                  <Circle size={10} />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className={cx("text-base font-semibold", situacao === "espera" && "text-texto-suave")}>
                    {def.titulo}
                    <span className="sr-only">
                      {situacao === "feita" ? " (concluída)" : situacao === "andamento" ? " (em andamento)" : situacao === "falhou" ? " (falhou)" : " (aguardando)"}
                    </span>
                  </h3>
                  {tempo !== null && <span className="text-xs text-texto-fraco fr-numeros">{duracao(tempo)}</span>}
                </div>
                {def.descricao && <p className="mt-0.5 text-sm text-texto-suave">{def.descricao}</p>}
                {resumo.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {resumo.map((l) => (
                      <li key={l} className="rounded-full border border-borda bg-superficie-2 px-2.5 py-1 text-xs text-texto-suave fr-numeros">
                        {l}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
