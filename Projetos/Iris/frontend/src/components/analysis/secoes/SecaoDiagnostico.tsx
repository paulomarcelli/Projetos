/**
 * 01 Diagnóstico estratégico — "O que está acontecendo e por que isso importa?"
 *
 * A abertura da investigação, na ordem em que se lê:
 *   1. a síntese executiva (a conclusão central), em destaque;
 *   2. a interpretação estratégica da Iris: o problema central, por que importa e as implicações;
 *   3. as dinâmicas geopolíticas como texto corrido, com os fatores determinantes DENTRO da narrativa (estado atual e
 *      por que importa), em vez de uma tabela que cataloga fatores;
 *   4. as incertezas críticas, como espectros entre dois polos.
 * A pergunta, o horizonte e a data da análise ficam no cabeçalho da investigação, logo acima.
 *
 * Origem: `montarDiagnostico` e `montarDinamicas` (investigacao/estrutura.ts) usam o que o motor escrever; sem isso,
 * montam a partir dos campos do resultado, sem acrescentar nada. Cada frase mantém o tipo epistêmico e as fontes.
 */
import { Fragment } from "react";
import { Epistemico, type TipoEpistemico } from "../../common/Epistemico";
import { SecaoDaInvestigacao, Subtitulo } from "../blocos";
import { Frase, NomeDoAtor } from "../conversa/resposta/partes";
import { useResultado } from "../investigacao/contexto";
import { montarDiagnostico, montarDinamicas } from "../investigacao/estrutura";
import { SECOES } from "../investigacao/secoes";

