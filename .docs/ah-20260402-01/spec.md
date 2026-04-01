# Air Hockey — VsScreen ラベル・トースト通知・Canvas 描画最適化 仕様書

## S7-1: VsScreen P3/P4 操作タイプラベル表示

### 概要

2v2（ペアマッチ）の VS 演出画面で、P3（敵1）/ P4（敵2）の操作タイプ（CPU / 人間）を
キャラクターパネル下部にラベルとして表示する。P2 の実装パターン（`allyControlType`）を踏襲。

### Props 拡張

```typescript
// VsScreen.tsx — 追加 Props
type VsScreenProps = {
  // ... 既存 Props ...
  allyControlType?: 'cpu' | 'human';       // P2（実装済み）
  enemy1ControlType?: 'cpu' | 'human';     // P3（新規）
  enemy2ControlType?: 'cpu' | 'human';     // P4（新規）
};
```

### ラベル表示仕様

| スロット | controlType | 表示ラベル |
|---------|-------------|-----------|
| P2 (ally) | `'cpu'` | `CPU` |
| P2 (ally) | `'human'` | `2P` |
| P3 (enemy1) | `'cpu'` | `CPU` |
| P3 (enemy1) | `'human'` | `3P` |
| P4 (enemy2) | `'cpu'` | `CPU` |
| P4 (enemy2) | `'human'` | `4P` |
| 任意 | `undefined` | ラベル非表示 |

### 表示位置・スタイル

既存の `CharacterPanel` の `label` prop をそのまま使用。
キャラクター名の下にラベルテキストを表示。

| 項目 | CPU ラベル | 人間操作ラベル（2P/3P/4P） |
|------|-----------|--------------------------|
| フォントサイズ | `12px` | `12px` |
| 色 | `#888`（控えめグレー） | チームカラー（Team1: `#3498db` / Team2: `#e74c3c`） |
| ウェイト | normal | bold |

> **R-1 反映**: 既存の `10px #aaa` から `12px` に拡大。人間操作ラベルはチームカラーで着色し、
> 2v2 の情報密度が高い画面でもチーム帰属が一目で分かるようにする。

### データフロー

```
useGameMode (enemy1ControlType, enemy2ControlType)
  ↓
AirHockeyGame.tsx — VsScreen に Props として渡す
  ↓
VsScreen.tsx — CharacterPanel の label に変換
  ↓
CharacterPanel — ラベル描画
```

### AirHockeyGame.tsx 変更箇所

VsScreen 呼び出し部分（2v2 レイアウト）で `enemy1ControlType` / `enemy2ControlType` を渡す。
値は `useGameMode` フックから取得（既に管理されている状態）。

---

## S7-2: ゲームパッド接続/切断トースト通知（Canvas 描画）

### 概要

ゲームパッドの接続/切断イベント発生時に、Canvas 上にトースト通知を表示する。
既存の `useGamepadInput` フックが管理する `toast` 状態を Canvas 描画パイプラインに接続する。

### トースト描画仕様

| 項目 | 値 |
|------|-----|
| 表示位置 | Canvas 下部中央（水平中央、**下端から 100px**） |
| 背景色（接続時） | `rgba(0, 128, 0, 0.8)`（緑系 — 安全セマンティクス） |
| 背景色（切断時） | `rgba(128, 0, 0, 0.8)`（赤系 — 危険セマンティクス） |
| 背景形状 | 角丸矩形（borderRadius: 8px） |
| 背景幅 | **動的** — `ctx.measureText(message).width + paddingX * 2` |
| パディング | 水平 20px、垂直 10px |
| フォント | `bold 14px 'Arial', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif` |
| 文字色 | `#ffffff` |
| 表示時間 | 3000ms（`useGamepadInput` の `TOAST_DURATION` に準拠） |
| フェードアウト | 最後 500ms で opacity を 1.0 → 0.0 に線形遷移 |

> **MF-1 反映**: フォントフォールバックに `'Segoe UI Emoji'`, `'Apple Color Emoji'` を追加。
> 絵文字 `🎮` の Canvas レンダリングを安定させる。
>
> **MF-2 反映**: Y 座標を下端 60px → **100px** に変更。既存 HUD（スピードアップ `H-25`、
> 非表示 `H-45`）との重複を回避。
>
> **R-2 反映**: 背景幅を固定値ではなく `measureText` ベースの動的計算に変更。
>
> **SG-1 反映**: 接続/切断で背景色を色分け。ゲーム色彩セマンティクス（緑=安全、赤=危険）と一致させ、
> 文字を読まずに状況を把握可能にする。

### メッセージ形式

既存の `useGamepadInput` が生成するメッセージをそのまま使用:
- 接続: `🎮 コントローラー {index} が接続されました`
- 切断: `🎮 コントローラー {index} が切断されました`

### 接続/切断の判定

トースト描画時に背景色を切り替えるため、メッセージ内容から接続/切断を判定する:

