# Falldown Shooter ブラッシュアップ 実装計画

## 概要

Falldown Shooter（落ち物シューティング）の品質向上・機能追加を5フェーズで実施する。

---

## Phase 1: テスト基盤強化

### 1-1. コンポーネント単体テスト追加
- `__tests__/components/` ディレクトリに8ファイル作成
  - `CellView.test.tsx` — Props 描画、パワーアップアイコン表示
  - `BulletView.test.tsx` — 通常弾/貫通弾/下方弾の描画差異
  - `PlayerShip.test.tsx` — SVG 描画、座標計算
  - `StatusBar.test.tsx` — ステージ/ライン/スコア表示
  - `SkillGauge.test.tsx` — ゲージ表示、100%時のスキルボタン、onUseSkill コールバック
  - `PowerUpIndicator.test.tsx` — バッジ表示/非表示
  - `Effects.test.tsx` — レーザー/爆発/ブラストの可視性制御
  - `Overlays.test.tsx` — 各スクリーン表示、ボタンクリック、デモスライド切替

### 1-2. カスタムフックテスト追加
- `__tests__/hooks.test.ts`
  - `useInterval` — enabled 切替、delay 変更時リセット
  - `useKeyboard` — キー発火、enabled=false 時の無視、repeat キー無視
  - `useIdleTimer` — タイムアウト発火、リセット動作

### 1-3. 統合テスト追加
- `__tests__/integration.test.tsx`
  - ゲーム開始→プレイ→ゲームオーバーのフロー
  - スキルチャージ→発動フロー
  - パワーアップ取得→効果適用→消滅フロー
  - ステージクリア→次ステージフロー

---

## Phase 2: コード品質改善

### 2-1. エラーハンドリング強化
- `audio.ts` — AudioContext suspended 時の resume()、未対応環境の警告
- `score-storage.ts` — QuotaExceededError 対応、古いスコア自動クリーンアップ
- `__tests__/audio.test.ts` 新規作成

### 2-2. メインコンポーネント分割（450行→200行以下）
- カスタムフック6個を `hooks/` ディレクトリに作成
  - `use-game-state.ts` — stateRef、updateState、forceUpdate、初期状態管理
  - `use-game-flow.ts` — startStage、goToTitle、resetGame、nextStage
  - `use-game-controls.ts` — moveLeft、moveRight、fire
  - `use-skill-system.ts` — skillCharge、activateSkill
  - `use-power-up.ts` — powers、handlePowerUp、handlePowerExpire
  - `use-game-loop.ts` — 4つの useInterval 統合
- `FalldownShooterGame.tsx` をフック呼出 + JSX レンダリングのみに

### 2-3. マジックナンバー定数化
- `constants.ts` に CONFIG の effect/timing/fireworks セクション追加
- 各コンポーネントの数値リテラルを定数参照に置換

### 2-4. React.memo 最適化
- 全プレゼンテーショナルコンポーネントに React.memo + displayName 追加

---

## Phase 3: 新機能追加

### 3-1. ポーズ機能
- `types.ts` — GameStatus に `'paused'` 追加
- `hooks.ts` — Escape/P キーでポーズトグル
- `components/PauseOverlay.tsx` — ポーズ画面 UI
- 全 useInterval の enabled 条件に `status !== 'paused'` 追加
- UI にポーズボタン（⏸）追加

### 3-2. 難易度設定（Easy/Normal/Hard）
- `difficulty.ts` — 難易度定義（spawn/fall/score 倍率、パワーアップ出現率）
- `components/DifficultySelector.tsx` — 難易度選択 UI
- `types.ts` — Difficulty 型、GameState に difficulty 追加
- `constants.ts` — 難易度別パラメータ
- スタート画面に難易度セレクター追加

### 3-3. ランキング機能
- `components/RankingOverlay.tsx` — トップ10表示（難易度別）
- `Overlays.tsx` — スタート/ゲームオーバー/エンディング画面にランキングリンク追加
- 既存 `score-storage.ts` の `getScores()` を活用

---

## Phase 4: UX/UI 改善

### 4-1. アクセシビリティ強化
- ARIA Live Region 追加（スコア更新: polite、ステージ変更: assertive）
- スキルゲージに aria-valuenow / aria-valuemax
- 全ボタンに aria-label
- オーバーレイ表示時のフォーカストラップ

### 4-2. レスポンシブ対応
- `hooks/use-responsive-size.ts` — ウィンドウサイズに応じたセルサイズ動的計算
- `FallingShooterPage.styles.ts` — min(100vw - 2rem, 固定幅) に変更
- タッチ操作の改善（コントロールボタンサイズ拡大）

### 4-3. Overlay DRY 改善
- `Overlays.tsx` — GameOverScreen / EndingScreen の共通部分を ScoreOverlay に抽出

---

## Phase 5: 検証・仕上げ

### 5-1. 未使用依存の調査・削除
- `tone`, `jotai` のプロジェクト全体使用状況を検索 → 未使用なら報告

### 5-2. テスト・カバレッジ確認
- `npm test -- --coverage` 実行
- 新規コード 80% 以上、ロジック層 90% 以上、UI 層 70% 以上

### 5-3. README 更新
- 新機能（ポーズ、難易度、ランキング）、ファイル構造、テスト方法を反映

---

## Phase 6: スコア保存修正 & 難易度パラメータ完全実装

### 6-1. スコア保存に difficulty を渡す
- `use-game-loop.ts` — `saveScore` に `difficulty` を追加（保存キーと取得キーの不一致を解消）
- `use-game-loop.ts` — ステージクリア・エンディング到達時にも `saveScore` を追加
- `use-game-flow.ts` — `getHighScore` に `difficulty` を渡し、`UseGameFlowParams` に `difficulty` を追加
- `FalldownShooterGame.tsx` — `useGameFlow` に `difficulty` を渡す

### 6-2. scoreMultiplier の適用
- `use-game-loop.ts` — 弾衝突スコアに `Math.round(result.score * scoreMultiplier)` を適用
- `use-game-loop.ts` — ラインクリアスコアに `Math.round(cleared * CONFIG.score.line * state.stage * scoreMultiplier)` を適用

### 6-3. powerUpChance の適用
- `block.ts` — `Block.create` に第3引数 `powerUpChance` を追加（デフォルト値で後方互換）
- `use-game-loop.ts` — ブロック生成時に `powerUpChance` を渡す

### 6-4. skillChargeMultiplier の適用
- `use-skill-system.ts` — `UseSkillSystemParams` に `skillChargeMultiplier` を追加、チャージ計算に乗算
- `FalldownShooterGame.tsx` — `useSkillSystem` に `DIFFICULTIES[difficulty].skillChargeMultiplier` を渡す

### 6-5. Object.assign ミューテーションによるスコア二重加算バグの修正
- `use-game-loop.ts` — `finalScore` 変数を導入し、`updateState` と `saveScore` で同一の値を使用
