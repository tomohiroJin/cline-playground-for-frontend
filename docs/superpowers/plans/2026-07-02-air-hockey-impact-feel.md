# Air Hockey 打撃感の階調化＋モバイル触覚 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** パックを打った瞬間のフィードバック（screen shake / hitStop / 衝撃波 / モバイル触覚）を、打撃の強さに応じて連続的にスケールさせ、Canvas ループでも reduced-motion に対応する。

**Architecture:** 「打撃の強さ → 反応量」の計算を純粋関数 `core/impact.ts` に隔離し、触覚を `core/haptics.ts` の feature-detection ラッパに分離する。`useGameLoop` の衝突処理はこれらを呼ぶだけの薄い配線にし、reduced-motion 時は `computeImpact` を呼ばず（＝反応 null）視覚・触覚を抑制、サウンドのみ残す。

**Tech Stack:** TypeScript + React 19 / Jest 30 (+ SWC) / 既存 `utils/math-utils`（`clamp`, `lerp`, `magnitude`）

## Global Constraints

- `any` 型禁止（`unknown` + 型ガードを使用）
- `null` より `undefined` を優先（外部 API 境界を除く。本計画では「反応なし」を表す戻り値のみ `null` を許容）
- 名前付きエクスポートを優先
- マジックナンバーは名前付き定数に置換
- コメント・docstring は日本語
- テストファイルは対象と同ディレクトリに `*.test.ts` で配置
- コミットは Conventional Commits（`feat:` / `refactor:` / `test:` 等）、末尾に `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- ブランチ: `feature/air-hockey-impact-feel`（作成済み）
- テスト実行ディレクトリはリポジトリルート `/workspaces/claym/local/cline-playground-for-frontend-wip01`

---

## File Structure

- `src/features/air-hockey/core/haptics.ts`（新規）— `navigator.vibrate` の feature-detection ラッパ。外部依存なし。
- `src/features/air-hockey/core/haptics.test.ts`（新規）— 上記の単体テスト。
- `src/features/air-hockey/core/impact.ts`（新規）— `ImpactResponse` 型と `computeImpact` 純粋関数。打撃速度→反応量。
- `src/features/air-hockey/core/impact.test.ts`（新規）— 上記の単体テスト。
- `src/features/air-hockey/presentation/hooks/useGameLoop.ts`（変更）— 二値の打撃フィードバックを `computeImpact` ベースへ置換。`GameLoopConfig` に `reducedMotion` 追加。旧定数削除。
- `src/features/air-hockey/presentation/AirHockeyGame.tsx`（変更）— `useReducedMotion()` の結果を `config.reducedMotion` に供給。

---

## Task 1: モバイル触覚ラッパ `core/haptics.ts`

**Files:**
- Create: `src/features/air-hockey/core/haptics.ts`
- Test: `src/features/air-hockey/core/haptics.test.ts`

**Interfaces:**
- Consumes: なし（`navigator` グローバルのみ）
- Produces: `export const vibrate = (ms: number): void`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/air-hockey/core/haptics.test.ts`:

```ts
/**
 * モバイル触覚ラッパのテスト
 * - jsdom 既定では navigator.vibrate は未定義のため、必要な場合のみ注入する
 */
import { vibrate } from './haptics';

describe('vibrate', () => {
  const setVibrate = (fn: ((pattern: number | number[]) => boolean) | undefined) => {
    Object.defineProperty(window.navigator, 'vibrate', {
      value: fn,
      configurable: true,
      writable: true,
    });
  };

  afterEach(() => {
    // 後続テストへ影響しないよう削除
    setVibrate(undefined);
  });

  it('対応環境では指定 ms で navigator.vibrate を呼ぶ', () => {
    const spy = jest.fn(() => true);
    setVibrate(spy);
    vibrate(20);
    expect(spy).toHaveBeenCalledWith(20);
  });

  it('ms が 0 以下なら navigator.vibrate を呼ばない', () => {
    const spy = jest.fn(() => true);
    setVibrate(spy);
    vibrate(0);
    vibrate(-5);
    expect(spy).not.toHaveBeenCalled();
  });

  it('navigator.vibrate 未対応環境でも例外を投げない', () => {
    setVibrate(undefined);
    expect(() => vibrate(20)).not.toThrow();
  });

  it('navigator.vibrate が例外を投げても握りつぶす', () => {
    setVibrate(() => {
      throw new Error('not allowed');
    });
    expect(() => vibrate(20)).not.toThrow();
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/air-hockey/core/haptics.test.ts`
Expected: FAIL（`Cannot find module './haptics'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/air-hockey/core/haptics.ts`:

