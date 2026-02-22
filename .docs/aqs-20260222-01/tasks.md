# AQS ブラッシュアップ - タスクチェックリスト

## Phase 1: ドキュメント

- [x] plan.md 作成
- [x] spec.md 作成（3パート構成）
- [x] tasks.md 作成

## Phase 2: カスタムスクロール実装

- [x] `common.ts` に `css` インポート追加
- [x] `common.ts` に `aqsScrollbar` CSS ミックスイン追加
- [x] `common.ts` に `ScrollablePanel` styled-component 追加
- [x] `GuideScreen.tsx` — `Panel` → `ScrollablePanel` 置換、インラインスタイル削除
- [x] `ResultScreen.tsx` — `Panel` → `ScrollablePanel` 置換
- [x] `StudyResultScreen.tsx` — `Panel` → `ScrollablePanel` 置換

## Phase 3: キャラクタープロフィール実装

- [x] `character-profiles.ts` 新規作成（インターフェース + 3キャラデータ）
- [x] `images.ts` にキャラクター画像 `characters` キー追加（null フォールバック）
- [x] `GuideScreen.tsx` に TEAM セクション追加（ABOUT 直後、HOW TO PLAY 前）

## Phase 4: 画像準備（別AI向け分離作業）

- [x] spec.md Part 2 に画像プロンプト記載済み
- [x] 画像ファイル生成（別AI実行）
- [x] `images.ts` に画像インポート追加（画像完成後）

## Phase 5: ドキュメント更新

- [x] `README.md` にキャラクタープロフィールセクション追加

## Phase 6: 検証

- [x] `npm test` 全テスト通過（1561 tests passed）
- [x] `npm run build` ビルド成功
- [x] ブラウザ確認: GuideScreen スクロールバー
- [x] ブラウザ確認: TEAM セクション表示（emoji フォールバック）
- [x] ブラウザ確認: ResultScreen スクロール
- [x] ブラウザ確認: StudyResultScreen スクロール
