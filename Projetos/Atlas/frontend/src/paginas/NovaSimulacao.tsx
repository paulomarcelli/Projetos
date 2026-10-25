import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/cliente";
import type { Caso, Resultado, Variavel } from "../api/tipos";
import { AvisoCondicional, Carregando, CaixaErro, Secao } from "../componentes/Estado";
import { formatarValor, rotuloDaFaixa } from "../lib/rotulos";

const HORIZONTES = [3, 6, 12, 24, 36];
const MAX_PREMISSAS = 6;

function ControleVariavel({ v, valor, onChange }: { v: Variavel; valor: number; onChange: (x: number) => void }) {
  const rot = rotuloDaFaixa(valor, v.minimo, v.maximo, v.rotulos);
  const id = `var-${v.id}`;
  const direcao = v.efeito_escalada > 0.05 ? "tende a escalar" : v.efeito_escalada < -0.05 ? "tende a conter" : "efeito neutro";
  return (
    <div className="rounded-lg border border-borda bg-fundo/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="font-medium quebra">{v.nome}</label>
        <output htmlFor={id} className="font-mono text-sm text-acento">{formatarValor(valor, v.unidade)}{rot ? <span className="ml-2 font-sans text-xs text-suave">{rot}</span> : null}</output>
      </div>
      <p className="mt-1 text-xs text-suave">{v.descricao} <span className="whitespace-nowrap">· Valor alto {direcao}.</span></p>
      <input id={id} type="range" min={v.minimo} max={v.maximo} step={v.passo} value={valor} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full" aria-valuetext={`${formatarValor(valor, v.unidade)}${rot ? `, ${rot}` : ""}`} />
      <div className="flex justify-between text-2xs text-suave"><span>{formatarValor(v.minimo, v.unidade)}</span><span>{formatarValor(v.maximo, v.unidade)}</span></div>
    </div>
  );
}

