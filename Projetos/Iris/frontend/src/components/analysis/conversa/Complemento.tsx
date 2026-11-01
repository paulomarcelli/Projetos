/**
 * Resposta a uma pergunta complementar, no contexto da investigação aberta. Mostra a parte do resultado que responde
 * à pergunta (complementos.ts decide qual), com as citações de sempre. Não cria cenários novos: quando a
 * investigação mudar de versão, a resposta de análise nova traz os cenários atualizados.
 */
import type { ReactNode } from "react";
import { Epistemico } from "../../common/Epistemico";
import type { Intencao } from "../../../types/conversa";
import { useResultado } from "../investigacao/contexto";
import { Citacoes, Letra } from "../investigacao/pecas";
import { montarComplemento } from "./complementos";

export function Complemento({ intencao }: { intencao: Intencao }) {
  const { r, ix, selecionar } = useResultado();
  const c = montarComplemento(r, intencao);
  const ator = (id: string) => (
    <button type="button" onClick={() => selecionar({ tipo: "ator", id })} className="font-medium text-texto underline decoration-linha-forte underline-offset-4 hover:decoration-ciano">
      {ix.atores.get(id)?.nome ?? id}
    </button>
  );

  switch (c.intencao) {
    case "brasil":
      if (!c.ator && c.consequencias.length === 0) return <Texto>Esta investigação não registra o Brasil como ator nem consequências para o país.</Texto>;
      return (
        <Texto>
          {c.ator && (
            <>
              <p>
                {ator(c.ator.id)} — {c.ator.papel}
              </p>
              {c.ator.caracteristicas.map((a, i) => (
                <p key={i}>
                  <span className="mr-1.5 inline-block align-[-2px]">
                    <Epistemico tipo={a.tipo} compacto />
                  </span>
                  {a.texto}
                  <Citacoes ids={a.evidencias} />
                </p>
              ))}
            </>
          )}
          <PorCenario itens={r.cenarios.map((cen) => ({ id: cen.id, nome: cen.nome, texto: c.ator?.implicacoes[cen.id] }))} titulo="Em cada cenário" />
          {c.consequencias.length > 0 && (
            <PorCenario titulo="Consequências registradas para o país" itens={c.consequencias.map((q) => ({ id: q.cenario.id, nome: q.cenario.nome, texto: q.texto }))} />
          )}
        </Texto>
      );
    case "interesses":
      return (
        <Texto>
          <p>Interesses e capacidades dos atores mais envolvidos nesta investigação (pelo número de relações registradas):</p>
          {c.atores.map((a) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <p>{ator(a.id)}</p>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-4 marker:text-texto-3">
                {a.caracteristicas.map((x, i) => (
                  <li key={i}>
                    {x.texto}
                    <Citacoes ids={x.evidencias} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Texto>
      );
    case "alteracoes":
      return (
        <Texto>
          <p>Os cenários dependem destas incertezas críticas; mudar a resposta a qualquer uma muda a trajetória:</p>
          {c.incertezas.map((i) => (
            <p key={i.id}>
              <span className="text-texto">{i.pergunta}</span> <span className="text-texto-3">({i.polos[0]} ↔ {i.polos[1]})</span>
            </p>
          ))}
          {c.gatilhos.map((g) => (
            <div key={g.cenario.id} className="flex flex-col gap-1.5">
              <p className="flex items-center gap-2 text-texto">
                <Letra id={g.cenario.id} /> {g.cenario.nome}: gatilhos e o que obrigaria a revê-lo
              </p>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-4 marker:text-ambar">
                {g.itens.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </Texto>
      );
    case "historia":
      if (c.eventos.length === 0) return <Texto>Esta investigação não registra acontecimentos observados.</Texto>;
      return (
        <Texto>
          <ol className="m-0 flex list-none flex-col gap-3 border-l border-linha p-0 pl-4">
            {c.eventos.map((e) => (
              <li key={e.id} className="relative">
                <span aria-hidden="true" className="absolute top-2 -left-[21px] size-2 rounded-full border border-linha-forte bg-abismo" />
                <span className="mr-2 font-dados text-micro text-texto-3 uppercase">{e.data}</span>
                {e.texto}
                <Citacoes ids={e.evidencias} />
                {e.atores.length > 0 && <span className="mt-1 block text-micro text-texto-3">{e.atores.map((id) => ix.atores.get(id)?.curto ?? id).join(" · ")}</span>}
              </li>
            ))}
          </ol>
        </Texto>
      );
    case "indicadores":
      if (c.sinais.length === 0) return <Texto>Esta investigação não definiu indicadores a acompanhar.</Texto>;
      return (
        <Texto>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {c.sinais.map((s) => (
              <li key={s.id} className="flex flex-col gap-1">
                <span className="text-texto">{s.sinal}</span>
                <span>{s.leitura}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-texto-3">
                  {s.favorece.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      favorece {s.favorece.map((id) => <Letra key={id} id={id} />)}
                    </span>
                  )}
                  <span>Onde: {s.ondeAcompanhar}</span>
                  <span>Quando: {s.quando}</span>
                </span>
              </li>
            ))}
          </ul>
        </Texto>
      );
    default:
      return (
        <Texto>
          Esta pergunta não foi processada. Sem o motor de investigação, a Iris só responde a perguntas complementares que o
          resultado já cobre: o Brasil, os interesses dos atores, o que alteraria os cenários, a história e os indicadores.
        </Texto>
      );
  }
}

function Texto({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 text-corpo leading-[1.7] text-texto-2">{children}</div>;
}

function PorCenario({ titulo, itens }: { titulo: string; itens: { id: "A" | "B" | "C"; nome: string; texto?: string }[] }) {
  const comTexto = itens.filter((x) => x.texto);
  if (!comTexto.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-legenda font-medium text-texto">{titulo}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {comTexto.map((x, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-0.5">
              <Letra id={x.id} />
            </span>
            <span>
              <span className="text-texto">{x.nome}.</span> {x.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