export function SecaoDiagnostico() {
  const { r } = useResultado();
  const d = montarDiagnostico(r);
  const paragrafos = montarDinamicas(r);
  // O aviso de contexto já está no cabeçalho: não repetir quando o diagnóstico foi montado a partir dele.
  const situacao = d.situacao.filter((a) => a.texto !== r.avisoDeContexto.texto);
  const tipos = [...new Set(paragrafos.flatMap((p) => p.afirmacoes.map((a) => a.tipo)))];
  const atores = [...new Set(paragrafos.flatMap((p) => p.atores ?? []))].filter((id) => r.atores.some((a) => a.id === id));

  return (
    <SecaoDaInvestigacao secao={SECOES[0]}>
      {/* 1. síntese executiva: a conclusão central, lida em segundos */}
      <div className="flex flex-col gap-3 border-l-2 border-texto/70 pl-5 sm:pl-6">
        <p className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">Síntese executiva</p>
        <p className="max-w-[60ch] font-editorial text-[calc(1.375rem*var(--escala-titulo))] leading-[1.45] text-balance text-texto sm:text-[calc(1.5rem*var(--escala-titulo))]">
          {r.sintese}
        </p>
      </div>

      {/* 2. interpretação estratégica da Iris */}
      <section aria-labelledby="t-interpretacao" className="flex flex-col gap-4">
        <Subtitulo id="t-interpretacao" titulo="Interpretação estratégica da Iris">
          A leitura da Iris sobre o problema. Cada frase diz o que é (fato, inferência, hipótese) e de onde vem.
        </Subtitulo>
        <dl className="m-0 grid gap-x-8 gap-y-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <dt className="text-micro font-medium text-texto-3">Problema central</dt>
            <dd className="m-0 flex flex-col gap-2 text-corpo leading-relaxed text-texto">
              <Frase a={d.problema} />
              {d.problemaPolos && (
                <span className="flex flex-wrap items-center gap-2 text-micro text-texto-3">
                  <span className="rounded-fino border border-linha px-1.5 py-0.5">{d.problemaPolos[0]}</span>
                  <span aria-hidden="true">↔</span>
                  <span className="sr-only">ou</span>
                  <span className="rounded-fino border border-linha px-1.5 py-0.5">{d.problemaPolos[1]}</span>
                </span>
              )}
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="text-micro font-medium text-texto-3">Por que importa</dt>
            <dd className="m-0 text-corpo leading-relaxed text-texto-2">
              <Frase a={d.relevancia} />
            </dd>
          </div>
          {d.implicacoes.length > 0 && (
            <div className="flex flex-col gap-2">
              <dt className="text-micro font-medium text-texto-3">Implicações para o futuro</dt>
              <dd className="m-0">
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-corpo leading-relaxed text-texto-2">
                  {d.implicacoes.map((a, i) => (
                    <Frase key={i} a={a} como="li" />
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
        {situacao.length > 0 && (
          <div className="flex flex-col gap-1.5 text-legenda text-texto-2">
            {situacao.map((a, i) => (
              <Frase key={i} a={a} como="p" />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* 3. dinâmicas, com os fatores na narrativa */}
        <section aria-labelledby="t-dinamicas" className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          <Subtitulo id="t-dinamicas" titulo="Dinâmicas geopolíticas e fatores determinantes">
            Quem age, com que interesses, sob quais pressões, e como cada fator pesa na dinâmica.
          </Subtitulo>
          <LegendaDasMarcas tipos={tipos} />
          <div className="flex max-w-[68ch] flex-col gap-4 text-corpo leading-[1.75] text-texto-2">
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
          {atores.length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-legenda">
              <span className="text-micro text-texto-3">Atores no texto</span>
              {atores.map((id) => (
                <NomeDoAtor key={id} id={id}>
                  {r.atores.find((a) => a.id === id)!.curto}
                </NomeDoAtor>
              ))}
            </p>
          )}
        </section>

        {/* 4. incertezas críticas */}
        <section aria-labelledby="t-incertezas" className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:border-l lg:border-linha lg:pl-10">
          <Subtitulo id="t-incertezas" titulo="Incertezas críticas">
            O que ainda não se sabe e separa os futuros. A resposta pode cair em qualquer ponto entre os polos.
          </Subtitulo>
          <Incertezas />
        </section>
      </div>
    </SecaoDaInvestigacao>
  );
}

/**
 * Legenda das marcas usadas no texto. Cada frase mostra só o glifo (o rótulo fica para o leitor de tela); a legenda
 * diz o que cada glifo quer dizer, sem obrigar a lembrar.
 */
export function LegendaDasMarcas({ tipos }: { tipos: TipoEpistemico[] }) {
  if (tipos.length === 0) return null;
  return (
    <p aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-texto-3">
      <span>Marcas:</span>
      {tipos.map((t) => (
        <Epistemico key={t} tipo={t} />
      ))}
    </p>
  );
}

/** Cada incerteza crítica como um espectro entre dois polos (âmbar); a principal leva a marca. */
export function Incertezas() {
  const { r } = useResultado();
  return (
    <ul className="m-0 flex list-none flex-col gap-6 p-0">
      {r.incertezas.map((i) => (
        <li key={i.id} className="flex flex-col gap-2.5">
          <p className="text-corpo text-texto">
            {i.pergunta}
            {i.id === r.principalIncerteza && <span className="ml-2 whitespace-nowrap text-micro text-ambar">· principal</span>}
          </p>
          <div className="flex flex-col gap-1.5">
            <span aria-hidden="true" className="relative block h-px bg-[linear-gradient(to_right,var(--color-ambar),transparent_35%,transparent_65%,var(--color-ambar))] opacity-60">
              <span className="absolute -top-[3px] left-0 size-[7px] rounded-full bg-ambar" />
              <span className="absolute -top-[3px] right-0 size-[7px] rounded-full bg-ambar" />
            </span>
            <p className="flex justify-between gap-4 text-micro text-texto-2">
              <span>{i.polos[0]}</span>
              <span className="sr-only">ou</span>
              <span className="text-right">{i.polos[1]}</span>
            </p>
          </div>
          <p className="text-legenda text-texto-3">
            <Frase a={i.porQue} />
          </p>
        </li>
      ))}
    </ul>
  );
}