export function NovaSimulacao() {
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [casoId, setCasoId] = useState(params.get("caso") ?? "");
  const [valores, setValores] = useState<Record<string, number>>({});
  const [horizonte, setHorizonte] = useState(12);
  const [premissas, setPremissas] = useState<string[]>([]);
  const [novaPremissa, setNovaPremissa] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [base, setBase] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [variaveisGenericas, setVariaveisGenericas] = useState<Variavel[]>([]);
  const baseId = params.get("base");

  useEffect(() => {
    api.casos().then(setCasos).catch((e) => setErro(e.message));
  }, []);

  // revisão: carrega a simulação anterior e preenche o formulário
  useEffect(() => {
    if (!baseId) return;
    api.obter(baseId).then((r) => {
      setBase(r);
      setCasoId(r.entrada.caso_id);
      setValores(r.entrada.valores);
      setHorizonte(r.entrada.horizonte_meses);
      setPremissas(r.entrada.premissas_extra);
      setTitulo(r.entrada.titulo_personalizado ?? "");
      setDescricao(r.entrada.descricao_personalizada ?? "");
      if (r.caso.personalizado) setVariaveisGenericas(r.caso.variaveis);
    }).catch(() => setErro("A simulação de base não foi encontrada."));
  }, [baseId]);

  const caso = useMemo(() => casos?.find((c) => c.id === casoId) ?? null, [casos, casoId]);
  const personalizado = casoId === "personalizado";
  const variaveis = caso?.variaveis ?? (personalizado ? variaveisGenericas : []);

  useEffect(() => {
    if (personalizado && !variaveisGenericas.length) {
      api.caso("personalizado").then((c) => setVariaveisGenericas(c.variaveis)).catch((e) => setErro(e.message));
    }
  }, [personalizado, variaveisGenericas.length]);

  function escolher(id: string) {
    setCasoId(id);
    if (!base || base.entrada.caso_id !== id) setValores({});
    setErro(null);
  }

  const valor = (v: Variavel) => valores[v.id] ?? v.padrao;
  const descricaoOk = !personalizado || descricao.trim().length >= 20;
  const podeEnviar = !!casoId && descricaoOk && !enviando;

  function adicionarPremissa() {
    const p = novaPremissa.trim();
    if (!p || premissas.length >= MAX_PREMISSAS || premissas.includes(p)) return;
    setPremissas([...premissas, p.slice(0, 300)]);
    setNovaPremissa("");
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      const completos = Object.fromEntries(variaveis.map((v) => [v.id, valor(v)]));
      const r = await api.criar({
        caso_id: casoId, valores: completos, horizonte_meses: horizonte, premissas_extra: premissas,
        titulo_personalizado: personalizado ? titulo.trim() || null : null,
        descricao_personalizada: personalizado ? descricao.trim() : null,
        base_id: base?.id ?? null,
      });
      navegar(`/simulacoes/${r.id}/execucao`);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  }

  if (!casos && !erro) return <Carregando texto="Carregando casos…" />;

  return (
    <form onSubmit={enviar} className="space-y-8" noValidate>
      <header className="space-y-2">
        <p className="rotulo">Nova simulação</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{base ? "Revisar premissas" : "Configure o cenário"}</h1>
        {base && <p className="text-sm text-suave">Revisando <Link className="text-acento hover:underline" to={`/simulacoes/${base.id}`}>{base.caso.titulo}</Link>. Ao final, você poderá comparar as duas simulações.</p>}
        <AvisoCondicional />
      </header>

      <Secao titulo="1. Caso" subtitulo="Escolha o caso de estudo.">
        <div role="radiogroup" aria-label="Caso" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...(casos ?? []).map((c) => ({ id: c.id, titulo: c.titulo, resumo: c.resumo })), { id: "personalizado", titulo: "Caso personalizado", resumo: "Descreva a situação com suas palavras." }].map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={casoId === c.id} onClick={() => escolher(c.id)}
              className={`cartao min-h-[44px] p-3 text-left transition-colors ${casoId === c.id ? "border-acento bg-acento/10" : "hover:border-acento/50"}`}>
              <span className="block font-medium quebra">{c.titulo}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-suave">{c.resumo}</span>
            </button>
          ))}
        </div>
        {caso && <p className="mt-3 max-w-[75ch] text-sm text-suave">{caso.contexto}</p>}
      </Secao>

      {personalizado && (
        <Secao titulo="Descrição do caso" subtitulo="O ATLAS usará variáveis genéricas. Seja específico sobre atores e o que está em disputa.">
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">Título
              <input className="campo" maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Disputa por rotas no Ártico" />
            </label>
            <label className="grid gap-1 text-sm">Situação <span className="text-xs text-suave">(mínimo 20 caracteres)</span>
              <textarea className="campo min-h-[120px] py-2" maxLength={1500} value={descricao} onChange={(e) => setDescricao(e.target.value)} aria-invalid={!descricaoOk} aria-describedby="desc-cont" />
              <span id="desc-cont" className={`text-xs ${descricaoOk ? "text-suave" : "text-moderado"}`}>{descricao.trim().length}/1500{!descricaoOk && " — descreva com pelo menos 20 caracteres"}</span>
            </label>
          </div>
        </Secao>
      )}

      {casoId && (
        <>
          <Secao titulo="2. Variáveis de contexto" subtitulo="Os valores alimentam o motor determinístico (índices 0–100) e as premissas dos agentes."
            acao={<button type="button" className="botao-fantasma text-xs" onClick={() => setValores({})}>Restaurar padrões</button>}>
            <div className="grid gap-3 md:grid-cols-2">
              {variaveis.map((v) => <ControleVariavel key={v.id} v={v} valor={valor(v)} onChange={(x) => setValores({ ...valores, [v.id]: x })} />)}
            </div>
          </Secao>

          <Secao titulo="3. Horizonte temporal">
            <div role="radiogroup" aria-label="Horizonte em meses" className="flex flex-wrap gap-2">
              {HORIZONTES.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={horizonte === h} onClick={() => setHorizonte(h)}
                  className={`botao border ${horizonte === h ? "border-acento bg-acento/15 text-acento" : "border-borda bg-painel text-texto hover:border-acento/50"}`}>
                  {h} meses
                </button>
              ))}
              <label className="flex items-center gap-2 text-sm text-suave">Outro
                <input type="number" min={1} max={60} value={horizonte} onChange={(e) => setHorizonte(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} className="campo w-24" aria-label="Horizonte personalizado em meses" />
              </label>
            </div>
          </Secao>

          <Secao titulo="4. Premissas" subtitulo="As premissas padrão do caso valem sempre. Acrescente até seis premissas suas.">
            {caso && (
              <ul className="mb-3 space-y-1 text-sm text-suave">
                {caso.premissas_padrao.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-acento">—</span><span className="quebra">{p}</span></li>)}
              </ul>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="campo" value={novaPremissa} maxLength={300} onChange={(e) => setNovaPremissa(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionarPremissa(); } }}
                placeholder="Ex.: Não há recessão global no período" aria-label="Nova premissa" disabled={premissas.length >= MAX_PREMISSAS} />
              <button type="button" className="botao-secundario shrink-0" onClick={adicionarPremissa} disabled={!novaPremissa.trim() || premissas.length >= MAX_PREMISSAS}>Adicionar</button>
            </div>
            {premissas.length > 0 && (
              <ul className="mt-3 space-y-2">
                {premissas.map((p) => (
                  <li key={p} className="flex items-start gap-2 rounded-lg border border-borda bg-fundo/40 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 quebra">{p}</span>
                    <button type="button" className="min-h-[32px] shrink-0 px-2 text-xs text-suave hover:text-alto" onClick={() => setPremissas(premissas.filter((x) => x !== p))} aria-label={`Remover premissa: ${p}`}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-suave">{premissas.length}/{MAX_PREMISSAS} premissas adicionais</p>
          </Secao>
        </>
      )}

      {erro && <CaixaErro titulo="Não foi possível iniciar">{erro}</CaixaErro>}

      <div className="sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-borda bg-painel/95 p-3 backdrop-blur lg:bottom-4">
        <p className="text-sm text-suave">{casoId ? `${variaveis.length} variáveis · ${horizonte} meses · ${premissas.length} premissas extras` : "Escolha um caso para continuar"}</p>
        <button type="submit" className="botao-primario" disabled={!podeEnviar}>{enviando ? "Iniciando…" : "Executar simulação"}</button>
      </div>
    </form>
  );
}
