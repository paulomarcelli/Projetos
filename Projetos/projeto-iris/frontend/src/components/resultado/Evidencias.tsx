import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Epistemico } from "../Epistemico";
import type { NaturezaFonte } from "../../lib/investigacao";
import { contar } from "../../lib/formato";
import { useResultado } from "./contexto";
import { CartaoFonte, NATUREZA } from "./PainelContextual";
import { Rotulo } from "./pecas";

const CADEIA = ["Afirmação", "Evidência", "Fonte", "Interpretação", "Implicação prospectiva"];

export function AreaDeEvidencias() {
  const { r, ix, vista, selecionar, selecao } = useResultado();
  const [todas, setTodas] = useState(false);
  const [natureza, setNatureza] = useState<NaturezaFonte | "todas">("todas");
  const [soCenario, setSoCenario] = useState(false);

  // Relevância de uma fonte = quantos elementos da análise dependem das evidências que ela sustenta.
  const relevancia = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of r.evidencias) for (const f of e.fontes) m.set(f, (m.get(f) ?? 0) + (ix.usosDaEvidencia.get(e.id) ?? 0));
    return m;
  }, [r, ix]);
  const principais = [...r.fontes]
    .sort((a, b) => (relevancia.get(b.id) ?? 0) - (relevancia.get(a.id) ?? 0) || (a.natureza === "primaria" ? -1 : 1))
    .slice(0, 4);

  const usadaNoCenario = (id: string) => {
    if (vista === "presente") return true;
    return (ix.ondeSeUsa.get(id) ?? []).some(
      (u) => (u.tipo === "cenario" && u.id === vista) || (u.tipo === "relacao" && ix.relacoes.get(u.id)?.cenarios[vista].evidencias?.includes(id)),
    );
  };
  const evidencias = r.evidencias.filter((e) => !soCenario || usadaNoCenario(e.id));
  const contagem = (n: NaturezaFonte) => r.fontes.filter((f) => f.natureza === n).length;
  const conferidas = r.fontes.filter((f) => f.conferencia === "conferido").length;
  const fontesFiltradas = r.fontes.filter((f) => natureza === "todas" || f.natureza === natureza);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="t-cadeia" className="flex flex-col gap-3">
        <h2 id="t-cadeia" className="font-editorial text-secao text-texto">
          Rastreabilidade
        </h2>
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0 text-legenda text-texto-2">
          {CADEIA.map((p, i) => (
            <li key={p} className="flex items-center gap-2">
              <span className="rounded-full border border-linha-forte px-2.5 py-0.5 text-texto">{p}</span>
              {i < CADEIA.length - 1 && <ArrowRight size={13} aria-hidden="true" className="text-texto-3" />}
            </li>
          ))}
        </ol>
        <p className="max-w-[68ch] text-legenda text-texto-2">
          Cada número entre colchetes, no mapa, nos cenários e na linha do tempo, abre esta cadeia completa. {contar(r.evidencias.length, "evidência sustenta", "evidências sustentam")} a análise, a partir de{" "}
          {contar(r.fontes.length, "fonte", "fontes")}: {contar(contagem("primaria"), "primária", "primárias")}, {contar(contagem("secundaria"), "secundária", "secundárias")} e{" "}
          {contar(contagem("terciaria"), "terciária", "terciárias")}. O texto de {conferidas} delas foi lido, e o trecho usado está citado.
        </p>
      </section>

      <section aria-labelledby="t-principais" className="flex flex-col gap-3">
        <div>
          <h2 id="t-principais" className="font-editorial text-secao text-texto">
            Fontes principais
          </h2>
          <p className="text-legenda text-texto-2">Critério: as fontes cujas evidências sustentam mais elementos da análise (atores, relações, cenários e eventos).</p>
        </div>
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {principais.map((f) => (
            <li key={f.id} className="flex flex-col gap-1">
              <CartaoFonte f={f} n={ix.numero.get(f.id)} />
              <p className="text-micro text-texto-3">Sustenta {relevancia.get(f.id)} elementos da análise.</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="t-evidencias" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="t-evidencias" className="font-editorial text-secao text-texto">
              Evidências
            </h2>
            <p className="text-legenda text-texto-2">Toque em uma evidência para ver a cadeia completa e onde ela é usada.</p>
          </div>
          {vista !== "presente" && (
            <button type="button" className="ficha min-h-9" aria-pressed={soCenario} onClick={() => setSoCenario((x) => !x)}>
              Só as usadas no cenário {vista}
            </button>
          )}
        </div>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha border-y border-linha p-0">
          {evidencias.map((e) => {
            const ativa = selecao?.tipo === "evidencia" && selecao.id === e.id;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => selecionar({ tipo: "evidencia", id: e.id })}
                  aria-pressed={ativa}
                  className={`grid w-full gap-1.5 px-1 py-3 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 ${ativa ? "bg-ciano-suave" : "hover:bg-grafite"}`}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <Epistemico tipo={e.tipo} />
                    <span className="text-corpo text-texto">{e.afirmacao}</span>
                    <span className="text-legenda text-texto-2">Implicação: {e.implicacao}</span>
                  </span>
                  <span className="flex items-start gap-3 text-micro text-texto-3 sm:flex-col sm:items-end">
                    <span className="font-dados text-ciano-texto">[{e.fontes.map((f) => ix.numero.get(f)).join(",")}]</span>
                    <span>usada em {ix.usosDaEvidencia.get(e.id) ?? 0}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-todas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="t-todas" className="font-editorial text-secao text-texto">
            Todas as fontes
          </h2>
          <button type="button" className="botao botao-secundario botao-pequeno" aria-expanded={todas} aria-controls="lista-fontes" onClick={() => setTodas((x) => !x)}>
            {todas ? "Recolher" : `Ver todas as fontes (${r.fontes.length})`}
          </button>
        </div>
        {todas && (
          <div id="lista-fontes" className="flex flex-col gap-3">
            <div role="group" aria-label="Natureza da fonte" className="flex flex-wrap gap-1.5">
              {(["todas", "primaria", "secundaria", "terciaria"] as const).map((n) => (
                <button key={n} type="button" className="ficha min-h-9" aria-pressed={natureza === n} onClick={() => setNatureza(n)}>
                  {n === "todas" ? "Todas" : NATUREZA[n].replace("Fonte ", "")}
                </button>
              ))}
            </div>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {fontesFiltradas.map((f) => {
                const sustenta = r.evidencias.filter((e) => e.fontes.includes(f.id));
                return (
                  <li key={f.id} className="flex flex-col gap-1.5">
                    <CartaoFonte f={f} n={ix.numero.get(f.id)} />
                    <div className="pl-3">
                      <Rotulo>Sustenta</Rotulo>
                      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                        {sustenta.map((e) => (
                          <li key={e.id}>
                            <button type="button" onClick={() => selecionar({ tipo: "evidencia", id: e.id })} className="rounded-full border border-linha px-2.5 py-1 text-left text-micro text-texto-2 hover:border-linha-forte hover:text-texto">
                              {e.afirmacao}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
