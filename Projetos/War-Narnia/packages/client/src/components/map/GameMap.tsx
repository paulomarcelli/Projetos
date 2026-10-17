import { useCallback, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { PlayerView, TerritoryId } from '@war/shared';
import { MAP, NEIGHBORS, REGION_BY_ID } from '../../game/map';
import { playerById } from '../../game/players';
import { Icon } from '../ui/Icon';
import { TerritoryMarker, type MarkerState } from './TerritoryMarker';
import { useZoomPan } from './useZoomPan';

const ART_URL = '/assets/mapa-narnia.webp';

export interface GameMapProps {
  view: PlayerView | null;
  selected: TerritoryId | null;
  /** Alvos atacáveis a partir do selecionado. */
  targets?: ReadonlySet<TerritoryId>;
  /** Destinos válidos (remanejamento/ocupação). */
  destinations?: ReadonlySet<TerritoryId>;
  /** Alvo/destino já escolhido (fica com o anel do seu tipo e a rota realçada). */
  chosen?: TerritoryId | null;
  onSelect: (id: TerritoryId) => void;
  onClear: () => void;
}

const EMPTY: ReadonlySet<TerritoryId> = new Set();

export function GameMap({ view, selected, targets = EMPTY, destinations = EMPTY, chosen = null, onSelect, onClear }: GameMapProps) {
  const zp = useZoomPan(MAP.artSize);
  const { vb, size } = zp;
  const [showRoutes, setShowRoutes] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);

  const toScreen = useCallback((p: { x: number; y: number }) => ({ x: p.x * vb.s + vb.tx, y: p.y * vb.s + vb.ty }), [vb]);

  const anchors = useMemo(() => new Map(MAP.territories.map((t) => [t.id, t.anchor])), []);

  const hasFocusSet = selected !== null && (targets.size > 0 || destinations.size > 0);

  const routes = useMemo(() => {
    type Line = { key: string; a: TerritoryId; b: TerritoryId; sea: boolean; tone: 'all' | 'link' | 'target' | 'destination'; strong: boolean };
    const lines: Line[] = [];
    if (showRoutes) {
      for (const c of MAP.connections) lines.push({ key: `${c.a}|${c.b}`, a: c.a, b: c.b, sea: c.kind === 'sea', tone: 'all', strong: false });
    }
    if (selected) {
      for (const n of NEIGHBORS.get(selected) ?? []) {
        const tone = targets.has(n.id) ? 'target' : destinations.has(n.id) ? 'destination' : 'link';
        lines.push({ key: `sel|${n.id}`, a: selected, b: n.id, sea: n.kind === 'sea', tone, strong: n.id === chosen });
      }
    }
    return lines;
  }, [showRoutes, selected, targets, destinations, chosen]);

  const handleActivate = useCallback(
    (id: TerritoryId) => {
      if (zp.consumeDrag()) return;
      onSelect(id);
    },
    [onSelect, zp],
  );

  const handleFocus = useCallback(
    (id: TerritoryId) => {
      const a = anchors.get(id);
      if (a) zp.ensureVisible(a.x, a.y);
    },
    [anchors, zp],
  );

  const onBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.marker, .map__controls')) return;
    if (zp.consumeDrag()) return;
    onClear();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClear();
      return;
    }
    if (e.target !== e.currentTarget) return; // setas só quando o próprio mapa tem o foco
    const step = 80;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => zp.panBy(step, 0),
      ArrowRight: () => zp.panBy(-step, 0),
      ArrowUp: () => zp.panBy(0, step),
      ArrowDown: () => zp.panBy(0, -step),
      '+': zp.zoomIn,
      '=': zp.zoomIn,
      '-': zp.zoomOut,
      '0': zp.reset,
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const markerRadius = size.w < 520 ? 16 : 17;

  return (
    <div className="map" data-testid="game-map">
      <div
        ref={zp.containerRef}
        className="map__viewport"
        tabIndex={0}
        role="group"
        aria-roledescription="mapa"
        aria-label="Mapa de Nárnia. Setas movem o mapa, + e − mudam o zoom, 0 reenquadra. Tab percorre os territórios; Enter seleciona; Esc limpa a seleção."
        onKeyDown={onKeyDown}
        onClick={onBackgroundClick}
        {...zp.handlers}
      >
        {size.w > 0 ? (
          <svg className="map__svg" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
            <g transform={`translate(${vb.tx} ${vb.ty}) scale(${vb.s})`} aria-hidden="true">
              <rect width={MAP.artSize.width} height={MAP.artSize.height} className="map__sea" />
              <image href={ART_URL} width={MAP.artSize.width} height={MAP.artSize.height} preserveAspectRatio="none" />
            </g>
            <g className="map__routes" aria-hidden="true">
              {routes.map((l) => {
                const pa = anchors.get(l.a);
                const pb = anchors.get(l.b);
                if (!pa || !pb) return null;
                const a = toScreen(pa);
                const b = toScreen(pb);
                return (
                  <g key={l.key} className={`route route--${l.tone}${l.sea ? ' route--sea' : ''}${l.strong ? ' route--strong' : ''}`}>
                    <line className="route__halo" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                    <line className="route__line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                  </g>
                );
              })}
            </g>
            <g className="map__markers">
              {MAP.territories.map((t) => {
                const ts = view?.territories[t.id];
                const owner = view ? playerById(view.players, ts?.owner) : undefined;
                const p = toScreen(t.anchor);
                let state: MarkerState = 'none';
                if (t.id === selected) state = 'selected';
                else if (targets.has(t.id)) state = 'target';
                else if (destinations.has(t.id)) state = 'destination';
                const mine = !!view?.me && ts?.owner === view.me;
                const dimmed = (hasFocusSet && state === 'none') || (mineOnly && !mine && state === 'none');
                return (
                  <TerritoryMarker
                    key={t.id}
                    id={t.id}
                    name={t.name}
                    regionName={REGION_BY_ID.get(t.region)?.name ?? t.region}
                    x={p.x}
                    y={p.y}
                    ownerName={owner?.name ?? null}
                    ownerColor={owner?.color ?? null}
                    armies={ts?.armies ?? 0}
                    state={state}
                    dimmed={dimmed}
                    mine={mine}
                    radius={markerRadius}
                    onActivate={handleActivate}
                    onFocusMarker={handleFocus}
                  />
                );
              })}
            </g>
          </svg>
        ) : null}
      </div>

      <div className="map__controls" role="toolbar" aria-label="Controles do mapa">
        <button type="button" className="map-ctl" onClick={zp.zoomIn} disabled={!zp.canZoomIn} aria-label="Aproximar" title="Aproximar (+)">
          <Icon name="plus" />
        </button>
        <button type="button" className="map-ctl" onClick={zp.zoomOut} disabled={!zp.canZoomOut} aria-label="Afastar" title="Afastar (−)">
          <Icon name="minus" />
        </button>
        <button type="button" className="map-ctl" onClick={zp.reset} aria-label="Reenquadrar o mapa" title="Reenquadrar (0)">
          <Icon name="fit" />
        </button>
        <span className="map__controls-sep" aria-hidden="true" />
        <button
          type="button"
          className="map-ctl"
          aria-pressed={showRoutes}
          onClick={() => setShowRoutes((v) => !v)}
          aria-label="Ver todas as rotas"
          title="Ver todas as rotas"
        >
          <Icon name="route" />
        </button>
        {view?.me ? (
          <button
            type="button"
            className="map-ctl"
            aria-pressed={mineOnly}
            onClick={() => setMineOnly((v) => !v)}
            aria-label="Destacar meus territórios"
            title="Destacar meus territórios"
          >
            <Icon name="flag" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
