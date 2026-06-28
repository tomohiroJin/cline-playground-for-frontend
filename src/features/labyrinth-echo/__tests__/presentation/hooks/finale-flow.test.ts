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
import type { GameAction } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

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

// 全先人の断片ID（isTrueRouteUnlocked を true にするために必要）
const ALL_PREDECESSOR_FRAGMENTS = [
  'f_lian_1', 'f_lian_2', 'f_lian_3', 'f_lian_4',
  'f_twins_1', 'f_twins_2', 'f_twins_3', 'f_twins_4',
  'f_galen_1', 'f_galen_2', 'f_galen_3', 'f_galen_4',
  'f_elna_1', 'f_elna_2', 'f_elna_3', 'f_elna_4',
  'f_first_1', 'f_first_2', 'f_first_3',
];

// 脱出フラグのみを返すシンプルなテスト用イベント（HP/MN 変化なし）
const escapeEvent: GameEvent = {
  id: 'escape_test', fl: [5], tp: 'story',
  sit: '出口が見えた',
  ch: [{ t: '脱出する', o: [{ c: 'default', r: '脱出に成功した', fl: 'escape' }] }],
};

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

  it('【回帰】1周目 finaleDecide → offer 入口 handleChoice(escape) でガードリセット → 2周目 finaleEscape がコミットできる', () => {
    // Arrange: コミット数と OFFER_TRUE_ROUTE ディスパッチを追跡
    let commitCount = 0;
    const updateMeta: GameActionsDeps['updateMeta'] = (fn) => {
      const result = fn(createMetaState({}));
      if ('escapes' in result) commitCount++;
    };
    const dispatched: string[] = [];
    const dispatch = ((action: GameAction) => { dispatched.push(action.type); }) as React.Dispatch<GameAction>;

    // Phase 1: 終章ビート中の状態で finaleDecide → 1周目コミット（ガード = true）
    const phase1Deps: GameActionsDeps = makeFinaleHookDeps(3, updateMeta);
    const { result, rerender } = renderHook(
      (d: GameActionsDeps) => useGameActions(d),
      { initialProps: phase1Deps },
    );

    act(() => { result.current.finaleDecide('inherit'); });
    expect(commitCount).toBe(1);

    // Phase 2: 真ルート解禁済みの状態でイベント脱出 → handleEscapeOutcome がガードをリセット
    // （isTrueRouteUnlocked = true: echoDepth >= 6 かつ全先人断片収集済み）
    const unlockedMeta = createMetaState({
      echoDepth: 6,
      fragments: ALL_PREDECESSOR_FRAGMENTS,
    });
    const phase2Deps: GameActionsDeps = {
      ...phase1Deps,
      state: {
        ...createInitialState(),
        phase: 'event',
        player: testPlayer,
        event: escapeEvent,
        floor: 5,
        step: 0,
      },
      dispatch,
      meta: unlockedMeta,
      updateMeta,
    };
    rerender(phase2Deps);

    // 脱出選択 → handleEscapeOutcome がリセット → OFFER_TRUE_ROUTE ディスパッチ
    act(() => { result.current.handleChoice(0); });
    expect(dispatched).toContain('OFFER_TRUE_ROUTE');

    // Phase 3: offer 表示状態（OFFER_TRUE_ROUTE → phase:'finale', finaleStep:0）で
    // finaleEscape → 2周目コミット成功（ソフトロックしないこと）
    const phase3Deps: GameActionsDeps = {
      ...phase1Deps,
      state: {
        ...createInitialState(),
        phase: 'finale',
        player: testPlayer,
        finaleStep: 0,
        pressure: 0,
        legacyId: null,
      },
      dispatch,
      meta: unlockedMeta,
      updateMeta,
    };
    rerender(phase3Deps);

    act(() => { result.current.finaleEscape(); });
    expect(commitCount).toBe(2); // 2周目 finaleEscape がコミットできること
  });

  it('同一周内の二重コミット no-op が維持される（finaleEscape 連打）', () => {
    let commitCount = 0;
    const updateMeta: GameActionsDeps['updateMeta'] = (fn) => {
      const result = fn(createMetaState({}));
      if ('escapes' in result) commitCount++;
    };

    const { result } = renderHook(
      (d: GameActionsDeps) => useGameActions(d),
      { initialProps: makeFinaleHookDeps(0, updateMeta) },
    );

    // 1回目 finaleEscape（コミット成功）
    act(() => { result.current.finaleEscape(); });
    expect(commitCount).toBe(1);

    // 連打（ガード中 → 無視）
    act(() => { result.current.finaleEscape(); });
    expect(commitCount).toBe(1); // 増えないこと
  });
});
