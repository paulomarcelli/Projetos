import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { CategoriaTempo, CenarioId, EventoTempo } from "../../lib/investigacao";
import { useResultado } from "./contexto";
import { CATEGORIA, GlifoTempo, Letra } from "./pecas";

const ESTILO_CARTAO: Record<CategoriaTempo, string> = {
  // Observado: sólido. Inferido: tracejado neutro. Condicional e projetado: tracejado âmbar, sem preenchimento.
  observado: "border-linha-forte bg-grafite-alto/70",
  inferido: "border-dashed border-texto-3/60 bg-grafite/40",
  condicional: "border-dashed border-ambar/55 bg-transparent",
  projetado: "border-dashed border-ambar/35 bg-transparent",
};

function Cartao({ ev }: { ev: EventoTempo }) {
  const { selecao, selecionar } = useResultado();
  const ativo = selecao?.tipo === "evento" && selecao.id === ev.id;
  return (
    <button
      type="button"
      onClick={() => selecionar({ tipo: "evento", id: ev.id })}
      aria-pressed={ativo}
      className={`flex w-full min-w-0 flex-col gap-1 rounded-padrao border p-2.5 text-left transition-colors ${ESTILO_CARTAO[ev.categoria]} ${
        ativo ? "outline-2 outline-offset-1 outline-ciano" : "hover:border-texto-2"
      }`}
    >
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-micro text-texto-3">
        <GlifoTempo c={ev.categoria} tamanho={12} />
        <span className="sr-only">{CATEGORIA[ev.categoria].rotulo}:</span>
        <span className="font-dados">{ev.data}</span>
        {ev.agendado && <span>· agendado</span>}
        {ev.inflexao && <span className="text-ambar">· inflexão</span>}
      </span>
      <span className={`text-legenda ${ev.categoria === "observado" ? "text-texto" : ev.categoria === "inferido" ? "text-texto-2" : "text-texto italic"}`}>{ev.texto}</span>
      {ev.sinais && ev.sinais.length > 0 && <span className="text-micro text-ambar">Indicador de alerta associado</span>}
    </button>
  );
}

