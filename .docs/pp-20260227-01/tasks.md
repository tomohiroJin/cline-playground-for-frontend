# 原始進化録 (PRIMAL PATH) ブラッシュアップ — タスクチェックリスト

## 概要

本チェックリストは `plan.md` の7フェーズを実装タスクに分解したものです。
各タスクは独立して完了・検証可能な粒度で定義しています。

---

## Phase 1: 戦闘体験の向上（Battle Experience）

### 1-1. ダメージ数値ポップアップ ✅

- [x] **DamagePopup 型定義の追加**
  - 対象: `types.ts`
  - 作業: `DmgPopup` インターフェース（v, x, y, cl, fs, a, lt）を定義
  - 完了: `3302a06`

- [x] **ダメージポップアップ描画関数の実装**
  - 対象: `sprites.ts`
  - 作業: `drawDmgPopup(ctx, popup, w, h)` 関数を追加
  - 完了: `3302a06`

- [x] **ポップアップ管理ロジックの実装**
  - 対象: `game-logic.ts`
  - 作業: `mkPopup(v, crit, heal)` / `updatePopups(popups)` を追加
  - 完了: `3302a06`

- [x] **tick() からのポップアップ生成**
  - 対象: `game-logic.ts`
  - 作業: TickEvent に `popup` イベント追加。攻撃・回復・再生・被ダメ時に発火
  - 完了: `3302a06`

- [x] **BattleScreen へのポップアップ表示統合**
  - 対象: `components/BattleScreen.tsx`, `PrimalPathGame.tsx`
  - 作業: 敵/プレイヤー側のポップアップCanvasを追加。tickEventsで伝搬
  - 完了: `3302a06`

- [x] **ポップアップのユニットテスト**
  - 対象: `__tests__/game-logic.test.ts`
  - 作業: mkPopup（通常/会心/回復）、updatePopups（Y上昇、寿命除外、最大5個、alpha減衰）
  - 完了: `3302a06`（4テスト追加）

---

### 1-2. バトルエフェクト強化 ✅

- [x] **攻撃ヒットフラッシュの実装**
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: `flashHit` キーフレーム活用。`isHit` state で `shake_enemy` イベント時に0.15秒フラッシュ適用
  - 完了: `d83d6bb`

- [x] **火傷パーティクルの実装**
  - 対象: `sprites.ts`, `components/BattleScreen.tsx`
  - 作業: `drawBurnFx(ctx, w, h, frame)` 関数を追加。敵Canvas上にオレンジ粒パーティクル描画
  - 完了: `d83d6bb`

- [x] **覚醒全画面エフェクトの実装**
  - 対象: `styles.ts`, `components/AwakeningScreen.tsx`
  - 作業: `awkFlash` キーフレーム + `AwkFlashOverlay` コンポーネント追加。覚醒ボタン押下時にフラッシュ
  - 完了: `d83d6bb`

---

### 1-3. アクティブスキルシステム ✅

- [x] **スキル型定義の追加**
  - 対象: `types.ts`
  - 作業: `ASkillId`, `SkillFx`, `ASkillDef`, `ABuff`, `SkillSt` 型を定義。`SfxType` にスキルSFX追加
  - 完了: `228b78f`

- [x] **スキル定数の定義**
  - 対象: `constants.ts`
  - 作業: `A_SKILLS` 定数配列（fB/nH/bR/sW の4スキル）を Object.freeze で定義
  - 完了: `228b78f`

- [x] **RunState へのスキル状態追加**
  - 対象: `types.ts`, `game-logic.ts`
  - 作業: `RunState` に `sk: SkillSt` 追加。`startRunState` / `deepCloneRun` を対応
  - 完了: `228b78f`

- [x] **applySkill 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: `applySkill(r, sid)` でスキル効果適用（ダメージ/回復/バフ/シールド）。純粋関数で `{ nextRun, events }` を返す
  - 完了: `228b78f`

- [x] **スキル解放判定の実装**
  - 対象: `game-logic.ts`
  - 作業: `calcAvlSkills(r)` で文明レベルに応じたスキル解放判定
  - 完了: `228b78f`

- [x] **バフターン管理の実装**
  - 対象: `game-logic.ts`
  - 作業: `tickBuffs(sk)` で毎ターンバフのrTをデクリメント、0以下を削除。`tick()` 末尾で呼び出し
  - 完了: `228b78f`

- [x] **クールダウン管理の実装**
  - 対象: `game-logic.ts`
  - 作業: `decSkillCds(sk)` でバトル終了時CDデクリメント。`afterBattle()` で呼び出し
  - 完了: `228b78f`

