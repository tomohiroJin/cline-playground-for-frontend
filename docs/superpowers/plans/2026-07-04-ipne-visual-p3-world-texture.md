# IPNE Phase 3「ワールドの質感」実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 床タイルのバリエーション・プレイヤー光円＋ヴィネット＋ステージ別アンビエント・グリッド線抑制で、ワールドの平板さを解消する（スペック: `docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md` の Phase 3）。あわせて Phase 2 繰延の ATTACK 分岐重複を統合する。

**Architecture:** すべて `presentation/` 層で完結。タイルバリアントは「ステージごとに固定の SpriteDefinition 配列をメモ化生成 → 決定論的座標ハッシュで index 選択」方式（spriteRenderer のキャッシュがオブジェクト参照ベースのため、参照固定が必須）。環境演出は drawOverlays 冒頭（シェイク変換内・HUD 警告より下層）に挿入し、既存の低HP警告ビネット（createRadialGradient）を雛形にする。

**Tech Stack:** React 19 + Canvas 2D + Jest 30。

## Global Constraints

- ブランチ: `feature/ipne-visual-p3`（作成済み・origin/main 起点、Phase 1/2 マージ済み）
- `domain/` / `application/` 変更禁止（`StageNumber` 型等の参照は可）
- `any` 禁止。コメント日本語。純粋関数（ハッシュ・バリアント選択・アンビエント設定）は TDD
- **タイルスプライトの参照固定**: 描画ループ内で新しい SpriteDefinition オブジェクトを生成しない（spriteRenderer.ts:49-64 の WeakMap キャッシュが参照同一性で判定するため。バリアントはモジュールレベルでメモ化）
- 各タスク完了時コミット。最終タスクで `npm run ci` 全パス
- Phase 1/2 の前提を壊さない: rAF ループ、凍結 visualNow、補間位置、進行度ベースフレーム選択

## 既存コードの前提知識（全タスク共通）

- `presentation/sprites/tileSprites.ts`: `FLOOR_SPRITE`/`WALL_SPRITE` は 32×32 の SpriteDefinition（pixels は行ごと配列・`// y=N` コメント付き）。`STAGE_PALETTES: Record<StageNumber, {floor: string[]; wall: string[]}>`（227-233行）、`getStageFloorSprite(stage)` は `{...FLOOR_SPRITE, palette: ...}` を毎回新規生成（238-253行）。**tileSprites.test.ts は存在しない**（新規作成）
- floor パレットは4要素（index 0 透明 + 3色）: S1 茶 / S2 灰 / S3 青緑 / S4 紫 / S5 深紅
- `presentation/sprites/pixelOps.ts`: `applyPixelEdits(pixels, edits)`（`PixelEdit = {x, y, value}`）が既存
- `drawWorld.ts` タイルループ（77-107行）: 床は `spriteRenderer.drawSprite(ctx, stageFloor, ...)`。グリッド線は 101-105 行の `strokeStyle = 'rgba(255,255,255,0.1)'` + `strokeRect`
- `renderGameFrame.ts`: `stageFloor`/`stageWall` を `getStageFloorSprite(currentStage)` で取得し FrameContext へ（毎フレーム呼ぶと新参照になる点に注意 — 現状の挙動を確認し、バリアント配列はメモ化ゲッターで参照固定する）
- `drawOverlays.ts` の描画順: ①低HP警告ビネット（72-86行、`createRadialGradient` の雛形）②コンボ ③ボスWARNING ④シェイク restore（185-188行）⑤ゲームオーバー暗転 ⑥ステージ開始演出 ⑦自動マップ ⑧デバッグ。光円・ヴィネットは**①の前**（シェイク変換内＝ワールド追従、HUD 警告より下層）に挿入
- `frame.playerScreen` はシェイク変換内のワールド座標系。`canvas.width/height` 使用可
- 決定論的ハッシュ関数はリポジトリに存在しない（新設）
- Phase 2 繰延: `drawEnemies.ts` の `getEnemyStateFrame` ATTACK switch と `selectEnemyAttackFrame` の7分岐重複（前者の ATTACK 側は実質デッドパス）

---

### Task 1: 決定論的座標ハッシュとバリアント選択（TDD）

**Files:**
- Create: `src/features/ipne/presentation/sprites/tileVariation.ts`
- Test: `src/features/ipne/presentation/sprites/tileVariation.test.ts`

