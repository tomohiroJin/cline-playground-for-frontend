# 原始進化録 - PRIMAL PATH 大規模リファクタリング タスクチェックリスト

各タスクは `plan.md` の修正項目、`spec.md` の仕様に基づく。
フェーズ単位でコミット・テスト可能。

---

## フェーズ1: ドメインモデルの定義と型の再構築 ✅ 完了

### 1.1 型ディレクトリの構築

- [x] `types/` ディレクトリを新設
- [x] `types/common.ts`: LogEntry, DmgPopup, TreeBonus, CivType, Difficulty 等の共通型を定義
- [x] `types/player.ts`: PlayerState インターフェースを定義
- [x] `types/battle.ts`: BattleState 型を定義（en は Enemy | null）
- [x] `types/units.ts`: Ally, AllyTemplate, Enemy, EnemyTemplate 型を定義（spec の battle.ts から分離）
- [x] `types/progression.ts`: ProgressState 型を定義（fe は CivTypeExt | null, fReq/cB は number, bms は BiomeId[], cBT は BiomeIdExt）
- [x] `types/evolution.ts`: EvolutionState, Evolution, EvoEffect, SynergyTag 等の型を定義
- [x] `types/skill.ts`: SkillState, ASkillDef, SkillFx, SkillSt, ASkillId 型を定義（mxA フィールド含む）
- [x] `types/awakening.ts`: AwakeningState, AwokenRecord 型を定義（saReq/rvU は number 型）
- [x] `types/stats.ts`: RunStatsState, RunStats, AggregateStats 型を定義
- [x] `types/challenge.ts`: ChallengeState, ChallengeModifier, ChallengeDef 型を定義
- [x] `types/endless.ts`: EndlessState 型を定義
- [x] `types/save.ts`: SaveData 型を定義
- [x] `types/event.ts`: EventId, EventEffect, EventChoice, RandomEventDef 等の型を定義
- [x] `types/achievement.ts`: AchievementCondition, AchievementDef, AchievementState 型を定義
- [x] `types/tick.ts`: TickResult, TickEvent, PlayerAttackResult 型を定義
- [x] `types/game-state.ts`: RunState（合成型）, GameState 型を定義
- [x] `types/index.ts`: barrel export

### 1.2 RunState の再定義

- [x] `types/game-state.ts`: RunState をサブステートの合成型（extends）として再定義
- [x] `types.ts`: 旧 types.ts を barrel re-export に変換し後方互換を維持
- [x] 既存テストが全てパスすることを確認（229スイート / 3209テスト）

### 1.3 GamePhase ステートマシン

- [x] `types/phase.ts`: GamePhase 型を明示的に定義（endless_checkpoint, challenge フェーズ含む）
- [x] `types/phase.ts`: PHASE_TRANSITIONS テーブルを定義
- [x] `types/phase.ts`: `assertValidTransition` / `isValidTransition` ヘルパー関数を定義

### P1 検証

- [x] `npm test` 全テストパス（229スイート / 3209テスト）
- [x] `npx tsc --noEmit` 型エラーなし
- [x] `npm run build` ビルド成功
- [x] 既存の振る舞いに変更がないことを確認

### P1 補足: spec との差異

- `units.ts` を新設: Ally/Enemy 関連型は battle.ts ではなく独立ファイルに分離（循環参照回避のため）
- BiomeId/BiomeIdExt/Difficulty 等の広範囲参照型は `common.ts` に配置（spec の progression.ts ではなく）
- MetaStorage 型は既存コードに存在しなかったためスキップ

---

## フェーズ2: game-logic.ts のドメイン分割

### 2.1 ドメインディレクトリの構築

- [ ] `domain/` ディレクトリと全サブディレクトリを新設
- [ ] `domain/shared/utils.ts`: clamp, mkPopup, updatePopups, getSnap, applyStatFx を移動
- [ ] `domain/shared/civ-utils.ts`: civLvs, civMin, civLv, dominantCiv を移動

### 2.2 戦闘ドメイン

