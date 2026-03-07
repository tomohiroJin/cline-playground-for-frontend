# Agile Quiz Sugoroku ブラッシュアップ タスクチェックリスト

## フェーズ1: 演出強化

### 1.1 すごろくボードビジュアル
- [x] すごろく経路UIコンポーネント設計（マス配置・レイアウト）
- [x] `BoardPath` styled-component 作成（横長経路、各マスのスタイル）→ `SugorokuBoard.tsx` として実装
- [x] `BoardPiece` コンポーネント作成（キャラアイコンのコマ）
- [x] コマ移動スライドアニメーション実装（CSS transition 300ms）→ `slideMove` keyframes
- [x] 完了マスのチェックマーク表示 + 色変化
- [x] 緊急対応マスの赤点滅アニメーション → `emergencyBlink` keyframes
- [x] `QuizScreen.tsx` のタイムライン部分を新ボードUIに差し替え
- [x] モバイル対応: 横スクロール + 現在マス中央自動スクロール
- [x] 既存テスト（components.test.tsx）の更新

### 1.2 正解/不正解アニメーション強化
- [x] `animations.ts` にフラッシュアニメーション定義（greenFlash, redFlash, grayOut）
- [x] `animations.ts` にバウンスアニメーション定義（bounceIn, shakeX）
- [x] `animations.ts` にフロートアニメーション定義（floatUp）
- [x] スコア加算フロートテキストコンポーネント作成 → `ScoreFloat.tsx`
- [x] `QuizScreen.tsx` に正解時フラッシュ + バウンス実装 → `FlashOverlay` 統合
- [x] `QuizScreen.tsx` に不正解時フラッシュ + シェイク実装
- [x] `QuizScreen.tsx` にタイムアップ時グレーアウト実装
- [x] 正解アイコン回転出現アニメーション実装 → 既存の `popIn` を活用

### 1.3 コンボ演出強化
- [x] コンボ段階定数定義（2-3: 炎, 4-5: 稲妻, 6-7: 虹, 8+: LEGENDARY）→ `combo-color.ts` に追加
- [x] `ComboEffect` コンポーネント作成（段階別エフェクト表示）
- [x] コンボ段階別 CSS アニメーション定義 → comboFire, comboLightning, comboRainbow, comboLegendary
- [x] コンボ中のコマオーラエフェクト → `comboActive` prop で対応可能
- [x] コンボ切れ「Combo Break」表示 + アニメーション
- [x] `sound.ts` にコンボ切れ効果音追加 → `playSfxComboBreak()`
- [x] `QuizScreen.tsx` にコンボ演出統合

### 1.4 タイマー緊迫演出
- [x] `TimerContainer` に残り時間帯別の背景色変化追加 → 4段階の色変化
- [x] 残り5秒: パネル枠の脈動エフェクト → 既存の `$pulse` 活用
- [x] 残り3秒: 画面赤みがかりオーバーレイ → `QuizScreen` で `timer <= 2` 時の赤オーバーレイ
- [x] 残り1-2秒: タイマー激しい振動 → 既存の `$shake` 活用
- [x] `sound.ts` のティック音にピッチ変化対応（残り時間に応じて）→ `playSfxTickUrgent()`
- [x] `prefers-reduced-motion` 対応（アニメーション無効化）→ 全新規コンポーネントに適用

### 1.5 グレード発表演出
- [x] 結果画面の演出シーケンス設計（ステップ定義 + タイミング）→ 4ステップシーケンス
- [x] ステップ1: 暗転 → 「BUILD SUCCESS」タイプライター表示
- [x] ステップ2: ドラムロール効果音（`sound.ts` に追加）→ `playSfxDrumroll()`
- [x] ステップ3: グレードサークルのバウンス表示アニメーション → 既存の `gradeReveal` 活用
- [ ] ステップ4: グレード色パーティクル放射エフェクト（将来実装）
- [x] ステップ5: Sランク特別エフェクト + ファンファーレ音 → `playSfxFanfare()`
- [ ] ステップ6: エンジニアタイプカードのスライドイン（将来実装）
- [x] クリック/Enter による演出スキップ機能
- [x] `ResultScreen.tsx` に演出シーケンス統合

### 1.6 キャラクターリアクション
- [x] `character-reactions.ts` 作成（状況別コメントデータ定義）→ 5状況 x 3キャラ x 3バリエーション
- [x] `CharacterReaction.tsx` コンポーネント作成（アバター + 吹き出し）
- [x] 正解/不正解/コンボ/タイマー警告/緊急対応の各トリガー実装
- [x] 吹き出し表示→1.5秒後自動消去のアニメーション → `bubbleFadeIn` / `bubbleFadeOut`
- [x] `QuizScreen.tsx` に CharacterReaction 組み込み
- [x] キャラクターコメントの単体テスト → `character-reactions.test.ts`

