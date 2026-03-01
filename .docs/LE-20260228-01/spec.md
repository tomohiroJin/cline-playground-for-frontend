# 迷宮の残響 ブラッシュアップ — 仕様書

## 目次

1. [画像アセット仕様](#1-画像アセット仕様)
2. [画像管理・表示システム仕様](#2-画像管理表示システム仕様)
3. [状態異常ビジュアルオーバーレイ仕様](#3-状態異常ビジュアルオーバーレイ仕様)
4. [パララックス背景仕様](#4-パララックス背景仕様)
5. [BGM・サウンドスケープ仕様](#5-bgmサウンドスケープ仕様)
6. [キーボード操作仕様](#6-キーボード操作仕様)
7. [情報値ヒント強化仕様](#7-情報値ヒント強化仕様)
8. [探索ログ改善仕様](#8-探索ログ改善仕様)
9. [初回プレイガイダンス仕様](#9-初回プレイガイダンス仕様)
10. [SNSシェアカード仕様](#10-snsシェアカード仕様)
11. [実績通知演出仕様](#11-実績通知演出仕様)
12. [TypeScript型安全性改善仕様](#12-typescript型安全性改善仕様)
13. [コンポーネントテスト仕様](#13-コンポーネントテスト仕様)

---

## 1. 画像アセット仕様

### 1.1 共通画像仕様

| 項目 | 値 |
|------|-----|
| 出力サイズ | 960×540 px（Retina対応、表示は480×270） |
| フォーマット | WebP（品質82%） |
| サイズ上限 | 300KB/枚 |
| 画風 | 温かみのある物語的写実主義 × 重厚なダンジョンファンタジーアート |
| タッチ | 油絵調の筆致 ＋ 重厚なダンジョンファンタジー |
| 照明 | ドラマチックなキアロスクーロ（松明・魔法光源の明暗対比） |
| 色調 | ダークベース ＋ 各シーンのテーマカラーアクセント |
| 禁則 | テキスト、ウォーターマーク、署名は含めない |
| 配置 | `src/assets/images/` |
| 命名規則 | `le_{カテゴリ}_{識別子}.webp` |

### 1.2 フロアパララックス背景画像（15枚）

#### 命名規則

```
le_bg_{フロア番号}_{レイヤー}.webp
```
- レイヤー: `far`（遠景）/ `mid`（中景）/ `near`（前景）

#### 画像一覧

| # | ファイル名 | フロア | レイヤー | 描写内容 | 主な配色 |
|---|-----------|--------|---------|---------|---------|
| 1 | `le_bg_1_far.webp` | 表層回廊 | 遠景 | 奥に続く暗い回廊、微かな光源 | 暖色系の薄暗いオレンジ〜ブラウン |
| 2 | `le_bg_1_mid.webp` | 表層回廊 | 中景 | 石造りのアーチ、苔むした壁面 | オリーブグリーン〜ブラウン |
| 3 | `le_bg_1_near.webp` | 表層回廊 | 前景 | 柱の影、蜘蛛の巣の破片 | 濃い影（半透明） |
| 4 | `le_bg_2_far.webp` | 灰色の迷路 | 遠景 | 無限に続く灰色の壁、薄い霧 | 灰色〜青灰色 |
| 5 | `le_bg_2_mid.webp` | 灰色の迷路 | 中景 | T字路の分岐、壁の幾何学模様 | シルバーグレー |
| 6 | `le_bg_2_near.webp` | 灰色の迷路 | 前景 | 壁の欠片、石の破片 | 濃いグレー（半透明） |
| 7 | `le_bg_3_far.webp` | 深淵の間 | 遠景 | 底の見えない深淵、微かに光る結晶 | 深い藍色〜シアン |
| 8 | `le_bg_3_mid.webp` | 深淵の間 | 中景 | 巨大な柱列、崩れかけた橋 | 暗い青紫 |
| 9 | `le_bg_3_near.webp` | 深淵の間 | 前景 | 光る結晶の破片、岩の輪郭 | シアン（半透明） |
| 10 | `le_bg_4_far.webp` | 忘却の底 | 遠景 | 歪んだ空間、非ユークリッド的構造 | 暗紫〜マゼンタ |
| 11 | `le_bg_4_mid.webp` | 忘却の底 | 中景 | 崩壊した柱、浮遊する瓦礫 | 暗い紫 |
| 12 | `le_bg_4_near.webp` | 忘却の底 | 前景 | 歪んだ枠、浮遊する石片 | 紫（半透明） |
| 13 | `le_bg_5_far.webp` | 迷宮の心臓 | 遠景 | 脈打つ有機的壁面、赤い光脈 | 深い赤〜暗赤 |
| 14 | `le_bg_5_mid.webp` | 迷宮の心臓 | 中景 | 心臓のような構造体、鼓動するリズム | 赤〜暗紅 |
| 15 | `le_bg_5_near.webp` | 迷宮の心臓 | 前景 | 光る血管のような線、熱の歪み | 赤橙（半透明） |

#### 前景レイヤーの特別要件

- 前景（`near`）レイヤーは**大部分が透明**であること
- 画面端に沿ったフレーム的な要素のみ描画
- 中央部は完全に透明にしてゲームコンテンツを阻害しない

### 1.3 イベントシーンイラスト（15枚）

#### 命名規則

```
le_scene_{イベントID}.webp
```

#### 画像一覧

| # | ファイル名 | イベント | 描写内容 | 主な配色 |
|---|-----------|---------|---------|---------|
| 1 | `le_scene_e030.webp` | ボス戦（迷宮の核） | 脈動する巨大な結晶体、放射状の光脈、周囲を取り囲む有機的壁面 | 深紅＋白い光 |
| 2 | `le_scene_floor1_key.webp` | 第1層代表イベント | 薄暗い回廊の先に見える微かな光、石壁に残る爪痕 | オレンジ〜ブラウン |
| 3 | `le_scene_floor2_key.webp` | 第2層代表イベント | 灰色の壁が左右に延々と続く十字路、天井の高さが分からない | グレー〜ブルーグレー |
| 4 | `le_scene_floor3_key.webp` | 第3層代表イベント | 深い穴の底から見上げた空間、遥か上に微かな光 | 藍色〜シアン |
| 5 | `le_scene_floor4_key.webp` | 第4層代表イベント | 重力が歪んだ空間、逆さまの階段、浮遊する瓦礫 | 紫〜マゼンタ |
| 6 | `le_scene_floor5_key.webp` | 第5層代表イベント | 赤く脈打つ通路、壁面から伸びる光の触手 | 赤〜暗赤 |
| 7 | `le_scene_chain_climax1.webp` | チェインイベント結末1 | 崩壊する通路からの脱出場面 | 暖色系（オレンジ〜赤） |
| 8 | `le_scene_chain_climax2.webp` | チェインイベント結末2 | 隠された部屋の発見、古びた宝箱のような構造物 | 金色〜アンバー |
| 9 | `le_scene_chain_climax3.webp` | チェインイベント結末3 | 予期せぬ味方（前回の冒険者の記録）の発見 | 暖かい白〜ベージュ |
| 10 | `le_scene_crossrun1.webp` | クロスランイベント1 | 前回の冒険の痕跡（壁に刻まれた印） | フロアに応じた色 |
| 11 | `le_scene_crossrun2.webp` | クロスランイベント2 | 時空が歪んだ回想シーン | セピア〜モノクロ |
| 12 | `le_scene_crossrun3.webp` | クロスランイベント3 | デジャヴ的な光景（同じ場面の微妙に異なるバージョン） | 既存画像の色調変化 |
| 13 | `le_scene_status_bleed.webp` | 出血状態 | 暗い空間に赤い飛沫、鋭い痛みの表現 | 赤〜暗赤、黒背景 |
| 14 | `le_scene_status_fear.webp` | 恐怖状態 | 暗闇の中に浮かぶ不気味な形状、逃げ場のない狭い空間 | 暗い紫〜黒 |
| 15 | `le_scene_status_curse.webp` | 呪い状態 | 不気味に光る紋様が浮かぶ空間、歪んだ光 | 暗い緑〜紫 |

### 1.4 状態異常オーバーレイ画像（5枚）

#### 命名規則

```
le_overlay_{状態異常名}.webp
```

#### 特別要件

- **全体が半透明**: ゲームコンテンツの上にオーバーレイするため
- **中央が透明**: 視認性を確保するため、効果は主に画面端に集中
- **ループ可能なテクスチャ**: CSSアニメーションと組み合わせて動的に表示

| # | ファイル名 | 状態異常 | 描写内容 | 表示方式 |
|---|-----------|---------|---------|---------|
| 1 | `le_overlay_injured.webp` | 負傷 | 画面端に沿ったひび割れテクスチャ、薄い赤み | `opacity: 0.3`、固定表示 |
| 2 | `le_overlay_confused.webp` | 混乱 | 紫色の渦巻きモヤ、画面端に集中 | `opacity: 0.25`、ゆっくり回転 |
| 3 | `le_overlay_bleeding.webp` | 出血 | 画面上端と下端の赤い滴り | `opacity: 0.35`、下方向にゆっくりスライド |
| 4 | `le_overlay_fear.webp` | 恐怖 | 四隅から忍び寄る暗黒の触手状の影 | `opacity: 0.3`、不規則なパルス |
| 5 | `le_overlay_curse.webp` | 呪い | 浮遊する不気味な紋様、歪んだ光の輪 | `opacity: 0.2`、ゆっくり回転＋拡縮 |

### 1.5 タイトル画面パララックスレイヤー（2枚）

| # | ファイル名 | レイヤー | 描写内容 |
|---|-----------|---------|---------|
| 1 | `le_title_far.webp` | 遠景 | 遥か遠くに見える迷宮のシルエット、霧に包まれた暗い空 |
| 2 | `le_title_mid.webp` | 中景 | 迷宮の入口付近の構造物、微かに光る紋様 |

※ 既存の `le_title.webp` を近景として再利用

---

## 2. 画像管理・表示システム仕様

### 2.1 `images.ts` の拡張

**対象ファイル**: `src/features/labyrinth-echo/images.ts`

#### 現行構造

```typescript
// 既存の画像importが26個定義されている
import leTitle from '../../assets/images/le_title.webp';
// ... 26 imports
export const LE_IMAGES = { title: leTitle, ... };
```

#### 拡張内容

新しい画像カテゴリを追加:

```typescript
// 既存の LE_IMAGES に加えて以下を追加

/** フロアパララックス背景 */
export const LE_BG_IMAGES: Record<number, {
  far: string;
  mid: string;
  near: string;
}>;

/** イベントシーンイラスト（イベントID → 画像） */
export const LE_SCENE_IMAGES: Record<string, string>;

/** 状態異常オーバーレイ */
export const LE_OVERLAY_IMAGES: Record<string, string>;

/** タイトルパララックスレイヤー */
export const LE_TITLE_LAYERS: {
  far: string;
  mid: string;
};
```

### 2.2 イベント画像の選択ロジック

**対象ファイル**: `src/features/labyrinth-echo/components/EventResultScreen.tsx`

イベント表示時の画像選択フロー:

```
1. イベントIDに対応する固有画像があるか？ → LE_SCENE_IMAGES[eventId]
2. なければ、イベント種別の共通画像 → LE_IMAGES.event_{type}
```

#### 変更内容

```typescript
// 画像選択関数を新設
function getEventImage(eventId: string, eventType: string): string {
  // 固有画像が存在すればそちらを使用
  if (LE_SCENE_IMAGES[eventId]) {
    return LE_SCENE_IMAGES[eventId];
  }
  // フォールバック: 既存のイベント種別画像
  return LE_IMAGES[`event_${eventType}`];
}
```

### 2.3 画像のプリロード機構

**対象ファイル**: `src/features/labyrinth-echo/hooks.ts` に新規フック追加

```typescript
/**
 * 次に必要な画像を事前にロードするフック
 * フロア遷移前に次フロアの背景画像をプリロードする
 */
export function useImagePreload(currentFloor: number): void;
```

プリロード対象:
- 次フロアの背景画像3枚（far/mid/near）
- 現在のフロアで出現しうるイベントの固有画像

---

## 3. 状態異常ビジュアルオーバーレイ仕様

### 3.1 オーバーレイコンポーネント

**新規ファイル**: `src/features/labyrinth-echo/components/StatusOverlay.tsx`

```typescript
interface StatusOverlayProps {
  /** 現在のプレイヤーの状態異常リスト */
  statuses: string[];
}
```

### 3.2 レイヤー構成

```
┌─────────────────────────────┐
│    StatusOverlay (z-index: 5)│  ← 状態異常オーバーレイ
│  ┌─────────────────────────┐│
│  │  EventResultScreen      ││  ← ゲームコンテンツ (z-index: 1)
│  │  (テキスト・選択肢)     ││
│  └─────────────────────────┘│
│    Page背景 (z-index: 0)    │
└─────────────────────────────┘
```

### 3.3 アニメーション定義

| 状態異常 | CSSアニメーション | パラメータ |
|---------|------------------|-----------|
| 負傷 | なし（固定表示） | `opacity: 0.3` |
| 混乱 | `@keyframes confusionSpin` | `rotate(0deg) → rotate(360deg)`、8秒周期 |
| 出血 | `@keyframes bleedDrip` | `translateY(-10%) → translateY(10%)`、3秒周期 |
| 恐怖 | `@keyframes fearPulse` | `opacity: 0.15 → 0.4`、2秒周期、ease-in-out |
| 呪い | `@keyframes curseFloat` | `rotate(-5deg) scale(0.95) → rotate(5deg) scale(1.05)`、6秒周期 |

### 3.4 複数状態異常の重複表示

- 複数の状態異常が同時にある場合、各オーバーレイを重ねて表示
- 各オーバーレイの `opacity` を状態異常の数に応じて調整:
  - 1つ: 元の opacity
  - 2つ: opacity × 0.8
  - 3つ以上: opacity × 0.6
- 視認性が損なわれないよう、最大でも合計 opacity は0.5を超えない

---

## 4. パララックス背景仕様

### 4.1 背景コンポーネント

**新規ファイル**: `src/features/labyrinth-echo/components/ParallaxBg.tsx`

```typescript
interface ParallaxBgProps {
  /** フロア番号 (1-5) */
  floor: number;
  /** スクロール位置 (0.0 - 1.0) */
  scrollProgress: number;
}
```

### 4.2 レイヤー設定

| レイヤー | z-index | パララックス係数 | opacity | CSSフィルター |
|---------|---------|----------------|---------|-------------|
| 遠景 (far) | -3 | 0.1 | 0.4 | `blur(2px)` |
| 中景 (mid) | -2 | 0.3 | 0.3 | `blur(1px)` |
| 前景 (near) | -1 | 0.5 | 0.2 | なし |

### 4.3 パララックス計算

```typescript
// スクロール量に応じた各レイヤーの translateY 計算
const farOffset = scrollProgress * PARALLAX_FAR_FACTOR * MAX_OFFSET;
const midOffset = scrollProgress * PARALLAX_MID_FACTOR * MAX_OFFSET;
const nearOffset = scrollProgress * PARALLAX_NEAR_FACTOR * MAX_OFFSET;
```

定数:
```typescript
const PARALLAX_FAR_FACTOR = 0.1;
const PARALLAX_MID_FACTOR = 0.3;
const PARALLAX_NEAR_FACTOR = 0.5;
const MAX_OFFSET = 50; // px
```

### 4.4 フロア遷移アニメーション

フロアが変わる際の背景遷移:
- 現在のフロア背景: `opacity 1 → 0`（500ms fade-out）
- 新フロア背景: `opacity 0 → 1`（800ms fade-in、200ms遅延）
- 遷移中は暗転（`opacity: 0` の状態が300ms）

### 4.5 タイトル画面パララックス

タイトル画面では `mousemove` イベントに反応するパララックス:

```typescript
// マウス位置に応じたオフセット計算
const mouseXRatio = (mouseX - centerX) / centerX; // -1.0 〜 1.0
const mouseYRatio = (mouseY - centerY) / centerY;

const farOffsetX = mouseXRatio * 5;  // 遠景: 最大5px
const farOffsetY = mouseYRatio * 3;
const midOffsetX = mouseXRatio * 10; // 中景: 最大10px
const midOffsetY = mouseYRatio * 6;
```

---

## 5. BGM・サウンドスケープ仕様

### 5.1 AudioEngine拡張

**対象ファイル**: `src/features/labyrinth-echo/audio.ts`

#### 既存構造への追加

```typescript
// AudioEngine クラスに以下を追加

/** BGMの再生/停止 */
bgm: {
  /** フロアBGMの開始 */
  startFloorBgm(floor: number): void;
  /** BGMの停止（フェードアウト） */
  stopBgm(fadeMs?: number): void;
  /** イベント種別に応じたBGM変化 */
  setEventMood(type: 'exploration' | 'encounter' | 'trap' | 'rest' | 'boss'): void;
  /** BGMボリューム設定 (0.0 - 1.0) */
  setBgmVolume(vol: number): void;
}
```

### 5.2 BGMノード構成

```
OscillatorNode (基音)
  └→ GainNode (基音ボリューム)
       └→ BiquadFilterNode (ローパスフィルター)
            └→ GainNode (マスターBGM)
                 └→ AudioContext.destination

OscillatorNode (パッド音)
  └→ GainNode (パッドボリューム)
       └→ BiquadFilterNode (バンドパスフィルター)
            └→ GainNode (マスターBGM)

OscillatorNode (LFO)
  └→ GainNode (LFO深度)
       └→ 基音の frequency (FM変調)
```

### 5.3 フロア別BGMパラメータ

| パラメータ | 第1層 | 第2層 | 第3層 | 第4層 | 第5層 |
|-----------|------|------|------|------|------|
| 基音周波数 (Hz) | 65 | 58 | 49 | 44 | 41 |
| 基音波形 | sine | sine | triangle | sawtooth | sawtooth |
| パッド周波数 (Hz) | 196 | 175 | 147 | 131 | 123 |
| パッド波形 | sine | triangle | triangle | sawtooth | square |
| LPFカットオフ (Hz) | 800 | 600 | 400 | 300 | 200 |
| LFO速度 (Hz) | 0.1 | 0.15 | 0.2 | 0.08 | 0.3 |
| LFO深度 | 2 | 3 | 5 | 2 | 8 |
| 基音ボリューム | 0.08 | 0.10 | 0.12 | 0.06 | 0.15 |
| パッドボリューム | 0.05 | 0.06 | 0.08 | 0.04 | 0.10 |

### 5.4 イベントムード変化

イベント種別に応じてBGMパラメータをリアルタイムに変更:

| ムード | LPFカットオフ変化 | パッドボリューム変化 | LFO速度変化 |
|--------|-----------------|-------------------|------------|
| 探索 | ×1.0（変化なし） | ×1.0 | ×1.0 |
| 遭遇 | ×1.5 | ×1.5 | ×2.0 |
| 罠 | ×0.7 | ×0.5 | ×1.5 |
| 安息 | ×2.0 | ×0.8 | ×0.5 |
| ボス | ×2.0 | ×2.0 | ×3.0 |

パラメータ遷移: `linearRampToValueAtTime` で 500ms かけて滑らかに変化。

### 5.5 危機時BGM変化

HP/MN低下時のBGM演出:

| 条件 | BGM変化 |
|------|---------|
| HP ≤ 50% | LPFカットオフを20%低下 |
| HP ≤ 25% | LPFカットオフを40%低下、パッドに不協和音（+半音）追加 |
| MN ≤ 30% | LFO深度を2倍に増加（音の揺らぎが大きくなる） |
| MN ≤ 15% | BGM全体にディストーション（`WaveShaperNode`）追加 |

### 5.6 追加効果音

**`audio.ts` の `sfx` オブジェクトに追加**:

| 効果音名 | パラメータ | 用途 |
|---------|-----------|------|
| `page` | 800Hz + 1200Hz, 50ms, sine, vol 0.015 | テキスト表示完了 |
| `unlock` | 523/659/784/1047Hz, gap 80ms, dur 100ms, sine, vol 0.08 + ノイズ 0.2s vol 0.02 | アンロック解放 |
| `titleGlow` | 200→400Hz sweep, 1s, sine, vol 0.03 | タイトル画面グロー |
| `endingFanfare` | 523/659/784/880/1047/1319Hz, gap 100ms, dur 150ms, sine, vol 0.1 + 200Hz pad 2s vol 0.05 | エンディング到達 |
| `curseApply` | 100→50Hz sweep, 0.8s, sawtooth, vol 0.06 + 400/401Hz ビート 1s vol 0.04 | 呪い付与 |
| `secondLife` | 262/330/392/523Hz, gap 60ms, dur 200ms, sine, vol 0.1 + 100→800Hz sweep 0.5s | セカンドライフ発動 |

### 5.7 音声設定の拡張

| 設定項目 | 型 | デフォルト | 保存先 |
|---------|-----|-----------|--------|
| `sfxEnabled` | boolean | false | localStorage（既存） |
| `bgmEnabled` | boolean | false | localStorage（新規） |
| `bgmVolume` | number (0-1) | 0.5 | localStorage（新規） |
| `sfxVolume` | number (0-1) | 0.7 | localStorage（新規） |

設定画面に BGM ON/OFF トグルと音量スライダーを追加。

---

## 6. キーボード操作仕様

### 6.1 キーマッピング

**対象ファイル**: `src/features/labyrinth-echo/LabyrinthEchoGame.tsx`（または新規フック）

| キー | 画面 | 動作 |
|------|------|------|
| `1` | イベント画面 | 選択肢1を選択 |
| `2` | イベント画面 | 選択肢2を選択 |
| `3` | イベント画面 | 選択肢3を選択（存在する場合） |
| `Enter` | テキスト表示中 | テキスト表示をスキップ（全文表示） |
| `Enter` | 結果画面 | 「先に進む」ボタンと同等 |
| `Space` | テキスト表示中 | テキスト表示をスキップ |
| `Space` | フロアイントロ | フロアに進む |
| `Escape` | ゲーム中 | タイトル画面に戻る（確認ダイアログ表示） |
| `L` | ゲーム中 | ログの展開/折りたたみ |
| `M` | 全画面 | 音声 ON/OFF 切り替え |

### 6.2 実装方式

```typescript
/**
 * キーボード操作を管理するカスタムフック
 */
export function useKeyboardControls(
  phase: GamePhase,
  choices: Choice[],
  isTextRevealing: boolean,
  onChoose: (index: number) => void,
  onAdvance: () => void,
  onSkipText: () => void,
  onToggleLog: () => void,
  onToggleSound: () => void,
  onEscape: () => void
): void;
```

- `useEffect` 内で `window.addEventListener('keydown', handler)` を登録
- `phase` の変更時にリスナーを再登録
- キーの重複押下防止（`event.repeat` をチェック）
- テキスト表示中は選択肢キー（1/2/3）を無効化

### 6.3 選択肢のキーボードインジケーター

選択肢ボタンの左端に小さなキーバインド表示を追加:

```
┌─────────────────────────────┐
│ [1] 慎重に進む              │
├─────────────────────────────┤
│ [2] 壁の隙間を調べる        │
├─────────────────────────────┤
│ [3] 引き返す                │
└─────────────────────────────┘
```

- キーバインド表示: `font-size: 0.7em`、`opacity: 0.5`、選択肢ラベルの左に配置
- モバイルデバイスでは非表示（`@media (hover: hover)` で判定）

---

## 7. 情報値ヒント強化仕様

### 7.1 INFレベル別ヒント表示

**対象ファイル**: `src/features/labyrinth-echo/components/EventResultScreen.tsx`

| INF値 | ヒントレベル | 表示内容 |
|-------|------------|---------|
| 0-14 | なし | ヒントなし（現行通り） |
| 15-19 | Lv.1 | 条件タイプのアイコン表示（現行通り） |
| 20-29 | Lv.2 | 条件の閾値レンジ表示（例: 「体力が充分なら...」） |
| 30+ | Lv.3 | 結果カテゴリの表示（回復/ダメージ/情報/フラグ） |

### 7.2 ヒント表示の詳細

#### Lv.2 閾値レンジ表示

条件文字列を人間可読に変換:

| 条件パターン | 表示テキスト |
|-------------|------------|
| `hp>50` | 「体力に余裕があるなら...」 |
| `hp>30` | 「体力が充分なら...」 |
| `hp<20` | 「体力が尽きかけているなら...」 |
| `mn>50` | 「精神が安定しているなら...」 |
| `mn>30` | 「精神が保たれているなら...」 |
| `mn<20` | 「精神が限界に近いなら...」 |
| `inf>20` | 「情報が集まっているなら...」 |
| `inf>10` | 「ある程度の情報があるなら...」 |
| `status:xxx` | 「特定の状態にあるなら...」 |

#### Lv.3 結果カテゴリ表示

結果の `mods` を分析して表示:

| カテゴリ | 判定条件 | 表示アイコン |
|---------|---------|------------|
| 回復 | `hp > 0` または `mn > 0` | 緑の＋マーク |
| ダメージ | `hp < 0` または `mn < 0` | 赤の−マーク |
| 情報 | `inf > 0` | 黄色の眼マーク |
| フラグ | `flag` が設定されている | 青い旗マーク |
| 複合 | 上記が複数該当 | 複数アイコン表示 |

### 7.3 ヒントのアニメーション

- ヒントテキスト/アイコンは選択肢表示後に `200ms` 遅延して `fadeIn`（0.3s）
- Lv.2テキストは `font-size: 0.75em`、`opacity: 0.6`、選択肢テキストの下に表示
- Lv.3アイコンは選択肢ボタンの右端に配置

---

## 8. 探索ログ改善仕様

### 8.1 ログ表示の改善

**対象ファイル**: `src/features/labyrinth-echo/components/GameComponents.tsx`

#### ステータス変化の色分け

| 変化対象 | 正の変化 | 負の変化 |
|---------|---------|---------|
| HP | `#4ade80`（緑） | `#ef4444`（赤） |
| MN | `#60a5fa`（青） | `#a855f7`（紫） |
| INF | `#fbbf24`（黄） | `#94a3b8`（灰） |

#### フロアセパレーター

```
── 第1層 表層回廊 ──
[探索] 暗い通路を進む → 宝箱を発見 (INF +5)
[遭遇] 影が蠢く → 戦って進む (HP -10, MN -3)
[罠] 足元に罠 → 回避成功 (INF +3)
── 第2層 灰色の迷路 ──
...
```

### 8.2 ログフィルター機能

| フィルター | 表示対象 |
|-----------|---------|
| 全て | すべてのログエントリ |
| ダメージ | HP/MN が減少したエントリ |
| 回復 | HP/MN が増加したエントリ |
| フラグ | 特殊フラグ（近道発見・連鎖・脱出等）があるエントリ |

フィルターUIは小さなタブボタンとして、ログ展開時の上部に表示。

### 8.3 ログのコピー機能

- ログ展開時に「ログをコピー」ボタンを追加
- クリックでプレーンテキスト形式のログを `navigator.clipboard.writeText()` でコピー
- コピー成功時に短いフィードバック表示（「コピーしました」トースト、1秒後消滅）

---

## 9. 初回プレイガイダンス仕様

### 9.1 ガイダンス表示条件

```typescript
// localStorage に 'le_tutorial_done' が存在しない場合に表示
const isFirstPlay = !localStorage.getItem('le_tutorial_done');
```

### 9.2 ガイダンスステップ

| ステップ | 画面 | ガイダンス内容 | 対象要素 |
|---------|------|--------------|---------|
| 1 | 難易度選択 | 「初めての探索は『探索者』がおすすめです」 | 探索者カード |
| 2 | 最初のイベント | 「選択肢をクリック（またはキーボードの数字キー）で選びます」 | 選択肢ボタン |
| 3 | 結果画面 | 「HP（体力）、MN（精神力）、INF（情報値）に注目しましょう」 | ステータスバー |
| 4 | 2回目のイベント | 「情報値が上がると、選択のヒントが見えるようになります」 | INFバー |

### 9.3 ガイダンスUI

- ハイライト対象要素の周囲をぼかし（backdrop-filter: blur）
- ハイライト対象にパルスボーダー（`@keyframes guidePulse`）
- ガイダンステキストは対象の近くにツールチップ風に表示
- 「OK」ボタンで次のステップへ / 「スキップ」ボタンで全ステップを飛ばし
- 最終ステップ完了時に `localStorage.setItem('le_tutorial_done', '1')` を保存

### 9.4 ステータスバーのツールチップ

ガイダンス完了後も常時利用可能なツールチップ:

| 要素 | ツールチップテキスト |
|------|-------------------|
| HPバー | 「体力。0になるとゲームオーバー」 |
| MNバー | 「精神力。毎ターン侵蝕で低下。0になるとゲームオーバー」 |
| INFバー | 「情報値。高いほど有利な選択肢が見つかる」 |
| 状態異常タグ | 各状態異常の効果説明 |

---

## 10. SNSシェアカード仕様

### 10.1 カード生成

**新規ファイル**: `src/features/labyrinth-echo/share-card.ts`

#### カードレイアウト

```
┌──────────────────────────────────┐  600×315 px
│  [エンディング画像 (半透明)]      │
│                                   │
│  ╔════════════════════════╗      │
│  ║   迷宮の残響           ║      │
│  ║   ── {エンディング名} ──║      │
│  ╚════════════════════════╝      │
│                                   │
│  HP: ████░░░░ 45/100             │
│  MN: ██░░░░░░ 23/80              │
│  INF: ██████░░ 35/50             │
│                                   │
│  階層: 5/5  状態: 負傷, 呪い     │
│                                   │
│  #迷宮の残響 #LabyrinthEcho      │
└──────────────────────────────────┘
```

#### カード仕様

| 項目 | 値 |
|------|-----|
| サイズ | 600×315 px (Twitterカード最適比率) |
| 背景 | エンディング画像 + 暗いオーバーレイ (`rgba(8, 8, 24, 0.7)`) |
| フォント | システムフォント (sans-serif) |
| タイトルフォントサイズ | 24px |
| ステータスフォントサイズ | 14px |
| 色 | ゲーム内UIと統一 |

### 10.2 カード生成API

```typescript
/**
 * エンディングシェアカードを生成する
 * @returns data URL (image/png) の Promise
 */
export async function generateShareCard(params: {
  endingId: string;
  endingName: string;
  endingImage: string;
  hp: number;
  maxHp: number;
  mn: number;
  maxMn: number;
  inf: number;
  maxInf: number;
  floor: number;
  statuses: string[];
  difficulty: string;
}): Promise<string>;
```

### 10.3 シェアボタン

| ボタン | 動作 |
|--------|------|
| 「画像を保存」 | Canvas → PNG → ダウンロード |
| 「Xでシェア」 | テキスト付きのX(Twitter)投稿URLを開く（Web Intent） |
| 「テキストコピー」 | プレイ結果のテキスト概要をクリップボードにコピー |

シェアテキスト例:
```
迷宮の残響 — {エンディング名}
階層: {floor}/5 | 難易度: {diff}
HP: {hp}/{maxHp} MN: {mn}/{maxMn} INF: {inf}/{maxInf}
#迷宮の残響 #LabyrinthEcho
```

---

## 11. 実績通知演出仕様

### 11.1 トースト通知コンポーネント

**新規**: `src/features/labyrinth-echo/components/AchievementToast.tsx`

```typescript
interface AchievementToastProps {
  /** 通知タイトル（称号名やアンロック名） */
  title: string;
  /** 通知テキスト */
  description: string;
  /** 通知タイプ */
  type: 'unlock' | 'title' | 'ending' | 'achievement';
  /** 表示中かどうか */
  isVisible: boolean;
}
```

### 11.2 通知タイプ別スタイル

| タイプ | ボーダー色 | アイコン | 効果音 |
|--------|-----------|---------|--------|
| unlock | `#60a5fa`（青） | 鍵アイコン | `unlock` |
| title | `#fbbf24`（金） | 王冠アイコン | `levelUp` |
| ending | `#a855f7`（紫） | 星アイコン | `victory` |
| achievement | `#4ade80`（緑） | トロフィーアイコン | `unlock` |

### 11.3 アニメーション

```css
/* 通知表示 */
@keyframes toastSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 通知消滅 */
@keyframes toastFadeOut {
  from { opacity: 1; }
  to { opacity: 0; transform: translateY(-10px); }
}
```

- 表示: 右からスライドイン (300ms)
- 維持: 3000ms
- 消滅: フェードアウト (500ms)
- 位置: 画面右下（ステータスバーと重ならない位置）

---

## 12. TypeScript型安全性改善仕様

### 12.1 @ts-nocheck 除去対象

現在 `@ts-nocheck` が付与されているファイルを特定し、段階的に除去する。

#### 除去手順

1. ファイルから `@ts-nocheck` を削除
2. TypeScriptコンパイラのエラーを確認
3. 型エラーを修正（`any` → `unknown` + 型ガード等）
4. 既存テストが全てパスすることを確認

#### 優先順位

| 優先度 | ファイル | 理由 |
|--------|---------|------|
| 高 | `game-logic.ts` | ゲームのコアロジック |
| 高 | `events/event-utils.ts` | イベント処理のコアロジック |
| 中 | `LabyrinthEchoGame.tsx` | メインコンポーネント |
| 中 | `components/*.tsx` | UIコンポーネント群 |
| 低 | `audio.ts` | Web Audio API の型が複雑 |
| 低 | `styles.ts` | CSSスタイルオブジェクト |

### 12.2 イベントデータの型整合性チェック

`event-data.ts` の163件のイベントデータに対する型チェックテストを追加:

```typescript
describe('イベントデータの整合性', () => {
  it('全イベントが必須フィールドを持つ', () => { ... });
  it('条件文字列が正しいフォーマット', () => { ... });
  it('参照先チェインイベントが存在する', () => { ... });
  it('フロア指定が有効な範囲内', () => { ... });
});
```

---

## 13. コンポーネントテスト仕様

### 13.1 テストフレームワーク

- `@testing-library/react` + `jest`（既存環境を使用）
- テストファイル配置: `src/features/labyrinth-echo/__tests__/`

### 13.2 テスト対象と優先度

| 優先度 | コンポーネント | テスト観点 |
|--------|-------------|-----------|
| 高 | TitleScreen | 初回/2回目以降の表示切り替え、ボタン動作 |
| 高 | EventResultScreen | テキスト表示、選択肢レンダリング、ヒント表示 |
| 高 | DiffSelectScreen | 4難易度カードの表示、クリア済みバッジ |
| 中 | EndScreens | エンディング表示、KP表示、ボタン動作 |
| 中 | FloorIntroScreen | フロア情報表示、ステータスサマリー |
| 低 | CollectionScreens | アンロック一覧表示、KP消費 |
| 低 | SettingsScreens | 設定項目表示、リセット確認 |

### 13.3 テストパターン（AAA）

```typescript
describe('EventResultScreen', () => {
  describe('テキスト表示', () => {
    it('イベントテキストが表示される', () => {
      // Arrange
      const event = createMockEvent();
      // Act
      render(<EventResultScreen event={event} ... />);
      // Assert
      expect(screen.getByText(event.text)).toBeInTheDocument();
    });
  });

  describe('選択肢', () => {
    it('テキスト表示完了後に選択肢が表示される', () => { ... });
    it('選択肢をクリックするとonChooseが呼ばれる', () => { ... });
    it('INF 15以上でヒントアイコンが表示される', () => { ... });
  });
});
```

### 13.4 カバレッジ目標

| 対象 | カバレッジ目標 |
|------|-------------|
| 新規コンポーネント（StatusOverlay, ParallaxBg, AchievementToast, ShareCard） | 80%以上 |
| 既存コンポーネント（修正対象のみ） | 70%以上 |
| 新規ユーティリティ関数 | 90%以上 |
| 新規フック | 80%以上 |

---

## 付録A: 変更対象ファイルマトリックス

| ファイル | Ph.1 | Ph.2 | Ph.3 | Ph.4 | Ph.5 | Ph.6 |
|---------|------|------|------|------|------|------|
| `images.ts` | **変更** | | | | | |
| `audio.ts` | | **変更** | | | **型修正** | |
| `LabyrinthEchoGame.tsx` | | | **変更** | | **型修正** | テスト |
| `hooks.ts` | **変更** | | **変更** | | | |
| `styles.ts` | **変更** | | | | | |
| `EventResultScreen.tsx` | **変更** | | **変更** | | | テスト |
| `FloorIntroScreen.tsx` | **変更** | | | | | テスト |
| `TitleScreen.tsx` | **変更** | | | | | テスト |
| `EndScreens.tsx` | **変更** | | | **変更** | | テスト |
| `GameComponents.tsx` | | | **変更** | | | テスト |
| `Page.tsx` | **変更** | | | | | |
| `game-logic.ts` | | | **変更** | | **型修正** | |
| `definitions.ts` | | | **変更** | | | |
| `events/event-utils.ts` | | | | | **型修正** | |
| `events/event-data.ts` | **変更** | | | | | テスト |
| `StatusOverlay.tsx` (新規) | **新規** | | | | | テスト |
| `ParallaxBg.tsx` (新規) | **新規** | | | | | テスト |
| `AchievementToast.tsx` (新規) | | | | **新規** | | テスト |
| `share-card.ts` (新規) | | | | **新規** | | テスト |
| `keyboard-controls.ts` (新規) | | | **新規** | | | テスト |

## 付録B: 定数一覧（新規追加分）

| 定数名 | 値 | 用途 |
|--------|-----|------|
| `PARALLAX_FAR_FACTOR` | 0.1 | 遠景パララックス係数 |
| `PARALLAX_MID_FACTOR` | 0.3 | 中景パララックス係数 |
| `PARALLAX_NEAR_FACTOR` | 0.5 | 前景パララックス係数 |
| `PARALLAX_MAX_OFFSET` | 50 | パララックス最大オフセット (px) |
| `BGM_FADE_MS` | 1000 | BGMフェードアウト時間 (ms) |
| `MOOD_TRANSITION_MS` | 500 | BGMムード遷移時間 (ms) |
| `HINT_LV2_THRESHOLD` | 20 | Lv.2ヒント表示のINF閾値 |
| `HINT_LV3_THRESHOLD` | 30 | Lv.3ヒント表示のINF閾値 |
| `TOAST_DISPLAY_MS` | 3000 | トースト通知の表示時間 (ms) |
| `TOAST_FADE_MS` | 500 | トースト通知のフェードアウト時間 (ms) |
| `SHARE_CARD_WIDTH` | 600 | シェアカードの幅 (px) |
| `SHARE_CARD_HEIGHT` | 315 | シェアカードの高さ (px) |
| `GUIDE_STEP_COUNT` | 4 | ガイダンスステップ数 |
| `OVERLAY_MAX_OPACITY` | 0.5 | 状態異常オーバーレイの最大合計opacity |
| `FLOOR_TRANSITION_FADE_MS` | 500 | フロア遷移フェードアウト時間 (ms) |
| `FLOOR_TRANSITION_IN_MS` | 800 | フロア遷移フェードイン時間 (ms) |
