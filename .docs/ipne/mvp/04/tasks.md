# タスク一覧・進捗管理（IPNE MVP4）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------:|
| フェーズ0: 型定義・テスト準備 | 完了 | 3/3 |
| フェーズ1: タイマーシステム | 完了 | 2/2 |
| フェーズ2: 記録・リザルト | 完了 | 2/2 |
| フェーズ3: チュートリアル | 完了 | 2/2 |
| フェーズ4: フィードバック（SE/エフェクト） | 完了 | 2/2 |
| フェーズ5: エンディング分岐 | 完了 | 2/3 |
| フェーズ6: SPECIMEN価値付け | 完了 | 2/2 |
| フェーズ7: 生成安定化 | 完了 | 2/2 |
| フェーズ8: ヘルプ・操作説明UI | 完了 | 2/2 |
| フェーズ9: UI・演出統合 | 進行中 | 2/4 |
| フェーズ10: バランス調整・検証 | 進行中 | 2/4 |
| フェーズ11: UIフィードバック修正 | 完了 | 4/4 |
| **合計** | **84%** | **27/32** |

---

## フェーズ0: 型定義・テスト準備（TDD起点）

### Task 0.1: types.ts 拡張
**ファイル**: `src/features/ipne/types.ts`

- [x] タイマー関連型定義
  - [x] `GameTimer` インターフェース
  - [x] `TimerState` / `TimerStateValue`
- [x] 記録関連型定義
  - [x] `GameRecord` インターフェース
  - [x] `Rating` 定数 (`'s' | 'a' | 'b' | 'c' | 'd'`)
  - [x] `RatingValue` 型
  - [x] `BestRecords` インターフェース
- [x] チュートリアル関連型定義
  - [x] `TutorialStepType` 定数 (`'movement' | 'attack' | 'map' | 'item' | 'trap' | 'goal'`)
  - [x] `TutorialStepTypeValue` 型
  - [x] `TutorialStep` インターフェース
  - [x] `TutorialState` インターフェース
- [x] フィードバック関連型定義
  - [x] `FeedbackType` 定数 (`'damage' | 'heal' | 'level_up' | 'trap' | 'item_pickup'`)
  - [x] `FeedbackTypeValue` 型
  - [x] `FeedbackEffect` インターフェース
- [ ] GameState拡張（未実施：IpnePageで状態管理）
  - [ ] `timer: GameTimer` 追加
  - [ ] `tutorialState: TutorialState` 追加
  - [ ] `feedbackEffects: FeedbackEffect[]` 追加

### Task 0.2: テストユーティリティ更新
**ファイル**: `src/features/ipne/__tests__/testUtils.ts`

- [x] テストユーティリティファイル存在確認済み
- [ ] `createTestTimer()` - テスト用タイマー生成ヘルパー（各テストで直接createTimer使用）
- [ ] `createTestRecord()` - テスト用記録生成ヘルパー（各テストで直接createRecord使用）
- [ ] `createTestTutorialState()` - テスト用チュートリアル状態生成ヘルパー（各テストで直接initTutorial使用）

### Task 0.3: 既存テスト確認
- [x] `npm test` 実行で既存テストが通ることを確認
- [x] 型変更によるコンパイルエラーがないことを確認
- [x] `npx tsc --noEmit` でTypeScriptエラーがないことを確認

---

## フェーズ1: タイマーシステム

### Task 1.1: timer.ts 新規作成
**ファイル**: `src/features/ipne/timer.ts`

- [x] `createTimer()` 関数
  - [x] 初期状態のタイマー生成
- [x] `startTimer()` 関数
  - [x] 計測開始時刻の設定
- [x] `pauseTimer()` 関数
  - [x] 一時停止処理
- [x] `resumeTimer()` 関数
  - [x] 再開処理（一時停止時間の加算）
- [x] `stopTimer()` 関数
  - [x] 計測停止
- [x] `getElapsedTime()` 関数
  - [x] 経過時間計算（一時停止時間を除外）
- [x] `formatTime()` 関数
  - [x] mm:ss.mmm 形式にフォーマット
- [x] `formatTimeShort()` 関数（追加実装）
  - [x] mm:ss 形式にフォーマット（表示用）