**Interfaces:**
- Produces: `hashTileCoord(x: number, y: number): number`（決定論的・非負整数）、`selectTileVariantIndex(x: number, y: number, variantCount: number): number`（0..variantCount-1）。Task 2 が使用

- [ ] **Step 1: 失敗するテストを書く**

```typescript
/**
 * タイルバリエーション選択のテスト
 */
import { hashTileCoord, selectTileVariantIndex } from './tileVariation';

describe('hashTileCoord', () => {
  it('決定論的（同じ座標で常に同じ値）', () => {
    expect(hashTileCoord(3, 7)).toBe(hashTileCoord(3, 7));
    expect(hashTileCoord(0, 0)).toBe(hashTileCoord(0, 0));
  });

  it('非負整数を返す', () => {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const h = hashTileCoord(x, y);
        expect(Number.isInteger(h)).toBe(true);
        expect(h).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('隣接座標で値が変わる（縞模様にならない）', () => {
    expect(hashTileCoord(5, 5)).not.toBe(hashTileCoord(6, 5));
    expect(hashTileCoord(5, 5)).not.toBe(hashTileCoord(5, 6));
  });
});

describe('selectTileVariantIndex', () => {
  it('0..variantCount-1 の範囲を返す', () => {
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const i = selectTileVariantIndex(x, y, 3);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(3);
      }
    }
  });

  it('40×40 マップで全バリアントが出現する', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        seen.add(selectTileVariantIndex(x, y, 3));
      }
    }
    expect(seen.size).toBe(3);
  });

  it('ベース（index 0）が過半数を占める（装飾は控えめ）', () => {
    let baseCount = 0;
    const total = 40 * 40;
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        if (selectTileVariantIndex(x, y, 3) === 0) baseCount++;
      }
    }
    expect(baseCount / total).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: RED 確認 → 実装 → GREEN**

Run: `npm test -- src/features/ipne/presentation/sprites/tileVariation.test.ts` → FAIL 確認後、実装:

```typescript
/**
 * タイルバリエーション選択（決定論的座標ハッシュ）
 *
 * 床タイルの単調さを解消するため、座標から決定論的にバリアントを選ぶ。
 * Math.random は使わない（毎フレーム同じタイルが同じ見た目である必要があるため）。
 */

/** 装飾タイルの出現率（1 - これ がベースタイルの率）。控えめに 3 割 */
const DECORATION_RATE = 0.3;

/**
 * 2次元整数座標の決定論的ハッシュ（非負 32bit 整数）。
 * 大きな素数の乗算 + XOR で隣接座標の相関を崩す定番手法。
 */
export function hashTileCoord(x: number, y: number): number {
  const h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
  return h >>> 0;
}

/**
 * 座標からタイルバリアントの index を選ぶ。
 * ベース（0）が過半数、残りを装飾バリアント（1..variantCount-1）で等分する。
 */
export function selectTileVariantIndex(x: number, y: number, variantCount: number): number {
  if (variantCount <= 1) return 0;
  const h = hashTileCoord(x, y);
  const roll = (h % 1000) / 1000;
  if (roll >= DECORATION_RATE) return 0;
  return 1 + (Math.floor(h / 1000) % (variantCount - 1));
}
```

Run: 同テスト → PASS

- [ ] **Step 3: コミット**

```bash
git add src/features/ipne/presentation/sprites/tileVariation.ts src/features/ipne/presentation/sprites/tileVariation.test.ts
git commit -m "feat(ipne): 決定論的座標ハッシュによるタイルバリアント選択を追加

- Math.imul + XOR の座標ハッシュ（毎フレーム同一タイル同一見た目を保証）
- ベース7割・装飾3割の選択関数を TDD で実装"
```

---

### Task 2: 床タイルバリアント生成と drawWorld 配線＋グリッド線抑制

**Files:**
- Modify: `src/features/ipne/presentation/sprites/tileSprites.ts`（バリアント生成・メモ化）
- Modify: `src/features/ipne/presentation/sprites/index.ts`（export 追加）
- Modify: `src/features/ipne/presentation/screens/render/renderContext.ts`（FrameContext に配列追加）
- Modify: `src/features/ipne/presentation/screens/render/renderGameFrame.ts`（配列取得）
- Modify: `src/features/ipne/presentation/screens/render/drawWorld.ts`（床の分岐＋グリッド線）
- Test: `src/features/ipne/presentation/sprites/tileSprites.test.ts`（新規）

**Interfaces:**
- Consumes: Task 1 の `selectTileVariantIndex`、既存 `applyPixelEdits`（pixelOps.ts）、`STAGE_PALETTES`
- Produces: `getStageFloorVariants(stage: StageNumber): readonly SpriteDefinition[]`（長さ3・**メモ化済み＝同じ stage で常に同一参照**）。`FrameContext.stageFloorVariants: readonly SpriteDefinition[]`

- [ ] **Step 1: 失敗するテストを書く（tileSprites.test.ts 新規）**

```typescript
/**
 * タイルスプライトのテスト（バリアント生成・メモ化）
 */
