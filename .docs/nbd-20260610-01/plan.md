# Non-Brake Descent ゲームフィール刷新 実装計画（P0 + P1: タイムスケール基盤）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ✅ **実装ステータス: 完了**（PR #100 マージ済み。全 Phase 0 / Phase 1 タスクを TDD で実装・テスト済み）

**Goal:** ゲームループにタイムスケール層（GameClock）を導入し、敵撃破ヒットストップ・ニアミス bullet-time・死亡時インパクト・`prefers-reduced-motion` 対応を、既存メカニクス無改変で実装する。

**Architecture:** 既存の単一 `setInterval(1000/60)` ループ（`presentation/hooks/use-game-engine.ts`）は書き換えず、純粋ロジック `GameClock` をループ先頭のゲートとして挿入する。`shouldStepSim===false` の tick はシミュレーション本体をスキップ（＝完全停止＝ヒットストップ／間引き＝スローモー）。トリガーは衝突イベント箇所で `triggerHitstop` / `triggerSlowMo` を呼ぶだけ。

**Tech Stack:** TypeScript / React 19 / Jotai / Jest 30 (+ SWC) / styled-components。テストは co-located（対象と同ディレクトリに `*.test.ts`）、AAA コメント + `正常系/異常系/境界値` の describe ネスト、日本語テスト名。

**対象ディレクトリ:** `src/features/non-brake-descent/`（以下、パスはこの接頭辞を省略せず明記）

**設計仕様の出典:** `.docs/nbd-20260610-01/spec.md`

---

## ファイル構成（本計画で作成・変更するファイル）

| 種別 | パス | 責務 |
|------|------|------|
| 作成 | `src/features/non-brake-descent/application/game-loop/game-clock.ts` | タイムスケール純粋ロジック（hitstop/slowmo） |
| 作成 | `src/features/non-brake-descent/application/game-loop/game-clock.test.ts` | GameClock の単体テスト |
| 作成 | `src/features/non-brake-descent/application/game-loop/motion-scale.ts` | reduced-motion 係数の純粋ヘルパー |
| 作成 | `src/features/non-brake-descent/application/game-loop/motion-scale.test.ts` | motion-scale の単体テスト |
| 作成 | `src/features/non-brake-descent/presentation/hooks/use-reduced-motion.ts` | `prefers-reduced-motion` 監視フック |
| 作成 | `src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts` | フックの単体テスト |
| 変更 | `src/features/non-brake-descent/config.ts` | `juice` 数値セクションを追加 |
| 変更 | `src/features/non-brake-descent/presentation/hooks/use-game-engine.ts` | クロックゲート配線・各トリガー・reduced-motion 適用 |

---

# Phase 0: タイムスケール基盤

## Task 1: Config に juice 数値セクションを追加

**Files:**
- Modify: `src/features/non-brake-descent/config.ts`

数値（ヒットストップ/スローモーのフレーム数）はマジックナンバーにせず Config に集約する（コーディング規約準拠）。

- [x] **Step 1: Config に juice セクションを追加**

`src/features/non-brake-descent/config.ts` の `Config` オブジェクト末尾（`animation: {...},` の次の行）に以下を追加する。

```typescript
  juice: {
    // ヒットストップ（完全停止）するフレーム数
    hitstop: { enemyKill: 4, item: 2, death: 3 },
    // スローモー: frames=持続 real-tick 数, factor=何 tick に1回 sim を進めるか
    slowMo: { nearMissFrames: 12, nearMissFactor: 3 },
  },
```

- [x] **Step 2: 型チェックで壊れていないことを確認**

Run: `npm run typecheck`
Expected: PASS（エラーなし）

- [x] **Step 3: コミット**

```bash
git add src/features/non-brake-descent/config.ts
git commit -m "feat: NBD に juice 数値設定を追加

- ヒットストップ/スローモーのフレーム数を Config.juice に集約"
```

---

## Task 2: GameClock — 生成・ヒットストップ・通常進行（TDD）

