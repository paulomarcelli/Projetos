/**
 * Dados do combate. Mostra SOMENTE os valores que o servidor enviou no evento
 * 'attack' — o cliente nunca sorteia nada. A animação é curta (≤ 320ms) e só
 * marca a chegada do resultado; com movimento reduzido vira um fade.
 */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

export function Die({ value, side, index = 0, lost = false }: { value: number; side: 'attack' | 'defense'; index?: number; lost?: boolean }) {
  const pips = PIPS[value] ?? [];
  return (
    <span
      className={`die die--${side}${lost ? ' die--lost' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
      role="img"
      aria-label={`${value}${lost ? ' (perdeu)' : ''}`}
    >
      <svg viewBox="-12 -12 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">
        {pips.map(([x, y], i) => (
          <circle key={i} cx={x * 5.5} cy={y * 5.5} r={2.1} />
        ))}
      </svg>
    </span>
  );
}

/** Compara pares (maior × maior): marca qual dado perdeu cada duelo. */
export function DiceDuel({ attack, defense, seq }: { attack: number[]; defense: number[]; seq: number }) {
  const a = [...attack];
  const d = [...defense];
  const sa = [...a].sort((x, y) => y - x);
  const sd = [...d].sort((x, y) => y - x);
  const pairs = Math.min(sa.length, sd.length);
  // Índices perdedores na ordem ordenada; exibimos na ordem ordenada para ficar claro.
  return (
    <div className="dice-duel" key={seq}>
      <div className="dice-duel__row" aria-label="Dados de ataque">
        <span className="dice-duel__label">Ataque</span>
        {sa.map((v, i) => (
          <Die key={`a${seq}-${i}`} value={v} side="attack" index={i} lost={i < pairs && v <= sd[i]!} />
        ))}
      </div>
      <div className="dice-duel__row" aria-label="Dados de defesa">
        <span className="dice-duel__label">Defesa</span>
        {sd.map((v, i) => (
          <Die key={`d${seq}-${i}`} value={v} side="defense" index={i} lost={i < pairs && sa[i]! > v} />
        ))}
      </div>
    </div>
  );
}
