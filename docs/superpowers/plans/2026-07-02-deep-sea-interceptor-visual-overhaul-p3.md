# Deep Sea Interceptor ビジュアル刷新 Phase 3 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 撃破・被弾のフィードバックを強化して爽快感と迫力を底上げする（通常敵の撃破バースト新設・被弾フラッシュ・パーティクル発光・ボス撃破の衝撃波リング）。あわせて Phase 2 のフォローアップ（IIFE 抽出・weave テスト強化）を回収する。

**Architecture:** Phase 1 の `neonGlow`、Phase 2 の `enemy-visual.ts`/`getEnemyVisual` を再利用。撃破・被弾の判定は純粋関数（`processBulletEnemyCollisions` の拡張、`isEnemyHitFlashing` の追加）で TDD、演出描画はコンポーネント＋スモークテスト。`prefers-reduced-motion` ガード（Phase 1 で導入済み）で装飾アニメを自動抑制。

**Tech Stack:** React 19, TypeScript, styled-components, Jest 30 + @testing-library/react, jsdom。

## Global Constraints

- 対象ディレクトリ: `src/features/deep-sea-interceptor/`。他 Feature を参照しない。
- `any` 型禁止（`unknown` + 型ガード）。`var` 禁止・`const` 優先。マジックナンバーは名前付き定数化（SVG 図形座標は既存 BossSvg 同様に許容）。
- コメント/ドキュメントは日本語。命名: 変数/関数 camelCase、型/コンポーネント PascalCase、ファイル kebab-case（コンポーネントは PascalCase.tsx）。
- `EnemyConfig` の数値バランス・`EnemyType` 定義は変更しない。ボス/ミッドボス/機雷の既存描画・挙動は変更しない（衝撃波リングは撃破時の付加演出であり既存分岐を書き換えない）。
- 発光は `neonGlow`（`./visuals`）を使う。新規 box-shadow のハードコードを増やさない。
- テストは振る舞いベース。SVG スプライトは `data-testid` を用いてよい（最終手段として許容）。
- Conventional Commits。`main` 直コミット禁止・作業ブランチ `feature/dsi-visual-overhaul-p3`。
- 検証: `npx jest src/features/deep-sea-interceptor` / 型: `npm run typecheck`。

## スコープ外（明示的に見送り）

- **自弾トレイル/ fast 敵の残像**は今回スコープに含めない（設計書でも「控えめ or 付けない」とされ、視界ノイズ回避を優先）。将来必要なら別 Phase で検討。
- 音の刷新（`audio.ts`）は触らない。

---

## ファイル構成

**新規作成:**
- `src/features/deep-sea-interceptor/components/ShockwaveRing.tsx` — ボス/ミッドボス撃破時の拡大衝撃波リング（純表示）。
- `src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx` — スモークテスト。

**修正:**
- `src/features/deep-sea-interceptor/components/EnemySprite.tsx` — 通常敵ブランチのインライン IIFE を名前付き `RegularEnemySvg` に抽出（P2 フォローアップ）。被弾フラッシュ描画を追加。
- `src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx` — 被弾フラッシュのスモークテストを追加。
- `src/features/deep-sea-interceptor/__tests__/movement.test.ts` — weave 振幅テストを複数 y 点でパラメタライズ（P2 フォローアップ）。
- `src/features/deep-sea-interceptor/enemy-visual.ts` — 被弾フラッシュ判定 `isEnemyHitFlashing` と `HIT_FLASH_MS` を追加。
- `src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts` — `isEnemyHitFlashing` のテストを追加。
- `src/features/deep-sea-interceptor/types.ts` — `Enemy` に `lastHitAt?: number` を追加。
- `src/features/deep-sea-interceptor/entities.ts` — 敵ファクトリで `lastHitAt: 0` を初期化。
- `src/features/deep-sea-interceptor/game-logic.ts` — `processBulletEnemyCollisions` に通常敵の撃破バースト追加＋被弾時刻 `lastHitAt` 記録（`now` 引数追加）。
- `src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts` — 上記のテストを追加。
- `src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx` — パーティクル描画に発光を付与、ボス撃破時に `ShockwaveRing` を表示。
- `src/features/deep-sea-interceptor/styles.ts` — `shockwave` keyframe を追加（reduced-motion ガードは既存が自動適用）。

