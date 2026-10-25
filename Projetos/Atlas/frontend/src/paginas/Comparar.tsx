import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/cliente";
import type { Comparacao, ResumoSimulacao } from "../api/tipos";
import { CaixaErro, Carregando, Secao, Vazio } from "../componentes/Estado";
import { DIMENSAO, dataHora } from "../lib/rotulos";

const NOME_INDICE: Record<string, string> = { ...Object.fromEntries(Object.entries(DIMENSAO).map(([k, v]) => [k, `Pressão ${v.toLowerCase()}`])), propensao_escalada: "Propensão de escalada" };

export function Comparar() {
  const [params, setParams] = useSearchParams();
  const a = params.get("a") ?? "", b = params.get("b") ?? "";
  const [hist, setHist] = useState<ResumoSimulacao[] | null>(null);
  const [cmp, setCmp] = useState<Comparacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { api.listar().then((h) => setHist(h.filter((x) => x.status !== "pendente" && x.status !== "executando"))).catch((e) => setErro(e.message)); }, []);
  useEffect(() => {
    setCmp(null);
    if (!a || !b || a === b) return;
    setCarregando(true); setErro(null);
    api.comparar(a, b).then(setCmp).catch((e) => setErro(e.message)).finally(() => setCarregando(false));
  }, [a, b]);

  const escolher = (k: "a" | "b", v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const nome = (id: string) => hist?.find((h) => h.id === id);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">Comparar</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">O que mudou entre duas simulações</h1>
      </header>

      {!hist && !erro && <Carregando />}
      {hist && hist.length < 2 && <Vazio titulo="São necessárias pelo menos duas simulações concluídas" acao={<Link className="botao-primario" to="/nova">Nova simulação</Link>} />}
      {hist && hist.length >= 2 && (
        <div className="grid gap-3 md:grid-cols-2">
          {(["a", "b"] as const).map((k) => (
            <label key={k} className="grid gap-1 text-sm">
              <span className="rotulo">{k === "a" ? "Simulação A (antes)" : "Simulação B (depois)"}</span>
              <select className="campo" value={k === "a" ? a : b} onChange={(e) => escolher(k, e.target.value)}>
                <option value="">Escolha…</option>
                {hist.map((h) => <option key={h.id} value={h.id} disabled={(k === "a" ? b : a) === h.id}>{h.titulo} — {dataHora(h.criada_em)}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {a && b && a === b && <p className="text-sm text-moderado">Escolha duas simulações diferentes.</p>}
      {erro && <CaixaErro>{erro}</CaixaErro>}
      {carregando && <Carregando texto="Comparando…" />}

      {cmp && (
        <div className="space-y-8 animate-entrar">
          <p className="rounded-lg border border-moderado/40 bg-moderado/5 px-3 py-2 text-sm text-moderado">{cmp.aviso}</p>
          {!cmp.mesmo_caso && <p className="text-sm text-suave">As simulações são de casos diferentes: índices do motor não são comparáveis; apenas classificações qualitativas aparecem abaixo.</p>}

          <Secao titulo="Premissas alteradas">
            <div className="cartao overflow-x-auto p-4">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs text-suave"><tr><th className="py-2 pr-3 font-medium">Item</th><th className="pr-3 font-medium">A</th><th className="pr-3 font-medium">B</th></tr></thead>
                <tbody className="divide-y divide-borda">
                  <tr><td className="py-2 pr-3">Horizonte</td><td className="pr-3 font-mono">{cmp.horizonte[0]} meses</td><td className={`pr-3 font-mono ${cmp.horizonte[0] !== cmp.horizonte[1] ? "text-acento" : ""}`}>{cmp.horizonte[1]} meses</td></tr>
                  {cmp.variaveis.map((v) => <tr key={v.id}><td className="py-2 pr-3 quebra">{v.nome}</td><td className="pr-3 font-mono">{v.antes ?? "—"}</td><td className="pr-3 font-mono text-acento">{v.depois ?? "—"}</td></tr>)}
                </tbody>
              </table>
              {cmp.variaveis.length === 0 && cmp.horizonte[0] === cmp.horizonte[1] && <p className="mt-2 text-sm text-suave">As variáveis e o horizonte são iguais.</p>}
              {(cmp.premissas_adicionadas.length > 0 || cmp.premissas_removidas.length > 0) && (
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {cmp.premissas_adicionadas.length > 0 && <div><p className="rotulo">Premissas adicionadas em B</p><ul className="list-disc pl-5">{cmp.premissas_adicionadas.map((p) => <li key={p} className="quebra">{p}</li>)}</ul></div>}
                  {cmp.premissas_removidas.length > 0 && <div><p className="rotulo">Premissas removidas em B</p><ul className="list-disc pl-5">{cmp.premissas_removidas.map((p) => <li key={p} className="quebra">{p}</li>)}</ul></div>}
                </div>
              )}
            </div>
          </Secao>

          {Object.keys(cmp.indices).length > 0 && (
            <Secao titulo="Índices do motor" subtitulo="Valores 0–100 calculados em código.">
              <ul className="grid gap-3 sm:grid-cols-2">
                {Object.entries(cmp.indices).map(([k, [x, y]]) => {
                  const d = y - x;
                  return (
                    <li key={k} className="cartao p-4">
                      <p className="text-sm font-medium">{NOME_INDICE[k] ?? k}</p>
                      <p className="mt-1 font-mono text-lg">{x.toFixed(1)} → {y.toFixed(1)} <span className={`text-sm ${d > 0 ? "text-alto" : d < 0 ? "text-baixo" : "text-suave"}`}>({d > 0 ? "+" : ""}{d.toFixed(1)})</span></p>
                      <div className="mt-2 space-y-1" aria-hidden>
                        <div className="h-1.5 rounded-full bg-painel2"><div className="h-full rounded-full bg-suave/70" style={{ width: `${x}%` }} /></div>
                        <div className="h-1.5 rounded-full bg-painel2"><div className="h-full rounded-full bg-acento transition-[width] duration-700" style={{ width: `${y}%` }} /></div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Secao>
          )}

          <Secao titulo="Conclusões que mudaram" subtitulo={`${cmp.mudancas.length} mudança(s) · ${cmp.inalteradas.length} item(ns) iguais`}>
            {cmp.mudancas.length === 0 ? <Vazio titulo="Nenhuma conclusão mudou" /> : (
              <div className="cartao overflow-x-auto p-4">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs text-suave"><tr><th className="py-2 pr-3 font-medium">Item</th><th className="pr-3 font-medium">A</th><th className="pr-3 font-medium">B</th></tr></thead>
                  <tbody className="divide-y divide-borda">{cmp.mudancas.map((m) => <tr key={m.item}><td className="py-2 pr-3 quebra">{m.item}</td><td className="pr-3 text-suave">{m.antes}</td><td className="pr-3 text-acento">{m.depois}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {cmp.inalteradas.length > 0 && (
              <details className="mt-3 text-sm"><summary className="cursor-pointer text-suave">Itens que permaneceram iguais ({cmp.inalteradas.length})</summary><ul className="mt-2 list-disc pl-5 text-suave">{cmp.inalteradas.map((i) => <li key={i} className="quebra">{i}</li>)}</ul></details>
            )}
          </Secao>

          <div className="flex flex-wrap gap-2">
            <Link to={`/simulacoes/${a}`} className="botao-secundario">Abrir A{nome(a) ? `: ${nome(a)!.titulo.slice(0, 30)}` : ""}</Link>
            <Link to={`/simulacoes/${b}`} className="botao-secundario">Abrir B</Link>
          </div>
        </div>
      )}
    </div>
  );
}
