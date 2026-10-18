import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { AttackPanel, type GameActions } from '../src/components/game/PhasePanels';
import { makeView } from './fixtures';

afterEach(cleanup);

function actions(): GameActions {
  return {
    place: vi.fn(),
    trade: vi.fn(),
    endReinforce: vi.fn(),
    attack: vi.fn(),
    endAttack: vi.fn(),
    endTurn: vi.fn(),
    occupy: vi.fn(),
    fortify: vi.fn(),
  };
}

const attackBtn = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.startsWith('Atacar'))!;

describe('AttackPanel', () => {
  it('fica desabilitado fora da fase de ataque', () => {
    const view = makeView({ phase: 'fortify' });
    const { container, getByText } = render(
      <AttackPanel view={view} busy={false} actions={actions()} from="cair-paravel" to="beruna" lastAttack={null} attackSeq={0} />,
    );
    expect(attackBtn(container).disabled).toBe(true);
    expect(getByText(/Ataques só na fase de ataque/)).toBeTruthy();
  });

  it('fica desabilitado quando não é a vez do jogador', () => {
    const view = makeView({ currentPlayer: 'p2' });
    const { container } = render(
      <AttackPanel view={view} busy={false} actions={actions()} from="cair-paravel" to="beruna" lastAttack={null} attackSeq={0} />,
    );
    expect(attackBtn(container).disabled).toBe(true);
  });

  it('ataca com origem própria e alvo inimigo vizinho, limitando os dados a exércitos-1', () => {
    const view = makeView();
    view.territories['cair-paravel'] = { owner: 'p1', armies: 3 };
    const a = actions();
    const { container, getByLabelText } = render(
      <AttackPanel view={view} busy={false} actions={a} from="cair-paravel" to="beruna" lastAttack={null} attackSeq={0} />,
    );
    expect((getByLabelText('3') as HTMLInputElement).disabled).toBe(true);
    const btn = attackBtn(container);
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(a.attack).toHaveBeenCalledWith('cair-paravel', 'beruna', 2);
  });

  it('mostra exatamente os dados enviados pelo servidor', () => {
    const view = makeView();
    const { container } = render(
      <AttackPanel
        view={view}
        busy={false}
        actions={actions()}
        from={null}
        to={null}
        attackSeq={1}
        lastAttack={{
          type: 'attack',
          at: 1,
          attacker: 'p1',
          defender: 'p2',
          from: 'cair-paravel',
          to: 'beruna',
          attackDice: [6, 5, 2],
          defenseDice: [4, 4],
          attackerLosses: 0,
          defenderLosses: 2,
        }}
      />,
    );
    const values = Array.from(container.querySelectorAll('.die')).map((d) => d.getAttribute('aria-label'));
    expect(values).toEqual(['6', '5', '2', '4 (perdeu)', '4 (perdeu)']);
  });
});