- [ ] `domain/battle/combat-calculator.ts`: calcPlayerAtk, effATK, biomeBonus, calcEnvDmg, aliveAllies, deadAllies, scaleEnemy を移動
- [ ] `domain/battle/tick-phases.ts`: tick, tickEnvPhase, tickPlayerPhase, tickAllyPhase, tickRegenPhase, tickEnemyPhase, tickDeathCheck を移動
- [ ] `domain/battle/battle-service.ts`: startBattle, afterBattle を移動
- [ ] `domain/battle/boss-service.ts`: resolveFinalBossKey, startFinalBoss, handleFinalBossKill を移動

### 2.3 進化ドメイン

- [ ] `domain/evolution/evolution-service.ts`: rollE, applyEvo, simEvo を移動
- [ ] `domain/evolution/synergy-service.ts`: calcSynergies, applySynergyBonuses を移動

### 2.4 スキルドメイン

- [ ] `domain/skill/skill-service.ts`: applySkill, calcAvlSkills, tickBuffs, decSkillCds を移動

### 2.5 覚醒ドメイン

- [ ] `domain/awakening/awakening-service.ts`: checkAwakeningRules, applyAwkFx, awkInfo を移動

### 2.6 イベントドメイン

- [ ] `domain/event/event-service.ts`: rollEvent, applyEventChoice, computeEventResult, formatEventResult, getEffectHintColor, getEffectHintIcon を移動

### 2.7 進行ドメイン

- [ ] `domain/progression/run-service.ts`: startRunState, calcRunStats, calcBoneReward, allyReviveCost を移動
- [ ] `domain/progression/biome-service.ts`: pickBiomeAuto, applyBiomeSelection, applyFirstBiome, applyAutoLastBiome, calcEndlessScale, calcEndlessScaleWithAM, applyEndlessLoop を移動
- [ ] `domain/progression/tree-service.ts`: getTB, tbSummary, bestDiffLabel を移動

### 2.8 実績・チャレンジドメイン

- [ ] `domain/achievement/achievement-service.ts`: checkAchievement を移動（checkAllAchievements は hooks 内ローカルヘルパーのため P4 で対応）
- [ ] `domain/challenge/challenge-service.ts`: applyChallenge を移動

### 2.9 game-logic.ts の barrel 化

- [ ] `game-logic.ts` を re-export barrel ファイルに変換
- [ ] 全消費側のインポートが正常に解決されることを確認

### P2 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] 全エクスポートが `game-logic.ts` 経由で変わらず利用可能

---

## フェーズ3: デザインパターン導入

### 3.1 Strategy パターン — スキル

- [ ] `domain/skill/skill-handler.ts`: SkillHandler インターフェース定義
- [ ] `domain/skill/handlers/dmg-all-handler.ts`: ダメージスキルハンドラー
- [ ] `domain/skill/handlers/heal-all-handler.ts`: 回復スキルハンドラー
- [ ] `domain/skill/handlers/buff-atk-handler.ts`: バフスキルハンドラー
- [ ] `domain/skill/handlers/shield-handler.ts`: シールドスキルハンドラー
- [ ] `domain/skill/skill-registry.ts`: SkillRegistry 構築
- [ ] `domain/skill/skill-service.ts`: applySkill を SkillRegistry ベースに書き換え
- [ ] 既存のスキルテストが全てパス

### 3.2 Strategy パターン — イベント効果

- [ ] `domain/event/event-effect-handler.ts`: EventEffectHandler インターフェース定義
- [ ] `domain/event/handlers/stat-change-handler.ts`: ステータス変更ハンドラー
- [ ] `domain/event/handlers/heal-handler.ts`: 回復ハンドラー
- [ ] `domain/event/handlers/damage-handler.ts`: ダメージハンドラー
- [ ] `domain/event/handlers/bone-change-handler.ts`: ボーン変更ハンドラー
- [ ] `domain/event/handlers/add-ally-handler.ts`: 仲間追加ハンドラー
- [ ] `domain/event/handlers/random-evolution-handler.ts`: ランダム進化ハンドラー
- [ ] `domain/event/handlers/civ-level-up-handler.ts`: 文明レベルアップハンドラー
- [ ] `domain/event/handlers/nothing-handler.ts`: 無効果ハンドラー
- [ ] `domain/event/event-effect-registry.ts`: EventEffectRegistry 構築
- [ ] `domain/event/event-service.ts`: applyEventChoice を Registry ベースに書き換え
- [ ] 既存のイベントテストが全てパス

