/**
 * 02 · Futuros possíveis — o núcleo prospectivo: quantas trajetórias até o fim do horizonte e, para cada uma, a letra,
 * o nome e uma frase (`ideia`). Sem probabilidade nem etiqueta de chance: são trajetórias condicionais.
 *
 * Cada cartão leva à Análise do Cenário (`/app/investigacoes/:id/cenarios/:letra`), o segundo nível da investigação:
 * tese, lógica, trajetória, dinâmicas, consequências, inflexões, indicadores e premissas daquele futuro.
 */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { RotuloDeSecao } from "./RotuloDeSecao";

const POR_EXTENSO = ["Nenhuma", "Uma", "Duas", "Três", "Quatro", "Cinco", "Seis"];

export function SecaoCenarios() {
  const { r } = useResultado();
  const secao = SECOES[1];
  const n = r.cenarios.length;
  const quantas = `${POR_EXTENSO[n] ?? n} ${n === 1 ? "trajetória" : "trajetórias"} até ${r.horizonte.fim}`;
  return (
    <section id={secao.id} aria-label={secao.titulo} className="flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-4">
      <RotuloDeSecao numero={secao.numero} nome={secao.titulo} nucleo />
      <p className="text-micro font-medium tracking-[0.06em] text-ouro">Núcleo prospectivo</p>
      <h2 tabIndex={-1} data-titulo-secao className="font-editorial text-secao font-medium text-texto outline-none sm:text-titulo">
        {n > 0 ? quantas : "Sem cenários nesta investigação"}
      </h2>
      {n === 0 ? (
        <p className="max-w-[64ch] text-corpo text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. As lacunas estão em "Como esta análise foi feita".
        </p>
      ) : (
        <ul className="m-0 mt-2 grid list-none gap-3 p-0 md:grid-cols-3">
          {r.cenarios.map((c) => {
            return (
              <li key={c.id} className="flex">
                <Link
                  to={ROTAS.cenarioDaInvestigacao(r.id, c.id)}
                  aria-label={`Cenário ${c.id}: ${c.nome}. Abrir a análise aprofundada`}
                  className="group cartao cartao-interativo flex w-full flex-col gap-3 p-5 text-left no-underline"
                >
                  <span className="flex items-center gap-2.5 text-corpo font-medium text-texto">
                    <Letra id={c.id} tamanho="grande" />
                    <span>{c.nome}</span>
                  </span>
                  <span className="text-legenda leading-relaxed text-texto-2">{c.ideia}</span>
                  <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-1 text-micro font-medium text-ciano-texto">
                    Análise aprofundada
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
