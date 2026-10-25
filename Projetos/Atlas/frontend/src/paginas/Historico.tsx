import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/cliente";
import type { ResumoSimulacao, Status } from "../api/tipos";
import { CaixaErro, Carregando, Vazio } from "../componentes/Estado";
import { SeloDemo, SeloNivel, SeloStatus } from "../componentes/Selos";
import { STATUS, dataHora } from "../lib/rotulos";

export function Historico() {
  const navegar = useNavigate();
  const [itens, setItens] = useState<ResumoSimulacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [marcados, setMarcados] = useState<string[]>([]);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => { api.listar().then(setItens).catch((e) => setErro(e.message)); }, []);

  const filtrados = useMemo(() => (itens ?? []).filter((i) => (!status || i.status === status) && (!busca || i.titulo.toLowerCase().includes(busca.toLowerCase()))), [itens, busca, status]);

  function marcar(id: string) {
    setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m.slice(-1), id]));
  }

  async function apagar(id: string) {
    try {
      await api.apagar(id);
      setItens((xs) => xs?.filter((x) => x.id !== id) ?? null);
      setMarcados((m) => m.filter((x) => x !== id));
    } catch (e) { setErro((e as Error).message); }
    setConfirmando(null);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="rotulo">Histórico</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Simulações salvas</h1>
        <p className="text-sm text-suave">Marque duas simulações para compará-las. O histórico fica no banco SQLite do servidor.</p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="campo" type="search" placeholder="Buscar por título" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar por título" />
        <select className="campo sm:w-48" value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
        </select>
        <button type="button" className="botao-primario shrink-0" disabled={marcados.length !== 2} onClick={() => navegar(`/comparar?a=${marcados[0]}&b=${marcados[1]}`)}>
          Comparar ({marcados.length}/2)
        </button>
      </div>

      {erro && <CaixaErro>{erro}</CaixaErro>}
      {!itens && !erro && <Carregando />}
      {itens && filtrados.length === 0 && (
        <Vazio titulo={itens.length ? "Nada corresponde aos filtros" : "Nenhuma simulação salva"} acao={!itens.length ? <Link to="/nova" className="botao-primario">Nova simulação</Link> : undefined} />
      )}
      {filtrados.length > 0 && (
        <ul className="space-y-2">
          {filtrados.map((h) => {
            const destino = h.status === "executando" || h.status === "pendente" ? `/simulacoes/${h.id}/execucao` : `/simulacoes/${h.id}`;
            return (
              <li key={h.id} className={`cartao flex flex-wrap items-center gap-3 p-3 ${marcados.includes(h.id) ? "border-acento" : ""}`}>
                <label className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center">
                  <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--acento))]" checked={marcados.includes(h.id)} onChange={() => marcar(h.id)} aria-label={`Selecionar ${h.titulo} para comparar`} />
                </label>
                <Link to={destino} className="min-w-0 flex-1 basis-48">
                  <p className="truncate font-medium hover:text-acento">{h.titulo}</p>
                  <p className="text-xs text-suave">{dataHora(h.criada_em)} · {h.horizonte_meses} meses{h.base_id ? " · revisão" : ""}</p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {h.modo.demonstrativo && <SeloDemo compacto />}
                  {h.confianca && <SeloNivel nivel={h.confianca} prefixo="Confiança" />}
                  <SeloStatus status={h.status} />
                  {confirmando === h.id ? (
                    <span className="flex items-center gap-1">
                      <button type="button" className="botao min-h-[36px] bg-alto/90 px-3 text-xs text-fundo" onClick={() => apagar(h.id)}>Confirmar exclusão</button>
                      <button type="button" className="botao-fantasma min-h-[36px] px-2 text-xs" onClick={() => setConfirmando(null)}>Cancelar</button>
                    </span>
                  ) : (
                    <button type="button" className="botao-fantasma min-h-[36px] px-2 text-xs hover:text-alto" onClick={() => setConfirmando(h.id)} aria-label={`Excluir ${h.titulo}`}>Excluir</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
