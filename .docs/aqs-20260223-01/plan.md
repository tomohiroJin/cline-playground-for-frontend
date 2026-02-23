# Agile Quiz Sugoroku ブラッシュアップ計画

## 日付: 2026-02-23

## Context

Agile Quiz Sugorokuは、アジャイル/スクラムの知識をクイズ形式で学べる教育ゲーム。
現在3スプリント固定・306問・3キャラクター（ネコ・イヌ・ウサギ）で構成されている。

今回のブラッシュアップでは以下を実施:
1. ステークホルダーキャラクター追加（タカ）
2. 総評のキャラクター演出
3. スプリント数選択（フィボナッチ数列）
4. クイズ問題追加（約60問）
5. 勉強会モード改善

## 実装順序

1. ステークホルダーキャラ追加（他の変更の前提）
2. 勉強会モード問題数変更（単純な定数変更）
3. スプリント数選択（UI + ゲームロジック変更）
4. 総評のステークホルダー演出（キャラ追加が前提）
5. クイズ問題追加（独立した作業）

## 変更対象ファイル

- `character-profiles.ts` - キャラクターデータ追加
- `images.ts` - 画像import追加
- `constants.ts` - SPRINT_OPTIONS追加、getSummaryText変更
- `components/TitleScreen.tsx` - スプリント数選択UI追加
- `components/ResultScreen.tsx` - 総評セクションUI変更
- `components/StudySelectScreen.tsx` - LIMIT_OPTIONS変更
- `components/GuideScreen.tsx` - テキスト更新
- `pages/AgileQuizSugorokuPage.tsx` - スプリント数状態管理
- `questions/*.json` - 各カテゴリに問題追加
