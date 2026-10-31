import { Epistemico } from "../../../../components/ui/Epistemico";
import type { Vista } from "../../../../types/cenario";
import { relacaoNaVista, ROTULO_MUDANCA, statusDaRelacao, useResultado } from "../../contexto";
import { NOME_TEMA } from "../../nomes";
import { ChipAtor, Citacoes, LinhaAfirmacao } from "../pecas";
import { Bloco, ListaDeEvidencias, MaisDetalhes, ESTILO } from "./pecasDoPainel";

export function PainelRelacao({ id }: { id: string }) {
  const { ix, vista } = useResultado();
  const rel = ix.relacoes.get(id);
  if (!rel) return null;
  const naVista = relacaoNaVista(rel, vista);
  const e = ESTILO.get(naVista.tipo)!;
  const evs = [...(rel.presente?.evidencias ?? []), ...Object.values(rel.cenarios).flatMap((c) => c.evidencias ?? [])];
  const vistas: Vista[] = ["presente", "A", "B", "C"];
  return (
    <>
      <Bloco n={1} titulo="Identificação">
        <p className="flex flex-wrap items-center gap-1.5 text-legenda text-texto-2">
          <ChipAtor id={rel.de} /> → <ChipAtor id={rel.para} />
        </p>
        <p className="text-legenda text-texto">
          {e.rotulo} · {NOME_TEMA[rel.tema]}
        </p>
        <Epistemico tipo={statusDaRelacao(rel, vista)} rotulo={vista === "presente" ? undefined : `Condicional ao cenário ${vista}`} />
      </Bloco>
      <Bloco n={2} titulo={vista === "presente" ? "O que se observa" : `No cenário ${vista}`}>
        {vista === "presente" && rel.presente ? (
          <LinhaAfirmacao a={rel.presente} compacta />
        ) : (
          <p className="text-legenda text-texto">
            {naVista.texto}
            <Citacoes ids={naVista.estado?.evidencias} />
          </p>
        )}
      </Bloco>
      <MaisDetalhes>
      <Bloco n={3} titulo="Mecanismo">
        <p className="text-legenda text-texto">{rel.mecanismo}</p>
        <Epistemico tipo="inferencia" rotulo="Interpretação do analista" />
      </Bloco>
      <Bloco n={4} titulo="Como muda entre os futuros">
        <table className="w-full border-collapse text-left text-legenda">
          <tbody>
            {vistas.map((v) => {
              const x = relacaoNaVista(rel, v);
              const existe = v === "presente" ? rel.presente !== null : x.visivel;
              return (
                <tr key={v} className={`border-b border-linha align-top ${vista === v ? "bg-grafite" : ""}`}>
                  <th scope="row" className="w-20 py-2 pr-2 font-normal text-texto-3">
                    {v === "presente" ? "Presente" : `Cenário ${v}`}
                  </th>
                  <td className="py-2 text-texto-2">
                    {existe ? (
                      <>
                        {v !== "presente" && x.estado && <span className="mr-1.5 text-micro text-ambar">{ROTULO_MUDANCA[x.estado.mudanca]}</span>}
                        {x.texto}
                      </>
                    ) : (
                      <span className="text-texto-3">Não existe nesta vista.</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Bloco>
      <Bloco n={5} titulo="Evidências">
        <ListaDeEvidencias ids={evs} />
      </Bloco>
      <Bloco n={6} titulo="Incertezas e limitações">
        <p className="text-legenda text-texto-2">
          {rel.incerteza ?? "Nenhuma incerteza específica registrada."} A espessura da linha não mede força: não há método para quantificar a intensidade.
        </p>
      </Bloco>
      </MaisDetalhes>
    </>
  );
}
