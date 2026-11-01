/**
 * 02 · Futuros possíveis — o núcleo prospectivo: quantas trajetórias até o fim do horizonte e, para cada uma, a letra,
 * o nome e uma frase (`ideia`). Sem probabilidade nem etiqueta de chance: são trajetórias condicionais.
 *
 * Cada cartão é um botão: destaca o cenário (o mesmo destaque do mapa e da linha do tempo) e abre o detalhe completo
 * no painel lateral, sem sair da página. A tela de análise está sendo refeita por partes; o resto do cenário vive no
 * painel até voltar para a página.
 */
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { RotuloDeSecao } from "./RotuloDeSecao";

const POR_EXTENSO = ["Nenhuma", "Uma", "Duas", "Três", "Quatro", "Cinco", "Seis"];

export function SecaoCenarios() {
  const { r, vista, setVista, selecionar } = useResultado();
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
            const ativo = vista === c.id;
            return (
              <li key={c.id} className="flex">
                <button
                  type="button"
                  aria-pressed={ativo}
                  aria-label={`Cenário ${c.id}: ${c.nome}. Abrir o detalhe ao lado`}
                  onClick={() => {
                    setVista(c.id);
                    selecionar({ tipo: "cenario", id: c.id });
                  }}
                  className={`cartao cartao-interativo flex w-full flex-col gap-3 p-5 text-left ${ativo ? "ring-1 ring-ciano/60" : ""}`}
                >
                  <span className="flex items-center gap-2.5 text-corpo font-medium text-texto">
                    <Letra id={c.id} ativa={ativo} tamanho="grande" />
                    <span>{c.nome}</span>
                  </span>
                  <span className="text-legenda leading-relaxed text-texto-2">{c.ideia}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
