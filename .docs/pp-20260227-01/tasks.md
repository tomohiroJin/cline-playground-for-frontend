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

- [x] **FB-4: 血の契約（HP半減）の結合テスト追加・検証**
  - 対象: `__tests__/game-logic.test.ts`
  - 作業: `applyEvo` → `applyStatFx` の結合テスト8件追加（定数検証、HP半減+aM複合、イミュータブル確認、ダメージ状態、aM累積、simEvoプレビュー2件、applyStatFx順序検証）
  - 完了: 血の契約の効果が正しく動作し、テストで保証されていることを確認。バグなし

- [x] **FB-1: 速度切り替えを常時利用可能に**
  - 対象: `hooks.ts`
  - 作業: `START_RUN` で `battleSpd` をリセットしないように変更。`CHANGE_SPEED` は元々 phase 非依存だった
  - 完了: セッション中のラン間で速度設定が保持されるようになった

- [x] **FB-2: スキルボタンの拡大・利用可能アピール**
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: `SkillBtn` サイズ拡大（font 10→13px, padding 3px→6px, min-width 70→90px）、スキルバーをログ下部に移動、利用可能時 `skillPulse` アニメーション追加（CD中は停止）
  - 完了: スキルボタンが画面下部に目立つサイズで表示され、利用可能時にパルスアニメーションで視覚的にアピール

- [x] **FB-6: 遊び方にスキル・スピード切り替え説明を追加**
  - 対象: `components/HowToPlayScreen.tsx`
  - 作業: 「アクティブスキル」セクション（4スキル解説）と「戦闘速度」セクションを追加
  - 完了: 初見プレイヤーがスキルと速度切り替えの存在を理解できる説明を追加

---

### 1-7. Phase 1 フィードバック対応 Round 2 ✅

Round 1 対応後の再テストで未修正・不十分と判明した3項目。
詳細は `feedback-phase1-r2.md` を参照。

- [x] **FB-R2-1: 血の契約（HP半減）がまだ動作していない** 🔴
  - 対象: `hooks.ts`, `components/BattleScreen.tsx`
  - 作業: ロジックは正常動作（`applyStatFx` → `startBattle` でHP半減が維持される）。問題は視覚フィードバックの欠如：`startBattle()` で `log = []` クリアされるため効果が見えず、HPバーも比率表示で100%のまま。修正：①`SELECT_EVO`/`PROCEED_TO_BATTLE` でバトルログに効果メッセージ追加、②プレイヤーHPバーに `showPct` 追加。結合テスト4件追加
  - 完了: ロジックバグなし。視覚フィードバック改善で体感上の問題を解消

- [x] **FB-R2-2: 速度切り替えを進化選択画面にも表示** 🔴
  - 対象: `components/shared.tsx`, `components/EvolutionScreen.tsx`, `components/BattleScreen.tsx`, `PrimalPathGame.tsx`
  - 作業: `SpeedControl` 共有コンポーネントを `shared.tsx` に新規作成（Fragment ベースで速度ボタン群をレンダリング）。EvolutionScreen に `battleSpd` prop 追加 + SpeedBar 配置。BattleScreen のインライン速度ボタンも `SpeedControl` に統一
  - 完了: 進化選択画面とバトル画面の両方で速度切り替えが利用可能に

- [x] **FB-R2-3: スキルボタンを固定位置に配置** 🔴
  - 対象: `styles.ts`, `components/BattleScreen.tsx`
  - 作業: BattleScreen を `Screen($noScroll)` → `BattleScrollArea`（上部スクロール領域）+ `BattleFixedBottom`（下部固定SkillBar）に分離。`BattleScrollArea`（flex:1, overflow-y:auto）と `BattleFixedBottom`（flex-shrink:0）で Flexbox レイアウト実現。`SkillBtn` を min-height:44px、font-size:14px、padding:10px に拡大してタッチターゲット確保
  - 完了: スキルバーが画面下部に固定配置され、戦闘中にスクロールしても位置が変わらない

---

## Phase 2: 進化シナジーシステム（Evolution Synergy） ✅

### 2-1. シナジータグシステム ✅

- [x] **シナジー型定義の追加**
  - 対象: `types.ts`
  - 作業: `SynergyTag`, `SynergyBonusDef`, `SynergyEffect`, `ActiveSynergy` 型を定義。`SfxType` に 'synergy' 追加
  - 完了: 型定義追加済み。`ActiveSynergy.tier` を `1 | 2` に限定（未発動の 0 は不要）。`SynergyEffect.special.id` をリテラル型に型安全化

- [x] **Evolution 型の拡張**
  - 対象: `types.ts`
  - 作業: `Evolution` インターフェースに `tags?: readonly SynergyTag[]` を追加
  - 完了: 既存互換性を維持しつつ readonly タグ配列で拡張

