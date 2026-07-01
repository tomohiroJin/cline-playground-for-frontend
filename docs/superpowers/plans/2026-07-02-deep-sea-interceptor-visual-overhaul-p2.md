# Deep Sea Interceptor ビジュアル刷新 Phase 2 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通常敵4種（basic/fast/shooter/tank）を見た目と挙動の両面で個性化し、没個性を解消する（型ごとの固有シルエット・型決定の動き・危険度表示・shooter の発射予兆）。

**Architecture:** 型ごとの見た目・挙動メタデータを新規 `enemy-visual.ts` に一元化（`EnemyVisual` テーブル）。描画（`EnemySprite`）・挙動（`getMovementStrategy`）・危険度表示・予兆が同一テーブルを参照（DRY）。動きは spawn 時ランダムの `movementPattern` から**型決定**へ移行し、テストを安定化。Phase 1 の `neonGlow` / `ColorPalette` を再利用。

**Tech Stack:** React 19, TypeScript, styled-components, Jest 30 + @testing-library/react, jsdom。

## Global Constraints

- 対象ディレクトリ: `src/features/deep-sea-interceptor/`。他 Feature を参照しない。
- `any` 型禁止（`unknown` + 型ガード）。`var` 禁止・`const` 優先。マジックナンバーは名前付き定数化。
- コメント/ドキュメントは日本語。命名: 変数/関数 camelCase、型/コンポーネント PascalCase、ファイル kebab-case（コンポーネントは PascalCase.tsx）。
- `EnemyConfig` の数値バランス（HP・速度・点数・fireRate・sizeRatio）と `EnemyType` 定義は変更しない。見た目と動きの割り当てのみ変更する。
- ボス・ミッドボス・機雷（mine）の既存 SVG 描画と挙動は変更しない。対象は通常敵4種（basic/fast/shooter/tank）のみ。
- 発光は Phase 1 の `neonGlow(color, intensity?)`（`./visuals`）を使う。新規の box-shadow ハードコードを増やさない。
- テストは振る舞いベース。SVG スプライトは role/text を持たないため、スモークテストの識別に `data-testid` を用いてよい（最終手段として許容）。
- Conventional Commits。`main` 直コミット禁止・作業ブランチ `feature/dsi-visual-overhaul-p2`。
- 検証: `npx jest src/features/deep-sea-interceptor` / 型: `npm run typecheck`。

---

## ファイル構成

**新規作成:**
- `src/features/deep-sea-interceptor/enemy-visual.ts` — 通常敵4種の見た目・挙動メタデータ（`EnemyVisual` テーブル）、型・型ガード・アクセサ、発射予兆判定 `isEnemyTelegraphing`。
- `src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts` — 上記の純粋ロジックのユニットテスト。

**修正:**
- `src/features/deep-sea-interceptor/movement.ts` — `weave`（速い蛇行）移動戦略を追加。
- `src/features/deep-sea-interceptor/__tests__/movement.test.ts` — `weave` のテストを追加。
- `src/features/deep-sea-interceptor/game-logic.ts:242-255` — `getMovementStrategy` を型決定ベースに変更（`EnemyVisual.movement` を参照、未定義型は従来の pattern フォールバック）。
- `src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts:76-98` — `getMovementStrategy` の型ベース期待に更新。
- `src/features/deep-sea-interceptor/components/EnemySprite.tsx` — 通常敵4種の汎用フォールバック描画を、型別シルエット（クラゲ/ダーツ/アンコウ/甲殻）＋ネオン発光＋危険度＋shooter 予兆に置換。
- `src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`（新規）— 型別描画と予兆のスモークテスト。

---

## 型別の設計（この Phase の中心的な決定）

| 型 | シルエット (`silhouette`) | ネオン基調色 (`glowColor`) | 危険度 (`danger`) | 動き (`movement`) |
|---|---|---|---|---|
| basic | `jellyfish`（クラゲ: ドーム＋触手） | `#3fe0d0`（シアン） | `low` | `drift`（ゆっくり中央へ漂う） |
| fast | `dart`（矢尻型の深海ダーツ） | `#6a7bff`（青紫） | `mid` | `weave`（速い蛇行・新規） |
| shooter | `angler`（提灯アンコウ＋発光ルアー） | `#ff4fa0`（マゼンタ） | `high` | `sine`（ホバリング蛇行） |
| tank | `shell`（甲殻ユニット） | `#ffab3d`（琥珀） | `mid` | `straight`（重い直進） |

