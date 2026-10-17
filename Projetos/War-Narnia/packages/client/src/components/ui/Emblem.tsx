import type { PlayerColor } from '@war/shared';
import { PLAYER_META, type EmblemShape } from '../../game/players';

const f = (n: number) => Math.round(n * 100) / 100;

/** Caminho SVG do emblema centrado em (0,0), cabendo num raio r. */
export function emblemPath(shape: EmblemShape, r: number): string {
  switch (shape) {
    case 'triangulo':
      return `M0 ${f(-r)} L${f(r * 0.95)} ${f(r * 0.72)} L${f(-r * 0.95)} ${f(r * 0.72)} Z`;
    case 'circulo':
      return `M${f(-r * 0.85)} 0 a${f(r * 0.85)} ${f(r * 0.85)} 0 1 0 ${f(r * 1.7)} 0 a${f(r * 0.85)} ${f(r * 0.85)} 0 1 0 ${f(-r * 1.7)} 0 Z`;
    case 'cruz': {
      const w = r * 0.36;
      return `M${f(-w)} ${f(-r)} H${f(w)} V${f(-w)} H${f(r)} V${f(w)} H${f(w)} V${f(r)} H${f(-w)} V${f(w)} H${f(-r)} V${f(-w)} H${f(-w)} Z`;
    }
    case 'estrela': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${f(Math.cos(a) * rad)} ${f(Math.sin(a) * rad + r * 0.08)}`);
      }
      return `M${pts.join(' L')} Z`;
    }
    case 'quadrado':
      return `M${f(-r * 0.75)} ${f(-r * 0.75)} H${f(r * 0.75)} V${f(r * 0.75)} H${f(-r * 0.75)} Z`;
    case 'losango':
      return `M0 ${f(-r)} L${f(r * 0.8)} 0 L0 ${f(r)} L${f(-r * 0.8)} 0 Z`;
  }
}

/** Selo do jogador: disco na cor + emblema. Usado em listas, barra de turno e legenda. */
export function PlayerSeal({ color, size = 22, title }: { color: PlayerColor; size?: number; title?: string }) {
  const meta = PLAYER_META[color];
  const r = size / 2;
  return (
    <svg
      className="player-seal"
      width={size}
      height={size}
      viewBox={`${-r} ${-r} ${size} ${size}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <circle r={r - 1} fill={meta.cssVar} stroke="var(--map-halo-dark)" strokeWidth={1.5} />
      <path d={emblemPath(meta.emblem, r * 0.48)} fill={meta.lightText ? 'var(--on-player-dark)' : 'var(--on-player-light)'} />
    </svg>
  );
}
