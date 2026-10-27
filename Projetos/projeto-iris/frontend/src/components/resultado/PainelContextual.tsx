import { ArrowLeft, ChevronDown, ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { RELACOES } from "../Diagramas";
import { Epistemico } from "../Epistemico";
import type { CenarioId, Fonte, Vista } from "../../lib/investigacao";
import { relacaoNaVista, ROTULO_MUDANCA, statusDaRelacao, useResultado, type Selecao } from "./contexto";
import { PainelMetodo } from "./Analise";
import { NOME_GRUPO, NOME_TEMA, NOME_TIPO_ATOR } from "./MapaDeAtores";
import { CATEGORIA, ChipAtor, Citacoes, GlifoTempo, Letra, LinhaAfirmacao } from "./pecas";

const ESTILO = new Map(RELACOES.map((x) => [x.tipo, x]));
export const NATUREZA: Record<Fonte["natureza"], string> = {
  primaria: "Fonte primária",
  secundaria: "Fonte secundária",
  terciaria: "Fonte terciária",
};

function Bloco({ n, titulo, children }: { n?: number; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-linha pt-4">
      <h3 className="flex items-baseline gap-2 text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">
        {n !== undefined && <span className="numeros font-dados">{n}</span>}
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Lista de evidências como botões que abrem a cadeia completa. */
function ListaDeEvidencias({ ids }: { ids: string[] }) {
  const { ix, selecionar } = useResultado();
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return <p className="text-legenda text-ambar">Nenhuma evidência vinculada. Trate como interpretação a confirmar.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {unicos.map((id) => {
        const e = ix.evidencias.get(id);
        if (!e) return null;
        return (
          <li key={id}>
            <button type="button" onClick={() => selecionar({ tipo: "evidencia", id })} className="flex w-full items-start gap-2 rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto hover:border-linha-forte">
              <span className="min-w-0 flex-1">{e.afirmacao}</span>
              <span className="shrink-0 font-dados text-micro text-ciano-texto">[{e.fontes.map((f) => ix.numero.get(f)).join(",")}]</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Implicacoes({ textos }: { textos: Record<CenarioId, string> }) {
  const { vista } = useResultado();
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {(Object.keys(textos) as CenarioId[]).map((c) => (
        <li key={c} className={`flex gap-2 rounded-padrao p-2 text-legenda ${vista === c ? "bg-ambar-suave text-texto" : "text-texto-2"}`}>
          <Letra id={c} ativa={vista === c} />
          <span className="min-w-0">{textos[c]}</span>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ conteúdos

function PainelAtor({ id }: { id: string }) {
  const { r, ix, vista, selecionar } = useResultado();
  const a = ix.atores.get(id);
  if (!a) return null;
  const rels = r.relacoes.map((x) => relacaoNaVista(x, vista)).filter((x) => x.visivel && (x.rel.de === id || x.rel.para === id));
  const evs = a.caracteristicas.flatMap((c) => c.evidencias ?? []);
  const blocos = r.blocos.filter((b) => b.membros[vista].includes(id));
  return (
    <>
      <Bloco n={1} titulo="Identificação">
        <p className="font-editorial text-leitura text-texto">{a.nome}</p>
        <p className="text-legenda text-texto-2">
          {NOME_TIPO_ATOR[a.tipo]} · {NOME_GRUPO[a.grupo]}
        </p>
        {blocos.length > 0 && (
          <p className="text-legenda text-texto-2">
            Membro de: <span className="text-texto">{blocos.map((b) => b.nome).join(", ")}</span>
            {vista !== "presente" && " (neste cenário)"}
          </p>
        )}
      </Bloco>
      <Bloco n={2} titulo="Papel na dinâmica">
        <p className="text-legenda text-texto">{a.papel}</p>
      </Bloco>
      <Bloco n={3} titulo="Interesses e capacidades">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {a.caracteristicas.map((c, i) => (
            <li key={i}>
              <LinhaAfirmacao a={c} />
            </li>
          ))}
        </ul>
      </Bloco>
      <Bloco n={4} titulo={`Relações ${vista === "presente" ? "no presente" : `no cenário ${vista}`}`}>
        {rels.length === 0 ? (
          <p className="text-legenda text-texto-2">Nenhuma relação nesta vista.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {rels.map((x) => {
              const outro = ix.atores.get(x.rel.de === id ? x.rel.para : x.rel.de)!;
              return (
                <li key={x.rel.id}>
                  <button type="button" onClick={() => selecionar({ tipo: "relacao", id: x.rel.id })} className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda hover:border-linha-forte">
                    <span className="text-texto">
                      {ESTILO.get(x.tipo)?.rotulo.split(" / ")[0]} · {outro.curto}
                    </span>
                    {x.mudou && x.estado && <span className="ml-2 text-micro text-ambar">{ROTULO_MUDANCA[x.estado.mudanca]}</span>}
                    <span className="block text-texto-2">{x.texto}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>
      <Bloco n={5} titulo="Evidências">
        <ListaDeEvidencias ids={evs} />
      </Bloco>
      <Bloco n={6} titulo="Incertezas e limitações">
        <p className="text-legenda text-texto-2">{a.incerteza ?? "Nenhuma incerteza específica registrada para este ator."}</p>
      </Bloco>
      <Bloco n={7} titulo="Implicações nos cenários">
        <Implicacoes textos={a.implicacoes} />
      </Bloco>
    </>
  );
}

function PainelRelacao({ id }: { id: string }) {
  const { ix, vista } = useResultado();
  const rel = ix.relacoes.get(id);
  if (!rel) return null;
  const naVista = relacaoNaVista(rel, vista);
  const e = ESTILO.get(naVista.tipo)!;
  const evs = [...(rel.presente?.evidencias ?? []), ...Object.values(rel.cenarios).flatMap((c) => c.evidencias ?? [])];
  const vistas: Vista[] = ["presente", "A", "B", "C"];
  return (
    <>
      <Bloco n={1} titulo="Identificação">
        <p className="flex flex-wrap items-center gap-1.5 text-legenda text-texto-2">
          <ChipAtor id={rel.de} /> → <ChipAtor id={rel.para} />
        </p>
        <p className="text-legenda text-texto">
          {e.rotulo} · {NOME_TEMA[rel.tema]}
        </p>
        <Epistemico tipo={statusDaRelacao(rel, vista)} rotulo={vista === "presente" ? undefined : `Condicional ao cenário ${vista}`} />
      </Bloco>
      <Bloco n={2} titulo={vista === "presente" ? "O que se observa" : `No cenário ${vista}`}>
        {vista === "presente" && rel.presente ? (
          <LinhaAfirmacao a={rel.presente} compacta />
        ) : (
          <p className="text-legenda text-texto">
            {naVista.texto}
            <Citacoes ids={naVista.estado?.evidencias} />
          </p>
        )}
      </Bloco>
      <Bloco n={3} titulo="Mecanismo">
        <p className="text-legenda text-texto">{rel.mecanismo}</p>
        <Epistemico tipo="inferencia" rotulo="Interpretação do analista" />
      </Bloco>
      <Bloco n={4} titulo="Como muda entre os futuros">
        <table className="w-full border-collapse text-left text-legenda">
          <tbody>
            {vistas.map((v) => {
              const x = relacaoNaVista(rel, v);
              const existe = v === "presente" ? rel.presente !== null : x.visivel;
              return (
                <tr key={v} className={`border-b border-linha align-top ${vista === v ? "bg-grafite" : ""}`}>
                  <th scope="row" className="w-20 py-2 pr-2 font-normal text-texto-3">
                    {v === "presente" ? "Presente" : `Cenário ${v}`}
                  </th>
                  <td className="py-2 text-texto-2">
                    {existe ? (
                      <>
                        {v !== "presente" && x.estado && <span className="mr-1.5 text-micro text-ambar">{ROTULO_MUDANCA[x.estado.mudanca]}</span>}
                        {x.texto}
                      </>
                    ) : (
                      <span className="text-texto-3">Não existe nesta vista.</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Bloco>
      <Bloco n={5} titulo="Evidências">
        <ListaDeEvidencias ids={evs} />
      </Bloco>
      <Bloco n={6} titulo="Incertezas e limitações">
        <p className="text-legenda text-texto-2">
          {rel.incerteza ?? "Nenhuma incerteza específica registrada."} A espessura da linha não mede força: não há método para quantificar a intensidade.
        </p>
      </Bloco>
    </>
  );
}

function PainelEvento({ id }: { id: string }) {
  const { ix, selecionar } = useResultado();
  const ev = ix.eventos.get(id);
  if (!ev) return null;
  return (
    <>
      <Bloco titulo="Evento">
        <p className="inline-flex items-center gap-2 text-legenda text-texto-2">
          <GlifoTempo c={ev.categoria} /> {CATEGORIA[ev.categoria].rotulo}
          {ev.agendado && " · agendado"}
          {ev.inflexao && <span className="text-ambar">· ponto de inflexão</span>}
        </p>
        <p className="font-dados text-micro text-texto-3">{ev.data}</p>
        <p className="font-editorial text-leitura text-texto">{ev.texto}</p>
        {ev.condicao && <p className="text-legenda text-ambar">Condição: {ev.condicao}</p>}
        {ev.cenarios && (
          <p className="flex items-center gap-1.5 text-legenda text-texto-2">
            Só no cenário {ev.cenarios.map((c) => <Letra key={c} id={c} />)}
          </p>
        )}
      </Bloco>
      <Bloco titulo="Atores envolvidos">
        <div className="flex flex-wrap gap-1.5">{ev.atores.map((a) => <ChipAtor key={a} id={a} />)}</div>
      </Bloco>
      {ev.relacoes && ev.relacoes.length > 0 && (
        <Bloco titulo="Relações afetadas">
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {ev.relacoes.map((rid) => {
              const rel = ix.relacoes.get(rid)!;
              return (
                <li key={rid}>
                  <button type="button" onClick={() => selecionar({ tipo: "relacao", id: rid })} className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto hover:border-linha-forte">
                    {ix.atores.get(rel.de)?.curto} → {ix.atores.get(rel.para)?.curto} · {ESTILO.get(rel.tipo)?.rotulo.split(" / ")[0]}
                  </button>
                </li>
              );
            })}
          </ul>
        </Bloco>
      )}
      {ev.sinais && ev.sinais.length > 0 && (
        <Bloco titulo="Indicadores de alerta">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {ev.sinais.map((sid) => {
              const s = ix.sinais.get(sid)!;
              return (
                <li key={sid} className="text-legenda">
                  <span className="text-texto">{s.sinal}</span>
                  <span className="block text-texto-2">{s.leitura}</span>
                </li>
              );
            })}
          </ul>
        </Bloco>
      )}
      <Bloco titulo="Evidências">
        {ev.categoria === "projetado" && !ev.evidencias?.length ? (
          <p className="text-legenda text-texto-2">Desdobramento projetado: não é sustentado por evidência direta, e sim pelas premissas do cenário.</p>
        ) : (
          <ListaDeEvidencias ids={ev.evidencias ?? []} />
        )}
      </Bloco>
    </>
  );
}

export function CartaoFonte({ f, n }: { f: Fonte; n?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-padrao border border-linha p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-texto-3">
        {n !== undefined && <span className="numeros font-dados text-ciano-texto">[{n}]</span>}
        <span>{NATUREZA[f.natureza]}</span>
        <span>· {f.genero}</span>
        {f.demonstrativa && <span className="text-ambar">· Referência demonstrativa</span>}
      </div>
      <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-baseline gap-1.5 text-corpo text-ciano-texto hover:underline [overflow-wrap:anywhere]">
        {f.titulo}
        <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
      <p className="text-micro text-texto-3">
        {f.autor ? `${f.autor} · ` : ""}
        {f.veiculo} · {f.data}
      </p>
      {f.trecho ? (
        <blockquote className="m-0 border-l-2 border-linha-forte pl-3 font-editorial text-legenda text-texto-2 italic">“{f.trecho}”</blockquote>
      ) : (
        <p className="text-micro text-ambar">Trecho não registrado: o texto não pôde ser conferido.</p>
      )}
      {f.limitacoes && <p className="text-micro text-texto-3">Limitação: {f.limitacoes}</p>}
    </div>
  );
}

function PainelEvidencia({ id }: { id: string }) {
  const { ix, selecionar, irPara, setVista } = useResultado();
  const e = ix.evidencias.get(id);
  if (!e) return null;
  const usos = ix.ondeSeUsa.get(id) ?? [];
  const passo = (n: number, titulo: string, conteudo: ReactNode) => (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span aria-hidden="true" className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-linha-forte bg-institucional font-dados text-micro text-texto-2">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
        <p className="text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">{titulo}</p>
        {conteudo}
      </div>
    </li>
  );
  return (
    <>
      <ol className="relative m-0 list-none p-0 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-linha-forte">
        {passo(1, "Afirmação", <><Epistemico tipo={e.tipo} /><p className="font-editorial text-leitura text-texto">{e.afirmacao}</p></>)}
        {passo(2, "Evidência", <p className="text-legenda text-texto">{e.evidencia}</p>)}
        {passo(
          3,
          `Fonte${e.fontes.length > 1 ? "s" : ""}`,
          <div className="flex flex-col gap-2">
            {e.fontes.map((fid) => {
              const f = ix.fontes.get(fid);
              return f ? <CartaoFonte key={fid} f={f} n={ix.numero.get(fid)} /> : null;
            })}
          </div>,
        )}
        {passo(4, "Interpretação", <><Epistemico tipo="inferencia" /><p className="text-legenda text-texto">{e.interpretacao}</p></>)}
        {passo(5, "Implicação prospectiva", <><Epistemico tipo="cenario" /><p className="text-legenda text-texto">{e.implicacao}</p></>)}
      </ol>
      <Bloco titulo={`Usada em (${usos.length})`}>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {usos.map((u) => (
            <li key={`${u.tipo}-${u.id}`}>
              <button
                type="button"
                className="w-full rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto-2 hover:border-linha-forte hover:text-texto"
                onClick={() => {
                  if (u.tipo === "cenario") {
                    setVista(u.id as CenarioId);
                    irPara("cenarios");
                    selecionar(null);
                  } else selecionar({ tipo: u.tipo, id: u.id } as Selecao);
                }}
              >
                <span className="text-micro text-texto-3">{{ ator: "Ator", relacao: "Relação", evento: "Linha do tempo", cenario: "Cenário" }[u.tipo]} · </span>
                {u.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </Bloco>
    </>
  );
}

// ------------------------------------------------------------------ painel

const TITULO: Record<NonNullable<Selecao>["tipo"], string> = {
  ator: "Ator",
  relacao: "Conexão",
  evento: "Linha do tempo",
  evidencia: "Rastreabilidade",
  metodo: "Como esta análise foi feita",
};

/**
 * Painel contextual. No desktop fica à direita; no celular é uma folha inferior que deixa o mapa
 * visível acima e pode ser recolhida. Guarda um histórico para voltar ao item anterior.
 */
export function PainelContextual() {
  const { selecao, selecionar } = useResultado();
  const [historico, setHistorico] = useState<NonNullable<Selecao>[]>([]);
  const [recolhido, setRecolhido] = useState(false);
  const anterior = useRef<Selecao>(null);
  const voltando = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const prev = anterior.current;
    if (!selecao) setHistorico([]);
    else if (prev && !voltando.current && (prev.tipo !== selecao.tipo || prev.id !== selecao.id)) setHistorico((h) => [...h.slice(-9), prev]);
    voltando.current = false;
    anterior.current = selecao;
    if (selecao) {
      setRecolhido(false);
      titulo.current?.focus({ preventScroll: true });
      // No celular, a folha cobre a metade de baixo: traz o mapa para cima para não perder o contexto.
      if ((selecao.tipo === "ator" || selecao.tipo === "relacao") && window.matchMedia?.("(max-width: 1023px)").matches) {
        document.getElementById("mapa-atores")?.scrollIntoView({ block: "start" });
      }
    }
  }, [selecao]);

  useEffect(() => {
    if (!selecao) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && selecionar(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [selecao, selecionar]);

  if (!selecao) return null;
  const voltar = () => {
    const h = [...historico];
    const prev = h.pop();
    setHistorico(h);
    voltando.current = true;
    selecionar(prev ?? null);
  };

  return (
    <aside
      aria-label="Painel contextual"
      className="aparecer fixed inset-x-0 bottom-0 z-40 flex max-h-[52dvh] flex-col rounded-t-painel border-t border-linha-forte bg-institucional shadow-[0_-12px_40px_rgb(0_0_0/0.45)] lg:inset-x-auto lg:top-0 lg:right-0 lg:bottom-0 lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-t-0 lg:border-l"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-1 border-b border-linha px-3 py-2" style={{ paddingRight: "max(0.75rem, env(safe-area-inset-right))" }}>
        {historico.length > 0 && (
          <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Voltar ao item anterior" onClick={voltar}>
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
        )}
        <h2 ref={titulo} tabIndex={-1} className="min-w-0 flex-1 truncate px-1 text-legenda font-medium text-texto outline-none">
          {TITULO[selecao.tipo]}
        </h2>
        <button
          type="button"
          className="botao botao-fantasma botao-pequeno size-10 p-0 lg:hidden"
          aria-label={recolhido ? "Expandir painel" : "Recolher painel"}
          aria-expanded={!recolhido}
          onClick={() => setRecolhido((x) => !x)}
        >
          <ChevronDown size={18} aria-hidden="true" className={recolhido ? "rotate-180" : ""} />
        </button>
        <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Fechar painel" onClick={() => selecionar(null)}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {!recolhido && (
        <div className="flex flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4" style={{ paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
          {selecao.tipo === "ator" && <PainelAtor id={selecao.id} />}
          {selecao.tipo === "relacao" && <PainelRelacao id={selecao.id} />}
          {selecao.tipo === "evento" && <PainelEvento id={selecao.id} />}
          {selecao.tipo === "evidencia" && <PainelEvidencia id={selecao.id} />}
          {selecao.tipo === "metodo" && <PainelMetodo />}
        </div>
      )}
    </aside>
  );
}
