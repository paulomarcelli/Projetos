import { useState } from "react";
import type { Caso, IndiceDimensao, SaidaMotor } from "../api/tipos";
import { DIMENSAO, PRESSAO } from "../lib/rotulos";
import { SeloNivel } from "./Selos";

function Barra({ titulo, ind, nomes }: { titulo: string; ind: IndiceDimensao; nomes: Record<string, string> }) {
  const [aberto, setAberto] = useState(false);
  const contrib = Object.entries(ind.contribuicoes).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-lg border border-borda bg-fundo/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{titulo}</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{ind.valor.toFixed(1)}</span>
          <SeloNivel nivel={ind.nivel} />
        </div>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-painel2" aria-hidden>
        {[34, 67].map((x) => <span key={x} className="absolute inset-y-0 w-px bg-borda" style={{ left: `${x}%` }} />)}
        <div className="barra-indice h-full origin-left rounded-full bg-acento transition-transform duration-[250ms] ease-out" style={{ transform: `scaleX(${ind.valor / 100})` }} />
      </div>
      <button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto} className="mt-2 min-h-[32px] text-xs text-acento hover:underline">
        {aberto ? "Ocultar contribuições" : "Ver contribuições por variável"}
      </button>
      {aberto && (
        <ul className="mt-1 space-y-1 text-xs">
          {contrib.length === 0 && <li className="text-suave">Nenhuma variável contribui nesta configuração.</li>}
          {contrib.map(([k, v]) => (
            <li key={k} className="grid grid-cols-[1fr_auto] gap-2"><span className="text-suave quebra">{nomes[k] ?? k}</span><span className="font-mono">+{v.toFixed(1)}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function IndicesMotor({ motor, caso }: { motor: SaidaMotor; caso: Caso }) {
  const nomes = Object.fromEntries(caso.variaveis.map((v) => [v.id, v.nome]));
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Barra titulo="Propensão de escalada (modelo)" ind={motor.propensao_escalada} nomes={nomes} />
        {(Object.keys(DIMENSAO) as (keyof typeof DIMENSAO)[]).map((d) => motor.indices[d] && <Barra key={d} titulo={PRESSAO[d]} ind={motor.indices[d]} nomes={nomes} />)}
      </div>
      <details className="rounded-lg border border-borda bg-fundo/40 p-3 text-sm">
        <summary className="cursor-pointer select-none font-medium">Como os índices são calculados</summary>
        <p className="mt-2 font-mono text-xs leading-relaxed text-suave quebra">{motor.formula}</p>
        <p className="mt-2 text-xs text-suave">Fator de horizonte aplicado: <span className="font-mono text-texto">{motor.fator_horizonte.toFixed(3)}</span></p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-suave">{motor.limitacoes.map((l) => <li key={l}>{l}</li>)}</ul>
      </details>
    </div>
  );
}
