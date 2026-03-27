# Step 4: ペアマッチ（2v2）— 実装計画

## 概要

2人1チームで協力して対戦するペアマッチモードを追加する。
Step 1 で確保した広いフィールド（600×1200）を活用し、4つのマレットが同時にプレイする。

## 目標

1. **2v2 対戦モードの追加**: チーム1（下半分）vs チーム2（上半分）
2. **4マレット同時操作**: 人間 + CPU の混合チーム
3. **チーム制スコア**: チーム単位で得点・勝敗判定
4. **既存モードの非破壊**: フリー対戦・ストーリー・2P・デイリー・図鑑に影響なし

## 設計

### チーム構成

| チーム | プレイヤー | 配置 | 入力 |
|--------|-----------|------|------|
| チーム1（下） | P1 | 左下 | マウス/タッチ/矢印キー |
| チーム1（下） | P2（味方） | 右下 | WASD / タッチ / CPU AI |
| チーム2（上） | P3（敵1） | 左上 | CPU AI / タッチ |
| チーム2（上） | P4（敵2） | 右上 | CPU AI / タッチ |

初期リリースでは **P1（人間）+ P2（CPU）vs P3（CPU）+ P4（CPU）** をデフォルトとする。
タッチデバイスでは最大4人の人間操作にも対応する。

### フィールドレイアウト（4分割ゾーン）

```
┌────────────── 600px ──────────────┐
│ P3 zone        │  P4 zone         │  Y: 52〜548
│ (左上)         │  (右上)          │
│ x: 60〜300     │  x: 300〜540     │
├────────────────┼──────────────────┤  ← 中央ライン Y=600
│ P1 zone        │  P2 zone         │  Y: 652〜1148
│ (左下)         │  (右下)          │
│ x: 60〜300     │  x: 300〜540     │
└────────────────┴──────────────────┘
```

各マレットは自分のゾーン内でのみ移動可能。
ゾーン境界はマレット半径（42px）+ マージンで設定。

### データ構造の拡張方針

`GameState` に `ally`（P2 味方）と `enemy`（P4 敵2）を**オプショナル**に追加。
既存の `player`（P1）と `cpu`（P3/敵1）はそのまま維持し、後方互換を保つ。

```typescript
type GameState = {
  player: Mallet;      // P1（既存）
  cpu: Mallet;         // P3/CPU（既存）
  ally?: Mallet;       // P2 味方（2v2 時のみ）
  enemy?: Mallet;      // P4 敵2（2v2 時のみ）
  // ... 既存フィールド
};
```

### スコアリング

チーム制: `{ team1: number; team2: number }`
- パックが上ゴールに入る → team1 得点
- パックが下ゴールに入る → team2 得点
- 2v2 以外のモードでは既存の `{ p, c }` をそのまま使用

---

## フェーズ計画

### 全体構成

```
Phase S4-1（型定義・データ構造）
  ├── S4-1-1: GameMode に '2v2-local' 追加
  ├── S4-1-2: GameState に ally/enemy マレット追加
  ├── S4-1-3: 4分割ゾーン境界の定義
  └── S4-1-4: EntityFactory の4マレット初期化
        ↓
Phase S4-2（入力層の拡張）
  ├── S4-2-1: マルチタッチを4タッチ対応に
  ├── S4-2-2: キーボード入力の2v2対応
  └── S4-2-3: useGameLoop での4マレット入力処理
        ↓
Phase S4-3（ゲームロジック）
  ├── S4-3-1: processCollisions の4マレット対応
  ├── S4-3-2: resolveMalletPuckOverlap の4マレット対応
  ├── S4-3-3: CPU AI の2体同時制御
  ├── S4-3-4: ゴール判定のチーム制対応
  └── S4-3-5: アイテム・エフェクトの4プレイヤー対応
        ↓
Phase S4-4（レンダリング）
  ├── S4-4-1: 4マレット描画
  ├── S4-4-2: チーム制スコアボード
  └── S4-4-3: マレットカラー管理
        ↓
Phase S4-5（UI・画面フロー）
  ├── S4-5-1: タイトル画面に「ペアマッチ」ボタン追加
  ├── S4-5-2: チーム設定画面（キャラ選択 + CPU/人間切替）
  ├── S4-5-3: VS 画面のチーム表示
  └── S4-5-4: リザルト画面のチーム表示
        ↓
Phase S4-6（テスト・品質保証）
  ├── S4-6-1: 型定義・初期化のテスト
  ├── S4-6-2: 衝突・ゴール判定のテスト
  ├── S4-6-3: 既存テスト全パス確認
  └── S4-6-4: ビルド確認
```

---

## 影響範囲