- [x] `isTimerRunning()` / `isTimerPaused()` 関数（追加実装）

### Task 1.2: timer.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/timer.test.ts`

- [x] タイマー生成テスト
  - [x] 初期状態が正しい
- [x] 計測テスト
  - [x] 開始時刻が設定される
  - [x] 経過時間が正しく計算される
- [x] 一時停止テスト
  - [x] 一時停止中は時間が加算されない
  - [x] 再開後に正しく計測される
- [x] フォーマットテスト
  - [x] 0秒が正しくフォーマットされる
  - [x] 1分30秒500ミリ秒が正しくフォーマットされる
  - [x] 10分以上が正しくフォーマットされる

---

## フェーズ2: 記録・リザルト

### Task 2.1: record.ts 新規作成
**ファイル**: `src/features/ipne/record.ts`

- [x] `STORAGE_KEYS` 定数定義
  - [x] ベスト記録キー（職業別）
  - [x] チュートリアル完了キー
- [x] `createRecord()` 関数
  - [x] 記録オブジェクト生成
- [x] `saveRecord()` 関数
  - [x] localStorage への保存
  - [x] エラーハンドリング（失敗時は黙って無視）
- [x] `loadBestRecords()` 関数
  - [x] localStorage からの読み込み
  - [x] パースエラーハンドリング
- [x] `isBestRecord()` 関数
  - [x] タイム比較でベスト判定
- [x] `updateBestRecord()` 関数
  - [x] ベスト更新処理
- [x] `clearRecords()` 関数
  - [x] 全記録クリア
- [x] `getBestRecordForClass()` 関数（追加実装）
- [x] `getAllBestRecords()` 関数（追加実装）

### Task 2.2: record.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/record.test.ts`

- [x] 記録生成テスト
  - [x] 正しいプロパティで生成される
- [x] 保存/読み込みテスト
  - [x] 保存した記録が読み込める
  - [x] 存在しない場合はundefinedが返る
- [x] ベスト判定テスト
  - [x] タイムが短ければベスト
  - [x] タイムが長ければベストではない
  - [x] 初回は必ずベスト
- [x] エラーハンドリングテスト
  - [x] localStorage エラーでも例外が発生しない

---

## フェーズ3: チュートリアル

### Task 3.1: tutorial.ts 新規作成
**ファイル**: `src/features/ipne/tutorial.ts`

- [x] `TUTORIAL_STEPS` 定数定義
  - [x] 各ステップのテキストと完了条件（6ステップ）
- [x] `initTutorial()` 関数
  - [x] 初期状態生成
- [x] `isTutorialCompleted()` 関数
  - [x] localStorage からフラグ確認
- [x] `saveTutorialCompleted()` 関数
  - [x] 完了フラグ保存
- [x] `advanceTutorialStep()` 関数
  - [x] アクションに応じてステップ進行
- [x] `skipTutorial()` 関数
  - [x] スキップ処理
- [x] `getTutorialText()` 関数
  - [x] 現在ステップのテキスト取得
- [x] `toggleTutorialVisibility()` 関数（追加実装）
- [x] `getCurrentTutorialStep()` 関数（追加実装）
- [x] `shouldAdvanceTutorial()` 関数（追加実装）
- [x] `getTutorialProgress()` 関数（追加実装）

### Task 3.2: tutorial.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/tutorial.test.ts`

- [x] 初期化テスト
  - [x] 初期ステップが0である
  - [x] isVisibleが正しい
- [x] ステップ進行テスト
  - [x] advanceTutorialStepでステップが進む
  - [x] 最終ステップで完了になる
- [x] スキップテスト
  - [x] スキップで完了になる
  - [x] isVisibleがfalseになる
- [x] 完了フラグテスト
  - [x] 保存/読み込みが正しく動作する

---

## フェーズ4: フィードバック（SE/エフェクト）

### Task 4.1: feedback.ts 新規作成
**ファイル**: `src/features/ipne/feedback.ts`

- [x] `FEEDBACK_CONFIGS` 定数定義
  - [x] 各フィードバックタイプの設定（duration, color, flashDuration等）
