import { FileText, GitBranch, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { listarDocumentos, type DocumentoResumo, type Paginado } from "../lib/api";
import { autores, tituloDoDocumento } from "../lib/formato";
import { useRascunhos } from "../lib/local";

const LIMITE_INDICE = 100;

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

interface Resultado {
  chave: string;
  tipo: "documento" | "rascunho";
  titulo: string;
  detalhe: string | null;
  destino: string;
}

/**
 * Busca global. Hoje procura em dados reais que existem: documentos (os 100 mais recentes) e
 * rascunhos de investigação deste navegador. Países, atores e eventos ainda não estão indexados
 * — e a busca diz isso, em vez de fingir resultados.
 */
export function BuscaGlobal() {
  const navegar = useNavigate();
  const { rascunhos } = useRascunhos();
  const [consulta, setConsulta] = useState("");
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [indice, setIndice] = useState<Paginado<DocumentoResumo> | null>(null);
  const [falhou, setFalhou] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const idLista = useId();

  // Atalho "/" para focar a busca (sem animação: ação de teclado repetida).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const digitando = alvo?.closest("input, textarea, select, [contenteditable=true]");
      if (e.key === "/" && !digitando && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        entrada.current?.focus();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  useEffect(() => {
    const aoClicarFora = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("pointerdown", aoClicarFora);
    return () => document.removeEventListener("pointerdown", aoClicarFora);
  }, []);

  const carregarIndice = () => {
    if (indice || falhou) return;
    listarDocumentos({ limit: LIMITE_INDICE }).then(setIndice, () => setFalhou(true));
  };

  const resultados = useMemo<Resultado[]>(() => {
    const q = normalizar(consulta.trim());
    if (q.length < 2) return [];
    const docs: Resultado[] = (indice?.items ?? [])
      .filter((d) =>
        normalizar([d.title, d.original_filename, ...(d.authors ?? [])].filter(Boolean).join(" ")).includes(q),
      )
      .slice(0, 6)
      .map((d) => ({
        chave: `d:${d.id}`,
        tipo: "documento",
        titulo: tituloDoDocumento(d).texto,
        detalhe: [autores(d.authors, 1), d.publication_year].filter(Boolean).join(" · ") || null,
        destino: `/documentos/${d.id}`,
      }));
    const rasc: Resultado[] = rascunhos
      .filter((r) => normalizar(r.pergunta).includes(q))
      .slice(0, 3)
      .map((r) => ({
        chave: `r:${r.id}`,
        tipo: "rascunho",
        titulo: r.pergunta,
        detalhe: "Rascunho de investigação · não processado",
        destino: `/investigacoes?rascunho=${r.id}`,
      }));
    return [...docs, ...rasc];
  }, [consulta, indice, rascunhos]);

  useEffect(() => setAtivo(0), [consulta]);

  const ir = (r: Resultado) => {
    setAberta(false);
    setConsulta("");
    navegar(r.destino);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setAberta(false);
      entrada.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberta(true);
      setAtivo((i) => Math.min(i + 1, Math.max(resultados.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[ativo]) {
      e.preventDefault();
      ir(resultados[ativo]);
    }
  };

  const mostrarPainel = aberta && consulta.trim().length >= 2;

  return (
    <div ref={caixa} className="relative w-full max-w-xl">
      <label htmlFor="busca-global" className="sr-only">
        Buscar documentos, autores e investigações
      </label>
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
      <input
        ref={entrada}
        id="busca-global"
        type="search"
        role="combobox"
        aria-expanded={mostrarPainel}
        aria-controls={idLista}
        aria-activedescendant={mostrarPainel && resultados[ativo] ? `${idLista}-${ativo}` : undefined}
        autoComplete="off"
        placeholder="Buscar países, atores, eventos, documentos…"
        className="campo pr-10 pl-9"
        value={consulta}
        onChange={(e) => {
          setConsulta(e.target.value);
          setAberta(true);
        }}
        onFocus={() => {
          carregarIndice();
          setAberta(true);
        }}
        onKeyDown={aoTeclar}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-fino border border-linha-forte px-1.5 font-dados text-micro text-texto-3 sm:block">
        /
      </kbd>

      {mostrarPainel && (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 overflow-hidden rounded-padrao border border-linha-forte bg-grafite shadow-[0_16px_40px_rgb(0_0_0/0.45)]">
          <ul id={idLista} role="listbox" aria-label="Resultados da busca" className="max-h-80 overflow-y-auto py-1">
            {resultados.map((r, i) => (
              <li
                key={r.chave}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={i === ativo}
                className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${i === ativo ? "bg-grafite-alto" : ""}`}
                onPointerMove={() => setAtivo(i)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  ir(r);
                }}
              >
                {r.tipo === "documento" ? (
                  <FileText size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ciano-texto" />
                ) : (
                  <GitBranch size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ambar" />
                )}
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-corpo text-texto">{r.titulo}</span>
                  {r.detalhe && <span className="block truncate text-micro text-texto-2">{r.detalhe}</span>}
                </span>
              </li>
            ))}
            {resultados.length === 0 && (
              <li className="px-3 py-3 text-legenda text-texto-2">
                {falhou
                  ? "Não foi possível consultar os documentos agora."
                  : indice
                    ? "Nenhum documento ou rascunho corresponde a essa busca."
                    : "Carregando o índice de documentos…"}
              </li>
            )}
          </ul>
          <p className="border-t border-linha px-3 py-2 text-micro text-texto-3">
            Países, atores e eventos ainda não estão indexados: dependem da extração de entidades.
            {indice && indice.total > LIMITE_INDICE && ` Busca nos ${LIMITE_INDICE} documentos mais recentes.`}
          </p>
        </div>
      )}
    </div>
  );
}