- [x] **既存進化へのタグ割り当て**
  - 対象: `constants.ts`
  - 作業: 既存24種の進化それぞれに1〜2個のシナジータグを付与
  - 完了: 8タグ（fire/ice/regen/shield/hunt/spirit/tribe/wild）をバランスよく分配

- [x] **calcSynergies 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: 取得済み進化のタグを集計し、発動中シナジーを返す純粋関数
  - 完了: 同タグ2個→Tier1、3個以上→Tier2 を判定。10テストでカバー

---

### 2-2. シナジーボーナス定義 ✅

- [x] **シナジーボーナス定数の定義**
  - 対象: `constants.ts`
  - 作業: `SYNERGY_BONUSES` 配列（8タグ × Tier1/Tier2）、`SYNERGY_TAG_INFO` 表示情報を定義
  - 完了: Object.freeze で不変定数として定義。compound 効果で Tier2 の複合ボーナスに対応

- [x] **applySynergyBonuses 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: シナジーボーナスをステータスに反映する関数。SynergyBonusResult 型で返却
  - 完了: ATK/DEF/HP/CR/burnMul/healBonusRatio/allyAtkBonus/allyHpBonus を集計

- [x] **tick() へのシナジー効果反映**
  - 対象: `game-logic.ts`
  - 作業: RunState に `evs: Evolution[]` 追加。tick() でシナジー計算し各フェーズに反映
  - 完了: tickPlayerPhase(ATK+CR+burnMul), tickAllyPhase(allyAtk), tickRegenPhase(healBonus), tickEnemyPhase(DEF) にボーナス適用

- [x] **シナジーのユニットテスト**
  - 対象: `__tests__/synergy.test.ts`（新規）
  - 作業: calcSynergies(11テスト), applySynergyBonuses(10テスト), tick統合(7テスト) の計28テスト
  - 完了: 全28テストパス。TDD Red-Green-Refactor サイクルで実装

---

### 2-3. シナジー表示UI ✅

- [x] **進化選択画面のシナジー表示**
  - 対象: `components/EvolutionScreen.tsx`, `components/shared.tsx`
  - 作業: 画面上部にシナジー状況（タグ×個数、ボーナス名）を表示。カードにタグアイコン+カウント表示
  - 完了: `SynergyBadges` 共通コンポーネント作成。カードにタグの現在数→取得後数を表示（発動閾値でハイライト）

- [x] **バトル画面のシナジーアイコン**
  - 対象: `components/BattleScreen.tsx`
  - 作業: プレイヤーパネルにシナジーアイコン+ボーナス名表示。ステータス行にATK/DEFボーナス値表示
  - 完了: `SynergyBadges` 共通コンポーネント利用。useMemo でシナジー計算を最適化

- [x] **シナジー発動SFXの追加**
  - 対象: `constants.ts`
  - 作業: `SFX_DEFS` に 'synergy' SFX 定義追加
  - 完了: 上昇音系のSFXパラメータで定義

---

### 2-4. 進化カード追加（6種） ✅

- [x] **新規進化6種の定数定義**
  - 対象: `constants.ts`
  - 作業: 霜の牙(ice/hunt), 野火の種(fire/wild), 根の盾(shield/regen), 祖霊の祝福(spirit/tribe), 血の熱狂(wild/hunt), 凍れる祈り(ice/spirit) をEVOS配列に統合
  - 完了: 全6種がデュアルタグ付きで追加。既存EvoEffect形式に変換（burn→フラグ、cr→小数）

- [x] **新規進化の効果実装**
  - 対象: `game-logic.ts`
  - 作業: 新規進化は既存の `applyStatFx` で処理可能（標準的な EvoEffect のみ使用）
  - 完了: テストで6種全てのタグ存在とデュアルタグを検証

- [x] **Phase 2 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全158スイート2028テストパス + `npm run build` 成功
  - 完了: 型チェック、全テスト、プロダクションビルド全て成功

### 2-5. Phase 2 コードレビュー・リファクタリング ✅

- [x] **コードレビュー実施**
  - 作業: Phase 2 全変更ファイルのレビュー（型安全性、パターン一貫性、エッジケース）
  - 完了: ActiveSynergy.tier 型修正(0削除)、SynergyEffect.special.id リテラル型化、SynergyBadges共通化、未使用import整理

---

## Phase 3: ランダムイベントシステム（Random Events） ✅

### 3-1. イベントエンジン ✅