#### 1.6 フィードバック対応 (1回目)
- [x] キャラ画像を `AQS_IMAGES.characters` から取得して表示（絵文字→キャラ絵）
- [x] キャラクターリアクションを右下→左下に移動（ボタンとの被り解消）
- [x] 3体のキャラを常時表示（idle 状態のコメント追加）
- [x] `character-reactions.ts` に idle 状況のコメントデータ追加（4コメント x 3キャラ）
- [x] 複数キャラが独立タイミングでコメントを切り替える仕組み → `useCharacterComment` フック
- [x] テスト更新 → `character-reactions.test.ts`, `phase1-components.test.tsx`

#### 1.6 フィードバック対応 (2回目)
- [x] 配置改善: absolute→フロー内配置でコンテンツと被らないように
- [x] ガタつき解消: flex:1均等幅 + BubbleWrapper固定高さ(36px)
- [x] タイマー段階対応: idle→timeMild(残り7秒)→timeWarning(残り3秒)の段階変化
- [x] 得意分野ヒント: CHARACTER_TAG_MAP + HINT_COMMENTS(15タグ x 3コメント)
- [x] `character-reactions.ts` にヒント・タグマッピング・timeMild状況追加
- [x] テスト更新 → 50テスト(character-reactions 26件 + phase1-components 24件)合格

#### 1.6 フィードバック対応 (3回目)
- [x] 回答後（correct/incorrect/combo）のキャラコメント固定表示（idle に戻さない）

### フェーズ1 検証
- [ ] 全画面フローの通しプレイテスト
- [ ] モバイル表示確認
- [x] `prefers-reduced-motion` 有効時の動作確認 → 全コンポーネントに対応済み
- [x] 既存テストが全て通ることの確認（`npm test`）→ 24スイート、455テスト全パス
- [ ] パフォーマンス確認（アニメーション中のフレームレート）

---

## フェーズ2: ゲーミフィケーション

### 2.1 実績システム
- [x] `types.ts` に実績関連の型定義追加（Achievement, AchievementProgress, AchievementContext）
- [x] `achievements.ts` 作成（20個の実績定義 + 判定ロジック）※継続系5個追加
- [x] `achievement-storage.ts` 作成（localStorage 保存・読込）
- [x] 実績判定ロジックの単体テスト → `achievements.test.ts`（24テスト）
- [x] 実績ストレージの単体テスト → `achievement-storage.test.ts`（8テスト）
- [x] `AchievementScreen.tsx` 作成（実績一覧表示、獲得済み/未獲得の区別、レア度別色分け）
- [x] `AchievementToast.tsx` 作成（獲得時のトースト通知、スライドインアニメーション）
- [x] 実績獲得効果音追加（`sound.ts` に `playSfxAchievement()`）
- [x] `TitleScreen.tsx` に実績ボタン追加
- [x] `AgileQuizSugorokuPage.tsx` にゲーム終了時の実績判定統合
- [x] `GamePhase` 型に `'achievements'` 追加
- [x] 実績コンポーネントのテスト → `phase2-components.test.tsx`

### 2.2 履歴・成長グラフ
- [x] `types.ts` に履歴関連の型定義追加（GameHistoryEntry）
- [x] `history-storage.ts` 新規作成: 最大10件保存対応（`aqs_history` キー）
- [x] 既存 `aqs_last_result` との互換性維持（`migrateLastResultToHistory()` マイグレーション）
- [x] `LineChart.tsx` 作成（SVG ベース折れ線グラフ、グラデーション領域付き）
- [x] `HistoryScreen.tsx` 作成（履歴一覧 + 正答率/速度推移グラフ + 最高グレード表示）
- [x] `TitleScreen.tsx` に履歴ボタン追加
- [x] `GamePhase` 型に `'history'` 追加
- [x] `AgileQuizSugorokuPage.tsx` に履歴画面フェーズ追加 + 結果保存時に履歴蓄積
- [x] 履歴保存ロジックの単体テスト → `history-storage.test.ts`（9テスト）
- [x] LineChart コンポーネントのテスト → `phase2-components.test.tsx`

### 2.3 難易度選択
- [x] `types.ts` に難易度型追加（Difficulty, DifficultyConfig）
- [x] `difficulty.ts` 新規作成: 難易度設定定数（DIFFICULTY_CONFIGS）+ グレード計算
- [x] `DifficultySelector.tsx` コンポーネント作成（4択ボタン + 説明表示）
- [x] `TitleScreen.tsx` に難易度セレクター組み込み
- [x] `AgileQuizSugorokuPage.tsx` に難易度パラメータ対応（制限時間連動）
- [ ] Easy モードのヒント機能（50:50）UI実装（将来実装）
- [ ] `QuizScreen.tsx` にヒントボタン追加（Easy モード時のみ）（将来実装）
- [x] 難易度別グレード計算ボーナス係数の実装 → `calculateGradeWithDifficulty()`
- [x] `AgileQuizSugorokuPage.tsx` に難易度 state 追加
- [x] 難易度ロジックの単体テスト → `difficulty.test.ts`（10テスト）

