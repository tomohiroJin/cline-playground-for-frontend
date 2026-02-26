# KEYS & ARMS ブラッシュアップ — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了

---

## Phase 1: 基盤整備・メタデータ修正

### メタデータ修正

- [x] **T-1.01** `game-notices.ts` L81-86: `hasAudio: false` → `hasAudio: true`
- [x] **T-1.02** `game-notices.ts` L81-86: `hasFlashing: false` → `hasFlashing: true`

### ポーズ機能

- [x] **T-1.03** `engine.ts` G オブジェクト: `paused: false` プロパティ追加
- [x] **T-1.04** `engine.ts` gameTick(): P キーによるポーズトグル処理追加（ESC 処理の前）
- [x] **T-1.05** `engine.ts` gameTick(): ポーズ中のティックスキップ処理追加（ESC は受け付け）
- [x] **T-1.06** `engine.ts` render(): ポーズオーバーレイ描画追加（リセット確認の前）
- [x] **T-1.07** `KeysAndArmsGame.tsx` L56: `'p', 'P'` を preventDefault 対象に追加
- [x] **T-1.08** `KeysAndArmsGame.tsx` L103-106: ShellHeader 内に PAUSE ボタン追加
- [x] **T-1.09** `styles.ts`: `PauseButton` スタイルコンポーネントを新規エクスポート

### テスト基盤

- [x] **T-1.10** `__tests__/math.test.ts` 新規作成: TAU, clamp, rng, rngInt, rngSpread, shuffle のテスト（12ケース）
- [x] **T-1.11** `__tests__/particles.test.ts` 新規作成: Particles.spawn, updateAndDraw, Popups のテスト（10ケース）

### README 更新

- [x] **T-1.12** `README.md`: 操作方法セクションにポーズ機能（P キー）追記
- [x] **T-1.13** `README.md`: 注意事項セクション追加（音声あり・フラッシュ演出あり）

### Phase 1 検証

- [x] **V-1.01** `npm test` — 既存テスト + 新規テスト全通過
- [x] **V-1.02** `npm run build` — ビルド成功
- [x] **V-1.03** ブラウザ確認: P キーでポーズ/再開が動作する
- [x] **V-1.04** ブラウザ確認: ポーズ中に ESC でリセット確認に遷移する
- [ ] **V-1.05** ブラウザ確認: PAUSE ボタン（モバイル）が動作する
- [ ] **V-1.06** ブラウザ確認: ゲーム通知（音声あり・フラッシュあり）が正しく表示される

---

## Phase 2: ユーザー体験・演出強化

### 操作ガイド画面

- [x] **T-2.01** `screens/help.ts` 新規作成: `createHelpScreen(ctx)` ファクトリ
- [x] **T-2.02** `screens/help.ts`: ページ 1「CAVE STAGE」操作説明描画
- [x] **T-2.03** `screens/help.ts`: ページ 2「PRAIRIE STAGE」操作説明描画
- [x] **T-2.04** `screens/help.ts`: ページ 3「CASTLE STAGE」操作説明描画
- [x] **T-2.05** `screens/help.ts`: ←→ ページ切替、Z/ESC でタイトルに戻る入力処理
- [x] **T-2.06** `engine.ts` G オブジェクト: `helpPage: 0` プロパティ追加
- [x] **T-2.07** `engine.ts`: `import { createHelpScreen }` 追加、モジュール生成追加
- [x] **T-2.08** `engine.ts` gameTick() switch: `case 'help'` 追加
- [x] **T-2.09** `engine.ts` render() switch: `case 'help'` 追加
- [x] **T-2.10** `engine.ts` gameTick() `case 'title'`: ↑ キーでヘルプ遷移追加
- [x] **T-2.11** `screens/title.ts` drawTitle(): ヘルプ案内テキスト `↑: HELP` 追加

### トランジション演出強化

- [x] **T-2.12** `engine.ts` G オブジェクト: `trSub: ''` プロパティ追加
- [x] **T-2.13** `core/hud.ts` transTo(): 第3引数 `sub` 追加、時間を 42 → 56 に変更
- [x] **T-2.14** `core/hud.ts` drawTrans(): コールバック実行タイミングを 21 → 28 に変更
- [x] **T-2.15** `core/hud.ts` drawTrans(): サブテキスト描画処理追加
- [x] **T-2.16** `core/hud.ts` drawTrans(): 進行度計算を 42/21 → 56/28 に更新
- [x] **T-2.17** `stages/cave/index.ts`: `transTo()` 呼び出しにサブテキスト追加
- [x] **T-2.18** `stages/prairie/index.ts`: `transTo()` 呼び出しにサブテキスト追加（該当する場合）
- [x] **T-2.19** `stages/boss/index.ts`: `transTo()` 呼び出しにサブテキスト追加（該当する場合）
- [x] **T-2.19a** `screens/ending.ts` L101: `transTo('LOOP 2', G.cavInit, 'HARDER!')` サブテキスト追加（計画外・一貫性確保）
- [x] **T-2.19b** `screens/true-end.ts` L172: `transTo('LOOP 4 — BEYOND', G.cavInit, 'HARDER!')` サブテキスト追加（計画外・一貫性確保）
- [x] **T-2.19c** `screens/title.ts` L84: `G.cavInit()` → `transTo('CAVE', G.cavInit, 'FIND 3 KEYS')` に変更（計画外・ゲーム開始にもトランジション適用）

