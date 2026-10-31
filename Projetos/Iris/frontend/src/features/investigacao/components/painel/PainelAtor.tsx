import { relacaoNaVista, ROTULO_MUDANCA, useResultado } from "../../contexto";
import { NOME_GRUPO, NOME_TIPO_ATOR } from "../../nomes";
import { LinhaAfirmacao } from "../pecas";
import { Bloco, Implicacoes, ListaDeEvidencias, MaisDetalhes, ESTILO } from "./pecasDoPainel";

export function PainelAtor({ id }: { id: string }) {
  const { r, ix, vista, selecionar } = useResultado();
  const a = ix.atores.get(id);
  if (!a) return null;
  const rels = r.relacoes.map((x) => relacaoNaVista(x, vista)).filter((x) => x.visivel && (x.rel.de === id || x.rel.para === id));
  const evs = a.caracteristicas.flatMap((c) => c.evidencias ?? []);
  const blocos = r.blocos.filter((b) => b.membros[vista].includes(id));
  return (
    <>
      <Bloco n={1} titulo="Identificação">
        <p className="font-editorial text-leitura text-texto">{a.nome}</p>
        <p className="text-legenda text-texto-2">
          {NOME_TIPO_ATOR[a.tipo]} · {NOME_GRUPO[a.grupo]}
        </p>
        {blocos.length > 0 && (
          <p className="text-legenda text-texto-2">
            Membro de: <span className="text-texto">{blocos.map((b) => b.nome).join(", ")}</span>
            {vista !== "presente" && " (neste cenário)"}
          </p>
        )}
      </Bloco>
      <Bloco n={2} titulo="Papel na dinâmica">
        <p className="text-legenda text-texto">{a.papel}</p>
      </Bloco>
      <Bloco n={4} titulo={`Relações ${vista === "presente" ? "no presente" : `no cenário ${vista}`}`}>
        {rels.length === 0 ? (
          <p className="text-legenda text-texto-2">Nenhuma relação nesta vista.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {rels.map((x) => {
              const outro = ix.atores.get(x.rel.de === id ? x.rel.para : x.rel.de)!;
              return (
                <li key={x.rel.id}>
                  <button type="button" onClick={() => selecionar({ tipo: "relacao", id: x.rel.id })} className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda hover:border-linha-forte">
                    <span className="text-texto">
                      {ESTILO.get(x.tipo)?.rotulo.split(" / ")[0]} · {outro.curto}
                    </span>
                    {x.mudou && x.estado && <span className="ml-2 text-micro text-ambar">{ROTULO_MUDANCA[x.estado.mudanca]}</span>}
                    <span className="block text-texto-2">{x.texto}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>
      <MaisDetalhes>
      <Bloco n={3} titulo="Interesses e capacidades">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {a.caracteristicas.map((c, i) => (
            <li key={i}>
              <LinhaAfirmacao a={c} />
            </li>
          ))}
        </ul>
      </Bloco>
      <Bloco n={5} titulo="Evidências">
        <ListaDeEvidencias ids={evs} />
      </Bloco>
      <Bloco n={6} titulo="Incertezas e limitações">
        <p className="text-legenda text-texto-2">{a.incerteza ?? "Nenhuma incerteza específica registrada para este ator."}</p>
      </Bloco>
      <Bloco n={7} titulo="Implicações nos cenários">
        <Implicacoes textos={a.implicacoes} />
      </Bloco>
      </MaisDetalhes>
    </>
  );
}
