# IPNE 5ステージ制 + ストーリー進行 — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- 各タスクは **実施タスク**（I: Implementation）と **検証タスク**（V: Verification）に分類
- 依存関係はフェーズ間で明記

---

## Phase 1: 型定義・設定データ層

> 前提: なし（他フェーズの土台） | 優先度: 最高

### 実施タスク

- [x] **I-01.1** `types.ts` に `StageNumber` 型（`1 | 2 | 3 | 4 | 5`）を追加
- [x] **I-01.2** `types.ts` に `StageConfig` インターフェースを追加（maze, enemies, scaling, gimmicks, maxLevel, bossType）
- [x] **I-01.3** `types.ts` の `ScreenState` に `STAGE_CLEAR`, `STAGE_STORY`, `STAGE_REWARD`, `FINAL_CLEAR` を追加し、既存の `CLEAR` を `FINAL_CLEAR` に変更
- [x] **I-01.4** `types.ts` に `EnemyType.MINI_BOSS` と `EnemyType.MEGA_BOSS` を追加
- [x] **I-01.5** `stageConfig.ts` を新規作成 — 5ステージ分の `StageConfig` データを定義（迷路サイズ、敵数、スケーリング倍率、ギミック数）
- [x] **I-01.6** `story.ts` を新規作成 — プロローグ + 5ステージ分のストーリーテキスト + エンディングバリエーション（`StoryScene` 型含む）
- [x] **I-01.7** `progression.ts` の `MAX_LEVEL` を 10 → 15 に変更
- [x] **I-01.8** `progression.ts` の `KILL_COUNT_TABLE` にレベル 11〜15 のエントリを追加（30, 36, 43, 51, 60）
- [x] **I-01.9** `ending.ts` の `RATING_THRESHOLDS` を5ステージ合計基準に変更（S:600000, A:900000, B:1500000, C:2400000）
- [x] **I-01.10** `ending.ts` の `EPILOGUE_TEXTS` を5ステージ用テキストに更新
- [x] **I-01.11** `index.ts` に新規モジュール（stageConfig, story）のエクスポートを追加

### 検証タスク

- [x] **V-01.1** TypeScript コンパイルが通ること（`npx tsc --noEmit`）
- [ ] **V-01.2** 既存の progression テストが `MAX_LEVEL=15` で正しく動作すること（テスト修正が必要）
- [ ] **V-01.3** 既存の ending テストが新閾値で正しく動作すること（テスト修正が必要）
- [x] **V-01.4** `ScreenState.CLEAR` の全参照箇所が `ScreenState.FINAL_CLEAR` に更新されていること

---

## Phase 2: ドメインロジック層

> 前提: Phase 1 完了必須 | 優先度: 高

### 実施タスク

- [x] **I-02.1** `enemy.ts` に `MINI_BOSS` のパラメータを `ENEMY_CONFIGS` に追加（HP:15, ダメージ:3, 速度:2, 感知:7, 追跡:12, 攻撃:2）
- [x] **I-02.2** `enemy.ts` に `MEGA_BOSS` のパラメータを `ENEMY_CONFIGS` に追加（HP:80, ダメージ:6, 速度:1.8, 感知:12, 追跡:20, 攻撃:4）
- [x] **I-02.3** `enemy.ts` に `createMiniBoss()` と `createMegaBoss()` ファクトリ関数を追加
- [x] **I-02.4** `enemy.ts` の `processEnemyDeath()` にミニボスの確定ドロップ（大回復）を追加
- [x] **I-02.5** `enemySpawner.ts` を改修 — `StageConfig` に基づく敵数制御、ミニボス配置ロジック追加
- [x] **I-02.6** `enemySpawner.ts` にスケーリング倍率の適用ロジックを追加（HP/ダメージ/速度の乗算）
- [x] **I-02.7** `map.ts` の `createMapWithRooms()` が `MazeConfig` を外部から受け取れるよう確認（既に対応済みの可能性）
- [x] **I-02.8** `gimmickPlacement.ts` が `GimmickPlacementConfig` を外部から受け取れるよう確認（既に対応済みの可能性）
- [x] **I-02.9** ステージ報酬適用関数を実装（`applyStageReward(player, rewardType)` — `stageConfig.ts` または `progression.ts` に追加）
- [x] **I-02.10** `enemy.ts` の `processEnemyDeath()` にメガボスの鍵ドロップを追加（Stage 5 ではメガボスがボスの代わりに鍵をドロップ）
- [x] **I-02.11** `combat.ts` にミニボスの接触ダメージ処理を追加（必要に応じて）

### 検証タスク

- [ ] **V-02.1** ミニボス・メガボスの生成テストが通ること
- [ ] **V-02.2** 敵スケーリング倍率が正しく適用されること（Stage 3 のパトロール HP が 7 になること等）
- [ ] **V-02.3** ミニボス死亡時に大回復アイテムが確定ドロップすること
- [ ] **V-02.4** 各ステージのスポーン数が spec.md の表と一致すること
- [ ] **V-02.5** ステージ報酬の適用が正しく動作すること（maxHp+5 等）