```typescript
const isDisconnect = toast.message.includes('切断');
const bgColor = isDisconnect
  ? 'rgba(128, 0, 0, 0.8)'   // 赤系（切断）
  : 'rgba(0, 128, 0, 0.8)';  // 緑系（接続）
```

### 描画フロー

```
useGamepadInput.toast (message, timestamp)
  ↓
useGameLoop — ゲームループの描画フェーズ
  ↓
ui-renderer.drawToast(toast, now)
  ├── toast が undefined なら即 return
  ├── 経過時間を計算
  ├── TOAST_DURATION を超えていたら描画スキップ
  ├── 残り 500ms 以内なら opacity を減衰
  ├── ctx.globalAlpha を設定
  ├── メッセージから接続/切断を判定 → 背景色を選択
  ├── measureText でテキスト幅を計測 → 背景幅を算出
  ├── 角丸矩形背景を描画
  └── テキストを描画
```

### ui-renderer 追加メソッド

```typescript
// UIRenderer に追加
drawToast(toast: { message: string; timestamp: number } | undefined, now: number): void
```

### フェードアウト計算

```typescript
const TOAST_DURATION = 3000;   // トースト表示時間（ms）
const FADE_DURATION = 500;     // フェードアウト時間（ms）

const elapsed = now - toast.timestamp;
if (elapsed >= TOAST_DURATION) return; // 表示期間終了

const fadeStart = TOAST_DURATION - FADE_DURATION;
const opacity = elapsed < fadeStart
  ? 1.0
  : 1.0 - (elapsed - fadeStart) / FADE_DURATION;
```

### 角丸矩形描画

```typescript
// Canvas 2D の roundRect API（主要ブラウザ対応済み）を使用
ctx.beginPath();
ctx.roundRect(x, y, width, height, 8);
ctx.fill();
```

※ `roundRect` 未対応環境は対象外（モダンブラウザのみサポート）

---

## S7-3: Canvas 描画最適化

### 概要

2v2 モード（4 マレット + パック + エフェクト）での描画パフォーマンスを改善する。
FPS 計測基盤（S6-4 実装済み）を活用してベースラインを取得し、最適化の効果を定量評価する。

### 最適化施策

#### S7-3a: quickReject を processCollisions に統合

**現状:** `quickReject` 関数は実装・テスト済みだが、`processCollisions` 内で未使用。

**変更内容:**
- `processCollisions` 内のマレット-パック衝突判定前に `quickReject` を挿入
- 遠距離のマレットとの衝突計算をスキップ
- `maxDist` = `PUCK_RADIUS + MALLET_RADIUS + QUICK_REJECT_MARGIN` で設定

```typescript
/**
 * 速度による 1 フレーム移動分のバッファ。
 * パックの最大速度が ~15px/frame の場合、2px のマージンで
 * すり抜けを防止しつつ十分な早期リターン効果を得る。
 */
const QUICK_REJECT_MARGIN = 2;

// processCollisions 内
for (const mallet of mallets) {
  if (quickReject(puck, mallet, PUCK_RADIUS + MALLET_RADIUS + QUICK_REJECT_MARGIN)) {
    continue; // 衝突不可能 → スキップ
  }
  // 詳細な衝突判定...
}
```

> **R-3 反映**: マージン値を `QUICK_REJECT_MARGIN = 2` として名前付き定数化。
> コメントで用途（速度による 1 フレーム移動分のバッファ）を明記。

#### S7-3b: 破壊済み障害物の描画スキップ

**現状:** `drawField` で全障害物を毎フレーム描画。

**変更内容:**
- `destroyed === true` の障害物は描画をスキップ
- 破壊アニメーション完了後は描画ループから完全除外

#### S7-3c: パーティクル描画のバッチ最適化

**現状:** パーティクルを 1 個ずつ `ctx.beginPath()` → `ctx.arc()` → `ctx.fill()` で描画。

**変更内容:**
- 同色のパーティクルをグループ化し、1 回の `beginPath` / `fill` で描画
- パーティクル数が 0 の場合は関数呼び出し自体をスキップ

#### S7-3d: ctx.save/restore の最小化

**現状:** 各描画関数で `ctx.save()` / `ctx.restore()` を個別に呼び出し。

**変更内容:**
- 連続する描画で状態変更が不要な場合は `save/restore` を省略
- 特にフォント・色が同一の連続描画（HUD 等）で効果的

### パフォーマンス計測方法

1. **ベースライン取得**: 最適化前に 2v2 モードで 30 秒間の平均 FPS を記録
2. **各施策適用後**: 同条件で FPS を計測し、改善幅を記録
3. **計測条件**: 2v2 モード、4 マレット全 CPU、エフェクトアイテム有効
4. **計測ツール**: 既存の FPS 計測基盤（開発モード左上表示）+ Chrome DevTools Performance

### 成功基準

- 2v2 モードで安定 60 FPS（ターゲットフレームレート）
- FPS の最低値が最適化前より改善
- 既存テスト全パス（物理演算の挙動変更なし）