- [x] **gameReducer にスキル発動アクション追加**
  - 対象: `hooks.ts`
  - 作業: `USE_SKILL` アクション追加。BattleScreen側で `applySkill` 直接呼び出し→`BATTLE_TICK` でディスパッチ
  - 完了: `228b78f`

- [x] **スキルボタンUIの実装**
  - 対象: `components/BattleScreen.tsx`, `styles.ts`
  - 作業: `SkillBar` / `SkillBtn` コンポーネント追加。CD中グレーアウト。バフアイコン表示
  - 完了: `228b78f`

- [x] **スキルSFXの追加**
  - 対象: `constants.ts`
  - 作業: `SFX_DEFS` に skFire/skHeal/skRage/skShield の4種追加
  - 完了: `228b78f`

- [x] **スキルのユニットテスト**
  - 対象: `__tests__/active-skills.test.ts`（新規）
  - 作業: calcAvlSkills(5), applySkill(5), tickBuffs(2), decSkillCds(2) の計14テスト
  - 完了: `228b78f`

---

### 1-4. 戦闘速度UI改善 ✅

- [x] **速度切替ボタンのビジュアル強化**
  - 対象: `styles.ts`
  - 作業: `SpeedBtn` の `$active` スタイルにグロー効果（box-shadow, text-shadow）追加
  - 完了: `ef67e72`

- [x] **一時停止オーバーレイの追加**
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: `pausePulse` キーフレーム + `PausedOverlay` コンポーネント。⏸時に画面中央「PAUSED」表示
  - 完了: `ef67e72`

---

### 1-5. 敵HP/状態表示の改善 ✅

- [x] **敵HPバー描画関数の実装**
  - 対象: `sprites.ts`, `components/BattleScreen.tsx`
  - 作業: `drawEnemyHpBar(ctx, hp, mhp, x, y, w)` 関数追加。敵Canvas描画useEffectに統合
  - 完了: `fe7f2f3`

- [x] **状態異常アイコン表示**
  - 対象: `sprites.ts`, `components/BattleScreen.tsx`
  - 作業: `drawStatusIcons(ctx, x, y, burn)` で🔥アイコン描画。useEffect依存に `run.burn` 追加
  - 完了: `fe7f2f3`

- [x] **Phase 1 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全1992テストパス + `npm run build` 成功
  - 完了: 既存テスト + 新規22テスト（game-logic 8 + active-skills 14）全パス

---

### 1-6. Phase 1 フィードバック対応

プレイテスト後のフィードバック7項目のうち、🔴（すぐに対応）の4項目を Phase 1 の追加タスクとして実施する。
詳細は `feedback-phase1.md` を参照。

- [ ] **FB-4: 血の契約（HP半減）の結合テスト追加・検証**
  - 対象: `__tests__/game-logic.test.ts`, `game-logic.ts`, `constants.ts`
  - 作業: `applyEvo` → `applyStatFx` の結合テスト追加、`half` + `aM` 複合効果テスト、`simEvo` のHP半減反映確認
  - 完了条件: 血の契約の効果が正しく動作し、テストで保証されていること

- [ ] **FB-1: 速度切り替えを常時利用可能に**
  - 対象: `hooks.ts`
  - 作業: `CHANGE_SPEED` アクションを `phase === 'battle'` 制約から解放。速度設定を永続化
  - 完了条件: バトルフェーズ以外でも速度切り替えが機能すること

- [ ] **FB-2: スキルボタンの拡大・利用可能アピール**
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: `SkillBtn` サイズ拡大、スキルバーを画面下部に移動、利用可能時パルスアニメーション追加
  - 完了条件: スキルボタンが目立つ位置・サイズで表示され、利用可能時に視覚的フィードバックがあること

- [ ] **FB-6: 遊び方にスキル・スピード切り替え説明を追加**
  - 対象: `components/HowToPlayScreen.tsx`
  - 作業: 「アクティブスキル」セクションと「戦闘速度」セクションを追加
  - 完了条件: 初見プレイヤーがスキルと速度切り替えの存在を理解できること

---

## Phase 2: 進化シナジーシステム（Evolution Synergy）

### 2-1. シナジータグシステム

- [ ] **シナジー型定義の追加**
  - 対象: `types.ts`
  - 作業: `SynergyTag`, `SynergyBonusDef`, `SynergyEffect`, `ActiveSynergy` 型を定義
  - 完了条件: 型が export されていること

- [ ] **Evolution 型の拡張**
  - 対象: `types.ts`
  - 作業: `Evolution` インターフェースに `tags?: SynergyTag[]` を追加
  - 完了条件: 既存の Evolution 互換性を維持しつつタグが付与可能なこと

