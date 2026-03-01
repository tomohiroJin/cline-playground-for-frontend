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
- [ ] ブラウザ確認: チャレンジ難易度選択動作
- [ ] ブラウザ確認: maxEvo 制限動作（原始回帰チャレンジ）
- [ ] ブラウザ確認: ログ表示拡大
- [ ] ブラウザ確認: ×0.5 速度動作
- [ ] ブラウザ確認: カウントダウン自動開始

---

## フェーズ2: ステージ化 + ボス連戦

### FB#12: ステージ選択UIリフレーミング

- [ ] `components/DifficultyScreen.tsx`: タイトル「難易度選択」→「ステージ選択」に変更
- [ ] `components/DifficultyScreen.tsx`: 各ステージにテーマ説明テキストを追加表示

### FB#13: ボス連戦

#### 型・定数

- [ ] `types.ts`: `Difficulty` 型に `bb: number` を追加
- [ ] `types.ts`: `RunState` に `bossWave: number` を追加
- [ ] `constants.ts`: DIFFS の各難易度に `bb` 値を追加（1/2/3/5）
- [ ] `constants.ts`: `BOSS_CHAIN_SCALE` 定数を追加（`[1.0, 1.15, 1.3, 1.45, 1.6]`）

#### ロジック

- [ ] `game-logic.ts`: `startRunState` に `bossWave: 0` 初期値を追加
- [ ] `game-logic.ts`: `afterBattle` の戻り値型に `bossChainContinue?: boolean` を追加
- [ ] `game-logic.ts`: `afterBattle` でボス撃破時の連戦ロジックを実装（bossWave++, HP20%回復, 次ボス生成）
- [ ] `hooks.ts`: `AFTER_BATTLE` で `bossChainContinue` 分岐を追加

#### UI

- [ ] `components/BattleScreen.tsx`: ボス連戦カウンター表示（"BOSS 2/3"）

#### テスト

- [ ] `__tests__/test-helpers.ts`: `makeRun` に `bossWave: 0` を追加
- [ ] `__tests__/game-logic.test.ts`: ボス連戦ロジックのテスト追加

### P2 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザ確認: ステージ選択UI表示
- [ ] ブラウザ確認: 氷河期ボス2連戦
- [ ] ブラウザ確認: 大災厄ボス3連戦
- [ ] ブラウザ確認: 神話世界ボス5連戦

---

## フェーズ3: 周回 + エンドレス + ログ見返し

### FB#11: 周回システム

#### 型・定数

- [ ] `types.ts`: `SaveData` に `loopCount: number` を追加
- [ ] `types.ts`: `RunState` に `loopCount: number` を追加
- [ ] `constants.ts`: `FRESH_SAVE` に `loopCount: 0` を追加
- [ ] `constants.ts`: `LOOP_SCALE_FACTOR = 0.5` 定数を追加

#### ロジック

- [ ] `game-logic.ts`: `startRunState` で `loopScale` を計算し、`dd.hm`/`dd.am` に乗算
- [ ] `hooks.ts`: ゲームクリア時（di===3）に `save.loopCount++` を実行

#### マイグレーション

- [ ] `storage.ts`: `Storage.load()` で `loopCount` 欠損時にデフォルト0を付与

#### UI

- [ ] `components/DifficultyScreen.tsx`: 周回ラベル表示（「2周目」等）

### FB#4: エンドレスチャレンジ

#### 型・定数

- [ ] `types.ts`: `ChallengeModifier` に `{ type: 'endless' }` を追加
- [ ] `types.ts`: `RunState` に `isEndless: boolean`, `endlessWave: number` を追加
- [ ] `types.ts`: `RunStats` に `endlessWave: number | undefined` を追加
- [ ] `constants.ts`: CHALLENGES に「無限の試練」を追加

#### ロジック

- [ ] `game-logic.ts`: `applyChallenge` に `case 'endless'` を追加
- [ ] `game-logic.ts`: `startRunState` に `isEndless: false`, `endlessWave: 0` 初期値を追加
- [ ] `hooks.ts`: `transitionAfterBiome` でエンドレス分岐を追加（bc>=3 時にリループ）

#### UI

- [ ] `components/GameOverScreen.tsx`: エンドレス結果表示（到達ウェーブ、撃破数）

### FB#8: 戦闘ログ見返し

- [ ] `styles.ts`: `LogReviewContainer` スタイルを追加
- [ ] `components/GameOverScreen.tsx`: 折りたたみ式ログパネルを追加（isLogOpen state）
- [ ] `components/GameOverScreen.tsx`: 「戦闘ログを見る」ボタンで展開/折りたたみ

### P3 検証

- [ ] `npm test` 全テストパス
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザ確認: 周回ラベル表示（DifficultyScreen）
- [ ] ブラウザ確認: 周回倍率が敵に適用される
- [ ] ブラウザ確認: エンドレスモード（3バイオーム後にループ）
- [ ] ブラウザ確認: ゲームオーバー画面のログパネル

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
