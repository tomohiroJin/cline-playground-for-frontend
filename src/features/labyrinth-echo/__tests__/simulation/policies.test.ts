import { LORE_POLICY, CAREFUL_POLICY, RANDOM_POLICY, RECKLESS_POLICY } from '../../simulation/policies';
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

describe('RECKLESS_POLICY', () => {
  it('脱出できる選択肢があれば脱出を選ぶ（悪状態のまま run を終える）', () => {
    const ev = {
      id: 'e', fl: [5], tp: 'x', sit: 's',
      ch: [
        { t: '戦う', o: [{ c: 'default', r: 'r', hp: -5, mn: 0, inf: 0 }] },
        { t: '脱出', o: [{ c: 'default', r: 'r', hp: 0, mn: 0, inf: 0, fl: 'escape' }] },
      ],
    } as unknown as GameEvent;
    expect(RECKLESS_POLICY.choose(ev, player, fx, normal, new SeededRandomSource(1))).toBe(1);
  });

  it('脱出が無ければ生存可能な中で最もダメージの大きい選択を取る', () => {
    const ev = {
      id: 'e', fl: [1], tp: 'x', sit: 's',
      ch: [
        { t: '軽傷', o: [{ c: 'default', r: 'r', hp: -1, mn: 0, inf: 0 }] },
        { t: '重傷', o: [{ c: 'default', r: 'r', hp: -20, mn: 0, inf: 0 }] },
      ],
    } as unknown as GameEvent;
    expect(RECKLESS_POLICY.choose(ev, player, fx, normal, new SeededRandomSource(1))).toBe(1);
  });

  it('状態異常を負う選択を優先する（同程度のダメージなら異常付与を選ぶ）', () => {
    const ev = {
      id: 'e', fl: [1], tp: 'x', sit: 's',
      ch: [
        { t: '無傷で進む', o: [{ c: 'default', r: 'r', hp: -2, mn: 0, inf: 0 }] },
        { t: '呪いを受ける', o: [{ c: 'default', r: 'r', hp: -2, mn: 0, inf: 0, fl: 'add:呪い' }] },
      ],
    } as unknown as GameEvent;
    expect(RECKLESS_POLICY.choose(ev, player, fx, normal, new SeededRandomSource(1))).toBe(1);
  });
});

describe('re-export 互換', () => {
  it('CAREFUL_POLICY / RANDOM_POLICY が policies からも参照できる', () => {
    expect(typeof CAREFUL_POLICY.choose).toBe('function');
    expect(typeof RANDOM_POLICY.choose).toBe('function');
  });
});