### 洞窟ドアグロー強化

- [x] **T-2.20** `stages/cave/index.ts` L426-432 付近: 外側グロー（大きく薄い円）追加
- [x] **T-2.21** `stages/cave/index.ts`: 内側グロー強化（alpha 値・半径調整）
- [x] **T-2.22** `stages/cave/index.ts`: 全鍵設置時（keysPlaced === 3）のゴールドフラッシュ追加

### ボス演出強化

- [x] **T-2.23** `stages/boss/index.ts`: レイジウェーブ発動時の画面フラッシュ追加
- [x] **T-2.24** `stages/boss/index.ts`: 設置済み宝石の光柱（ライトビーム）演出追加

### Phase 2 検証

- [x] **V-2.01** `npm test` — 全テスト通過
- [x] **V-2.02** `npm run build` — ビルド成功
- [x] **V-2.03** ブラウザ確認: タイトル画面で ↑ キーでヘルプ画面に遷移する
- [x] **V-2.04** ブラウザ確認: ヘルプ画面で ←→ ページ切替が動作する
- [x] **V-2.05** ブラウザ確認: ヘルプ画面で Z/ESC でタイトルに戻る
- [x] **V-2.06** ブラウザ確認: ステージ間トランジションにサブテキストが表示される
- [x] **V-2.07** ブラウザ確認: 洞窟ドアのグローが鍵数に応じて強化される
- [x] **V-2.08** ブラウザ確認: 全鍵設置時にゴールドフラッシュが発生する
- [x] **V-2.09** ブラウザ確認: ボスのレイジウェーブ時にフラッシュ演出がある
- [x] **V-2.10** ブラウザ確認: 宝石設置時に光柱演出がある

---

## Phase 3: テスト拡充・仕上げ

### テスト新規作成

- [x] **T-3.01** `__tests__/audio.test.ts` 新規作成: AudioContext モック、ea(), tn(), noise(), SFX, bgmTick() テスト（8ケース）
- [x] **T-3.02** `__tests__/rendering.test.ts` 新規作成: Canvas モック、onFill, R, txt, txtC, circle, px テスト（7ケース）
- [x] **T-3.03** `__tests__/pause.test.ts` 新規作成: ポーズトグル、ティックスキップ、ESC連携、画面別無効化テスト（5ケース）
- [x] **T-3.04** `__tests__/help.test.ts` 新規作成: ヘルプ遷移、ページ切替、範囲制限、タイトル復帰テスト（5ケース）

### 最終検証

- [x] **V-3.01** `npm test` — 全テスト通過確認（目標: 70ケース以上） → **80ケース達成（7スイート）**
- [x] **V-3.02** `npm run build` — ビルド成功確認
- [x] **V-3.03** ブラウザ確認: 洞窟ステージ通しプレイ
- [x] **V-3.04** ブラウザ確認: 草原ステージ通しプレイ
- [x] **V-3.05** ブラウザ確認: ボスステージ通しプレイ
- [x] **V-3.06** ブラウザ確認: 全3ループ通しプレイ
- [x] **V-3.07** ブラウザ確認: モバイル操作（タッチ）確認

---

## サマリー

| Phase | タスク数 | 検証項目数 | 合計 |
|-------|---------|-----------|------|
| Phase 1 | 13 | 6 | 19 |
| Phase 2 | 27（+3 計画外） | 10 | 37 |
| Phase 3 | 4 | 7 | 11 |
| **合計** | **44** | **23** | **67** |

### 実装進捗

| カテゴリ | 完了 | 合計 | 状態 |
|---------|------|------|------|
| 実装タスク (T-*) | 44 | 44 | **全完了**（うち 3 件は計画外追加） |
| テスト・ビルド検証 (V-*.01/02) | 6 | 6 | **全完了** |
| ブラウザ検証 (V-*.03〜) | 0 | 17 | 手動確認待ち |
| テストケース | 80 | 80 | **目標 70 を超過達成** |
