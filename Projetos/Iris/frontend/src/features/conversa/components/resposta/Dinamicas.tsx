/**
 * 02 Dinâmicas geopolíticas: a análise necessária para entender o problema, como texto corrido. Atores e interesses,
 * alianças, rivalidades e dependências, fatores políticos e econômicos e as incertezas aparecem quando ajudam a
 * explicar, dentro dos parágrafos: não há seções separadas de "atores" ou "fatores". Os nomes dos atores abrem o
 * perfil; cada frase leva o tipo epistêmico e as citações.
 */
import { Fragment } from "react";
import { useResultado } from "../../../investigacao/contexto";
import { montarDinamicas } from "../../../investigacao/estrutura";
import { ancora, CabecalhoDeParte, Frase, NomeDoAtor } from "./partes";

export function Dinamicas() {
  const { r } = useResultado();
  const paragrafos = montarDinamicas(r);
  if (!paragrafos.length) return null;
  return (
    <section id={ancora(r.id, "dinamicas")} aria-labelledby={`${ancora(r.id, "dinamicas")}-t`} className="flex scroll-mt-24 flex-col gap-5">
      <CabecalhoDeParte rid={r.id} parte="dinamicas" titulo="Dinâmicas geopolíticas">
        O que move o problema: quem age, com que interesses, de que lado e sob quais pressões.
      </CabecalhoDeParte>
      <div className="flex flex-col gap-4 text-corpo leading-[1.75] text-texto-2">
        {paragrafos.map((p, i) => (
          <p key={i}>
            {p.afirmacoes.map((a, j) => (
              <Fragment key={j}>
                {j > 0 && " "}
                <Frase a={a} />
              </Fragment>
            ))}
          </p>
        ))}
      </div>
      <AtoresCitados />
    </section>
  );
}

/** Os atores que aparecem no texto, numa linha discreta: um clique abre o perfil (interesses, relações, cenários). */
function AtoresCitados() {
  const { r } = useResultado();
  const ids = [...new Set(montarDinamicas(r).flatMap((p) => p.atores ?? []))].filter((id) => r.atores.some((a) => a.id === id));
  if (!ids.length) return null;
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-legenda">
      <span className="text-micro text-texto-3">Atores no texto</span>
      {ids.map((id) => (
        <NomeDoAtor key={id} id={id}>
          {r.atores.find((a) => a.id === id)!.curto}
        </NomeDoAtor>
      ))}
    </p>
  );
}