- [x] `createFeedback()` 関数
  - [x] フィードバックエフェクト生成
- [x] `createDamageFeedback()` / `createHealFeedback()` / `createLevelUpFeedback()` / `createTrapFeedback()` / `createItemPickupFeedback()` 関数（追加実装）
- [x] `isFeedbackActive()` 関数
  - [x] 有効期間判定
- [x] `updateFeedbacks()` 関数
  - [x] 期限切れフィードバックの削除
- [x] `drawDamageFlash()` 関数
  - [x] 被弾フラッシュ描画
- [x] `drawTrapEffect()` 関数
  - [x] 罠発動エフェクト描画
- [x] `drawPopup()` 関数
  - [x] ポップアップ描画
- [x] `getFeedbackProgress()` 関数（追加実装）
- [x] `needsFlash()` 関数（追加実装）

### Task 4.2: feedback.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/feedback.test.ts`

- [x] フィードバック生成テスト
  - [x] 正しいタイプで生成される
  - [x] 開始時刻が設定される
- [x] 有効期間テスト
  - [x] 期間内はtrueを返す
  - [x] 期間外はfalseを返す
- [x] 更新テスト
  - [x] 期限切れが削除される
  - [x] 有効なものは残る

---

## フェーズ5: エンディング分岐

### Task 5.1: ending.ts 新規作成
**ファイル**: `src/features/ipne/ending.ts`

- [x] `RATING_THRESHOLDS` 定数定義
  - [x] S: 120000ms（2分）
  - [x] A: 180000ms（3分）
  - [x] B: 300000ms（5分）
  - [x] C: 480000ms（8分）
  - [x] D: それ以上
- [x] `EPILOGUE_TEXTS` 定数定義（ダークファンタジー調）
  - [x] S: 伝説の英雄
  - [x] A: 熟練の冒険者
  - [x] B: 確かな実力
  - [x] C: 生還者
  - [x] D: 生存の証
- [x] `GAME_OVER_TEXT` 定数定義
  - [x] 冒険の終わり
- [x] `calculateRating()` 関数
  - [x] タイムから5段階評価を計算
- [x] `getEpilogueText()` 関数
  - [x] 評価に応じた { title, text } を取得
- [x] `getGameOverText()` 関数
  - [x] ゲームオーバー用 { title, text } を取得
- [x] `getRatingColor()` 関数
  - [x] 評価に応じた色取得（S:金/A:銀/B:銅/C:青/D:灰）
- [x] `getEndingImage()` 関数（追加実装）
  - [x] 評価に応じたエンディング画像パス取得
- [x] `getGameOverImage()` 関数（追加実装）
  - [x] ゲームオーバー画像パス取得
- [x] `getEndingVideo()` 関数（追加実装）
  - [x] Sランク用エンディング動画パス取得

### Task 5.2: ending.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/ending.test.ts`

- [x] 評価計算テスト
  - [x] 1分（60000ms）でSが返る
  - [x] 2分30秒（150000ms）でAが返る
  - [x] 4分（240000ms）でBが返る
  - [x] 6分（360000ms）でCが返る
  - [x] 10分（600000ms）でDが返る
- [x] 境界値テスト
  - [x] 2分ちょうど（120000ms）でSが返る
  - [x] 2分1ミリ秒（120001ms）でAが返る
  - [x] 3分ちょうど（180000ms）でAが返る
  - [x] 3分1ミリ秒（180001ms）でBが返る
  - [x] 5分ちょうど（300000ms）でBが返る
  - [x] 5分1ミリ秒（300001ms）でCが返る
  - [x] 8分ちょうど（480000ms）でCが返る
  - [x] 8分1ミリ秒（480001ms）でDが返る
- [x] テキスト取得テスト
  - [x] 各評価で正しい { title, text } が返る
  - [x] ゲームオーバーで正しいテキストが返る
- [x] 色取得テスト
  - [x] S: #fbbf24（金色）
  - [x] A: #94a3b8（銀色）
  - [x] B: #b45309（銅色）
  - [x] C: #3b82f6（青色）
  - [x] D: #6b7280（灰色）

### Task 5.3: Sランク特別動画対応（将来実装準備）

