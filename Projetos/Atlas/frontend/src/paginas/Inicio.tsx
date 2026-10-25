import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../api/cliente";
import type { Caso, ResumoSimulacao, Saude } from "../api/tipos";
import { AvisoCondicional, Carregando, CaixaErro, Secao, Vazio } from "../componentes/Estado";
import { SeloDemo, SeloNivel, SeloStatus } from "../componentes/Selos";
import { dataHora } from "../lib/rotulos";

export function Inicio() {
  const saude = useOutletContext<Saude | null>();
  const [casos, setCasos] = useState<Caso[] | null>(null);
  const [hist, setHist] = useState<ResumoSimulacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.casos().then(setCasos).catch((e) => setErro(e.message));
    api.listar().then(setHist).catch(() => setHist([]));
  }, []);

  const concluidas = hist.filter((h) => h.status === "concluida").length;
  return (
    <div className="space-y-10">
      <header className="animate-entrar space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rotulo">Painel</p>
          {saude?.modo.demonstrativo && <SeloDemo />}
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Simule cenários geopolíticos sob premissas explícitas.</h1>
        <p className="max-w-[65ch] text-suave">
          Escolha um caso, ajuste as variáveis de contexto e o horizonte. Três agentes — Researcher, Analyst e Verifier — pesquisam, analisam e revisam,
          enquanto um motor determinístico calcula os índices. Cada afirmação é marcada como fato, interpretação, premissa ou hipótese.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/nova" className="botao-primario">Nova simulação</Link>
          <Link to="/historico" className="botao-secundario">Ver histórico</Link>
        </div>
        <AvisoCondicional />
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Simulações", hist.length],
          ["Concluídas", concluidas],
          ["Casos no catálogo", casos?.length ?? "—"],
          ["Modo", saude ? (saude.modo.demonstrativo ? "Demonstrativo" : "IA + busca real") : "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="cartao p-4">
            <dt className="rotulo">{k}</dt>
            <dd className="mt-1 truncate text-2xl font-semibold tabular-nums">{typeof v === "number" ? v.toLocaleString("pt-BR") : v}</dd>
          </div>
        ))}
      </dl>

      <Secao titulo="Casos de estudo" subtitulo="Cinco casos prontos para a demonstração acadêmica, ou descreva o seu.">
        {erro && <CaixaErro titulo="Não foi possível carregar os casos">{erro}</CaixaErro>}
        {!casos && !erro && <Carregando />}
        {casos && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {casos.map((c) => (
              <li key={c.id}>
                <Link to={`/nova?caso=${c.id}`} className="cartao group flex h-full flex-col gap-2 p-4 transition-colors hover:border-acento/60">
                  <p className="font-semibold quebra group-hover:text-acento">{c.titulo}</p>
                  <p className="line-clamp-3 text-sm text-suave">{c.resumo}</p>
                  <p className="mt-auto pt-2 text-xs text-suave">{c.atores.length} atores · {c.variaveis.length} variáveis</p>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/nova?caso=personalizado" className="cartao flex h-full flex-col justify-center gap-1 border-dashed p-4 hover:border-acento/60">
                <p className="font-semibold">Caso personalizado</p>
                <p className="text-sm text-suave">Descreva uma situação; o ATLAS usa variáveis genéricas.</p>
              </Link>
            </li>
          </ul>
        )}
      </Secao>

      <Secao titulo="Simulações recentes" acao={hist.length > 0 ? <Link to="/historico" className="text-sm text-acento hover:underline">Ver todas</Link> : undefined}>
        {hist.length === 0 ? (
          <Vazio titulo="Nenhuma simulação ainda">Rode a primeira para ver cenários, impactos e a matriz de riscos.</Vazio>
        ) : (
          <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-borda bg-painel">
            {hist.slice(0, 5).map((h) => (
              <li key={h.id}>
                <Link to={h.status === "executando" || h.status === "pendente" ? `/simulacoes/${h.id}/execucao` : `/simulacoes/${h.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-painel2">
                  <span className="min-w-0 flex-1 truncate font-medium">{h.titulo}</span>
                  {h.modo.demonstrativo && <SeloDemo compacto />}
                  {h.confianca && <SeloNivel nivel={h.confianca} prefixo="Confiança" />}
                  <SeloStatus status={h.status} />
                  <span className="text-xs text-suave">{dataHora(h.criada_em)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </div>
  );
}