### 3.3 Strategy パターン — 実績

- [ ] `domain/achievement/achievement-checker.ts`: AchievementChecker インターフェース定義
- [ ] `domain/achievement/checkers/`: 各実績チェッカーを個別ファイルで実装（15種類）
- [ ] `domain/achievement/achievement-registry.ts`: AchievementRegistry 構築
- [ ] `domain/achievement/achievement-service.ts`: checkAchievement を Registry ベースに書き換え
- [ ] 既存の実績テストが全てパス

### 3.4 戦闘ログコレクター

- [ ] `domain/battle/battle-log-collector.ts`: BattleLogCollector 定義
- [ ] `domain/battle/tick-phases.ts`: tick内のログ追加を BattleLogCollector 経由に変更
- [ ] 既存のテストが全てパス

### P3 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] 既存の振る舞いに変更がないことを確認

---

## フェーズ4: hooks.ts の分割と Reducer リファクタリング

### 4.1 アクション型のグループ化

- [ ] `hooks/actions.ts`: BattleAction, EvolutionAction, EventAction, ProgressionAction, MetaAction 型定義
- [ ] `hooks/actions.ts`: GameAction を union 型として再定義
- [ ] `hooks/actions.ts`: 型ガード関数（isBattleAction 等）を定義

### 4.2 Reducer の分割

- [ ] `hooks/reducers/battle-reducer.ts`: BATTLE_TICK, AFTER_BATTLE, USE_SKILL, CHANGE_SPEED, SURRENDER, FINAL_BOSS_KILLED
- [ ] `hooks/reducers/evolution-reducer.ts`: SELECT_EVO, SKIP_EVO, SHOW_EVO, PROCEED_AFTER_AWK
- [ ] `hooks/reducers/event-reducer.ts`: TRIGGER_EVENT, CHOOSE_EVENT, APPLY_EVENT_RESULT
- [ ] `hooks/reducers/progression-reducer.ts`: START_RUN, START_CHALLENGE, GO_DIFF, GO_HOW, GO_TREE, PREPARE_BIOME_SELECT, PICK_BIOME, GO_FINAL_BOSS, BIOME_CLEARED, PROCEED_TO_BATTLE, SET_PHASE
- [ ] `hooks/reducers/meta-reducer.ts`: GAME_OVER, RETURN_TO_TITLE, BUY_TREE_NODE, RESET_SAVE, LOAD_SAVE, LOAD_META, RECORD_RUN_END, REVIVE_ALLY, SKIP_REVIVE, ENDLESS_CONTINUE, ENDLESS_RETIRE
- [ ] hooks 内ローカルヘルパー（transitionAfterBiome, updateAggregate, checkAllAchievements）を適切な reducer に配置
- [ ] `hooks/reducers/game-reducer.ts`: メインルーター + フェーズ遷移検証

### 4.3 フックの分割

- [ ] `hooks/use-game-state.ts`: useGameState フック
- [ ] `hooks/use-battle.ts`: useBattle フック
- [ ] `hooks/use-audio.ts`: useAudio フック
- [ ] `hooks/use-overlay.ts`: useOverlay フック
- [ ] `hooks/use-persistence.ts`: usePersistence フック
- [ ] `hooks/index.ts`: barrel export

### 4.4 hooks.ts の barrel 化

- [ ] `hooks.ts` を re-export barrel ファイルに変換
- [ ] 全消費側のインポートが正常に解決されることを確認

### P4 検証

- [ ] `npm test` 全テストパス（reducer テスト含む）
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザ確認: 全フェーズ遷移が正常に動作

