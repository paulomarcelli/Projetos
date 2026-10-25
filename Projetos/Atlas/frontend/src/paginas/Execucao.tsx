import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/cliente";
import type { Evento, Resultado } from "../api/tipos";
import { AvisoCondicional, CaixaErro, Carregando } from "../componentes/Estado";
import { LinhaDoTempo, PainelAgentes } from "../componentes/PainelAgentes";
import { SeloDemo, SeloStatus } from "../componentes/Selos";

const INTERVALO_MS = 900;
const terminado = (s?: string) => s === "concluida" || s === "parcial" || s === "falhou";

export function Execucao() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [sim, setSim] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ultimo = useRef(0);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    let falhas = 0;
    async function ciclo() {
      try {
        const novos = await api.eventos(id, ultimo.current);
        if (!vivo) return;
        if (novos.length) {
          ultimo.current = novos[novos.length - 1].seq;
          setEventos((ev) => [...ev, ...novos]);
        }
        const r = await api.obter(id);
        if (!vivo) return;
        setSim(r);
        falhas = 0;
        if (terminado(r.status)) return;
      } catch (e) {
        falhas += 1;
        if (falhas >= 5) { setErro((e as Error).message); return; }
      }
      timer = setTimeout(ciclo, INTERVALO_MS);
    }
    ciclo();
    return () => { vivo = false; clearTimeout(timer); };
  }, [id]);

  // ao concluir com sucesso, segue para o resultado
  useEffect(() => {
    if (sim?.status === "concluida") {
      const t = setTimeout(() => navegar(`/simulacoes/${id}`), 1200);
      return () => clearTimeout(t);
    }
  }, [sim?.status, id, navegar]);

  if (erro) return <CaixaErro titulo="Perdemos contato com a execução" acao={<Link className="botao-secundario" to="/historico">Ir ao histórico</Link>}>{erro}</CaixaErro>;
  if (!sim) return <Carregando texto="Conectando à execução…" />;
  const fim = terminado(sim.status);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rotulo">Execução</p>
          <SeloStatus status={sim.status} />
          {sim.modo.demonstrativo && <SeloDemo />}
        </div>
        <h1 className="text-2xl font-semibold quebra sm:text-3xl">{sim.caso.titulo}</h1>
        <p className="text-sm text-suave">Horizonte de {sim.entrada.horizonte_meses} meses · os estados abaixo vêm dos eventos reais registrados pelo orquestrador.</p>
      </header>

      <PainelAgentes eventos={eventos} terminou={fim} />

      {sim.status === "parcial" && (
        <div className="cartao border-moderado/50 p-4 text-sm">
          <p className="font-medium text-moderado">Execução concluída com pendências</p>
          <p className="mt-1 text-suave quebra">{sim.erro ?? "O Verifier ainda aponta problemas após o limite de revisões."} Os resultados obtidos foram preservados.</p>
          <Link to={`/simulacoes/${id}`} className="botao-primario mt-3">Ver resultado parcial</Link>
        </div>
      )}
      {sim.status === "falhou" && (
        <CaixaErro titulo="A execução falhou" acao={<div className="flex flex-wrap gap-2"><Link className="botao-secundario" to={`/simulacoes/${id}`}>Ver o que foi obtido</Link><Link className="botao-fantasma" to={`/nova?base=${id}`}>Tentar novamente</Link></div>}>
          {sim.erro ?? "Falha externa."}
        </CaixaErro>
      )}
      {sim.status === "concluida" && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-baixo" role="status">Concluída. Abrindo o resultado…</p>
          <Link to={`/simulacoes/${id}`} className="botao-primario">Ver resultado</Link>
        </div>
      )}

      <section className="cartao p-4" aria-labelledby="ev-t">
        <h2 id="ev-t" className="mb-3 text-sm font-semibold">Linha do tempo</h2>
        <LinhaDoTempo eventos={eventos} />
      </section>
      <AvisoCondicional />
    </div>
  );
}
