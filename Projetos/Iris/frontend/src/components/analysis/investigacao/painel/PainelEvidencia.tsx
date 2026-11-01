import { CartaoFonte } from "../../evidencias/CartaoFonte";
import { type ReactNode } from "react";
import { Epistemico } from "../../../common/Epistemico";
import type { CenarioId } from "../../../../types/cenario";
import { useResultado, type Selecao } from "../contexto";
import { Bloco } from "./pecasDoPainel";

export function PainelEvidencia({ id }: { id: string }) {
  const { ix, selecionar, setVista } = useResultado();
  const e = ix.evidencias.get(id);
  if (!e) return null;
  const usos = ix.ondeSeUsa.get(id) ?? [];
  const passo = (n: number, titulo: string, conteudo: ReactNode) => (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span aria-hidden="true" className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-linha-forte bg-institucional font-dados text-micro text-texto-2">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        <p className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">{titulo}</p>
        {conteudo}
      </div>
    </li>
  );
  return (
    <>
      <ol className="relative m-0 list-none p-0 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-linha-forte">
        {passo(1, "Afirmação", <><Epistemico tipo={e.tipo} /><p className="font-editorial text-leitura text-texto">{e.afirmacao}</p></>)}
        {passo(2, "Evidência", <p className="text-legenda text-texto">{e.evidencia}</p>)}
        {passo(
          3,
          `Fonte${e.fontes.length > 1 ? "s" : ""}`,
          <div className="flex flex-col gap-2">
            {e.fontes.map((fid) => {
              const f = ix.fontes.get(fid);
              return f ? <CartaoFonte key={fid} f={f} n={ix.numero.get(fid)} /> : null;
            })}
          </div>,
        )}
        {passo(4, "Interpretação", <><Epistemico tipo="inferencia" /><p className="text-legenda text-texto">{e.interpretacao}</p></>)}
        {passo(5, "Implicação prospectiva", <><Epistemico tipo="cenario" /><p className="text-legenda text-texto">{e.implicacao}</p></>)}
      </ol>
      <Bloco titulo={`Usada em (${usos.length})`}>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {usos.map((u) => (
            <li key={`${u.tipo}-${u.id}`}>
              <button
                type="button"
                className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto-2 hover:border-linha-forte hover:text-texto"
                onClick={() => {
                  // O cenário abre no próprio painel: quem verifica uma fonte não perde o lugar.
                  if (u.tipo === "cenario") {
                    setVista(u.id as CenarioId);
                    selecionar({ tipo: "cenario", id: u.id as CenarioId });
                  } else selecionar({ tipo: u.tipo, id: u.id } as Selecao);
                }}
              >
                <span className="text-micro text-texto-3">{{ ator: "Ator", relacao: "Relação", evento: "Linha do tempo", cenario: "Cenário" }[u.tipo]} · </span>
                {u.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </Bloco>
    </>
  );
}