```ts
/**
 * モバイル触覚フィードバック。
 * 非対応環境（navigator.vibrate 未実装 / SSR）では無害にスキップする。
 * reduced-motion 連動での抑制は呼び出し側で行い、本関数は純粋なラッパに保つ。
 */
export const vibrate = (ms: number): void => {
  if (ms <= 0) return;
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(ms);
  } catch {
    // 一部環境（ユーザー操作外・権限拒否）で例外となるため握りつぶす。
    // 触覚は機能低下のみで致命的でないため無視して継続する。
  }
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/air-hockey/core/haptics.test.ts`
Expected: PASS（4 tests）

- [ ] **Step 5: コミット**

```bash
git add src/features/air-hockey/core/haptics.ts src/features/air-hockey/core/haptics.test.ts
git commit -m "feat: Air Hockey モバイル触覚ラッパ vibrate を追加

- navigator.vibrate の feature-detection ラッパ
- 非対応環境・例外を無害にスキップ

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 打撃反応の純粋関数 `core/impact.ts`

**Files:**
- Create: `src/features/air-hockey/core/impact.ts`
- Test: `src/features/air-hockey/core/impact.test.ts`

**Interfaces:**
- Consumes: `clamp`, `lerp`（`../../../utils/math-utils`）
- Produces:
  - `export type ImpactResponse = { shakeIntensity: number; shakeDuration: number; hitStopFrames: number; shockwaveMaxRadius: number; vibrationMs: number }`
  - `export const computeImpact = (hitSpeed: number): ImpactResponse | null`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/air-hockey/core/impact.test.ts`:

```ts
/**
 * 打撃反応（階調化）の純粋関数テスト
 */
import { computeImpact } from './impact';

describe('computeImpact', () => {
  it('下限速度未満なら null を返す（軽打では反応なし）', () => {
    expect(computeImpact(0)).toBeNull();
    expect(computeImpact(3.9)).toBeNull();
  });

  it('下限速度以上なら反応オブジェクトを返す', () => {
    const r = computeImpact(4);
    expect(r).not.toBeNull();
  });

  it('速度が上がるほど各反応量が単調非減少になる', () => {
    const mid = computeImpact(8);
    const high = computeImpact(14);
    expect(mid).not.toBeNull();
    expect(high).not.toBeNull();
    if (!mid || !high) return;
    expect(high.shakeIntensity).toBeGreaterThanOrEqual(mid.shakeIntensity);
    expect(high.shakeDuration).toBeGreaterThanOrEqual(mid.shakeDuration);
    expect(high.hitStopFrames).toBeGreaterThanOrEqual(mid.hitStopFrames);
    expect(high.shockwaveMaxRadius).toBeGreaterThanOrEqual(mid.shockwaveMaxRadius);
    expect(high.vibrationMs).toBeGreaterThanOrEqual(mid.vibrationMs);
  });

  it('最大速度を超えても値がクランプされる（頭打ち）', () => {
    const atMax = computeImpact(16);
    const beyond = computeImpact(100);
    expect(atMax).not.toBeNull();
    expect(beyond).not.toBeNull();
    if (!atMax || !beyond) return;
    expect(beyond.shakeIntensity).toBeCloseTo(atMax.shakeIntensity);
    expect(beyond.shockwaveMaxRadius).toBeCloseTo(atMax.shockwaveMaxRadius);
  });

  it('低速の打撃では hitStop フレームが 0 になる', () => {
    const low = computeImpact(4);
    expect(low).not.toBeNull();
    if (!low) return;
    expect(low.hitStopFrames).toBe(0);
  });

  it('強打では hitStop フレームが 1 以上になる', () => {
    const strong = computeImpact(16);
    expect(strong).not.toBeNull();
    if (!strong) return;
    expect(strong.hitStopFrames).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/air-hockey/core/impact.test.ts`
Expected: FAIL（`Cannot find module './impact'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/air-hockey/core/impact.ts`:

