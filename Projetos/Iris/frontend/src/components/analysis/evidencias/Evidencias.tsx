/**
 * Área "Evidências": verificar a análise.
 *
 * Três camadas, da mais usada à mais completa:
 *   1. Fontes principais (as que sustentam mais elementos; critério contável e declarado).
 *   2. Afirmações → evidências: cada linha abre no painel a cadeia completa
 *      (afirmação, evidência, fonte, interpretação, implicação) e, a partir dela, os atores,
 *      relações, eventos e cenários que a usam.
 *   3. A lista completa de fontes, sob demanda.
 * A busca filtra as camadas 2 e 3 ao mesmo tempo, por texto da afirmação, da evidência, da fonte,
 * do autor ou do veículo. Ela roda sobre os dados já carregados (sem chamada à API): o volume de
 * uma investigação é de dezenas de itens, então filtrar a cada tecla não pesa.
 *
 * Rigor: afirmações cujas fontes não foram conferidas no texto, ou que só têm referência
 * demonstrativa, recebem um aviso explícito, para não se confundirem com evidência verificada.
 */
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { Epistemico } from "../../common/Epistemico";
import { useResultado } from "../investigacao/contexto";
import { CartaoFonte, NATUREZA } from "../investigacao/PainelContextual";

/** Comparação sem acentos e sem caixa: "ELEICAO" encontra "eleição". */
const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function AreaDeEvidencias() {
  const { r, ix, selecionar, selecao } = useResultado();
  const [todas, setTodas] = useState(false);
  const [busca, setBusca] = useState("");
  // A lista acompanha a digitação com prioridade baixa: o campo nunca trava.
  const termo = normalizar(useDeferredValue(busca).trim());
  const idBusca = useId();

  // Relevância de uma fonte = quantos elementos da análise dependem das evidências que ela sustenta.
  const relevancia = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of r.evidencias) for (const f of e.fontes) m.set(f, (m.get(f) ?? 0) + (ix.usosDaEvidencia.get(e.id) ?? 0));
    return m;
  }, [r, ix]);
  const principais = [...r.fontes].sort((a, b) => (relevancia.get(b.id) ?? 0) - (relevancia.get(a.id) ?? 0)).slice(0, 4);
  const conferidas = r.fontes.filter((f) => f.conferencia === "conferido").length;

  const fontesFiltradas = useMemo(
    () => (termo ? r.fontes.filter((f) => normalizar([f.titulo, f.autor, f.veiculo, f.genero, f.trecho].filter(Boolean).join(" ")).includes(termo)) : r.fontes),
    [r, termo],
  );
  const evidenciasFiltradas = useMemo(() => {
    if (!termo) return r.evidencias;
    const porFonte = new Set(fontesFiltradas.map((f) => f.id));
    return r.evidencias.filter((e) => normalizar(`${e.afirmacao} ${e.evidencia} ${e.interpretacao}`).includes(termo) || e.fontes.some((f) => porFonte.has(f)));
  }, [r, termo, fontesFiltradas]);

  /** Evidência sem nenhuma fonte conferida no texto (ou só com referência demonstrativa). */
  const fragil = (fontes: string[]) => fontes.every((id) => {
    const f = ix.fontes.get(id);
    return !f || f.conferencia !== "conferido" || f.demonstrativa;
  });

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[70ch] text-legenda text-texto-2">
        {r.fontes.length} fontes, {conferidas} com o texto conferido e o trecho citado. Cada número entre colchetes na análise abre a cadeia completa: afirmação, evidência, fonte,
        interpretação e implicação.
      </p>

      {!termo && (
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
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={idBusca} className="text-legenda text-texto-2">
          Pesquisar afirmações e fontes
        </label>
        <div className="relative max-w-xl">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
          <input
            id={idBusca}
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Ator, tema, veículo, autor…"
            aria-describedby={`${idBusca}-total`}
            className="campo pl-9"
          />
        </div>
        <p id={`${idBusca}-total`} role="status" className="text-micro text-texto-3">
          {termo ? `${evidenciasFiltradas.length} afirmações e ${fontesFiltradas.length} fontes correspondem à busca.` : " "}
        </p>
      </div>

      <section aria-labelledby="t-afirmacoes" className="flex flex-col gap-3">
        <h2 id="t-afirmacoes" className="rotulo">
          Afirmações e evidências
        </h2>
        {evidenciasFiltradas.length === 0 ? (
          <p className="text-legenda text-texto-2">Nenhuma afirmação corresponde à busca.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-linha border-y border-linha p-0">
            {evidenciasFiltradas.map((e) => {
              const ativa = selecao?.tipo === "evidencia" && selecao.id === e.id;
              const usos = ix.usosDaEvidencia.get(e.id) ?? 0;
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
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-legenda text-texto">{e.afirmacao}</span>
                      <span className="text-micro text-texto-3">
                        {usos > 0 ? `usada em ${usos === 1 ? "1 elemento" : `${usos} elementos`}` : "não usada por nenhum elemento"}
                        {fragil(e.fontes) && <span className="text-ambar"> · fonte não conferida no texto</span>}
                      </span>
                    </span>
                    <span className="shrink-0 font-dados text-micro text-ciano-texto">[{e.fontes.map((f) => ix.numero.get(f)).join(",")}]</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-todas" className="flex flex-col gap-3">
        {termo ? (
          <h2 id="t-todas" className="rotulo">
            Fontes encontradas ({fontesFiltradas.length})
          </h2>
        ) : (
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
        )}
        {(todas || termo) && (
          <ol id="lista-fontes" className="m-0 flex list-none flex-col gap-2 p-0">
            {fontesFiltradas.map((f) => (
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