**Files:**
- Create: `src/features/non-brake-descent/application/game-loop/game-clock.ts`
- Test: `src/features/non-brake-descent/application/game-loop/game-clock.test.ts`

- [x] **Step 1: 失敗するテストを書く**

`src/features/non-brake-descent/application/game-loop/game-clock.test.ts` を新規作成。

```typescript
import { advanceClock, createGameClock, triggerHitstop } from './game-clock';

describe('GameClock', () => {
  describe('createGameClock', () => {
    describe('正常系', () => {
      it('停止・スローモーともに0の初期クロックを生成する', () => {
        // Arrange / Act
        const clock = createGameClock();

        // Assert
        expect(clock.hitstopFrames).toBe(0);
        expect(clock.slowMoFrames).toBe(0);
        expect(clock.tickCounter).toBe(0);
      });
    });
  });

  describe('triggerHitstop', () => {
    describe('正常系', () => {
      it('指定フレーム数のヒットストップを設定する', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const result = triggerHitstop(clock, 4);

        // Assert
        expect(result.hitstopFrames).toBe(4);
      });

      it('既存より長いヒットストップで上書きする（max 合成）', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 2);

        // Act
        const result = triggerHitstop(clock, 5);

        // Assert
        expect(result.hitstopFrames).toBe(5);
      });

      it('既存より短い指定では上書きしない', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 5);

        // Act
        const result = triggerHitstop(clock, 2);

        // Assert
        expect(result.hitstopFrames).toBe(5);
      });
    });

    describe('境界値', () => {
      it('0フレーム指定では停止しない', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const result = triggerHitstop(clock, 0);

        // Assert
        expect(result.hitstopFrames).toBe(0);
      });
    });
  });

  describe('advanceClock', () => {
    describe('正常系', () => {
      it('通常時はシミュレーションを進める', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const { shouldStepSim } = advanceClock(clock);

        // Assert
        expect(shouldStepSim).toBe(true);
      });

      it('ヒットストップ中はシミュレーションを止める', () => {
        // Arrange
        const clock = triggerHitstop(createGameClock(), 2);

        // Act
        const { clock: next, shouldStepSim } = advanceClock(clock);

        // Assert
        expect(shouldStepSim).toBe(false);
        expect(next.hitstopFrames).toBe(1);
      });

      it('ヒットストップが切れた次の tick で再びシミュレーションを進める', () => {
        // Arrange
        const first = advanceClock(triggerHitstop(createGameClock(), 1));

        // Act
        const second = advanceClock(first.clock);

        // Assert
        expect(first.shouldStepSim).toBe(false);
        expect(second.shouldStepSim).toBe(true);
      });
    });
  });
});
```

- [x] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/game-clock.test.ts`
Expected: FAIL（`Cannot find module './game-clock'`）

- [x] **Step 3: 最小実装を書く**

`src/features/non-brake-descent/application/game-loop/game-clock.ts` を新規作成。

```typescript
/**
 * ゲームクロック（タイムスケール制御）
 *
 * ゲームループ先頭のゲートとして使い、ヒットストップ（完全停止）と
 * スローモー（間引き）を純粋関数として表現する。副作用は持たない。
 */

/** タイムスケールの状態 */
export interface GameClock {
  /** 完全停止する残り tick 数（ヒットストップ） */
  readonly hitstopFrames: number;
  /** スローモー残り tick 数 */
  readonly slowMoFrames: number;
  /** 何 tick に1回 sim を進めるか（スローモー間引き） */
  readonly slowMoFactor: number;
  /** スローモー間引き判定用のカウンタ */
  readonly tickCounter: number;
}

/** advanceClock の戻り値 */
export interface AdvanceResult {
  readonly clock: GameClock;
  readonly shouldStepSim: boolean;
}

const DEFAULT_SLOWMO_FACTOR = 1;

/** 初期クロックを生成する */
export const createGameClock = (): GameClock => ({
  hitstopFrames: 0,
  slowMoFrames: 0,
  slowMoFactor: DEFAULT_SLOWMO_FACTOR,
  tickCounter: 0,
});

