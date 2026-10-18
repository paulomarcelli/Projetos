import type { PlayerView } from '@war/shared';
import { MAP } from '../../game/map';
import { playerById } from '../../game/players';
import { PlayerSeal } from '../ui/Emblem';

/**
 * Legenda das regiões (como a faixa de bônus da arte original): cor, nome,
 * bônus e, se alguém domina a região inteira, o selo do dono.
 */
export function RegionLegend({ view }: { view: PlayerView | null }) {
  return (
    <ul className="region-legend" aria-label="Regiões e bônus">
      {MAP.regions.map((r) => {
        const ids = MAP.territories.filter((t) => t.region === r.id).map((t) => t.id);
        const owners = new Set(ids.map((id) => view?.territories[id]?.owner));
        const single = owners.size === 1 ? [...owners][0] : undefined;
        const ruler = view && single ? playerById(view.players, single) : undefined;
        return (
          <li key={r.id} className="region-legend__item">
            <span className="region-legend__band" style={{ background: r.color }} aria-hidden="true" />
            <span className="region-legend__name">{r.name}</span>
            <span className="region-legend__bonus">+{r.bonus}</span>
            {ruler ? <PlayerSeal color={ruler.color} size={14} title={`Dominada por ${ruler.name}`} /> : null}
          </li>
        );
      })}
    </ul>
  );
}
