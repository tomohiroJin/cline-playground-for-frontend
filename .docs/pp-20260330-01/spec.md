# 原始進化録（primal-path）UI リサイズ仕様書

## 1. レスポンシブレイアウト仕様

### 1.1 ブレイクポイント定義

```
$bp-mobile:  600px   // モバイル上限
$bp-tablet: 1024px   // タブレット上限
$bp-pc:     1025px+  // PC
```

### 1.2 GameShell サイズ仕様

| プロパティ | モバイル (≤600px) | タブレット (601-1024px) | タブレット横向き | PC (≥1025px) |
|-----------|-----------------|---------------------|---------------|-------------|
| width | 100vw | min(90vw, 700px) | min(90vw, 960px) | 720px |
| height | 100vh; 100dvh | min(90vh, 960px) | min(90vh, 700px) | 960px |
| border | none | 2px solid #2a2a3e | 2px solid #2a2a3e | 2px solid #2a2a3e |
| border-radius | 0 | 8px | 8px | 8px |
| box-shadow | none | 0 0 40px #0008 | 0 0 40px #0008 | 0 0 40px #0008 |

**dvh フォールバック**:
```css
/* dvh 非対応ブラウザ向けフォールバック */
height: 100vh;
height: 100dvh; /* 対応ブラウザではこちらが優先 */
```

**横向きタブレット**:
```css
@media (min-width: 601px) and (max-width: 1024px) and (orientation: landscape) {
  /* 幅と高さの比率を調整 */
}
```

### 1.3 GameContainer 仕様

```css
GameContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  /* PC では画面中央に配置 */
}
```

## 2. CSS 変数（デザイントークン）仕様

### 2.1 フォントサイズトークン

```css
:root {
  /* PC デフォルト */
  --fs-title: clamp(22px, 4vw, 28px);
  --fs-subtitle: clamp(15px, 2.5vw, 18px);
  --fs-button: 15px;
  --fs-body: 14px;
  --fs-panel: 13px;
  --fs-small: 12px;
  --fs-tiny: 11px;  /* 全デバイスで 11px 以上を保証 */
}

@media (max-width: 600px) {
  :root {
    --fs-button: 13px;
    --fs-body: 13px;
    --fs-panel: 12px;
    --fs-small: 11px;
    --fs-tiny: 11px;  /* 10px → 11px に引き上げ（視認性確保） */
  }
}
```

### 2.2 スペーシングトークン

```css
:root {
  --sp-screen-pad: 14px 20px;   /* Screen 内パディング */
  --sp-section-gap: 14px;       /* セクション間のギャップ */
  --sp-card-pad: 12px;          /* カード内パディング */
  --sp-btn-pad: 10px 22px;      /* ボタンパディング */
}

@media (max-width: 600px) {
  :root {
    --sp-screen-pad: 10px 14px;
    --sp-section-gap: 10px;
    --sp-card-pad: 8px;
    --sp-btn-pad: 8px 18px;
  }
}
```

### 2.3 カラーパレットトークン

現在 JS 定数（`TC`, `CAT_CL`, `LOG_COLORS`）にハードコードされている色を CSS 変数化し、将来のテーマ切替（バイオーム別テーマ等）の基盤を作る。

```css
:root {
  /* 基本 UI カラー */
  --c-accent: #f0c040;          /* ゴールド（タイトル、アクティブ状態） */
  --c-text: #e0d8c8;            /* オフホワイト（本文） */
  --c-text-muted: #908870;      /* ブラウン（サブテキスト） */
  --c-text-dim: #605848;        /* ダークブラウン（非アクティブ） */
  --c-bg: #12121e;              /* ダークネイビー（背景） */
  --c-bg-deep: #0a0a12;         /* 最背面 */
  --c-border: #2a2a3e;          /* ボーダー */
  --c-border-inner: #262636;    /* 内側ボーダー */

  /* 文明タイプカラー */
  --c-civ-tech: #f08050;        /* テクノロジー（オレンジ） */
  --c-civ-life: #50e090;        /* ライフ（グリーン） */
  --c-civ-rit: #d060ff;         /* リチュアル（パープル） */
  --c-civ-bal: #e0c060;         /* バランス（ゴールド） */

  /* カテゴリカラー */
  --c-cat-atk: #f08050;
  --c-cat-hp: #50e090;
  --c-cat-def: #50c8e8;
  --c-cat-crit: #f0c040;

  /* ゲーム色彩心理に基づく機能カラー */
  --c-danger: #f05050;           /* 赤: 緊急・危険 */
  --c-safe: #50e090;             /* 緑: 安全・報酬 */
  --c-info: #50c8e8;             /* 青: 情報 */
  --c-reward: #f0c040;           /* 金: 実績・報酬 */
}
```

