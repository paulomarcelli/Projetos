/**
 * 01 Diagnóstico estratégico: a resposta direta à pergunta (a síntese) e, logo abaixo, o que está acontecendo, o
 * problema estratégico central, por que ele importa e o que ele implica para o futuro. Cada linha mantém o tipo
 * epistêmico e as evidências (ver features/investigacao/estrutura.ts para a origem de cada campo).
 */
import type { ReactNode } from "react";
import { useResultado } from "../../investigacao/contexto";
import { montarDiagnostico } from "../../investigacao/estrutura";
import { ancora, CabecalhoDeParte, Frase } from "./partes";

export function Diagnostico() {
  const { r } = useResultado();
  const d = montarDiagnostico(r);
  return (
    <section id={ancora(r.id, "diagnostico")} aria-labelledby={`${ancora(r.id, "diagnostico")}-t`} className="flex scroll-mt-24 flex-col gap-5">
      <CabecalhoDeParte rid={r.id} parte="diagnostico" titulo="Diagnóstico estratégico" />
      <p className="font-editorial text-leitura text-texto">{r.sintese}</p>
      <dl className="m-0 grid gap-x-6 gap-y-4 border-t border-linha pt-4 sm:grid-cols-[11rem_1fr]">
        <Linha rotulo="O que está acontecendo">
          {d.situacao.map((a, i) => (
            <Frase key={i} a={a} como="p" />
          ))}
        </Linha>
        <Linha rotulo="Problema estratégico central">
          <p className="text-texto">
            <Frase a={d.problema} />
          </p>
          {d.problemaPolos && (
            <p className="flex flex-wrap items-center gap-2 text-micro text-texto-3">
              <span className="rounded-fino border border-linha px-1.5 py-0.5">{d.problemaPolos[0]}</span>
              <span aria-hidden="true">↔</span>
              <span className="rounded-fino border border-linha px-1.5 py-0.5">{d.problemaPolos[1]}</span>
            </p>
          )}
        </Linha>
        <Linha rotulo="Por que importa">
          <Frase a={d.relevancia} como="p" />
        </Linha>
        {d.implicacoes.length > 0 && (
          <Linha rotulo="Implicações para o futuro">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {d.implicacoes.map((a, i) => (
                <Frase key={i} a={a} como="li" />
              ))}
            </ul>
          </Linha>
        )}
      </dl>
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-micro font-medium text-texto-3 uppercase sm:pt-1">{rotulo}</dt>
      <dd className="m-0 flex flex-col gap-2 text-corpo leading-[1.65] text-texto-2">{children}</dd>
    </>
  );
}
