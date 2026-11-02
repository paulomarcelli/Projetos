import { ExternalLink, FileText, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { mensagemDoErro, numero } from "../../hooks";
import { obterEvidencia } from "../../services";
import type { Evidencia } from "../../types/api";
import { AvisoDeErro, BotaoIcone, Carregando, Esqueleto, SeloConfiabilidade, cx } from "../ui";

export const TIPOS_DE_EVIDENCIA: Record<string, string> = {
  trecho: "Trecho de fonte",
  relacao: "Relação do grafo",
  momento: "Momento da trajetória",
  aparicao: "Aparição em obra",
};

export function rotuloDoTipoDeEvidencia(tipo: string): string {
  return TIPOS_DE_EVIDENCIA[tipo] ?? tipo;
}

interface ValorDasEvidencias {
  abrir: (id: string) => void;
  registrar: (registro: Record<string, Evidencia>) => void;
  obter: (id: string) => Evidencia | undefined;
  /** rótulo legível de uma entidade (do grafo, quando ele já carregou) */
  rotuloDaEntidade: (id: string) => string;
}

const Contexto = createContext<ValorDasEvidencias | null>(null);

/** null fora de uma análise (ex.: explorador no dashboard): os chips ficam só como texto. */
export function useEvidencias(): ValorDasEvidencias | null {
  return useContext(Contexto);
}

export interface ProvedorDeEvidenciasProps {
  investigacaoId: string;
  /** registro da investigação + do grafo */
  registro: Record<string, Evidencia>;
  rotuloDaEntidade: (id: string) => string;
  children: ReactNode;
}

/**
 * Guarda o registro de evidências da análise e abre a gaveta com o texto literal e a fonte.
 * Uma evidência que não está no registro local é pedida à API (GET /investigacoes/{id}/evidencias/{eid}).
 */
export function ProvedorDeEvidencias({ investigacaoId, registro, rotuloDaEntidade, children }: ProvedorDeEvidenciasProps) {
  const [extras, setExtras] = useState<Record<string, Evidencia>>({});
  const [aberta, setAberta] = useState<string | null>(null);
  const todas = useMemo(() => ({ ...registro, ...extras }), [registro, extras]);
  const todasRef = useRef(todas);
  todasRef.current = todas;

  const registrar = useCallback((r: Record<string, Evidencia>) => setExtras((e) => ({ ...e, ...r })), []);
  const obter = useCallback((id: string) => todasRef.current[id], []);
  const valor = useMemo<ValorDasEvidencias>(() => ({ abrir: setAberta, registrar, obter, rotuloDaEntidade }), [registrar, obter, rotuloDaEntidade]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <GavetaDeEvidencia
        investigacaoId={investigacaoId}
        id={aberta}
        local={aberta ? todas[aberta] : undefined}
        aoFechar={() => setAberta(null)}
        aoCarregar={(ev) => registrar({ [ev.id]: ev })}
        rotuloDaEntidade={rotuloDaEntidade}
      />
    </Contexto.Provider>
  );
}

/** Chip clicável de uma evidência (E3, E7…). Fora de uma análise vira texto. */
export function ChipDeEvidencia({ id, className }: { id: string; className?: string }) {
  const ctx = useEvidencias();
  const ev = ctx?.obter(id);
  const classe = cx(
    "inline-flex h-6 min-w-8 items-center justify-center rounded-md border px-1.5 font-mono text-2xs leading-none fr-numeros",
    "border-borda-forte bg-superficie-2 text-texto-suave",
    className,
  );
  if (!ctx) return <span className={classe}>{id}</span>;
  return (
    <button
      type="button"
      className={cx(
        classe,
        "cursor-pointer transition-[color,border-color,background-color] duration-150 passar:border-escarlate passar:text-escarlate focus-visible:border-escarlate",
      )}
      onClick={() => ctx.abrir(id)}
      aria-label={`Evidência ${id}${ev?.fonte.titulo ? `: ${ev.fonte.titulo}` : ""}`}
      aria-haspopup="dialog"
    >
      {id}
    </button>
  );
}

export function ListaDeChips({ ids, max = 6, className }: { ids: string[]; max?: number; className?: string }) {
  const [todos, setTodos] = useState(false);
  if (ids.length === 0) return <span className={cx("text-xs text-texto-fraco", className)}>sem evidência citada</span>;
  const visiveis = todos ? ids : ids.slice(0, max);
  return (
    <span className={cx("inline-flex flex-wrap items-center gap-1", className)}>
      {visiveis.map((id) => (
        <ChipDeEvidencia key={id} id={id} />
      ))}
      {ids.length > max && !todos && (
        <button
          type="button"
          className="h-6 rounded-md px-1.5 text-2xs font-medium text-texto-suave underline-offset-2 passar:text-escarlate passar:underline"
          onClick={() => setTodos(true)}
        >
          +{ids.length - max}
        </button>
      )}
    </span>
  );
}

interface GavetaProps {
  investigacaoId: string;
  id: string | null;
  local: Evidencia | undefined;
  aoFechar: () => void;
  aoCarregar: (e: Evidencia) => void;
  rotuloDaEntidade: (id: string) => string;
}

function GavetaDeEvidencia({ investigacaoId, id, local, aoFechar, aoCarregar, rotuloDaEntidade }: GavetaProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const anterior = useRef<HTMLElement | null>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const [remota, setRemota] = useState<{ id: string; ev?: Evidencia; erro?: unknown } | null>(null);
  const aberta = id !== null;
  const ev = local ?? (remota?.id === id ? remota?.ev : undefined);
  const erro = remota?.id === id ? remota?.erro : undefined;
  const aoFecharRef = useRef(aoFechar);
  aoFecharRef.current = aoFechar;
  const aoCarregarRef = useRef(aoCarregar);
  aoCarregarRef.current = aoCarregar;
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) {
      anterior.current = document.activeElement as HTMLElement | null;
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      fechar.current?.focus();
    } else if (!aberta && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
      const volta = anterior.current;
      anterior.current = null;
      if (volta?.isConnected) volta.focus();
    }
  }, [aberta]);

  useEffect(() => {
    if (!id || local) return;
    const c = new AbortController();
    setRemota({ id });
    obterEvidencia(investigacaoId, id, c.signal).then(
      (e) => {
        setRemota({ id, ev: e });
        aoCarregarRef.current(e);
      },
      (e: unknown) => {
        if (!c.signal.aborted) setRemota({ id, erro: e });
      },
    );
    return () => c.abort();
  }, [id, local, investigacaoId, tentativa]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const cancelar = (e: Event) => {
      e.preventDefault();
      aoFecharRef.current();
    };
    d.addEventListener("cancel", cancelar);
    return () => d.removeEventListener("cancel", cancelar);
  }, []);

  const msg = erro ? mensagemDoErro(erro, "a evidência") : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="gaveta-evidencia-titulo"
      className={cx(
        "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-[min(30rem,100vw)] overflow-hidden border-0 border-l border-borda bg-superficie p-0 text-texto shadow-alta",
        "backdrop:bg-sobreposicao",
        "movimento:transition-[translate,opacity] movimento:duration-400 movimento:ease-drawer movimento:starting:open:translate-x-8 starting:open:opacity-0",
      )}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          aoFecharRef.current();
        }
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFecharRef.current();
      }}
    >
      {aberta && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-borda px-5 pt-5 pb-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-medium text-texto-fraco">
                <FileText aria-hidden="true" size={14} />
                {ev ? rotuloDoTipoDeEvidencia(ev.tipo) : "Evidência"}
              </p>
              <h2 id="gaveta-evidencia-titulo" className="mt-1 text-lg font-semibold">
                Evidência <span className="font-mono">{id}</span>
              </h2>
            </div>
            <BotaoIcone ref={fechar} rotulo="Fechar evidência" variante="fantasma" tamanho="pequeno" dica={false} onClick={() => aoFecharRef.current()}>
              <X size={18} />
            </BotaoIcone>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {msg ? (
              <AvisoDeErro titulo={msg.titulo} texto={msg.texto} aoTentarNovamente={msg.repetivel ? () => setTentativa((t) => t + 1) : undefined} />
            ) : !ev ? (
              <div className="space-y-4">
                <Carregando rotulo="Buscando a evidência…" tamanho="pequeno" />
                <Esqueleto linhas={6} />
              </div>
            ) : (
              <div className="space-y-6">
                <section aria-labelledby="ev-fonte">
                  <h3 id="ev-fonte" className="text-xs font-medium text-texto-fraco">
                    Fonte
                  </h3>
                  <p className="mt-1.5 text-base font-medium text-texto">{tituloDaFonte(ev.fonte)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <SeloConfiabilidade confiabilidade={ev.fonte.confiabilidade} />
                    {ev.fonte.licenca && <span className="text-xs text-texto-fraco">Licença: {ev.fonte.licenca}</span>}
                  </div>
                  {ev.fonte.url && (
                    <a
                      href={ev.fonte.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-escarlate underline-offset-2 passar:underline"
                    >
                      <span className="truncate">{hostDaUrl(ev.fonte.url)}</span>
                      <ExternalLink aria-hidden="true" size={14} className="shrink-0" />
                      <span className="sr-only">(abre em outra aba)</span>
                    </a>
                  )}
                </section>

                <section aria-labelledby="ev-texto">
                  <h3 id="ev-texto" className="text-xs font-medium text-texto-fraco">
                    Texto literal <span className="font-normal">(no idioma da fonte)</span>
                  </h3>
                  <blockquote lang="en" className="mt-2 rounded-xl border-l-2 border-borda-forte bg-superficie-2 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-texto">
                    {ev.texto}
                  </blockquote>
                </section>

                {ev.entidades.length > 0 && (
                  <section aria-labelledby="ev-entidades">
                    <h3 id="ev-entidades" className="text-xs font-medium text-texto-fraco">
                      Entidades citadas
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {ev.entidades.map((e) => (
                        <li key={e} className="rounded-full border border-borda px-2.5 py-1 text-xs text-texto-suave">
                          {rotuloDaEntidade(e)}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-borda pt-4 text-xs">
                  {ev.nota !== null && (
                    <>
                      <dt className="text-texto-fraco">Nota da recuperação</dt>
                      <dd className="fr-numeros text-texto-suave">{numero(Math.round(ev.nota * 10000) / 10000)}</dd>
                    </>
                  )}
                  {ev.chunk_id && (
                    <>
                      <dt className="text-texto-fraco">Trecho</dt>
                      <dd className="font-mono break-all text-texto-suave">{ev.chunk_id}</dd>
                    </>
                  )}
                  {ev.aresta_id && (
                    <>
                      <dt className="text-texto-fraco">Relação</dt>
                      <dd className="font-mono break-all text-texto-suave">{ev.aresta_id}</dd>
                    </>
                  )}
                  <dt className="text-texto-fraco">Documento</dt>
                  <dd className="font-mono break-all text-texto-suave">{ev.fonte.doc_id}</dd>
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Título legível da fonte: o da API; sem ele, o nome da página no fim da URL (ex.: "Thor: The Dark World"). */
export function tituloDaFonte(f: Evidencia["fonte"]): string {
  if (f.titulo) return f.titulo;
  try {
    const u = new URL(f.url);
    const ultimo = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "");
    if (ultimo && !/^(profile|on-screen)$/i.test(ultimo)) return ultimo.replace(/_/g, " ");
    const partes = u.pathname.split("/").filter(Boolean);
    const nome = partes.find((_, i) => partes[i - 1] === "characters" || partes[i - 1] === "movies" || partes[i - 1] === "tv-shows");
    if (nome) return nome.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  } catch {
    /* url inválida: cai no doc_id */
  }
  return f.doc_id;
}

export function hostDaUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname.length > 1 ? u.pathname : ""}`;
  } catch {
    return url;
  }
}
