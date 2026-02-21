# Agile Quiz Sugoroku - タグ付けタスクチェックリスト

## Phase 1: ドキュメント
- [x] plan.md 作成
- [x] spec.md 作成
- [x] tasks.md 作成

## Phase 2: 型定義・タグマスタ・バリデーション
- [x] types.ts — Question に tags?: string[] 追加
- [x] questions/tag-master.ts 新規作成
- [x] questions/index.ts — assertQuestionArray にタグバリデーション追加
- [x] index.ts — タグマスタのエクスポート追加

## Phase 3: 全問タグ付与
- [x] planning.json（43 問）
- [x] impl1.json（42 問）
- [x] test1.json（37 問）
- [x] refinement.json（37 問）
- [x] impl2.json（37 問）
- [x] test2.json（37 問）
- [x] review.json（37 問）
- [x] emergency.json（37 問）

## Phase 4: テスト・検証
- [x] questions.test.ts にタグ検証テスト追加
- [x] npm test 全通過
- [x] npm run build 成功
