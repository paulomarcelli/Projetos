import {
  Compass,
  GitBranch,
  Library,
  Menu,
  Radar,
  ScanSearch,
  Settings,
  Star,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router";
import { prontidao } from "../lib/api";
import { useDados } from "../lib/useDados";
import { BuscaGlobal } from "./BuscaGlobal";
import { Marca } from "./Marca";
import { ROTAS } from "../lib/rotas";

interface Item {
  para: string;
  rotulo: string;
  icone: LucideIcon;
}

/**
 * A navegação segue a estrutura intelectual do produto: do presente (o que se sabe e
 * como os atores se relacionam) para os futuros (cenários e os sinais que os anunciam), apoiada
 * no acervo.
 */
const GRUPOS: { titulo: string | null; itens: Item[] }[] = [
  { titulo: null, itens: [{ para: ROTAS.inicio, rotulo: "Início", icone: Compass }] },
  {
    titulo: "Presente",
    itens: [
      { para: ROTAS.investigacoes, rotulo: "Investigações", icone: ScanSearch },
      { para: ROTAS.base, rotulo: "Base científica", icone: Library },
      { para: ROTAS.mapas, rotulo: "Mapas e relações", icone: Waypoints },
    ],
  },
  {
    titulo: "Futuros",
    itens: [
      { para: ROTAS.cenarios, rotulo: "Cenários prospectivos", icone: GitBranch },
      { para: ROTAS.sinais, rotulo: "Sinais antecipatórios", icone: Radar },
    ],
  },
  {
    titulo: "Pessoal",
    itens: [
      { para: ROTAS.favoritos, rotulo: "Favoritos", icone: Star },
      { para: ROTAS.configuracoes, rotulo: "Configurações", icone: Settings },
    ],
  },
];

function EstadoDoSistema() {
  const { tipo, dados } = useDados(prontidao, []);
  const [rotulo, cor] =
    tipo === "carregando"
      ? ["Verificando…", "var(--color-texto-3)"]
      : tipo === "erro"
        ? ["API fora do ar", "var(--color-negativo)"]
        : dados.status === "ready"
          ? ["Sistema operacional", "var(--color-positivo)"]
          : ["Dependências pendentes", "var(--color-ambar)"];
  return (
    <NavLink
      to={ROTAS.configuracoes}
      className="flex items-center gap-2 rounded-padrao px-3 py-2 text-micro text-texto-3 hover:bg-grafite hover:text-texto-2"
    >
      <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" className="shrink-0">
        <circle cx="4" cy="4" r="3.5" fill={cor} />
      </svg>
      {rotulo}
    </NavLink>
  );
}

function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <nav aria-label="Módulos" className="flex flex-col gap-5">
      {GRUPOS.map((g, i) => (
        <div key={g.titulo ?? i} className="flex flex-col gap-0.5">
          {g.titulo && <p className="rotulo mb-1 px-3">{g.titulo}</p>}
          {g.itens.map(({ para, rotulo, icone: Icone }) => (
            <NavLink
              key={para}
              to={para}
              end={para === ROTAS.inicio}
              onClick={aoNavegar}
              className={({ isActive }) =>
                `group relative flex min-h-10 items-center gap-3 rounded-padrao px-3 text-corpo transition-colors duration-150 ${
                  isActive
                    ? "bg-grafite text-texto"
                    : "text-texto-2 hover:bg-grafite/60 hover:text-texto"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span aria-hidden="true" className="absolute top-2.5 bottom-2.5 left-0 w-[2px] rounded-full bg-ciano" />
                  )}
                  <Icone size={17} strokeWidth={1.6} aria-hidden="true" className={isActive ? "text-ciano" : "text-texto-3 group-hover:text-texto-2"} />
                  <span className="truncate">{rotulo}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const [gaveta, setGaveta] = useState(false);
  const local = useLocation();
  const principal = useRef<HTMLElement>(null);

  // Ao trocar de página: fecha a gaveta e leva o foco ao conteúdo (leitores de tela).
  useEffect(() => {
    setGaveta(false);
    principal.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [local.pathname]);

  useEffect(() => {
    if (!gaveta) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setGaveta(false);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [gaveta]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#conteudo" className="sr-only z-50 rounded-padrao bg-ciano px-3 py-2 text-abismo focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Pular para o conteúdo
      </a>

      {/* Lateral fixa (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-r border-linha bg-abismo px-3 py-5 lg:flex">
        <NavLink to={ROTAS.inicio} className="w-fit px-3" aria-label="Início">
          <Marca />
        </NavLink>
        <Navegacao />
        <div className="mt-auto flex flex-col gap-1">
          <EstadoDoSistema />
          <NavLink to={ROTAS.landing} className="px-3 py-1 text-micro text-texto-3 hover:text-texto-2">
            Sobre o Iris
          </NavLink>
        </div>
      </aside>

      {/* Gaveta (tablet e celular) */}
      {gaveta && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navegação">
          <button type="button" aria-label="Fechar navegação" className="absolute inset-0 bg-abismo/70" onClick={() => setGaveta(false)} />
          <div className="gaveta absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col gap-6 overflow-y-auto border-r border-linha bg-abismo px-3 py-5" style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}>
            <div className="flex items-center justify-between px-3">
              <Marca />
              <button type="button" className="botao botao-fantasma botao-pequeno -mr-2 px-2" aria-label="Fechar navegação" onClick={() => setGaveta(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <Navegacao aoNavegar={() => setGaveta(false)} />
            <div className="mt-auto">
              <EstadoDoSistema />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 border-b border-linha bg-abismo/92 py-3 backdrop-blur-md"
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno -ml-1 px-2 lg:hidden"
            aria-label="Abrir navegação"
            aria-expanded={gaveta}
            onClick={() => setGaveta(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <span className="lg:hidden">
            <Marca compacta />
          </span>
          <div className="flex min-w-0 flex-1 justify-end lg:justify-start">
            <BuscaGlobal />
          </div>
        </header>

        <main
          id="conteudo"
          ref={principal}
          tabIndex={-1}
          className="fundo-cartografico flex-1 outline-none focus:outline-none focus-visible:outline-none"
          style={{
            paddingLeft: "max(1rem, env(safe-area-inset-left))",
            paddingRight: "max(1rem, env(safe-area-inset-right))",
          }}
        >
          <div className="mx-auto w-full max-w-[1240px] py-6 sm:px-2 lg:px-6 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Cabeçalho padrão das páginas internas. */
export function CabecalhoDePagina({
  rotulo,
  titulo,
  children,
  acoes,
}: {
  rotulo?: string;
  titulo: string;
  children?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-linha pb-6 [&:not(:last-child)]:mb-8 [.flex>&]:mb-0">
      <div className="min-w-0 max-w-3xl">
        {rotulo && <p className="rotulo mb-2">{rotulo}</p>}
        <h1 className="font-editorial text-titulo font-medium tracking-[-0.01em] text-texto">{titulo}</h1>
        {children && <div className="mt-2 max-w-[65ch] text-corpo text-texto-2">{children}</div>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}
