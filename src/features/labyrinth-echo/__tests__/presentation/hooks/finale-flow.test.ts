/**
 * 迷宮の残響 - 終章フロー 純粋合成仕様テスト
 *
 * 終章の victory コミットが「決断×昇格条件」で正しい真ENDを選ぶことを固定する。
 * （commitVictory の実配線は use-game-actions.ts、回帰は use-game で担保）
 * また二重コミットガードの動作と2周目リセットを検証する。
 */
import { renderHook, act } from '@testing-library/react';
import { determineTrueEnding } from '../../../domain/services/finale-service';
import { determineEnding } from '../../../domain/services/ending-service';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createMetaState } from '../../../domain/models/meta-state';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';

describe('終章 victory の真END選択', () => {
  it('継ぐ×圧6 → 真・継承者、断つ×継承なし圧0 → 解放者', () => {
    expect(determineTrueEnding('inherit', 6, null).id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 0, null).id).toBe('te_liberator');
  });

  it('通常 determineEnding は真END id を返さない（経路分離）', () => {
    const p = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] } as never;
    expect(determineEnding(p, [], { id: 'normal' }).id.startsWith('te_')).toBe(false);
  });
});

// ── 二重コミットガードのリセット検証 ──

const noop = () => undefined;
const audioSfx = {
  choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop,
  drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop,
};
const testPlayer = { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 10, statuses: [] };

/** テスト用 deps を生成（finaleStep を切り替えて rerenderに使用） */
const makeFinaleHookDeps = (
  finaleStep: number,
  updateMeta: GameActionsDeps['updateMeta'],
): GameActionsDeps => ({
  state: {
    ...createInitialState(),
    phase: 'finale',
    player: testPlayer,
    finaleStep,
    pressure: 0,
    legacyId: null,
  },
  dispatch: noop,
  fx: {} as GameActionsDeps['fx'],
  meta: createMetaState({}),
  events: [],
  sfx: (fn: () => void) => fn(),
  // safeTimeout を即時実行にして非同期待ちを排除
  safeTimeout: ((fn: () => void) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }),
  doShake: noop,
  flash: noop,
  updateMeta,
  audioSfx,
});

describe('二重コミットガードと2周目リセット', () => {
  it('finaleDecide は1ランに1回のみコミットし、finaleAdvance(step=0)でガードがリセットされる', () => {
    // Arrange: escapes を含む updateMeta 呼び出しをコミットカウントとして追跡
    let commitCount = 0;
    const updateMeta: GameActionsDeps['updateMeta'] = (fn) => {
      const result = fn(createMetaState({}));
      if ('escapes' in result) commitCount++;
    };

    const { result, rerender } = renderHook(
      (d: GameActionsDeps) => useGameActions(d),
      { initialProps: makeFinaleHookDeps(3, updateMeta) },
    );

    // Act: 1回目の決断（コミット成功）
    act(() => { result.current.finaleDecide('inherit'); });
    expect(commitCount).toBe(1);

    // Act: 同ラン内で再度クリック（ガード中 → 無視される）
    act(() => { result.current.finaleDecide('sever'); });
    expect(commitCount).toBe(1); // 増えないこと

    // Act: 新ランの終章突入（finaleStep=0 → finaleAdvance でガードリセット）
    rerender(makeFinaleHookDeps(0, updateMeta));
    act(() => { result.current.finaleAdvance(); });

    // Act: 2周目の決断（ガードがリセットされているため成功）
    rerender(makeFinaleHookDeps(3, updateMeta));
    act(() => { result.current.finaleDecide('sever'); });
    expect(commitCount).toBe(2);
  });
});