- [x] **イベント型定義の追加**
  - 対象: `types.ts`
  - 作業: `EventId`, `EventChoice`, `EventEffect`, `RandomEventDef` 型を定義。`RunState` に `btlCount`, `eventCount` を追加
  - 完了: TDD Red-Green-Refactor サイクルで実装

- [x] **GamePhase に 'event' を追加**
  - 対象: `types.ts`
  - 作業: `GamePhase` ユニオン型に `'event'` を追加。`GameState` に `currentEvent` を追加。`SfxType` に `'event'` を追加
  - 完了: 型安全に event フェーズが使用可能

- [x] **rollEvent 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: バトル後のイベント発生判定（20%確率、バイオームアフィニティ2倍重み付け）。`dominantCiv` ヘルパー関数も追加
  - 完了: RNG 注入でテスタブル。btlCount < EVENT_MIN_BATTLES で序盤制約が機能

- [x] **applyEventChoice 関数の実装**
  - 対象: `game-logic.ts`
  - 作業: 全8種の効果タイプ（stat_change, heal, damage, bone_change, add_ally, random_evolution, civ_level_up, nothing）を純粋関数で実装
  - 完了: deepCloneRun でイミュータブル性を確保。eventCount をインクリメント

---

### 3-2. 基本イベント（8種） ✅

- [x] **イベント定数の定義**
  - 対象: `constants.ts`
  - 作業: `RANDOM_EVENTS` 配列（8種: bone_merchant, ancient_shrine, lost_ally, poison_swamp, mystery_fossil, beast_den, starry_night, cave_painting）を Object.freeze で定義
  - 完了: 各イベントにバイオームアフィニティ（poison_swamp→grassland, beast_den→volcano, cave_painting→glacier）を設定

- [x] **イベント発生確率/条件定数の定義**
  - 対象: `constants.ts`
  - 作業: `EVENT_CHANCE = 0.2`, `EVENT_MIN_BATTLES = 2` を定義
  - 完了: 適切な値で定義済み

---

### 3-3. イベントUI ✅

- [x] **EventScreen コンポーネントの作成**
  - 対象: `components/EventScreen.tsx`（新規）
  - 作業: イベント名、説明テキスト、選択肢ボタン（リスクレベル色分け: safe=緑, risky=黄, dangerous=赤）を表示。骨コスト表示+不足時 disabled
  - 完了: styled-components でコンポーネント内にスタイル定義。eventGlow アニメーション付き

- [x] **EventScreen スタイルの作成**
  - 対象: `components/EventScreen.tsx`（コンポーネント内に定義）
  - 作業: EventPanel, ChoiceBtn, CostTag 等のスタイルをコンポーネント内に定義（既存パターンに準拠）
  - 完了: ゲーム全体のダークテーマに統合

- [x] **PrimalPathGame に event フェーズを統合**
  - 対象: `PrimalPathGame.tsx`
  - 作業: `phase === 'event'` の分岐を追加し、`EventScreen` をレンダリング。選択時に 'event' SFX 再生
  - 完了: イベントフェーズが正しく表示・遷移

- [x] **gameReducer にイベント関連アクションを追加**
  - 対象: `hooks.ts`
  - 作業: `TRIGGER_EVENT`, `CHOOSE_EVENT` アクションを追加。`AFTER_BATTLE` で `rollEvent()` を呼び出し、イベント発生時は 'event' フェーズに遷移
  - 完了: バトル後→イベント→進化選択のフローが動作

- [x] **イベント発生SFXの追加**
  - 対象: `constants.ts`
  - 作業: `SFX_DEFS` に 'event' SFX 定義を追加
  - 完了: イベント発生時に効果音が鳴る

---

### 3-4. バイオーム固有イベント ✅

- [x] **バイオームアフィニティの確認と調整**
  - 対象: `constants.ts`
  - 作業: 各イベントの `biomeAffinity` を確認。草原=poison_swamp, 火山=beast_den, 氷河=cave_painting
  - 完了: 全バイオームに少なくとも1種の固有イベントが設定済み

- [x] **イベントのユニットテスト**
  - 対象: `__tests__/events.test.ts`（新規）
  - 作業: 定数検証(5), dominantCiv(4), rollEvent(5), applyEventChoice(18: stat_change×3, heal×2, damage×2, bone_change×1, civ_level_up×4, nothing×1, random_evolution×1, add_ally×2, イミュータブル×1, eventCount×1) の計32テスト
  - 完了: 全32テストパス。TDD Red-Green-Refactor サイクルで実装

- [x] **Phase 3 統合テスト**
  - 対象: 全ファイル
  - 作業: `npm test` 全2064テストパス（既存2032 + 新規32）+ `npx tsc --noEmit` 型チェック成功
  - 完了: 全テストパス、型エラーなし（node_modules/tone の既存エラーのみ）

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