| ファイル | 変更内容 |
|---------|---------|
| `core/types.ts` | GameMode, GameState, MatchStats 拡張 |
| `core/constants.ts` | 4分割ゾーン境界の追加 |
| `core/entities.ts` | createGameState の4マレット初期化 |
| `core/multi-touch.ts` | 4タッチ対応 |
| `core/keyboard.ts` | 2v2 時の WASD 対応 |
| `presentation/hooks/useGameLoop.ts` | 4マレット入力・衝突・AI・描画 |
| `presentation/hooks/useGameMode.ts` | 2v2 モード状態管理 |
| `renderer.ts` | 4マレット描画 |
| `components/CharacterSelectScreen.tsx` | チーム設定画面（or 新規） |
| `components/TitleScreen.tsx` | ペアマッチボタン追加 |
| `presentation/AirHockeyGame.tsx` | 画面フロー統合 |

## リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| GameState 構造変更で既存コードが壊れる | 高 | ally/enemy をオプショナルにして後方互換維持 |
| 4マレットで画面が混雑 | 中 | マレットカラーでチーム区別、600x1200 の広さを活用 |
| タッチ4人操作は物理的に困難 | 中 | デフォルトは P1 人間 + 残り CPU、タッチは大画面のみ |
| AI 2体同時制御のバランス | 中 | 既存 CpuAI.updateWithBehavior を個別呼び出し |
| processCollisions の4マレット対応でバグ混入 | 中 | マレット配列化で統一処理、TDD で保護 |

## 完了後の状態

- ペアマッチ（2v2）でゲームが成立する
- P1（人間）+ P2（CPU）vs P3（CPU）+ P4（CPU）がデフォルト
- チーム制スコアで勝敗判定
- タッチ操作で最大4人同時操作可能
- 既存モード（フリー対戦、ストーリー、2P、デイリー、図鑑）に影響なし

---

## Phase S4-7: フィードバック対応（バグ修正・UI 改善）

### 背景

Phase S4-1〜S4-6 の実装後に以下の問題が報告された:

1. **ペアマッチで味方（P2）が操作できない** — 4マレット表示されるが P2 は CPU AI のみで制御され、人間が操作できない
2. **ペアマッチ設定画面がタイトル画面と重複** — Field / Win Score の選択が両画面に存在する
3. **背景のちらつきエフェクトが見づらい** — `renderer.ts` の `clear()` で背景色が毎フレーム振動し、プラットフォームによっては視認性が低下する
4. **フリー対戦・2P 対戦のキャラ選択 UI が狭く使いにくい** — 他の画面と異なるスタイルで表示が窮屈

### 問題分析

#### 問題1: ally（P2）が操作不能

**原因**: `useGameLoop.ts` の入力処理で `is2PMode` チェック（L472-490）が 2v2 モードを除外している。
- マルチタッチ: `if (is2PMode && multiTouchRef?.current)` → 2v2 では `false`
- キーボード: `if (is2PMode && player2KeysRef)` → 2v2 では `false`
- 結果として ally は CPU AI（L506-539）のみで制御される

2v2 モードではタッチの `player2Position` → `game.ally` に、WASD → `game.ally` に接続する必要がある。
既存の2P入力コードは `game.cpu` を動かしているが、2v2 では `game.ally` を動かすべき。

**修正方針**: ゲームループの入力セクションに `is2v2Mode` 分岐を追加し、
player2 入力 → `game.ally` に接続する。
WASD 入力は `getPlayerZone('player2')` で右下ゾーンに X/Y 両方をクランプ
（`getPlayerYBounds('player2')` は上半分を返すため使用不可）。
2v2 では `playerTargetRef` を無効化し、マルチタッチの `player1Position` で P1 を操作する。
ally の CPU AI は2v2モードでは常にスキップする。

#### 問題2: TeamSetupScreen がタイトルと重複

**原因**: `TeamSetupScreen` が Field / Win Score の選択を独自に持っている。
タイトル画面でも同じ選択があるため、2箇所で設定する意味がない。

**修正方針**: `TeamSetupScreen` から Field / Win Score を削除し、タイトル画面の設定値をそのまま使う。
`TeamSetupConfig` 型を完全に削除し、`onStart` を `() => void` に変更。
`handlePairMatchStart` は `mode.field` / `mode.winScore` を直接使用する。
設定画面はチーム構成の確認と「対戦開始」ボタンのみにする。

#### 問題3: 背景のちらつき

**原因**: `renderer.ts` の `clear()` 関数で `Math.sin(now * 0.0005) * 10` により
背景色の RGB が毎フレーム ±10 の範囲で振動する。
低リフレッシュレートのディスプレイやコントラストの高い環境ではちらつきとして知覚される。

**修正方針**: `clear()` の背景アニメーションを静的な固定色に変更する。

#### 問題4: キャラ選択 UI が狭い

