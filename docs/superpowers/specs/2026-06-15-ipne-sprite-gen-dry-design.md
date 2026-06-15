# IPNE スプライト生成プリミティブの共通化 設計（Phase B）

- 日付: 2026-06-15
- 対象: `src/features/ipne/presentation/sprites/`
- 種別: リファクタリング（**振る舞い不変**・DRY 解消）
- 位置づけ: IPNE 包括リファクタリング・ロードマップの **Phase B**

## 1. 背景と目的

`enemySprites.ts`（2507行）と `playerSprites.ts`（2250行）は、いずれも「コードスプライト方式」
（外部画像を使わず TypeScript の2次元配列でドット絵を定義）でスプライトを生成している。
両ファイルに **構造的に同一なピクセル編集プリミティブが二重定義**されている。

| 重複要素 | enemySprites.ts | playerSprites.ts |
|---------|-----------------|------------------|
| 編集型 | `EnemyPixelEdit`（`Readonly<{x,y,value}>`） | `PixelEdit`（同一定義） |
| ピクセル複製 | `cloneEnemyPixels`（`pixels.map(row => [...row])`） | `clonePixels`（同一実装） |
| 編集適用 | `applyEnemyPixelEdits`（`SpriteDefinition` を受け、内部で clone+edit） | `applyPixelEdits`（`number[][]` を受け clone+edit） |

本作業の目的:

1. この **3要素を単一の共有モジュール `pixelOps.ts` に集約**し、二重定義を解消する。
2. 公開 API・スプライトのピクセル出力を **一切変えない**（純粋な DRY リファクタリング）。

### 非目標（YAGNI）

- **player 専用ヘルパーの移動はしない。** `mirrorPixels` / `shiftRegion` / `createVariant` /
  `createSheetWithDuration` / `createSpriteDefinition`（および `RegionShift` 型）は
  `enemySprites.ts` から一切使われていない（grep 一致 0）ため、重複ではない。
  「中央集約のためだけ」に動かすのは過剰。`playerSprites.ts` に据え置く。
- **巨大ファイルの分割はしない。** 敵タイプ別ファイルへの分割は別軸の作業。本フェーズでは扱わない。
- **データ本体（ピクセル配列・PALETTE 定数・frameDuration 値）の変更はしない。**

## 2. 現状調査の要点

- `EnemyPixelEdit` と `PixelEdit` は **完全に同一の構造**（`Readonly<{ x: number; y: number; value: number }>`）。
- `cloneEnemyPixels` と `clonePixels` は **完全に同一の実装**（`pixels.map((row) => [...row])`）。
- `applyEnemyPixelEdits(base: SpriteDefinition, edits)` は `base.pixels` を clone し、各 edit を適用して
  `{ ...base, pixels }` を返す。`playerSprites` の `applyPixelEdits(base: number[][], edits)` は
  raw ピクセルに対して同じ clone+edit を行う。**コアロジックは同一**。
- `enemySprites.ts` は `mirror`/`shift`/`createVariant`/`createSheetWithDuration` を **使用しない**。
- 公開 API は `sprites/index.ts` 経由の SPRITE_SHEET 定数・FRAME 定数・getter 群。
  ピクセル編集ヘルパー（`applyXxx`/`cloneXxx`）は **非公開**（index.ts に無い）。
- 既存テスト: `phase0c.test.ts`（309行）が **フレーム数・frameDuration・寸法・パレットインデックス有効性**を
  検証。ただし **ピクセル内容の完全一致は未検証**（安全網の穴）。`spriteData.test.ts` は共有基盤
  （`createSprite`/`hexToRgba`/`SPRITE_SIZES`）をテスト。

## 3. 共通化後の構造

### 新モジュール `pixelOps.ts`（単一責務: ピクセルグリッド編集プリミティブ）

```typescript
/**
 * ピクセルグリッド編集プリミティブ
 *
 * コードスプライト（2次元パレットインデックス配列）への編集操作を提供する。
 * スプライトの定義・レンダリングは spriteData.ts、これは「ピクセル配列そのものの操作」に特化。
 */

/** ピクセル1点の編集（パレットインデックスの上書き） */
export type PixelEdit = Readonly<{ x: number; y: number; value: number }>;

/** ピクセル配列を深く複製する（行ごとにコピー） */
export const clonePixels = (pixels: number[][]): number[][] =>
  pixels.map((row) => [...row]);

/**
 * ピクセル配列に編集列を適用した新しい配列を返す（非破壊）。
 * 範囲外の座標は無視する（既存挙動を踏襲）。
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

> 配置: `src/features/ipne/presentation/sprites/pixelOps.ts`。
> `index.ts` には追加しない（内部生成ヘルパーのため非公開を維持）。

### `enemySprites.ts` の変更

- ローカルの `EnemyPixelEdit` 型と `cloneEnemyPixels` を削除。
- `applyEnemyPixelEdits` を **薄いラッパー**に置換（呼び出し箇所 `applyEnemyPixelEdits(base, [...])` は全て無修正）:

```typescript
import { applyPixelEdits, type PixelEdit } from './pixelOps';

