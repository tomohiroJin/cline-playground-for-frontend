/**
 * 迷宮の残響 - 残響圧報酬の配線テスト
 *
 * revenant 撃破の収集と KP 圧ボーナスの振る舞いを検証する。
 */
import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createMetaState } from '../../../domain/models/meta-state';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

const rvEvent: GameEvent = {
  id: 'rv_x', fl: [1], tp: 'revenant', minPressure: 2,
  sit: 'テスト亡霊', ch: [{ t: '鎮める', o: [{ c: 'default', r: '鎮めた', fl: 'revenant:p_lian' }] }],
};
const noop = () => undefined;
const audioSfx = { choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop, drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop };

const makeDeps = (over: Partial<GameActionsDeps>): GameActionsDeps => ({
  state: { ...createInitialState(), phase: 'event', player: { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 30, statuses: [] }, diff: null, event: rvEvent, floor: 1, step: 0, pressure: 2 },
  dispatch: noop, fx: {} as GameActionsDeps['fx'], meta: createMetaState({ fragments: ['f_lian_1'] }),
  events: [rvEvent], sfx: (fn: () => void) => fn(),
  safeTimeout: ((fn: () => void) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }),
  doShake: noop, flash: noop, updateMeta: noop, audioSfx, ...over,
});

describe('亡霊撃破の収集', () => {
  it('revenant:<id> outcome で revenantsDefeated に追加され dispatch に revenantDefeated:true が乗る', () => {
    const updates: Array<Record<string, unknown>> = [];
    const dispatched: Array<Record<string, unknown>> = [];
    const deps = makeDeps({
      updateMeta: ((u: (m: ReturnType<typeof createMetaState>) => Record<string, unknown>) => updates.push(u(createMetaState({ revenantsDefeated: [] })))) as GameActionsDeps['updateMeta'],
      dispatch: ((a: Record<string, unknown>) => dispatched.push(a)) as GameActionsDeps['dispatch'],
    });
    const { result } = renderHook(() => useGameActions(deps));
    act(() => { result.current.handleChoice(0); });
    expect(updates.find(u => 'revenantsDefeated' in u)?.revenantsDefeated).toEqual(['p_lian']);
    expect(dispatched.find(a => a.type === 'APPLY_CHOICE')?.revenantDefeated).toBe(true);
  });
});