**原因**: `FreeBattleCharacterSelect` と `CharacterSelectScreen` は独自のインラインスタイルで
`CARD_SIZE=80, GRID_GAP=8` の固定サイズを使用。画面幅に対してカードが小さく、
タップ領域が狭い。他の画面（TitleScreen 等）は `styled-components` の共通スタイルを使用。

**修正方針**: カードサイズを CSS の `min()` / `vw` ベースのレスポンシブ設計に変更し、
タッチ対象を大きくする。JS での `window.innerWidth` 計算は不要。
共通の `styles.ts` コンポーネントとの統一を検討。

---

### Phase S4-7 フェーズ構成

```
Phase S4-7-1（ally 入力接続 — 最優先・ゲーム成立に必須）
  ├── S4-7-1a: 2v2 時 playerTargetRef を無効化（タッチ二重処理防止）
  ├── S4-7-1b: useGameLoop に is2v2Mode の入力分岐を追加
  │             player1 タッチ → game.player, player2 タッチ/WASD → game.ally
  ├── S4-7-1c: ally のゾーンクランプに getPlayerZone('player2') を使用（X/Y 両方）
  └── S4-7-1d: ally の CPU AI を 2v2 モードでは常にスキップ
        ↓
Phase S4-7-2（TeamSetupScreen 簡素化 — S4-7-1 と並行可能）
  ├── S4-7-2a: TeamSetupConfig 型を削除、onStart を () => void に
  ├── S4-7-2b: Field / Win Score の選択を削除、タイトル設定値を直接使用
  ├── S4-7-2c: チーム構成表示のみのシンプル画面に
  └── S4-7-2d: TeamSetupScreen のテスト追加
        ↓
Phase S4-7-3（背景ちらつき修正 — 独立・並行可能）
  └── S4-7-3a: renderer.ts clear() の背景振動を停止し固定色に
        ↓
Phase S4-7-4（キャラ選択 UI 改善 — 独立・並行可能）
  ├── S4-7-4a: カードサイズのレスポンシブ化
  ├── S4-7-4b: スタイルを styled-components に統一
  └── S4-7-4c: タッチ領域の拡大
```

### 並行作業ガイド

```
S4-7-1（ally 入力接続）     ← 最優先。ゲーム成立の前提
  └──→ テスト確認
                              ↑ 並行可能 ↓
S4-7-2（設定画面簡素化）     ← S4-7-1 と並行可能（ファイル競合なし）
                              ↑ 並行可能 ↓
S4-7-3（背景ちらつき）       ← 完全独立。renderer.ts のみ変更
                              ↑ 並行可能 ↓
S4-7-4（キャラ選択 UI）      ← 完全独立。FreeBattleCharacterSelect + CharacterSelectScreen のみ
```

S4-7-1 は **ゲームが成立するための必須修正** のため最優先。
S4-7-2〜S4-7-4 は互いに独立しており、全て S4-7-1 と並行して作業可能。

### 影響範囲

| ファイル | Phase | 変更内容 |
|---------|-------|---------|
| `presentation/hooks/useGameLoop.ts` | S4-7-1 | 2v2 入力分岐で ally 操作接続 |
| `components/TeamSetupScreen.tsx` | S4-7-2 | TeamSetupConfig 削除、Field/WinScore 削除、簡素化 |
| `presentation/AirHockeyGame.tsx` | S4-7-1, S4-7-2 | playerTargetRef 無効化、handlePairMatchStart 引数削除 |
| `renderer.ts` | S4-7-3 | clear() の背景アニメーション削除 |
| `components/FreeBattleCharacterSelect.tsx` | S4-7-4 | レスポンシブカード・スタイル統一 |
| `components/CharacterSelectScreen.tsx` | S4-7-4 | レスポンシブカード・スタイル統一 |

### リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| ally 入力接続で 2P モードが壊れる | 高 | is2PMode / is2v2Mode の分岐を明確に分離。既存テストで保護 |
| 背景色変更でビジュアルの印象が変わる | 低 | 静的グラデーション維持で雰囲気を保持 |
| キャラ選択 UI 変更で既存テストが壊れる | 中 | getByRole / getByText ベースのテストなので構造変更に強い |

---

## Phase S4-8: 致命的バグ修正（2v2 が全く動作しない）

### 背景

Phase S4-7 の実装後、以下の致命的な問題が報告された:

1. **ペアマッチでマレットが4つ出ない** — ally/enemy が生成されていない
2. **自分のマレットがマウスで動かせない** — 入力が無効化されている
3. **2P 対戦に不要なフィールド・勝利スコア選択が残っている**
4. **ペアマッチ設定画面のレイアウトが他画面と不統一**

### 根本原因分析

**全バグの原因は1つ: React setState の非同期問題**

```typescript
// AirHockeyGame.tsx L261-264
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');  // ← setState は非同期
  startGame(mode.field);          // ← この時点で mode.gameMode はまだ 'free'
}, [mode, startGame]);
```