---

## フェーズ5: constants.ts のドメイン別分割

### 5.1 定数ファイルの分割

- [ ] `constants/battle.ts`: ENM, BOSS, BOSS_CHAIN_SCALE, FINAL_BOSS_ORDER, SPEED_OPTS, WAVES_PER_BIOME, ENEMY_COLORS, ENEMY_DETAILS, ENEMY_SMALL_DETAILS
- [ ] `constants/evolution.ts`: EVOS, SYNERGY_BONUSES, SYNERGY_TAG_INFO
- [ ] `constants/biome.ts`: BIO, BIOME_COUNT, BIOME_AFFINITY, ENV_DMG
- [ ] `constants/difficulty.ts`: DIFFS
- [ ] `constants/skill.ts`: A_SKILLS, SFX_DEFS
- [ ] `constants/event.ts`: RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES
- [ ] `constants/tree.ts`: TREE, TIER_UNLOCK, TIER_NAMES
- [ ] `constants/achievement.ts`: ACHIEVEMENTS, CHALLENGES
- [ ] `constants/awakening.ts`: AWK_SA, AWK_FA
- [ ] `constants/ally.ts`: ALT
- [ ] `constants/ui.ts`: CIV_TYPES, CIV_KEYS, TC, TN, CAT_CL, LOG_COLORS, TB_SUMMARY, TB_DEFAULTS, TB_KEY_COLOR
- [ ] `constants/save.ts`: FRESH_SAVE, SAVE_KEY, STATS_KEY, ACHIEVEMENTS_KEY, AGGREGATE_KEY, MAX_RUN_STATS
- [ ] `constants/scaling.ts`: LOOP_SCALE_FACTOR, ENDLESS_LINEAR_SCALE, ENDLESS_EXP_BASE, ENDLESS_AM_REFLECT_RATIO
- [ ] `constants/audio.ts`: BGM_PATTERNS, VOLUME_KEY
- [ ] `constants/index.ts`: barrel export

### 5.2 constants.ts の barrel 化

- [ ] `constants.ts` を re-export barrel ファイルに変換
- [ ] 全消費側のインポートが正常に解決されることを確認

### P5 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功

---

## フェーズ6: コンポーネントのリファクタリング

### 6.1 BattleScreen の分割

- [ ] `components/battle/BattleCanvas.tsx`: Canvas 描画コンポーネント
- [ ] `components/battle/BattleStatusBar.tsx`: ステータス表示コンポーネント
- [ ] `components/battle/BattleLog.tsx`: 戦闘ログコンポーネント
- [ ] `components/battle/SkillPanel.tsx`: スキルパネルコンポーネント
- [ ] `components/battle/BossCounter.tsx`: ボスカウンターコンポーネント
- [ ] `components/BattleScreen.tsx`: 分割後のオーケストレータ（100行以内）

### 6.2 EventScreen の分割

- [ ] `components/event/EventCard.tsx`: イベント内容表示
- [ ] `components/event/EventChoices.tsx`: 選択肢ボタン群
- [ ] `components/EventScreen.tsx`: 分割後のオーケストレータ（80行以内）

### 6.3 shared.tsx の分割

- [ ] `components/shared/ProgressBar.tsx`
- [ ] `components/shared/HpBar.tsx`
- [ ] `components/shared/StatLabel.tsx`
- [ ] `components/shared/BoneDisplay.tsx`
- [ ] `components/shared/OverlayNotification.tsx`
- [ ] `components/shared/index.ts`: barrel export
- [ ] `components/shared.tsx` を barrel re-export に変換

### 6.4 Props 型定義

- [ ] 各分割コンポーネントに明示的な Props 型定義を追加
- [ ] Props は必要最小限のデータのみ受け取る（RunState 全体を渡さない）

### P6 検証

- [ ] `npm test` 全テストパス（コンポーネントテスト含む）
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザ確認: 全画面の表示・操作が正常

---

## フェーズ7: DbC 強化

### 7.1 契約の定義

