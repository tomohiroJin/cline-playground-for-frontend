import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createMetaState } from '../../../domain/models/meta-state';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

// 断片付与イベント（読み解く選択肢のみ）
// 数値変化を持たせず（fx 未設定による NaN を避ける）断片付与のみを検証
const echoEvent: GameEvent = {
  id: 'echo_test', fl: [1], tp: 'echo',
  sit: 'テスト残響',
  ch: [{ t: '読み解く', o: [{ c: 'default', r: '断片獲得', fl: 'frag:f_lian_1' }] }],
};

const noop = () => undefined;
const audioSfx = {
  choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop,
  drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop,
};

const makeDeps = (overrides: Partial<GameActionsDeps>): GameActionsDeps => {
  const player = { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 10, statuses: [] };
  return {
    state: { ...createInitialState(), phase: 'event', player, diff: null, event: echoEvent, floor: 1, step: 0 },
    dispatch: noop,
    fx: {} as GameActionsDeps['fx'],
    meta: createMetaState({ echoDepth: 0, fragments: [] }),
    events: [echoEvent],
    sfx: (fn: () => void) => fn(),
    safeTimeout: ((fn: () => void) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }),
    doShake: noop,
    flash: noop,
    updateMeta: noop,
    audioSfx,
    ...overrides,
  };
};

describe('断片収集', () => {
  it('read 選択で fragments に断片IDが追加される', () => {
    const updates: Array<Record<string, unknown>> = [];
    const updateMeta = (updater: (m: ReturnType<typeof createMetaState>) => Record<string, unknown>) => {
      updates.push(updater(createMetaState({ echoDepth: 0, fragments: [] })));
    };
    const deps = makeDeps({ updateMeta: updateMeta as GameActionsDeps['updateMeta'] });
    const { result } = renderHook(() => useGameActions(deps));
    act(() => { result.current.handleChoice(0); });
    const fragUpdate = updates.find(u => 'fragments' in u);
    expect(fragUpdate?.fragments).toEqual(['f_lian_1']);
  });
});