---

## Phase 3: エンジン層

> 前提: Phase 2 完了必須 | 優先度: 高

### 実施タスク

- [x] **I-03.1** `tickGameState.ts` にステージクリア判定を追加（ゴール到達 + 鍵所持 → ステージ番号に応じた画面遷移エフェクトを発行）
- [x] **I-03.2** `domain/policies/enemyAi/policies.ts` にメガボスAIポリシーを追加（広範囲感知・長距離追跡）
- [x] **I-03.3** `domain/policies/enemyAi/policies.ts` にミニボスAIポリシーを追加（通常ボスベースの追跡型）
- [x] **I-03.4** `enemyAI.ts` に `updateMiniBossEnemy()` と `updateMegaBossEnemy()` を追加

### 検証タスク

- [ ] **V-03.1** ステージクリア時に正しいエフェクトが発行されること（Stage 1〜4 → STAGE_CLEAR、Stage 5 → STAGE_CLEAR）
- [ ] **V-03.2** メガボスAIが広範囲で追跡し、通常ボスより強い挙動をすること
- [ ] **V-03.3** 既存の `tickGameState` テストが引き続きパスすること

---

## Phase 4: プレゼンテーション層

> 前提: Phase 3 完了必須 | 優先度: 高

### 実施タスク

- [x] **I-04.1** `useGameState.ts` に `currentStage` 状態（`StageNumber`）を追加
- [x] **I-04.2** `useGameState.ts` に `stageRewards` 状態を追加（ステージ報酬履歴）
- [x] **I-04.3** `useGameState.ts` の `setupGameState()` を改修 — `StageConfig` を受け取り、ステージに応じた迷路・敵・ギミックを生成
- [x] **I-04.4** `useGameState.ts` に次ステージ遷移ハンドラーを追加 — `handleStageAdvance()`: 引き継ぎデータを保持して次ステージのGAME画面へ
- [x] **I-04.5** `useGameState.ts` に報酬選択ハンドラーを追加 — `handleRewardSelect(rewardType)`
- [x] **I-04.6** `useGameState.ts` の `handleGameOverRetry()` / `handleRetry()` を改修 — ステージ1から完全リスタート
- [x] **I-04.7** `useGameState.ts` の BGM 切り替え effect に `STAGE_CLEAR`, `STAGE_STORY`, `STAGE_REWARD`, `FINAL_CLEAR` を追加
- [x] **I-04.8** `StageClear.tsx` を新規作成 — ステージクリア演出画面（「Stage X クリア！」表示、ステータスサマリー）
- [x] **I-04.9** `StageStory.tsx` を新規作成 — ストーリー表示画面（テキストフェードイン、背景画像対応）
- [x] **I-04.10** `StageReward.tsx` を新規作成 — 報酬選択画面（6選択肢、上限到達時グレーアウト）
- [x] **I-04.11** `FinalClear.tsx` を新規作成 — 最終クリア画面（既存 `Clear.tsx` をベースに5ステージ用に拡張）
- [x] **I-04.12** `Game.tsx` にステージ番号表示UIを追加（画面上部に「Stage X」表示）
- [x] **I-04.13** `Prologue.tsx` をストーリーデータ（story.ts）参照に変更
- [x] **I-04.14** `enemySprites.ts` にメガボスのスプライト描画を追加（1.5倍サイズ、深紫色）
- [x] **I-04.15** `enemySprites.ts` にミニボスのスプライト描画を追加（1.2倍サイズ、暗赤紫色）
- [x] **I-04.16** `IpnePage.tsx` に `STAGE_CLEAR`, `STAGE_STORY`, `STAGE_REWARD`, `FINAL_CLEAR` 画面の条件分岐を追加
- [x] **I-04.17** 既存の `Clear.tsx` を段階的に `FinalClear.tsx` に移行（または Clear.tsx を FINAL_CLEAR 用に更新）
- [x] **I-04.18** `useGameLoop.ts` にステージクリア検知ロジックを追加 — `tickGameState` からのステージクリアエフェクトを受けて画面遷移をトリガー

### 検証タスク

- [ ] **V-04.1** Stage 1 クリア → STAGE_CLEAR → STAGE_STORY → STAGE_REWARD → GAME(Stage 2) の画面遷移がブラウザで正しく動作すること
- [ ] **V-04.2** Stage 5 クリア → STAGE_CLEAR → STAGE_STORY → FINAL_CLEAR の画面遷移が正しく動作すること
- [ ] **V-04.3** ゲームオーバー → GAME_OVER → TITLE → ステージ1から完全リスタートが動作すること
- [ ] **V-04.4** ステージ間のデータ引き継ぎ（レベル、能力値、HP）が正しく保持されること
- [ ] **V-04.5** ステージ報酬選択が正しくプレイヤーに反映されること
- [ ] **V-04.6** メガボス・ミニボスのスプライトが正しく描画されること
- [ ] **V-04.7** ストーリー画面のテキストフェードインが正常に動作すること
- [ ] **V-04.8** Game.tsx のステージ番号表示が正しいステージを表示すること

