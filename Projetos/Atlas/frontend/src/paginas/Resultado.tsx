import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { api } from "../api/cliente";
import type { Afirmacao, Evidencia, Fonte, Resultado as R } from "../api/tipos";
import { AvisoCondicional, CaixaErro, Carregando, Secao, Vazio } from "../componentes/Estado";
import { GraficoImpactos, nivelTexto } from "../componentes/GraficoImpactos";
import { IndicesMotor } from "../componentes/IndicesMotor";
import { MapaAtores } from "../componentes/MapaAtores";
import { MatrizRisco } from "../componentes/MatrizRisco";
import { SeloDemo, SeloNivel, SeloStatus, TagNatureza } from "../componentes/Selos";
import { CENARIO, DIMENSAO, NOME_BUSCA, NOME_IA, dataHora, nomeProvedor } from "../lib/rotulos";

const ANCORAS = [
  ["resumo", "Resumo"], ["cenarios", "Cenários"], ["impactos", "Impactos"], ["atores", "Atores"], ["riscos", "Riscos"],
  ["fontes", "Fontes"], ["premissas", "Premissas"], ["verificacao", "Verificação"], ["motor", "Motor"],
] as const;

function ListaAfirmacoes({ itens, evid }: { itens: Afirmacao[]; evid: Map<string, Evidencia> }) {
  return (
    <ul className="space-y-2">
      {itens.map((a, i) => (
        <li key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <TagNatureza natureza={a.natureza} />
          <p className="min-w-0 flex-1 text-sm leading-relaxed quebra">
            {a.texto}
            {a.evidencia_ids.map((e) => (
              <a key={e} href={`#ev-${e}`} className="ml-1 font-mono text-2xs text-acento hover:underline" title={evid.get(e)?.afirmacao}>[{e}]</a>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Separacao({ r }: { r: R }) {
  const todas = [...(r.analise?.resumo_executivo ?? []), ...(r.analise?.cenarios.flatMap((c) => c.narrativa) ?? [])];
  const conta = (n: Afirmacao["natureza"]) => todas.filter((a) => a.natureza === n).length;
  const itens: [string, number, string][] = [
    ["Fatos verificados", conta("fato"), "com evidência confirmada"],
    ["Interpretações", conta("interpretacao"), "leituras analíticas"],
    ["Premissas", conta("premissa") + (r.registro?.premissas.length ?? 0), "assumidas na simulação"],
    ["Hipóteses", conta("hipotese"), "possibilidades, não previsões"],
    ["Incertezas", r.analise?.incertezas.length ?? 0, "registradas pelo Analyst"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {itens.map(([k, v, d]) => (
        <div key={k} className="rounded-lg border border-borda bg-fundo/40 p-3">
          <dt className="text-xs text-suave">{k}</dt>
          <dd className="font-mono text-xl">{v}</dd>
          <dd className="text-2xs text-suave">{d}</dd>
        </div>
      ))}
    </dl>
  );
}

function CartaoFonte({ f }: { f: Fonte }) {
  const url = f.url && /^https?:\/\//.test(f.url) ? f.url : null;
  return (
    <li id={`fonte-${f.id}`} className="rounded-lg border border-borda bg-fundo/40 p-3">
      <div className="flex items-start gap-2">
        <span className="font-mono text-xs text-acento">{f.id}</span>
        <div className="min-w-0 flex-1">
          {url ? <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-medium hover:text-acento hover:underline quebra">{f.titulo}</a> : <p className="text-sm font-medium quebra">{f.titulo}</p>}
          <p className="mt-0.5 text-xs text-suave">{f.publicador ?? "Publicador não informado"} · publicado: {f.data_publicacao ?? "data não informada"} · consultado: {dataHora(f.data_consulta)}</p>
          {f.trecho && <p className="mt-1 line-clamp-3 text-xs text-texto/80 quebra">{f.trecho}</p>}
        </div>
      </div>
    </li>
  );
}

export function Resultado() {
  const { id = "" } = useParams();
  const [r, setR] = useState<R | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cenarioAtivo, setCenarioAtivo] = useState<"continuidade" | "escalada" | "desescalada">("continuidade");

  useEffect(() => { api.obter(id).then(setR).catch((e) => setErro(e.message)); }, [id]);

  if (erro) return <CaixaErro titulo="Simulação não encontrada" acao={<Link to="/historico" className="botao-secundario">Voltar ao histórico</Link>}>{erro}</CaixaErro>;
  if (!r) return <Carregando />;
  if (r.status === "pendente" || r.status === "executando") return <Navigate to={`/simulacoes/${id}/execucao`} replace />;

  const a = r.analise;
  const evid = new Map((r.evidencias?.evidencias ?? []).map((e) => [e.id, e]));
  const nomeAtor = new Map(r.caso.atores.map((x) => [x.id, x.nome]));
  const ultima = r.verificacoes[r.verificacoes.length - 1];
  const cenario = a?.cenarios.find((c) => c.tipo === cenarioAtivo) ?? a?.cenarios[0];

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rotulo">Resultado</p>
          <SeloStatus status={r.status} />
          {r.modo.demonstrativo && <SeloDemo />}
          {a && <SeloNivel nivel={a.confianca} prefixo="Confiança" />}
        </div>
        <h1 className="text-2xl font-semibold quebra sm:text-3xl">{r.caso.titulo}</h1>
        <p className="text-sm text-suave">{r.entrada.horizonte_meses} meses · criada em {dataHora(r.criada_em)} · IA: {NOME_IA[r.modo.ia] ?? r.modo.ia} · Busca: {NOME_BUSCA[r.modo.busca] ?? r.modo.busca}</p>
        <div className="flex flex-wrap gap-2">
          <Link to={`/nova?base=${r.id}`} className="botao-primario">Revisar premissas</Link>
          <Link to={`/comparar?b=${r.id}${r.entrada.base_id ? `&a=${r.entrada.base_id}` : ""}`} className="botao-secundario">Comparar</Link>
        </div>
        {r.avisos.map((av) => <p key={av} className="rounded-lg border border-moderado/40 bg-moderado/5 px-3 py-2 text-sm text-moderado quebra">{av}</p>)}
        <AvisoCondicional />
      </header>

      <nav aria-label="Seções do resultado" className="sticky top-[60px] z-20 -mx-4 overflow-x-auto border-y border-borda bg-fundo/90 px-4 py-2 backdrop-blur lg:top-0">
        <ul className="flex gap-1 whitespace-nowrap">
          {ANCORAS.map(([k, n]) => <li key={k}><a href={`#${k}`} className="inline-flex min-h-[36px] items-center rounded-md px-3 text-xs text-suave hover:bg-painel2 hover:text-texto">{n}</a></li>)}
        </ul>
      </nav>

      {!a ? (
        <Vazio titulo="Sem análise">{r.erro ?? "A execução parou antes do Analyst."} O que foi obtido aparece abaixo.</Vazio>
      ) : (
        <>
          <Secao id="resumo" titulo="Resumo executivo" subtitulo="Cada afirmação traz sua natureza. Números entre colchetes levam à evidência citada.">
            <div className="cartao space-y-5 p-4 sm:p-5">
              <Separacao r={r} />
              <ListaAfirmacoes itens={a.resumo_executivo} evid={evid} />
              <p className="border-t border-borda pt-3 text-sm text-suave"><strong className="text-texto">Confiança {nivelTexto(a.confianca).toLowerCase()}:</strong> {a.justificativa_confianca}</p>
            </div>
          </Secao>

          <Secao id="cenarios" titulo="Cenários" subtitulo="Plausibilidade qualitativa sob as premissas escolhidas — não são probabilidades.">
            <div role="tablist" aria-label="Cenários" className="mb-3 grid grid-cols-3 gap-2">
              {a.cenarios.map((c) => (
                <button key={c.tipo} role="tab" type="button" aria-selected={cenarioAtivo === c.tipo} onClick={() => setCenarioAtivo(c.tipo)}
                  className={`cartao min-h-[44px] p-3 text-left transition-colors ${cenarioAtivo === c.tipo ? "border-acento bg-acento/10" : "hover:border-acento/40"}`}>
                  <span className="block text-xs text-suave">{CENARIO[c.tipo].rotulo}</span>
                  <span className="mt-1 block"><SeloNivel nivel={c.plausibilidade} /></span>
                </button>
              ))}
            </div>
            {cenario && (
              <div key={cenario.tipo} role="tabpanel" className="cartao grid animate-entrar gap-5 p-4 sm:p-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="min-w-0 space-y-3">
                  <h3 className="text-base font-semibold quebra">{cenario.titulo}</h3>
                  <ListaAfirmacoes itens={cenario.narrativa} evid={evid} />
                  <p className="text-sm text-suave quebra"><strong className="text-texto">Por que esta plausibilidade:</strong> {cenario.justificativa}</p>
                </div>
                <div className="min-w-0 space-y-4 text-sm">
                  <div><p className="rotulo mb-1">Gatilhos</p><ul className="list-disc space-y-1 pl-5">{cenario.gatilhos.length ? cenario.gatilhos.map((g) => <li key={g} className="quebra">{g}</li>) : <li className="list-none text-suave">—</li>}</ul></div>
                  <div><p className="rotulo mb-1">Indicadores a observar</p><ul className="list-disc space-y-1 pl-5">{cenario.indicadores.length ? cenario.indicadores.map((g) => <li key={g} className="quebra">{g}</li>) : <li className="list-none text-suave">—</li>}</ul></div>
                </div>
              </div>
            )}
          </Secao>

          <Secao id="impactos" titulo="Impactos econômicos, diplomáticos e estratégicos">
            <div className="cartao space-y-4 p-4 sm:p-5">
              {a.impactos.length ? <GraficoImpactos impactos={a.impactos} /> : <p className="text-sm text-suave">Nenhum impacto descrito.</p>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-suave"><tr><th className="py-2 pr-3 font-medium">Impacto</th><th className="pr-3 font-medium">Dimensão</th>{(["continuidade", "escalada", "desescalada"] as const).map((c) => <th key={c} className="pr-3 font-medium">{CENARIO[c].rotulo}</th>)}</tr></thead>
                  <tbody className="divide-y divide-borda">
                    {a.impactos.map((i) => (
                      <tr key={i.titulo} className="align-top">
                        <td className="py-3 pr-3"><p className="font-medium quebra">{i.titulo}</p><p className="mt-1 text-xs text-suave quebra">{i.mecanismo}</p><div className="mt-1 flex flex-wrap items-center gap-1"><TagNatureza natureza={i.natureza} />{i.evidencia_ids.map((e) => <a key={e} href={`#ev-${e}`} className="font-mono text-2xs text-acento">[{e}]</a>)}</div></td>
                        <td className="py-3 pr-3 text-suave">{DIMENSAO[i.dimensao]}</td>
                        {(["continuidade", "escalada", "desescalada"] as const).map((c) => <td key={c} className="py-3 pr-3">{i.por_cenario[c] ? <SeloNivel nivel={i.por_cenario[c]!} /> : "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Secao>

          <Secao id="atores" titulo="Atores e relações">
            <div className="space-y-4">
              {r.caso.atores.length > 0 && <div className="cartao p-3 sm:p-4"><MapaAtores atores={r.caso.atores} relacoes={a.relacoes} analise={a.atores} /></div>}
              <ul className="grid gap-3 md:grid-cols-2">
                {a.atores.map((x) => (
                  <li key={x.ator_id} className="cartao p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold quebra">{nomeAtor.get(x.ator_id) ?? x.ator_id}</p>
                      <span className="rounded border border-borda px-2 py-0.5 text-xs text-suave">Postura {x.postura}</span>
                    </div>
                    {([["Interesses", x.interesses], ["Incentivos", x.incentivos], ["Capacidades", x.capacidades], ["Restrições", x.restricoes]] as const).map(([k, v]) => v.length > 0 && (
                      <div key={k} className="mt-2"><p className="rotulo">{k}</p><ul className="mt-0.5 list-disc pl-5 text-texto/90">{v.map((t) => <li key={t} className="quebra">{t}</li>)}</ul></div>
                    ))}
                  </li>
                ))}
              </ul>
              {a.relacoes.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {a.relacoes.map((x, i) => <li key={i} className="quebra"><span className="font-medium">{nomeAtor.get(x.origem) ?? x.origem} → {nomeAtor.get(x.destino) ?? x.destino}</span> <span className="text-suave">· {x.tipo} ({x.intensidade}) — {x.descricao}</span></li>)}
                </ul>
              )}
            </div>
          </Secao>

          <Secao id="riscos" titulo="Matriz de riscos e oportunidades" subtitulo="Classificação qualitativa de probabilidade e impacto, com justificativa.">
            <div className="cartao p-4 sm:p-5"><MatrizRisco itens={a.matriz} /></div>
          </Secao>
        </>
      )}

      <Secao id="fontes" titulo="Fontes e evidências" subtitulo={r.evidencias?.pesquisa_real ? "Resultados da pesquisa na web tratados como dados não confiáveis; evidências só citam fontes listadas aqui." : "Modo demonstrativo: nenhuma pesquisa real foi feita, portanto não há fontes."}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="cartao p-4">
            <h3 className="mb-2 text-sm font-semibold">Fontes ({r.evidencias?.fontes.length ?? 0})</h3>
            {r.evidencias?.fontes.length ? <ul className="space-y-2">{r.evidencias.fontes.map((f) => <CartaoFonte key={f.id} f={f} />)}</ul> : <p className="text-sm text-suave">Nenhuma fonte coletada.</p>}
          </div>
          <div className="cartao p-4">
            <h3 className="mb-2 text-sm font-semibold">Evidências ({r.evidencias?.evidencias.length ?? 0})</h3>
            <ul className="space-y-2">
              {r.evidencias?.evidencias.map((e) => (
                <li key={e.id} id={`ev-${e.id}`} className="scroll-mt-28 rounded-lg border border-borda bg-fundo/40 p-3 text-sm target:border-acento">
                  <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-mono text-acento">{e.id}</span><span className="text-suave">{e.status} · {e.relacao}</span>{e.fonte_ids.map((f) => <a key={f} href={`#fonte-${f}`} className="font-mono text-acento hover:underline">{f}</a>)}</div>
                  <p className="mt-1 quebra">{e.afirmacao}</p>
                </li>
              ))}
            </ul>
            {(r.evidencias?.lacunas.length ?? 0) > 0 && (
              <div className="mt-3"><p className="rotulo mb-1">Lacunas da pesquisa</p><ul className="list-disc space-y-1 pl-5 text-sm text-suave">{r.evidencias!.lacunas.map((l) => <li key={l} className="quebra">{l}</li>)}</ul></div>
            )}
          </div>
        </div>
      </Secao>

      <Secao id="premissas" titulo="Premissas, condições e incertezas">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="cartao p-4 text-sm"><p className="rotulo mb-2">Premissas</p><ul className="list-disc space-y-1 pl-5">{r.registro?.premissas.map((p) => <li key={p} className="quebra">{p}</li>)}</ul></div>
          <div className="cartao p-4 text-sm"><p className="rotulo mb-2">Condições iniciais</p><ul className="space-y-1 font-mono text-xs">{r.registro?.condicoes_iniciais.map((p) => <li key={p} className="quebra">{p}</li>)}</ul></div>
          <div className="cartao p-4 text-sm"><p className="rotulo mb-2">Incertezas</p><ul className="list-disc space-y-1 pl-5">{a?.incertezas.length ? a.incertezas.map((p) => <li key={p} className="quebra">{p}</li>) : <li className="list-none text-suave">—</li>}</ul></div>
          <div className="cartao p-4 text-sm"><p className="rotulo mb-2">Limitações</p><ul className="list-disc space-y-1 pl-5 text-suave">{r.registro?.limitacoes.map((p) => <li key={p} className="quebra">{p}</li>)}</ul></div>
        </div>
      </Secao>

      <Secao id="verificacao" titulo="Verificação" subtitulo={ultima ? `${r.verificacoes.length} rodada(s). ${ultima.aprovado ? "Aprovada na última rodada." : "A última rodada ainda aponta problemas críticos."}` : "O Verifier não chegou a rodar."}>
        <ol className="space-y-3">
          {r.verificacoes.map((v) => (
            <li key={v.rodada} className="cartao p-4 text-sm">
              <p className="font-medium">Rodada {v.rodada} · <span className={v.aprovado ? "text-baixo" : "text-moderado"}>{v.aprovado ? "Aprovada" : "Correções pedidas"}</span></p>
              {v.problemas.length === 0 ? <p className="mt-1 text-suave">Nenhum problema encontrado.</p> : (
                <ul className="mt-2 space-y-1.5">
                  {v.problemas.map((p, i) => (
                    <li key={i} className="flex flex-wrap gap-x-2 quebra">
                      <span className={`font-medium ${p.severidade === "critico" ? "text-alto" : "text-moderado"}`}>{p.severidade === "critico" ? "Crítico" : "Alerta"}</span>
                      <span className="font-mono text-xs text-suave">{p.local} · {p.alvo} · {p.origem === "ia" ? "revisão por IA" : "regra"}</span>
                      <span className="w-full text-texto/90 sm:w-auto">{p.descricao}</span>
                    </li>
                  ))}
                </ul>
              )}
              {v.observacoes.map((o) => <p key={o} className="mt-1 text-xs text-suave quebra">{o}</p>)}
            </li>
          ))}
        </ol>
      </Secao>

      {r.motor && (
        <Secao id="motor" titulo="Motor determinístico" subtitulo="Índices calculados em código a partir das variáveis — iguais para as mesmas entradas. São construções do modelo, não probabilidades.">
          <IndicesMotor motor={r.motor} caso={r.caso} />
          <p className="mt-3 text-xs text-suave">Uso: {r.uso.chamadas_llm} chamadas de IA · {r.uso.buscas} buscas · {r.uso.cache_hits} respostas de cache · {(r.uso.tokens_entrada + r.uso.tokens_saida).toLocaleString("pt-BR")} tokens</p>
          {r.uso.por_provedor && Object.keys(r.uso.por_provedor).length > 0 && (
            <p className="mt-1 text-xs text-suave quebra">Respostas por modelo: {Object.entries(r.uso.por_provedor).map(([k, v]) => `${nomeProvedor(k)}: ${v}`).join(" · ")}</p>
          )}
        </Secao>
      )}
    </article>
  );
}