/** 正の整数に正規化する（負・非整数を弾く） */
const normalizeFrames = (frames: number): number => Math.max(0, Math.floor(frames));

/** ヒットストップを発動する（既存より長ければ上書き = max 合成） */
export const triggerHitstop = (clock: GameClock, frames: number): GameClock => ({
  ...clock,
  hitstopFrames: Math.max(clock.hitstopFrames, normalizeFrames(frames)),
});

/** 1 real-tick 進め、シミュレーションを進めるべきか返す */
export const advanceClock = (clock: GameClock): AdvanceResult => {
  // ヒットストップ中: 完全停止
  if (clock.hitstopFrames > 0) {
    return {
      clock: { ...clock, hitstopFrames: clock.hitstopFrames - 1 },
      shouldStepSim: false,
    };
  }
  // 通常進行
  return { clock: { ...clock, tickCounter: 0 }, shouldStepSim: true };
};
```

- [x] **Step 4: テストを実行して成功を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/game-clock.test.ts`
Expected: PASS（全ケース成功）

- [x] **Step 5: コミット**

```bash
git add src/features/non-brake-descent/application/game-loop/game-clock.ts src/features/non-brake-descent/application/game-loop/game-clock.test.ts
git commit -m "feat: NBD タイムスケール基盤 GameClock を追加

- createGameClock/triggerHitstop/advanceClock を純粋関数で実装
- ヒットストップ（完全停止）と通常進行をTDDで実装"
```

---

## Task 3: GameClock — スローモー（間引き）を追加（TDD）

**Files:**
- Modify: `src/features/non-brake-descent/application/game-loop/game-clock.ts`
- Modify: `src/features/non-brake-descent/application/game-loop/game-clock.test.ts`

- [x] **Step 1: 失敗するテストを追加**

`game-clock.test.ts` の import 行を以下に差し替える。

```typescript
import { advanceClock, createGameClock, triggerHitstop, triggerSlowMo } from './game-clock';
```

`describe('GameClock', () => {` 直下、`describe('advanceClock', ...)` ブロックの**前**に以下の describe を追加する。

```typescript
  describe('triggerSlowMo', () => {
    describe('正常系', () => {
      it('指定フレーム数・factor のスローモーを設定する', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const result = triggerSlowMo(clock, 12, 3);

        // Assert
        expect(result.slowMoFrames).toBe(12);
        expect(result.slowMoFactor).toBe(3);
      });
    });

    describe('境界値', () => {
      it('factor は最小1に正規化される', () => {
        // Arrange
        const clock = createGameClock();

        // Act
        const result = triggerSlowMo(clock, 12, 0);

        // Assert
        expect(result.slowMoFactor).toBe(1);
      });
    });
  });

  describe('advanceClock（スローモー）', () => {
    describe('正常系', () => {
      it('factor=3 のスローモーでは3 tick に1回だけ sim を進める', () => {
        // Arrange
        let clock = triggerSlowMo(createGameClock(), 12, 3);
        const steps: boolean[] = [];

        // Act: 3 tick 進める
        for (let i = 0; i < 3; i++) {
          const result = advanceClock(clock);
          clock = result.clock;
          steps.push(result.shouldStepSim);
        }

        // Assert: 1,2回目はスキップ、3回目で進む
        expect(steps).toEqual([false, false, true]);
      });

      it('スローモー残数を毎 tick 減らす', () => {
        // Arrange
        const clock = triggerSlowMo(createGameClock(), 12, 3);

        // Act
        const { clock: next } = advanceClock(clock);

        // Assert
        expect(next.slowMoFrames).toBe(11);
      });

      it('ヒットストップはスローモーより優先される', () => {
        // Arrange
        const clock = triggerSlowMo(triggerHitstop(createGameClock(), 2), 12, 3);

        // Act
        const { shouldStepSim, clock: next } = advanceClock(clock);

        // Assert: hitstop を先に消費し、slowMo は減らない
        expect(shouldStepSim).toBe(false);
        expect(next.hitstopFrames).toBe(1);
        expect(next.slowMoFrames).toBe(12);
      });
    });
  });
```

