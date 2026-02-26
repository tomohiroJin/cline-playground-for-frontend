# KEYS & ARMS ブラッシュアップ — 詳細仕様書

## Phase 1: 基盤整備・メタデータ修正

### 1.1 game-notices.ts メタデータ修正

**対象ファイル**: `src/constants/game-notices.ts` L81-86

**変更前**:
```typescript
'/keys-and-arms': {
  name: 'KEYS & ARMS',
  hasAudio: false,
  hasFlashing: false,
  recommendedDevice: 'both',
},
```

**変更後**:
```typescript
'/keys-and-arms': {
  name: 'KEYS & ARMS',
  hasAudio: true,
  hasFlashing: true,
  recommendedDevice: 'both',
},
```

**根拠**:
- `hasAudio: true` — `core/audio.ts` で Web Audio API による効果音・BGM を生成（`createAudio()` の `tn()`, `noise()`, `bgmTick()` 関数）
- `hasFlashing: true` — `engine.ts` L210-219 でビートパルス・ダメージフラッシュ・ヒットストップフラッシュを描画

---

### 1.2 ポーズ機能

#### 1.2.1 engine.ts — G オブジェクト拡張

**対象**: `engine.ts` L56-107 の G オブジェクト

`bgmBeat: 0,` (L75) の直後に追加:
```typescript
paused: false,
```

#### 1.2.2 engine.ts — gameTick() にポーズ処理追加

**対象**: `engine.ts` L146-191 の `gameTick()` 関数

ESC リセット確認処理（L162-165）の**前**に、ポーズトグル処理を挿入:

```typescript
// ポーズトグル（ゲームプレイ中のみ）
if (J('p') && G.state !== 'title' && G.state !== 'over'
    && G.state !== 'trueEnd' && G.state !== 'ending1' && G.state !== 'help') {
  G.paused = !G.paused;
  clearJ(); return;
}

// ポーズ中はティックスキップ（ただしESCは受け付ける）
if (G.paused) {
  // ESC でリセット確認（ポーズ中も有効）
  if (J('escape')) {
    G.paused = false;
    G.resetConfirm = 90;
  }
  clearJ(); return;
}
```

**動作仕様**:
- `P` キーでポーズ/再開をトグル
- ポーズ中は全ゲームロジック（ビート進行、敵AI、パーティクル等）がスキップされる
- ポーズ中に ESC を押すとポーズ解除 + リセット確認に遷移
- タイトル画面、ゲームオーバー画面、エンディング画面、ヘルプ画面ではポーズ不可

#### 1.2.3 engine.ts — render() にポーズオーバーレイ追加

**対象**: `engine.ts` L196-253 の `render()` 関数

リセット確認オーバーレイ（L247）の**前**に追加:

```typescript
// ポーズオーバーレイ
if (G.paused) {
  $.fillStyle = 'rgba(26,40,16,.65)'; $.fillRect(0, 0, W, H);
  $.fillStyle = BG;
  txtC('PAUSED', W / 2, H / 2 - 20, 16);
  if (Math.floor(G.tick / 18) % 2) {
    txtC('P: RESUME    ESC: TITLE', W / 2, H / 2 + 14, 6);
  }
}
```

**描画仕様**:
- 半透明の暗いオーバーレイ（LCD グリーン系）
- 中央に "PAUSED" テキスト（サイズ 16）
- 点滅で操作ガイド表示（18 ティック周期）

#### 1.2.4 KeysAndArmsGame.tsx — P キー対応

**対象**: `KeysAndArmsGame.tsx` L55-61

preventDefault 対象のキーリストに `'p'`, `'P'` を追加:

```typescript
if (
  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'z', 'Z', 'Escape', 'Enter', 'p', 'P'].includes(
    e.key
  )
)
```

#### 1.2.5 KeysAndArmsGame.tsx — PAUSE ボタン追加

**対象**: `KeysAndArmsGame.tsx` L103-106 の ShellHeader 内

```jsx
<ShellHeader>
  <Label>&#9670; KEYS &amp; ARMS &#9670;</Label>
  <div style={{ display: 'flex', gap: '4px' }}>
    <PauseButton {...btnProps('p')}>PAUSE</PauseButton>
    <RstButton {...btnProps('Escape')}>RST</RstButton>
  </div>
</ShellHeader>
```