import { getStageFloorVariants, getStageFloorSprite } from './tileSprites';
import type { StageNumber } from '../../domain/types/stage';

const STAGES: StageNumber[] = [1, 2, 3, 4, 5];

describe('getStageFloorVariants', () => {
  it.each(STAGES)('S%d: 3バリアントで、サイズ・パレットがベースと一致する', (stage) => {
    const variants = getStageFloorVariants(stage);
    const base = getStageFloorSprite(stage);
    expect(variants).toHaveLength(3);
    for (const v of variants) {
      expect(v.width).toBe(base.width);
      expect(v.height).toBe(base.height);
      expect(v.palette).toEqual(base.palette);
    }
  });

  it.each(STAGES)('S%d: 装飾バリアントはベースとピクセルが異なり、互いにも異なる', (stage) => {
    const [v0, v1, v2] = getStageFloorVariants(stage);
    expect(v1.pixels).not.toEqual(v0.pixels);
    expect(v2.pixels).not.toEqual(v0.pixels);
    expect(v1.pixels).not.toEqual(v2.pixels);
  });

  it.each(STAGES)('S%d: 装飾の差分は控えめ（1〜24ピクセル）', (stage) => {
    const [v0, v1, v2] = getStageFloorVariants(stage);
    for (const v of [v1, v2]) {
      let diff = 0;
      for (let y = 0; y < v0.height; y++)
        for (let x = 0; x < v0.width; x++)
          if (v.pixels[y][x] !== v0.pixels[y][x]) diff++;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThanOrEqual(24);
    }
  });

  it('メモ化: 同じ stage で常に同一の配列・要素参照を返す（描画キャッシュ前提）', () => {
    const a = getStageFloorVariants(3);
    const b = getStageFloorVariants(3);
    expect(a).toBe(b);
    expect(a[1]).toBe(b[1]);
  });

  it('全ピクセル値がパレット範囲内', () => {
    for (const stage of STAGES) {
      for (const v of getStageFloorVariants(stage)) {
        for (const row of v.pixels)
          for (const p of row) {
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThan(v.palette.length);
          }
      }
    }
  });
});
```

- [ ] **Step 2: RED 確認 → tileSprites.ts に実装 → GREEN**

実装方針:
- ステージ別装飾の PixelEdit 配列を定義（各 8〜20 edits、床パレットの index 1〜3 のみ使用）: S1 小石（明色の点2〜3個の塊）／S2 石畳の欠け（暗色の点）／S3 水晶片（明色の斜め2連点）／S4 ルーン紋（点対称の4点）／S5 亀裂（斜めの暗色3連点）。バリアント1とバリアント2は配置位置を変える
- 生成とメモ化:

```typescript
/** ステージ別床バリアントのキャッシュ（参照固定が描画キャッシュの前提） */
const floorVariantsCache = new Map<StageNumber, readonly SpriteDefinition[]>();

/**
 * ステージ別の床タイルバリアント（[ベース, 装飾A, 装飾B]）を返す。
 * 同じ stage では常に同一参照を返す（spriteRenderer の WeakMap キャッシュを効かせるため）。
 */