- [ ] `contracts/player-contracts.ts`: requireValidPlayer 事前条件
- [ ] `contracts/battle-contracts.ts`: requireActiveBattle 事前条件
- [ ] `contracts/run-invariants.ts`: assertRunInvariant 不変条件
- [ ] `contracts/evolution-contracts.ts`: requireValidEvolution 事前条件

### 7.2 契約の適用

- [ ] `domain/battle/battle-service.ts`: startBattle, afterBattle に事前条件追加
- [ ] `domain/battle/tick-phases.ts`: tick の出口に事後条件追加
- [ ] `domain/evolution/evolution-service.ts`: applyEvo に事前/事後条件追加
- [ ] `domain/skill/skill-service.ts`: applySkill に事前条件追加
- [ ] `hooks/reducers/game-reducer.ts`: 状態遷移後に不変条件チェック（開発モードのみ）

### 7.3 本番環境での除去

- [ ] `contracts/index.ts`: NODE_ENV による条件付き実行
- [ ] Webpack DefinePlugin で本番ビルド時に invariant をデッドコード化

### P7 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功（本番モードで invariant が除去されている）
- [ ] 不正な状態を作った場合に invariant がエラーを投げることを確認

---

## フェーズ8: 単体テストのリファクタリング

### 8.1 テスト基盤の整備

- [ ] `__tests__/helpers/run-state-builder.ts`: RunStateBuilder クラス実装
- [ ] `__tests__/helpers/jest-matchers.ts`: カスタムマッチャー定義
- [ ] `jest.config.js`: setupFilesAfterSetup にカスタムマッチャーを追加
- [ ] `jest.config.js`: カバレッジ閾値を引き上げ（lines: 70%, functions: 75%, branches: 60%）

### 8.2 テストファイルの再編

- [ ] `__tests__/domain/battle/battle-service.test.ts`: startBattle, afterBattle のテスト
- [ ] `__tests__/domain/battle/combat-calculator.test.ts`: 攻撃計算テスト
- [ ] `__tests__/domain/battle/tick-phases.test.ts`: 戦闘ティックテスト
- [ ] `__tests__/domain/battle/boss-service.test.ts`: ボスサービステスト
- [ ] `__tests__/domain/evolution/evolution-service.test.ts`: 進化テスト
- [ ] `__tests__/domain/evolution/synergy-service.test.ts`: シナジーテスト
- [ ] `__tests__/domain/skill/skill-service.test.ts`: スキルテスト
- [ ] `__tests__/domain/skill/handlers/`: 各スキルハンドラーテスト
- [ ] `__tests__/domain/event/event-service.test.ts`: イベントテスト
- [ ] `__tests__/domain/event/handlers/`: 各イベント効果ハンドラーテスト
- [ ] `__tests__/domain/achievement/achievement-service.test.ts`: 実績テスト
- [ ] `__tests__/domain/progression/run-service.test.ts`: ラン開始テスト
- [ ] `__tests__/domain/progression/biome-service.test.ts`: バイオームテスト
- [ ] `__tests__/domain/progression/tree-service.test.ts`: ツリーテスト

### 8.3 Reducer テストの再編

- [ ] `__tests__/hooks/reducers/battle-reducer.test.ts`
- [ ] `__tests__/hooks/reducers/evolution-reducer.test.ts`
- [ ] `__tests__/hooks/reducers/event-reducer.test.ts`
- [ ] `__tests__/hooks/reducers/progression-reducer.test.ts`
- [ ] `__tests__/hooks/reducers/meta-reducer.test.ts`

### 8.4 コンポーネントテストの再編

- [ ] `__tests__/components/battle/BattleScreen.test.tsx`
- [ ] `__tests__/components/battle/BattleLog.test.tsx`
- [ ] `__tests__/components/battle/SkillPanel.test.tsx`
- [ ] `__tests__/components/event/EventScreen.test.tsx`
- [ ] 既存コンポーネントテストを RunStateBuilder ベースに書き換え

### 8.5 テスト品質向上