- [ ] **既存進化へのタグ割り当て**
  - 対象: `constants.ts`
  - 作業: 既存24種の進化それぞれに1〜2個のシナジータグを付与
  - 完了条件: 全進化にタグが割り当てられていること（バランスを考慮）

- [ ] **calcSynergies 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: 取得済み進化のタグを集計し、発動中シナジーを返す純粋関数
  - 完了条件: 同タグ2個→Tier1、3個→Tier2が正しく判定されること

---

### 2-2. シナジーボーナス定義

- [ ] **シナジーボーナス定数の定義**
  - 対象: `constants.ts`
  - 作業: `SYNERGY_BONUSES` 配列（8タグ × Tier1/Tier2）を定義
  - 完了条件: 8タグ分のボーナスが定義されていること

- [ ] **applySynergyBonuses 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: シナジーボーナスをステータスに反映する関数
  - 完了条件: ATK/DEF/HP/CR/火傷倍率のボーナスが正しく計算されること

- [ ] **tick() へのシナジー効果反映**
  - 対象: `game-logic.ts`
  - 作業: ダメージ計算時にシナジーボーナスを考慮
  - 完了条件: シナジーTier1/Tier2が戦闘結果に反映されること

- [ ] **シナジーのユニットテスト**
  - 対象: `__tests__/synergy.test.ts`（新規）
  - 作業: calcSynergies, applySynergyBonuses のテスト（0タグ、1タグ、2タグ、3タグ、複数タグ同時）
  - 完了条件: 全テストがパスすること

---

### 2-3. シナジー表示UI

- [ ] **進化選択画面のシナジー表示**
  - 対象: `components/EvolutionScreen.tsx`
  - 作業: 画面上部に現在のシナジー状況（タグ名×個数、発動中ボーナス名）を表示。進化カードにタグアイコンを表示
  - 完了条件: シナジーの現状と次のシナジーまでの進捗がわかること

- [ ] **バトル画面のシナジーアイコン**
  - 対象: `components/BattleScreen.tsx`
  - 作業: ステータス表示エリアに発動中シナジーのアイコンと名前を小さく表示
  - 完了条件: バトル中にどのシナジーが発動しているか一目でわかること

- [ ] **シナジー発動SFXの追加**
  - 対象: `constants.ts`, `audio.ts`
  - 作業: `synergy_activate` SFXを追加。シナジーが新たに発動した瞬間に再生
  - 完了条件: シナジー発動時に効果音が鳴ること

---

### 2-4. 進化カード追加（6種）

- [ ] **新規進化6種の定数定義**
  - 対象: `constants.ts`
  - 作業: `NEW_EVOS` 配列（霜の牙、野火の種、根の盾、祖霊の祝福、血の熱狂、凍れる祈り）を定義。各2タグ
  - 完了条件: 6種が既存の EVOS 配列に統合されていること

- [ ] **新規進化の効果実装**
  - 対象: `game-logic.ts`
  - 作業: 新規進化の `fx` が `applyStatFx` で正しく処理されることを確認。特殊効果がある場合は対応
  - 完了条件: 新規進化がゲーム内で正常に選出・適用されること

- [ ] **Phase 2 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全パス確認 + シナジーが実際のゲームプレイで機能することを手動検証
  - 完了条件: シナジーシステムが戦闘バランスを大きく崩さないこと

---

## Phase 3: ランダムイベントシステム（Random Events）

### 3-1. イベントエンジン

- [ ] **イベント型定義の追加**
  - 対象: `types.ts`
  - 作業: `EventId`, `EventChoice`, `EventEffect`, `RandomEventDef` 型を定義
  - 完了条件: 型が export されていること

- [ ] **GamePhase に 'event' を追加**
  - 対象: `types.ts`
  - 作業: `GamePhase` ユニオン型に `'event'` を追加。`GameState` に `currentEvent` を追加
  - 完了条件: `'event'` フェーズが型安全に使用できること

- [ ] **rollEvent 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: バトル後のイベント発生判定（20%確率、バイオームアフィニティ考慮）
  - 完了条件: RNG 注入でテスタブル。序盤は発生しない制約が機能すること

- [ ] **applyEventChoice 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: 各イベント効果の適用ロジック（ステータス変化、回復、ダメージ、骨変動、仲間追加、ランダム進化、文明レベルアップ）
  - 完了条件: 全効果タイプが正しく適用されること

---

### 3-2. 基本イベント（8種）

- [ ] **イベント定数の定義**
  - 対象: `constants.ts`
  - 作業: `RANDOM_EVENTS` 配列（8種）を定義。各イベントに名前、説明、選択肢、バイオームアフィニティを設定
  - 完了条件: 8種のイベントが定義され、フレーバーテキストが雰囲気に合っていること