#### 1.2.6 styles.ts — PauseButton スタイル

**対象**: `styles.ts` に新規エクスポート追加

```typescript
export const PauseButton = styled(BaseButton)`
  width: 44px;
  height: 20px;
  border-radius: 10px;
  font-size: 4px;
  background: linear-gradient(155deg, #333, #1a1a1a);
  color: #777;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  &:active {
    transform: translateY(2px);
  }
`;
```

---

### 1.3 テスト基盤

#### 1.3.1 math.test.ts

**対象**: `src/features/keys-and-arms/__tests__/math.test.ts` (新規)

**テスト対象関数** (`core/math.ts`):
- `TAU` — 定数値 `2 * Math.PI` と一致
- `clamp(v, lo, hi)` — 下限・上限・範囲内の各ケース
- `rng(lo, hi)` — 範囲内の値を返す（複数回実行で分布確認）
- `rngInt(lo, hi)` — 整数を返す、範囲内
- `rngSpread(spread)` — `-spread` ～ `+spread` の範囲
- `shuffle(a)` — 配列の全要素が保持される、長さ不変

**予定テストケース数**: 12

#### 1.3.2 particles.test.ts

**対象**: `src/features/keys-and-arms/__tests__/particles.test.ts` (新規)

**テスト対象** (`core/particles.ts`):
- `Particles.spawn()` — プールにパーティクルを追加、パラメータが正しく設定される
- `Particles.updateAndDraw()` — ライフ減少、座標更新、ライフ切れで削除
- `Popups.add()` — ポップアップ追加
- `Popups.clear()` — ポップアップクリア
- `Popups.updateAndDraw()` — ライフ減少、上昇移動、ライフ切れで削除

**モック**: Canvas 2D コンテキストをモック化（`fillRect`, `fillStyle`, `globalAlpha`）

**予定テストケース数**: 10

---

### 1.4 README.md 更新

**対象**: `src/features/keys-and-arms/README.md`

追記内容:
- 操作方法セクションに `P` キー / PAUSE ボタンの説明
- 注意事項セクション追加（Web Audio API による音声あり、フラッシュ演出あり）
- 各ステージの簡易操作説明

---

## Phase 2: ユーザー体験・演出強化

### 2.1 操作ガイド画面

#### 2.1.1 screens/help.ts (新規)

**ファイル**: `src/features/keys-and-arms/screens/help.ts`

```typescript
export function createHelpScreen(ctx) {
  const { G, draw, audio } = ctx;
  const { $, txtC, txt, onFill, px } = draw;

  // 入力ヘルパー
  function J(k) { return G.jp[k.toLowerCase()]; }

  // 3ページ構成
  const PAGES = [
    { title: 'CAVE STAGE', content: drawCaveHelp },
    { title: 'PRAIRIE STAGE', content: drawPrairieHelp },
    { title: 'CASTLE STAGE', content: drawCastleHelp },
  ];

  function drawHelp() { ... }  // ページ描画
  function update() { ... }    // 入力処理（←→でページ切替、ESC/Zで戻る）

  return { draw: drawHelp, update };
}
```

**3ページの内容**:

| ページ | タイトル | 説明内容 |
|--------|---------|---------|
| 1 | CAVE STAGE | 矢印キーで移動、Z で鍵を拾う/置く、トラップの避け方 |
| 2 | PRAIRIE STAGE | ↑↓→ で攻撃方向、← でガード、コンボの仕組み |
| 3 | CASTLE STAGE | ←→ で移動、Z で宝石設置、↑ シールド、↓ カウンター |

**画面レイアウト**:
- 上部: ページタイトル（大文字、サイズ 14）
- 中央: 操作説明テキスト + 簡易スプライト図示
- 下部: ページインジケータ（`< 1/3 >`）、`Z/ESC: BACK`
- LCD グリーン背景を維持

#### 2.1.2 engine.ts — help ステート追加

**G オブジェクト追加**:
```typescript
helpPage: 0,
```

**gameTick() switch 文に追加** (`engine.ts` L177 付近):
```typescript
case 'help': helpScreen.update(); break;
```

**render() switch 文に追加** (`engine.ts` L229 付近):
```typescript
case 'help': helpScreen.draw(); break;
```

