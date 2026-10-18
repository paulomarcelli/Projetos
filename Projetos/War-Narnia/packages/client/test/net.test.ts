import { describe, expect, it } from 'vitest';
import { friendlyError } from '../src/net/errors';
import { mergeEvents } from '../src/net/store';
import { inviteCodeFromUrl } from '../src/net/session';
import { describeEvent } from '../src/game/format';
import { makeView } from './fixtures';

describe('rede e textos', () => {
  it('traduz erros do servidor e do motor', () => {
    expect(friendlyError({ code: 'ROOM_NOT_FOUND', message: 'x' })).toMatch(/Sala não encontrada/);
    expect(friendlyError({ code: 'COLOR_TAKEN', message: 'x' })).toMatch(/cor já foi escolhida/);
    expect(friendlyError({ code: 'RULE_ERROR', message: 'x', ruleCode: 'NOT_ADJACENT' })).toMatch(/fronteira/);
    expect(friendlyError({ code: 'RULE_ERROR', message: 'Mensagem do motor', ruleCode: 'DESCONHECIDO' })).toBe('Mensagem do motor');
  });

  it('lê o código do link de convite', () => {
    expect(inviteCodeFromUrl('?sala=k7q2p')).toBe('K7Q2P');
    expect(inviteCodeFromUrl('?outra=1')).toBeNull();
  });

  it('não duplica eventos ao juntar log e game:events', () => {
    const e = { type: 'turn-ended' as const, at: 5, player: 'p1' };
    expect(mergeEvents([e], [e, { ...e, at: 6 }])).toHaveLength(2);
  });

  it('descreve o ataque no formato do histórico', () => {
    const v = makeView();
    const text = describeEvent(
      { type: 'attack', at: 1, attacker: 'p1', defender: 'p2', from: 'cair-paravel', to: 'beruna', attackDice: [6, 5, 2], defenseDice: [4, 4], attackerLosses: 1, defenderLosses: 1 },
      v.players,
    );
    expect(text).toBe('Ana atacou Beruna a partir de Cair Paravel: 6-5-2 × 4-4 — Ana perdeu 1, Bruno perdeu 1.');
  });
});