- [ ] **イベント発生確率/条件定数の定義**
  - 対象: `constants.ts`
  - 作業: `EVENT_CHANCE`, `EVENT_MIN_BATTLES` 定数を定義
  - 完了条件: 定数が適切な値で定義されていること

---

### 3-3. イベントUI

- [ ] **EventScreen コンポーネントの作成**
  - 対象: `components/EventScreen.tsx`（新規）
  - 作業: イベント名、説明テキスト、選択肢ボタン（リスクレベル色分け）を表示
  - 完了条件: イベント画面が表示され、選択肢をタップできること

- [ ] **EventScreen スタイルの作成**
  - 対象: `styles.ts`
  - 作業: イベント画面用のスタイル（パネル、選択肢ボタン、リスクレベル色）を追加
  - 完了条件: デザインがゲーム全体のテイストに合っていること

- [ ] **PrimalPathGame に event フェーズを統合**
  - 対象: `PrimalPathGame.tsx`
  - 作業: `phase === 'event'` の分岐を追加し、`EventScreen` をレンダリング
  - 完了条件: イベントフェーズが正しく表示・遷移すること

- [ ] **gameReducer にイベント関連アクションを追加**
  - 対象: `hooks.ts`
  - 作業: `TRIGGER_EVENT`, `CHOOSE_EVENT` アクションを追加
  - 完了条件: バトル後→イベント→進化選択のフローが動作すること

- [ ] **イベント発生SFXの追加**
  - 対象: `constants.ts`, `audio.ts`
  - 作業: `event_appear` SFXを追加
  - 完了条件: イベント発生時に効果音が鳴ること

---

### 3-4. バイオーム固有イベント

- [ ] **バイオームアフィニティの確認と調整**
  - 対象: `constants.ts`
  - 作業: 各イベントの `biomeAffinity` を確認。バイオームごとに少なくとも1種の固有イベントがあることを確認
  - 完了条件: 全バイオームでイベントの体験にバリエーションがあること

- [ ] **イベントのユニットテスト**
  - 対象: `__tests__/events.test.ts`（新規）
  - 作業: rollEvent（確率、バイオームアフィニティ、序盤制約）、applyEventChoice（全効果タイプ）のテスト
  - 完了条件: 全テストがパスすること

- [ ] **Phase 3 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全パス確認 + イベントが実際のゲームプレイで自然に発生することを手動検証
  - 完了条件: イベントの頻度・内容がゲーム体験を向上させていること

---

## Phase 4: メタ進行と実績（Meta Progression & Achievements）

### 4-1. ラン統計システム

- [ ] **RunStats 型定義の追加**
  - 対象: `types.ts`
  - 作業: `RunStats`, `AggregateStats` 型を定義
  - 完了条件: 型が export されていること

- [ ] **ラン統計の収集ロジック**
  - 対象: `game-logic.ts`
  - 作業: `calcRunStats(run, result)` 関数を実装。ラン終了時にステータスから統計を生成
  - 完了条件: 全統計フィールドが正しく集計されること

- [ ] **ラン統計のストレージ実装**
  - 対象: `storage.ts`
  - 作業: `saveRunStats`, `loadRunStats`, `saveAggregateStats`, `loadAggregateStats` 関数を追加。最新50件制限
  - 完了条件: ラン統計の保存・読込が正しく動作すること

- [ ] **ラン終了時の統計記録統合**
  - 対象: `hooks.ts`
  - 作業: ゲームオーバー時に `calcRunStats` を実行し、結果を保存
  - 完了条件: ラン終了時に自動的に統計が記録されること

- [ ] **StatsScreen コンポーネントの作成**
  - 対象: `components/StatsScreen.tsx`（新規）
  - 作業: 累計統計 + 直近ランの一覧表示
  - 完了条件: 統計閲覧画面で過去のランを確認できること

- [ ] **TitleScreen にメニューボタン追加**
  - 対象: `components/TitleScreen.tsx`
  - 作業: 「ラン統計」ボタンを追加
  - 完了条件: タイトル画面から統計画面に遷移できること

---

### 4-2. 実績システム（15個）

- [ ] **実績型定義の追加**
  - 対象: `types.ts`
  - 作業: `AchievementDef`, `AchievementCondition`, `AchievementState` 型を定義
  - 完了条件: 型が export されていること

- [ ] **実績定数の定義**
  - 対象: `constants.ts`
  - 作業: `ACHIEVEMENTS` 配列（15個）を定義
  - 完了条件: 15個の実績が条件付きで定義されていること