- [x] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/game-clock.test.ts`
Expected: FAIL（`triggerSlowMo is not a function` 等）

- [x] **Step 3: 実装を追加**

`game-clock.ts` に `triggerSlowMo` を追加する（`triggerHitstop` の定義の直後に挿入）。

```typescript
/** スローモーを発動する（frames tick の間、factor 間引き） */
export const triggerSlowMo = (clock: GameClock, frames: number, factor: number): GameClock => ({
  ...clock,
  slowMoFrames: Math.max(clock.slowMoFrames, normalizeFrames(frames)),
  slowMoFactor: Math.max(1, Math.floor(factor)),
});
```

`advanceClock` の「通常進行」コメントの直前（`return { ...通常 }` の前）にスローモー分岐を挿入し、関数全体を以下に置き換える。

```typescript
/** 1 real-tick 進め、シミュレーションを進めるべきか返す */
export const advanceClock = (clock: GameClock): AdvanceResult => {
  // ヒットストップ中: 完全停止（スローモーより優先）
  if (clock.hitstopFrames > 0) {
    return {
      clock: { ...clock, hitstopFrames: clock.hitstopFrames - 1 },
      shouldStepSim: false,
    };
  }
  // スローモー中: factor tick に1回だけ sim を進める
  if (clock.slowMoFrames > 0) {
    const tickCounter = clock.tickCounter + 1;
    const shouldStepSim = tickCounter % clock.slowMoFactor === 0;
    return {
      clock: { ...clock, slowMoFrames: clock.slowMoFrames - 1, tickCounter },
      shouldStepSim,
    };
  }
  // 通常進行
  return { clock: { ...clock, tickCounter: 0 }, shouldStepSim: true };
};
```

- [x] **Step 4: テストを実行して成功を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/game-clock.test.ts`
Expected: PASS（全ケース成功）

- [x] **Step 5: コミット**

```bash
git add src/features/non-brake-descent/application/game-loop/game-clock.ts src/features/non-brake-descent/application/game-loop/game-clock.test.ts
git commit -m "feat: NBD GameClock にスローモー（間引き）を追加

- triggerSlowMo と advanceClock のスローモー分岐をTDDで実装
- ヒットストップ優先・factor間引きの bullet-time を実現"
```

---

## Task 4: ゲームループにクロックゲートと撃破/取得ヒットストップを配線

**Files:**
- Modify: `src/features/non-brake-descent/presentation/hooks/use-game-engine.ts`

既存 sim ロジックは無改変。ループ先頭に `advanceClock` ゲートを追加し、敵撃破・アイテム取得時にヒットストップを発動する。

- [x] **Step 1: import とクロック ref を追加**

`use-game-engine.ts` の import 群（37〜38行目付近、`import { useIsMobile } from './use-mobile';` の直前）に追加する。

```typescript
import { advanceClock, createGameClock, triggerHitstop } from '../../application/game-loop/game-clock';
```

`const passedObs = useRef<Set<string>>(new Set());`（175行目付近）の直後に追加する。

```typescript
  const clockRef = useRef(createGameClock());
```

- [x] **Step 2: ゲームループ先頭にクロックゲートを挿入**

ゲームループ `useEffect`（410行目付近）の `const loop = window.setInterval(() => {` の直後、`frameRef.current++;` の**前**に以下を挿入する。

```typescript
      // タイムスケールゲート: 停止/間引き tick は sim をスキップ
      const advance = advanceClock(clockRef.current);
      clockRef.current = advance.clock;
      if (!advance.shouldStepSim) {
        setShake(current => Math.max(0, current * Config.animation.shakeDecay));
        return;
      }
```

- [x] **Step 3: 敵撃破ヒットストップを配線**