export function getStageFloorVariants(stage: StageNumber): readonly SpriteDefinition[] {
  const cached = floorVariantsCache.get(stage);
  if (cached) return cached;
  const base = getStageFloorSprite(stage);
  const variants: readonly SpriteDefinition[] = [
    base,
    { ...base, pixels: applyPixelEdits(FLOOR_SPRITE.pixels, STAGE_FLOOR_DECOR_EDITS[stage][0]) },
    { ...base, pixels: applyPixelEdits(FLOOR_SPRITE.pixels, STAGE_FLOOR_DECOR_EDITS[stage][1]) },
  ];
  floorVariantsCache.set(stage, variants);
  return variants;
}
```

（`applyPixelEdits` の import は pixelOps から。edits 定数 `STAGE_FLOOR_DECOR_EDITS: Record<StageNumber, readonly [readonly PixelEdit[], readonly PixelEdit[]]>` を tileSprites.ts 内に定義）

- [ ] **Step 3: FrameContext・renderGameFrame・drawWorld の配線**

- `renderContext.ts` FrameContext に追加: `/** ステージ別床タイルバリアント（メモ化済み参照） */ stageFloorVariants: readonly SpriteDefinition[];`
- `renderGameFrame.ts`: `const stageFloorVariants = currentStage ? getStageFloorVariants(currentStage) : [stageFloor];` を stageFloor 取得の直後に追加し、frame へ渡す
- `drawWorld.ts` の床分岐（else 節）を変更:

```typescript
      } else {
        // 床: 座標ハッシュでバリアントを選択（決定論的・キャッシュ済み参照）
        const variant = stageFloorVariants[
          selectTileVariantIndex(worldX, worldY, stageFloorVariants.length)
        ];
        spriteRenderer.drawSprite(ctx, variant, tileDrawX, tileDrawY, spriteScale);
      }
```

- グリッド線（101-105行）を大幅に淡く: `'rgba(255, 255, 255, 0.1)'` → `'rgba(255, 255, 255, 0.03)'`（コメント: 目地は床スプライトが担うため補助線は気配程度に）

- [ ] **Step 4: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): 床タイルのステージ別バリエーションを追加

- 座標ハッシュで3バリアント（ベース/装飾A/装飾B）を決定論的に配置
- S1小石/S2欠け/S3水晶片/S4ルーン/S5亀裂のステージ別装飾
- バリアントはメモ化して参照固定（描画キャッシュ維持）
- グリッド線を気配程度（alpha 0.03）に抑制"
```

---

### Task 3: 光円・ヴィネット・ステージ別アンビエント

**Files:**
- Create: `src/features/ipne/presentation/effects/ambientLight.ts`
- Test: `src/features/ipne/presentation/effects/ambientLight.test.ts`
- Modify: `src/features/ipne/presentation/screens/render/drawOverlays.ts`（冒頭に挿入）

**Interfaces:**
- Consumes: `frame.playerScreen`（シェイク変換内座標）、`canvas.width/height`、`currentStage`
- Produces: `getStageAmbient(stage: StageNumber | undefined): StageAmbient`（純粋・TDD）、`drawAmbientOverlay(ctx, width, height, playerX, playerY, ambient): void`（Canvas 描画）

- [ ] **Step 1: 失敗するテストを書く（設定関数のみ TDD）**

```typescript
/**
 * ステージ別アンビエント設定のテスト
 */
import { getStageAmbient } from './ambientLight';

describe('getStageAmbient', () => {
  it('全ステージで光半径比・ヴィネット強度・色が妥当な範囲', () => {
    for (const stage of [1, 2, 3, 4, 5] as const) {
      const a = getStageAmbient(stage);
      expect(a.lightRadiusRatio).toBeGreaterThan(0.2);
      expect(a.lightRadiusRatio).toBeLessThanOrEqual(1);
      expect(a.vignetteAlpha).toBeGreaterThanOrEqual(0);
      expect(a.vignetteAlpha).toBeLessThanOrEqual(0.6);
      expect(a.tintAlpha).toBeGreaterThanOrEqual(0);
      expect(a.tintAlpha).toBeLessThanOrEqual(0.12);
      expect(a.tintColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('S4（闇）は他ステージより光円が狭くヴィネットが強い', () => {
    const dark = getStageAmbient(4);
    for (const stage of [1, 2, 3, 5] as const) {
      const other = getStageAmbient(stage);
      expect(dark.lightRadiusRatio).toBeLessThan(other.lightRadiusRatio);
      expect(dark.vignetteAlpha).toBeGreaterThanOrEqual(other.vignetteAlpha);
    }
  });

  it('stage 未指定はデフォルト（S2 相当）を返す', () => {
    expect(getStageAmbient(undefined)).toEqual(getStageAmbient(2));
  });
});
```

- [ ] **Step 2: RED 確認 → 実装 → GREEN**