---

## Task 1: 通常敵描画を `RegularEnemySvg` に抽出（P2 フォローアップ）

**Files:**
- Modify: `src/features/deep-sea-interceptor/components/EnemySprite.tsx`
- Test: `src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`（既存が回帰ガード。新規テストなし）

**Interfaces:**
- Produces: `RegularEnemySvg`（ファイル内ローカル関数コンポーネント、props `{ enemy: Enemy }`）。既存の IIFE と同一の描画を行う。`EnemySprite` の default export・props は不変。

これは振る舞いを変えない純粋リファクタ。既存の `EnemySprite.test.tsx`（5テスト）が回帰ガードになる。

- [ ] **Step 1: 既存テストが緑であることを確認（リファクタ前）**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`
Expected: PASS（5テスト）

- [ ] **Step 2: IIFE を名前付きコンポーネントに抽出**

`src/features/deep-sea-interceptor/components/EnemySprite.tsx` の `RegularEnemySilhouette` 関数の直後（`EnemySprite` 本体の前）に、現行 IIFE の中身を移した名前付きコンポーネントを追加:

```tsx
/** 通常敵4種の SVG（型別シルエット＋ネオン発光＋危険リング＋発射予兆） */
function RegularEnemySvg({ enemy }: { enemy: Enemy }) {
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
}
```

- [ ] **Step 3: `EnemySprite` 本体の IIFE を `<RegularEnemySvg>` 呼び出しに置換**

`EnemySprite` 内の `) : (() => { ... })()}` ブロック（通常敵分岐）を以下に置換:

```tsx
      ) : (
        <RegularEnemySvg enemy={enemy} />
      )}
```

ボス/ミッドボス/機雷の三項分岐と `const color = ColorPalette.enemy[...]` は変更しない。

- [ ] **Step 4: 既存テストが引き続き緑であることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx && npm run typecheck`
Expected: PASS（5テスト・型エラーなし）

- [ ] **Step 5: コミット**

```bash
git add src/features/deep-sea-interceptor/components/EnemySprite.tsx
git commit -m "refactor(deep-sea-interceptor): 通常敵描画をRegularEnemySvgに抽出（P2追従）"
```

---

## Task 2: weave 振幅テストの複数 y パラメタライズ（P2 フォローアップ）

**Files:**
- Modify: `src/features/deep-sea-interceptor/__tests__/movement.test.ts`

**Interfaces:** なし（テスト強化のみ）。

- [ ] **Step 1: 既存の weave 振幅テストを複数点検証に置換**

`movement.test.ts` の `describe('MovementStrategies.weave', ...)` 内、「x は y に応じた蛇行で変化する（振幅は sine より大きい）」テストを以下に置換する（単一 y 依存を解消し、係数の大小を複数 y で確認）:

```ts
  test('複数の y で weave の最大振幅は sine の最大振幅より大きい（係数4>2）', () => {
    const xs = [10, 30, 55, 80, 125, 200];
    const weaveMax = Math.max(
      ...xs.map(y => Math.abs(MovementStrategies.weave({ x: 100, y, speed: 4 }).x - 100))
    );
    const sineMax = Math.max(
      ...xs.map(y => Math.abs(MovementStrategies.sine({ x: 100, y, speed: 4 }).x - 100))
    );
    // weave 振幅係数 4 > sine 係数 2。十分な y 点を取れば最大振幅は 4 側が上回る
    expect(weaveMax).toBeGreaterThan(sineMax);
  });
```