`onEnemyKill` コールバック（509〜515行目付近）の本体末尾、`addScorePopup(ox, prev.ramp * RAMP_H - camY, ` の行の直後に1行追加する。変更後の `onEnemyKill` は以下になる。

```typescript
            onEnemyKill: ox => {
              Audio.play('enemyKill');
              setScore(current => current + Config.score.enemy);
              setSpeed(current => Math.max(MIN_SPD, current - Config.combat.enemyKillSlowdown));
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ff8800', 10);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.enemy}`, '#ff8800');
              clockRef.current = triggerHitstop(clockRef.current, Config.juice.hitstop.enemyKill);
            },
```

- [x] **Step 4: アイテム取得ヒットストップを配線**

`onScore` コールバック（498〜503行目付近）の本体末尾、`addScorePopup(ox, prev.ramp * RAMP_H - camY, ` の行の直後に1行追加する。変更後の `onScore` は以下になる。

```typescript
            onScore: ox => {
              Audio.play('score');
              setScore(current => current + Config.score.item);
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ffdd00', 6);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.item}`, '#ffdd00');
              clockRef.current = triggerHitstop(clockRef.current, Config.juice.hitstop.item);
            },
```

- [x] **Step 5: 型チェックと既存テストの回帰確認**

Run: `npm run typecheck`
Expected: PASS

Run: `npm test -- src/features/non-brake-descent`
Expected: PASS（既存テストが全て通る）

- [x] **Step 6: 手動動作確認**

Run: `npm start`
ブラウザで `/non-brake-descent`（ゲーム一覧から「Non-Brake Descent」）を開き、プレイして以下を確認:
- 中速で敵に当たって撃破した瞬間、画面が一瞬止まる（ヒットストップ）
- アイテム取得時にごく短い溜めがある
- ゲームが固まらず通常進行に戻る

確認後、`Ctrl+C` で停止。

- [x] **Step 7: コミット**

```bash
git add src/features/non-brake-descent/presentation/hooks/use-game-engine.ts
git commit -m "feat: NBD ループにヒットストップを配線

- ゲームループ先頭にタイムスケールゲートを追加（sim無改変）
- 敵撃破・アイテム取得時にヒットストップを発動"
```

---

## Task 5: Phase 0 の CI 全パス確認

**Files:** （変更なし・検証のみ）

- [x] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: PASS（lint:ci → typecheck → test → build が全て成功）

失敗した場合は該当箇所を修正し、修正内容を `fix:` でコミットしてから次へ進む。

---

# Phase 1: ニアミス bullet-time・死亡インパクト・reduced-motion

## Task 6: motion-scale 純粋ヘルパー（TDD）

**Files:**
- Create: `src/features/non-brake-descent/application/game-loop/motion-scale.ts`
- Test: `src/features/non-brake-descent/application/game-loop/motion-scale.test.ts`

`prefers-reduced-motion` が有効なときは時間操作（ヒットストップ/スローモー）を無効化する。係数（0 or 1）を純粋関数で表現する。

- [x] **Step 1: 失敗するテストを書く**

`src/features/non-brake-descent/application/game-loop/motion-scale.test.ts` を新規作成。

```typescript
import { resolveMotionScale, scaleFrames } from './motion-scale';

describe('motion-scale', () => {
  describe('resolveMotionScale', () => {
    describe('正常系', () => {
      it('reduced-motion 無効時は係数1を返す', () => {
        // Arrange / Act / Assert
        expect(resolveMotionScale(false)).toBe(1);
      });

      it('reduced-motion 有効時は係数0を返す（時間操作を無効化）', () => {
        // Arrange / Act / Assert
        expect(resolveMotionScale(true)).toBe(0);
      });
    });
  });

  describe('scaleFrames', () => {
    describe('正常系', () => {
      it('係数1でフレーム数をそのまま返す', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(12, 1)).toBe(12);
      });

      it('係数0でフレーム数を0にする', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(12, 0)).toBe(0);
      });
    });

    describe('境界値', () => {
      it('小数係数は四捨五入する', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(5, 0.5)).toBe(3);
      });
    });
  });
});
```

- [x] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/motion-scale.test.ts`
Expected: FAIL（`Cannot find module './motion-scale'`）