```typescript
/**
 * 環境光・ヴィネット演出
 *
 * プレイヤー中心の光の減衰（ヴィネット）とステージ別の色調オーバーレイで
 * 平板だったワールドに奥行きと雰囲気を与える。drawOverlays の冒頭
 * （シェイク変換内・HUD 警告より下層）から呼ばれる。
 */
import type { StageNumber } from '../../domain/types/stage';

/** ステージ別アンビエント設定 */
export interface StageAmbient {
  /** 光円半径（キャンバス短辺に対する比率）。小さいほど暗所感が増す */
  lightRadiusRatio: number;
  /** 画面端の暗さ（0..1） */
  vignetteAlpha: number;
  /** ステージ色調オーバーレイの色 */
  tintColor: string;
  /** 色調オーバーレイの強さ（ごく薄く） */
  tintAlpha: number;
}

const STAGE_AMBIENTS: Record<StageNumber, StageAmbient> = {
  1: { lightRadiusRatio: 0.85, vignetteAlpha: 0.22, tintColor: '#8a6a3a', tintAlpha: 0.05 },
  2: { lightRadiusRatio: 0.85, vignetteAlpha: 0.22, tintColor: '#4b5563', tintAlpha: 0.03 },
  3: { lightRadiusRatio: 0.8, vignetteAlpha: 0.25, tintColor: '#1a8a8a', tintAlpha: 0.05 },
  4: { lightRadiusRatio: 0.55, vignetteAlpha: 0.4, tintColor: '#3d2470', tintAlpha: 0.06 },
  5: { lightRadiusRatio: 0.7, vignetteAlpha: 0.3, tintColor: '#8a2e2e', tintAlpha: 0.06 },
};

/** ステージ別アンビエント設定を返す（未指定はデフォルト＝S2 相当） */
export function getStageAmbient(stage: StageNumber | undefined): StageAmbient {
  return STAGE_AMBIENTS[stage ?? 2];
}

/**
 * 光円＋ヴィネット＋色調オーバーレイを描画する。
 * プレイヤー中心の透明領域から画面端に向けて暗くなるラジアルグラデーション。
 */
export function drawAmbientOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerX: number,
  playerY: number,
  ambient: StageAmbient
): void {
  const lightRadius = Math.min(width, height) * ambient.lightRadiusRatio;
  const outerRadius = Math.hypot(width, height);

  ctx.save();

  // 色調オーバーレイ（ごく薄いステージカラー）
  if (ambient.tintAlpha > 0) {
    ctx.globalAlpha = ambient.tintAlpha;
    ctx.fillStyle = ambient.tintColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 光円＋ヴィネット（プレイヤー周辺は透明、外周に向けて暗く）
  const gradient = ctx.createRadialGradient(
    playerX, playerY, lightRadius * 0.45,
    playerX, playerY, outerRadius
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${ambient.vignetteAlpha})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
```

- [ ] **Step 3: drawOverlays へ挿入**

`drawOverlays.ts` の冒頭（低HP警告の前）に追加。全体マップ表示（useFullMap）とデバッグ全体表示では描かない:

```typescript
  // 環境光・ヴィネット（ワールド追従＝シェイク変換内。HUD 警告より下層）
  if (!useFullMap) {
    drawAmbientOverlay(
      ctx, canvas.width, canvas.height,
      playerScreen.x, playerScreen.y,
      getStageAmbient(currentStage)
    );
  }
```

（`useFullMap` / `playerScreen` / `currentStage` / `canvas` は FrameContext から分割代入に追加。import 追加）

- [ ] **Step 4: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS

```bash
git add -A src/features/ipne
git commit -m "feat(ipne): プレイヤー光円・ヴィネット・ステージ色調を追加

- プレイヤー中心のラジアルグラデーションで光の減衰を表現
- S4（闇）は光円を狭く・ヴィネットを強くして緊張感を演出
- ステージ別のごく薄い色調オーバーレイ（S1暖色〜S5深紅）
- シェイク変換内・HUD警告より下層に描画（全体マップ表示では無効）"
```

---

### Task 4: ATTACK 分岐の重複統合（Phase 2 繰延クリーンアップ）

**Files:**
- Modify: `src/features/ipne/presentation/screens/render/drawEnemies.ts`
- Test: `src/features/ipne/presentation/screens/render/drawEnemies.test.ts`（既存の期待値調整）

**Interfaces:**
- Consumes: 既存 `selectEnemyAttackFrame(type, progress)`（progress ≥ ENEMY_WINDUP_RATIO で攻撃フレーム）
- Produces: `getEnemyStateFrame` から ATTACK switch を削除（KNOCKBACK 専用化）。`attackAnimUntil` undefined 時のフォールバックは `selectEnemyAttackFrame(enemy.type, 1)`（=攻撃フレーム、従来の静的表示と同一の見た目）

- [ ] **Step 1: 既存テストの期待を確認し、リファクタ後の期待に更新（振る舞い不変）**

