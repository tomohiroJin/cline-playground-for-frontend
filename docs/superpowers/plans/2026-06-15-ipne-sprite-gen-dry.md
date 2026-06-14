# IPNE スプライト生成プリミティブ共通化 実装計画（Phase B）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `enemySprites.ts` と `playerSprites.ts` に二重定義された生成プリミティブ（`PixelEdit` 型 / `clonePixels` / `applyPixelEdits`）を新規 `pixelOps.ts` に集約する（振る舞い不変）。

**Architecture:** ピクセルグリッド編集プリミティブを単一責務モジュール `pixelOps.ts` に切り出し、両スプライトファイルがそこから import する。生成ヘルパーをいじるため、リファクタ前後でスプライトのピクセル出力が完全一致することを「一時的な特性化スナップショットテスト」で機械的に証明し、完了後にそのテストを削除する。

**Tech Stack:** TypeScript, Jest (SWC), コードスプライト方式（2次元パレットインデックス配列）。

**設計の出典:** `docs/superpowers/specs/2026-06-15-ipne-sprite-gen-dry-design.md`

---

## 対象ファイルと責務

すべて `src/features/ipne/presentation/sprites/` 配下。

| ファイル | 役割 | 本計画での扱い |
|---------|------|---------------|
| `pixelOps.ts` | ピクセルグリッド編集プリミティブ（`PixelEdit`/`clonePixels`/`applyPixelEdits`） | **新規**（Task 1） |
| `pixelOps.test.ts` | pixelOps の恒久ユニットテスト | **新規**（Task 1） |
| `__sprite_characterization.test.ts` | 全スプライト出力の特性化スナップショット（一時） | **新規→Task 5 で削除** |
| `enemySprites.ts`（2507行） | 敵スプライト定義。重複ヘルパーを pixelOps へ委譲 | **変更**（Task 3） |
| `playerSprites.ts`（2250行） | プレイヤースプライト定義。重複ヘルパーを pixelOps へ委譲 | **変更**（Task 4） |
| `index.ts` | 公開バレル | **無変更**（pixelOps は非公開） |

### 共通化対象（真の重複・3点のみ）

| 要素 | enemySprites.ts（現状） | playerSprites.ts（現状） | 集約先 |
|------|------------------------|--------------------------|--------|
| 編集型 | `EnemyPixelEdit` | `PixelEdit` | `pixelOps.PixelEdit` |
| 複製 | `cloneEnemyPixels` | `clonePixels` | `pixelOps.clonePixels` |
| 編集適用 | `applyEnemyPixelEdits`(SpriteDefinition) | `applyPixelEdits`(number[][]) | `pixelOps.applyPixelEdits`(number[][]) |

### 据え置き（player 専用・enemy 未使用・YAGNI）

`createSpriteDefinition`, `type RegionShift`, `shiftRegion`, `createVariant`, `mirrorPixels`,
`createSheetWithDuration` は `playerSprites.ts` に残す。ただし内部で旧ローカル
`clonePixels`/`applyPixelEdits`/`PixelEdit` を参照していた箇所は import 版へ切り替える。

---

## Task 0: ベースライン確認

**Files:** なし（確認のみ）

- [ ] **Step 1: ブランチ確認**

Run: `git branch --show-current`
Expected: `refactor/ipne-sprite-gen-dry`

- [ ] **Step 2: スプライト関連テストが緑であることを確認**

Run: `npx jest sprites 2>&1 | tail -8`
Expected: PASS（`spriteData.test.ts` / `phase0c.test.ts` 等が green）

- [ ] **Step 3: 型チェックのベースライン**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

---

## Task 1: `pixelOps.ts` を作成（TDD）

**Files:**
- Create: `src/features/ipne/presentation/sprites/pixelOps.ts`
- Create: `src/features/ipne/presentation/sprites/pixelOps.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Create `pixelOps.test.ts`:

```typescript
import { clonePixels, applyPixelEdits, type PixelEdit } from './pixelOps';