- [ ] **checkAchievement 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: 実績条件判定ロジック（全条件タイプに対応）
  - 完了条件: 各条件タイプが正しく判定されること

- [ ] **実績ストレージの実装**
  - 対象: `storage.ts`
  - 作業: `saveAchievements`, `loadAchievements` 関数を追加
  - 完了条件: 実績解除状態の永続化が動作すること

- [ ] **ラン終了時の実績チェック統合**
  - 対象: `hooks.ts`
  - 作業: ゲームオーバー時に全実績をチェック、新規解除があればオーバーレイ通知
  - 完了条件: 実績解除時にフィードバックが表示されること

- [ ] **AchievementScreen コンポーネントの作成**
  - 対象: `components/AchievementScreen.tsx`（新規）
  - 作業: 実績一覧（解除済み/未解除）の表示
  - 完了条件: 実績画面で解除状況を確認できること

- [ ] **実績解除SFXの追加**
  - 対象: `constants.ts`
  - 作業: `achievement_unlock` SFXを追加
  - 完了条件: 実績解除時に効果音が鳴ること

- [ ] **実績のユニットテスト**
  - 対象: `__tests__/achievements.test.ts`（新規）
  - 作業: 全15個の実績条件判定テスト
  - 完了条件: 全テストがパスすること

---

### 4-3. 称号システム

- [ ] **称号の定義**
  - 対象: `constants.ts`
  - 作業: 実績に紐づく称号を定義（例: 「神話の刻印者」解除で称号「伝説の狩人」が選択可能に）
  - 完了条件: 実績と称号の紐付けが定義されていること

- [ ] **タイトル画面への称号表示**
  - 対象: `components/TitleScreen.tsx`
  - 作業: プレイヤーが選択した称号をタイトル画面に表示
  - 完了条件: タイトル画面に称号が表示されること

---

### 4-4. チャレンジモード

- [ ] **チャレンジ型定義の追加**
  - 対象: `types.ts`
  - 作業: `ChallengeDef`, `ChallengeModifier` 型を定義
  - 完了条件: 型が export されていること

- [ ] **チャレンジ定数の定義**
  - 対象: `constants.ts`
  - 作業: `CHALLENGES` 配列（3種: 脆き肉体、原始回帰、生存競争）を定義
  - 完了条件: 3種のチャレンジが定義されていること

- [ ] **チャレンジ修飾子の適用ロジック**
  - 対象: `game-logic.ts`
  - 作業: `applyChallenge(run, challenge)` 関数を実装。`startRunState` で修飾子を適用
  - 完了条件: HP半減、進化制限、制限時間の各修飾子が正しく適用されること

- [ ] **ChallengeScreen コンポーネントの作成**
  - 対象: `components/ChallengeScreen.tsx`（新規）
  - 作業: チャレンジ一覧（説明、アイコン、クリア済みマーク）+ 開始ボタン
  - 完了条件: チャレンジを選択して開始できること

- [ ] **制限時間UIの実装**
  - 対象: `components/BattleScreen.tsx`
  - 作業: チャレンジ「生存競争」時にカウントダウンタイマーを表示
  - 完了条件: 制限時間が表示され、0になったら敗北すること

- [ ] **Phase 4 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全パス確認 + 統計・実績・チャレンジの手動検証
  - 完了条件: メタ進行システムが長期プレイの動機を提供すること

---

## Phase 5: ビジュアル・サウンド強化（Visual & Audio Polish）

### 5-1. BGM システム

- [ ] **BGM エンジンの設計**
  - 対象: `audio.ts`
  - 作業: Web Audio API によるバイオーム別BGM再生機能。AudioContext 初期化、ループ再生、フェードイン/アウト
  - 完了条件: BGMが再生・停止・切替できること

- [ ] **バイオーム別BGMデータの定義**
  - 対象: `constants.ts`
  - 作業: タイトル画面用 + バイオーム3種のBGMパターンを周波数シーケンスで定義
  - 完了条件: 4種のBGMが定義されていること

- [ ] **BGM再生のゲームフロー統合**
  - 対象: `hooks.ts`
  - 作業: バイオーム切替時にBGMを切替。タイトル画面でタイトルBGMを再生
  - 完了条件: バイオームに応じたBGMが自動的に切り替わること

- [ ] **音量設定UIの追加**
  - 対象: `components/TitleScreen.tsx`
  - 作業: BGM ON/OFF + 音量スライダーを設定メニューに追加
  - 完了条件: 音量調整が動作し、設定が永続化されること

---

### 5-2. SFX の拡充

