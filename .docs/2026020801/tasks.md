# Lintエラー修正 タスク

## 0. 計画定義
- [x] `plan.md` 作成
- [x] `spec.md` 作成
- [x] `tasks.md` 作成

## 1. 事前確認
- [x] 作業ブランチ作成（`fix/lint-2026-02-08`）
- [x] lint初回実行でエラー一覧を取得

## 2. 実装修正
- [x] `no-unused-vars` 系エラーを全件解消
- [x] `no-explicit-any` を具体型へ置換
- [x] `prefer-const` を全件解消
- [x] `react-hooks/refs` を解消
- [x] `react-hooks/purity` を解消
- [x] `react-hooks/preserve-manual-memoization` の方針適用
- [x] `react-hooks/exhaustive-deps` warning を全件解消

## 3. 検証
- [x] `npm run lint` 再実行
- [x] エラー0を確認
- [x] warning0を確認

## 4. システムテスト計画
- [x] 変更影響範囲（`IpnePage`）を特定
- [x] 実施すべきシステムテストシナリオを定義

## 5. 仕上げ
- [x] 変更内容サマリを更新