- [ ] **Step 2: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/movement.test.ts`
Expected: PASS

補足: `weaveMax` は係数 4（`Math.sin(y/10)*4`）、`sineMax` は係数 2（`Math.sin(y/20)*2`）の最大値に漸近する。上記 y 集合には `sin` が ±1 に近い点（例 y=55 で `sin(5.5)≈-0.7`、y=80 で `sin(8)≈0.99`）が含まれ、weave 側の最大は 4 に近づき sine 側の最大（≦2）を確実に上回る。

- [ ] **Step 3: コミット**

```bash
git add src/features/deep-sea-interceptor/__tests__/movement.test.ts
git commit -m "test(deep-sea-interceptor): weave振幅検証を複数yでパラメタライズ（P2追従）"
```

---

## Task 3: 通常敵の撃破バーストを新設

**Files:**
- Modify: `src/features/deep-sea-interceptor/game-logic.ts`（`processBulletEnemyCollisions` の撃破分岐）
- Test: `src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts`

**Interfaces:**
- Consumes: `createDefeatParticles`（同ファイル内）、`getEnemyVisual`（`./enemy-visual`、game-logic に import 済み）。
- Produces: 通常敵撃破時に `CollisionResult.particles` へ小さめのバーストを追加。

現状、通常敵の撃破時はパーティクルが出ていない（ボス20/ミッドボス10のみ）。ここで通常敵にも撃破バーストを追加する。

- [ ] **Step 1: 失敗するテストを追記**

`game-logic-subfunctions.test.ts` の `describe('processBulletEnemyCollisions', ...)` 内に追記:

```ts
  test('通常敵を撃破するとパーティクルバーストが発生する', () => {
    // basic は hp1。damage1 の弾で撃破される
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('basic', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig);
    expect(result.enemies).toHaveLength(0); // 撃破された
    expect(result.particles.length).toBeGreaterThanOrEqual(6); // バースト発生
  });

  test('撃破に至らないヒットではバーストを出さない', () => {
    // tank は hp5。damage1 では撃破されない
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('tank', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig);
    expect(result.enemies).toHaveLength(1); // 生存
    expect(result.particles).toHaveLength(0); // バーストなし
  });
```

（`EntityFactory` / `DifficultyConfig` は同テストファイルで import 済みのはず。無ければ追加。）

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts -t 'パーティクルバースト'`
Expected: FAIL（通常敵撃破で particles が空）

- [ ] **Step 3: 撃破分岐に通常敵バーストを追加**

`game-logic.ts` の撃破処理内、`if (isBoss(e)) {...} else if (isMidboss(e)) {...} else if (Math.random() < Config.spawn.itemChance) {...}` の構造を、通常敵バーストを常時出す形に変更する。該当の `else if (Math.random() < Config.spawn.itemChance)` ブロックを次の `else` ブロックに置換:

```ts
          } else {
            // 通常敵: 型別カラーの撃破バースト（爽快感）＋従来のアイテムドロップ判定
            const burstColor = getEnemyVisual(e.enemyType)?.glowColor ?? ColorPalette.particle.death;
            newParticles.push(
              ...createDefeatParticles(e.x, e.y, REGULAR_DEFEAT_PARTICLE_COUNT, REGULAR_DEFEAT_PARTICLE_SPREAD, [burstColor, '#ffffff', ColorPalette.particle.hit])
            );
            if (Math.random() < Config.spawn.itemChance) {
              newItems.push(EntityFactory.item(e.x, e.y, randomChoice(Object.keys(ItemConfig) as Array<keyof typeof ItemConfig>)));
            }
          }
```

同ファイル上部の定数定義エリア（他の `const ... _MS` 等の近く、import 直後でも可）に名前付き定数を追加:

```ts
/** 通常敵撃破時のパーティクル数 */
const REGULAR_DEFEAT_PARTICLE_COUNT = 6;

/** 通常敵撃破パーティクルの散布半径 */
const REGULAR_DEFEAT_PARTICLE_SPREAD = 20;
```

`ColorPalette` が game-logic.ts に未 import の場合は `import { ColorPalette } from './constants';` を既存 import に統合（`Config`/`ItemConfig` と同じ constants から）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts`
Expected: PASS

- [ ] **Step 5: feature 全体テストと型チェック（回帰確認）**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（ボス/ミッドボスのバースト数・アイテムドロップ確率に回帰なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/deep-sea-interceptor/game-logic.ts \
        src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts
git commit -m "feat(deep-sea-interceptor): 通常敵撃破時の型別カラー・バーストを追加"
```

---

## Task 4: 被弾時刻の記録（`lastHitAt`）