- [ ] **新規SFX定義の追加**
  - 対象: `constants.ts`
  - 作業: `NEW_SFX_DEFS`（7種）を既存 `SFX_DEFS` に統合
  - 完了条件: 15種のSFXが定義されていること

- [ ] **SFX再生ポイントの追加**
  - 対象: `hooks.ts`, `components/BattleScreen.tsx`
  - 作業: シナジー発動、イベント発生、スキル発動、実績解除時のSFX再生コールを追加
  - 完了条件: 各イベント発生時に対応するSFXが再生されること

---

### 5-3. スプライトのバリエーション

- [ ] **覚醒段階スプライトの実装**
  - 対象: `sprites.ts`
  - 作業: 覚醒タイプに応じてプレイヤースプライトの色・形を変化させる。小覚醒→パーツ追加、大覚醒→大幅変化
  - 完了条件: 覚醒前後でプレイヤーの見た目が変化すること

---

### 5-4. 背景演出

- [ ] **バイオーム背景グラデーションの実装**
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: バイオームに応じた背景グラデーション変化。草原=緑系、氷河=青系、火山=赤系
  - 完了条件: バイオームごとに背景色が変化すること

- [ ] **天候パーティクルの実装**
  - 対象: `styles.ts`
  - 作業: CSS アニメーションによる天候エフェクト。氷河=雪の結晶落下、火山=火の粉上昇
  - 完了条件: パーティクルが自然に表示されること（パフォーマンス影響なし）

- [ ] **Phase 5 統合テスト**
  - 対象: 全ファイル
  - 作業: BGM/SFX/スプライト/背景の動作確認。モバイルでの AudioContext 動作確認
  - 完了条件: 視覚・聴覚の演出がゲーム体験を向上させていること

---

## Phase 6: テスト・品質保証（Testing & QA）

### 6-1. 新規ロジックのユニットテスト

- [ ] **シナジーテスト**
  - 対象: `__tests__/synergy.test.ts`
  - 作業: calcSynergies（0〜4タグ）、applySynergyBonuses（全効果タイプ）、タグ重複、空配列
  - 完了条件: 10テスト以上、全パス

- [ ] **イベントテスト**
  - 対象: `__tests__/events.test.ts`
  - 作業: rollEvent（確率制御、バイオームアフィニティ、序盤制約）、applyEventChoice（全効果タイプ）
  - 完了条件: 8テスト以上、全パス

- [ ] **実績テスト**
  - 対象: `__tests__/achievements.test.ts`
  - 作業: checkAchievement（全15条件タイプ）、境界値テスト
  - 完了条件: 15テスト以上、全パス

- [ ] **スキルテスト**
  - 対象: `__tests__/active-skills.test.ts`
  - 作業: applyActiveSkill（4スキルタイプ）、クールダウン、バフ管理、解放判定
  - 完了条件: 8テスト以上、全パス

---

### 6-2. コンポーネントテスト

- [ ] **BattleScreen テスト**
  - 対象: `__tests__/BattleScreen.test.tsx`（新規）
  - 作業: スキルボタン表示、ダメージポップアップ存在、速度切替、一時停止
  - 完了条件: 主要UI要素の描画確認テストがパスすること

- [ ] **EvolutionScreen テスト**
  - 対象: `__tests__/EvolutionScreen.test.tsx`（新規）
  - 作業: シナジータグ表示、進化カード選択
  - 完了条件: シナジー表示を含む描画テストがパスすること

- [ ] **EventScreen テスト**
  - 対象: `__tests__/EventScreen.test.tsx`（新規）
  - 作業: イベント名・説明表示、選択肢ボタン、リスクレベル色
  - 完了条件: イベント画面の描画テストがパスすること

---

### 6-3. バランステスト

- [ ] **全難易度クリア可能性検証**
  - 対象: 手動テスト
  - 作業: 4難易度 × 3文明パターンの各組み合わせでクリア可能であることを確認
  - 完了条件: 全12パターンでクリア到達が確認できること

- [ ] **シナジーバランスチェック**
  - 対象: 手動テスト
  - 作業: 極端なシナジー組み合わせ（火×3 + 狩り×3等）でバランスが崩壊しないことを確認
  - 完了条件: シナジーが強力すぎず、弱すぎないこと

---

### 6-4. モバイル動作確認

- [ ] **iOS Safari 確認**
  - 対象: 手動テスト
  - 作業: ゲーム全フローの動作確認。タッチ操作、スキルボタン、イベント選択
  - 完了条件: 正常に動作すること

- [ ] **Android Chrome 確認**
  - 対象: 手動テスト
  - 作業: ゲーム全フローの動作確認。AudioContext の初期化、BGM/SFX再生
  - 完了条件: 正常に動作すること

