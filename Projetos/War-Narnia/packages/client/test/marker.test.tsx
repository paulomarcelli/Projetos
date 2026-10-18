import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { TerritoryMarker, markerLabel } from '../src/components/map/TerritoryMarker';

afterEach(cleanup);

function renderMarker(props: Partial<Parameters<typeof TerritoryMarker>[0]> = {}) {
  const onActivate = vi.fn();
  const utils = render(
    <svg>
      <TerritoryMarker
        id="cair-paravel"
        name="Cair Paravel"
        regionName="Reino de Nárnia"
        x={100}
        y={100}
        ownerName="Ana"
        ownerColor="vermelho"
        armies={5}
        state="none"
        onActivate={onActivate}
        {...props}
      />
    </svg>,
  );
  return { ...utils, onActivate };
}

describe('TerritoryMarker', () => {
  it('tem nome acessível completo e é focável como botão', () => {
    const { getByRole } = renderMarker();
    const btn = getByRole('button', { name: 'Cair Paravel, Reino de Nárnia, Ana, 5 exércitos' });
    expect(btn.getAttribute('tabindex')).toBe('0');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('mostra números de 3 dígitos com fonte reduzida', () => {
    const { container } = renderMarker({ armies: 125 });
    const text = container.querySelector('.marker__count')!;
    expect(text.textContent).toBe('125');
    expect(Number(text.getAttribute('font-size'))).toBeLessThan(13.5);
  });

  it('Enter e Espaço selecionam; clique também', () => {
    const { getByRole, onActivate } = renderMarker();
    const btn = getByRole('button');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    fireEvent.click(btn);
    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(onActivate).toHaveBeenCalledWith('cair-paravel');
  });

  it('marca o dono com emblema (não só cor) e anuncia estados', () => {
    const { container } = renderMarker({ state: 'target' });
    expect(container.querySelector('.marker__seal path')).not.toBeNull();
    expect(container.querySelector('.marker__badge--target')).not.toBeNull();
    expect(markerLabel({ name: 'Beruna', regionName: 'Reino de Nárnia', ownerName: 'Bruno', armies: 1, state: 'target' })).toBe(
      'Beruna, Reino de Nárnia, Bruno, 1 exército, pode ser atacado',
    );
  });
});
