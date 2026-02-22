# AQS ブラッシュアップ実装計画

## 概要
Agile Quiz Sugoroku の学習価値とユーザー体験を向上させる6フェーズの実装。

## フェーズ構成

### Phase 0: 基盤（型定義・定数）
- Question に explanation フィールド追加
- TagStats, SavedGameResult 等の新型追加
- GamePhase 拡張（guide, study-select, study）
- PHASE_GENRE_MAP 定数追加

### Phase 1: 全306問に解説追加
- 既存解説を constants.ts から JSON へ移行
- 残り約276問に解説を追加
- QuizScreen の解説取得ロジック変更

### Phase 2: ジャンル別成績追跡
- tag-stats.ts ユーティリティ作成
- useGame にタグ追跡・不正解問題蓄積追加
- ResultScreen にジャンル別分析セクション追加
- QuizScreen にジャンルタグ表示

### Phase 3: localStorage 保存
- result-storage.ts 作成
- ゲーム完了時に自動保存
- TitleScreen に前回結果表示

### Phase 4: 勉強会モード
- StudySelectScreen（ジャンル選択）
- StudyScreen（タイマーなし学習）
- StudyResultScreen（学習結果）
- useStudy フック

### Phase 5: ガイド・チーム紹介
- GuideScreen 作成
- 遊び方、ルール、スコアリング、チーム紹介

### Phase 6: テスト・検証
- 新規ユーティリティのテスト
- 既存テストの更新
- ビルド検証
