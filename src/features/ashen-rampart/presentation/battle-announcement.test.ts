/**
 * decideBattleAnnouncement のテスト
 *
 * 「ウェーブ境界で読み上げが出る」「同じ tick に漏れがあれば漏れが優先される」
 * の2件を検証する。CombatState は必要な4フィールドだけを渡せば足りる
 * （Pick<CombatState, 'events' | 'tick' | 'life' | 'waves'>）。
 */
import { decideBattleAnnouncement } from './battle-announcement';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';

type MinimalState = Pick<CombatState, 'events' | 'tick' | 'life' | 'waves'>;

const stateAt = (
  tick: number,
  events: TickEvent[] = [],
  life = 12
): MinimalState => ({
  tick,
  life,
  events,
  waves: [
    { startTick: 90, entries: [] },
    { startTick: 340, entries: [] },
  ],
});

describe('decideBattleAnnouncement', () => {
  it('ウェーブが切り替わった tick で読み上げが出る', () => {
    const decision = decideBattleAnnouncement(stateAt(90), 0);
    expect(decision).toEqual({ text: '第1波が始まった', wave: 1 });
  });

  it('ウェーブが切り替わっていない tick では何も出ない', () => {
    expect(decideBattleAnnouncement(stateAt(89), 0)).toBeUndefined();
    expect(decideBattleAnnouncement(stateAt(120), 1)).toBeUndefined();
  });

  it('ウェーブ開始前（tick 0）は wave が0のため読み上げない', () => {
    expect(decideBattleAnnouncement(stateAt(0), 0)).toBeUndefined();
  });

  it('同じ tick に漏れがあればウェーブ境界より漏れが優先される', () => {
    const leakEvent: TickEvent = { kind: 'leak', enemyId: 1 };
    const decision = decideBattleAnnouncement(stateAt(90, [leakEvent], 9), 0);
    expect(decision).toEqual({ text: '1体が砦に到達。残りライフ 9', wave: 1 });
  });

  it('漏れが複数件でも件数付きで1件にまとまる', () => {
    const leaks: TickEvent[] = [
      { kind: 'leak', enemyId: 1 },
      { kind: 'leak', enemyId: 2 },
    ];
    const decision = decideBattleAnnouncement(stateAt(200, leaks, 8), 1);
    expect(decision).toEqual({ text: '2体が砦に到達。残りライフ 8', wave: 1 });
  });
});