- [ ] 既存テストで makeRun を使っている箇所を RunStateBuilder に置換
- [ ] テスト名を日本語の「〜した場合に〜する」形式に統一
- [ ] AAA パターンのコメント（Arrange/Act/Assert）を追加
- [ ] 不要な重複テストの削除

### P8 検証

- [ ] `npm test` 全テストパス
- [ ] カバレッジ閾値を満たしている（lines: 70%+, functions: 75%+, branches: 60%+）
- [ ] テスト数が維持または増加している

---

## フェーズ9: E2E テストの導入

### 9.1 Playwright 設定

- [ ] `playwright.config.ts` の作成
- [ ] `package.json` に E2E テスト用スクリプト追加（`test:e2e`）
- [ ] Playwright ブラウザのインストール確認

### 9.2 テストヘルパー

- [ ] `e2e/helpers/primal-path-helper.ts`: PrimalPathHelper クラス実装
  - [ ] `navigateToGame()`: ゲーム画面への遷移
  - [ ] `startRun(difficulty?)`: ラン開始
  - [ ] `waitForBattleEnd()`: バトル終了待機
  - [ ] `selectEvolution(index?)`: 進化選択
  - [ ] `getCurrentPhase()`: 現在フェーズ取得

### 9.3 E2E テストシナリオ

- [ ] `e2e/primal-path/title-to-battle.spec.ts`: タイトル→ステージ選択→バトル開始
- [ ] `e2e/primal-path/battle-flow.spec.ts`: バトル→進化→次バトルの基本フロー
- [ ] `e2e/primal-path/evolution-select.spec.ts`: 進化選択→ステータス反映
- [ ] `e2e/primal-path/boss-battle.spec.ts`: ボス戦→最終ボス連戦
- [ ] `e2e/primal-path/game-over.spec.ts`: ゲームオーバー→リザルト→タイトル
- [ ] `e2e/primal-path/tree-purchase.spec.ts`: 文明ツリー購入→効果反映
- [ ] `e2e/primal-path/challenge-mode.spec.ts`: チャレンジモード選択→制約反映
- [ ] `e2e/primal-path/event-encounter.spec.ts`: ランダムイベント→選択→効果
- [ ] `e2e/primal-path/save-load.spec.ts`: セーブ/ロード→データ永続化
- [ ] `e2e/primal-path/endless-mode.spec.ts`: エンドレスモード→ループ動作

### 9.4 CI/CD 統合

- [ ] GitHub Actions ワークフローに E2E テストを追加
- [ ] E2E テストの実行結果レポートを設定

### P9 検証

- [ ] `npx playwright test` 全テストパス
- [ ] CI/CD で自動実行される
- [ ] 失敗時のスクリーンショット・トレースが保存される

---

## 最終レビューチェック

### 品質基準

- [ ] `any` 型の使用がない
- [ ] 200行超のコンポーネントがない
- [ ] 30行超の関数が最小限（戦略パターンで分割済み）
- [ ] `game-logic.ts` が barrel re-export のみ（実装なし）
- [ ] `hooks.ts` が barrel re-export のみ（実装なし）
- [ ] `constants.ts` が barrel re-export のみ（実装なし）

### 原則準拠

- [ ] DRY: 重複コードが排除されている
- [ ] SRP: 各関数・クラスが単一責任
- [ ] OCP: 新しいスキル・イベント・実績をハンドラー追加だけで拡張可能
- [ ] LSP: インターフェース実装が交換可能
- [ ] DIP: ドメインサービスが具体的な定数に直接依存しない
- [ ] DbC: 主要なドメインサービスに事前/事後条件あり

### テスト

- [ ] 単体テスト: カバレッジ 70%+ (lines)
- [ ] E2E テスト: 主要フロー10シナリオがパス
- [ ] CI/CD: 全テストが自動実行される

### 互換性

- [ ] セーブデータの後方互換性が維持されている
- [ ] 外部からの import パスに変更がない（barrel re-export で吸収）
- [ ] ゲームプレイの振る舞いに変更がない