- [x] **Step 3: 最小実装を書く**

`src/features/non-brake-descent/application/game-loop/motion-scale.ts` を新規作成。

```typescript
/**
 * reduced-motion 係数ヘルパー
 *
 * prefers-reduced-motion が有効なときは時間操作（ヒットストップ/スローモー）を
 * 無効化するための係数を提供する。純粋関数。
 */

/** reduced-motion の有効/無効から演出強度の係数を解決する */
export const resolveMotionScale = (reduced: boolean): number => (reduced ? 0 : 1);

/** フレーム数に係数を掛けて四捨五入する */
export const scaleFrames = (frames: number, scale: number): number => Math.round(frames * scale);
```

- [x] **Step 4: テストを実行して成功を確認**

Run: `npm test -- src/features/non-brake-descent/application/game-loop/motion-scale.test.ts`
Expected: PASS

- [x] **Step 5: コミット**

```bash
git add src/features/non-brake-descent/application/game-loop/motion-scale.ts src/features/non-brake-descent/application/game-loop/motion-scale.test.ts
git commit -m "feat: NBD reduced-motion 係数ヘルパーを追加

- resolveMotionScale/scaleFrames をTDDで実装"
```

---

## Task 7: useReducedMotion フック（TDD）

**Files:**
- Create: `src/features/non-brake-descent/presentation/hooks/use-reduced-motion.ts`
- Test: `src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts`

- [x] **Step 1: 失敗するテストを書く**

`src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts` を新規作成。

```typescript
import { renderHook } from '@testing-library/react';
import { useReducedMotion } from './use-reduced-motion';

/** matchMedia をモックするヘルパー */
const mockMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
};

describe('useReducedMotion', () => {
  describe('正常系', () => {
    it('prefers-reduced-motion が無効なら false を返す', () => {
      // Arrange
      mockMatchMedia(false);

      // Act
      const { result } = renderHook(() => useReducedMotion());

      // Assert
      expect(result.current).toBe(false);
    });

    it('prefers-reduced-motion が有効なら true を返す', () => {
      // Arrange
      mockMatchMedia(true);

      // Act
      const { result } = renderHook(() => useReducedMotion());

      // Assert
      expect(result.current).toBe(true);
    });
  });
});
```

- [x] **Step 2: テストを実行して失敗を確認**

Run: `npm test -- src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts`
Expected: FAIL（`Cannot find module './use-reduced-motion'`）

- [x] **Step 3: 実装を書く**

`src/features/non-brake-descent/presentation/hooks/use-reduced-motion.ts` を新規作成。

```typescript
import { useEffect, useState } from 'react';

/**
 * prefers-reduced-motion メディアクエリを監視するフック。
 * ユーザーが「視差効果を減らす」設定をしている場合 true を返す。
 */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (event: MediaQueryListEvent): void => setReduced(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
};
```

- [x] **Step 4: テストを実行して成功を確認**

Run: `npm test -- src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts`
Expected: PASS

- [x] **Step 5: コミット**

```bash
git add src/features/non-brake-descent/presentation/hooks/use-reduced-motion.ts src/features/non-brake-descent/presentation/hooks/use-reduced-motion.test.ts
git commit -m "feat: NBD prefers-reduced-motion 監視フックを追加"
```

---

## Task 8: ニアミス bullet-time と reduced-motion 適用を配線

**Files:**
- Modify: `src/features/non-brake-descent/presentation/hooks/use-game-engine.ts`

ニアミス検出時にスローモーを発動する。すべての時間操作トリガーに reduced-motion 係数を適用する。

- [x] **Step 1: import と motionScale ref を追加**

`use-game-engine.ts` の Task 4 で追加した import 行を以下に差し替える。