**Files:**
- Modify: `src/features/deep-sea-interceptor/types.ts`（`Enemy`）
- Modify: `src/features/deep-sea-interceptor/entities.ts`（敵ファクトリ）
- Modify: `src/features/deep-sea-interceptor/game-logic.ts`（`processBulletEnemyCollisions`）
- Test: `src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts`

**Interfaces:**
- Produces: `Enemy.lastHitAt?: number`（最後に被弾した時刻）。`processBulletEnemyCollisions(bullets, enemies, currentCombo, diffConfig, now?)` — 非致死ヒットで生存した敵の `lastHitAt` を `now` に更新。`now` は省略時 `Date.now()`。

- [ ] **Step 1: 失敗するテストを追記**

`game-logic-subfunctions.test.ts` の同 describe 内に追記:

```ts
  test('撃破に至らない被弾で生存敵の lastHitAt が now に更新される', () => {
    const bullet = EntityFactory.bullet(100, 100);
    const enemy = EntityFactory.enemy('tank', 100, 100); // hp5、damage1 では生存
    const diffConfig = DifficultyConfig['standard'];
    const now = 12345;
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig, now);
    expect(result.enemies).toHaveLength(1);
    expect(result.enemies[0].lastHitAt).toBe(now);
  });

  test('被弾していない敵の lastHitAt は据え置き', () => {
    const bullet = EntityFactory.bullet(9999, 9999); // 遠方でヒットしない
    const enemy = EntityFactory.enemy('tank', 100, 100);
    const diffConfig = DifficultyConfig['standard'];
    const result = processBulletEnemyCollisions([bullet], [enemy], 0, diffConfig, 12345);
    expect(result.enemies[0].lastHitAt).toBe(0); // ファクトリ初期値
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts -t lastHitAt`
Expected: FAIL（`lastHitAt` が未定義／更新されない）

- [ ] **Step 3: 型・ファクトリ・衝突処理を実装**

(3-1) `types.ts` の `Enemy` インターフェースに追加（`lastShotAt: number;` の近く）:

```ts
  /** 最後に被弾した時刻（被弾フラッシュ演出用）。0 は未被弾 */
  lastHitAt?: number;
```

(3-2) `entities.ts` の敵ファクトリ return オブジェクトに追加（`lastShotAt: 0,` の近く）:

```ts
      lastHitAt: 0,
```

(3-3) `game-logic.ts` の `processBulletEnemyCollisions` を修正:

シグネチャに `now` を追加（既存呼び出し互換のため省略可能に）:

```ts
export function processBulletEnemyCollisions(
  bullets: Bullet[],
  enemies: Enemy[],
  currentCombo: number,
  diffConfig: { scoreMultiplier: number },
  now: number = Date.now(),
): CollisionResult {
```

関数冒頭の `const enemyHps = enemies.map(e => e.hp);` の直後に被弾時刻トラッカを追加:

```ts
  // 非致死ヒットで被弾した敵の時刻を記録（被弾フラッシュ用）
  const hitTimes: (number | null)[] = enemies.map(() => null);
```

非致死ヒットの `else` ブロック（現状 `audioEvents.push({ name: 'hit' });` のみの箇所）に被弾時刻の記録を追加:

```ts
        } else {
          audioEvents.push({ name: 'hit' });
          hitTimes[idx] = now;
        }
```

生存敵リストの map に `lastHitAt` 反映を追加:

```ts
  const survivingEnemies = enemies
    .map((e, idx) => ({ ...e, hp: enemyHps[idx], lastHitAt: hitTimes[idx] ?? e.lastHitAt }))
    .filter(e => e.hp > 0);
```

(3-4) 実ゲームループの呼び出し側（`game-logic.ts:814` 付近の `processBulletEnemyCollisions(gd.bullets, gd.enemies, gd.combo, diffConfig)`）に `now` を渡す。そのスコープに `now` 変数があればそれを、無ければ `Date.now()` を渡す:

```ts
  const collisionResult = processBulletEnemyCollisions(gd.bullets, gd.enemies, gd.combo, diffConfig, now);
```

