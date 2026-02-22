# AQS ブラッシュアップ タスクチェックリスト

## Phase 0: 基盤
- [x] Question に explanation フィールド追加
- [x] TagStats 型追加
- [x] AnswerResultWithDetail 型追加
- [x] SavedGameResult 型追加
- [x] SavedIncorrectQuestion 型追加
- [x] GamePhase 拡張
- [x] PHASE_GENRE_MAP 定数追加

## Phase 1: 解説
- [x] 既存解説を JSON に移行
- [x] 残り約276問に解説追加
- [x] QuizScreen の解説取得を quiz.explanation に変更
- [x] constants.ts から EXPLANATIONS 削除
- [x] 全問 explanation 存在テスト追加

## Phase 2: ジャンル別成績
- [x] tag-stats.ts 作成
- [x] useGame に tagStats/incorrectQuestions 追加
- [x] ResultScreen にジャンル分析セクション追加
- [x] ResultScreen に不正解問題レビュー追加
- [x] QuizScreen にジャンルタグ表示
- [x] RetrospectiveScreen に総合スコア追加

## Phase 3: localStorage
- [x] result-storage.ts 作成
- [x] ゲーム完了時に自動保存
- [x] TitleScreen に前回結果表示

## Phase 4: 勉強会モード
- [x] StudySelectScreen 作成
- [x] study-question-pool.ts 作成
- [x] useStudy フック作成
- [x] StudyScreen 作成
- [x] StudyResultScreen 作成
- [x] AgileQuizSugorokuPage に統合

## Phase 5: ガイド
- [x] GuideScreen 作成
- [x] TitleScreen にボタン追加
- [x] AgileQuizSugorokuPage に統合

## Phase 6: テスト・検証
- [x] tag-stats.test.ts 作成
- [x] result-storage.test.ts 作成
- [x] study-question-pool.test.ts 作成
- [x] questions.test.ts に解説テスト追加
- [x] npm test 全テスト通過 (234 tests, 11 suites)
- [x] npm run build ビルド成功