- 動きは既存 `MovementStrategies`（straight/sine/drift）＋新規 `weave` の4種を型に固定割り当て。`movementPattern`（ランダム）依存を廃し決定的にする。
- `danger === 'high'` の敵にはパルスする危険リングを重ねる（種別・危険度の即時判別）。
- shooter は発射クールダウンの残り時間から予兆（ルアー発光）を出す（`isEnemyTelegraphing`）。

---

## Task 1: 見た目・挙動メタデータ `enemy-visual.ts`

**Files:**
- Create: `src/features/deep-sea-interceptor/enemy-visual.ts`
- Test: `src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`

**Interfaces:**
- Consumes: `EnemyType`（`./types`）。
- Produces:
  - `type RegularEnemyType = 'basic' | 'fast' | 'shooter' | 'tank'`
  - `type EnemySilhouette = 'jellyfish' | 'dart' | 'angler' | 'shell'`
  - `type DangerLevel = 'low' | 'mid' | 'high'`
  - `type EnemyMovementKey = 'straight' | 'sine' | 'drift' | 'weave'`
  - `interface EnemyVisualDef { silhouette: EnemySilhouette; glowColor: string; danger: DangerLevel; movement: EnemyMovementKey }`
  - `EnemyVisual: Record<RegularEnemyType, EnemyVisualDef>`
  - `isRegularEnemyType(type: EnemyType | string): type is RegularEnemyType`
  - `getEnemyVisual(type: EnemyType | string): EnemyVisualDef | undefined`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`:

```ts
import {
  EnemyVisual,
  isRegularEnemyType,
  getEnemyVisual,
  type RegularEnemyType,
} from '../enemy-visual';