const applyEnemyPixelEdits = (base: SpriteDefinition, edits: readonly PixelEdit[]): SpriteDefinition => ({
  ...base,
  pixels: applyPixelEdits(base.pixels, edits),
});
```

### `playerSprites.ts` の変更

- ローカルの `PixelEdit` 型・`clonePixels`・`applyPixelEdits` を削除し、`pixelOps` から import。
- `mirrorPixels` / `shiftRegion` / `createVariant` / `createSheetWithDuration` / `createSpriteDefinition`
  は **据え置き**。内部で旧ローカル `clonePixels`/`applyPixelEdits` を使っていた箇所は、import 済みの
  共有版を参照するように調整する（挙動不変）。

### 依存方向（循環なし）

```
pixelOps.ts （最内・他に依存しない）
   ↑                ↑
enemySprites.ts   playerSprites.ts
```

## 4. 安全網（ピクセル出力の同一性証明）

生成プリミティブをいじるため、「全スプライトのピクセル出力が1点も変わらない」ことを機械的に証明する。
既存 `phase0c.test.ts` は構造（フレーム数・duration・寸法・パレット有効性）を守るが、ピクセル内容は未検証。

- **一時的な特性化スナップショットテスト** `__snapshot_characterization.test.ts` を追加する。
  - `index.ts` が公開する全 SPRITE_SHEET / FRAME / getter 結果のピクセル配列を `toMatchSnapshot()` で捕捉。
  - リファクタ **前** に実行してスナップショットを生成（baseline 確定）。
  - リファクタ **後** に再実行し、**スナップショット差分ゼロ**を確認。
  - Phase B 完了後に **このテストとスナップショットファイルを削除**する
    （testing.md「スナップショットの過度な使用を避ける」に配慮し、恒久的負債を残さない）。
- 加えて全工程で `phase0c.test.ts` / `spriteData.test.ts` が緑であること。

## 5. 検証手順（refactor-safely）

1. `pixelOps.ts` を作成（プリミティブのみ）。
2. 特性化スナップショットテストを追加し、リファクタ前に baseline を生成・コミット。
3. `enemySprites.ts` を共有プリミティブ利用へ変更 → スナップショット差分ゼロ + 全テスト緑を確認。
4. `playerSprites.ts` を共有プリミティブ利用へ変更 → スナップショット差分ゼロ + 全テスト緑を確認。
5. 特性化スナップショットテストとスナップショットファイルを削除。
6. 最終確認: `npm run typecheck` / `npm run lint:ci` / `npx jest sprites` 全パス。

各ステップごとに以下を実行:

```bash
npx jest sprites              # spriteData / phase0c / 一時特性化テスト
npm run typecheck
```

### 完了の定義（Definition of Done）

- [ ] `pixelOps.ts` に `PixelEdit` / `clonePixels` / `applyPixelEdits` が集約されている
- [ ] `enemySprites.ts` / `playerSprites.ts` の重複定義（型・clone・apply）が削除されている
- [ ] `applyEnemyPixelEdits` は薄いラッパーになり、呼び出し箇所は無修正
- [ ] player 専用ヘルパー（mirror/shift/variant 等）は据え置き
- [ ] 公開 API（`index.ts` 再公開分）が不変、消費側は無修正
- [ ] リファクタ前後でスプライトのピクセル出力が完全一致（特性化テストで証明）
- [ ] 一時特性化テストが削除されている（負債ゼロ）
- [ ] `npm run typecheck` / `npm run lint:ci` / `npx jest sprites` 全パス

## 6. リスクと緩和

| リスク | 緩和策 |
|--------|--------|
| ヘルパー置換でピクセル出力が変わる | 特性化スナップショットで差分ゼロを機械的に証明。ロジックは逐語的に同一移植 |
| `applyEnemyPixelEdits` ラッパー化で範囲外座標の扱いが変わる | 共有 `applyPixelEdits` の境界チェック（`next[y] && next[y][x] !== undefined`）を元実装から逐語移植 |
| player 専用ヘルパーの内部参照が壊れる | import 切り替え後に typecheck と全 sprites テストで検出 |
| 公開 API の欠落 | `index.ts` は無変更。typecheck と既存テストで担保 |
