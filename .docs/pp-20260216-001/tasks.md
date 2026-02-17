# タスクチェックリスト: 原始進化録 (PRIMAL PATH) React コンポーネント化

## Phase 0: 基盤（types / constants / contracts）

- [x] **T-001**: `types.ts` — 全型定義（GamePhase, RunState, Enemy, Ally, Evolution, SaveData 等）
- [x] **T-002**: `constants.ts` — ゲームデータ定数抽出（DIFFS, EVOS, ALT, ENM, BOSS, TREE, BIOME_AFFINITY 等）
- [x] **T-003**: `contracts.tsx` — invariant(), safeSync(), ErrorBoundary

## Phase 1: 純粋ロジック層

- [x] **T-004**: `game-logic.ts` — HTML からの純粋関数抽出・イミュータブル化
  - tick(), applyEvo(), rollE(), startRunState(), calcBoneReward() 等
- [x] **T-005**: `sprites.ts` — Canvas 描画関数（drawPlayer, drawEnemy, drawAlly, drawTitle）
- [x] **T-006**: `audio.ts` — Web Audio SFX エンジン（AudioEngine）
- [x] **T-007**: `storage.ts` — localStorage ラッパー（save/load/fresh, key: primal-path-v7）

## Phase 2: フック層

- [x] **T-008**: `hooks.ts` — カスタムフック群
  - useGameState (useReducer + gameReducer)
  - useBattle (setInterval ライフサイクル)
  - useAudio (lazy AudioEngine init)
  - useOverlay (Promise ベース通知キュー)
  - usePersistence (localStorage 自動永続化)

## Phase 3: UI コンポーネント層

- [x] **T-009**: `styles.ts` — styled-components & keyframes（GameContainer, GameShell, Screen, GameButton 等）
- [x] **T-010**: `components/shared.tsx` — 共通UI（ProgressBar, HpBar, StatPreview, CivBadge, AllyList 等）
- [x] **T-011**: `components/Overlay.tsx` — 通知オーバーレイ
- [x] **T-012**: `components/TitleScreen.tsx` — タイトル画面
- [x] **T-013**: `components/DifficultyScreen.tsx` — 難易度選択
- [x] **T-014**: `components/HowToPlayScreen.tsx` — 遊び方
- [x] **T-015**: `components/TreeScreen.tsx` — 文明ツリー
- [x] **T-016**: `components/BiomeSelectScreen.tsx` — バイオーム選択
- [x] **T-017**: `components/EvolutionScreen.tsx` — 進化選択
- [x] **T-018**: `components/BattleScreen.tsx` — 自動戦闘（Canvas + ステータス + ログ）
- [x] **T-019**: `components/AwakeningScreen.tsx` — 覚醒演出
- [x] **T-020**: `components/PreFinalScreen.tsx` — 最終ボス準備
- [x] **T-021**: `components/AllyReviveScreen.tsx` — 仲間復活
- [x] **T-022**: `components/GameOverScreen.tsx` — リザルト

## Phase 4: メインコンポーネント統合

- [x] **T-023**: `PrimalPathGame.tsx` — メインオーケストレータ全面書き換え

## Phase 5: クリーンアップ & テスト

- [x] **T-024**: `primal-path.html` 削除
- [x] **T-025**: `webpack.config.ts` — `.html` の `asset/source` ルール削除
- [x] **T-026**: `src/declarations.d.ts` — `*.html` モジュール型宣言削除
- [x] **T-027**: `__tests__/game-logic.test.ts` — 純粋関数テスト（44テスト）
- [x] **T-028**: `__tests__/storage.test.ts` — 永続化テスト（5テスト）
- [x] **T-029**: `src/pages/GameListPage.test.tsx` — PrimalPath カードテスト追加
- [x] **T-030**: ドキュメント更新（spec.md, plan.md, tasks.md）

## 検証（React化）

- [x] **T-031**: `npm run build` — ビルド成功確認
- [x] **T-032**: 手動動作確認（タイトル → ゲーム開始 → 自動戦闘 → ゲームオーバー）
- [x] **T-033**: モバイル表示確認（≤500px で全画面）
- [x] **T-034**: 既存ゲームへのリグレッションなし確認

---

## Phase 6: メニュー画像

- [x] **T-035**: `image-spec.md` — AI 生成プロンプト仕様書作成
- [x] **T-036**: `primal_path_card_bg.webp` — 画像生成（外部ツール使用）
- [x] **T-037**: `src/assets/images/` — 生成画像の配置（1024×1024px, WebP, ≤300KB）
- [x] **T-038**: `src/pages/GameListPage.tsx` — `$customBg` → `$bgImage` に差し替え
- [ ] **T-039**: カード表示確認（ホバー効果との調和、クリッピング確認）

## Phase 7: README 作成・更新

- [ ] **T-040**: `src/features/primal-path/README.md` — 新規作成
  - 概要、操作方法、ファイル構成、状態管理、使用技術、ゲームシステム
  - Labyrinth Echo パターン準拠
- [ ] **T-041**: `README.md`（ルート） — ゲーム一覧テーブルに PrimalPath 行を追加

## Phase 8: リファクタリング（最小限：関数分割のみ）

- [ ] **T-042**: `game-logic.ts` — `tick()` を6サブ関数に分割
  - tickEnvPhase, tickPlayerPhase, tickAllyPhase, tickRegenPhase, tickEnemyPhase, tickDeathCheck
- [ ] **T-043**: `hooks.ts` — reducer 重複パターンを `transitionAfterBiome()` に抽出
  - 対象: AFTER_BATTLE, BIOME_CLEARED, SKIP_REVIVE, REVIVE_ALLY
- [ ] **T-044**: 既存テスト全通過確認（52テスト）
- [ ] **T-045**: `npm run build` — ビルド成功確認

## Phase 9: ドキュメント最終更新

- [x] **T-046**: `spec.md` — 追加整備仕様セクション追記
- [x] **T-047**: `plan.md` — Phase 6-8 追加整備計画追記
- [x] **T-048**: `tasks.md` — 新タスクチェックリスト追加
- [x] **T-049**: `image-spec.md` — 新規作成