`getEnemyStateFrame(type, ATTACK)` を直接テストしている箇所があれば `selectEnemyAttackFrame(type, 1)` ベースの期待に書き換え。**返るフレームオブジェクトは同一**（`*_ATTACK_FRAME`）なので描画結果は不変であることをテストで固定する:

```typescript
it('attackAnimUntil 未設定の ATTACK は攻撃フレームにフォールバックする（従来挙動の保存）', () => {
  expect(selectEnemyAttackFrame(EnemyType.PATROL, 1)).toBe(PATROL_ATTACK_FRAME);
});
```

- [ ] **Step 2: drawEnemies をリファクタ**

- `getEnemyStateFrame` の `if (enemyState === EnemyState.ATTACK) { switch ... }` ブロックを削除し、KNOCKBACK 専用に（関数コメントも更新）
- 呼び出し側の ATTACK フォールバック（`attackAnimUntil === undefined` の分岐）を `selectEnemyAttackFrame(enemy.type, 1)` に変更
- 7分岐の switch が1箇所（`selectEnemyAttackFrame`）に集約されることを確認

- [ ] **Step 3: 回帰確認とコミット**

Run: `npm run typecheck && npm test -- src/features/ipne`
Expected: PASS（描画挙動は不変）

```bash
git add -A src/features/ipne
git commit -m "refactor(ipne): 敵 ATTACK フレーム分岐の重複を selectEnemyAttackFrame に統合

- getEnemyStateFrame を KNOCKBACK 専用化（ATTACK 側は実質デッドパスだった）
- attackAnimUntil 未設定時は selectEnemyAttackFrame(type, 1) にフォールバック（挙動不変）"
```

---

### Task 5: 全体検証と PR 作成

**Files:** なし（検証のみ）

- [ ] **Step 1: CI パイプライン全体を実行**

Run: `npm run ci`
Expected: 全パス

- [ ] **Step 2: プッシュして PR 作成**

```bash
git push -u origin feature/ipne-visual-p3
gh pr create --title "feat(ipne): ワールドの質感向上（タイルバリエーション・光円ヴィネット・グリッド線抑制）" --body "$(cat <<'EOF'
## 概要
IPNE ビジュアル・モーション ブラッシュアップ Phase 3（最終フェーズ。設計: docs/superpowers/specs/2026-07-02-ipne-visual-motion-brushup-design.md）。
床タイルの単調さと環境演出の欠如を解消し、ワールドに奥行きと雰囲気を与える。

## 変更内容
- 床タイルに座標ハッシュで決定論的な3バリアント配置（S1小石/S2欠け/S3水晶片/S4ルーン/S5亀裂）
- プレイヤー中心の光円＋ヴィネット＋ステージ別色調オーバーレイ（S4闇は光円を狭く）
- グリッド線を気配程度（alpha 0.03）に抑制
- Phase 2 繰延: 敵 ATTACK フレーム分岐の重複を統合（挙動不変のリファクタ）
- バリアントスプライトはメモ化で参照固定（描画キャッシュ維持）

## テスト方法
- [ ] npm run ci（lint:ci / typecheck / test / build）
- [ ] CI 上の E2E パス
- [ ] 手動確認: 各ステージの床バリエーション・光円/ヴィネットの見え方・S4の暗所感・全体マップ表示の無変化

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## リスクと注意点（実装者向け）

1. **参照固定が最重要**: spriteRenderer のキャッシュは `WeakMap<SpriteDefinition, id>` の参照ベース。描画ループ内・毎フレームの新規オブジェクト生成は禁止（メモ化テストで担保）
2. **床パレット index は 0〜3 のみ**: 装飾 edits の value は床パレット長（4）未満に。Phase 2 のパレット範囲検証と同様のテストを入れている
3. **光円の座標系**: `playerScreen` はシェイク変換内の座標。drawOverlays のシェイク restore（185-188行）より**前**に描くこと（後に描くと被弾シェイク時に光円だけ画面固定になり浮く）
4. **ステージイントロとの重なり**: 開始500msの黒フェードは光円より後段で描かれるため干渉しない（順序を変えないこと）
5. **全体マップ・デバッグ表示**: `useFullMap` では環境演出・バリアント選択とも従来表示を維持（バリアントは選択関数が全タイルに掛かるが決定論的なので可。環境演出のみ skip）
6. **GOAL/START タイルは対象外**: バリアント選択は床（else 節）のみ。WALL も現状維持