（`now` がそのスコープに存在するか確認し、無ければ `Date.now()` を渡すこと。）

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts`
Expected: PASS

- [ ] **Step 5: feature 全体テストと型チェック**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS（`lastHitAt` は optional のため既存の敵生成箇所・テストに回帰なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/deep-sea-interceptor/types.ts \
        src/features/deep-sea-interceptor/entities.ts \
        src/features/deep-sea-interceptor/game-logic.ts \
        src/features/deep-sea-interceptor/__tests__/game-logic-subfunctions.test.ts
git commit -m "feat(deep-sea-interceptor): 敵の被弾時刻lastHitAtを記録"
```

---

## Task 5: 被弾フラッシュ描画＋パーティクル発光

**Files:**
- Modify: `src/features/deep-sea-interceptor/enemy-visual.ts`（`isEnemyHitFlashing` / `HIT_FLASH_MS`）
- Test: `src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
- Modify: `src/features/deep-sea-interceptor/components/EnemySprite.tsx`（`RegularEnemySvg` にフラッシュ描画）
- Test: `src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`
- Modify: `src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx`（パーティクル発光）

**Interfaces:**
- Consumes: `neonGlow`（`./visuals`）。
- Produces: `isEnemyHitFlashing(enemy, now): boolean`、`HIT_FLASH_MS`。`RegularEnemySvg` が被弾中に白フラッシュ要素（`data-testid="enemy-hit-flash"`）を描画。

- [ ] **Step 1: 失敗するテストを追記（判定ロジック）**

`enemy-visual.test.ts` の import に `isEnemyHitFlashing, HIT_FLASH_MS` を追加（既存 `../enemy-visual` import 行に統合）。末尾に追記:

```ts
describe('isEnemyHitFlashing', () => {
  const makeHit = (lastHitAt: number) => {
    const e = EntityFactory.enemy('tank', 100, 100);
    e.lastHitAt = lastHitAt;
    return e;
  };

  test('被弾直後（経過 < HIT_FLASH_MS）はフラッシュ中', () => {
    const now = 10000;
    expect(isEnemyHitFlashing(makeHit(now - (HIT_FLASH_MS - 1)), now)).toBe(true);
  });

  test('HIT_FLASH_MS 経過後はフラッシュしない', () => {
    const now = 10000;
    expect(isEnemyHitFlashing(makeHit(now - HIT_FLASH_MS), now)).toBe(false);
  });

  test('未被弾（lastHitAt=0/undefined）はフラッシュしない', () => {
    const now = 10000;
    expect(isEnemyHitFlashing(makeHit(0), now)).toBe(false);
    const e = EntityFactory.enemy('tank', 100, 100);
    expect(isEnemyHitFlashing(e, now)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
Expected: FAIL（`isEnemyHitFlashing` 未定義）

- [ ] **Step 3: 判定ロジックを実装**

`enemy-visual.ts` の `isEnemyTelegraphing` の近くに追加:

```ts
/** 被弾フラッシュの表示時間（ms） */
export const HIT_FLASH_MS = 120;

/**
 * 敵が被弾フラッシュ中かを判定する（純粋関数）。
 * lastHitAt から HIT_FLASH_MS 以内なら true。未被弾（0/undefined）は false。
 */
export const isEnemyHitFlashing = (enemy: Enemy, now: number): boolean => {
  const lastHitAt = enemy.lastHitAt ?? 0;
  if (lastHitAt <= 0) return false;
  return now - lastHitAt < HIT_FLASH_MS;
};
```

- [ ] **Step 4: 判定テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts`
Expected: PASS

- [ ] **Step 5: 失敗するスモークテストを追記（描画）**

`components/__tests__/EnemySprite.test.tsx` の import に `HIT_FLASH_MS`（`../../enemy-visual`）が必要なら追加。`describe('EnemySprite（通常敵の型別描画）', ...)` 内に追記:

```tsx
  test('被弾直後の敵は被弾フラッシュ要素を表示する', () => {
    const enemy = EntityFactory.enemy('tank', 200, 200);
    enemy.lastHitAt = Date.now(); // 直近被弾
    const { getByTestId } = render(<EnemySprite enemy={enemy} />);
    expect(getByTestId('enemy-hit-flash')).toBeInTheDocument();
  });

  test('未被弾の敵は被弾フラッシュ要素を表示しない', () => {
    const enemy = EntityFactory.enemy('tank', 200, 200);
    const { queryByTestId } = render(<EnemySprite enemy={enemy} />);
    expect(queryByTestId('enemy-hit-flash')).toBeNull();
  });
```

- [ ] **Step 6: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx -t 被弾フラッシュ`
Expected: FAIL（`enemy-hit-flash` が存在しない）

- [ ] **Step 7: `RegularEnemySvg` にフラッシュ描画を追加**

`EnemySprite.tsx` の import に `isEnemyHitFlashing` を追加（既存 `../enemy-visual` import 行に統合）。`RegularEnemySvg` 内、`const telegraphing = ...` の近くで判定し、シルエットに重ねて白フラッシュを描画する。`RegularEnemySilhouette` の呼び出し直後（`</svg>` の直前）に追加:

```tsx
      {isEnemyHitFlashing(enemy, Date.now()) && (
        <ellipse data-testid="enemy-hit-flash" cx="20" cy="20" rx="18" ry="16" fill="#ffffff" opacity="0.65" />
      )}
```

- [ ] **Step 8: 描画テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx`
Expected: PASS

- [ ] **Step 9: パーティクル描画に発光を付与**

`DeepSeaInterceptorGame.tsx` のパーティクル描画（`gd.particles.map(p => (...))`、438 行付近）の div スタイルに `filter` を追加。冒頭 import に `neonGlow`（`./visuals`）が未 import なら追加。スタイルオブジェクトへ:

```tsx
              background: p.color,
              opacity: p.life / p.maxLife,
              filter: neonGlow(p.color, 'soft'),
```

- [ ] **Step 10: feature 全体テストと型チェック**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS

- [ ] **Step 11: コミット**

```bash
git add src/features/deep-sea-interceptor/enemy-visual.ts \
        src/features/deep-sea-interceptor/__tests__/enemy-visual.test.ts \
        src/features/deep-sea-interceptor/components/EnemySprite.tsx \
        src/features/deep-sea-interceptor/components/__tests__/EnemySprite.test.tsx \
        src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx
git commit -m "feat(deep-sea-interceptor): 被弾フラッシュとパーティクル発光を追加"
```

---

## Task 6: ボス撃破の衝撃波リング

**Files:**
- Create: `src/features/deep-sea-interceptor/components/ShockwaveRing.tsx`
- Test: `src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx`
- Modify: `src/features/deep-sea-interceptor/styles.ts`（`shockwave` keyframe）
- Modify: `src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx`（ボス撃破時に表示）

**Interfaces:**
- Produces: `ShockwaveRing`（default export、props `{ x: number; y: number; color?: string }`）。CSS アニメで拡大しながらフェードするリング。

- [ ] **Step 1: 失敗するスモークテストを書く**

`src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react';
import ShockwaveRing from '../ShockwaveRing';

describe('ShockwaveRing', () => {
  test('指定座標を中心にリングを描画する', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} />);
    const ring = getByTestId('shockwave-ring');
    expect(ring).toBeInTheDocument();
  });

  test('色を指定できる', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} color="#ff8" />);
    expect(getByTestId('shockwave-ring').style.borderColor).toBeTruthy();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx`
Expected: FAIL（`Cannot find module '../ShockwaveRing'`）

- [ ] **Step 3: `ShockwaveRing` を実装**

`src/features/deep-sea-interceptor/components/ShockwaveRing.tsx`:

```tsx
// ============================================================================
// Deep Sea Interceptor - 衝撃波リング（ボス/ミッドボス撃破演出）
// ============================================================================

import React, { memo } from 'react';

/** 衝撃波リングの初期直径（px） */
const RING_START_SIZE = 40;

interface ShockwaveRingProps {
  x: number;
  y: number;
  color?: string;
}

/**
 * 撃破位置から拡大しながらフェードする衝撃波リング。
 * CSS keyframe `shockwave`（styles.ts）で拡大・減衰する。
 * prefers-reduced-motion 環境では既存のグローバルガードでアニメが抑制される。
 */
const ShockwaveRing = memo(function ShockwaveRing({ x, y, color = '#8ff' }: ShockwaveRingProps) {
  return (
    <div
      data-testid="shockwave-ring"
      style={{
        position: 'absolute',
        left: x - RING_START_SIZE / 2,
        top: y - RING_START_SIZE / 2,
        width: RING_START_SIZE,
        height: RING_START_SIZE,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        boxShadow: `0 0 20px ${color}`,
        pointerEvents: 'none',
        animation: 'shockwave 0.6s ease-out forwards',
        zIndex: 40,
      }}
    />
  );
});

export default ShockwaveRing;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx`
Expected: PASS

- [ ] **Step 5: `shockwave` keyframe を追加**

`styles.ts` の `GameGlobalStyles` 内、`pulse` keyframe の直後に追加（reduced-motion ガードは既存のものが自動適用される）:

```tsx
  @keyframes shockwave {
    0% { transform: scale(1); opacity: 0.9; }
    100% { transform: scale(12); opacity: 0; }
  }
```

- [ ] **Step 6: ボス撃破時に表示**

`DeepSeaInterceptorGame.tsx` の import に `ShockwaveRing`（`./components/ShockwaveRing`）を追加。既存の `{gd.bossDefeated && (...)}` ブロック（561 行付近の「BOSS DEFEATED!」メッセージ）内、メッセージ div と同じ階層に衝撃波リングを追加する。ボスは画面上部で撃破されるため、画面上部中央に配置:

```tsx
        {gd.bossDefeated && (
          <ShockwaveRing x={Config.canvas.width / 2} y={180} color="#ff8" />
        )}
```

（既存の「BOSS DEFEATED!」表示ブロックは残す。`Config` は既に import 済み。`gd.bossDefeated` は撃破後一定時間 true。`ShockwaveRing` はマウント時にアニメ開始するため、条件付き描画で撃破の瞬間に出現する。）

- [ ] **Step 7: feature 全体テストと型チェック**

Run: `npx jest src/features/deep-sea-interceptor && npm run typecheck`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/deep-sea-interceptor/components/ShockwaveRing.tsx \
        src/features/deep-sea-interceptor/components/__tests__/ShockwaveRing.test.tsx \
        src/features/deep-sea-interceptor/styles.ts \
        src/features/deep-sea-interceptor/DeepSeaInterceptorGame.tsx
git commit -m "feat(deep-sea-interceptor): ボス撃破の衝撃波リング演出を追加"
```

---

## Task 7: Phase 3 総合検証

**Files:** なし（検証のみ）

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて PASS

- [ ] **Step 2: 手動確認の観点メモ（レビュー用・任意）**

`npm start` で以下を目視確認（環境がある場合のみ）:
- 通常敵撃破時に型別カラーのパーティクルバーストが出る
- 硬い敵（tank）を撃つと白く一瞬フラッシュする（手応え）
- パーティクルが発光して見える
- ボス撃破時に衝撃波リングが広がる
- `prefers-reduced-motion` でリング/フラッシュ等の装飾アニメが抑制される

- [ ] **Step 3: 未コミット差分がないことを確認**

Run: `git status`
Expected: `nothing to commit, working tree clean`

---

## 完了基準（Phase 3 DoD）

- [ ] 通常敵ブランチが `RegularEnemySvg` に抽出され、既存テストが緑（P2 追従）
- [ ] weave 振幅テストが複数 y でパラメタライズされている（P2 追従）
- [ ] 通常敵撃破時に型別カラーのパーティクルバーストが出る（テスト通過）
- [ ] `Enemy.lastHitAt` が記録され、非致死ヒットで生存敵に更新される（テスト通過）
- [ ] 被弾フラッシュ（`isEnemyHitFlashing`）が判定・描画される
- [ ] パーティクルが発光描画される
- [ ] ボス撃破時に衝撃波リングが表示される
- [ ] ボス/ミッドボス/機雷の既存描画・挙動、`EnemyConfig`/`EnemyType` に回帰なし
- [ ] `prefers-reduced-motion` で装飾アニメが抑制される
- [ ] `npm run ci` がグリーン