### 2.4 ゲームサイズトークン

```css
:root {
  --game-width: 720px;
  --game-height: 960px;
}

@media (max-width: 600px) {
  :root {
    --game-width: 100vw;
    --game-height: 100vh;
    --game-height: 100dvh;
  }
}
```

## 3. フォントサイズ変更仕様

### 3.1 styled-components マッピング

| コンポーネント | 現在の font-size | 変更後 |
|-------------|----------------|--------|
| `Title` | 22px | var(--fs-title) |
| `SubTitle` | 14px | var(--fs-subtitle) |
| `GameButton` | 12px | var(--fs-button) |
| `Screen` のデフォルト | （未設定） | var(--fs-body) |
| `PanelBox` 内テキスト | 10px | var(--fs-panel) |
| `StatLine` | 9px〜10px | var(--fs-small) |
| `BattleLog` テキスト | 8px〜9px | var(--fs-tiny) |
| `HpBar` ラベル | 9px | var(--fs-small) |
| `SkillBtn` | 10px | var(--fs-panel) |
| `CivBadge` | 8px | var(--fs-tiny) |
| `AffinityBadge` | 8px | var(--fs-tiny) |

## 4. スプライト仕様

### 4.1 スケール変更

全スプライトの描画スケールを変更。Canvas のピクセルサイズは据え置き、`scale` パラメータを変更。

| 対象 | 関数 | scale パラメータ | 変更前 | 変更後 |
|------|------|----------------|--------|--------|
| プレイヤー | `drawPlayer` | scale | 2 | 3 |
| 敵（通常） | `drawEnemy` | scale | 2 | 3 |
| 敵（ボス） | `drawEnemy` | scale | 2 | 3 |
| 仲間 | `drawPlayer` | scale | 2 | 3 |
| タイトルロゴ | `drawTitle` | (Canvas要素) | 1.5× CSS | 2× CSS |

### 4.2 呼び出し箇所の Canvas サイズ更新

各コンポーネントで Canvas の width/height 属性を更新：

| コンポーネント | 現在の Canvas サイズ | 変更後 |
|-------------|-------------------|--------|
| PlayerPanel | width=40, height=55 | width=54, height=72 |
| EnemyPanel（通常） | 34×34 | 52×52 |
| EnemyPanel（ボス） | 52×52 | 76×76 |
| AllyList 内 | 24×32 | 36×48 |
| TitleScreen | style: 3.6倍 | style: 4× |
| EventScreen | 32×44 CSS | 48×66 CSS |

### 4.3 品質向上ディテール

#### プレイヤースプライト追加描画

文明タイプに応じた装飾パーツを追加:

- **tech**: 頭部に小さな歯車マーク（2px）
- **life**: 背中に葉のシルエット（2px）
- **rit**: 額に紋章ドット（1px）
- **bal**: 肩に調和の光点（1px）

#### ボススプライト追加描画

- 全ボス: 足元に影（半透明黒ドット列）
- マンモス: 象牙のハイライト追加
- 火竜: 翼端にグローエフェクト
- 神獣: 目の周囲に光のドット

## 5. 個別画面レイアウト仕様

### 5.1 BattleScreen

```
BattleScrollArea:
  padding: 8px → 12px

BattleLog:
  max-height: calc(var(--game-height, 960px) * 0.22)  /* GameShell 高さに連動（約 211px） */
  font-size: var(--fs-tiny)
  line-height: 1.5 → 1.6

SkillBtn:
  min-width: 96px → 120px
  min-height: 44px → 52px
  font-size: var(--fs-panel)
  padding: 6px 10px → 8px 14px

BattleFixedBottom:
  padding: 6px 0 4px → 10px 0 8px
```

