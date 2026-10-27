import { useId } from "react";

/**
 * Eixo do presente ao horizonte escolhido. O cone âmbar é QUALITATIVO: mostra que a incerteza
 * cresce quanto mais longe se olha — não é um intervalo calculado nem uma probabilidade.
 */
export function LinhaHorizonte({ anos }: { anos: number }) {
  const hoje = new Date().getFullYear();
  const fim = hoje + anos;
  const x0 = 28;
  const x1 = 572;
  const meio = 44;
  // O cone é desenhado na abertura máxima e escalado no eixo Y a partir do presente:
  // assim a mudança de horizonte anima só `transform`.
  const abertura = 8 + Math.min(30, Math.sqrt(anos) * 6.5);
  const ABERTURA_MAX = 38;
  const passo = anos <= 5 ? 1 : anos <= 10 ? 2 : 5;
  const marcas: number[] = [];
  for (let a = hoje; a <= fim; a += passo) marcas.push(a);
  if (marcas[marcas.length - 1] !== fim) marcas.push(fim);
  const x = (a: number) => x0 + ((a - hoje) / anos) * (x1 - x0);
  const id = useId();

  return (
    <figure className="m-0">
      <svg viewBox="0 0 600 96" className="block h-auto w-full" role="img" aria-labelledby={`${id}-t`}>
        <title id={`${id}-t`}>{`Do presente (${hoje}) ao horizonte de ${anos} ${anos === 1 ? "ano" : "anos"} (${fim}). A incerteza cresce com a distância.`}</title>
        <g
          className="cone-incerteza"
          style={{ transform: `scaleY(${abertura / ABERTURA_MAX})`, transformOrigin: `${x0}px ${meio}px`, transformBox: "view-box" }}
        >
          <path d={`M${x0} ${meio} L${x1} ${meio - ABERTURA_MAX} L${x1} ${meio + ABERTURA_MAX} Z`} fill="rgb(233 180 91 / 0.09)" />
          <path d={`M${x0} ${meio} L${x1} ${meio - ABERTURA_MAX}`} stroke="rgb(233 180 91 / 0.55)" strokeDasharray="3 4" fill="none" vectorEffect="non-scaling-stroke" />
          <path d={`M${x0} ${meio} L${x1} ${meio + ABERTURA_MAX}`} stroke="rgb(233 180 91 / 0.55)" strokeDasharray="3 4" fill="none" vectorEffect="non-scaling-stroke" />
        </g>
        <line x1={x0} y1={meio} x2={x1} y2={meio} stroke="var(--color-linha-forte)" />
        {marcas.map((a) => (
          <g key={a}>
            <line x1={x(a)} y1={meio - 4} x2={x(a)} y2={meio + 4} stroke="var(--color-texto-3)" />
            {(a === hoje || a === fim || marcas.length <= 7) && (
              <text
                x={x(a)}
                y={88}
                textAnchor={a === hoje ? "start" : a === fim ? "end" : "middle"}
                className="numeros"
                fill={a === fim ? "var(--color-ambar)" : "var(--color-texto-3)"}
                style={{ font: "500 11px var(--font-dados)" }}
              >
                {a}
              </text>
            )}
          </g>
        ))}
        <circle cx={x0} cy={meio} r={5} fill="var(--color-texto)" />
        <text x={x0} y={18} fill="var(--color-texto-2)" style={{ font: "500 11px var(--font-interface)" }}>
          Presente
        </text>
        <path d={`M${x1} ${meio - 5} L${x1 + 5} ${meio} L${x1} ${meio + 5} L${x1 - 5} ${meio} Z`} fill="none" stroke="var(--color-ambar)" strokeWidth="1.4" />
        <text x={x1} y={18} textAnchor="end" fill="var(--color-ambar)" style={{ font: "500 11px var(--font-interface)" }}>
          Horizonte
        </text>
      </svg>
      <figcaption className="text-micro text-texto-3">O cone indica, de forma qualitativa, que a incerteza aumenta com o horizonte.</figcaption>
    </figure>
  );
}