**モジュール生成に追加** (`engine.ts` L125 付近):
```typescript
const helpScreen = createHelpScreen(ctx);
```

**import 追加** (`engine.ts` L16 付近):
```typescript
import { createHelpScreen } from './screens/help';
```

#### 2.1.3 title.ts — ヘルプ遷移追加

**対象**: `screens/title.ts` L22-74 の `drawTitle()` 内

タイトル画面の描画に `HELP` プロンプトを追加:
```typescript
// ヘルププロンプト（スタートプロンプトの下に追加）
$.globalAlpha = .5;
txtC('\\u2191: HELP', W / 2, 224, 6);
$.globalAlpha = 1;
```

**engine.ts の title ケースにヘルプ遷移を追加**:
gameTick 内の `case 'title':` ブロック（L181-186 付近）に追加:
```typescript
if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
```

---

### 2.2 トランジション演出強化

#### 2.2.1 hud.ts — transTo 拡張

**対象**: `core/hud.ts` L90-93

**変更前**:
```typescript
function transTo(t, fn) {
  G.trT = 42; G.trTxt = t; G.trFn = fn; G.bgmBeat = 0;
  if (tn) tn(200, .15, 'triangle', .03);
}
```

**変更後**:
```typescript
function transTo(t, fn, sub) {
  G.trT = 56; G.trTxt = t; G.trFn = fn; G.trSub = sub || ''; G.bgmBeat = 0;
  if (tn) tn(200, .15, 'triangle', .03);
}
```

**G オブジェクトに追加** (`engine.ts` L84 付近):
```typescript
trSub: '',
```

#### 2.2.2 hud.ts — drawTrans 拡張

**対象**: `core/hud.ts` L96-113

**変更前のタイミング**:
- 全体 42 ティック、L99 で 21 ティック目にコールバック実行
- `p = (42-trT)/21` または `trT/21` で V字進行度

**変更後のタイミング**:
- 全体 56 ティック、28 ティック目にコールバック実行
- `p = (56-trT)/28` または `trT/28` で V字進行度

```typescript
function drawTrans() {
  if (G.trT <= 0) return false;
  G.trT--;
  if (G.trT === 28 && G.trFn) G.trFn();
  const p = G.trT > 28 ? (56 - G.trT) / 28 : G.trT / 28;
  const wh = Math.floor(H * p);
  $.fillStyle = `rgba(176,188,152,.95)`;
  $.fillRect(0, H / 2 - wh / 2, W, wh);
  if (p > .4) {
    $.globalAlpha = (p - .4) / .6;
    txtC(G.trTxt, W / 2, H / 2 - 10, 12);
    // サブテキスト
    if (G.trSub) {
      $.globalAlpha *= .6;
      txtC(G.trSub, W / 2, H / 2 + 8, 6);
    }
    const lw = 80 * Math.min(1, (p - .4) * 3);
    $.fillStyle = ON; $.globalAlpha *= .2;
    $.fillRect(W / 2 - lw / 2, H / 2 + 18, lw, 1);
  }
  $.globalAlpha = 1;
  return true;
}
```

#### 2.2.3 トランジションサブテキスト例

各ステージ遷移時の `transTo()` 呼び出しにサブテキストを追加:

| 遷移 | メインテキスト | サブテキスト | 対象ファイル |
|------|-------------|------------|------------|
| ゲーム開始 → 洞窟 | `'CAVE'` | `'FIND 3 KEYS'` | `screens/title.ts` |
| 洞窟 → 草原 | `'PRAIRIE'` | `'DEFEAT ENEMIES'` | `stages/cave/index.ts` |
| 草原 → ボス | `'CASTLE'` | `'SET 6 GEMS'` | `stages/prairie/index.ts` |
| ボス → 次ループ | `'LOOP X'` | `'HARDER!'` | `stages/boss/index.ts` |
| エンディング → ループ 2 | `'LOOP 2'` | `'HARDER!'` | `screens/ending.ts` |
| 真エンディング → ループ 4 | `'LOOP 4 — BEYOND'` | `'HARDER!'` | `screens/true-end.ts` |

