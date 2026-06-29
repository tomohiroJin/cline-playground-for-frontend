import { LORE_POLICY, CAREFUL_POLICY, RANDOM_POLICY } from '../../simulation/policies';
import type { GameEvent } from '../../events/event-utils';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';
import { SeededRandomSource } from '../../domain/events/random';
import { createNewPlayer } from '../../domain/services/unlock-service';

const normal = DIFFICULTY.find(d => d.id === 'normal')!;
const fx = computeFx([]);
const player = createNewPlayer(normal, fx);

// frag選択肢を持つ擬似 echo イベント
const echoEvent = {
  id: 'echo_test', fl: [1], tp: 'echo', sit: 's',
  ch: [
    { t: '読む', o: [{ c: 'default', r: 'r', mn: -4, inf: 5, fl: 'frag:f_lian_1' }] },
    { t: '進む', o: [{ c: 'default', r: 'r', mn: 0, inf: 0 }] },
  ],
} as unknown as GameEvent;

describe('LORE_POLICY', () => {
  it('frag選択肢があればそのindexを選ぶ', () => {
    expect(LORE_POLICY.choose(echoEvent, player, fx, normal, new SeededRandomSource(1))).toBe(0);
  });

  it('frag選択肢がない通常イベントでは careful と同じ選択', () => {
    const plain = {
      id: 'p1', fl: [1], tp: 'trap', sit: 's',
      ch: [
        { t: 'A', o: [{ c: 'default', r: 'r', hp: -10, mn: 0, inf: 0 }] },
        { t: 'B', o: [{ c: 'default', r: 'r', hp: -1, mn: 0, inf: 0 }] },
      ],
    } as unknown as GameEvent;
    const rng = new SeededRandomSource(1);
    expect(LORE_POLICY.choose(plain, player, fx, normal, rng))
      .toBe(CAREFUL_POLICY.choose(plain, player, fx, normal, rng));
  });
});

describe('re-export 互換', () => {
  it('CAREFUL_POLICY / RANDOM_POLICY が policies からも参照できる', () => {
    expect(typeof CAREFUL_POLICY.choose).toBe('function');
    expect(typeof RANDOM_POLICY.choose).toBe('function');
  });
});