export function LinhaDoTempo() {
  const { r, ix, vista, selecao } = useResultado();
  const [categorias, setCategorias] = useState<Set<CategoriaTempo>>(new Set(["observado", "inferido", "condicional", "projetado"]));
  const [ator, setAtor] = useState("");
  const [horizonte, setHorizonte] = useState<string>("todos");
  const [estreito, setEstreito] = useState(false);

  // No celular, um horizonte por vez (navegação progressiva). No desktop, todos.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const aplicar = () => {
      setEstreito(mq.matches);
      setHorizonte((h) => (mq.matches && h === "todos" ? r.horizontes[0].id : h));
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [r.horizontes]);

  const atorSel = selecao?.tipo === "ator" ? selecao.id : null;
  const visivel = (ev: EventoTempo) => categorias.has(ev.categoria) && (!ator || ev.atores.includes(ator));
  const horizontes = horizonte === "todos" ? r.horizontes : r.horizontes.filter((h) => h.id === horizonte);
  const noHorizonte = (h: (typeof r.horizontes)[number]) => r.linhaDoTempo.filter((ev) => ev.ano >= h.inicio && ev.ano <= h.fim && visivel(ev));
  const colunas: ("comum" | CenarioId)[] = ["comum", ...r.cenarios.map((c) => c.id)];
  const doCenario = (lista: EventoTempo[], col: "comum" | CenarioId) => lista.filter((ev) => (col === "comum" ? !ev.cenarios : ev.cenarios?.includes(col)));
  const idxH = r.horizontes.findIndex((h) => h.id === horizonte);

  const alternarCategoria = (c: CategoriaTempo) =>
    setCategorias((s) => {
      const n = new Set(s);
      if (n.has(c) && n.size > 1) n.delete(c);
      else n.add(c);
      return n;
    });

  return (
    <div className="flex flex-col gap-5">
      {/* filtros */}
      <div className="flex flex-col gap-3 rounded-padrao border border-linha p-3">
        <div role="group" aria-label="Categorias de informação" className="flex flex-wrap items-center gap-1.5">
          <span className="text-micro text-texto-3">Categoria</span>
          {(Object.keys(CATEGORIA) as CategoriaTempo[]).map((c) => (
            <button key={c} type="button" className="ficha min-h-9" aria-pressed={categorias.has(c)} onClick={() => alternarCategoria(c)} title={CATEGORIA[c].descricao}>
              <GlifoTempo c={c} tamanho={12} />
              {CATEGORIA[c].rotulo}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="group" aria-label="Horizonte" className="flex flex-wrap items-center gap-1.5">
            <span className="text-micro text-texto-3">Horizonte</span>
            {!estreito && (
              <button type="button" className="ficha min-h-9" aria-pressed={horizonte === "todos"} onClick={() => setHorizonte("todos")}>
                Todos
              </button>
            )}
            {r.horizontes.map((h) => (
              <button key={h.id} type="button" className="ficha min-h-9" aria-pressed={horizonte === h.id} onClick={() => setHorizonte(h.id)}>
                {h.nome}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-micro text-texto-3">
            Ator
            <select value={ator} onChange={(e) => setAtor(e.target.value)} className="campo min-h-9 w-auto py-1 text-legenda">
              <option value="">Todos</option>
              {r.atores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.curto}
                </option>
              ))}
            </select>
          </label>
          {atorSel && atorSel !== ator && (
            <button type="button" className="ficha min-h-9" onClick={() => setAtor(atorSel)}>
              Filtrar por {ix.atores.get(atorSel)?.curto}
            </button>
          )}
          {ator && (
            <button type="button" className="ficha min-h-9" onClick={() => setAtor("")} aria-label={`Remover filtro de ator ${ix.atores.get(ator)?.curto}`}>
              {ix.atores.get(ator)?.curto}
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="text-micro text-texto-3">
          {vista === "presente" ? "Mostrando os três cenários. " : `Cenário ${vista} em destaque. `}
          Use a vista no topo para trocar. Horizontes definidos para este tema: {r.horizontes.map((h) => `${h.nome.toLowerCase()} ${h.inicio === h.fim ? h.inicio : `${h.inicio}–${h.fim}`}`).join("; ")}.
        </p>
      </div>

      {estreito ? (
        /* celular e tablet: um horizonte por vez */
        <div className="flex flex-col gap-4">
          {horizontes.map((h) => {
            const lista = noHorizonte(h);
            const comuns = doCenario(lista, "comum");
            const cenarios = r.cenarios.filter((c) => vista === "presente" || c.id === vista);
            return (
              <section key={h.id} aria-label={h.nome} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <button type="button" className="botao botao-fantasma botao-pequeno size-11 p-0" disabled={idxH <= 0} aria-label="Horizonte anterior" onClick={() => setHorizonte(r.horizontes[idxH - 1].id)}>
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <p className="text-center">
                    <span className="block font-editorial text-leitura text-texto">{h.nome}</span>
                    <span className="numeros font-dados text-micro text-ambar">{h.inicio === h.fim ? h.inicio : `${h.inicio}–${h.fim}`}</span>
                    <span className="block text-micro text-texto-3">
                      {idxH + 1} de {r.horizontes.length}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="botao botao-fantasma botao-pequeno size-11 p-0"
                    disabled={idxH >= r.horizontes.length - 1}
                    aria-label="Próximo horizonte"
                    onClick={() => setHorizonte(r.horizontes[idxH + 1].id)}
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </div>
                {comuns.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="rotulo">Comum a todos</p>
                    {comuns.map((ev) => (
                      <Cartao key={ev.id} ev={ev} />
                    ))}
                  </div>
                )}
                {cenarios.map((c) => {
                  const evs = doCenario(lista, c.id);
                  if (evs.length === 0) return null;
                  return (
                    <div key={c.id} className="flex flex-col gap-2">
                      <p className="flex items-center gap-2 text-micro text-texto-2">
                        <Letra id={c.id} ativa={vista === c.id} /> {c.nome}
                      </p>
                      {evs.map((ev) => (
                        <Cartao key={ev.id} ev={ev} />
                      ))}
                    </div>
                  );
                })}
                {lista.length === 0 && <p className="text-legenda text-texto-2">Nada neste horizonte com os filtros atuais.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        /* desktop: horizontes em linhas, cenários em colunas */
        <div className="grid grid-cols-[8.5rem_repeat(4,minmax(0,1fr))] gap-px overflow-hidden rounded-padrao border border-linha bg-linha">
          <div className="bg-abismo p-2.5" />
          {colunas.map((col) => {
            const c = col === "comum" ? null : r.cenarios.find((x) => x.id === col)!;
            const apagada = c && vista !== "presente" && vista !== c.id;
            return (
              <div key={col} className={`bg-abismo p-2.5 transicao-preenchimento ${apagada ? "opacity-45" : ""}`}>
                {c ? (
                  <p className="flex items-center gap-2 text-legenda text-texto">
                    <Letra id={c.id} ativa={vista === c.id} /> <span className="min-w-0">{c.nome}</span>
                  </p>
                ) : (
                  <p className="text-legenda text-texto">Comum a todos</p>
                )}
                <p className="mt-0.5 text-micro text-texto-3">{c ? `${c.arquetipo} · projeções e condições` : "Passado, calendário e inferências"}</p>
              </div>
            );
          })}
          {horizontes.map((h) => {
            const lista = noHorizonte(h);
            return [
              <div key={`${h.id}-r`} className="bg-abismo p-2.5">
                <p className="text-legenda text-texto">{h.nome}</p>
                <p className="numeros font-dados text-micro text-ambar">{h.inicio === h.fim ? h.inicio : `${h.inicio}–${h.fim}`}</p>
              </div>,
              ...colunas.map((col) => {
                const apagada = col !== "comum" && vista !== "presente" && vista !== col;
                const evs = doCenario(lista, col);
                return (
                  <div key={`${h.id}-${col}`} className={`flex flex-col gap-2 bg-abismo p-2 transicao-preenchimento ${apagada ? "opacity-45" : ""}`}>
                    {evs.map((ev) => (
                      <Cartao key={ev.id} ev={ev} />
                    ))}
                  </div>
                );
              }),
            ];
          })}
        </div>
      )}

      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
        {(Object.keys(CATEGORIA) as CategoriaTempo[]).map((c) => (
          <li key={c} className="flex items-center gap-1.5 text-micro text-texto-2">
            <GlifoTempo c={c} tamanho={12} />
            <span className="text-texto">{CATEGORIA[c].rotulo}:</span> {CATEGORIA[c].descricao}
          </li>
        ))}
      </ul>
    </div>
  );
}