---

## Phase 5: 統合・テスト

> 前提: Phase 4 完了必須 | 優先度: 中

### 実施タスク

- [x] **I-05.1** 既存テスト修正 — `progression.test.ts`: MAX_LEVEL=15 対応、新キルカウントテーブルのテスト追加
- [x] **I-05.2** 既存テスト修正 — `ending.test.ts`: 新評価閾値（S:10分, A:15分 等）に合わせたテストケース更新
- [ ] **I-05.3** 既存テスト修正 — `enemy.test.ts`: MINI_BOSS, MEGA_BOSS の生成・ダメージ・ドロップテスト追加
- [ ] **I-05.4** 既存テスト修正 — `enemyAI.test.ts`: ミニボス・メガボスのAI挙動テスト追加
- [x] **I-05.5** 既存テスト修正 — ScreenState.CLEAR → ScreenState.FINAL_CLEAR への全参照更新
- [x] **I-05.6** 新規テスト — `stageConfig.test.ts`: 各ステージの設定値が仕様と一致することを検証
- [x] **I-05.7** 新規テスト — `story.test.ts`: 全ストーリーシーンのデータ整合性を検証
- [ ] **I-05.8** 5ステージ通しプレイのバランス調整（HP/ダメージ/速度倍率の微調整）

### 検証タスク

- [x] **V-05.1** `npm run test` で全テストがパスすること
- [ ] **V-05.2** `npm run lint` でエラーがないこと（既存のwarnは許容）
- [ ] **V-05.3** `npm run build` が成功すること（※ IPNE 以外の既存 ESLint ルール定義エラーのみ）
- [ ] **V-05.4** 5ステージ通しプレイが15〜40分で完了可能なバランスであること
- [ ] **V-05.5** Stage 5 のメガボスが正しくスポーン・動作すること
- [x] **V-05.6** 既存の maze, movement, viewport 等のテストが引き続きパスすること

---

## Phase 6: ドキュメント・仕上げ

> 前提: Phase 5 完了必須 | 優先度: 低

### 実施タスク

- [x] **I-06.1** `.docs/ipne/specs/00-overview.md` を更新 — プレイ時間「15〜40分」、5ステージ構成の説明追加
- [x] **I-06.2** `.docs/ipne/specs/03-entities.md` を更新 — ミニボス・メガボスのパラメータ表追加
- [x] **I-06.3** `.docs/ipne/specs/04-progression.md` を更新 — MAX_LEVEL=15、新キルカウントテーブル、ステージ報酬の説明追加
- [x] **I-06.4** `.docs/ipne/specs/05-technical.md` を更新 — ScreenState 拡張、新ファイル構成、ステージ間データ引き継ぎ仕様
- [x] **I-06.5** 画像挿入箇所のドキュメントを作成（ファイル形式、サイズ、配置場所、命名規則）
- [x] **I-06.6** README.md のゲーム説明を5ステージ構成に更新

### 検証タスク

- [x] **V-06.1** 仕様書の内容が実装と一致していること
- [x] **V-06.2** README.md の記述が正確であること

---

## 全体検証

> 前提: 全フェーズ完了後

- [ ] **V-99.1** 各ステージの画面遷移が正しく動作することをブラウザで確認
- [ ] **V-99.2** ステージ間のデータ引き継ぎ（レベル、能力値）をデバッグモードで確認
- [ ] **V-99.3** ゲームオーバー時にステージ1から完全リスタートされることを確認
- [ ] **V-99.4** 5ステージクリア後のエンディング表示と評価計算を確認
- [ ] **V-99.5** ステージ5のメガボスが正しくスポーン・動作することを確認
- [ ] **V-99.6** 既存のテスト（maze, movement, viewport 等）が引き続きパスすることを確認
- [ ] **V-99.7** `npm run test` で全テストがパスすること
- [ ] **V-99.8** `npm run build` が成功すること
- [ ] **V-99.9** `npm run lint` でエラーがないこと

---

## タスク統計

| フェーズ | 実施タスク | 検証タスク | 合計 |
|---------|-----------|-----------|------|
| Phase 1 | 11 | 4 | 15 |
| Phase 2 | 11 | 5 | 16 |
| Phase 3 | 4 | 3 | 7 |
| Phase 4 | 18 | 8 | 26 |
| Phase 5 | 8 | 6 | 14 |
| Phase 6 | 6 | 2 | 8 |
| 全体検証 | 0 | 9 | 9 |
| **合計** | **58** | **37** | **95** |
