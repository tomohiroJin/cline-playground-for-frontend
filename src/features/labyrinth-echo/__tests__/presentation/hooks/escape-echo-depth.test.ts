import { renderHook, act } from '@testing-library/react';
import { incrementEchoDepth, selectSafetyNetFragment } from '../../../domain/services/echo-service';
import { createMetaState } from '../../../domain/models/meta-state';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

// ── 統合テスト用共通セットアップ ──

const noop = () => undefined;
const audioSfx = {
  choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop,
  drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop,
};

// escape 選択肢のみを持つイベント（数値変化なし・fx 未使用で NaN を回避）
const escapeEvent: GameEvent = {
  id: 'escape_integ_test', fl: [1], tp: 'normal',
  sit: '出口を発見した',
  ch: [{ t: '脱出する', o: [{ c: 'default', r: '脱出', fl: 'escape' }] }],
};

/**
 * handleEscapeOutcome の updateMeta が組み立てる echoDepth/fragments の
 * 計算ロジックを純粋関数の組み合わせとして検証する。
 * （副作用結合は Task 11 の手動確認・E2E で担保）
 */
describe('生還時の残響深度更新ロジック', () => {
  it('深度が +1 され、新深度でセーフティネット断片が選ばれる', () => {
    const prev = createMetaState({ echoDepth: 0, fragments: [] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    expect(newDepth).toBe(1);
    // depth1 未収集の最小 order → f_lian_1(order1,gate0) と f_twins_1(order1,gate1)
    // localeCompare で p_lian が先
    expect(safety?.id).toBe('f_lian_1');
  });

  it('既に収集済みの断片は重複付与されない', () => {
    const prev = createMetaState({ echoDepth: 1, fragments: ['f_lian_1', 'f_twins_1'] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    const next = safety && !prev.fragments.includes(safety.id)
      ? [...prev.fragments, safety.id] : prev.fragments;
    expect(next).toContain(safety!.id);
    expect(next.filter(id => id === safety!.id)).toHaveLength(1);
  });
});

// ── 統合テスト: useGameActions の escape 配線 ──

describe('生還時 useGameActions 統合テスト', () => {
  it('escape 経由の updateMeta に echoDepth+1 とセーフティネット断片が含まれる', () => {
    // Arrange
    const updates: Array<ReturnType<Parameters<GameActionsDeps['updateMeta']>[0]>> = [];
    const updateMeta: GameActionsDeps['updateMeta'] = (updater) => {
      updates.push(updater(createMetaState({ echoDepth: 0, fragments: [] })));
    };

    const player = { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 10, statuses: [] };
    // safeTimeout を同期スタブにして handleEscapeOutcome 内の遅延 updateMeta を即発火
    const safeTimeout: GameActionsDeps['safeTimeout'] = (fn) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    };

    const deps: GameActionsDeps = {
      state: {
        ...createInitialState(),
        phase: 'event',
        player,
        diff: null,
        event: escapeEvent,
        floor: 1,
        step: 0,
      },
      dispatch: noop,
      fx: {} as GameActionsDeps['fx'],
      meta: createMetaState({ echoDepth: 0, fragments: [] }),
      events: [escapeEvent],
      sfx: (fn: () => void) => fn(),
      safeTimeout,
      doShake: noop,
      flash: noop,
      updateMeta,
      audioSfx,
    };

    // Act
    const { result } = renderHook(() => useGameActions(deps));
    act(() => { result.current.handleChoice(0); });

    // Assert: escape 用の updateMeta（echoDepth を含む更新）を特定して検証
    const escapeUpdate = updates.find(u => 'echoDepth' in u);
    expect(escapeUpdate).toBeDefined();
    expect(escapeUpdate?.echoDepth).toBe(1);
    expect(Array.isArray(escapeUpdate?.fragments)).toBe(true);
    expect((escapeUpdate?.fragments as string[])).toContain('f_lian_1');
  });
});