> **注意**: MVP4では準備のみ。実際の動画実装はMVP5以降。

- [ ] `isSRankSpecialVideoEnabled()` 関数
  - [ ] Sランク特別動画表示フラグ判定
- [ ] 動画仕様ドキュメント
  - [ ] 迷宮崩壊シーンの演出仕様
  - [ ] 職業別ハイライト演出
  - [ ] BGM/エフェクト仕様

---

## フェーズ6: SPECIMEN価値付け

### Task 6.1: enemy.ts 拡張
**ファイル**: `src/features/ipne/enemy.ts`

- [x] `SPECIMEN_DROP_RATE` 定数定義（0.3）
- [x] `DROP_ITEM_WEIGHTS` 定数定義（追加実装）
- [x] `shouldDropItem()` 関数追加
  - [x] SPECIMEN撃破時にドロップ判定
- [x] `selectDropItemType()` 関数追加（追加実装）
- [x] `createDropItem()` 関数追加
  - [x] ドロップアイテム生成
- [x] `processEnemyDeath()` 関数拡張
  - [x] SPECIMEN撃破時にドロップ処理追加

### Task 6.2: enemy.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/enemy.test.ts`

- [x] ドロップ判定テスト
  - [x] SPECIMENのみドロップ判定が行われる
  - [x] 他の敵はドロップしない
- [x] 確率テスト（モック使用）
  - [x] 30%の確率でtrueが返る
- [x] ドロップアイテムテスト
  - [x] 回復アイテムが生成される
  - [x] 正しい位置に生成される

---

## フェーズ7: 生成安定化

### Task 7.1: mazeGenerator.ts 拡張
**ファイル**: `src/features/ipne/mazeGenerator.ts`

- [x] `SAFE_ZONE_RADIUS` 定数定義（3タイル）
- [x] `MAX_GENERATION_RETRIES` 定数定義（5回）
- [x] `DANGEROUS_ENEMIES` 定数定義（BOSS, CHARGE）
- [x] `DANGEROUS_TRAPS` 定数定義（DAMAGE）
- [x] `validateEnemyPlacement()` 関数追加
  - [x] スタート周辺の敵配置検証
- [x] `validateTrapPlacement()` 関数追加
  - [x] スタート周辺の罠配置検証
- [x] `validateGeneration()` 関数追加
  - [x] 敵・罠配置の総合検証
- [x] `isInSafeZone()` 関数追加
  - [x] 座標がスタート周辺か判定
- [x] `getPositionsOutsideSafeZone()` 関数追加（追加実装）
- [x] `generateSafeMaze()` 関数追加
  - [x] 検証付き生成（再試行あり）

### Task 7.2: mazeValidation.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/mazeValidation.test.ts`

- [x] セーフゾーン判定テスト
  - [x] 半径内の座標がtrueを返す
  - [x] 半径外の座標がfalseを返す
- [x] 敵配置検証テスト
  - [x] セーフゾーン内にボスがいると失敗
  - [x] セーフゾーン内にチャージがいると失敗
  - [x] セーフゾーン外なら成功
- [x] 罠配置検証テスト
  - [x] セーフゾーン内にダメージ罠があると失敗
  - [x] セーフゾーン外なら成功
- [x] 再生成テスト
  - [x] 検証失敗時に再生成される
  - [x] 上限回数で停止する

---

## フェーズ8: ヘルプ・操作説明UI

### Task 8.1: IpnePage.tsx 拡張（ヘルプ）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] ヘルプ表示状態の追加
- [x] ヘルプオーバーレイコンポーネント追加
  - [x] 操作説明（PC/モバイル）
  - [x] キーバインド一覧
- [x] Hキーでのトグル処理
- [x] ヘルプアイコンボタン追加

### Task 8.2: IpnePage.styles.ts 拡張
**ファイル**: `src/pages/IpnePage.styles.ts`

- [x] `HelpOverlay` スタイル追加
- [x] `HelpContainer` / `HelpTitle` / `HelpSection` スタイル追加
- [x] `HelpButton` / `HelpCloseButton` スタイル追加
- [x] `HelpKeyList` / `HelpKeyItem` / `HelpKey` / `HelpKeyDescription` スタイル追加

