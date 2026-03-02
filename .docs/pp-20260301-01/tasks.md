# 原始進化録 フィードバック対応 — タスクチェックリスト

各タスクは `plan.md` の修正項目、`spec.md` の仕様に基づく。
フェーズ単位でコミット・テスト可能。

---

## フェーズ1: バグ修正 + 小規模UI改善

### FB#9: maxEvo ガード

- [x] `hooks.ts`: `GameAction` に `SKIP_EVO` アクションを追加
- [x] `hooks.ts`: `SELECT_EVO` 先頭に `maxEvo` ガードを追加（上限到達時はバトルへ直行）
- [x] `hooks.ts`: `SKIP_EVO` case を追加（`startBattle` → `phase: 'battle'`）
- [x] `components/EvolutionScreen.tsx`: maxEvo 到達時の UI 分岐（メッセージ + スキップボタン）
- [x] `__tests__/reducer.test.ts`: maxEvo ガード・SKIP_EVO のテスト追加（5テスト）

### FB#1: チャレンジ難易度選択

- [x] `components/ChallengeScreen.tsx`: Props に `save: SaveData` を追加
- [x] `components/ChallengeScreen.tsx`: 内部 state `selectedChallenge` を追加（2段階フロー）
- [x] `components/ChallengeScreen.tsx`: 難易度選択 UI を実装（DIFFS 一覧、解放判定）
- [x] `PrimalPathGame.tsx`: ChallengeScreen に `save={state.save}` prop を渡す

### FB#2: 最終ボス戦カウントダウン

- [x] `components/PreFinalScreen.tsx`: カウントダウン state + useEffect を追加（3秒）
- [x] `components/PreFinalScreen.tsx`: カウントダウン表示 + 手動ボタン併設
- [x] `components/PreFinalScreen.tsx`: 二重dispatch防止（firedRef）+ カウントダウン0未満防止
- [x] `hooks.ts`: useBattle 依存配列に `_fPhase` 追加（Phase 2 自動開始バグ修正）

### FB#5: 骨コスト調整

- [x] `constants.ts`: `bone_merchant` イベント: 骨30→10 / ATK+8→ATK+4
- [x] `constants.ts`: `bone_merchant` イベント: 骨50→25 / ATK+18→ATK+10
- [x] `constants.ts`: ラベル・description テキスト更新
- [x] `__tests__/reducer.test.ts`: コスト・報酬・ラベルのテスト追加（5テスト）

### FB#6: ログ表示拡大

- [x] `styles.ts`: LogContainer `max-height: 100px` → `160px`
- [x] `components/BattleScreen.tsx`: `run.log.slice(-28)` → `run.log.slice(-40)`

### FB#7: ゆっくり速度

- [x] `constants.ts`: SPEED_OPTS 先頭に `['×0.5', 1500]` を追加
- [x] `__tests__/reducer.test.ts`: 速度オプションのテスト追加（2テスト）

### P1 検証

- [x] `npm test` 全テストパス（167スイート / 2279テスト）
- [x] `npx tsc --noEmit` 型エラーなし（tone ライブラリの既存エラーのみ）
- [x] `npm run build` ビルド成功
- [x] ブラウザ確認: チャレンジ難易度選択動作
- [x] ブラウザ確認: maxEvo 制限動作（原始回帰チャレンジ）
- [x] ブラウザ確認: ログ表示拡大
- [x] ブラウザ確認: ×0.5 速度動作
- [x] ブラウザ確認: カウントダウン自動開始

---

## フェーズ2: ステージ化 + ボス連戦

### FB#12: ステージ選択UIリフレーミング

- [x] `components/DifficultyScreen.tsx`: タイトル「難易度選択」→「ステージ選択」に変更
- [x] `components/DifficultyScreen.tsx`: 各ステージにテーマ説明テキストを追加表示

### FB#13: 最終ボス連戦（通常ボス連戦から移設）

#### 型・定数

- [x] `types.ts`: `Difficulty` 型に `bb: number` を追加
- [x] `types.ts`: `RunState` から `bossWave` を削除（通常ボス連戦撤去）
- [x] `constants.ts`: DIFFS の各難易度に `bb` 値を追加（1/2/3/5）
- [x] `constants.ts`: `BOSS_CHAIN_SCALE` 定数を追加（`[1.0, 1.15, 1.3, 1.45, 1.6]`）
- [x] `constants.ts`: 新ボス2体追加（`fa`: 天空の裁定者, `fx`: 混沌の始祖龍）
- [x] `constants.ts`: `FINAL_BOSS_ORDER` テーブルを追加（連戦で異なるボス出現順）

#### ロジック

- [x] `game-logic.ts`: `afterBattle` をシンプル化（ボス撃破 → 即バイオームクリア、連戦なし）
- [x] `game-logic.ts`: `handleFinalBossKill` を連戦対応に書き換え（`_fPhase < dd.bb` で継続判定）
- [x] `hooks.ts`: `AFTER_BATTLE` から `bossChainContinue` 分岐を削除
- [x] `hooks.ts`: `FINAL_BOSS_KILLED` で連戦ログ追加

#### UI

- [x] `components/BattleScreen.tsx`: 最終決戦フェーズカウンター表示（"⚡ 最終決戦 2/5"）
- [x] `components/DifficultyScreen.tsx`: 「最終ボスN連戦」表示に変更
- [x] `components/GameOverScreen.tsx`: `$center` 除去（上部切れ修正）