```typescript
import { advanceClock, createGameClock, triggerHitstop, triggerSlowMo } from '../../application/game-loop/game-clock';
import { resolveMotionScale, scaleFrames } from '../../application/game-loop/motion-scale';
import { useReducedMotion } from './use-reduced-motion';
```

`const clockRef = useRef(createGameClock());`（Task 4 で追加）の直後に追加する。

```typescript
  const reducedMotion = useReducedMotion();
  const motionScaleRef = useRef(1);
  useEffect(() => {
    motionScaleRef.current = resolveMotionScale(reducedMotion);
  }, [reducedMotion]);
```

- [x] **Step 2: ヒットストップ呼び出しに係数を適用**

Task 4 で追加した2箇所を以下に変更する。

`onScore` 内:

```typescript
              clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.item, motionScaleRef.current));
```

`onEnemyKill` 内:

```typescript
              clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.enemyKill, motionScaleRef.current));
```

- [x] **Step 3: ニアミス bullet-time を配線**

ニアミス検出ブロック（528〜538行目付近）の末尾、`addScorePopup(ox, prev.ramp * RAMP_H - camY - 20, ` の行の直後に1行追加する。変更後のブロックは以下になる。

```typescript
          if (CollisionDomain.isDangerous(obstacle.t) && col.nearMiss && !passedObs.current.has(obsId)) {
            passedObs.current.add(obsId);
            Audio.play('nearMiss');
            setNearMissCount(current => current + 1);
            setScore(current => current + Config.score.nearMiss);
            setNearMissEffects(current => [
              ...current,
              EntityFactory.createNearMissEffect(ox, prev.ramp * RAMP_H - camY + 25),
            ]);
            addScorePopup(ox, prev.ramp * RAMP_H - camY - 20, `NEAR MISS +${Config.score.nearMiss}`, '#44ffaa');
            clockRef.current = triggerSlowMo(
              clockRef.current,
              scaleFrames(Config.juice.slowMo.nearMissFrames, motionScaleRef.current),
              Config.juice.slowMo.nearMissFactor,
            );
          }
```

- [x] **Step 4: 型チェックと回帰テスト**

Run: `npm run typecheck`
Expected: PASS

Run: `npm test -- src/features/non-brake-descent`
Expected: PASS

- [x] **Step 5: 手動動作確認**

Run: `npm start`
`/non-brake-descent` をプレイし、障害物のすぐ脇を高速ですり抜けて（ニアミス）、一瞬スローモーになることを確認。OS の「視差効果を減らす」を ON にすると時間操作が無効化されることも確認（任意）。確認後 `Ctrl+C`。

- [x] **Step 6: コミット**

```bash
git add src/features/non-brake-descent/presentation/hooks/use-game-engine.ts
git commit -m "feat: NBD ニアミス bullet-time と reduced-motion 対応を追加

- ニアミス時にスローモーを発動
- 全時間操作トリガーに reduced-motion 係数を適用"
```

---

## Task 9: 死亡時インパクトのヒットストップ（DYING アニメ凍結）

**Files:**
- Modify: `src/features/non-brake-descent/presentation/hooks/use-game-engine.ts`

死亡時、衝撃の一瞬を止める。死亡で PLAY ループは終了するため、PLAY ではなく DYING アニメーションループ側をクロックでゲートし、死亡フレーム進行を数フレーム凍結する。

- [x] **Step 1: handleDeath で死亡ヒットストップを発動**

`handleDeath`（260〜273行目付近）の本体末尾、`setState(GameState.DYING);` の**直前**に1行追加する。変更後の末尾は以下になる。

```typescript
      addParticles(player.x, player.ramp * RAMP_H - camY + 30, '#ff4444', rank === SpeedRank.HIGH ? 15 : 8);
      clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.death, motionScaleRef.current));
      setState(GameState.DYING);
```

注意: `handleDeath` の `useCallback` 依存配列には `clockRef`/`motionScaleRef` は ref のため追加不要（ESLint の exhaustive-deps は ref を要求しない）。

- [x] **Step 2: DYING アニメーションループにクロックゲートを追加**