### 2.4 チャレンジモード（サバイバル）
- [x] `types.ts` にチャレンジモード関連型追加（ChallengeResult）
- [x] `hooks/useChallenge.ts` 作成（1ミス即終了ロジック、ランダムカテゴリ出題）
- [x] チャレンジモードは既存 `QuizScreen` を再利用（専用画面不要）
- [x] `ChallengeResultScreen.tsx` 作成（ゲームオーバー + 記録表示 + NEW RECORD表示）
- [x] `challenge-storage.ts` 作成: ハイスコア保存ロジック（localStorage）
- [x] `TitleScreen.tsx` に「Challenge」ボタン追加
- [x] `GamePhase` 型に `'challenge'`, `'challenge-result'` 追加
- [x] `AgileQuizSugorokuPage.tsx` にチャレンジモード遷移追加
- [x] チャレンジモードストレージの単体テスト → `challenge.test.ts`（5テスト）

### フェーズ2 検証
- [x] 実績が正しく判定・保存されることの確認 → 単体テストで検証済み
- [x] 履歴が10件まで正しく保存されることの確認 → 単体テストで検証済み
- [ ] 各難易度でゲームバランスが適切かの確認（通しプレイで要確認）
- [ ] チャレンジモードの通しプレイテスト
- [x] 全テスト通過確認 → 30スイート、540テスト全パス
- [x] TypeScript型チェック通過確認 → `tsc --noEmit` エラーなし

---

## フェーズ3: コンテンツ・ソーシャル拡充

### 3.1 キャラクターナラティブ
- [x] ナラティブデータ定義（状況別 × キャラ別セリフ、各3バリエーション x 3キャラ x 5状況 = 45件）→ `character-narrative.ts`
- [x] `SprintStartScreen.tsx` にキャラ会話表示追加（キャラアバター + 吹き出し）
- [x] `RetrospectiveScreen.tsx` にキャラ会話表示追加（キャラアバター + 吹き出し）
- [ ] 会話表示のフェードイン/アウトアニメーション（将来実装）
- [x] ナラティブデータの単体テスト → `character-narrative.test.ts`（16テスト）

### 3.2 デイリークイズ
- [x] 日付ベースのシード付きランダム関数実装 → `dateSeed()` + `seededRandom()`（xorshift32）
- [x] デイリークイズ5問選出ロジック → `getDailyQuestions()`（Fisher-Yatesシャッフル）
- [x] `DailyQuizScreen.tsx` 作成（クイズ画面 + 結果画面、キーボード操作対応）
- [x] 日別結果保存ロジック（`aqs_daily` キー）→ `saveDailyResult()` / `getDailyResult()`
- [x] ストリーク（連続参加日数）計算ロジック → `getDailyStreak()`
- [ ] カレンダー表示コンポーネント（将来実装）
- [x] `TitleScreen.tsx` にデイリークイズボタン追加（`onDailyQuiz` コールバック）
- [x] `GamePhase` 型に `'daily-quiz'` 追加
- [x] `AgileQuizSugorokuPage.tsx` にデイリークイズ画面遷移追加
- [x] デイリークイズロジックの単体テスト → `daily-quiz.test.ts`（13テスト）

### 3.3 SNSシェア強化
- [x] X(Twitter) シェアボタン追加（intent URL 生成）→ `ResultScreen.tsx` + `ChallengeResultScreen.tsx`
- [x] シェアテキストにハッシュタグ追加（`#AgileQuizSugoroku`）
- [x] `ResultScreen.tsx` にシェアボタン追加（Copy + X Share の2ボタン構成）
- [x] `ChallengeResultScreen.tsx` にもシェアボタン追加

### フェーズ3 検証
- [ ] ナラティブの表示タイミングと内容の確認（通しプレイで要確認）
- [x] デイリークイズが同じ日に同じ問題が出ることの確認 → 単体テストで検証済み
- [ ] SNSシェアリンクが正しく機能することの確認（通しプレイで要確認）
- [x] 全テスト通過確認 → 32スイート、577テスト全パス（agile-quiz-sugoroku）
- [x] TypeScript型チェック通過確認 → `tsc --noEmit` エラーなし

---

## 横断タスク

### ドキュメント更新
- [ ] `README.md` に新機能の記載追加
- [ ] `character-profiles.ts` にリアクションコメント追加の記載

### リファクタリング（必要に応じて）
- [ ] `GamePhase` 型の拡張に伴う分岐整理
- [ ] `AgileQuizSugorokuPage.tsx` が肥大化した場合のコンポーネント分割
- [ ] アニメーション定義ファイルの整理

### 最終検証
- [ ] 全フェーズ完了後の通しプレイテスト
- [ ] 全テスト通過確認
- [ ] バンドルサイズ確認（+50KB 以内）
- [ ] Lighthouse パフォーマンススコア確認