describe('pixelOps', () => {
  describe('clonePixels', () => {
    it('各行を複製した新しい配列を返す（深いコピー）', () => {
      const src = [
        [0, 1],
        [2, 3],
      ];
      const copy = clonePixels(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
      expect(copy[0]).not.toBe(src[0]);
    });

    it('複製後の変更が元配列に影響しない', () => {
      const src = [[0, 0]];
      const copy = clonePixels(src);
      copy[0][0] = 9;
      expect(src[0][0]).toBe(0);
    });
  });

  describe('applyPixelEdits', () => {
    it('指定座標のパレットインデックスを上書きする', () => {
      const base = [
        [0, 0],
        [0, 0],
      ];
      const edits: PixelEdit[] = [{ x: 1, y: 0, value: 5 }];
      const result = applyPixelEdits(base, edits);
      expect(result).toEqual([
        [0, 5],
        [0, 0],
      ]);
    });

    it('元配列を破壊しない（非破壊）', () => {
      const base = [[0, 0]];
      applyPixelEdits(base, [{ x: 0, y: 0, value: 7 }]);
      expect(base[0][0]).toBe(0);
    });

    it('範囲外の座標は無視する', () => {
      const base = [[0]];
      const result = applyPixelEdits(base, [
        { x: 5, y: 0, value: 1 },
        { x: 0, y: 9, value: 2 },
      ]);
      expect(result).toEqual([[0]]);
    });

    it('編集列が空なら内容が等しい複製を返す', () => {
      const base = [[1, 2, 3]];
      const result = applyPixelEdits(base, []);
      expect(result).toEqual(base);
      expect(result).not.toBe(base);
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest pixelOps 2>&1 | tail -15`
Expected: FAIL（`Cannot find module './pixelOps'`）

- [ ] **Step 3: `pixelOps.ts` を実装**

Create `pixelOps.ts`:

```typescript
/**
 * ピクセルグリッド編集プリミティブ
 *
 * コードスプライト（2次元パレットインデックス配列）への編集操作を提供する。
 * スプライトの定義・レンダリングは spriteData.ts が担い、本モジュールは
 * 「ピクセル配列そのものの非破壊操作」に特化する。
 */

/** ピクセル1点の編集（パレットインデックスの上書き） */
export type PixelEdit = Readonly<{ x: number; y: number; value: number }>;

/** ピクセル配列を深く複製する（行ごとにコピー） */
export const clonePixels = (pixels: number[][]): number[][] =>
  pixels.map((row) => [...row]);

/**
 * ピクセル配列に編集列を適用した新しい配列を返す（非破壊）。
 * 範囲外の座標は無視する。
 */
export const applyPixelEdits = (
  pixels: number[][],
  edits: readonly PixelEdit[]
): number[][] => {
  const next = clonePixels(pixels);
  edits.forEach(({ x, y, value }) => {
    if (next[y] && next[y][x] !== undefined) {
      next[y][x] = value;
    }
  });
  return next;
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest pixelOps 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/sprites/pixelOps.ts \
        src/features/ipne/presentation/sprites/pixelOps.test.ts
git commit -m "feat: IPNE スプライト生成プリミティブ pixelOps を新設

- PixelEdit 型・clonePixels・applyPixelEdits を単一責務モジュールに集約
- enemy/player スプライトの二重定義を解消する受け皿（後続タスクで委譲）"
```

---

## Task 2: 特性化スナップショットテストを追加し baseline を確定

**Files:**
- Create: `src/features/ipne/presentation/sprites/__sprite_characterization.test.ts`
- Create（生成物）: `src/features/ipne/presentation/sprites/__snapshots__/__sprite_characterization.test.ts.snap`

このテストは **一時的な安全網**。enemy/player のリファクタ前にピクセル出力を捕捉し、
リファクタ後に差分ゼロを確認するために使う。Task 5 で削除する。

- [ ] **Step 1: 特性化テストを作成**

Create `__sprite_characterization.test.ts`:

```typescript
/**
 * 一時的な特性化テスト（Phase B 安全網）
 *
 * enemy/player スプライトの生成プリミティブ共通化リファクタの前後で、
 * 全スプライトのピクセル出力が完全に一致することを保証する。
 * モジュール名前空間を丸ごとスナップショットすることで、どの export の
 * ピクセルが1点でも変われば検知できる。
 *
 * NOTE: Phase B 完了後に本ファイルとスナップショットを削除する（恒久的負債を残さない）。
 */
import * as enemySprites from './enemySprites';
import * as playerSprites from './playerSprites';

describe('スプライト特性化（Phase B 安全網・完了後削除）', () => {
  it('敵スプライトの全 export が変化しないこと', () => {
    expect(enemySprites).toMatchSnapshot();
  });

  it('プレイヤースプライトの全 export が変化しないこと', () => {
    expect(playerSprites).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: 実行して baseline スナップショットを生成**

Run: `npx jest __sprite_characterization 2>&1 | tail -12`
Expected: PASS（`2 snapshots written`）。`__snapshots__/__sprite_characterization.test.ts.snap` が生成される。

- [ ] **Step 3: baseline をコミット**

```bash
git add src/features/ipne/presentation/sprites/__sprite_characterization.test.ts \
        src/features/ipne/presentation/sprites/__snapshots__/__sprite_characterization.test.ts.snap
git commit -m "test: IPNE スプライト特性化スナップショットを追加（Phase B 一時安全網）

- enemy/player の現状ピクセル出力を baseline として固定
- 生成プリミティブ共通化の前後で差分ゼロを保証するための一時テスト（完了後削除）"
```

---

## Task 3: `enemySprites.ts` を pixelOps 委譲へ変更

**Files:**
- Modify: `src/features/ipne/presentation/sprites/enemySprites.ts`

- [ ] **Step 1: 現状の該当箇所を読む**

`enemySprites.ts` 冒頭（おおよそ11-39行）の `EnemyPixelEdit` 型・`cloneEnemyPixels`・
`applyEnemyPixelEdits` 定義を確認する。

- [ ] **Step 2: 重複定義を削除し pixelOps 委譲に置換**

`enemySprites.ts` で以下を実施:
1. `type EnemyPixelEdit = Readonly<{ x: number; y: number; value: number }>;` を削除。
2. `function cloneEnemyPixels(...) { ... }` を削除。
3. `function applyEnemyPixelEdits(base: SpriteDefinition, edits: EnemyPixelEdit[]): SpriteDefinition { ... }`（clone+edit を内包する現行実装）を、以下の薄いラッパーに置換:

```typescript
const applyEnemyPixelEdits = (base: SpriteDefinition, edits: readonly PixelEdit[]): SpriteDefinition => ({
  ...base,
  pixels: applyPixelEdits(base.pixels, edits),
});
```

4. ファイル冒頭の import 群（`SpriteDefinition` を import している箇所の近く）に追加:

```typescript
import { applyPixelEdits, type PixelEdit } from './pixelOps';
```

注意:
- 呼び出し箇所 `applyEnemyPixelEdits(xxxFrameNBase, [ { x, y, value }, ... ])` は **すべて無修正**
  （引数の形は不変。`EnemyPixelEdit[]` リテラルは構造的に `PixelEdit[]` と同一）。
- `SpriteDefinition` の import は既存のものを使う（重複 import しない）。

- [ ] **Step 3: 特性化スナップショットが差分ゼロであることを確認**

Run: `npx jest __sprite_characterization 2>&1 | tail -10`
Expected: PASS（`2 passed`、`snapshots written` ではなく既存と一致。差分が出たら実装ミス）

- [ ] **Step 4: スプライト関連テスト全体を確認**

Run: `npx jest sprites 2>&1 | tail -8`
Expected: PASS（`phase0c.test.ts` の敵フレーム数・duration・寸法・パレット有効性含む）

- [ ] **Step 5: 型チェック＆lint**

Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/presentation/sprites/ 2>&1 | tail -10`（エラーなし、未使用 import があれば削除）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/sprites/enemySprites.ts
git commit -m "refactor: IPNE enemySprites を pixelOps 委譲へ変更

- EnemyPixelEdit 型・cloneEnemyPixels の二重定義を削除
- applyEnemyPixelEdits を pixelOps.applyPixelEdits の薄いラッパー化（呼び出し箇所は無修正）
- 特性化スナップショットでピクセル出力の完全一致を確認"
```

---

## Task 4: `playerSprites.ts` を pixelOps 委譲へ変更

**Files:**
- Modify: `src/features/ipne/presentation/sprites/playerSprites.ts`

- [ ] **Step 1: 現状の該当箇所を読む**

`playerSprites.ts` のヘルパー群（おおよそ84-175行）を確認する。
`type PixelEdit` / `clonePixels` / `applyPixelEdits`（削除対象）と、
`createSpriteDefinition` / `type RegionShift` / `shiftRegion` / `createVariant` / `mirrorPixels`（据え置き）の位置を把握する。
`shiftRegion` は内部で `clonePixels` を、`createVariant` は `shiftRegion` と `applyPixelEdits` を使う。

- [ ] **Step 2: 重複定義を削除し pixelOps から import**

`playerSprites.ts` で以下を実施:
1. `type PixelEdit = Readonly<{ ... }>;` を削除。
2. `function clonePixels(...) { ... }` を削除。
3. `function applyPixelEdits(...) { ... }` を削除。
4. ファイル冒頭の import 群（`SpriteDefinition` 等を import している箇所の近く）に追加:

```typescript
import { clonePixels, applyPixelEdits, type PixelEdit } from './pixelOps';
```

注意:
- `createSpriteDefinition`, `type RegionShift`, `shiftRegion`, `createVariant`, `mirrorPixels`,
  `createSheetWithDuration` は **削除しない**。
- `shiftRegion`（内部で `clonePixels` を2回呼ぶ）・`createVariant`（`applyPixelEdits` を呼ぶ）は、
  import した共有版を参照することになる（関数名は同じなので本体は無修正で動く）。
- `createVariant` のシグネチャ `edits: PixelEdit[] = []` は import した `PixelEdit` 型を参照する（無修正で可）。
- `mirrorPixels` は `clonePixels` を使わず独自実装（`base.map((row) => [...row].reverse())`）なので無変更。

- [ ] **Step 3: 特性化スナップショットが差分ゼロであることを確認**

Run: `npx jest __sprite_characterization 2>&1 | tail -10`
Expected: PASS（`2 passed`、既存スナップショットと一致）

- [ ] **Step 4: スプライト関連テスト全体を確認**

Run: `npx jest sprites 2>&1 | tail -8`
Expected: PASS

- [ ] **Step 5: 型チェック＆lint**

Run: `npm run typecheck 2>&1 | tail -3`（エラーなし）
Run: `npx eslint src/features/ipne/presentation/sprites/ 2>&1 | tail -10`（エラーなし、未使用 import があれば削除）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/presentation/sprites/playerSprites.ts
git commit -m "refactor: IPNE playerSprites を pixelOps 委譲へ変更

- PixelEdit 型・clonePixels・applyPixelEdits の二重定義を削除し pixelOps から import
- shiftRegion/createVariant 等の player 専用ヘルパーは据え置き（共有版を参照）
- 特性化スナップショットでピクセル出力の完全一致を確認"
```

---

## Task 5: 一時特性化テストを削除し最終検証

**Files:**
- Delete: `src/features/ipne/presentation/sprites/__sprite_characterization.test.ts`
- Delete: `src/features/ipne/presentation/sprites/__snapshots__/__sprite_characterization.test.ts.snap`

特性化テストは Phase B のための一時安全網。役目を終えたので削除し、恒久的負債を残さない。

- [ ] **Step 1: 一時テストとスナップショットを削除**

```bash
git rm src/features/ipne/presentation/sprites/__sprite_characterization.test.ts \
       src/features/ipne/presentation/sprites/__snapshots__/__sprite_characterization.test.ts.snap
```

> 注: `__snapshots__/` 配下に他のスナップショットが無く空になる場合、空ディレクトリは git 管理外なので放置で良い。

- [ ] **Step 2: スプライト全テスト（回帰確認）**

Run: `npx jest sprites 2>&1 | tail -8`
Expected: PASS（`pixelOps.test.ts` / `spriteData.test.ts` / `phase0c.test.ts` が green、特性化テストは消えている）

- [ ] **Step 3: IPNE 全テスト（回帰確認）**

Run: `npx jest ipne 2>&1 | tail -8`
Expected: PASS（IPNE 全スイート green）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -3`
Expected: エラーなし

- [ ] **Step 5: lint（警告ゼロ強制）**

Run: `npm run lint:ci 2>&1 | tail -10`
Expected: エラー・警告なし（exit 0）

- [ ] **Step 6: 重複が解消されたことを確認**

Run: `grep -rn "cloneEnemyPixels\|function clonePixels\|EnemyPixelEdit" src/features/ipne/presentation/sprites/ | grep -v pixelOps`
Expected: 出力なし（重複定義が残っていない）。`applyEnemyPixelEdits` の薄いラッパーは残ってよい。

- [ ] **Step 7: コミット**

```bash
git add -A src/features/ipne/presentation/sprites/
git commit -m "test: IPNE スプライト特性化スナップショットを削除（Phase B 完了）

- 生成プリミティブ共通化の前後でピクセル出力の完全一致を確認済み
- 一時安全網の役目を終えたため削除し恒久的負債を残さない
- Phase B（スプライト生成プリミティブ共通化）完了"
```

---

## 完了の定義（Definition of Done）

- [ ] `pixelOps.ts` に `PixelEdit` / `clonePixels` / `applyPixelEdits` が集約され、恒久ユニットテストがある
- [ ] `enemySprites.ts` / `playerSprites.ts` の重複定義（型・clone・apply）が削除されている
- [ ] `applyEnemyPixelEdits` は薄いラッパーになり、呼び出し箇所は無修正
- [ ] player 専用ヘルパー（mirror/shift/variant 等）は据え置き
- [ ] 公開 API（`index.ts` 再公開分）が不変、消費側は無修正
- [ ] リファクタ前後でスプライトのピクセル出力が完全一致（特性化テストで証明済み）
- [ ] 一時特性化テストとスナップショットが削除されている（負債ゼロ）
- [ ] `npm run typecheck` / `npm run lint:ci` / `npx jest sprites` / `npx jest ipne` 全パス