```ts
import { clamp, lerp } from '../../../utils/math-utils';

/** 打撃の強さに応じた反応量（値オブジェクト） */
export type ImpactResponse = {
  /** shake 強度（px 相当） */
  shakeIntensity: number;
  /** shake 持続時間（ms） */
  shakeDuration: number;
  /** hitStop フレーム数（0 なら hitStop なし） */
  hitStopFrames: number;
  /** 衝撃波の最大半径（px） */
  shockwaveMaxRadius: number;
  /** モバイル振動時間（ms） */
  vibrationMs: number;
};

/** これ未満の打撃速度では反応を発火しない（従来の軽打挙動を維持） */
const IMPACT_MIN_SPEED = 4;
/** これ以上の打撃速度では反応量が頭打ちになる（PHYSICS.MAX_POWER 相当） */
const IMPACT_MAX_SPEED = 16;

// 反応量の下限〜上限（下限 = IMPACT_MIN_SPEED 時、上限 = IMPACT_MAX_SPEED 時）
const SHAKE_INTENSITY_RANGE = { min: 2, max: 9 } as const;
const SHAKE_DURATION_RANGE = { min: 120, max: 220 } as const;
const HIT_STOP_FRAMES_RANGE = { min: 0, max: 4 } as const;
const SHOCKWAVE_RADIUS_RANGE = { min: 40, max: 110 } as const;
const VIBRATION_MS_RANGE = { min: 8, max: 40 } as const;

/**
 * 打撃速度から反応量を算出する純粋関数。
 * @param hitSpeed 衝突後のパック速度の大きさ（magnitude）
 * @returns 下限未満なら null（＝反応なし）。それ以外は連続スケールした反応量。
 */
export const computeImpact = (hitSpeed: number): ImpactResponse | null => {
  if (hitSpeed < IMPACT_MIN_SPEED) return null;

  // 下限〜上限を [0, 1] に正規化した補間係数
  const t = clamp(
    (hitSpeed - IMPACT_MIN_SPEED) / (IMPACT_MAX_SPEED - IMPACT_MIN_SPEED),
    0,
    1
  );

  return {
    shakeIntensity: lerp(SHAKE_INTENSITY_RANGE.min, SHAKE_INTENSITY_RANGE.max, t),
    shakeDuration: lerp(SHAKE_DURATION_RANGE.min, SHAKE_DURATION_RANGE.max, t),
    hitStopFrames: Math.round(lerp(HIT_STOP_FRAMES_RANGE.min, HIT_STOP_FRAMES_RANGE.max, t)),
    shockwaveMaxRadius: lerp(SHOCKWAVE_RADIUS_RANGE.min, SHOCKWAVE_RADIUS_RANGE.max, t),
    vibrationMs: Math.round(lerp(VIBRATION_MS_RANGE.min, VIBRATION_MS_RANGE.max, t)),
  };
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/air-hockey/core/impact.test.ts`
Expected: PASS（6 tests）

> 補足: `computeImpact(4)` は `t = 0` なので `hitStopFrames = round(lerp(0,4,0)) = 0`（低速テストを満たす）。`computeImpact(16)` は `t = 1` なので `hitStopFrames = 4`（強打テストを満たす）。

- [ ] **Step 5: コミット**

```bash
git add src/features/air-hockey/core/impact.ts src/features/air-hockey/core/impact.test.ts
git commit -m "feat: Air Hockey 打撃反応の階調化 純粋関数 computeImpact を追加

- 打撃速度→反応量（shake/hitStop/衝撃波/振動）を連続スケール
- 下限未満は null で従来の軽打挙動を維持

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `useGameLoop` へ配線し二値判定を置換

**Files:**
- Modify: `src/features/air-hockey/presentation/hooks/useGameLoop.ts`
  - シェイク定数ブロック（`57-60` 付近: `HIT_SHAKE_INTENSITY`, `HIT_SHAKE_DURATION`, `STRONG_HIT_SPEED_THRESHOLD`）
  - `GameLoopConfig` 型（`63-88` 付近）
  - `processCollisions` の打撃フィードバックブロック（`313-324` 付近）
  - import 行（`36-37` 付近の型 import 近辺、`magnitude` は既存）

**Interfaces:**
- Consumes: `computeImpact`（Task 2）, `vibrate`（Task 1）
- Produces: `GameLoopConfig.reducedMotion?: boolean`（Task 4 が供給）

- [ ] **Step 1: import を追加**

`useGameLoop.ts` の import 群（`core/keyboard` を import している `41` 行目の直後あたり）に追加:

```ts
import { computeImpact } from '../../core/impact';
import { vibrate } from '../../core/haptics';
```

- [ ] **Step 2: 不要になる旧定数を削除**

`useGameLoop.ts` のシェイク定数ブロックから以下 3 行を削除する（`GOAL_SHAKE_*` は残す）:

```ts
const HIT_SHAKE_INTENSITY = 3;
const HIT_SHAKE_DURATION = 150;
const STRONG_HIT_SPEED_THRESHOLD = 8;
```

削除後、ブロックは以下になる:

```ts
// シェイク定数
const GOAL_SHAKE_INTENSITY = 8;
const GOAL_SHAKE_DURATION = 300;
```

- [ ] **Step 3: `GameLoopConfig` に `reducedMotion` を追加**

`GameLoopConfig` 型の末尾フィールド（`enemy2ControlType?: 'cpu' | 'human';` の直後）に追加:

```ts
  /** reduced-motion 有効時は打撃時の shake / hitStop / 振動を抑制する（サウンドは残す） */
  reducedMotion?: boolean;
