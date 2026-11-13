import { ArrowLeft, ArrowRight, ExternalLink, Minus, Route, Search, Share2, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { numero, plural } from "../../hooks";
import type { ArestaVisual, NoVisual } from "../../types/api";
import { ListaDeChips } from "../analysis/Evidencias";
import { Botao, BotaoIcone, CampoTexto, Pilula, SeloEpistemico, cx } from "../ui";
import { estiloDoTipo, rotuloDoAtributo, rotuloDoPapel } from "./estilos";

export interface ResultadoDoCaminho {
  para: string;
  existe: boolean;
  caminhos: { id: string; nos: string[] }[];
}

export interface PainelDoNoProps {
  no: NoVisual;
  arestas: ArestaVisual[];
  nos: NoVisual[];
  rotuloDe: (id: string) => string;
  aoFechar: () => void;
  aoSelecionar: (id: string) => void;
  aoExpandir: () => void;
  expandindo: boolean;
  mensagemDaExpansao: { ok: boolean; texto: string } | null;
  aoBuscarCaminho: (para: string) => void;
  buscandoCaminho: boolean;
  caminho: ResultadoDoCaminho | null;
  erroDoCaminho: string | null;
  /** id do cabeçalho, para o foco voltar a ele */
  idDoTitulo: string;
}

const POR_GRUPO = 6;

function tipoEpistemicoValido(t: string): t is "confirmado" | "inferencia" | "hipotese" {
  return t === "confirmado" || t === "inferencia" || t === "hipotese";
}

/** Painel do nó selecionado: o que ele é, atributos, relações com as evidências, expandir e caminho. */
export function PainelDoNo({
  no,
  arestas,
  nos,
  rotuloDe,
  aoFechar,
  aoSelecionar,
  aoExpandir,
  expandindo,
  mensagemDaExpansao,
  aoBuscarCaminho,
  buscandoCaminho,
  caminho,
  erroDoCaminho,
  idDoTitulo,
}: PainelDoNoProps) {
  const estilo = estiloDoTipo(no.tipo);
  const { Icone } = estilo;
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [buscando, setBuscando] = useState(false);
  const [termo, setTermo] = useState("");
  const idLista = useId();

  const relacoes = useMemo(() => {
    const minhas = arestas.filter((a) => a.origem === no.id || a.destino === no.id);
    const grupos = new Map<string, ArestaVisual[]>();
    for (const a of minhas) {
      if (!grupos.has(a.rotulo)) grupos.set(a.rotulo, []);
      grupos.get(a.rotulo)!.push(a);
    }
    return { total: minhas.length, grupos: [...grupos.entries()].sort((x, y) => y[1].length - x[1].length) };
  }, [arestas, no.id]);

  const atributos = Object.entries(no.atributos).flatMap(([k, v]) => {
    const rotulo = rotuloDoAtributo(k);
    if (rotulo === null || v === null || v === undefined || v === "") return [];
    return [{ k, rotulo, v }];
  });

  const candidatos = useMemo(() => {
    const t = termo.trim().toLocaleLowerCase("pt-BR");
    return nos
      .filter((n) => n.id !== no.id && (!t || n.rotulo.toLocaleLowerCase("pt-BR").includes(t)))
      .sort((a, b) => b.relevancia - a.relevancia)
      .slice(0, 8);
  }, [nos, no.id, termo]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className={cx("grid size-10 shrink-0 place-items-center rounded-xl border", estilo.amostra, estilo.tinta)} aria-hidden="true">
          <Icone size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={idDoTitulo} tabIndex={-1} className="text-lg font-semibold break-words">
            {no.rotulo}
          </h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-texto-suave">
            <span>{estilo.rotulo}</span>
            <span aria-hidden="true">·</span>
            <span className={cx(no.papel === "focal" && "font-medium text-escarlate")}>{rotuloDoPapel(no.papel)}</span>
            <span aria-hidden="true">·</span>
            <span className="fr-numeros">{plural(no.grau, "relação", "relações")} na base</span>
          </p>
        </div>
        <BotaoIcone rotulo="Fechar painel do nó" variante="fantasma" tamanho="pequeno" onClick={aoFechar}>
          <X size={18} />
        </BotaoIcone>
      </header>

      {no.descricao ? (
        <p lang="en" className="text-sm leading-relaxed text-texto-suave">
          {no.descricao}
        </p>
      ) : (
        <p className="text-sm text-texto-fraco">A base não traz descrição para esta entidade.</p>
      )}

      {no.cenarios.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-texto-suave">
          Presente nos cenários
          {no.cenarios.map((c) => (
            <Pilula key={c} tamanho="pequeno">
              {c}
            </Pilula>
          ))}
        </p>
      )}

      {atributos.length > 0 && (
        <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-superficie-2 p-3 text-xs">
          {atributos.map(({ k, rotulo, v }) => (
            <div key={k} className="contents">
              <dt className="text-texto-fraco">{rotulo}</dt>
              <dd className="min-w-0 break-words text-texto-suave">
                {k === "url" && typeof v === "string" ? (
                  <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-escarlate passar:underline">
                    marvel.com <ExternalLink aria-hidden="true" size={12} />
                    <span className="sr-only">(abre em outra aba)</span>
                  </a>
                ) : k === "personagem" && typeof v === "string" ? (
                  rotuloDe(v)
                ) : (
                  String(v)
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        <Botao tamanho="pequeno" icone={<Share2 />} carregando={expandindo} rotuloCarregando="Expandindo vizinhos" onClick={aoExpandir}>
          Expandir vizinhos
        </Botao>
        <Botao tamanho="pequeno" icone={<Route />} aria-expanded={buscando} aria-controls={idLista} onClick={() => setBuscando((b) => !b)}>
          Caminho até…
        </Botao>
      </div>
      {mensagemDaExpansao && (
        <p role="status" className={cx("-mt-2 text-xs", mensagemDaExpansao.ok ? "text-texto-suave" : "text-perigo")}>
          {mensagemDaExpansao.texto}
        </p>
      )}

      {buscando && (
        <div id={idLista} className="-mt-1 rounded-xl border border-borda p-3">
          <CampoTexto
            rotulo={`Caminho de ${no.rotulo} até…`}
            prefixo={<Search size={16} />}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Nome da entidade"
            autoComplete="off"
          />
          <ul className="mt-2 flex flex-col" aria-label="Entidades do grafo">
            {candidatos.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-sm text-texto passar:bg-superficie-2 disabled:opacity-50"
                  disabled={buscandoCaminho}
                  onClick={() => aoBuscarCaminho(n.id)}
                >
                  <span className="truncate">{n.rotulo}</span>
                  <span className="shrink-0 text-2xs text-texto-fraco">{estiloDoTipo(n.tipo).rotulo}</span>
                </button>
              </li>
            ))}
            {candidatos.length === 0 && <li className="px-2 py-2 text-xs text-texto-fraco">Nenhuma entidade com esse nome neste grafo.</li>}
          </ul>
        </div>
      )}
      {(buscandoCaminho || caminho || erroDoCaminho) && (
        <div role="status" className="-mt-1 text-sm">
          {buscandoCaminho ? (
            <p className="text-texto-suave">Procurando caminhos na base…</p>
          ) : erroDoCaminho ? (
            <p className="text-perigo">{erroDoCaminho}</p>
          ) : caminho && !caminho.existe ? (
            <p className="rounded-xl bg-superficie-2 px-3 py-2 text-texto-suave">
              Sem caminho entre <strong className="font-medium text-texto">{no.rotulo}</strong> e{" "}
              <strong className="font-medium text-texto">{rotuloDe(caminho.para)}</strong> na base.
            </p>
          ) : caminho ? (
            <div className="rounded-xl border border-escarlate-brilho bg-escarlate-tinta/40 px-3 py-2">
              <p className="font-medium text-texto">
                {plural(caminho.caminhos.length, "caminho")} até {rotuloDe(caminho.para)}, destacado{caminho.caminhos.length === 1 ? "" : "s"} no grafo
              </p>
              <ol className="mt-1.5 space-y-1 text-xs text-texto-suave">
                {caminho.caminhos.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <span className="font-mono text-texto-fraco">{p.id}</span> {p.nos.map(rotuloDe).join(" → ")}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      )}

      <section aria-label="Relações" className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold">
          Relações neste grafo <span className="font-normal text-texto-fraco fr-numeros">({numero(relacoes.total)})</span>
        </h4>
        {relacoes.total === 0 && <p className="text-xs text-texto-fraco">Nenhuma relação deste nó entrou no grafo da análise. Tente expandir os vizinhos.</p>}
        {relacoes.grupos.map(([rotulo, lista]) => {
          const aberto = abertos.has(rotulo);
          const visiveis = aberto ? lista : lista.slice(0, POR_GRUPO);
          return (
            <div key={rotulo}>
              <p className="mb-1 text-xs font-medium text-texto-fraco">
                {rotulo} <span className="fr-numeros">· {lista.length}</span>
              </p>
              <ul className="divide-y divide-borda rounded-xl border border-borda">
                {visiveis.map((a) => {
                  const sai = a.origem === no.id;
                  const outro = sai ? a.destino : a.origem;
                  const Seta = !a.dirigida ? Minus : sai ? ArrowRight : ArrowLeft;
                  return (
                    <li key={a.id} className="flex flex-col gap-1.5 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Seta aria-hidden="true" size={14} className="shrink-0 text-texto-fraco" />
                        <span className="sr-only">{!a.dirigida ? "ligado a" : sai ? `${no.rotulo} ${a.rotulo}` : `${a.rotulo} ${no.rotulo}, vindo de`}</span>
                        <button
                          type="button"
                          className="min-w-0 truncate text-left font-medium text-texto underline-offset-2 passar:text-escarlate passar:underline"
                          onClick={() => aoSelecionar(outro)}
                        >
                          {rotuloDe(outro)}
                        </button>
                        {a.ano !== null && <span className="ml-auto shrink-0 text-xs text-texto-fraco fr-numeros">{a.ano}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pl-5">
                        {tipoEpistemicoValido(a.tipo_epistemico) && <SeloEpistemico tipo={a.tipo_epistemico} compacto />}
                        <ListaDeChips ids={a.evidencias} max={3} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {lista.length > POR_GRUPO && (
                <button
                  type="button"
                  className="mt-1 text-xs font-medium text-texto-suave passar:text-escarlate"
                  onClick={() =>
                    setAbertos((s) => {
                      const n = new Set(s);
                      if (aberto) n.delete(rotulo);
                      else n.add(rotulo);
                      return n;
                    })
                  }
                >
                  {aberto ? "Mostrar menos" : `Mostrar as ${lista.length}`}
                </button>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
