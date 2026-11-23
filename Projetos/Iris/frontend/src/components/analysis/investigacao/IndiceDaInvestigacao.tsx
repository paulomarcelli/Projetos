/**
 * Índice das cinco seções, preso ao topo enquanto se lê. Mostra em que seção o leitor está (a que cruza a linha do
 * meio da tela) e leva a qualquer outra com um clique.
 *
 * - Desktop: as cinco seções numa pílula (controle segmentado); a pílula preenchida desliza até a seção atual
 *   (transform e largura, 220 ms, a curva de saída do sistema). É o único movimento: diz "você está aqui" quando a
 *   seção muda durante a rolagem.
 * - Celular: uma linha só com a seção atual ("02 · Cenários prospectivos"); tocar abre a lista das cinco. A lista
 *   entra com opacidade e 6 px de deslocamento (160 ms) e fecha ao escolher, com Esc ou ao tocar fora.
 * Com "reduzir movimento", nada desliza: o traço e a lista só aparecem no lugar.
 */
import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { irParaSecao, SECOES, type SecaoId } from "./secoes";

/** A seção que cruza a linha a 40% da altura da tela. Sem IntersectionObserver (testes), fica na primeira. */
function useSecaoAtual(): SecaoId {
  const [atual, setAtual] = useState<SecaoId>(SECOES[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visiveis = new Set<string>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) e.isIntersecting ? visiveis.add(e.target.id) : visiveis.delete(e.target.id);
        const primeira = SECOES.find((s) => visiveis.has(s.id));
        if (primeira) setAtual(primeira.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const s of SECOES) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);
  return atual;
}

export function IndiceDaInvestigacao() {
  const atual = useSecaoAtual();
  const indice = SECOES.findIndex((s) => s.id === atual);
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLElement>(null);
  const itens = useRef<(HTMLAnchorElement | null)[]>([]);
  const [traco, setTraco] = useState<{ x: number; w: number } | null>(null);

  // posição da pílula da seção atual (mede o item; a pílula anda por transform e ajusta a largura)
  useLayoutEffect(() => {
    const el = itens.current[indice];
    if (el) setTraco({ x: el.offsetLeft, w: el.offsetWidth });
  }, [indice]);

  // fecha a lista do celular com Esc ou com um toque fora
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !raiz.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("keydown", fechar);
    document.addEventListener("pointerdown", fechar);
    return () => {
      document.removeEventListener("keydown", fechar);
      document.removeEventListener("pointerdown", fechar);
    };
  }, [aberto]);

  const ir = (id: SecaoId) => (e: React.MouseEvent) => {
    e.preventDefault();
    setAberto(false);
    irParaSecao(id);
  };
  const s = SECOES[indice];

  return (
    <nav
      ref={raiz}
      aria-label="Seções da investigação"
      className="indice-investigacao sticky top-[var(--altura-topo,0px)] z-20 -mx-1 border-b border-linha bg-abismo px-1 print:hidden"
    >
      {/* desktop: as cinco numa linha */}
      <ol className="relative my-2 hidden w-fit list-none items-stretch gap-0.5 rounded-full border border-linha bg-mar/70 p-1 lg:flex">
        {SECOES.map((x, i) => (
          <li key={x.id}>
            <a
              ref={(el) => {
                itens.current[i] = el;
              }}
              href={`#${x.id}`}
              onClick={ir(x.id)}
              aria-current={x.id === atual ? "location" : undefined}
              className={`relative z-10 flex min-h-9 items-center gap-2 rounded-full px-3.5 text-legenda whitespace-nowrap transition-colors duration-150 ${
                x.id === atual ? "text-texto" : "text-texto-2 hover:text-texto"
              }`}
            >
              <span className={`numeros font-dados text-micro ${x.id === atual ? "text-ouro" : "text-texto-3"}`}>{x.numero}</span>
              {x.nome}
            </a>
          </li>
        ))}
        {traco && (
          <span
            aria-hidden="true"
            className="indice-traco absolute top-1 bottom-1 left-0 rounded-full bg-grafite-alto shadow-cartao"
            style={{ transform: `translateX(${traco.x}px)`, width: traco.w }}
          />
        )}
      </ol>

      {/* celular e tablet: a seção atual; tocar abre a lista */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls="indice-lista"
          onClick={() => setAberto((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="numeros font-dados text-micro text-texto-3">{s.numero}</span>
            <span className="truncate text-corpo text-texto">{s.titulo}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-micro text-texto-3">
            {indice + 1} de {SECOES.length}
            <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} />
          </span>
        </button>
        {aberto && (
          <ol id="indice-lista" className="indice-lista m-0 flex list-none flex-col gap-0.5 border-t border-linha p-0 py-2">
            {SECOES.map((x) => (
              <li key={x.id}>
                <a
                  href={`#${x.id}`}
                  onClick={ir(x.id)}
                  aria-current={x.id === atual ? "location" : undefined}
                  className={`flex min-h-11 items-baseline gap-3 rounded-padrao px-2 py-2 ${x.id === atual ? "bg-ciano-suave text-texto" : "text-texto-2"}`}
                >
                  <span className="numeros font-dados text-micro text-texto-3">{x.numero}</span>
                  <span className="flex flex-col">
                    <span className="text-corpo">{x.titulo}</span>
                    <span className="text-micro text-texto-3">{x.pergunta}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </nav>
  );
}

/**
 * Voltar ao topo: aparece depois de uma tela e meia de rolagem, no canto inferior direito (acima da área segura do
 * celular). Entra com opacidade e 8 px (160 ms); com "reduzir movimento", só aparece.
 */
export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    let quadro = 0;
    const medir = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => setVisivel(window.scrollY > window.innerHeight * 1.5));
    };
    window.addEventListener("scroll", medir, { passive: true });
    medir();
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", medir);
    };
  }, []);
  return (
    <button
      type="button"
      onClick={() => irParaSecao(SECOES[0].id)}
      aria-label="Voltar ao início da investigação"
      data-visivel={visivel || undefined}
      tabIndex={visivel ? 0 : -1}
      aria-hidden={!visivel}
      className="voltar-ao-topo fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid size-11 place-items-center rounded-full border border-linha-forte bg-institucional text-texto-2 shadow-elevado hover:text-texto print:hidden"
    >
      <ChevronDown size={18} aria-hidden="true" className="rotate-180" />
    </button>
  );
}