```

- [ ] **Step 4: ゲームループ本体で reducedMotion を確定**

`processCollisions` を含むエフェクト関数スコープの先頭付近（`triggerShake` ヘルパー定義の直前、`222` 行目 `const obstacles = field.obstacles;` の直後）に追加:

```ts
    // reduced-motion 時は打撃の強い動き（shake / hitStop / 振動）を抑制する
    const reducedMotion = config.reducedMotion ?? false;
```

> 注: `config` はこのスコープで参照可能（既存コードが `config.*` を随所で参照している）。参照できない場合は `params.config` から辿る。

- [ ] **Step 5: 打撃フィードバックブロックを置換**

`processCollisions` 内の以下のブロック:

```ts
          if (isPuck && speed > STRONG_HIT_SPEED_THRESHOLD) {
            triggerShake(HIT_SHAKE_INTENSITY, HIT_SHAKE_DURATION);
            const postSpeed = magnitude(obj.vx, obj.vy);
            if (postSpeed > STRONG_HIT_SPEED_THRESHOLD && !hitStop.active) {
              hitStop.active = true;
              hitStop.framesRemaining = 3;
              hitStop.impactX = obj.x;
              hitStop.impactY = obj.y;
              hitStop.shockwaveRadius = 0;
              hitStop.shockwaveMaxRadius = 80;
            }
          }
```

を、以下へ置換する:

```ts
          // 打撃フィードバックの階調化（US 打撃感）
          // reduced-motion 時は反応を発火しない（サウンドは上流で再生済み）
          if (isPuck) {
            const postSpeed = magnitude(obj.vx, obj.vy);
            const impact = reducedMotion ? null : computeImpact(postSpeed);
            if (impact) {
              triggerShake(impact.shakeIntensity, impact.shakeDuration);
              if (impact.hitStopFrames > 0 && !hitStop.active) {
                hitStop.active = true;
                hitStop.framesRemaining = impact.hitStopFrames;
                hitStop.impactX = obj.x;
                hitStop.impactY = obj.y;
                hitStop.shockwaveRadius = 0;
                hitStop.shockwaveMaxRadius = impact.shockwaveMaxRadius;
              }
              vibrate(impact.vibrationMs);
            }
          }
```

- [ ] **Step 6: 型チェックを実行**

Run: `npm run typecheck`
Expected: エラーなし（`speed` は `sound.hit(speed)` でまだ使用されているため未使用警告は出ない。旧定数削除による参照エラーがないこと）

- [ ] **Step 7: 既存テスト回帰を確認**

Run: `npx jest src/features/air-hockey`
Expected: PASS（既存の全 air-hockey テストが緑。`useGameLoop` はドメイン層 `GameRunner` 経由のテスト対象外だが、型・import 変更が他テストを壊さないことを確認）

- [ ] **Step 8: コミット**

```bash
git add src/features/air-hockey/presentation/hooks/useGameLoop.ts
git commit -m "refactor: Air Hockey 打撃フィードバックを computeImpact ベースへ置換

- 二値判定（speed>8 固定強度）を速度連動の階調化へ変更
- reduced-motion 時は shake/hitStop/振動を抑制（サウンドは残す）
- モバイル触覚 vibrate を発火
- 旧定数 HIT_SHAKE_INTENSITY/DURATION/STRONG_HIT_SPEED_THRESHOLD を削除

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `AirHockeyGame` から `reducedMotion` を供給