- [ ] **最終ビルド確認**
  - 対象: 全ファイル
  - 作業: `npm run build` でエラーがないこと。`npm test` で全テストパス
  - 完了条件: ビルド成功 + 全テストパス（目標: 80テスト以上）

---

## Phase 7: ドキュメント更新（Documentation）

各 Phase 実装と並行して段階的に更新し、全 Phase 完了後に総点検する。

### 7-1. Feature README 更新

- [ ] **ファイル構成セクションの更新**
  - 対象: `src/features/primal-path/README.md`
  - 作業: `components/` セクションに新規4ファイル（EventScreen.tsx, StatsScreen.tsx, AchievementScreen.tsx, ChallengeScreen.tsx）を追加。`__tests__/` セクションに新規テストファイル（synergy.test.ts, events.test.ts, achievements.test.ts, active-skills.test.ts）を追加
  - 完了条件: ファイル構成が実際のディレクトリ内容と一致すること
  - 依存: Phase 4 完了後（全コンポーネントが確定）

- [ ] **ゲームシステムセクションの更新**
  - 対象: `src/features/primal-path/README.md`
  - 作業: 以下の新要素を追加記載
    - 進化カード数: 24種 → 30種
    - シナジーシステム: 8タグ × Tier1/Tier2 ボーナス
    - アクティブスキル: 4種（文明レベル3以上で解放）
    - ランダムイベント: 8種（バトル後20%確率）
    - 実績: 15個のマイルストーン
    - チャレンジモード: 3種の特殊ルール
    - ラン統計: プレイ履歴の記録と閲覧
  - 完了条件: ゲームシステムの説明が最新の実装内容と一致すること
  - 依存: Phase 4 完了後

- [ ] **操作方法セクションの更新**
  - 対象: `src/features/primal-path/README.md`
  - 作業: スキルボタン操作、一時停止ボタンの説明を追加
  - 完了条件: プレイヤーが参照して全操作を理解できること
  - 依存: Phase 1 完了後

- [ ] **使用技術セクションの更新**
  - 対象: `src/features/primal-path/README.md`
  - 作業: BGM システム追加時はその旨を記載。テスト数を更新
  - 完了条件: 使用技術とテスト数が実態と一致すること
  - 依存: Phase 6 完了後

---

### 7-2. ルート README 更新

- [ ] **ゲーム一覧テーブルの更新**
  - 対象: `README.md`（プロジェクトルート）
  - 作業: 原始進化録の説明文を「自動戦闘ローグライト」から、シナジー・イベント・実績等の新要素を含む説明に更新
  - 完了条件: ゲーム一覧テーブルの説明が新機能を反映していること
  - 依存: 全 Phase 完了後

- [ ] **テスト数の更新**
  - 対象: `README.md`（プロジェクトルート）
  - 作業: テスト数に関する記述がある場合、最新のテスト数（目標80+）に更新
  - 完了条件: テスト数が `npm test` の実行結果と一致すること
  - 依存: Phase 6 完了後

---

### 7-3. GameListPage 説明文更新

- [ ] **ゲーム説明文の更新**
  - 対象: `src/pages/GameListPage.tsx`
  - 作業: `<GameDescription>` 内の原始進化録の説明文を更新。シナジービルド、ランダムイベント、実績・チャレンジ等の新要素を反映
  - 完了条件: ゲーム選択画面の説明から新機能の魅力が伝わること
  - 依存: 全 Phase 完了後

---

### 7-4. コード内 JSDoc / コメント整備

以下は各 Phase の実装と同時に行う（Phase ごとの完了条件に含む）。

- [ ] **Phase 1 の JSDoc 整備**
  - 対象: `sprites.ts`（drawDamagePopup, drawEnemyHpBar）、`game-logic.ts`（updatePopups, applyActiveSkill）
  - 作業: 新規 export 関数に `@param`, `@returns` を含む日本語 JSDoc を付与
  - 完了条件: 全新規 export 関数に JSDoc があること

- [ ] **Phase 2 の JSDoc 整備**
  - 対象: `game-logic.ts`（calcSynergies, applySynergyBonuses）、`constants.ts`（SYNERGY_BONUSES, EVOLUTION_TAGS）
  - 作業: シナジー関連の新規関数・定数に日本語 JSDoc / コメントを付与
  - 完了条件: シナジーシステムのコードが JSDoc で自己説明的であること

- [ ] **Phase 3 の JSDoc 整備**
  - 対象: `game-logic.ts`（rollEvent, applyEventChoice）、`constants.ts`（RANDOM_EVENTS）
  - 作業: イベント関連の新規関数・定数に日本語 JSDoc / コメントを付与
  - 完了条件: イベントシステムのコードが JSDoc で自己説明的であること

