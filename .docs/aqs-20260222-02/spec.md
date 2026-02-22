# AQS ブラッシュアップ仕様書

## 1. 解説機能
- 全306問に日本語1-2文の解説を付与
- Question 型に optional な `explanation` フィールドを追加
- 回答後に解説を常時表示

## 2. ジャンル別成績分析
- 16ジャンルの正答率を追跡
- 色分け: 緑(>=70%), 黄(50-69%), 赤(<50%)
- 苦手ジャンル（<=50%）にメッセージ表示
- ResultScreen に GENRE ANALYSIS セクション追加

## 3. 不正解問題レビュー
- 不正解問題を蓄積（問題文、選択回答、正解、解説、タグ）
- ResultScreen に不正解問題一覧セクション

## 4. localStorage 保存
- キー: `aqs_last_result`
- 保存データ: 統計、ジャンル別正答率、不正解問題、スプリントログ、グレード、エンジニアタイプ
- TitleScreen に前回結果サマリー表示

## 5. 勉強会モード
- スプリント工程別 or 個別ジャンル選択
- 問題数選択（10/20/全問）
- タイマーなし、回答後即解説表示
- 進捗表示、途中終了可能
- ジャンル別結果表示

## 6. PHASE_GENRE_MAP
```
planning:   [scrum, agile, estimation, backlog]
impl1/impl2: [design-principles, design-patterns, data-structures, programming]
test1/test2: [testing, code-quality, ci-cd]
refinement: [refactoring, code-quality, backlog]
review:     [release, team, scrum]
emergency:  [incident, sre]
```

## 7. ガイド画面
- ゲーム概要、遊び方、ルール説明
- スコアリング方式（正答率50%+安定度30%+速度20%）
- PHASE_GENRE_MAP の図表
- 6つのエンジニアタイプ紹介（画像付き）
- 勉強会モードの使い方