**補足**: `title.ts` の `startGame()` は直接 `G.cavInit()` を呼び出していたが、`transTo('CAVE', G.cavInit, 'FIND 3 KEYS')` に変更し、ゲーム開始時もトランジション演出を経由するようにした。

---

### 2.3 洞窟ドアグロー強化

**対象**: `stages/cave/index.ts` L426-432 付近

**変更前**:
```typescript
if (C.keysPlaced > 0) {
  const glw = C.keysPlaced / 3;
  onFill(.04 * glw + Math.sin(G.tick * .06) * .02 * glw);
  circle(cx, by + 14, 20 + C.keysPlaced * 4);
}
```

**変更後**:
```typescript
if (C.keysPlaced > 0) {
  const glw = C.keysPlaced / 3;
  // 外側グロー（大きく薄い）
  onFill(.02 * glw + Math.sin(G.tick * .04) * .01 * glw);
  circle(cx, by + 14, 32 + C.keysPlaced * 6);
  // 内側グロー（既存強化）
  onFill(.06 * glw + Math.sin(G.tick * .06) * .025 * glw);
  circle(cx, by + 14, 20 + C.keysPlaced * 4);
  $.globalAlpha = 1;
  // 全鍵設置時のゴールドフラッシュ
  if (C.keysPlaced === 3) {
    const gfa = Math.sin(G.tick * .12) * .5 + .5;
    $.fillStyle = `rgba(200,180,80,${gfa * .08})`;
    circle(cx, by + 14, 26 + gfa * 8);
    $.globalAlpha = 1;
  }
}
```

---

### 2.4 ボス演出強化

#### 2.4.1 レイジウェーブフラッシュ強化

**対象**: `stages/boss/index.ts` — `rageWave` 関連の描画処理

レイジウェーブ発動時（`G.bos.rageWave > 0`）に画面全体のフラッシュ演出を追加:

```typescript
// レイジウェーブ発動時の画面フラッシュ
if (G.bos.rageWave > 0 && G.bos.rageWave < 8) {
  const rfa = (8 - G.bos.rageWave) / 8;
  $.fillStyle = `rgba(40,10,0,${rfa * .15})`;
  $.fillRect(0, 0, W, H);
  $.globalAlpha = 1;
}
```

#### 2.4.2 宝石光柱演出

**対象**: `stages/boss/index.ts` — 宝石設置時の台座描画処理

宝石が台座に設置された際の光柱（ライトビーム）演出:

```typescript
// 設置済み宝石の光柱
if (peds[i] === 1) {
  const beamAlpha = .04 + Math.sin(G.tick * .08 + i * 1.2) * .02;
  $.fillStyle = `rgba(160,200,120,${beamAlpha})`;
  const bx = pedX - 2, bw = 4;
  $.fillRect(bx, 0, bw, pedY);
}
```

---

## Phase 3: テスト拡充・仕上げ

### 3.1 テスト戦略

**モック方針**:
- Canvas 2D コンテキスト: `jest.fn()` で全メソッドをモック化
- AudioContext: `window.AudioContext` をモック化（`createOscillator`, `createGain` 等）
- localStorage: Jest のデフォルトモック使用

**テストパターン**: AAA（Arrange / Act / Assert）

### 3.2 audio.test.ts

**対象**: `src/features/keys-and-arms/__tests__/audio.test.ts` (新規)

| テストケース | 内容 |
|------------|------|
| `ea()` で AudioContext が生成される | 初回呼び出しで AudioContext コンストラクタが呼ばれる |
| `ea()` の冪等性 | 2回目の呼び出しで新規 AudioContext を生成しない |
| `tn()` でオシレータが生成される | createOscillator → connect → start → stop の呼び出し検証 |
| `noise()` でバッファソースが生成される | createBufferSource の呼び出し検証 |
| `S.tick()` が tn を呼び出す | 正しい周波数・持続時間で tn が呼ばれる |
| `S.hit()` で複数音が生成される | tn + noise の複合呼び出し検証 |
| `bgmTick()` がステージ別BGMを生成する | cave/grass/boss 各ステートで異なるトーンが生成される |

**予定テストケース数**: 8

### 3.3 rendering.test.ts

**対象**: `src/features/keys-and-arms/__tests__/rendering.test.ts` (新規)

テスト対象は `core/rendering.ts` の `createRendering($)` が返す描画ヘルパー。

