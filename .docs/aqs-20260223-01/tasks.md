# Agile Quiz Sugoroku ブラッシュアップ - タスクチェックリスト

## 1. ステークホルダーキャラクター追加（タカ）

- [x] `character-profiles.ts` にタカのプロフィール追加
- [x] `images.ts` に `aqs_char_taka` のimport追加
- [x] `images.ts` の `AQS_IMAGES.characters` にtaka追加
- [x] 画像ファイル `aqs_char_taka.webp` を用意（ユーザー作業）

## 2. 勉強会モード問題数変更

- [x] `StudySelectScreen.tsx` の `LIMIT_OPTIONS` を変更（全問→50問）
- [x] `GuideScreen.tsx` の勉強会モード説明テキスト更新

## 3. スプリント数選択

- [x] `constants.ts` に `SPRINT_OPTIONS` 定数追加
- [x] `TitleScreen.tsx` の `onStart` を `(sprintCount: number) => void` に変更
- [x] `TitleScreen.tsx` にスプリント数選択UI追加
- [x] `TitleScreen.tsx` の機能紹介リストを動的スプリント数に対応
- [x] `AgileQuizSugorokuPage.tsx` に `sprintCount` 状態追加
- [x] `AgileQuizSugorokuPage.tsx` の `handleStart` でスプリント数受け取り
- [x] `AgileQuizSugorokuPage.tsx` の `handleAfterRetro` を動的スプリント数に対応
- [x] `constants.ts` の `getSummaryText` にスプリント数パラメータ追加
- [x] `ResultScreen.tsx` に `sprintCount` prop追加
- [x] `AgileQuizSugorokuPage.tsx` から `ResultScreen` に `sprintCount` を渡す

## 4. 総評のステークホルダー演出

- [x] `constants.ts` の `getSummaryText` をタカの口調に変更
- [x] `ResultScreen.tsx` のSUMMARYセクションにタカのアバター+吹き出しUI追加
- [x] 画像なし時のemojiフォールバック対応

## 5. クイズ問題追加

- [x] `planning.json` に8問追加
- [x] `impl1.json` に8問追加
- [x] `impl2.json` に8問追加
- [x] `test1.json` に8問追加
- [x] `test2.json` に8問追加
- [x] `refinement.json` に8問追加
- [x] `review.json` に6問追加
- [x] `emergency.json` に6問追加
- [x] `GuideScreen.tsx` の問題数テキスト更新（306→366）

## 6. 検証

- [x] `npm test` で全テストがパスすることを確認
- [x] ブラウザでの動作確認（ユーザー作業）
  - [x] タイトル画面でスプリント数選択UIが表示される
  - [x] 各スプリント数でゲームが正常に開始・完了できる
  - [x] クリア後の総評画面でタカのアバターと吹き出しが表示される
  - [x] ガイド画面に4キャラ目（タカ）が表示される
  - [x] 勉強会モードの問題数が10/20/50になっている
  - [x] 新しいクイズ問題が出題される
  - [x] 画像未設定時にemojiフォールバックが正しく動作する