死亡アニメーション `useEffect`（333〜351行目付近）の `const iv = window.setInterval(() => {` の直後、`setDeath(current => {` の**前**に以下を挿入する。

```typescript
      // 死亡時ヒットストップ: 衝撃の一瞬を止める（死亡フレーム進行を凍結）
      const advance = advanceClock(clockRef.current);
      clockRef.current = advance.clock;
      if (!advance.shouldStepSim) {
        setShake(current => Math.max(0, current * Config.animation.shakeDecay));
        return;
      }
```

- [x] **Step 3: 型チェックと回帰テスト**

Run: `npm run typecheck`
Expected: PASS

Run: `npm test -- src/features/non-brake-descent`
Expected: PASS

- [x] **Step 4: 手動動作確認**

Run: `npm start`
`/non-brake-descent` をプレイし、障害物に激突した瞬間に一瞬画面が止まってから死亡アニメーションが始まることを確認。確認後 `Ctrl+C`。

- [x] **Step 5: コミット**

```bash
git add src/features/non-brake-descent/presentation/hooks/use-game-engine.ts
git commit -m "feat: NBD 死亡時インパクトのヒットストップを追加

- handleDeath で死亡ヒットストップを発動
- DYING アニメループをクロックでゲートし衝撃の一瞬を凍結"
```

---

## Task 10: Phase 1 の CI 全パス確認

**Files:** （変更なし・検証のみ）

- [x] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: PASS（lint:ci → typecheck → test → build が全て成功）

失敗時は修正し `fix:` でコミットしてから完了とする。

- [x] **Step 2: カバレッジ確認（任意）**

Run: `npm run test:coverage -- src/features/non-brake-descent/application/game-loop`
Expected: `game-clock.ts` / `motion-scale.ts` がともに 90% 以上。

---

## 後続フェーズ（別計画として作成）

本計画（P0+P1）完了後、以下を**それぞれ独立した計画**として作成・実行する。各々が単体で動作・テスト可能な単位:

- **P2: スピード感演出** — 速度線生成（純粋関数+TDD）、カメラ微ズーム、エッジビネット強化
- **P3: エフェクト拡充** — 着地土煙、ニアミス火花、高速トレイル残像（サンプリング純粋関数+TDD）、スクワッシュ&ストレッチ、粒子グロー
- **P4: サウンド強化** — 速度ランク連動BGM（プロファイル選択純粋関数+TDD）、コンボ段階音階、SFX追加
- **P5: グラフィック質感** — CSS光/影/グラデ、コンボティント、背景パララックス強化

これらは P0+P1 で導入した `GameClock` / `motion-scale` / `useReducedMotion` を基盤として利用する。

---

## 自己レビュー結果

- **spec カバレッジ**: spec §2（GameClock）→ Task 2,3。§2.2 配線 → Task 4。§2.3 トリガー表（敵撃破/死亡/ニアミス/アイテム）→ Task 4,8,9。§3.1 → 全体。§5 テスト方針 → 各 Task の TDD ステップ + Task 5,10 CI。§6 アクセシビリティ → Task 6,7,8。§3.2〜3.5・§7 の P2〜P5 → 「後続フェーズ」で別計画化（本計画スコープ外を明示）。
- **プレースホルダ**: なし（全ステップに実コード・実コマンド・期待結果を記載）。
- **型整合性**: `GameClock` / `AdvanceResult` のプロパティ名（`hitstopFrames`/`slowMoFrames`/`slowMoFactor`/`tickCounter`/`shouldStepSim`）は全 Task で一貫。`triggerHitstop`/`triggerSlowMo`/`advanceClock`/`createGameClock`/`resolveMotionScale`/`scaleFrames`/`useReducedMotion` のシグネチャは定義と使用箇所で一致。`Config.juice.hitstop.{enemyKill,item,death}` / `Config.juice.slowMo.{nearMissFrames,nearMissFactor}` は Task 1 の定義と使用箇所で一致。
