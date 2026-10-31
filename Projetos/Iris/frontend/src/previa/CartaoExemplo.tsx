import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Epistemico } from "../components/common/Epistemico";
import { ROTAS } from "../config/rotas";
import { INVESTIGACAO_EXEMPLO as r } from "./investigacao-exemplo";

/** Só na prévia: dá acesso ao exemplo de resultado, sempre marcado como simulação manual. */
export default function CartaoExemplo() {
  return (
    <div>
      <p className="rotulo border-b border-linha pb-2">Exemplo de resultado (prévia)</p>
      <Link
        to={ROTAS.investigacao(r.id)}
        className="group mt-3 flex flex-col gap-2 rounded-painel border border-ambar/35 bg-ambar-suave p-4 transition-colors hover:border-ambar/60 focus-visible:outline-2 focus-visible:outline-ciano"
      >
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Epistemico tipo="limitacao" rotulo="Exemplo ilustrativo, elaborado por IA" />
          <span className="text-micro text-texto-3">{r.natureza}</span>
        </span>
        <span className="font-editorial text-leitura text-texto [overflow-wrap:anywhere]">{r.pergunta}</span>
        <span className="flex flex-wrap items-center justify-between gap-2 text-legenda text-texto-2">
          <span>
            Horizonte <span className="numeros font-dados text-ambar">{r.horizonte.inicio}–{r.horizonte.fim}</span> ·{" "}
            {r.atores.length} atores · {r.cenarios.length} cenários · {r.fontes.length} fontes
          </span>
          <span className="inline-flex items-center gap-1 text-ciano-texto group-hover:underline">
            Abrir resultado
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </span>
      </Link>
    </div>
  );
}