**Files:**
- Modify: `src/features/air-hockey/presentation/AirHockeyGame.tsx`
  - import 群
  - コンポーネント本体（フック呼び出し箇所）
  - `useGameLoop({ ... config: { ... } })` の config オブジェクト（`268-280` 付近）

**Interfaces:**
- Consumes: `useReducedMotion`（`../hooks/useReducedMotion`）, `GameLoopConfig.reducedMotion`（Task 3）
- Produces: なし（最終配線）

- [ ] **Step 1: import を追加**

`AirHockeyGame.tsx` の import 群（`33` 行目 `import { useGameLoop } from './hooks/useGameLoop';` の直後あたり）に追加:

```ts
import { useReducedMotion } from '../hooks/useReducedMotion';
```

> パス確認: `AirHockeyGame.tsx` は `presentation/` 配下、`useReducedMotion` は `air-hockey/hooks/` 配下のため `../hooks/useReducedMotion`。

- [ ] **Step 2: フックを呼び出す**

コンポーネント本体の他フック呼び出しと同じ並び（`useGameLoop({...})` 呼び出しより前、`266` 行目より上）に追加:

```ts
  const prefersReducedMotion = useReducedMotion();
```

- [ ] **Step 3: config に `reducedMotion` を渡す**

`useGameLoop` の `config` オブジェクト内、`enemy2ControlType:` の行の直後に追加:

```ts
      reducedMotion: prefersReducedMotion,
```

- [ ] **Step 4: 型チェック・lint を実行**

Run: `npm run typecheck && npm run lint:ci`
Expected: エラー・警告なし（`prefersReducedMotion` が使用され未使用警告が出ないこと）

- [ ] **Step 5: 既存テスト回帰を確認**

Run: `npx jest src/features/air-hockey`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/air-hockey/presentation/AirHockeyGame.tsx
git commit -m "feat: Air Hockey で reduced-motion を打撃演出に連動

- useReducedMotion の値を useGameLoop の config.reducedMotion へ供給

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 全体検証と手動確認・ドキュメント更新

**Files:**
- Modify: `src/features/air-hockey/README.md`（演出関連の記述更新）

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: `lint:ci` → `typecheck` → `test` → `build` がすべて緑

- [ ] **Step 2: 手動確認（実機的検証）**

Run: `npm start` で開発サーバーを起動し、Air Hockey をプレイして以下を目視確認:
- 弱く当てた時と強く弾いた時で shake の強さ・hitStop の効き・衝撃波の大きさに**差が出る**こと
- OS の「視差効果を減らす / アニメーション低減」を有効化すると打撃時の shake / hitStop が止まり、サウンドは鳴ること
- （モバイル実機がある場合）強打時に振動が発生し、強さに差が出ること

Expected: 上記のいずれも期待どおり。差異があれば `core/impact.ts` の各 `*_RANGE` 定数を調整して再確認。

- [ ] **Step 3: README を更新**

`src/features/air-hockey/README.md` の演出/既知の問題に該当箇所があれば、「打撃フィードバックの階調化（`core/impact.ts`）・モバイル触覚（`core/haptics.ts`）・Canvas ループの reduced-motion 対応」を反映する追記を行う。既存の該当節が無ければ「開発進捗」表に 1 行追加する:

```markdown
| 打撃感 | 打撃フィードバックの階調化 + モバイル触覚 + reduced-motion 対応 | ✅ 完了 |
```

- [ ] **Step 4: コミット**

```bash
git add src/features/air-hockey/README.md
git commit -m "docs: Air Hockey 打撃感の階調化・触覚・reduced-motion 対応を README へ反映

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完了の定義（Definition of Done）

- [ ] `core/impact.ts` / `core/haptics.ts` が実装され、単体テストが通る（Task 1, 2）
- [ ] `useGameLoop` の打撃フィードバックが `computeImpact` ベースへ置換され、旧定数が削除されている（Task 3）
- [ ] `AirHockeyGame.tsx` が `reducedMotion` を供給（Task 4）
- [ ] `npm run ci` がグリーン（Task 5）
- [ ] 手動確認で階調化・reduced-motion・触覚が期待どおり（Task 5）
- [ ] 既存の演出（trail / combo / fever / goal shake）が回帰していない
- [ ] README 更新済み
