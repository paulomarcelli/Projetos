/**
 * 01 Diagnóstico estratégico — "O que está acontecendo e por que isso importa?"
 *
 * A primeira dobra responde à pergunta sem rolar:
 *   - à esquerda, a síntese executiva (a conclusão central) e o que separa os futuros (as incertezas críticas, cada
 *     uma com os dois polos e quais cenários ela separa, lido de `posicao` de cada cenário);
 *   - à direita, o mapa dos futuros: a matriz 2×2 das incertezas, quando ela se aplica (`matrizAplicavel`).
 * A leitura completa (interpretação estratégica e dinâmicas, com os fatores dentro da narrativa) fica num bloco que
 * abre na própria página e sai sempre na impressão: o essencial à vista, o aprofundamento a um clique.
 *
 * Origem: `montarDiagnostico` e `montarDinamicas` (investigacao/estrutura.ts) usam o que o motor escrever; sem isso,
 * montam a partir dos campos do resultado, sem acrescentar nada. Cada frase mantém o tipo epistêmico e as fontes.
 */
import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import type { IncertezaCritica } from "../../../types/cenario";
import { Epistemico, type TipoEpistemico } from "../../common/Epistemico";
import { SecaoDaInvestigacao, Subtitulo } from "../blocos";
import { Frase, NomeDoAtor } from "../conversa/resposta/partes";
import { useResultado } from "../investigacao/contexto";
import { montarDiagnostico, montarDinamicas } from "../investigacao/estrutura";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { MatrizDasIncertezas, matrizAplicavel } from "../prospectiva/ComparacaoDeCenarios";

export function SecaoDiagnostico() {
  const { r } = useResultado();
  const [aberto, setAberto] = useState(false);
  const comMatriz = matrizAplicavel(r);

  return (
    <SecaoDaInvestigacao secao={SECOES[0]}>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex min-w-0 flex-col gap-7 lg:col-span-7">
          {/* síntese executiva: a conclusão central, lida em segundos */}
          <div className="flex flex-col gap-2.5 border-l-2 border-texto/70 pl-5">
            <p className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">Síntese executiva</p>
            <p className="max-w-[62ch] font-editorial text-[calc(1.1875rem*var(--escala-titulo))] leading-[1.55] text-pretty text-texto sm:text-[calc(1.25rem*var(--escala-titulo))]">
              {r.sintese}
            </p>
          </div>

          {/* o que separa os futuros: as incertezas críticas, numeradas como na matriz ao lado */}
          {r.incertezas.length > 0 && (
            <section aria-labelledby="t-incertezas" className="flex flex-col gap-1">
              <h3 id="t-incertezas" className="text-micro font-medium tracking-[0.06em] text-ambar uppercase">
                O que separa os futuros
              </h3>
              <ol className="m-0 flex list-none flex-col p-0">
                {r.incertezas.map((i, n) => (
                  <IncertezaCompacta key={i.id} i={i} n={n + 1} />
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* mapa dos futuros: onde cada cenário cai entre as duas incertezas (posição, não chance) */}
        {r.cenarios.length > 1 && (
          <aside aria-labelledby="t-mapa-futuros" className="cartao flex min-w-0 flex-col gap-3 self-start p-5 lg:col-span-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="t-mapa-futuros" className="text-corpo font-medium text-texto">
                Mapa dos futuros
              </h3>
              <span className="text-micro text-texto-3">posição, sem probabilidade</span>
            </div>
            <MatrizDasIncertezas compacta={comMatriz} />
            {comMatriz && r.quadranteNaoDesenvolvido && <p className="text-micro text-texto-3">{r.quadranteNaoDesenvolvido}</p>}
          </aside>
        )}
      </div>

      {/* leitura completa: interpretação e dinâmicas, na própria página, sob demanda (e sempre na impressão) */}
      <div className="flex flex-col gap-6 border-t border-linha pt-5">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls="diagnostico-completo"
          onClick={() => setAberto((v) => !v)}
          className="group flex min-h-11 w-full items-center justify-between gap-4 text-left print:hidden"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-corpo font-medium text-texto group-hover:text-ciano-texto">
              {aberto ? "Recolher o diagnóstico completo" : "Ler o diagnóstico completo"}
            </span>
            <span className="text-legenda text-texto-3">Interpretação estratégica da Iris, dinâmicas geopolíticas e fatores determinantes</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-texto-3 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
        </button>
        <div id="diagnostico-completo" className={aberto ? "contents" : "hidden print:contents"}>
          <DiagnosticoCompleto />
        </div>
      </div>
    </SecaoDaInvestigacao>
  );
}

/**
 * Uma incerteza crítica numa linha: a pergunta, os dois polos e quais cenários ela separa. "Separa" é lido de
 * `posicao` (polo 0, polo 1 ou indiferente) de cada cenário; nada é estimado.
 */
function IncertezaCompacta({ i, n }: { i: IncertezaCritica; n: number }) {
  const { r } = useResultado();
  const lado = (p: 0 | 1) => r.cenarios.filter((c) => c.posicao[i.id] === p).map((c) => c.id);
  const [a, b] = [lado(0), lado(1)];
  const fora = r.cenarios.filter((c) => c.posicao[i.id] === null || c.posicao[i.id] === undefined).map((c) => c.id);
  return (
    <li className="flex gap-3 border-b border-linha py-3.5">
      <span className="numeros pt-0.5 font-dados text-micro text-ambar">{n}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-corpo text-texto">
          {i.pergunta}
          {i.id === r.principalIncerteza && <span className="ml-2 whitespace-nowrap text-micro text-ambar">· principal</span>}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-texto-3">
          <span>{i.polos[0]}</span>
          <span aria-hidden="true">↔</span>
          <span className="sr-only">ou</span>
          <span>{i.polos[1]}</span>
        </p>
        {a.length > 0 && b.length > 0 && (
          <p className="flex flex-wrap items-center gap-1.5 text-micro text-texto-2">
            Separa{" "}
            {a.map((id) => (
              <Letra key={id} id={id} />
            ))}{" "}
            de{" "}
            {b.map((id) => (
              <Letra key={id} id={id} />
            ))}
            {fora.length > 0 && (
              <span className="text-texto-3">
                {" "}
                · {fora.join(", ")} não {fora.length === 1 ? "depende" : "dependem"} deste eixo
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

/** A leitura completa do diagnóstico: interpretação estratégica e dinâmicas (com os fatores na narrativa). */
function DiagnosticoCompleto() {
  const { r } = useResultado();
  const d = montarDiagnostico(r);
  const paragrafos = montarDinamicas(r);
  // O aviso de contexto já está no cabeçalho: não repetir quando o diagnóstico foi montado a partir dele.
  const situacao = d.situacao.filter((a) => a.texto !== r.avisoDeContexto.texto);
  const tipos = [...new Set(paragrafos.flatMap((p) => p.afirmacoes.map((a) => a.tipo)))];
  const atores = [...new Set(paragrafos.flatMap((p) => p.atores ?? []))].filter((id) => r.atores.some((a) => a.id === id));
  return (
    <>
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

        <section aria-labelledby="t-incertezas-porque" className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:border-l lg:border-linha lg:pl-10">
          <Subtitulo id="t-incertezas-porque" titulo="Por que estas incertezas">
            O que sustenta cada eixo, com o tipo de afirmação e as fontes.
          </Subtitulo>
          <Incertezas />
        </section>
      </div>
    </>
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
            <span
              aria-hidden="true"
              className="relative block h-px bg-[linear-gradient(to_right,var(--color-ambar),transparent_35%,transparent_65%,var(--color-ambar))] opacity-60"
            >
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