| テストケース | 内容 |
|------------|------|
| `onFill(alpha)` が fillStyle と globalAlpha を設定する | ON 色 + alpha 値の設定 |
| `R(x, y, w, h, fill)` が矩形を描画する | fillRect / strokeRect の呼び出し検証 |
| `txt(str, x, y, size)` がテキストを描画する | font 設定 + fillText の呼び出し |
| `txtC(str, x, y, size)` が中央揃えテキストを描画する | textAlign='center' の設定確認 |
| `circle(x, y, r)` が円を描画する | arc の呼び出し検証 |
| `px()` がスプライトを描画する | ピクセル配列からの描画検証 |

**予定テストケース数**: 7

### 3.4 pause.test.ts

**対象**: `src/features/keys-and-arms/__tests__/pause.test.ts` (新規)

| テストケース | 内容 |
|------------|------|
| P キーでポーズ状態がトグルする | `G.paused` が false → true → false |
| ポーズ中はゲームティックがスキップされる | `G.tick` が増加しない |
| ポーズ中に ESC でリセット確認に遷移 | `G.paused` → false, `G.resetConfirm` → 90 |
| タイトル画面では P キーが無効 | `G.state='title'` で paused が変化しない |
| ゲームオーバー画面では P キーが無効 | `G.state='over'` で paused が変化しない |

**予定テストケース数**: 5

### 3.5 help.test.ts

**対象**: `src/features/keys-and-arms/__tests__/help.test.ts` (新規)

| テストケース | 内容 |
|------------|------|
| タイトル画面で ↑ キーでヘルプに遷移 | `G.state` が `'help'` に変化 |
| ← → でページ切替 | `G.helpPage` が 0→1→2 と変化 |
| ページ範囲外には移動しない | 0 未満、3 以上にならない |
| Z/ESC でタイトルに戻る | `G.state` が `'title'` に戻る |

**予定テストケース数**: 5

### 3.6 テストケース合計

| カテゴリ | 計画 | 実績 | 差分 |
|---------|------|------|------|
| difficulty.test.ts（既存） | 23 | 23 | — |
| math.test.ts（新規） | 12 | 15 | +3（shuffle 追加ケース） |
| particles.test.ts（新規） | 10 | 13 | +3（Popups 追加ケース） |
| audio.test.ts（新規） | 8 | 8 | — |
| rendering.test.ts（新規） | 7 | 8 | +1（px フリップテスト） |
| pause.test.ts（新規） | 5 | 5 | — |
| help.test.ts（新規） | 5 | 5 | — |
| **合計** | **70** | **80** | **+10** |

> **実績注記**: 実装時にエッジケースやフリップ描画など追加のテストケースを含めた結果、計画の 70 ケースを超えて **80 ケース**を達成した。

---

## 実装結果

### 実装完了日

2026-02-26

### 計画との差分

| 項目 | 計画 | 実績 | 備考 |
|------|------|------|------|
| テストケース数 | 70 | 80 | エッジケース追加により +10 |
| テストスイート数 | 7 | 7 | 計画通り |
| 変更ファイル数 | 9 | 11 | `ending.ts`, `true-end.ts` を追加 |
| 新規ファイル数 | 7 | 7 | 計画通り |

### 計画外の追加変更

| ファイル | 変更内容 | 理由 |
|---------|---------|------|
| `screens/ending.ts` L101 | `transTo('LOOP 2', G.cavInit, 'HARDER!')` にサブテキスト追加 | トランジション演出の一貫性確保 |
| `screens/true-end.ts` L172 | `transTo('LOOP 4 — BEYOND', G.cavInit, 'HARDER!')` にサブテキスト追加 | トランジション演出の一貫性確保 |
| `screens/title.ts` L84 | `G.cavInit()` 直接呼び出し → `transTo('CAVE', G.cavInit, 'FIND 3 KEYS')` | ゲーム開始時にもトランジション演出を適用 |

### 検証結果

| 検証項目 | 結果 |
|---------|------|
| `npm test` | 全 80 ケース通過（7 スイート） |
| `npm run build` | ビルド成功（警告のみ：tone.js 型定義、アセットサイズ） |
| ブラウザ検証 | 17 項目未実施（手動確認待ち） |
