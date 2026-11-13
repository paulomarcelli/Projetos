/**
 * 02 · Futuros possíveis — o núcleo prospectivo: quantas trajetórias até o fim do horizonte, o leque que mostra de
 * onde elas se separam (LequeDosFuturos, lido de `posicao`) e, para cada uma, um cartão curto. Sem probabilidade nem
 * etiqueta de chance: são trajetórias condicionais.
 *
 * Cada cartão leva à Análise do Cenário (`/app/investigacoes/:id/cenarios/:letra`), o segundo nível da investigação:
 * tese, lógica, trajetória, dinâmicas, consequências, inflexões, indicadores e premissas daquele futuro. Passar o
 * cursor ou o foco por um cartão acende o ramo dele no leque.
 */
import { ArrowRight } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import type { Cenario, CenarioId } from "../../../types/cenario";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { LequeDosFuturos } from "../prospectiva/LequeDosFuturos";
import { RotuloDeSecao } from "./RotuloDeSecao";

const POR_EXTENSO = ["Nenhuma", "Uma", "Duas", "Três", "Quatro", "Cinco", "Seis"];
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Evidências distintas citadas pelo cenário (premissas, tendências, mecanismos, a favor, contra). */
function evidenciasDoCenario(c: Cenario) {
  const ids = new Set<string>();
  for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias, ...c.mecanismos]) for (const e of a.evidencias ?? []) ids.add(e);
  return ids.size;
}

export function SecaoCenarios() {
  const { r } = useResultado();
  const [realce, setRealce] = useState<CenarioId | null>(null);
  const secao = SECOES[1];
  const n = r.cenarios.length;
  const quantas = `${POR_EXTENSO[n] ?? n} ${n === 1 ? "trajetória" : "trajetórias"} até ${r.horizonte.fim}`;
  return (
    <section id={secao.id} aria-label={secao.titulo} className="flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-4">
      <RotuloDeSecao numero={secao.numero} nome={secao.titulo} nucleo />
      <h2 tabIndex={-1} data-titulo-secao className="font-editorial text-secao font-medium text-texto outline-none sm:text-titulo">
        {n > 0 ? quantas : "Sem cenários nesta investigação"}
      </h2>
      {n === 0 ? (
        <p className="max-w-[64ch] text-corpo text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. As lacunas estão em "Como esta análise foi feita".
        </p>
      ) : (
        <>
          {r.incertezas.length > 0 && (
            <p className="max-w-[64ch] text-corpo text-texto-2">
              {r.incertezas.length === 1 ? "Uma escolha separa" : `${POR_EXTENSO[r.incertezas.length] ?? r.incertezas.length} escolhas separam`} os futuros:{" "}
              {r.incertezas.map((i, k) => (
                <span key={i.id}>
                  {k > 0 && (k === r.incertezas.length - 1 ? " e " : ", ")}
                  <span className="text-texto">{i.nome.charAt(0).toLowerCase() + i.nome.slice(1)}</span>
                </span>
              ))}
              . Nenhum ramo tem peso ou chance atribuídos.
            </p>
          )}
          {/* o leque é um desenho de leitura: só a partir de telas médias, onde os rótulos cabem sem encolher */}
          <figure className="m-0 mt-2 hidden overflow-x-auto md:block">
            <LequeDosFuturos cenarios={r.cenarios} incertezas={r.incertezas} realce={realce} rotuloDoFim={String(r.horizonte.fim)} />
          </figure>
          <ul className="m-0 mt-2 grid list-none gap-3 p-0 md:grid-cols-3">
            {r.cenarios.map((c, i) => (
              <CartaoDoFuturo key={c.id} c={c} indice={i} aoRealcar={setRealce} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function CartaoDoFuturo({ c, indice, aoRealcar }: { c: Cenario; indice: number; aoRealcar: (id: CenarioId | null) => void }) {
  const { r, ix } = useResultado();
  const primeiroSinal = c.indicadores.map((id) => ix.sinais.get(id)).find((s) => s !== undefined);
  const nEvidencias = evidenciasDoCenario(c);
  const nSinais = r.sinais.filter((s) => s.favorece.includes(c.id) || s.enfraquece.includes(c.id)).length;
  const acender = () => aoRealcar(c.id);
  const apagar = () => aoRealcar(null);
  return (
    <li
      className="surgir flex"
      // Entrada em cascata (60 ms entre cartões); com "reduzir movimento" o CSS zera a duração.
      style={{ animationDelay: `${indice * 60}ms` } as CSSProperties}
    >
      <Link
        to={ROTAS.cenarioDaInvestigacao(r.id, c.id)}
        aria-label={`Cenário ${c.id}: ${c.nome}. Abrir a análise aprofundada`}
        onMouseEnter={acender}
        onMouseLeave={apagar}
        onFocus={acender}
        onBlur={apagar}
        className="group cartao cartao-interativo flex w-full flex-col gap-3 p-5 text-left no-underline"
      >
        <span className="flex items-center gap-2 text-micro text-texto-3">
          <span>{c.arquetipo}</span>
          <span aria-hidden="true">·</span>
          <span className="numeros font-dados text-ambar">
            {r.horizonte.inicio}–{r.horizonte.fim}
          </span>
        </span>
        <span className="flex items-center gap-2.5 text-corpo font-medium text-texto">
          <Letra id={c.id} tamanho="grande" />
          <span className="text-balance">{c.nome}</span>
        </span>
        <span className="text-legenda leading-relaxed text-texto-2">{c.ideia}</span>
        {primeiroSinal && (
          <span className="mt-auto flex flex-col gap-1 border-t border-linha pt-3">
            <span className="text-micro text-texto-3">Primeiro sinal a observar</span>
            <span className="text-legenda text-texto">{primeiroSinal.sinal}</span>
          </span>
        )}
        <span className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-1 ${primeiroSinal ? "" : "mt-auto"}`}>
          <span className="text-micro text-texto-3">
            {plural(c.premissas.length, "premissa", "premissas")} · {plural(nEvidencias, "evidência", "evidências")} · {plural(nSinais, "sinal", "sinais")}
          </span>
          <span aria-hidden="true" className="inline-flex items-center gap-1 text-micro font-medium text-ciano-texto">
            Análise aprofundada
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </span>
      </Link>
    </li>
  );
}
