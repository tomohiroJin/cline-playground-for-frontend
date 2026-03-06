# IPNE ブラッシュアップ — 仕様書

## 目次

0A. [レスポンシブCanvas化 + HUDレイアウト再設計](#0a-レスポンシブcanvas化--hudレイアウト再設計)
0B. [スプライト解像度アップ（16→32）](#0b-スプライト解像度アップ1632)
1. [パワーオーラシステム](#1-パワーオーラシステム)
2. [武器エフェクト強化](#2-武器エフェクト強化)
3. [フローティングダメージ](#3-フローティングダメージ)
4. [攻撃ヒットエフェクトスケーリング](#4-攻撃ヒットエフェクトスケーリング)
5. [コンボシステム](#5-コンボシステム)
6. [敵撃破演出強化](#6-敵撃破演出強化)
7. [ボス戦演出強化](#7-ボス戦演出強化)
8. [ステージ別BGM](#8-ステージ別bgm)
9. [レベルアップ演出強化](#9-レベルアップ演出強化)
10. [探索報酬フィードバック強化](#10-探索報酬フィードバック強化)
11. [画面遷移演出改善](#11-画面遷移演出改善)
12. [ステージ進行見た目変化](#12-ステージ進行見た目変化)

---

## 0A. レスポンシブCanvas化 + HUDレイアウト再設計

### 0A.1 概要

Canvas を固定サイズ（720x528px）からレスポンシブサイズに変更し、画面を最大限活用する。同時に、FloatingHomeButton と HUD 要素の重なり問題を解消する。

### 0A.2 現状の問題

```
Canvas = 720×528px（固定）
tileSize = 48px（固定）
padding-top = 80px（ヘッダー非表示なのに空白）
FloatingHomeButton: top:12px, left:12px, z-index:200
HPバー: Canvas内 top:1rem, left:1rem → ホームボタンと重なる
```

**問題点**:
- フルHD（1920×1080）で画面の37%しか使わない
- ホームボタンとHPバーが左上で競合し、視認性・操作性が低下

### 0A.3 viewport.ts のリファクタリング

**ファイル**: `src/features/ipne/viewport.ts`

```typescript
// 変更前: 固定値
export const VIEWPORT_CONFIG = {
  tilesX: 15,
  tilesY: 11,
  tileSize: 48,
} as const;

export function getCanvasSize(): { width: number; height: number } {
  return {
    width: VIEWPORT_CONFIG.tilesX * VIEWPORT_CONFIG.tileSize,  // 720
    height: VIEWPORT_CONFIG.tilesY * VIEWPORT_CONFIG.tileSize,  // 528
  };
}

// 変更後: タイル数のみ固定、tileSize は動的計算
export const VIEWPORT_CONFIG = {
  tilesX: 15,
  tilesY: 11,
  minTileSize: 32,
  maxTileSize: 128,
} as const;

/**
 * 利用可能な領域からタイルサイズを計算する
 * @param availableWidth - コンテナの幅（px）
 * @param availableHeight - コンテナの高さ（px）
 * @returns 最適な tileSize（px、整数値）
 */
export function calculateTileSize(
  availableWidth: number,
  availableHeight: number
): number {
  const rawTileW = availableWidth / VIEWPORT_CONFIG.tilesX;
  const rawTileH = availableHeight / VIEWPORT_CONFIG.tilesY;
  const rawTile = Math.floor(Math.min(rawTileW, rawTileH));
  return Math.max(
    VIEWPORT_CONFIG.minTileSize,
    Math.min(VIEWPORT_CONFIG.maxTileSize, rawTile)
  );
}

/**
 * tileSize から Canvas サイズを算出する
 */
export function getCanvasSize(tileSize: number): {
  width: number;
  height: number;
} {
  return {
    width: VIEWPORT_CONFIG.tilesX * tileSize,
    height: VIEWPORT_CONFIG.tilesY * tileSize,
  };
}
```

### 0A.4 useCanvasSize フック（新規）

**ファイル**: `src/features/ipne/presentation/hooks/useCanvasSize.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateTileSize, getCanvasSize } from '../../viewport';

interface CanvasSizeResult {
  tileSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * コンテナサイズに応じて Canvas サイズと tileSize を動的に計算するフック
 * @param containerRef - コンテナ要素の ref
 */
export function useCanvasSize(
  containerRef: React.RefObject<HTMLElement>
): CanvasSizeResult {
  const [size, setSize] = useState<CanvasSizeResult>({
    tileSize: 48,
    canvasWidth: 720,
    canvasHeight: 528,
  });

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const tileSize = calculateTileSize(el.clientWidth, el.clientHeight);
    const { width, height } = getCanvasSize(tileSize);
    setSize({ tileSize, canvasWidth: width, canvasHeight: height });
  }, [containerRef]);

  useEffect(() => {
    recalculate();

    const observer = new ResizeObserver(() => {
      // デバウンス 200ms
      clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(recalculate, 200);
    });

    const debounceTimer = { current: 0 };
    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer.current);
    };
  }, [containerRef, recalculate]);

  return size;
}
```

### 0A.5 IpnePage.styles.ts の変更

**ファイル**: `src/pages/IpnePage.styles.ts`

```typescript
// 変更前
export const PageContainer = styled.div`
  position: fixed;
  inset: 0;
  padding-top: 80px;
  height: 100dvh;
  ...
`;

export const Canvas = styled.canvas`
  max-width: 100%;
  max-height: 60vh;
  ...
`;

// 変更後
export const PageContainer = styled.div`
  position: fixed;
  inset: 0;
  padding-top: 0;        /* ヘッダー非表示時は上部余白不要 */
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  ...
`;

// Canvas をコントロール領域を除いた残りスペースに制約するラッパー
export const CanvasWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
`;

export const Canvas = styled.canvas`
  /* width/height は JS 側で動的に設定 */
  max-width: 100%;       /* コンテナからはみ出さない安全弁 */
  max-height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
`;
```

#### レスポンシブ HUD・コントロール

DPad ボタンおよび HUD テキストは `clamp() + vmin` でビューポートに応じてスケーリングする。
メディアクエリによる固定ブレークポイント指定を `clamp()` に統一し、連続的にサイズが変化する。

```css
/* DPad ボタンサイズ（例） */
grid-template-columns: repeat(3, clamp(2.75rem, 8vmin, 4rem));

/* HUD テキストサイズ（例） */
font-size: clamp(0.6rem, 1.5vmin, 0.85rem);  /* ステージ表示 */
font-size: clamp(0.75rem, 1.8vmin, 1rem);     /* タイマー */

/* HUD 要素の幅（例） */
width: clamp(120px, 20vmin, 200px);            /* HPバー */
```

### 0A.6 HUDレイアウト再設計

**変更前**:
```
┌─[🏠]────────────────────────────┐
│ [HP ████████░░]  [Lv.15]        │
│                  [⚔️3 🏹2 🏃5] │
│          [05:23]                 │
│                                  │
│           (ゲーム画面)           │
│                                  │
│ [🔑]                  [🗺️] [❓] │
└──────────────────────────────────┘
```

**変更後**:
```
┌─[🏠]──────[STAGE 3]──────[Lv.15]─┐
│              [05:23]    [⚔️3 🏹2] │
│ [HP ████████░░░░]                  │
│                                    │
│            (ゲーム画面)            │
│                                    │
│                                    │
│ [🔑]                    [🗺️] [❓] │
└────────────────────────────────────┘
```

**変更点**:
- HPバーをホームボタンの**下**に移動（y座標をずらして重なりを解消）
- ステージ表示を上部中央に移動
- タイマーをステージ表示の直下に配置
- レベル・ステータスは右上を維持
- 下部HUD（鍵、ミニマップ、ヘルプ）は変更なし

**Game.tsx 内の HUD 描画座標変更**:

```typescript
// HPバーの描画位置
const HP_BAR_Y = 48; // ホームボタン（~40px高さ）の下に配置

// ステージ表示
const STAGE_LABEL_X = canvasWidth / 2; // 中央
const STAGE_LABEL_Y = 16;

// レベル・ステータス
const LEVEL_X = canvasWidth - 16; // 右端
const LEVEL_Y = 16;

// タイマー
const TIMER_X = canvasWidth / 2;
const TIMER_Y = 32;
```

### 0A.7 App.tsx FloatingHomeButton の調整

```typescript
// ホームボタンは位置変更なし（top:12px, left:12px）
// ただし Canvas 内 HUD がボタン下に移動するため干渉しなくなる
```

### 0A.8 リサイズ時の処理

1. `ResizeObserver` でコンテナサイズ変化を検知
2. デバウンス（200ms）で `calculateTileSize()` を再計算
3. `SpriteRenderer.clearCache()` を呼び出してスプライトキャッシュを破棄
4. Canvas の `width`/`height` 属性を更新
5. ゲームループの次フレームで新しいサイズで再描画

### 0A.9 デバイス別の予測値

| デバイス | 画面 | 利用可能領域 | tileSize | Canvas | スプライト倍率 |
|---------|------|------------|---------|--------|-------------|
| フルHD PC | 1920×1080 | 1880×1020 | 92px | 1380×1012 | 2.88x |
| WQHD PC | 2560×1440 | 2520×1380 | 125px | 1875×1375 | 3.91x |
| MacBook Air | 1440×900 | 1400×840 | 76px | 1140×836 | 2.38x |
| iPad | 1024×768 | 984×708 | 64px | 960×704 | 2.00x |
| iPhone 14 | 390×844 | 370×780 | 24→**32**px | 480×352 | 1.00x |

> モバイルでは minTileSize（32px）が適用され、一部タイルが画面外に出る可能性あり。必要に応じてモバイル専用のタイル数削減を検討する。

### 0A.10 テスト変更

**新規テスト**: `useCanvasSize.test.ts`
- `calculateTileSize` の計算精度テスト
- minTileSize / maxTileSize のクランプテスト
- `getCanvasSize` の整合性テスト

**既存テスト変更**: `viewport.test.ts`
- 固定値テストを動的計算テストに変更

---

## 0B. スプライト解像度アップ（16→32）

### 0B.1 概要

全スプライトの解像度を16x16から32x32に引き上げ、キャラクター・敵・環境の描き込み量を4倍にする。パレットを8色→12色に拡張し、装飾・表情・武器ディテールの表現力を大幅に向上させる。32は2の5乗であり、ドット絵として扱いやすくスケーリング時の品質も良い。

### 0B.2 SPRITE_SIZES 変更

**ファイル**: `src/features/ipne/presentation/config.ts`

```typescript
// 変更前
export const SPRITE_SIZES = {
  base: 16,
  item: 8,
  miniBoss: 20,
  boss: 24,
  megaBoss: 28,
} as const;

// 変更後
export const SPRITE_SIZES = {
  base: 32,
  item: 16,
  miniBoss: 40,
  boss: 48,
  megaBoss: 56,
} as const;
```

**比率維持の確認**（すべて8の倍数）:

| 種別 | 現在 | 現在比率 | 変更後 | 変更後比率 |
|------|------|---------|--------|----------|
| base | 16 | 1.00x | 32 | 1.00x |
| item | 8 | 0.50x | 16 | 0.50x |
| miniBoss | 20 | 1.25x | 40 | 1.25x |
| boss | 24 | 1.50x | 48 | 1.50x |
| megaBoss | 28 | 1.75x | 56 | 1.75x |

### 0B.3 パレット拡張（8色→12色）

32x32 の広いキャンバスを活かし、影・装飾・ディテール用の色を4色追加。

#### 戦士パレット

```typescript
const WARRIOR_PALETTE: string[] = [
  '',          // 0: 透明
  '#1e2a6e',   // 1: ダークアーマー（深化）
  '#4c51bf',   // 2: アーマー
  '#667eea',   // 3: メインボディ
  '#818cf8',   // 4: ハイライト
  '#c7d2fe',   // 5: シールド/明るい装飾
  '#f5f5f5',   // 6: 白・剣刃
  '#d4a574',   // 7: 肌
  '#3b4cc0',   // 8: アーマー装飾（新）
  '#b8845a',   // 9: 肌影（新）
  '#e0e7ff',   // 10: 剣ハイライト/目（新）
  '#4a3728',   // 11: ベルト・靴・暗部（新）
];
```

#### 盗賊パレット

```typescript
const THIEF_PALETTE: string[] = [
  '',          // 0: 透明
  '#3b0f70',   // 1: ダーククローク（深化）
  '#6d28d9',   // 2: クローク
  '#a78bfa',   // 3: メインボディ
  '#c4b5fd',   // 4: ハイライト
  '#ddd6fe',   // 5: クロークの縁
  '#f5f5f5',   // 6: 白・ダガー
  '#d4a574',   // 7: 肌
  '#5b21b6',   // 8: クローク装飾（新）
  '#b8845a',   // 9: 肌影（新）
  '#ede9fe',   // 10: ダガーハイライト/目（新）
  '#4a3728',   // 11: ベルト・靴・暗部（新）
];
```

### 0B.4 playerSprites.ts の変更

#### createSpriteDefinition の変更

```typescript
function createSpriteDefinition(
  pixels: number[][],
  palette: string[]
): SpriteDefinition {
  return {
    width: 32,   // 16 → 32
    height: 32,  // 16 → 32
    pixels,
    palette,
  };
}
```

#### 戦士スプライトデザインガイドライン（32x32）

**下向き待機フレーム — デザイン仕様**:

```
行1-3:   兜の頂部（角飾り、バイザーの形状、装飾ライン。パレット5/8で角飾り）
行4-7:   顔（パレット7:肌、9:肌影、10:目のハイライト、1:目の瞳。口元の影）
行8:     首（パレット7:肌、9:肌影）
行9-14:  胴体上部（パレット2-4:アーマー、8:装飾ライン/リベット、5:肩パッドの段差）
行15-17: 胴体下部（パレット2-3:アーマー胸板、11:ベルト）
行18-20: 左手にシールド（パレット5:シールド面、8:紋章）、右手に剣（パレット6:剣刃、10:反射光、11:柄）
行21-23: 腰（パレット11:ベルト、2:アーマー下部）
行24-27: 脚（パレット1-2:レッグアーマー、関節部分の描き込み）
行28-30: ブーツ（パレット11:ブーツ、1:ブーツ影、厚みの表現）
行31-32: 足元（パレット1:影、接地感の表現）
```

**32x32 で追加できるディテール**:
- 兜: 角飾り・バイザーの形状、兜の装飾ライン
- 顔: 目のハイライト（パレット10）、口元の影
- 胴: 鎧のリベット、胸板の立体感、肩パッドの段差
- 腕: 篭手のディテール、シールドの紋章
- 武器: 剣の鍔・柄・刃の反射光
- 脚: レッグアーマーの関節部分、ブーツの厚み
- マント: 背面で翻るマントの質感

#### 盗賊スプライトデザインガイドライン（32x32）

**下向き待機フレーム — デザイン仕様**:

```
行1-3:   フード頂部（パレット1-2:クローク、尖った形状、左右非対称のたなびき）
行4-7:   顔（フードに半分隠れる、パレット7:肌、10:目だけが光る、ミステリアス）
行8:     首/マフラー（パレット5:クロークの縁）
行9-14:  胴体上部（パレット2-3:クロークの重なり、8:装飾、5:襟元）
行15-17: 胴体下部（パレット2-3:クローク、11:ベルト+ポーチ）
行18-20: 手（素手+手首ガード、パレット6:ダガーの反り、10:刃のハイライト、11:柄の巻き）
行21-23: 腰（パレット11:ベルト、装備ポーチ、投げナイフのホルスター）
行24-27: 脚（パレット1-2:軽装ブーツ、柔らかい形状）
行28-30: ブーツ（パレット11:ブーツ、1:影、足音を立てない形状）
行31-32: 足元（パレット1:影）
```

**32x32 で追加できるディテール**:
- フード: 尖った形状、影に隠れた顔、目だけが光る
- 胴: クロークの重なり、ベルトのポーチ
- 腕: 素手の手首ガード、ダガーの柄の巻き
- 武器: ダガーの反り、投げナイフのホルスター
- 脚: 軽装ブーツ、足音を立てない柔らかい形状
- クローク: 左右非対称のたなびき

#### フレーム一覧（1クラスあたり）

| 方向 | フレーム | 用途 |
|------|---------|------|
| down | idle, walk1, walk2 | 正面基本アニメーション |
| up | idle, walk1, walk2 | 背面基本アニメーション |
| left | idle, walk1, walk2 | 左向き基本アニメーション |
| right | idle, walk1, walk2 | 右向き基本アニメーション |
| down | attack1, attack2 | 攻撃（2フレーム） |
| up | attack1, attack2 | 攻撃（2フレーム） |
| left | attack1, attack2 | 攻撃（2フレーム） |
| right | attack1, attack2 | 攻撃（2フレーム） |
| down | damage | 被弾 |
| up | damage | 被弾 |
| left | damage | 被弾 |
| right | damage | 被弾 |
| down | idle_breathe | アイドルブリーズ |
| up | idle_breathe | アイドルブリーズ |
| left | idle_breathe | アイドルブリーズ |
| right | idle_breathe | アイドルブリーズ |

**合計**: 2クラス × (12 + 8 + 4 + 4) = **56スプライト**

### 0B.5 enemySprites.ts の変更

#### 通常敵 32x32 デザインガイドライン

**パトロール（スライム）**:
- 32x32 でぷるぷるした質感を出す
- アメーバ状の形状に不規則な輝きパターン
- 内部の核や気泡の描き込みが可能
- パレット5色（+影色1追加で6色）

**チャージ（ビースト）**:
- 32x32 で四足獣のシルエット
- 鋭い角・牙を描き込める、毛並みの表現
- 突進ポーズで前傾した力強い姿勢
- 筋肉の隆起や爪のディテール

**レンジ（メイジ）**:
- 32x32 でローブと杖のディテール
- 杖先に発光する宝珠、ルーン模様
- 詠唱ポーズで手を前方に
- ローブの裾や袖の装飾

**スペシメン**:
- 32x32 に拡大（現状はbase=16で描画）
- パレット強化に加え、体表のテクスチャ追加

#### ボス系スケールアップ

| ボスタイプ | 現在 | 変更後 | 変更内容 |
|-----------|------|--------|---------|
| BOSS | 24x24 | **48x48** | ピクセル配列全面再設計。威圧的な鎧・角の描き込み |
| MINI_BOSS | 20x20 | **40x40** | ピクセル配列全面再設計 |
| MEGA_BOSS | 28x28 | **56x56** | ピクセル配列全面再設計。最も威圧的なデザイン |

### 0B.6 環境スプライトの変更

#### tileSprites.ts

- 床タイル: 32x32（石畳パターンの解像度向上、目地の描き込み）
- 壁タイル: 32x32（レンガ/石のテクスチャ、ひび割れ等の描き込み）
- ゴールタイル: 32x32（光り方を強調、装飾模様）
- スタートタイル: 32x32

#### trapSprites.ts

- 全罠スプライト: 16x16 → 32x32
- ダメージ罠: 棘のディテール追加、血痕表現
- 減速罠: 氷の結晶パターン、霜の表現
- テレポート罠: 魔法陣の模様、ルーン文字
- 各罠の hidden/revealed/triggered の各状態

#### wallSprites.ts

- 破壊可能壁: 32x32（ひび割れディテール、レンガの質感）
- 通過可能壁: 32x32（半透明表現の改善）
- 不可視壁: 32x32
- 破壊段階（intact/damaged/broken）の描き込み

#### effectSprites.ts

- 斬撃エフェクト: 32x32（光の軌跡をより滑らかに）
- 敵攻撃エフェクト: 32x32

#### itemSprites.ts

- 全アイテム: 8x8 → 16x16
- 回復薬: 瓶のシルエットを改善、液体の描き込み
- 鍵: 歯の描き込み追加、金属の光沢

### 0B.7 テスト変更

**spriteData.test.ts**:
- テストデータのサイズ定数を更新
- 32x32 スプライト生成テスト追加
- 16x16 アイテムスプライトテスト追加
- パレット12色の整合性テスト

### 0B.8 描画パイプラインへの影響

Phase 0A のレスポンシブ化により `tileSize` は動的計算される。`Game.tsx` は以下のパターンで `SPRITE_SIZES.base` を参照:

```typescript
const spriteScale = tileSize / SPRITE_SIZES.base;
```

この `spriteScale` が全スプライト描画のスケール基準となるため、`SPRITE_SIZES.base` を32に変更するだけで描画サイズは自動調整される。

**追加確認が必要な箇所**:
- 衝突判定: タイル座標ベースのため影響なし
- パーティクルの相対サイズ: スプライトスケールに依存するため自動調整
- スプライトキャッシュ: 32x32 でキャッシュ量が増えるが、Phase 0A でリサイズ時のクリア機構を追加済み

---

## 1. パワーオーラシステム

### 1.1 概要

プレイヤーのレベルに応じて、キャラクター周囲に常時表示されるオーラエフェクト。成長の実感を視覚的に提供する。

### 1.2 新規ファイル

**ファイル**: `src/features/ipne/presentation/effects/aura.ts`

### 1.3 型定義

```typescript
/** オーラのティア（レベル帯に対応） */
export const AuraTier = {
  NONE: 'none',       // Lv1-4
  GLOW: 'glow',       // Lv5-9
  SMALL: 'small',     // Lv10-14
  MEDIUM: 'medium',   // Lv15-19
  LARGE: 'large',     // Lv20+
} as const;

export type AuraTierValue = typeof AuraTier[keyof typeof AuraTier];

/** オーラ設定 */
export interface AuraConfig {
  /** オーラの半径（タイルサイズに対する比率） */
  radius: number;
  /** 基本色（CSS色文字列） */
  baseColor: string;
  /** 二次色（グラデーション用、オプション） */
  secondaryColor?: string;
  /** 最大不透明度 (0.0-1.0) */
  maxAlpha: number;
  /** 脈動速度（ms周期） */
  pulseSpeed: number;
  /** パーティクル有無 */
  hasParticles: boolean;
  /** パーティクル数（1フレームあたりの生成数） */
  particleCount: number;
}
```

### 1.4 レベル→ティアマッピング

```typescript
const LEVEL_THRESHOLDS = [
  { minLevel: 1, tier: AuraTier.NONE },
  { minLevel: 5, tier: AuraTier.GLOW },
  { minLevel: 10, tier: AuraTier.SMALL },
  { minLevel: 15, tier: AuraTier.MEDIUM },
  { minLevel: 20, tier: AuraTier.LARGE },
] as const;

export function getAuraTier(level: number): AuraTierValue;
```

### 1.5 ティア別設定

| ティア | radius | maxAlpha | pulseSpeed | hasParticles | particleCount |
|--------|--------|----------|------------|--------------|---------------|
| NONE | 0 | 0 | - | false | 0 |
| GLOW | 0.3 | 0.15 | 2000ms | false | 0 |
| SMALL | 0.5 | 0.25 | 1500ms | false | 0 |
| MEDIUM | 0.7 | 0.35 | 1200ms | true | 2 |
| LARGE | 1.0 | 0.45 | 1000ms | true | 4 |

### 1.6 職業別カラー

| 職業 | ティア | baseColor | secondaryColor |
|------|--------|-----------|---------------|
| 戦士 | GLOW | `rgba(102, 126, 234, a)` | - |
| 戦士 | SMALL | `rgba(102, 126, 234, a)` | `rgba(129, 140, 248, a)` |
| 戦士 | MEDIUM | `rgba(102, 126, 234, a)` | `rgba(251, 191, 36, a)` |
| 戦士 | LARGE | `rgba(251, 191, 36, a)` | `rgba(255, 255, 255, a)` |
| 盗賊 | GLOW | `rgba(167, 139, 250, a)` | - |
| 盗賊 | SMALL | `rgba(167, 139, 250, a)` | `rgba(196, 181, 253, a)` |
| 盗賊 | MEDIUM | `rgba(167, 139, 250, a)` | `rgba(251, 191, 36, a)` |
| 盗賊 | LARGE | `rgba(251, 191, 36, a)` | `rgba(255, 255, 255, a)` |

### 1.7 描画ロジック

```typescript
/**
 * プレイヤーオーラを描画する
 * プレイヤースプライトの描画前に呼び出す（スプライトの背面に描画）
 */
export function drawPlayerAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  level: number,
  playerClass: PlayerClassValue,
  now: number
): void;
```

描画手順:
1. `getAuraTier(level)` でティアを取得
2. `NONE` なら何もしない
3. 脈動計算: `alpha = maxAlpha * (0.6 + 0.4 * Math.sin(now / pulseSpeed * Math.PI * 2))`
4. ラジアルグラデーション描画: 中心→外周で `baseColor(alpha)` → `secondaryColor(0)` or `baseColor(0)`
5. `hasParticles` の場合、小さなパーティクルを上方向に生成

### 1.8 Game.tsx 統合

```typescript
// プレイヤー描画セクション内、スプライト描画の直前に追加
drawPlayerAura(ctx, playerScreenX, playerScreenY, viewport.tileSize, player.level, player.playerClass, now);
// 既存のプレイヤースプライト描画
drawPlayerSprite(...);
```

---

## 2. 武器エフェクト強化

### 2.1 概要

攻撃力に応じて攻撃時の武器エフェクトが強化される。斬撃/突き部分の光跡と衝撃波を段階的に追加。

### 2.2 攻撃力ティア

```typescript
export const WeaponTier = {
  NORMAL: 'normal',     // 攻撃力 1-3
  ENHANCED: 'enhanced', // 攻撃力 4-6
  GLOWING: 'glowing',   // 攻撃力 7-9
  RADIANT: 'radiant',   // 攻撃力 10+
} as const;

export function getWeaponTier(attackPower: number): WeaponTierValue;
```

### 2.3 ティア別エフェクト仕様

| ティア | 光跡 | 衝撃波 | 追加パーティクル |
|--------|------|--------|-----------------|
| NORMAL | なし | なし | なし |
| ENHANCED | 薄い白の残像（2フレーム） | なし | 2個（白） |
| GLOWING | 明るい職業色の弧（3フレーム） | なし | 4個（職業色+白） |
| RADIANT | 強い金色の弧（4フレーム） | 同心円リング | 8個（金+白） |

### 2.4 光跡描画仕様

```typescript
/**
 * 攻撃時の武器光跡を描画する
 * 攻撃アニメーション中のみ有効
 */
export function drawWeaponTrail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  direction: DirectionValue,
  attackPower: number,
  playerClass: PlayerClassValue,
  attackProgress: number  // 0.0-1.0（攻撃アニメーションの進行度）
): void;
```

光跡描画:
- `ctx.beginPath()` + `ctx.arc()` で弧を描画
- 開始角度と終了角度は `direction` と `attackProgress` から算出
- `lineWidth` はティアに応じて 1→3px
- `strokeStyle` はティア別の色（グラデーション付き）
- `globalAlpha` は `attackProgress` に応じて 1.0→0.0 でフェードアウト

### 2.5 衝撃波描画仕様（RADIANT ティアのみ）

```typescript
/**
 * 攻撃ヒット時の衝撃波リングを描画する
 */
export function drawShockwave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  elapsed: number  // ヒットからの経過時間(ms)
): void;
```

衝撃波仕様:
- 円形リング、半径は `elapsed` に比例して拡大
- 最大半径: `tileSize * 1.5`
- 持続時間: 300ms
- `lineWidth`: 3→1px（縮小）
- `strokeStyle`: `rgba(251, 191, 36, alpha)` で alpha は 0.8→0

---

## 3. フローティングダメージ

### 3.1 概要

攻撃ヒット時に与えたダメージ数値を浮遊テキストとして表示する。

### 3.2 新規ファイル

**ファイル**: `src/features/ipne/presentation/effects/floatingText.ts`

### 3.3 型定義

```typescript
export interface FloatingText {
  /** テキスト内容 */
  text: string;
  /** 表示位置 X（ワールド座標） */
  x: number;
  /** 表示位置 Y（ワールド座標） */
  y: number;
  /** 生成時刻 */
  startTime: number;
  /** 持続時間 (ms) */
  duration: number;
  /** 色 */
  color: string;
  /** フォントサイズ (px) */
  fontSize: number;
  /** 種別 */
  type: FloatingTextType;
}

export const FloatingTextType = {
  DAMAGE: 'damage',         // プレイヤー攻撃ダメージ（白）
  CRITICAL: 'critical',     // クリティカル（金、大きめ）
  PLAYER_DAMAGE: 'player_damage', // 被弾ダメージ（赤）
  HEAL: 'heal',             // 回復量（緑）
  COMBO: 'combo',           // コンボテキスト（黄）
  INFO: 'info',             // 情報テキスト（白）
} as const;
```

### 3.4 フローティングテキストマネージャー

```typescript
/** フローティングテキストの上限数 */
const MAX_FLOATING_TEXTS = 30;

export class FloatingTextManager {
  private texts: FloatingText[] = [];

  /** テキスト追加 */
  addText(text: string, x: number, y: number, type: FloatingTextTypeValue, now: number): void;

  /** 更新（期限切れ除去） */
  update(now: number): void;

  /** 描画 */
  draw(
    ctx: CanvasRenderingContext2D,
    viewport: ViewportInfo,
    now: number
  ): void;
}
```

### 3.5 テキスト種別の設定

| 種別 | 色 | 基本フォントサイズ | 持続時間 | 動き |
|------|-----|-------------|---------|------|
| DAMAGE | `#ffffff` | 12px | 800ms | 上方向フロート |
| CRITICAL | `#fbbf24` | 18px | 1000ms | 上方向フロート+拡大縮小 |
| PLAYER_DAMAGE | `#ef4444` | 14px | 800ms | 上方向フロート |
| HEAL | `#22c55e` | 12px | 800ms | 上方向フロート |
| COMBO | `#fbbf24` | 16px | 1200ms | 上方向フロート+拡大 |
| INFO | `#ffffff` | 14px | 1500ms | 上方向フロート |

### 3.6 動きの計算

```typescript
function getTextPosition(text: FloatingText, now: number): { x: number; y: number; alpha: number; scale: number } {
  const elapsed = now - text.startTime;
  const progress = elapsed / text.duration;

  // 上方向にフロート（緩やかに減速）
  const floatY = -30 * progress * (2 - progress); // イージング

  // フェードアウト（後半50%で）
  const alpha = progress < 0.5 ? 1.0 : 1.0 - (progress - 0.5) * 2;

  // スケール（CRITICALのみ）
  const scale = text.type === FloatingTextType.CRITICAL
    ? 1.0 + 0.3 * Math.sin(progress * Math.PI)
    : 1.0;

  return { x: text.x, y: text.y + floatY, alpha, scale };
}
```

### 3.7 描画仕様

```typescript
// Canvas 2D テキスト描画
ctx.save();
ctx.font = `bold ${fontSize * scale}px monospace`;
ctx.textAlign = 'center';
ctx.textBaseline = 'bottom';
ctx.globalAlpha = alpha;

// アウトライン（視認性確保）
ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
ctx.lineWidth = 3;
ctx.strokeText(text.text, screenX, screenY);

// 本文
ctx.fillStyle = text.color;
ctx.fillText(text.text, screenX, screenY);
ctx.restore();
```

### 3.8 トリガーポイント

| イベント | テキスト | 種別 |
|---------|---------|------|
| `playerAttack` で敵にダメージ | `"{damage}"` | DAMAGE |
| 高ダメージ撃破（攻撃力×2以上） | `"{damage}"` | CRITICAL |
| `processEnemyContact` でプレイヤー被弾 | `"-{damage}"` | PLAYER_DAMAGE |
| HP回復アイテム取得 | `"+{amount}"` | HEAL |
| 鍵取得 | `"KEY GET!"` | INFO |

---

## 4. 攻撃ヒットエフェクトスケーリング

### 4.1 概要

既存の `ATTACK_HIT` エフェクトをプレイヤーのレベルに応じてスケーリングする。

### 4.2 EffectManager の拡張

```typescript
// addEffect のオプション拡張
interface EffectOptions {
  variant?: 'melee' | 'ranged' | 'boss';
  /** プレイヤーのパワーレベル（エフェクト強度に影響） */
  powerLevel?: number;
}
```

### 4.3 パワーレベル計算

```typescript
/**
 * プレイヤーの総合パワーレベルを算出する
 * レベルと攻撃力を考慮した0-4のスケール値
 */
export function calculatePowerLevel(player: Player): number {
  const levelFactor = Math.min(player.level / 5, 4); // 0-4
  return Math.floor(levelFactor);
}
```

### 4.4 スケーリング設定

| powerLevel | パーティクル数 | サイズ倍率 | 速度倍率 | 追加演出 |
|------------|-------------|----------|----------|---------|
| 0 | 4 | 0.6 | 0.8 | なし |
| 1 | 8 | 1.0 | 1.0 | なし |
| 2 | 12 | 1.3 | 1.1 | 衝撃波リング |
| 3 | 16 | 1.6 | 1.2 | 衝撃波リング + 画面フラッシュ(50ms) |
| 4 | 24 | 2.0 | 1.3 | 衝撃波リング + 画面フラッシュ + 画面シェイク(100ms) |

### 4.5 衝撃波リング描画

```typescript
/**
 * 攻撃ヒット時の衝撃波リングエフェクト
 * powerLevel >= 2 で有効
 */
function drawHitShockwave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsed: number,
  powerLevel: number
): void {
  const maxRadius = 8 + powerLevel * 4; // 16-24px
  const duration = 250; // ms
  const progress = elapsed / duration;
  if (progress > 1) return;

  const radius = maxRadius * progress;
  const alpha = 0.6 * (1 - progress);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 2 - progress;
  ctx.stroke();
}
```

---

## 5. コンボシステム

### 5.1 概要

短時間に連続で敵を撃破するとコンボカウンターが加算され、演出が強化される。

### 5.2 新規ファイル

**ファイル**: `src/features/ipne/combo.ts`

### 5.3 型定義

```typescript
export interface ComboState {
  /** 現在のコンボ数 */
  count: number;
  /** 最後の撃破時刻 */
  lastKillTime: number;
  /** 最大コンボ数（記録用） */
  maxCombo: number;
}

/** コンボの時間窓（ms） */
const COMBO_WINDOW_MS = 3000;

/** コンボ表示の最小値 */
const COMBO_DISPLAY_MIN = 2;
```

### 5.4 API

```typescript
/**
 * 初期コンボ状態を生成する
 */
export function createComboState(): ComboState;

/**
 * 敵撃破時のコンボ更新
 * @returns 更新後のComboState
 */
export function registerKill(state: ComboState, now: number): ComboState;

/**
 * コンボの有効性チェック（時間切れ判定）
 * @returns コンボが有効ならtrue
 */
export function isComboActive(state: ComboState, now: number): boolean;

/**
 * コンボによるエフェクト倍率を取得する
 * @returns 1.0以上の倍率
 */
export function getComboMultiplier(state: ComboState): number;
```

### 5.5 コンボ倍率

| コンボ数 | エフェクト倍率 | 追加SE |
|---------|-------------|--------|
| 1 | 1.0 | なし |
| 2-3 | 1.2 | ピッチ+10% |
| 4-6 | 1.4 | ピッチ+20% |
| 7-9 | 1.6 | ピッチ+30% |
| 10+ | 1.8 | ピッチ+40% |

コンボ倍率はパーティクル数と速度に適用される（ダメージ量には影響しない）。

### 5.6 コンボカウンターUI

**表示条件**: `combo.count >= COMBO_DISPLAY_MIN && isComboActive(combo, now)`

**描画仕様**:
```typescript
// 画面上部中央に表示
const text = `x${combo.count}`;
const fontSize = 16 + Math.min(combo.count, 10) * 2; // 最大36px

ctx.save();
ctx.font = `bold ${fontSize}px monospace`;
ctx.textAlign = 'center';
ctx.fillStyle = '#fbbf24'; // 金色
ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
ctx.lineWidth = 3;

// 画面上部中央
const centerX = canvasWidth / 2;
const y = 50;

// コンボ数に応じたスケールアニメーション
const timeSinceKill = now - combo.lastKillTime;
const popScale = timeSinceKill < 200
  ? 1.0 + 0.3 * (1 - timeSinceKill / 200)
  : 1.0;

ctx.scale(popScale, popScale);
ctx.strokeText(text, centerX, y);
ctx.fillText(text, centerX, y);
ctx.restore();
```

### 5.7 統合ポイント

1. **`tickGameState.ts`**: 敵HP<=0 検出時に `registerKill` を呼び出し
2. **`Game.tsx`**: コンボカウンターの描画
3. **`effectManager.ts`**: `getComboMultiplier` をパーティクル生成時に適用

---

## 6. 敵撃破演出強化

### 6.1 概要

敵撃破時に破片パーティクルと消滅アニメーションを追加する。

### 6.2 新エフェクト種別

```typescript
// effectTypes.ts に追加
ENEMY_DEATH: 'enemy_death',
```

### 6.3 撃破アニメーション仕様

**フェーズ構成**（合計300ms）:

| フェーズ | 時間 | 描画 |
|---------|------|------|
| 1. 縮小 | 0-100ms | スプライトを 1.0→0.5 にスケール |
| 2. フラッシュ | 100-150ms | 白いフラッシュ（スプライト全体を白に） |
| 3. 破裂 | 150-300ms | スプライトを非表示、破片パーティクル拡散 |

### 6.4 破片パーティクル仕様

```typescript
interface EnemyDeathEffectConfig {
  /** パーティクル数（敵タイプ別） */
  particleCount: number;
  /** 色（敵のパレット色から抽出） */
  colors: string[];
  /** 拡散速度 */
  speed: { min: number; max: number };
  /** サイズ */
  size: { min: number; max: number };
  /** 持続時間 */
  duration: number;
}
```

| 敵タイプ | particleCount | colors | duration |
|---------|--------------|--------|----------|
| PATROL | 6 | `['#6b21a8', '#7c3aed', '#a78bfa']` | 300ms |
| CHARGE | 8 | `['#991b1b', '#dc2626', '#f87171']` | 300ms |
| RANGED | 6 | `['#c2410c', '#f97316', '#fdba74']` | 300ms |
| SPECIMEN | 6 | `['#1e40af', '#3b82f6', '#93c5fd']` | 300ms |
| BOSS | 24 | `['#78350f', '#a16207', '#fbbf24', '#ffffff']` | 800ms |
| MINI_BOSS | 16 | 敵固有色 + `['#ffffff']` | 600ms |
| MEGA_BOSS | 48 | `['#ef4444', '#f97316', '#fbbf24', '#ffffff']` | 1200ms |

### 6.5 敵描画への統合

```typescript
// Game.tsx の敵描画セクション
function drawEnemy(enemy: Enemy, ctx: CanvasRenderingContext2D, now: number): void {
  // 撃破アニメーション中の場合
  if (enemy.isDying) {
    const deathProgress = (now - enemy.deathStartTime) / ENEMY_DEATH_DURATION;
    if (deathProgress < 0.33) {
      // フェーズ1: 縮小
      const scale = 1.0 - deathProgress * 1.5;
      drawEnemySpriteScaled(enemy, ctx, scale);
    } else if (deathProgress < 0.5) {
      // フェーズ2: フラッシュ
      drawEnemySpriteWhite(enemy, ctx);
    }
    // フェーズ3: スプライト非表示（パーティクルのみ）
    return;
  }
  // 通常描画
  drawEnemySpriteNormal(enemy, ctx, now);
}
```

### 6.6 Enemy型の拡張

```typescript
// types.ts の Enemy に追加
interface Enemy {
  // 既存フィールド...

  /** 撃破アニメーション中フラグ */
  isDying?: boolean;
  /** 撃破開始時刻 */
  deathStartTime?: number;
}
```

---

## 7. ボス戦演出強化

### 7.1 ボス登場演出（WARNING）

**トリガー**: プレイヤーがボス敵から一定距離（5タイル）内に初めて接近した時

**演出フロー**:

| 時間 | 描画 |
|------|------|
| 0-200ms | 画面暗転（黒オーバーレイ alpha 0→0.5） |
| 200-1000ms | 「WARNING」テキスト点滅（赤、200ms間隔） |
| 1000-1200ms | 画面暗転解除（alpha 0.5→0） |

```typescript
/** WARNING 演出の状態 */
interface BossWarningState {
  isActive: boolean;
  startTime: number;
  bossId: string; // 同じボスに対しては1回のみ
}

const BOSS_WARNING_DURATION = 1200; // ms
const BOSS_DETECTION_RANGE = 5; // タイル
```

### 7.2 ボスHP残量演出

| HP比率 | 演出 |
|--------|------|
| 100-51% | 通常（変更なし） |
| 50-26% | 赤いオーラ（脈動、alpha 0.1-0.3、周期 800ms） |
| 25-1% | 激しい赤オーラ（alpha 0.2-0.5、周期 400ms）+ 微画面シェイク |

```typescript
function drawBossAura(
  ctx: CanvasRenderingContext2D,
  boss: Enemy,
  x: number,
  y: number,
  tileSize: number,
  now: number
): void;
```

### 7.3 ボス攻撃の溜めモーション

ボスが攻撃前に300msの「溜め」を入れ、予兆を表示する。

| 要素 | 仕様 |
|------|------|
| 溜め時間 | 300ms |
| 視覚的予兆 | ボス周囲に赤い同心円が収縮（外→内） |
| 溜め中のボス | スプライトが微振動（±1px） |
| 攻撃実行後 | 衝撃波パーティクル（パルス波、12個） |

### 7.4 ボス撃破演出の強化

| ボスタイプ | パーティクル | 追加演出 |
|-----------|------------|---------|
| BOSS | 32個、1200ms | 画面フラッシュ(300ms) + 画面シェイク(400ms) |
| MINI_BOSS | 24個、800ms | 画面フラッシュ(200ms) + 画面シェイク(300ms) |
| MEGA_BOSS | 48個×3波、2000ms | 3段階爆発 + 全画面フラッシュ + 強画面シェイク |

**メガボス3段階爆発**:

| 波 | タイミング | パーティクル | 色 |
|----|----------|------------|-----|
| 1波 | 0ms | 24個、放射状 | 赤+オレンジ |
| 2波 | 400ms | 24個、螺旋状 | 金+白 |
| 3波 | 800ms | 48個、パルス波 | 白+金+赤 |

---

## 8. ステージ別BGM

### 8.1 概要

既存の単一ゲームBGMをステージ別の5パターンに拡張する。

### 8.2 bgm.ts の拡張

```typescript
// 既存の playGameBgm() を拡張
export function playGameBgm(stageNumber?: number): void;
// stageNumber 未指定時は既存のBGM（後方互換）
```

### 8.3 ステージ別メロディパターン

#### ステージ1 BGM: 探索（Exploration）

```typescript
const STAGE_1_BGM: BgmConfig = {
  type: 'triangle',
  melody: [
    // E3→G3→A3→B3→A3→G3→E3→D3 (穏やかな探索)
    { note: 'E3', duration: 0.4 },
    { note: 'G3', duration: 0.4 },
    { note: 'A3', duration: 0.4 },
    { note: 'B3', duration: 0.6 },
    { note: 'A3', duration: 0.4 },
    { note: 'G3', duration: 0.4 },
    { note: 'E3', duration: 0.4 },
    { note: 'D3', duration: 0.6 },
  ],
  gain: 0.06,
  loop: true,
};
```

#### ステージ2 BGM: 神秘（Mystery）

```typescript
const STAGE_2_BGM: BgmConfig = {
  type: 'triangle',  // + sine の二重奏
  melody: [
    // A3→C4→E4→D4→B3→A3→G3→A3 (神秘的)
    { note: 'A3', duration: 0.5 },
    { note: 'C4', duration: 0.5 },
    { note: 'E4', duration: 0.5 },
    { note: 'D4', duration: 0.7 },
    { note: 'B3', duration: 0.5 },
    { note: 'A3', duration: 0.5 },
    { note: 'G3', duration: 0.5 },
    { note: 'A3', duration: 0.7 },
  ],
  gain: 0.06,
  loop: true,
};
```

#### ステージ3 BGM: 不安（Tension）

```typescript
const STAGE_3_BGM: BgmConfig = {
  type: 'sawtooth',
  melody: [
    // D3→F3→Ab3→G3→E3→D3→C3→D3 (不安を煽る短調)
    { note: 'D3', duration: 0.35 },
    { note: 'F3', duration: 0.35 },
    { note: 'Ab3', duration: 0.35 },
    { note: 'G3', duration: 0.5 },
    { note: 'E3', duration: 0.35 },
    { note: 'D3', duration: 0.35 },
    { note: 'C3', duration: 0.35 },
    { note: 'D3', duration: 0.5 },
  ],
  gain: 0.05,
  loop: true,
};
```

#### ステージ4 BGM: 威圧（Oppression）

```typescript
const STAGE_4_BGM: BgmConfig = {
  type: 'sawtooth',
  melody: [
    // C3→Eb3→F3→G3→Ab3→G3→F3→Eb3 (重厚、低音)
    { note: 'C3', duration: 0.5 },
    { note: 'Eb3', duration: 0.5 },
    { note: 'F3', duration: 0.5 },
    { note: 'G3', duration: 0.7 },
    { note: 'Ab3', duration: 0.5 },
    { note: 'G3', duration: 0.5 },
    { note: 'F3', duration: 0.5 },
    { note: 'Eb3', duration: 0.7 },
  ],
  gain: 0.05,
  loop: true,
};
```

#### ステージ5 BGM: 決戦（Climax）

```typescript
const STAGE_5_BGM: BgmConfig = {
  type: 'square',
  melody: [
    // E4→G4→B4→A4→G4→F#4→E4→D4 (激しいクライマックス)
    { note: 'E4', duration: 0.3 },
    { note: 'G4', duration: 0.3 },
    { note: 'B4', duration: 0.3 },
    { note: 'A4', duration: 0.4 },
    { note: 'G4', duration: 0.3 },
    { note: 'F#4', duration: 0.3 },
    { note: 'E4', duration: 0.3 },
    { note: 'D4', duration: 0.4 },
  ],
  gain: 0.06,
  loop: true,
};
```

#### ボス戦BGM

```typescript
const BOSS_BGM: BgmConfig = {
  type: 'square',
  melody: [
    // A3→C4→A3→Bb3→A3→G3→A3→E4 (ボス戦テーマ)
    { note: 'A3', duration: 0.25 },
    { note: 'C4', duration: 0.25 },
    { note: 'A3', duration: 0.25 },
    { note: 'Bb3', duration: 0.35 },
    { note: 'A3', duration: 0.25 },
    { note: 'G3', duration: 0.25 },
    { note: 'A3', duration: 0.25 },
    { note: 'E4', duration: 0.35 },
  ],
  gain: 0.07,
  loop: true,
};
```

### 8.4 BGM切り替えロジック

```typescript
// useGameState.ts での切り替え
case ScreenState.GAME:
  playGameBgm(currentStage);
  break;

// ボス接近時の切り替え
function onBossEncounter(): void {
  playBossBgm();
}

// ボス撃破後、通常BGMに復帰
function onBossDefeated(): void {
  playGameBgm(currentStage);
}
```

---

## 9. レベルアップ演出強化

### 9.1 概要

レベルアップ時の演出を強化し、達成感を向上させる。

### 9.2 演出フロー

| 時間 | 描画 |
|------|------|
| 0ms | 金色の全画面フラッシュ開始 |
| 0-200ms | フラッシュ（alpha 0.4→0） |
| 0-1500ms | 螺旋上昇パーティクル（24個、金+白） |
| 200-1700ms | 「LEVEL UP!」テキスト（フェードイン→維持→フェードアウト） |
| 400-1900ms | 「Lv.{N}」テキスト（フェードイン→維持→フェードアウト） |

### 9.3 実装

```typescript
// effectManager.ts の LEVEL_UP エフェクト強化
case EffectType.LEVEL_UP:
  // 既存: パーティクル12個
  // 変更: パーティクル24個 + 螺旋パターン + フラッシュ
  particles = createSpiralParticles(24, x, y, LEVEL_UP_COLORS, ...);
  this.addScreenFlash('#fbbf24', 200); // 金色フラッシュ
  break;
```

### 9.4 テキスト表示

`FloatingTextManager` を使用:
```typescript
floatingTextManager.addText('LEVEL UP!', player.x, player.y - 1, FloatingTextType.INFO, now);
floatingTextManager.addText(`Lv.${player.level}`, player.x, player.y - 0.5, FloatingTextType.COMBO, now);
```

---

## 10. 探索報酬フィードバック強化

### 10.1 アイテム取得時のフィードバック

| アイテム | 追加パーティクル | テキスト | HPバーフラッシュ |
|---------|----------------|---------|----------------|
| 小回復 | 緑4個（上昇） | `"+{amount}"` (緑) | 緑フラッシュ(200ms) |
| 大回復 | 緑8個（上昇） | `"+{amount}"` (緑、大) | 緑フラッシュ(300ms) |
| レベルアップ | レベルアップ演出参照 | レベルアップ演出参照 | - |
| 鍵 | 金12個（螺旋） | `"KEY GET!"` (金) | - |
| マップ開示 | 青8個（放射） | `"MAP REVEALED"` (青) | - |

### 10.2 HPバーフラッシュ

```typescript
// 回復時にHPバーの背景を一瞬フラッシュさせる
interface HpBarFlash {
  color: string;
  startTime: number;
  duration: number;
}

function drawHpBar(ctx, player, now, flash?: HpBarFlash): void {
  // 通常のHPバー描画...

  if (flash) {
    const elapsed = now - flash.startTime;
    if (elapsed < flash.duration) {
      const alpha = 0.4 * (1 - elapsed / flash.duration);
      ctx.fillStyle = `rgba(${flashColorRgb}, ${alpha})`;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  }
}
```

---

## 11. 画面遷移演出改善

### 11.1 ステージ開始

| 時間 | 描画 |
|------|------|
| 0-500ms | 黒画面 → フェードイン |
| 200-1500ms | `"STAGE {N}"` テキスト（フェードイン→維持→フェードアウト） |
| 500ms~ | ゲーム画面表示 |

### 11.2 ゲームオーバー遷移

| 時間 | 描画 |
|------|------|
| 0-500ms | 死亡エフェクト（既存の3フェーズ） |
| 500-1000ms | 画面が徐々に暗転（alpha 0→0.7） |
| 1000ms | ゲームオーバー画面に遷移 |

### 11.3 ステージクリア遷移

| 時間 | 描画 |
|------|------|
| 0ms | ボス撃破エフェクト開始 |
| 0-300ms | 白色フラッシュ |
| 300-1800ms | パーティクル演出 |
| 1800ms | ステージクリア画面に遷移 |

---

## 12. ステージ進行見た目変化

### 12.1 概要

ステージクリア報酬で選択した能力に応じて、プレイヤーに視覚的なアクセントを追加する。

### 12.2 報酬別ビジュアルエフェクト

| 報酬 | エフェクト | 描画タイミング |
|------|-----------|-------------|
| maxHp強化 | キャラ外枠に淡い青白の輝き（シールド風） | 常時 |
| 攻撃力強化 | 武器ティア計算に反映（§2参照） | 攻撃時 |
| 移動速度強化 | 移動時に足元に淡い残像（2フレーム前の位置に半透明スプライト） | 移動時 |
| 攻撃速度強化 | 手元/武器周囲に小さな回転パーティクル | 常時（微小） |
| 回復量強化 | 回復タイミングで緑のパーティクル上昇 | 自動回復時 |

### 12.3 残像エフェクト（移動速度強化時）

```typescript
interface AfterImage {
  x: number;
  y: number;
  alpha: number;
  spriteFrame: number;
  direction: DirectionValue;
}

/** 残像の最大保持数 */
const MAX_AFTER_IMAGES = 2;
/** 残像のフェード速度 */
const AFTER_IMAGE_FADE_RATE = 0.15; // フレームあたり
```

---

## 付録 A: 新規定数一覧

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `AURA_LEVEL_THRESHOLDS` | [5, 10, 15, 20] | オーラティア閾値 |
| `WEAPON_TIER_THRESHOLDS` | [4, 7, 10] | 武器ティア閾値 |
| `FLOATING_TEXT_MAX` | 30 | フローティングテキスト上限 |
| `FLOATING_TEXT_DURATION` | 800 | デフォルト持続時間(ms) |
| `COMBO_WINDOW_MS` | 3000 | コンボ時間窓(ms) |
| `COMBO_DISPLAY_MIN` | 2 | コンボ表示最小値 |
| `ENEMY_DEATH_DURATION_MS` | 300 | 敵撃破アニメ時間(ms) |
| `BOSS_WARNING_DURATION_MS` | 1200 | ボスWARNING表示時間(ms) |
| `BOSS_DETECTION_RANGE` | 5 | ボス検知距離(タイル) |
| `BOSS_CHARGE_DURATION_MS` | 300 | ボス溜めモーション時間(ms) |
| `MEGA_BOSS_EXPLOSION_WAVES` | 3 | メガボス爆発波数 |
| `MEGA_BOSS_WAVE_INTERVAL_MS` | 400 | メガボス爆発波間隔(ms) |
| `LEVEL_UP_FLASH_DURATION_MS` | 200 | レベルアップフラッシュ時間(ms) |
| `STAGE_INTRO_DURATION_MS` | 1500 | ステージ開始演出時間(ms) |

## 付録 B: 変更ファイルマトリックス

| ファイル | Ph.0A | Ph.0B | Ph.1 | Ph.2 | Ph.3 | 種別 |
|---------|-------|-------|------|------|------|------|
| `viewport.ts` | 変更 | | | | | 既存 |
| `IpnePage.styles.ts` | 変更 | | | | | 既存 |
| `config.ts` | | 変更 | | | | 既存 |
| `playerSprites.ts` | | 変更 | | | | 既存 |
| `enemySprites.ts` | | 変更 | | | | 既存 |
| `tileSprites.ts` | | 変更 | | | | 既存 |
| `trapSprites.ts` | | 変更 | | | | 既存 |
| `wallSprites.ts` | | 変更 | | | | 既存 |
| `effectSprites.ts` | | 変更 | | | | 既存 |
| `itemSprites.ts` | | 変更 | | | | 既存 |
| `spriteData.test.ts` | | 変更 | | | | 既存 |
| `Game.tsx` | 変更 | | 変更 | 変更 | 変更 | 既存 |
| `effectTypes.ts` | | | | 変更 | | 既存 |
| `effectManager.ts` | | | | 変更 | 変更 | 既存 |
| `particleSystem.ts` | | | | 変更 | | 既存 |
| `combat.ts` | | | | 変更 | | 既存 |
| `types.ts` | | | | 変更 | | 既存 |
| `bgm.ts` | | | | | 変更 | 既存 |
| `useGameLoop.ts` | | | | 変更 | 変更 | 既存 |
| `useGameState.ts` | | | | | 変更 | 既存 |
| `feedback.ts` | | | 変更 | 変更 | 変更 | 既存 |
| `useCanvasSize.ts` | 新規 | | | | | 新規 |
| `aura.ts` | | | 新規 | | | 新規 |
| `weaponEffect.ts` | | | 新規 | | | 新規 |
| `floatingText.ts` | | | | 新規 | | 新規 |
| `combo.ts` | | | | 新規 | | 新規 |
| `bossEffects.ts` | | | | 新規 | | 新規 |
