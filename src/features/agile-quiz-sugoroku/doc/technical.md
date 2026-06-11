# 技術詳細

## アーキテクチャ

DDD（ドメイン駆動設計）+ クリーンアーキテクチャを採用。

```
依存方向: presentation → domain / infrastructure / data
          infrastructure → domain（型のみ）
          domain → data（静的データのみ。infrastructure・presentation は参照しない）
```

## ファイル構成

```
src/features/agile-quiz-sugoroku/
  index.ts                  # barrel export（公開API）
  README.md                 # 機能概要
  domain/                   # ドメイン層（純粋関数、副作用なし）
    types/                  # 型定義（GamePhase, TagStats, SavedGameResult 等）
    game/                   # ゲーム進行（イベント生成、スプリント要約）
    quiz/                   # クイズ（問題選択、回答評価、コンボ、タグ統計）
    scoring/                # スコアリング（グレード、難易度、負債計算）
    team/                   # チーム分類
    achievement/            # 実績判定（20個）
    narrative/              # キャラクターナラティブ関連
      character-reactions.ts    # キャラクターリアクション（状況別コメント・ヒント）
      character-narrative.ts    # キャラクターナラティブ（スプリント開始/振り返り時の会話）
      character-genre-map.ts    # キャラクター×ジャンルマッピング
    testing/                # テスト用ファクトリ
  data/                     # 静的データ
    story-data.ts           # ストーリーデータ（8スプリント分）
    ending-data.ts          # エンディングデータ（共通 + 6エピローグ）
    character-profiles.ts   # キャラクタープロフィール（静的データ）
    images.ts               # 画像アセット一元管理
    questions/              # クイズ問題データ
      index.ts              # カテゴリ別問題データの集約
      tag-master.ts         # 16ジャンルのタグマスタ定義
      *.json                # 各カテゴリ問題データ（計269問）
  infrastructure/           # インフラ層（副作用を集約）
    storage/                # Port/Adapter パターン
      storage-port.ts       # StoragePort インターフェース
      local-storage-adapter.ts  # localStorage 実装
      in-memory-storage-adapter.ts  # テスト用実装
      game-repository.ts    # ゲーム結果リポジトリ
      history-repository.ts # 履歴リポジトリ
      achievement-repository.ts # 実績リポジトリ
      save-repository.ts    # セーブリポジトリ
      challenge-repository.ts   # チャレンジリポジトリ
      daily-quiz-repository.ts  # デイリークイズ結果リポジトリ
      daily-quiz-service.ts     # デイリークイズサービス（DailyQuizRepository を提供）
      study-progress-repository.ts  # 勉強会モード進捗リポジトリ
    audio/                  # オーディオ
      audio-port.ts         # AudioPort インターフェース
      sound.ts              # 効果音・BGM
      audio-actions.ts      # オーディオアクション
      tone-audio-adapter.ts # Tone.js 実装
      silent-audio-adapter.ts # テスト用無音実装
    random/                 # 乱数
      random-port.ts        # RandomPort インターフェース
      math-random-adapter.ts    # Math.random 実装
      seeded-random-adapter.ts  # テスト用シード付き実装
  constants/                # 定数・設定
    game-config.ts          # CONFIG, SPRINT_OPTIONS, INITIAL_GAME_STATS
    events.ts               # EVENTS, EMERGENCY_EVENT
    grades.ts               # GRADES, getGrade, getSummaryText
    colors.ts               # COLORS, getColorByThreshold
    index.ts                # barrel export
  presentation/             # プレゼンテーション層（UI）
    components/             # UI コンポーネント
      screens/              # 画面コンポーネント
        TitleScreen.tsx     # タイトル画面
        SprintStartScreen.tsx   # スプリント開始画面
        RetrospectiveScreen.tsx # 振り返り画面
        StudySelectScreen.tsx   # 勉強会モード選択
        StudyScreen.tsx     # 勉強会モード学習
        StudyResultScreen.tsx   # 勉強会モード結果
        DailyQuizScreen.tsx # デイリークイズ
        HistoryScreen.tsx   # 履歴画面
        StoryScreen.tsx     # ストーリー画面
        AchievementScreen.tsx   # 実績画面
        ChallengeResultScreen.tsx   # チャレンジ結果画面
        QuizScreen/         # クイズ画面（OptionsPanel, QuizResult 等）
        ResultScreen/       # 結果画面（GradeDisplay, StatsPanel, GenreAnalysis 等）
        GuideScreen/        # ガイド画面（GuideSection, ImageWithFallback 等）
        ChallengeQuizScreen/    # チャレンジクイズ画面
      CharacterReaction.tsx # キャラクターリアクション
      SugorokuBoard.tsx     # すごろくボード
      ParticleEffect.tsx    # パーティクルエフェクト
      ...その他パーツコンポーネント
    hooks/                  # React カスタムフック
      useGame.ts            # 通常ゲーム状態管理
      useGameReducer.ts     # Reducer パターンによる状態管理
      useStudy.ts           # 勉強会モード
      useChallenge.ts       # チャレンジモード（1ミス即終了）
      useCountdown.ts       # カウントダウンタイマー
      useFade.ts            # フェードアニメーション
      useKeys.ts            # キーボード入力
      useCharacterComment.ts # キャラクターコメント
    styles/                 # スタイル定数・styled-components
      design-tokens.ts      # デザイントークン
      animations.ts         # アニメーション
      common.ts             # 共通スタイル
      layout.ts             # レイアウト
      quiz.ts               # クイズ画面スタイル
      result.ts             # 結果画面スタイル
      story.ts              # ストーリー画面スタイル
  __tests__/                # 統合テスト
```

## 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- `useGameReducer`: Reducer パターンで 14 個の useState を統合
- カスタムフック（`useGame`, `useStudy`, `useChallenge`, `useCountdown`, `useFade`, `useKeys`）で関心を分離

## データ永続化（localStorage）

| キー | 用途 | 管理クラス |
|------|------|-----------|
| `aqs_last_result` | 最新ゲーム結果 | `GameResultRepository` |
| `aqs_history` | プレイ履歴（最大10件） | `HistoryRepository` |
| `aqs_save_state` | セーブ/ロード | `SaveRepository` |
| `aqs_achievements` | 実績進捗 | `AchievementRepository` |
| `aqs_challenge_high` | チャレンジモードハイスコア | `ChallengeRepository` |
| `aqs_daily` | デイリークイズ日別結果 | `DailyQuizRepository（infrastructure/storage/daily-quiz-service.ts 経由）` |

## 設計原則

- **ドメイン層は純粋関数**: React, localStorage, Tone.js, Math.random への直接依存なし
- **副作用はインフラ層に隔離**: Port/Adapter パターンで抽象化
- **DI（依存性注入）**: アプリケーション層で外部依存を注入
- **DbC**: contracts/ で事前・事後条件を明示
- **テスタビリティ**: 乱数は `randomFn` パラメータで注入可能

## カバレッジ目標

| 対象 | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| domain/ | ≥85% | ≥70% | ≥85% | ≥85% |
| 全体 | ≥50% | ≥35% | ≥45% | ≥50% |