- [ ] **Phase 4 の JSDoc 整備**
  - 対象: `game-logic.ts`（calcRunStats, checkAchievement）、`storage.ts`（saveRunStats 等）、`constants.ts`（ACHIEVEMENTS, CHALLENGES）
  - 作業: メタ進行関連の新規関数・定数に日本語 JSDoc / コメントを付与
  - 完了条件: 統計・実績・チャレンジのコードが JSDoc で自己説明的であること

- [ ] **Phase 5 の JSDoc 整備**
  - 対象: `audio.ts`（BGM 関連関数）、`sprites.ts`（覚醒スプライト関連）
  - 作業: ビジュアル・サウンド関連の新規関数に日本語 JSDoc を付与
  - 完了条件: 全新規 export 関数に JSDoc があること

---

### 7-5. 計画ドキュメント最終更新

- [ ] **plan.md の最終更新**
  - 対象: `.docs/pp-20260227-01/plan.md`
  - 作業: 実装中に除外した機能、追加した機能、変更した設計判断を正確に記録。除外理由も併記
  - 完了条件: plan.md が最終実装と整合していること
  - 依存: 全 Phase 完了後

- [ ] **spec.md の最終更新**
  - 対象: `.docs/pp-20260227-01/spec.md`
  - 作業: 型定義・定数・ロジック仕様で実装と乖離した箇所を修正。実装時に変更した設計判断を反映
  - 完了条件: spec.md の型定義・関数シグネチャが実際のコードと一致すること
  - 依存: 全 Phase 完了後

- [ ] **tasks.md の最終更新**
  - 対象: `.docs/pp-20260227-01/tasks.md`
  - 作業: 全タスクの完了状態を更新。追加タスク・除外タスクを反映。最終的なテスト数を記載
  - 完了条件: tasks.md のチェックリストが実際の作業結果と一致すること
  - 依存: 全 Phase 完了後

---

### 7-6. 遊び方テキスト更新

- [ ] **HowToPlayScreen の更新**
  - 対象: `components/HowToPlayScreen.tsx`
  - 作業: ゲーム内「遊び方」画面に以下の説明を追加:
    - アクティブスキル: 文明レベル3以上で解放、バトル中にボタンで発動
    - シナジー: 同タグの進化を集めるとボーナスが発動
    - ランダムイベント: バトル後にランダムで発生する選択式イベント
    - 実績・チャレンジ: タイトル画面から閲覧・挑戦可能
  - 完了条件: 初見プレイヤーが新機能を理解できる説明になっていること
  - 依存: Phase 3 完了後（シナジー・イベント・スキルの仕様が確定）

- [ ] **Phase 7 最終確認**
  - 対象: 全ドキュメント
  - 作業: 以下のドキュメントを通読し、コードとの整合性を最終チェック
    - `src/features/primal-path/README.md`
    - `README.md`（ルート）
    - `src/pages/GameListPage.tsx`（説明文）
    - `components/HowToPlayScreen.tsx`
    - `.docs/pp-20260227-01/plan.md`
    - `.docs/pp-20260227-01/spec.md`
    - `.docs/pp-20260227-01/tasks.md`
  - 完了条件: 全ドキュメントが実装内容と一致し、矛盾・古い記述がないこと
  - 依存: Phase 7 全タスク完了後

---

## タスクサマリー

| Phase | タスク数 | 新規テスト（推定） |
|-------|---------|------------------|
| Phase 1: 戦闘体験 | 21 | ~15テスト |
| Phase 2: シナジー | 12 | ~12テスト |
| Phase 3: イベント | 11 | ~10テスト |
| Phase 4: メタ進行 | 18 | ~20テスト |
| Phase 5: ビジュアル | 9 | ~3テスト |
| Phase 6: テスト/QA | 10 | 上記に含む |
| Phase 7: ドキュメント | 16 | — |
| **合計** | **97** | **~60テスト** |

既存49テスト + 新規~60テスト = **合計~109テスト**（目標80以上を大幅超過）

### ドキュメント更新タイミング

| 更新対象 | タイミング |
|---------|----------|
| JSDoc / コメント（7-4） | 各 Phase 実装と**同時** |
| HowToPlayScreen（7-6） | Phase 3 完了後 |
| Feature README（7-1） | 全 Phase 完了後 |
| ルート README（7-2） | 全 Phase 完了後 |
| GameListPage（7-3） | 全 Phase 完了後 |
| 計画ドキュメント（7-5） | 全 Phase 完了後（最終） |
| 最終確認（7-7） | 全ドキュメント更新後 |