---

## フェーズ9: UI・演出統合

### Task 9.1: IpnePage.tsx 拡張（タイマー）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] タイマー状態の追加
- [x] ゲーム開始時のタイマー開始
- [ ] レベルアップ時のタイマー一時停止/再開（未確認）
- [x] クリア/ゲームオーバー時のタイマー停止
- [x] タイマー表示UI追加（`TimerDisplay`）

### Task 9.2: IpnePage.tsx 拡張（リザルト）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] リザルト画面コンポーネント拡張
  - [x] タイム表示
  - [x] 評価表示（S/A/B/C/D）+ 評価色
  - [x] エピローグタイトル表示
  - [x] エピローグテキスト表示（ダークファンタジー調）
  - [ ] レベル/撃破数/職業表示（部分的）
  - [ ] ベスト更新表示（未確認）
- [ ] ゲームオーバー画面コンポーネント拡張
  - [ ] ゲームオーバータイトル表示
  - [ ] ゲームオーバーテキスト表示
- [ ] 記録保存処理追加（未確認）
- [ ] ベスト判定処理追加（未確認）
- [ ] Sランク特別動画トリガー準備（将来用）

### Task 9.3: IpnePage.tsx 拡張（チュートリアル）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] チュートリアル状態の追加
- [ ] 初回判定処理
- [ ] チュートリアルUIコンポーネント追加
- [ ] ステップ進行処理
- [ ] スキップ処理

### Task 9.4: IpnePage.tsx 拡張（フィードバック）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] フィードバック状態の追加
- [ ] 被弾時のフィードバック生成
- [ ] 罠発動時のフィードバック生成
- [ ] レベルアップ時のフィードバック生成
- [ ] アイテム取得時のフィードバック生成
- [ ] フィードバック描画処理追加

---

## フェーズ10: バランス調整・検証

### Task 10.1: index.ts 更新
**ファイル**: `src/features/ipne/index.ts`

- [x] 新規モジュールのエクスポート追加
  - [x] timer.ts
  - [x] record.ts
  - [x] tutorial.ts
  - [x] feedback.ts
  - [x] ending.ts
- [x] 新規型のエクスポート追加
  - [x] GameTimer, TimerState, TimerStateValue
  - [x] GameRecord, Rating, RatingValue, BestRecords
  - [x] TutorialStep, TutorialStepType, TutorialStepTypeValue, TutorialState
  - [x] FeedbackType, FeedbackTypeValue, FeedbackEffect
- [x] 敵ドロップ関連エクスポート追加
  - [x] SPECIMEN_DROP_RATE, DROP_ITEM_WEIGHTS
  - [x] shouldDropItem, selectDropItemType, createDropItem, processEnemyDeath
- [x] 迷路生成安定化関連エクスポート追加
  - [x] SAFE_ZONE_RADIUS, MAX_GENERATION_RETRIES, DANGEROUS_ENEMIES, DANGEROUS_TRAPS
  - [x] isInSafeZone, validateEnemyPlacement, validateTrapPlacement, validateGeneration
  - [x] getPositionsOutsideSafeZone, generateSafeMaze

### Task 10.2: パラメータ調整
- [x] 評価閾値の設定（S:2分, A:3分, B:5分, C:8分）
- [x] フィードバック時間の設定（DAMAGE:500ms, HEAL:800ms, LEVEL_UP:1200ms等）
- [x] チュートリアルステップの設定（6ステップ）
- [x] ドロップ確率の設定（30%）

### Task 10.3: プレイテスト検証（手動）

> **MVP4の本質：「ゲームをプレイし続けられる完成形に寄せる」**

- [ ] プレイ時間計測（目標：5〜10分）
- [ ] 以下の評価観点をチェック
  - [ ] 初見でルールが理解できたか
  - [ ] リトライ動機が生まれたか
  - [ ] 極端な事故が減ったか
  - [ ] 演出が気持ちよさに寄与したか
  - [ ] クラッシュ/ハマりがなかったか