`startGame` 内で `mode.gameMode === '2v2-local'` を参照するが、
`setGameMode` の React setState は非同期のため、呼び出し直後には反映されない。

**結果として発生する連鎖障害:**

1. `startGame` 内の `is2v2 = mode.gameMode === '2v2-local'` → **false**
2. `EntityFactory.createGameState(CONSTANTS, field, false)` → ally/enemy 未生成
3. `useGameLoop` の `gameMode` も `'free'` のまま → `is2v2Mode = false`
4. `!is2v2Mode && playerTargetRef?.current` → **true** だが、入力処理が1Pモードとして動作
5. 2v2 入力分岐（マルチタッチ→ally、WASD→ally）に到達しない

さらに `handlePairMatchStart` の `startGame(mode.field)` は `startGame` の依存配列に
`mode.gameMode` があるため、次のレンダリングで `startGame` が再生成されるが、
ゲームは既に開始されている。

### 修正方針

**`startGame` に `gameModeOverride` パラメータを追加し、同期的に gameMode を渡す。**

```typescript
const startGame = useCallback((fieldOverride?: FieldConfig, gameModeOverride?: GameMode) => {
  const activeField = fieldOverride ?? mode.field;
  const effectiveGameMode = gameModeOverride ?? mode.gameMode;
  const is2v2 = effectiveGameMode === '2v2-local';
  gameRef.current = EntityFactory.createGameState(CONSTANTS, activeField, is2v2);
  // ...
}, [mode.field, mode.gameMode, navigateWithTransition]);
```

呼び出し側:
```typescript
const handlePairMatchStart = useCallback(() => {
  mode.setGameMode('2v2-local');
  startGame(mode.field, '2v2-local');  // ← 同期的に渡す
}, [mode, startGame]);
```

同じパターンで `handleStartBattle` も修正:
```typescript
const handleStartBattle = useCallback((config) => {
  mode.setGameMode('2p-local');
  startGame(config.field, '2p-local');  // ← 同期的に渡す
}, [mode, startGame]);
```

**`useGameLoop` の `gameMode` も `gameRef` 経由で同期化が必要。**
ゲーム開始時点の `gameMode` を `gameRef` と一緒に保持するか、
`config.gameMode` がタイムリーに反映される仕組みにする。

現状の `useGameLoop` は `config.gameMode` を useEffect の外で参照しているため、
React の再レンダリング後に正しい値が反映される。`startGame` の修正で
`EntityFactory.createGameState` の問題は解決し、`useGameLoop` は次フレームで
正しい `gameMode` を受け取る。

---

### Phase S4-8 フェーズ構成

```
Phase S4-8-1（startGame の同期化 — 最優先・全バグの根本原因）
  ├── S4-8-1a: startGame に gameModeOverride パラメータ追加
  ├── S4-8-1b: handlePairMatchStart で '2v2-local' を同期渡し
  ├── S4-8-1c: handleStartBattle で '2p-local' を同期渡し
  └── S4-8-1d: handleFreeStart / handleSelectStage の既存動作確認
        ↓
Phase S4-8-2（2P 対戦の設定 UI 削除）
  ├── S4-8-2a: CharacterSelectScreen から Field / Win Score 選択を削除
  └── S4-8-2b: handleStartBattle でタイトル設定値を使用
        ↓
Phase S4-8-3（TeamSetupScreen のレイアウト統一）
  └── S4-8-3a: 戻るボタン・タイトルの配置を他画面と統一
```

### 並行作業ガイド

```
S4-8-1（startGame 同期化）  ← 最優先。全バグの根本修正
  └──→ 動作確認              ← ally/enemy 生成・マウス入力・WASD 確認
                               ↑ 並行可能 ↓
S4-8-2（2P 設定 UI 削除）    ← S4-8-1 と並行可能（別ファイル）
                               ↑ 並行可能 ↓
S4-8-3（レイアウト統一）     ← S4-8-1 と並行可能（TeamSetupScreen のみ）
```

### 影響範囲

| ファイル | Phase | 変更内容 |
|---------|-------|---------|
| `presentation/AirHockeyGame.tsx` | S4-8-1 | startGame に gameModeOverride、全 handler 修正 |
| `components/CharacterSelectScreen.tsx` | S4-8-2 | Field / Win Score UI 削除 |
| `components/TeamSetupScreen.tsx` | S4-8-3 | レイアウト統一 |

### リスク管理

| リスク | 影響度 | 対策 |
|--------|--------|------|
| startGame 変更で他モード（フリー・ストーリー）が壊れる | 高 | gameModeOverride はオプショナル。未指定時は既存動作維持 |
| 2P 設定 UI 削除で handleStartBattle の引数が変わる | 中 | TwoPlayerConfig の field/winScore をタイトル値で置換 |