### 5.2 EvolutionScreen

```
EvoCard:
  padding: 8px → 12px

EvoCard 内テキスト:
  font-size: var(--fs-small) 以上

EvoCard の Canvas:
  scale 3× に統一
```

### 5.3 TitleScreen

```
タイトルロゴ Canvas:
  max-width: 480px (変更なし、CSS スケールで対応)

メニューボタン:
  font-size: var(--fs-button)
  min-width: 160px (拡大)
  padding: var(--sp-btn-pad)
```

### 5.4 EventScreen

```
EventCard:
  padding: 12px
  font-size: var(--fs-body)

EventChoices ボタン:
  font-size: var(--fs-button)
  min-height: 48px
```

### 5.5 その他の画面

- HowToPlayScreen: 本文 var(--fs-body)、見出し var(--fs-subtitle)
- GameOverScreen: スコア表示 var(--fs-title)、詳細 var(--fs-body)
- AchievementScreen: 実績名 var(--fs-panel)、説明 var(--fs-small)
- StatsScreen: ステータス値 var(--fs-panel)
- TreeScreen: ノード表示 var(--fs-small)

## 6. アニメーション調整

### 6.1 天候パーティクルの動的対応

天候パーティクルの移動距離を固定値からゲームサイズトークンに連動させる。

```css
/* 変更前（固定値） */
@keyframes snowfall { to { transform: translateY(720px) ... } }
@keyframes ember    { to { transform: translateY(-740px) ... } }

/* 変更後（CSS 変数連動） */
@keyframes snowfall { to { transform: translateY(var(--game-height, 960px)) ... } }
@keyframes ember    { to { transform: translateY(calc(var(--game-height, 960px) * -1)) ... } }
```

**注意**: `@keyframes` 内で CSS 変数が使えない場合は、JavaScript で GameShell の実寸を取得し、インラインスタイルで設定する。

### 6.2 `prefers-reduced-motion` 対応

```css
@media (prefers-reduced-motion: reduce) {
  /* 装飾的アニメーションを無効化 */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* ゲームプレイに必要なアニメーションは個別に例外指定 */
  /* 例: ダメージポップアップ、HP バー変化 */
}
```

対象アニメーション:
- **無効化**: `titleGlow`, `snowfall`, `ember`, `spore`, `rareGlow`, `pulse`, `pausePulse`, `skillPulse`, `fadeInUp`
- **維持**: `flashHit`, `flashDmg`, `flashHeal`, `popupFloat`（ゲームフィードバックに必要）
- **短縮**: `shake`（0.3s → 0.1s）

### 6.3 `image-rendering` ブラウザ互換性

```css
/* スケール 3× に拡大するため、ブラウザ間の差異に対応 */
image-rendering: pixelated;
image-rendering: -webkit-optimize-contrast; /* Safari フォールバック */
```

## 7. アクセシビリティ

- タッチターゲット: 全インタラクティブ要素 44×44px 以上
- コントラスト: 既存のダークテーマカラーは変更なし（WCAG AA 準拠済み）
- フォント最小サイズ: **11px**（全デバイス共通の下限）
- `prefers-reduced-motion: reduce` 対応（§6.2 参照）
- フォーカスインジケーター: キーボードナビゲーション時に視認可能なアウトラインを保証
- 色のみに依存しない情報伝達: HP バー等でアイコン・テキストによる補助を検討

## 8. Canvas 描画関数の座標系確認

スプライトスケール変更（2× → 3×）に伴い、以下の描画関数の座標計算が正しく追従するか確認が必要。

| 関数 | 確認項目 |
|------|---------|
| `drawDmgPopup` | `popup.fs`（フォントサイズ）がスケールに連動するか、ポップアップの出現位置 |
| `drawEnemyHpBar` | HP バーの Y 座標（Canvas 下部からのオフセット）、バー幅 |
| `drawBurnFx` | 軌道半径（Canvas 中心からの距離）、パーティクルサイズ |
| `drawTitle` | Canvas 内部の全描画座標（タイトル文字、星エフェクト等） |
| `drawAlly` | 仲間スプライトの装飾位置 |

**対応方針**: 各関数内の座標値がハードコードの場合、`scale` パラメータに乗じた計算に修正する。
