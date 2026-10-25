import { useEffect, useState } from "react";
import { api } from "../api/cliente";
import type { Saude } from "../api/tipos";
import { CaixaErro, Carregando, Secao } from "../componentes/Estado";
import { SeloDemo } from "../componentes/Selos";

const NOMES_LIMITE: Record<string, string> = {
  max_revisoes: "Revisões do Verifier por simulação", max_chamadas_llm_por_simulacao: "Chamadas de IA por simulação",
  max_buscas_por_simulacao: "Buscas na web por simulação", max_simulacoes_dia: "Simulações com IA por dia",
};
const NOMES_USO: Record<string, string> = { simulacoes: "Simulações", chamadas_llm: "Chamadas de IA", buscas: "Buscas", tokens: "Tokens" };

export function Configuracoes() {
  const [s, setS] = useState<Saude | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => { api.saude().then(setS).catch((e) => setErro(e.message)); }, []);
  if (erro) return <CaixaErro titulo="Servidor indisponível">{erro}</CaixaErro>;
  if (!s) return <Carregando />;
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="rotulo">Configurações</p>
        <h1 className="text-2xl font-semibold sm:text-3xl">Estado do servidor</h1>
        <p className="text-sm text-suave">Credenciais ficam só no servidor, em variáveis de ambiente. Esta tela mostra apenas se cada uma está configurada.</p>
      </header>

      <Secao titulo="Modo de execução">
        <div className="cartao space-y-3 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">{s.modo.demonstrativo ? <SeloDemo /> : <span className="rounded-full border border-baixo/50 px-2.5 py-0.5 text-xs font-semibold text-baixo">IA e busca reais</span>}<span className="text-suave">versão {s.versao}</span></div>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-borda p-3"><dt className="text-xs text-suave">GEMINI_API_KEY</dt><dd className={s.credenciais.gemini ? "text-baixo" : "text-moderado"}>{s.credenciais.gemini ? "Configurada" : "Ausente — IA em modo demonstrativo"}</dd>{s.modelo && <dd className="font-mono text-xs text-suave">{s.modelo}</dd>}</div>
            <div className="rounded-lg border border-borda p-3"><dt className="text-xs text-suave">TAVILY_API_KEY</dt><dd className={s.credenciais.tavily ? "text-baixo" : "text-moderado"}>{s.credenciais.tavily ? "Configurada" : "Ausente — sem pesquisa na web"}</dd></div>
          </dl>
          {s.modo.demonstrativo && <p className="text-suave">Para usar IA e busca reais, defina as variáveis no arquivo <code className="font-mono text-texto">backend/.env</code> (veja <code className="font-mono text-texto">.env.example</code>) e reinicie o servidor. O plano gratuito tem limites por minuto e por dia; o ATLAS não contrata planos pagos.</p>}
        </div>
      </Secao>

      <Secao titulo="Limites de proteção de cota">
        <dl className="grid gap-2 sm:grid-cols-2">
          {Object.entries(s.limites).map(([k, v]) => <div key={k} className="cartao p-3"><dt className="text-xs text-suave">{NOMES_LIMITE[k] ?? k}</dt><dd className="font-mono text-lg">{v}</dd></div>)}
        </dl>
      </Secao>

      <Secao titulo="Uso hoje">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(s.uso_hoje).filter(([k]) => k in NOMES_USO).map(([k, v]) => <div key={k} className="cartao p-3"><dt className="text-xs text-suave">{NOMES_USO[k]}</dt><dd className="truncate font-mono text-lg">{Number(v).toLocaleString("pt-BR")}</dd></div>)}
        </dl>
      </Secao>
    </div>
  );
}
