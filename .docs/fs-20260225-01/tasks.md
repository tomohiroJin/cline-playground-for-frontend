# Falldown Shooter ブラッシュアップ タスクチェックリスト

## Phase 1: テスト基盤強化

- [x] 1-1a. CellView.test.tsx 作成
- [x] 1-1b. BulletView.test.tsx 作成
- [x] 1-1c. PlayerShip.test.tsx 作成
- [x] 1-1d. StatusBar.test.tsx 作成
- [x] 1-1e. SkillGauge.test.tsx 作成
- [x] 1-1f. PowerUpIndicator.test.tsx 作成
- [x] 1-1g. Effects.test.tsx 作成
- [x] 1-1h. Overlays.test.tsx 作成
- [x] 1-2. hooks.test.ts 作成（useInterval, useKeyboard, useIdleTimer）
- [x] 1-3. integration.test.tsx 作成（ゲームフロー統合テスト）
- [x] Phase 1 テスト実行・確認（18 suites, 154 tests PASS）

## Phase 2: コード品質改善

- [x] 2-1a. audio.ts エラーハンドリング強化（suspended resume, 未対応警告）
- [x] 2-1b. score-storage.ts QuotaExceededError 対応（自動クリーンアップ、MAX_SCORES=100）
- [x] 2-1c. audio.test.ts 作成
- [x] 2-2a. use-game-state.ts 作成
- [x] 2-2b. use-game-flow.ts 作成
- [x] 2-2c. use-game-controls.ts 作成
- [x] 2-2d. use-skill-system.ts 作成
- [x] 2-2e. use-power-up.ts 作成
- [x] 2-2f. use-game-loop.ts 作成
- [x] 2-2g. FalldownShooterGame.tsx リファクタリング（179行、フック＋GameBoard/GameOverlays抽出）
- [x] 2-3. マジックナンバー定数化（EFFECT定数追加、Effects.tsx/Overlays.tsx置換）
- [x] 2-4. React.memo 最適化（CellComponent, BulletView, PlayerShip, StatusBar, SkillGauge, PowerUpIndicator）
- [x] Phase 2 テスト実行・確認（全パス）

## Phase 3: 新機能追加

- [x] 3-1a. types.ts に GameStatus='paused' と Difficulty 型追加
- [x] 3-1b. hooks.ts に Escape/P キーハンドラー追加
- [x] 3-1c. PauseOverlay.tsx 作成
- [x] 3-1d. ゲームコンポーネントにポーズ機能統合
- [x] 3-2a. difficulty.ts 作成（難易度パラメータ定義）
- [x] 3-2b. DifficultySelector.tsx 作成
- [x] 3-2c. スタート画面に難易度セレクター統合
- [x] 3-3a. RankingOverlay.tsx 作成
- [x] 3-3b. Overlays.tsx にランキングリンク追加（ScoreOverlay共通化含む）
- [x] Phase 3 テスト実行・確認（全パス）

## Phase 4: UX/UI 改善

- [x] 4-1a. ARIA Live Region 追加（スコア: polite、ステージ: assertive）
- [x] 4-1b. スキルゲージに ARIA 属性追加（role, aria-valuenow, aria-valuemax, aria-label）
- [x] 4-1c. 全ボタンに aria-label 追加
- [x] 4-2a. use-responsive-size.ts 作成
- [x] 4-2b. FallingShooterPage.styles.ts レスポンシブ対応（max-width, min-height追加）
- [x] 4-2c. FalldownShooterGame.tsx に useResponsiveSize フック統合
- [x] 4-3. Overlay DRY 改善（ScoreOverlay共通コンポーネント抽出）
- [x] Phase 4 テスト実行・確認（全パス）

## Phase 5: 検証・仕上げ

- [x] 5-1. 未使用依存の調査（tone: agile-quiz-sugorokuで使用、jotai: 多数のhooksで使用 → 削除不可）
- [x] 5-2. テストカバレッジ確認（Stmts 65.56%, Lines 68.01%, コンポーネント層 86.18%）
- [x] 5-3. ビルド確認（webpack compiled successfully）
- [x] 5-4. TypeScript 型チェック（falldown-shooter エラー 0）
- [x] 5-5. 検証・修正完了（18 suites, 154 tests PASS、FalldownShooterGame.tsx 179行）

## 追加対応

- [x] GameBoard.tsx 抽出（ゲーム盤面描画の専用コンポーネント化）
- [x] GameOverlays.tsx 抽出（オーバーレイ描画の専用コンポーネント化）
- [x] 統合テスト拡充（ポーズ機能・難易度選択・ランキング表示のフローテスト +8件）

## Phase 6: スコア保存修正 & 難易度パラメータ完全実装

- [x] 6-1a. use-game-loop.ts — saveScore に difficulty を追加（ゲームオーバー時）
- [x] 6-1b. use-game-loop.ts — ステージクリア・エンディング到達時にもスコア保存を追加
- [x] 6-1c. use-game-flow.ts — getHighScore に difficulty を渡す（UseGameFlowParams に追加）
- [x] 6-1d. FalldownShooterGame.tsx — useGameFlow に difficulty を渡す
- [x] 6-2a. use-game-loop.ts — 弾衝突スコアに scoreMultiplier 適用
- [x] 6-2b. use-game-loop.ts — ラインクリアスコアに scoreMultiplier 適用
- [x] 6-3a. block.ts — Block.create に powerUpChance パラメータ追加（デフォルト値で後方互換）
- [x] 6-3b. use-game-loop.ts — Block.create 呼出時に powerUpChance を渡す
- [x] 6-4a. use-skill-system.ts — UseSkillSystemParams に skillChargeMultiplier 追加・チャージ計算に適用
- [x] 6-4b. use-skill-system.ts — useEffect 依存配列に skillChargeMultiplier 追加
- [x] 6-4c. FalldownShooterGame.tsx — useSkillSystem に DIFFICULTIES[difficulty].skillChargeMultiplier を渡す
- [x] 6-5. use-game-loop.ts — finalScore 変数導入（Object.assign ミューテーションによるスコア二重加算バグ修正）
- [x] Phase 6 テスト実行・確認（18 suites, 158 tests PASS）
- [x] README.md 更新（新機能・ファイル構成・テスト方法の反映）
