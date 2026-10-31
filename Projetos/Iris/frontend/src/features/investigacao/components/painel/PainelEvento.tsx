import { useResultado } from "../../contexto";
import { CATEGORIA, ChipAtor, GlifoTempo, Letra } from "../pecas";
import { Bloco, ListaDeEvidencias, ESTILO } from "./pecasDoPainel";

export function PainelEvento({ id }: { id: string }) {
  const { ix, selecionar } = useResultado();
  const ev = ix.eventos.get(id);
  if (!ev) return null;
  return (
    <>
      <Bloco titulo="Evento">
        <p className="inline-flex items-center gap-2 text-legenda text-texto-2">
          <GlifoTempo c={ev.categoria} /> {CATEGORIA[ev.categoria].rotulo}
          {ev.agendado && " · agendado"}
          {ev.inflexao && <span className="text-ambar">· ponto de inflexão</span>}
        </p>
        <p className="font-dados text-micro text-texto-3">{ev.data}</p>
        <p className="font-editorial text-leitura text-texto">{ev.texto}</p>
        {ev.condicao && <p className="text-legenda text-ambar">Condição: {ev.condicao}</p>}
        {ev.cenarios && (
          <p className="flex items-center gap-1.5 text-legenda text-texto-2">
            Só no cenário {ev.cenarios.map((c) => <Letra key={c} id={c} />)}
          </p>
        )}
      </Bloco>
      <Bloco titulo="Atores envolvidos">
        <div className="flex flex-wrap gap-1.5">{ev.atores.map((a) => <ChipAtor key={a} id={a} />)}</div>
      </Bloco>
      {ev.relacoes && ev.relacoes.length > 0 && (
        <Bloco titulo="Relações afetadas">
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {ev.relacoes.map((rid) => {
              const rel = ix.relacoes.get(rid)!;
              return (
                <li key={rid}>
                  <button type="button" onClick={() => selecionar({ tipo: "relacao", id: rid })} className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto hover:border-linha-forte">
                    {ix.atores.get(rel.de)?.curto} → {ix.atores.get(rel.para)?.curto} · {ESTILO.get(rel.tipo)?.rotulo.split(" / ")[0]}
                  </button>
                </li>
              );
            })}
          </ul>
        </Bloco>
      )}
      {ev.sinais && ev.sinais.length > 0 && (
        <Bloco titulo="Indicadores de alerta">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {ev.sinais.map((sid) => {
              const s = ix.sinais.get(sid)!;
              return (
                <li key={sid} className="text-legenda">
                  <span className="text-texto">{s.sinal}</span>
                  <span className="block text-texto-2">{s.leitura}</span>
                </li>
              );
            })}
          </ul>
        </Bloco>
      )}
      <Bloco titulo="Evidências">
        {ev.categoria === "projetado" && !ev.evidencias?.length ? (
          <p className="text-legenda text-texto-2">Desdobramento projetado: não é sustentado por evidência direta, e sim pelas premissas do cenário.</p>
        ) : (
          <ListaDeEvidencias ids={ev.evidencias ?? []} />
        )}
      </Bloco>
    </>
  );
}
