/**
 * Controles de aparência. Todos leem e escrevem o MESMO estado (store/preferencias.ts), então o
 * botão do menu e as Configurações nunca discordam.
 *
 * - SeletorTema (Configurações): Escuro | Claro | Igual ao sistema.
 * - SeletorTamanhoTexto (Configurações): Padrão 16 | Confortável 18 | Ampliada 20.
 * - AlternarTema (menu): um botão com sol e lua que se transformam um no outro. O rótulo diz o
 *   que o clique FAZ ("Usar tema claro"), não o estado atual.
 */
import { Monitor, Moon, Sun } from "lucide-react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { escolherTema, escolherTexto, TAMANHOS, usePreferencias, type PreferenciaTema, type TamanhoTexto } from "../../store/preferencias";

/**
 * Grupo de rádio do WAI-ARIA: Tab entra no item marcado; setas movem a escolha (e a aplicam,
 * como num rádio nativo). Serve aos dois seletores.
 */
function GrupoDeOpcoes<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
}: {
  rotulo: string;
  valor: T;
  opcoes: { id: T; conteudo: ReactNode; descricao?: string }[];
  aoEscolher: (v: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const teclado = (e: KeyboardEvent, i: number) => {
    const n = opcoes.length;
    const passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const alvo = (i + passo + n) % n;
    aoEscolher(opcoes[alvo].id);
    refs.current[alvo]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex flex-wrap gap-2">
      {opcoes.map((o, i) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={valor === o.id}
          aria-description={o.descricao}
          tabIndex={valor === o.id ? 0 : -1}
          className="ficha min-h-11 px-4 text-corpo"
          onClick={() => aoEscolher(o.id)}
          onKeyDown={(e) => teclado(e, i)}
        >
          {o.conteudo}
        </button>
      ))}
    </div>
  );
}

const TEMAS: { id: PreferenciaTema; rotulo: string; icone: typeof Sun }[] = [
  { id: "escuro", rotulo: "Escuro", icone: Moon },
  { id: "claro", rotulo: "Claro", icone: Sun },
  { id: "sistema", rotulo: "Igual ao sistema", icone: Monitor },
];

export function SeletorTema() {
  const { tema } = usePreferencias();
  return (
    <GrupoDeOpcoes
      rotulo="Tema de cor"
      valor={tema}
      aoEscolher={escolherTema}
      opcoes={TEMAS.map(({ id, rotulo, icone: Icone }) => ({
        id,
        conteudo: (
          <>
            <Icone size={16} aria-hidden="true" />
            {rotulo}
          </>
        ),
      }))}
    />
  );
}

/**
 * Tamanho do texto. Cada opção traz uma amostra "Aa" no tamanho que aplica (fixo em px, para a
 * amostra não crescer junto com a escolha): dá para comparar antes do clique.
 */
export function SeletorTamanhoTexto() {
  const { texto } = usePreferencias();
  return (
    <GrupoDeOpcoes<TamanhoTexto>
      rotulo="Tamanho do texto"
      valor={texto}
      aoEscolher={escolherTexto}
      opcoes={TAMANHOS.map((t) => ({
        id: t.id,
        descricao: `Texto principal em ${t.px} pixels`,
        conteudo: (
          <>
            <span aria-hidden="true" className="font-editorial leading-none" style={{ fontSize: `${t.px}px` }}>
              Aa
            </span>
            {t.rotulo}
            <span className="numeros text-texto-3">{t.px}</span>
          </>
        ),
      }))}
    />
  );
}

/**
 * Sol (tema claro) e lua (tema escuro) num só desenho: o disco cresce e é recortado por um
 * círculo de máscara para virar lua crescente; os raios giram e somem. As transições estão no
 * CSS (.astro-tema), em transform e opacity, e são desligadas com "reduzir movimento".
 * Por que CSS e não a biblioteca Motion: este botão vive no menu, presente em todas as páginas;
 * a Motion só é carregada nos trechos sob demanda (landing, timeline) e não deve entrar no
 * pacote principal por causa de um ícone.
 */
function Astro({ lua }: { lua: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="astro-tema shrink-0" data-lua={lua || undefined}>
      <mask id={id}>
        <rect width="24" height="24" fill="white" />
        <circle className="astro-mordida" cx="16.5" cy="7.5" r="6" fill="black" />
      </mask>
      <circle className="astro-disco" cx="12" cy="12" r="5" fill="currentColor" mask={`url(#${id})`} />
      <g className="astro-raios" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={12 + Math.cos(a) * 8} y1={12 + Math.sin(a) * 8} x2={12 + Math.cos(a) * 10} y2={12 + Math.sin(a) * 10} />;
        })}
      </g>
    </svg>
  );
}

export function AlternarTema({ compacto = false }: { compacto?: boolean }) {
  const { temaEfetivo } = usePreferencias();
  const claro = temaEfetivo === "claro";
  const acao = claro ? "Usar tema escuro" : "Usar tema claro";
  return (
    <button
      type="button"
      onClick={() => escolherTema(claro ? "escuro" : "claro")}
      aria-label={compacto ? acao : undefined}
      className={`relative flex min-h-10 items-center gap-3 rounded-padrao text-legenda text-texto-2 transition-colors duration-150 hover:bg-grafite hover:text-texto ${
        compacto ? "w-11 justify-center" : "px-3"
      }`}
    >
      {/* Sol no tema claro, lua no escuro: o ícone mostra onde se está; o texto, o que o clique faz. */}
      <Astro lua={!claro} />
      {compacto ? (
        <span className="dica" aria-hidden="true">
          {acao}
        </span>
      ) : (
        acao
      )}
    </button>
  );
}
