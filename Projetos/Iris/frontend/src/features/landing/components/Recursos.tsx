/**
 * O que a Iris entrega em cada resposta, numa grade de cinco blocos. Cada bloco tem uma ilustração animada só com
 * CSS (traço que se desenha, ponto que percorre, nó que pulsa): nada roda em JavaScript por quadro. A borda acende
 * onde o ponteiro está (variáveis --mx/--my).
 */
import type { MouseEvent, ReactNode } from "react";

function Bloco({ titulo, texto, children, className = "" }: { titulo: string; texto: string; children: ReactNode; className?: string }) {
  const seguir = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <article onMouseMove={seguir} className={`lp-painel lp-painel-borda-viva flex flex-col gap-5 overflow-hidden p-6 ${className}`}>
      <div aria-hidden="true" className="lp-ilustracao relative h-36 overflow-hidden rounded-xl border border-[color:var(--lp-linha)] bg-[color:var(--lp-noite)]/60">
        {children}
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[1.125rem] font-medium tracking-[-0.01em] text-[color:var(--lp-texto)]">{titulo}</h3>
        <p className="text-[0.9375rem] leading-relaxed text-[color:var(--lp-texto-2)]">{texto}</p>
      </div>
    </article>
  );
}

export function Recursos() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Bloco className="md:col-span-2" titulo="Análise explicada" texto="Contexto, acontecimentos, atores e interesses, fatores em jogo e conclusão, em texto corrido. Cada afirmação traz a sua fonte.">
        <div className="absolute inset-0 flex flex-col justify-center gap-2.5 px-6">
          {[88, 72, 94, 60].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-2 rounded-full bg-[color:var(--lp-linha-forte)]" style={{ width: `${w}%` }} />
              {i !== 1 && (
                <span className="lp-citacao shrink-0 font-mono text-[0.6875rem] text-[color:var(--lp-ouro)]" style={{ animationDelay: `${i * 0.6}s` }}>
                  [{i + 1}]
                </span>
              )}
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Cenários prospectivos" texto="Trajetórias condicionais, com premissas, indicadores e os eventos que as romperiam. Nunca previsões.">
        <svg viewBox="0 0 240 140" className="absolute inset-0 h-full w-full">
          <path className="lp-desenho" d="M10 70 H90" stroke="#a9b5d4" strokeWidth="1.5" fill="none" />
          {[
            ["M90 70 C130 70 140 28 230 28", "A"],
            ["M90 70 C130 70 150 70 230 70", "B"],
            ["M90 70 C130 70 140 112 230 112", "C"],
          ].map(([d, id], i) => (
            <g key={id}>
              <path className="lp-desenho" style={{ animationDelay: `${0.5 + i * 0.25}s` }} d={d} stroke="#f5c451" strokeWidth="1.5" fill="none" />
              <text x="214" y={[22, 64, 106][i]} fontSize="11" fill="#f5c451" fontFamily="monospace">
                {id}
              </text>
            </g>
          ))}
          <circle cx="90" cy="70" r="4" fill="#f5c451" />
          <text x="72" y="92" fontSize="9" fill="#7383aa">hoje</text>
        </svg>
      </Bloco>

      <Bloco titulo="Mapa de relações" texto="Países, organizações e empresas, com alianças, rivalidades e vínculos econômicos e militares da investigação.">
        <svg viewBox="0 0 240 140" className="absolute inset-0 h-full w-full">
          {[
            [120, 70, 50, 35],
            [120, 70, 190, 30],
            [120, 70, 60, 110],
            [120, 70, 195, 105],
            [50, 35, 190, 30],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i < 4 ? "rgba(245,196,81,0.6)" : "rgba(160,190,255,0.3)"} strokeDasharray={i === 4 ? "3 4" : undefined} />
          ))}
          {[
            [50, 35],
            [190, 30],
            [60, 110],
            [195, 105],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#0a1a3a" stroke="#a9b5d4" />
          ))}
          <circle className="lp-no-pulso" cx="120" cy="70" r="7" fill="#f5c451" />
        </svg>
      </Bloco>

      <Bloco titulo="Linha do tempo" texto="Os acontecimentos que trouxeram a questão até aqui, com data, atores, consequências e fontes.">
        <div className="absolute inset-x-6 top-1/2 h-px bg-[color:var(--lp-linha-forte)]" />
        {[8, 26, 44, 62, 80].map((x, i) => (
          <span key={i} className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-[#a9b5d4] bg-[color:var(--lp-noite)]" style={{ left: `${x}%` }} />
        ))}
        <span className="lp-hoje absolute inset-x-6 top-[28%] bottom-[28%]">
          <span className="absolute inset-y-0 left-[20%] w-px bg-[color:var(--lp-ouro)]">
            <span className="absolute -top-4 -translate-x-1/2 text-[0.625rem] text-[color:var(--lp-ouro)]">hoje</span>
          </span>
        </span>
      </Bloco>

      <Bloco titulo="Evidências rastreáveis" texto="Da afirmação à evidência e da evidência ao documento: título, veículo, data e o trecho exato.">
        <div className="absolute inset-0 flex items-center justify-center gap-2 px-4">
          {["Afirmação", "Evidência", "Fonte"].map((r, i) => (
            <div key={r} className="flex items-center gap-2">
              <span className="lp-chip whitespace-nowrap !text-[0.75rem]">{r}</span>
              {i < 2 && (
                <span className="relative h-px w-6 bg-[color:var(--lp-linha-forte)]">
                  <span className="lp-viajante absolute -top-[2px] left-0 size-[5px] rounded-full bg-[color:var(--lp-ouro)]" style={{ animationDelay: `${i * 0.7}s` }} />
                </span>
              )}
            </div>
          ))}
        </div>
      </Bloco>
    </div>
  );
}