- [ ] NG例の確認
  - [ ] チュートリアルが邪魔 → 簡潔化/スキップ強調
  - [ ] タイムを気にしない → 評価表示の強調
  - [ ] 初手理不尽が残る → 検証条件の追加

### Task 10.4: テスト・検証
- [x] 全テスト実行 `npm test`
- [x] TypeScriptコンパイル確認 `npx tsc --noEmit`
- [ ] 手動動作確認
  - [x] タイマーが計測される
  - [ ] 記録が保存される（未確認）
  - [x] 評価が正しく5段階表示される（S/A/B/C/D）
  - [x] 各評価で正しい色が表示される
  - [x] 各評価で正しいエピローグが表示される（タイトル＋テキスト）
  - [ ] ゲームオーバー時に専用テキストが表示される（未確認）
  - [ ] チュートリアルが表示される（UI未統合）
  - [ ] フィードバックが表示される（UI未統合）
  - [ ] SPECIMENがドロップする（UI未統合）
  - [ ] 初手理不尽が発生しない（未確認）
  - [x] ヘルプが表示される
  - [ ] Sランク達成時に特別演出のトリガーが可能（将来用）

---

## 依存関係図

```
フェーズ0（型定義）✅
    ↓
    ├── フェーズ1（タイマー）✅ ─────────┐
    │                                   │
    ├── フェーズ3（チュートリアル）✅ ──┤
    │                                   │
    ├── フェーズ4（フィードバック）✅ ──┤
    │                                   │
    ├── フェーズ6（SPECIMEN）✅ ────────┤
    │                                   │
    ├── フェーズ7（生成安定化）✅ ──────┤
    │                                   │
    ├── フェーズ8（ヘルプUI）✅ ────────┤
    │                                   ↓
    │                           フェーズ2（記録）✅
    │                                   │
    │                                   ↓
    │                           フェーズ5（エンディング）✅
    │                                   │
    └───────────────────────────────────┴──→ フェーズ9（UI・演出統合）🔄
                                                ↓
                                          フェーズ10（バランス・検証）🔄
```

✅ = 完了
🔄 = 進行中

- フェーズ0〜8: **完了**（ロジック・テスト実装済み）
- フェーズ9: **進行中**（タイマー/ヘルプUI統合済み、チュートリアル/フィードバックUI未統合）
- フェーズ10: **進行中**（index.ts更新完了、手動検証は一部未実施）

---

## 残タスク一覧

### 未完了タスク（UI統合系）

| タスク | 内容 | 優先度 |
|--------|------|--------|
| Task 9.3 | チュートリアルUI統合 | 高 |
| Task 9.4 | フィードバックUI統合 | 高 |
| Task 9.2 | リザルト画面拡張（記録保存、ベスト表示） | 中 |
| Task 10.3 | プレイテスト検証 | 低 |

### 将来実装（MVP5以降）

| タスク | 内容 |
|--------|------|
| Task 5.3 | Sランク特別動画対応 |

---

## フェーズ11: UIフィードバック修正

### Task 11.1: プロローグ自動遷移
- [x] 最後のテキスト後に3秒待って自動遷移

### Task 11.2: Sランク動画表示改善
- [x] 「特別動画を見る」ボタン追加
- [x] 動画終了後に画像に戻る

### Task 11.3: レスポンシブUI修正
- [x] ヘルプ/マップボタン間隔調整
- [x] タイトルのフォントサイズ段階的調整
- [x] 職業選択画面の余白調整
- [x] プロローグ画像・テキスト表示改善
- [x] HP/タイマー/ボタン類のスマホ対応

### Task 11.4: 追加UIフィードバック修正
- [x] マップ/ヘルプボタンの重なり解消（スマホ）
- [x] NEW BESTバッジのスマホ対応
- [x] クリア画面全体のスマホ対応
- [x] ヘルプからTab記載を削除、Mキー説明更新

---

## 注意事項

- **既存のMVP3コードを直接拡張・改修**（新規ページ追加ではない）
- 演出は最小コストで最大効果を狙う
- テストファーストで進める
- 評価観点（初見理解、リプレイ動機、安定性）を常に意識
- コメント・docstringは日本語で記述
- SE/BGMは実装の準備のみ（実アセットは後回し可）