#### テスト

- [x] `__tests__/test-helpers.ts`: `makeRun` から `bossWave` を削除
- [x] `__tests__/game-logic.test.ts`: 旧ボス連戦テスト削除 + 最終ボス連戦テスト追加
- [x] `__tests__/reducer.test.ts`: 旧テスト削除 + 最終ボス連戦テスト追加

### P2 検証

- [x] `npm test` 全テストパス（167スイート / 2305テスト）
- [x] `npx tsc --noEmit` 型エラーなし（tone ライブラリの既存エラーのみ）
- [x] `npm run build` ビルド成功
- [x] ブラウザ確認: ステージ選択UI表示（Playwright で自動検証済み）
- [x] ブラウザ確認: 最終ボス連戦（bb に基づく連戦、異なるボス出現）

---

## フェーズ3: 周回 + エンドレス + ログ見返し

### FB#11: 周回システム

#### 型・定数

- [x] `types.ts`: `SaveData` に `loopCount: number` を追加
- [x] `types.ts`: `RunState` に `loopCount: number` を追加
- [x] `constants.ts`: `FRESH_SAVE` に `loopCount: 0` を追加
- [x] `constants.ts`: `LOOP_SCALE_FACTOR = 0.5` 定数を追加

#### ロジック

- [x] `game-logic.ts`: `startRunState` で `loopScale` を計算し、`dd.hm`/`dd.am` に乗算
- [x] `hooks.ts`: ゲームクリア時（di===3）に `save.loopCount++` を実行

#### マイグレーション

- [x] `storage.ts`: `Storage.load()` で `loopCount` 欠損時にデフォルト0を付与

#### UI

- [x] `components/DifficultyScreen.tsx`: 周回ラベル表示（「2周目」等）

### FB#4: エンドレスチャレンジ

#### 型・定数

- [x] `types.ts`: `ChallengeModifier` に `{ type: 'endless' }` を追加
- [x] `types.ts`: `RunState` に `isEndless: boolean`, `endlessWave: number` を追加
- [x] `types.ts`: `RunStats` に `endlessWave: number | undefined` を追加
- [x] `constants.ts`: CHALLENGES に「無限の試練」を追加

#### ロジック

- [x] `game-logic.ts`: `applyChallenge` に `case 'endless'` を追加
- [x] `game-logic.ts`: `startRunState` に `isEndless: false`, `endlessWave: 0` 初期値を追加
- [x] `game-logic.ts`: `applyEndlessLoop` 関数を追加（deepCloneRun 使用、安全なリループ処理）
- [x] `hooks.ts`: `transitionAfterBiome` でエンドレス分岐を追加（bc>=3 時にリループ）

#### UI

- [x] `components/GameOverScreen.tsx`: エンドレス結果表示（到達ウェーブ、撃破数）

### FB#8: 戦闘ログ見返し

- [x] `styles.ts`: `LogReviewContainer` スタイルを追加
- [x] `components/GameOverScreen.tsx`: 折りたたみ式ログパネルを追加（isLogOpen state）
- [x] `components/GameOverScreen.tsx`: 「戦闘ログを見る」ボタンで展開/折りたたみ

### P3 検証

- [x] `npm test` 全テストパス（167スイート / 2321テスト）
- [x] `npx tsc --noEmit` 型エラーなし（tone ライブラリの既存エラーのみ）
- [x] `npm run build` ビルド成功
- [x] ブラウザ確認: 周回ラベル表示（DifficultyScreen）
- [x] ブラウザ確認: 周回倍率が敵に適用される
- [x] ブラウザ確認: エンドレスモード（3バイオーム後にループ）
- [x] ブラウザ確認: ゲームオーバー画面のログパネル

---

## フェーズ4: あそびかた進化図鑑 + ツリーUI改善

### FB#10: あそびかた進化図鑑

- [ ] `styles.ts`: `TabBtn` スタイルを追加（選択中/非選択の差異）
- [ ] `components/HowToPlayScreen.tsx`: タブ切替式に拡張（activeTab state）
- [ ] `components/HowToPlayScreen.tsx`: 進化図鑑タブ実装（EVOS 一覧 + カテゴリフィルタ）
- [ ] `components/HowToPlayScreen.tsx`: シナジータブ実装（SYNERGY_BONUSES 一覧）

### FB#3: ツリー効果の透明性改善

- [ ] `components/BattleScreen.tsx`: ツリーボーナスサマリーを小さく表示（TB_SUMMARY 使用）
- [ ] `components/TreeScreen.tsx`: 取得済みノードの累積効果サマリーを改善

### P4 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザ確認: あそびかたタブ切替動作
- [ ] ブラウザ確認: 進化図鑑フィルタ動作
- [ ] ブラウザ確認: シナジー一覧表示
- [ ] ブラウザ確認: バトル画面ツリーサマリー
- [ ] ブラウザ確認: ツリー画面累積効果サマリー

---

## 最終レビューチェック

- [ ] 全13件の FB がカバーされている
- [ ] 新規 `any` 型の使用がない
- [ ] Conventional Commits 準拠でコミットされている
- [ ] セーブデータの後方互換性が保たれている（マイグレーション対応）
- [ ] 既存テストが全てパスする