describe('enemy-visual', () => {
  const regulars: RegularEnemyType[] = ['basic', 'fast', 'shooter', 'tank'];

  describe('EnemyVisual テーブル', () => {
    test('通常敵4種すべてに定義がある', () => {
      regulars.forEach(t => expect(EnemyVisual[t]).toBeDefined());
    });

    test('各定義は silhouette/glowColor/danger/movement を持つ', () => {
      regulars.forEach(t => {
        const v = EnemyVisual[t];
        expect(v.silhouette).toBeTruthy();
        expect(v.glowColor).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(['low', 'mid', 'high']).toContain(v.danger);
        expect(['straight', 'sine', 'drift', 'weave']).toContain(v.movement);
      });
    });

    test('4種のシルエットは互いに異なる（没個性の解消）', () => {
      const silhouettes = regulars.map(t => EnemyVisual[t].silhouette);
      expect(new Set(silhouettes).size).toBe(4);
    });

    test('4種の動きは互いに異なる（挙動差別化）', () => {
      const movements = regulars.map(t => EnemyVisual[t].movement);
      expect(new Set(movements).size).toBe(4);
    });

    test('shooter は high 危険度（弾を撃つため）', () => {
      expect(EnemyVisual.shooter.danger).toBe('high');
    });
  });

  describe('isRegularEnemyType', () => {
    test('通常敵4種には true', () => {
      regulars.forEach(t => expect(isRegularEnemyType(t)).toBe(true));
    });
    test('ボス・機雷には false', () => {
      ['boss1', 'midboss1', 'mine', 'boss5'].forEach(t =>
        expect(isRegularEnemyType(t)).toBe(false)
      );
    });
  });

  describe('getEnemyVisual', () => {
    test('通常敵は定義を返す', () => {
      expect(getEnemyVisual('fast')?.silhouette).toBe('dart');
    });
    test('非通常敵は undefined', () => {
      expect(getEnemyVisual('boss1')).toBeUndefined();
      expect(getEnemyVisual('mine')).toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
Expected: FAIL（`Cannot find module '../enemy-visual'`）

- [ ] **Step 3: 最小実装を書く**

`src/features/deep-sea-interceptor/enemy-visual.ts`:

```ts
// ============================================================================
// Deep Sea Interceptor - 通常敵の見た目・挙動メタデータ
// 描画・移動・危険度表示・発射予兆が同一テーブルを参照する（DRY）。
// ============================================================================

import type { Enemy, EnemyType } from './types';

/** 見た目・挙動を一元管理する通常敵4種 */
export type RegularEnemyType = 'basic' | 'fast' | 'shooter' | 'tank';

/** シルエット種別（EnemySprite の描画分岐キー） */
export type EnemySilhouette = 'jellyfish' | 'dart' | 'angler' | 'shell';

/** 危険度（色・縁取り・リングで表現） */
export type DangerLevel = 'low' | 'mid' | 'high';

/** 動きパターンのキー（MovementStrategies に対応） */
export type EnemyMovementKey = 'straight' | 'sine' | 'drift' | 'weave';

/** 通常敵の見た目・挙動定義 */
export interface EnemyVisualDef {
  silhouette: EnemySilhouette;
  glowColor: string;
  danger: DangerLevel;
  movement: EnemyMovementKey;
}

/**
 * 通常敵4種の見た目・挙動テーブル。
 * ネオン基調色は Phase 1 の neonGlow に渡す前提で高彩度の発光色を選ぶ。
 */
export const EnemyVisual: Record<RegularEnemyType, EnemyVisualDef> = Object.freeze({
  // クラゲ: 低速で漂う、無害寄り
  basic: { silhouette: 'jellyfish', glowColor: '#3fe0d0', danger: 'low', movement: 'drift' },
  // 深海ダーツ: 素早い蛇行、鋭い形で速さを伝える
  fast: { silhouette: 'dart', glowColor: '#6a7bff', danger: 'mid', movement: 'weave' },
  // 提灯アンコウ: 自機を狙って撃つ。最も危険
  shooter: { silhouette: 'angler', glowColor: '#ff4fa0', danger: 'high', movement: 'sine' },
  // 甲殻ユニット: 重く直進、硬い
  tank: { silhouette: 'shell', glowColor: '#ffab3d', danger: 'mid', movement: 'straight' },
});

/** 通常敵4種かどうかの型ガード */
export const isRegularEnemyType = (type: EnemyType | string): type is RegularEnemyType =>
  type === 'basic' || type === 'fast' || type === 'shooter' || type === 'tank';

/** 型に対応する見た目定義を返す（非通常敵は undefined） */
export const getEnemyVisual = (type: EnemyType | string): EnemyVisualDef | undefined =>
  isRegularEnemyType(type) ? EnemyVisual[type] : undefined;

/** 発射予兆の先行時間（ms）— 発射の何ミリ秒前からルアーを光らせるか */
export const TELEGRAPH_LEAD_MS = 400;

/**
 * 敵が「まもなく発射する」予兆状態かを判定する（純粋関数）。
 * 発射可能かつ画面内で、クールダウン残りが先行時間を切ったら true。
 * EnemyConfig を参照して fireRate>0 の敵のみ対象にする。
 */
export const isEnemyTelegraphing = (enemy: Enemy, now: number): boolean => {
  if (!enemy.canShoot || enemy.fireRate <= 0 || enemy.y <= 0) return false;
  const elapsed = now - enemy.lastShotAt;
  return elapsed >= enemy.fireRate - TELEGRAPH_LEAD_MS;
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
Expected: PASS（`isEnemyTelegraphing` は Task 4 でテストするため、この時点では未テストでよい）

- [ ] **Step 5: 型チェックとコミット**

```bash
npm run typecheck
git add src/features/deep-sea-interceptor/enemy-visual.ts src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts
git commit -m "feat(deep-sea-interceptor): 通常敵の見た目・挙動メタデータ(EnemyVisual)を追加"
```

---

## Task 2: `weave` 移動戦略の追加

**Files:**
- Modify: `src/features/deep-sea-interceptor/movement.ts`
- Test: `src/features/deep-sea-interceptor/__tests__/movement.test.ts`

**Interfaces:**
- Consumes: `MovableEntity`（`./types`）。
- Produces: `MovementStrategies.weave` — `<T extends MovableEntity>(e: T) => T`。既存の `sine` より振幅が大きく周期が短い蛇行。

- [ ] **Step 1: 失敗するテストを追記**

`src/features/deep-sea-interceptor/__tests__/movement.test.ts` の末尾（最後の `});` の前の適切な位置、既存 describe と同階層）に追記:

```ts
describe('MovementStrategies.weave', () => {
  test('y は speed 分だけ下方向に進む', () => {
    const e = { x: 100, y: 200, speed: 4 };
    expect(MovementStrategies.weave(e).y).toBe(204);
  });

  test('x は y に応じた蛇行で変化する（振幅は sine より大きい）', () => {
    const base = { x: 100, y: 200, speed: 4 };
    const weaved = MovementStrategies.weave(base);
    const sined = MovementStrategies.sine(base);
    // weave の x 変位の大きさは sine の x 変位以上（同一入力で振幅が大きい）
    expect(Math.abs(weaved.x - base.x)).toBeGreaterThanOrEqual(Math.abs(sined.x - base.x));
  });

  test('元のオブジェクトを破壊しない（純粋）', () => {
    const e = { x: 100, y: 200, speed: 4 };
    MovementStrategies.weave(e);
    expect(e).toEqual({ x: 100, y: 200, speed: 4 });
  });
});
```

`movement.test.ts` の import に `MovementStrategies` が含まれていることを確認（既存で import 済みのはず。無ければ `import { MovementStrategies } from '../movement';` を追加）。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/movement.test.ts`
Expected: FAIL（`MovementStrategies.weave is not a function`）

- [ ] **Step 3: `weave` を実装**

`src/features/deep-sea-interceptor/movement.ts` の `MovementStrategies` オブジェクト内、`sine` の直後に追加:

```ts
  /** 蛇行移動（sine より大きい振幅・短い周期の速い蛇行） */
  weave: <T extends MovableEntity>(e: T): T => ({
    ...e,
    y: e.y + e.speed,
    x: e.x + Math.sin(e.y / 10) * 4,
  }),
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/movement.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/deep-sea-interceptor/movement.ts src/features/deep-sea-interceptor/__tests__/movement.test.ts
git commit -m "feat(deep-sea-interceptor): 速い蛇行移動 weave 戦略を追加"
```

---

## Task 3: `getMovementStrategy` を型決定ベースへ

**Files:**
- Modify: `src/features/deep-sea-interceptor/game-logic.ts:242-255`
- Test: `src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts:76-98`

**Interfaces:**
- Consumes: `getEnemyVisual`, `EnemyMovementKey`（`./enemy-visual`）、`MovementStrategies`（`./movement`）。
- Produces: `getMovementStrategy(enemyType, movementPattern)` — 通常敵4種は型固定の戦略を返す。ボス/ミッドボスは `boss`。それ以外（mine 等）は従来どおり `movementPattern` フォールバック。

- [ ] **Step 1: 既存テストを型ベース期待に更新（失敗させる）**

`src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts` の `describe('getMovementStrategy', ...)` ブロック（現在 76-98 行）の通常敵テスト3件（`通常敵パターン0/1/2`）を、以下の型ベーステストに置換する。ボス/ミッドボスの2テストはそのまま残す:

```ts
  test('basic は drift 戦略を返す', () => {
    expect(getMovementStrategy('basic', 0)).toBe(MovementStrategies.drift);
  });

  test('fast は weave 戦略を返す', () => {
    expect(getMovementStrategy('fast', 0)).toBe(MovementStrategies.weave);
  });

  test('shooter は sine 戦略を返す', () => {
    expect(getMovementStrategy('shooter', 0)).toBe(MovementStrategies.sine);
  });

  test('tank は straight 戦略を返す', () => {
    expect(getMovementStrategy('tank', 0)).toBe(MovementStrategies.straight);
  });

  test('通常敵の動きは movementPattern に依存しない（型で決定）', () => {
    expect(getMovementStrategy('basic', 0)).toBe(getMovementStrategy('basic', 2));
  });

  test('EnemyVisual 未定義の通常敵(mine)は movementPattern フォールバック', () => {
    expect(getMovementStrategy('mine', 1)).toBe(MovementStrategies.sine);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts -t getMovementStrategy`
Expected: FAIL（`fast` が `weave` を返さない等。現状は pattern ベースのため）

- [ ] **Step 3: `getMovementStrategy` を型決定ベースに書き換える**

`src/features/deep-sea-interceptor/game-logic.ts` の import 群に追加（既存の `MovementStrategies` import の近く）:

```ts
import { getEnemyVisual, type EnemyMovementKey } from './enemy-visual';
```

`getMovementStrategy`（242-255 行）を以下に置換:

```ts
/** 動きキー → 移動戦略の対応表 */
const MOVEMENT_BY_KEY: Record<EnemyMovementKey, EnemyMoveFn> = {
  straight: MovementStrategies.straight,
  sine: MovementStrategies.sine,
  drift: MovementStrategies.drift,
  weave: MovementStrategies.weave,
};

/** 2-3: 敵タイプと移動パターンから移動戦略を取得（通常敵は型で決定） */
export function getMovementStrategy(
  enemyType: EnemyType | string,
  movementPattern: number
): EnemyMoveFn {
  if (enemyType === 'boss' || enemyType.startsWith('boss') || enemyType.startsWith('midboss')) {
    return MovementStrategies.boss;
  }
  // 通常敵4種は EnemyVisual の型別割り当てを使う（movementPattern 非依存で決定的）
  const visual = getEnemyVisual(enemyType);
  if (visual) {
    return MOVEMENT_BY_KEY[visual.movement];
  }
  // EnemyVisual 未定義（mine 等）は従来の pattern フォールバック
  const strategies: readonly EnemyMoveFn[] = [
    MovementStrategies.straight,
    MovementStrategies.sine,
    MovementStrategies.drift,
  ];
  return strategies[movementPattern] ?? MovementStrategies.straight;
}
```

（`EnemyMoveFn` は既存で game-logic.ts に定義/import 済み。無い場合は既存の型定義箇所を確認して流用すること。）

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts -t getMovementStrategy`
Expected: PASS

- [ ] **Step 5: feature 全体テストと型チェック（回帰確認）**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（既存の game-logic / enemy-ai / movement テストも緑。動きが決定的になったことで乱数依存の不安定さが解消）

- [ ] **Step 6: コミット**

```bash
git add src/features/deep-sea-interceptor/game-logic.ts \
        src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts
git commit -m "refactor(deep-sea-interceptor): 通常敵の移動をランダムから型決定へ変更"
```

---

## Task 4: 発射予兆判定 `isEnemyTelegraphing` のテスト

**Files:**
- Modify: `src/features/deep-sea-interceptor/enemy-visual.ts`（Task 1 で実装済みの `isEnemyTelegraphing` を確定）
- Test: `src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`（追記）

**Interfaces:**
- Consumes: `isEnemyTelegraphing`, `TELEGRAPH_LEAD_MS`（`./enemy-visual`）、`EntityFactory`（`./entities`）。
- Produces: なし（既存関数のテスト固め）。

- [ ] **Step 1: 失敗するテストを追記**

`enemy-visual.test.ts` の import に追加:

```ts
import { isEnemyTelegraphing, TELEGRAPH_LEAD_MS } from '../enemy-visual';
import { EntityFactory } from '../entities';
```

（Task 1 で作った import 行に統合し、重複 import を作らないこと。）

末尾に describe を追記:

```ts
describe('isEnemyTelegraphing', () => {
  // shooter は canShoot=true, fireRate=2000。y>0 の位置に配置する。
  const makeShooter = (lastShotAt: number, y = 100) => {
    const e = EntityFactory.enemy('shooter', 400, y);
    e.lastShotAt = lastShotAt;
    return e;
  };

  test('発射直後（クールダウン開始直後）は予兆なし', () => {
    const now = 10000;
    const e = makeShooter(now); // elapsed 0
    expect(isEnemyTelegraphing(e, now)).toBe(false);
  });

  test('クールダウン残りが先行時間を切ると予兆あり', () => {
    const now = 10000;
    // elapsed = fireRate - TELEGRAPH_LEAD_MS ちょうどで境界成立
    const e = makeShooter(now - (2000 - TELEGRAPH_LEAD_MS));
    expect(isEnemyTelegraphing(e, now)).toBe(true);
  });

  test('撃たない敵（basic, canShoot=false）は常に予兆なし', () => {
    const e = EntityFactory.enemy('basic', 400, 100);
    e.lastShotAt = 0;
    expect(isEnemyTelegraphing(e, 999999)).toBe(false);
  });

  test('画面外（y<=0）は予兆なし', () => {
    const now = 10000;
    const e = makeShooter(now - 2000, 0); // 十分経過だが y=0
    expect(isEnemyTelegraphing(e, now)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗 or 成功を確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
Expected: Task 1 の実装が正しければ PASS。もし `isEnemyTelegraphing` を Task 1 で削っていた場合は実装を戻して PASS させる。

Note: `EntityFactory.enemy('shooter', x, y)` は `canShoot: true, fireRate: 2000`（`EnemyConfig.shooter`）で生成される。`y` 引数で画面内/外を制御する。

- [ ] **Step 3: 型チェックとコミット**

```bash
npm run typecheck
git add src/features/deep-sea-interceptor/enemy-visual.ts \
        src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts
git commit -m "test(deep-sea-interceptor): 発射予兆判定 isEnemyTelegraphing のテストを追加"
```

---

## Task 5: `EnemySprite` の通常敵4種を型別シルエット＋予兆に刷新

**Files:**
- Modify: `src/features/deep-sea-interceptor/components/EnemySprite.tsx`
- Test: `src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`（新規）

**Interfaces:**
- Consumes: `getEnemyVisual`, `isEnemyTelegraphing`, `EnemySilhouette`（`../enemy-visual`）、`neonGlow`（`../visuals`）、`Enemy`（`../types`）。
- Produces: `EnemySprite`（既存 default export・props `{ enemy: Enemy }` 不変）。通常敵4種を型別シルエットで描画。ボス/ミッドボス/機雷の分岐は変更しない。

- [ ] **Step 1: 失敗するスモークテストを書く**

`src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import EnemySprite from '../EnemySprite';
import { EntityFactory } from '../../entities';
import { EnemyVisual } from '../../enemy-visual';

describe('EnemySprite（通常敵の型別描画）', () => {
  const regulars = ['basic', 'fast', 'shooter', 'tank'] as const;

  test('通常敵4種すべてが例外なく描画され、型別 data-testid を持つ', () => {
    regulars.forEach(type => {
      const enemy = EntityFactory.enemy(type, 200, 200);
      const { container, getByTestId } = render(<EnemySprite enemy={enemy} />);
      expect(getByTestId(`enemy-silhouette-${EnemyVisual[type].silhouette}`)).toBeInTheDocument();
      expect(container.firstChild).not.toBeNull();
    });
  });

  test('shooter は発射予兆時にルアー発光要素を表示する', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    // 発射直前になるよう lastShotAt を過去に設定（fireRate 2000, LEAD 400 → 1600ms 経過で予兆）
    shooter.lastShotAt = Date.now() - 1700;
    const { getByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(getByTestId('enemy-telegraph')).toBeInTheDocument();
  });

  test('shooter は発射直後には予兆要素を表示しない', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    shooter.lastShotAt = Date.now();
    const { queryByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(queryByTestId('enemy-telegraph')).toBeNull();
  });

  test('high 危険度（shooter）は危険リングを表示する', () => {
    const shooter = EntityFactory.enemy('shooter', 200, 200);
    shooter.lastShotAt = Date.now();
    const { getByTestId } = render(<EnemySprite enemy={shooter} />);
    expect(getByTestId('enemy-danger-ring')).toBeInTheDocument();
  });

  test('low 危険度（basic）は危険リングを表示しない', () => {
    const basic = EntityFactory.enemy('basic', 200, 200);
    const { queryByTestId } = render(<EnemySprite enemy={basic} />);
    expect(queryByTestId('enemy-danger-ring')).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`
Expected: FAIL（型別 testid が存在しない。現状は汎用楕円描画のため）

- [ ] **Step 3: `EnemySprite` の通常敵描画を実装**

`src/features/deep-sea-interceptor/components/EnemySprite.tsx` を修正する。

(3-1) import を追加（ファイル冒頭の import 群）:

```tsx
import { getEnemyVisual, isEnemyTelegraphing, type EnemySilhouette } from '../enemy-visual';
import { neonGlow } from '../visuals';
```

(3-2) 型別シルエットを描画するサブコンポーネントを、既存の `MineSvg` 関数の直後に追加:

```tsx
/** 通常敵の型別シルエット（viewBox 0 0 40 40 内に描画） */
function RegularEnemySilhouette({
  silhouette,
  color,
  telegraphing,
}: {
  silhouette: EnemySilhouette;
  color: string;
  telegraphing: boolean;
}) {
  if (silhouette === 'jellyfish') {
    // クラゲ: 半透明ドーム＋触手
    return (
      <>
        <ellipse cx="20" cy="15" rx="13" ry="10" fill={color} opacity="0.85" />
        <ellipse cx="20" cy="13" rx="8" ry="6" fill="rgba(255,255,255,0.25)" />
        {[10, 15, 20, 25, 30].map(x => (
          <path key={x} d={`M${x} 23 Q${x + 1} 32 ${x - 1} 38`} stroke={color} strokeWidth="2" fill="none" opacity="0.55" />
        ))}
        <circle cx="16" cy="14" r="1.6" fill="#fff" opacity="0.8" />
        <circle cx="24" cy="14" r="1.6" fill="#fff" opacity="0.8" />
      </>
    );
  }
  if (silhouette === 'dart') {
    // 深海ダーツ: 下向きの鋭い矢尻
    return (
      <>
        <path d="M20 37 L11 12 L20 18 L29 12 Z" fill={color} opacity="0.9" />
        <path d="M20 30 L16 16 L20 19 L24 16 Z" fill="rgba(255,255,255,0.3)" />
        <circle cx="17" cy="15" r="1.5" fill="#fff" opacity="0.85" />
        <circle cx="23" cy="15" r="1.5" fill="#fff" opacity="0.85" />
      </>
    );
  }
  if (silhouette === 'angler') {
    // 提灯アンコウ: 丸い体＋発光ルアー（予兆時に強く光る）＋口
    const lureRadius = telegraphing ? 4 : 2.2;
    return (
      <>
        <ellipse cx="20" cy="23" rx="14" ry="12" fill={color} opacity="0.9" />
        <line x1="20" y1="11" x2="20" y2="5" stroke={color} strokeWidth="2" opacity="0.8" />
        {telegraphing && (
          <circle data-testid="enemy-telegraph" cx="20" cy="4" r={lureRadius + 3} fill="#fff3b0" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.3s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx="20" cy="4" r={lureRadius} fill="#ffec8a" opacity="0.95" />
        <path d="M12 27 Q20 33 28 27" stroke="#2a0a1a" strokeWidth="1.5" fill="none" opacity="0.6" />
        <circle cx="14" cy="20" r="2.4" fill="#fff" opacity="0.85" />
        <circle cx="26" cy="20" r="2.4" fill="#fff" opacity="0.85" />
      </>
    );
  }
  // shell: 甲殻ユニット（六角の装甲＋プレート線）
  return (
    <>
      <polygon points="20,6 32,14 32,28 20,36 8,28 8,14" fill={color} opacity="0.9" />
      <polygon points="20,12 27,16 27,26 20,30 13,26 13,16" fill="rgba(0,0,0,0.25)" />
      <line x1="8" y1="21" x2="32" y2="21" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <circle cx="16" cy="18" r="2" fill="#fff" opacity="0.8" />
      <circle cx="24" cy="18" r="2" fill="#fff" opacity="0.8" />
    </>
  );
}
```

(3-3) メインの `EnemySprite` 内、通常敵フォールバック（現状の `<svg>...ellipse+2 circles...</svg>` を返している最後の分岐）を、型別描画に置換する。`getEnemyVisual(enemy.enemyType)` が定義を返す場合は新描画、返さない場合（想定外）は既存の汎用楕円を保持する。具体的には、`isMine ? (...) : (` の後の通常敵ブロックを次の内容に置き換える:

```tsx
      ) : (() => {
        const visual = getEnemyVisual(enemy.enemyType);
        if (!visual) {
          // 想定外の通常敵: 従来の汎用描画にフォールバック
          const fallbackColor = ColorPalette.enemy[enemy.enemyType] || ColorPalette.enemy.basic;
          return (
            <svg width={enemy.size} height={enemy.size} viewBox="0 0 40 40">
              <ellipse cx="20" cy="20" rx="16" ry="14" fill={fallbackColor} opacity="0.9" />
              <circle cx="13" cy="15" r="3" fill="#f66" opacity="0.8" />
              <circle cx="27" cy="15" r="3" fill="#f66" opacity="0.8" />
            </svg>
          );
        }
        const telegraphing = isEnemyTelegraphing(enemy, Date.now());
        const isHighDanger = visual.danger === 'high';
        return (
          <svg
            width={enemy.size}
            height={enemy.size}
            viewBox="0 0 40 40"
            style={{ filter: neonGlow(visual.glowColor, isHighDanger ? 'strong' : 'soft') }}
            data-testid={`enemy-silhouette-${visual.silhouette}`}
          >
            {isHighDanger && (
              <circle data-testid="enemy-danger-ring" cx="20" cy="20" r="19" fill="none" stroke={visual.glowColor} strokeWidth="1" opacity="0.5">
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.6s" repeatCount="indefinite" />
              </circle>
            )}
            <RegularEnemySilhouette silhouette={visual.silhouette} color={visual.glowColor} telegraphing={telegraphing} />
          </svg>
        );
      })()}
```

Note: 既存の `const color = ColorPalette.enemy[enemy.enemyType] || ...` はボス/ミッドボス/機雷描画で引き続き使われるため削除しないこと。通常敵ブロックのみ差し替える。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`
Expected: PASS（5テスト）

- [ ] **Step 5: feature 全体テストと型チェック（回帰確認）**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（ボス/ミッドボス/機雷の既存描画・挙動に回帰なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/deep-sea-interceptor/components/EnemySprite.tsx \
        src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx
git commit -m "feat(deep-sea-interceptor): 通常敵4種を型別シルエット＋発射予兆で個性化"
```

---

## Task 6: Phase 2 総合検証

**Files:** なし（検証のみ）

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて PASS

- [ ] **Step 2: 手動確認の観点メモ（レビュー用・任意）**

`npm start` で以下を目視確認（環境がある場合のみ）:
- basic=クラゲ / fast=ダーツ / shooter=アンコウ / tank=甲殻 が一目で見分けられる
- 各型が異なる動き（basic ドリフト / fast 速い蛇行 / shooter ホバリング / tank 直進）をする
- shooter が発射直前にルアーを光らせる（予兆）
- shooter に危険リングが出る

- [ ] **Step 3: 未コミット差分がないことを確認**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 完了基準（Phase 2 DoD）

- [ ] `enemy-visual.ts` に `EnemyVisual` テーブル・型ガード・アクセサ・`isEnemyTelegraphing` があり、テスト通過
- [ ] `weave` 移動戦略が追加され、テスト通過
- [ ] `getMovementStrategy` が通常敵で型決定（movementPattern 非依存）になり、既存テストが型ベースに更新されて通過
- [ ] `EnemySprite` が通常敵4種を型別シルエット（jellyfish/dart/angler/shell）で描画し、ネオン発光・危険リング・shooter 予兆を持つ
- [ ] ボス/ミッドボス/機雷の描画・挙動、`EnemyConfig`/`EnemyType` に回帰なし
- [ ] `npm run ci` がグリーン
