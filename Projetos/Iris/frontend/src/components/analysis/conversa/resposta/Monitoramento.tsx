/**
 * 04 Indicadores e monitoramento: o que acompanhar depois dos cenários. Cada sinal diz qual futuro ele fortalece e
 * qual enfraquece, e como ler essa relação (`leitura`), onde acompanhar e quando. No pé, a versão da investigação e
 * o histórico de revisões: é por aqui que a análise se atualiza quando chegam evidências novas. (A atualização
 * automática depende do motor de investigação no servidor; a interface diz isso, sem simular.)
 */
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CenarioId } from "../../../../types/cenario";
import { useResultado } from "../../investigacao/contexto";
import { Letra } from "../../investigacao/pecas";
import { ancora, CabecalhoDeParte } from "./partes";

export function Monitoramento() {
  const { r } = useResultado();
  const [revisoes, setRevisoes] = useState(false);
  const id = ancora(r.id, "monitoramento");
  const variavel = (vid: string) => r.variaveis.find((v) => v.id === vid)?.nome;
  if (!r.sinais.length) return null;

  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-24 flex-col gap-5">
      <CabecalhoDeParte rid={r.id} parte="monitoramento" titulo="Indicadores e monitoramento">
        O que observar daqui em diante e o que cada sinal muda nos cenários.
      </CabecalhoDeParte>

      <ol className="m-0 flex list-none flex-col p-0">
        {r.sinais.map((s) => (
          <li key={s.id} className="grid gap-x-6 gap-y-2 border-t border-linha py-4 sm:grid-cols-[1fr_9.5rem]">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-corpo text-texto">{s.sinal}</p>
              <p className="text-legenda leading-relaxed text-texto-2">{s.leitura}</p>
              <p className="text-micro text-texto-3">
                {variavel(s.variavel) && <>Fator: {variavel(s.variavel)} · </>}
                Onde acompanhar: {s.ondeAcompanhar} · {s.quando}
              </p>
            </div>
            <Efeitos favorece={s.favorece} enfraquece={s.enfraquece} />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2 rounded-padrao border border-linha px-4 py-3 text-legenda text-texto-2">
        <p>
          <span className="text-texto">Versão {r.versao}</span> · atualizada em {r.atualizadoEm}. Quando surgirem evidências novas sobre estes sinais, a
          investigação ganha uma nova versão e os cenários são revistos.
          <span className="text-texto-3"> A revisão automática depende do motor de investigação, que ainda não está no servidor.</span>
        </p>
        {r.revisoes.length > 0 && (
          <>
            <button type="button" aria-expanded={revisoes} onClick={() => setRevisoes((v) => !v)} className="inline-flex w-fit items-center gap-1.5 text-micro text-texto-3 hover:text-texto-2">
              Histórico de revisões ({r.revisoes.length})
              <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-200 ${revisoes ? "rotate-180" : ""}`} />
            </button>
            {revisoes && (
              <ol className="aparecer m-0 flex list-none flex-col gap-1.5 p-0 text-micro leading-relaxed text-texto-3">
                {r.revisoes.map((v, i) => (
                  <li key={i}>
                    <span className="mr-2 font-dados">{v.data}</span>
                    {v.texto}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Para cada cenário, o efeito do sinal: + fortalece, − enfraquece, sempre com palavra (não só cor). */
function Efeitos({ favorece, enfraquece }: { favorece: CenarioId[]; enfraquece: CenarioId[] }) {
  const { r } = useResultado();
  return (
    <ul aria-label="Efeito sobre os cenários" className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0 sm:flex-col sm:items-start">
      {r.cenarios.map((c) => {
        const f = favorece.includes(c.id), e = enfraquece.includes(c.id);
        if (!f && !e) return null;
        return (
          <li key={c.id} className="flex items-center gap-2 text-micro">
            <Letra id={c.id} />
            <span className={f ? "text-ciano-texto" : "text-texto-3"}>
              <span aria-hidden="true" className="font-dados">{f ? "+ " : "− "}</span>
              {f ? "fortalece" : "enfraquece"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
