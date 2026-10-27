import { ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Epistemico } from "../Epistemico";
import { useResultado } from "./contexto";
import { CartaoFonte, NATUREZA } from "./PainelContextual";

export function AreaDeEvidencias() {
  const { r, ix, selecionar, selecao } = useResultado();
  const [todas, setTodas] = useState(false);

  // Relevância de uma fonte = quantos elementos da análise dependem das evidências que ela sustenta.
  const relevancia = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of r.evidencias) for (const f of e.fontes) m.set(f, (m.get(f) ?? 0) + (ix.usosDaEvidencia.get(e.id) ?? 0));
    return m;
  }, [r, ix]);
  const principais = [...r.fontes].sort((a, b) => (relevancia.get(b.id) ?? 0) - (relevancia.get(a.id) ?? 0)).slice(0, 4);
  const conferidas = r.fontes.filter((f) => f.conferencia === "conferido").length;

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[70ch] text-legenda text-texto-2">
        {r.fontes.length} fontes, {conferidas} com o texto conferido e o trecho citado. Cada número entre colchetes na análise abre a cadeia completa: afirmação, evidência, fonte,
        interpretação e implicação.
      </p>

      <section aria-labelledby="t-principais" className="flex flex-col gap-3">
        <h2 id="t-principais" className="rotulo">
          Fontes principais · as que sustentam mais elementos da análise
        </h2>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {principais.map((f) => (
            <li key={f.id}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col gap-1.5 rounded-padrao border border-linha bg-institucional p-3 transition-colors duration-150 hover:border-linha-forte"
              >
                <span className="flex items-center justify-between gap-2 text-micro text-texto-3">
                  <span>
                    <span className="font-dados text-ciano-texto">[{ix.numero.get(f.id)}]</span> {f.veiculo} · {NATUREZA[f.natureza].replace("Fonte ", "")}
                  </span>
                  <ExternalLink size={12} aria-hidden="true" className="shrink-0 opacity-60 group-hover:opacity-100" />
                </span>
                <span className="text-legenda text-texto group-hover:text-ciano-texto">{f.titulo}</span>
                <span className="mt-auto text-micro text-texto-3">sustenta {relevancia.get(f.id)} elementos</span>
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-afirmacoes" className="flex flex-col gap-3">
        <h2 id="t-afirmacoes" className="rotulo">
          Afirmações e evidências
        </h2>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha border-y border-linha p-0">
          {r.evidencias.map((e) => {
            const ativa = selecao?.tipo === "evidencia" && selecao.id === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => selecionar({ tipo: "evidencia", id: e.id })}
                  aria-pressed={ativa}
                  className={`flex w-full items-start gap-3 px-1 py-2.5 text-left transition-colors duration-150 ${ativa ? "bg-ciano-suave" : "hover:bg-grafite"}`}
                >
                  <span className="mt-0.5 shrink-0">
                    <Epistemico tipo={e.tipo} compacto />
                  </span>
                  <span className="min-w-0 flex-1 text-legenda text-texto">{e.afirmacao}</span>
                  <span className="shrink-0 font-dados text-micro text-ciano-texto">[{e.fontes.map((f) => ix.numero.get(f)).join(",")}]</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-todas" className="flex flex-col gap-3">
        <button
          type="button"
          id="t-todas"
          className="flex min-h-11 w-fit items-center gap-2 text-legenda text-ciano-texto hover:underline"
          aria-expanded={todas}
          aria-controls="lista-fontes"
          onClick={() => setTodas((x) => !x)}
        >
          {todas ? "Recolher a lista de fontes" : `Ver todas as fontes (${r.fontes.length})`}
          <ChevronDown size={15} aria-hidden="true" className={`transition-transform duration-200 ${todas ? "rotate-180" : ""}`} />
        </button>
        {todas && (
          <ol id="lista-fontes" className="m-0 flex list-none flex-col gap-2 p-0">
            {r.fontes.map((f) => (
              <li key={f.id}>
                <CartaoFonte f={f} n={ix.numero.get(f.id)} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
