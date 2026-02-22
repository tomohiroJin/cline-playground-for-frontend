# Agile Quiz Sugoroku（アジャイル・クイズ・すごろく）

## 概要

アジャイル開発・スクラムに関するクイズに答えてすごろくを進む教育ゲーム。
3スプリントを走破し、スコアとベロシティからエンジニアタイプを診断。
技術的負債が溜まると緊急対応イベントが発生するリアルなスプリント体験。

### 主な特徴

- **全306問 + 解説付き**: 各問題に1-2文の簡潔な解説を収録
- **16ジャンルのタグシステム**: スクラム、テスト、設計原則、CI/CD など幅広い領域をカバー
- **ジャンル別成績分析**: 結果画面でジャンルごとの正答率を色分け表示、苦手ジャンルを可視化
- **不正解問題レビュー**: 間違えた問題を解説・正解と共に振り返り
- **勉強会モード**: タイマーなしでジャンルを選んでじっくり学習。苦手克服プリセット付き
- **ゲーム結果の保存**: localStorage に自動保存、タイトル画面で前回結果を表示
- **遊び方 & チーム紹介ガイド**: ルール、スコアリング、工程×ジャンル対応表、エンジニアタイプ図鑑

## 操作方法

- **マウスクリック**: 選択肢を選択
- **キーボード**: A/B/C/D または 1/2/3/4 で選択、Enter/Space で次へ

## 技術詳細

### ファイル構成

```
src/features/agile-quiz-sugoroku/
  index.ts                  # barrel export
  types.ts                  # 型定義（TagStats, SavedGameResult 等）
  constants.ts              # ゲーム設定定数・PHASE_GENRE_MAP
  game-logic.ts             # ゲームロジック（純粋関数）
  tag-stats.ts              # ジャンル別統計ユーティリティ
  result-storage.ts         # localStorage 保存・読込
  study-question-pool.ts    # 勉強会モード問題プール構築
  quiz-data.ts              # 互換エクスポート（questions/を再公開）
  engineer-classifier.ts    # エンジニアタイプ判定
  answer-processor.ts       # 回答処理ロジック
  questions/
    index.ts                # カテゴリ別問題データの集約
    tag-master.ts           # 16ジャンルのタグマスタ定義
    planning.json           # planningカテゴリ問題データ（42問）
    impl1.json              # impl1カテゴリ問題データ（42問）
    test1.json              # test1カテゴリ問題データ（37問）
    refinement.json         # refinementカテゴリ問題データ（37問）
    impl2.json              # impl2カテゴリ問題データ（37問）
    test2.json              # test2カテゴリ問題データ（37問）
    review.json             # reviewカテゴリ問題データ（37問）
    emergency.json          # emergencyカテゴリ問題データ（37問）
  hooks/
    useGame.ts              # ゲーム状態管理フック（タグ追跡・不正解蓄積含む）
    useStudy.ts             # 勉強会モード状態管理フック
    useCountdown.ts         # カウントダウンタイマー
    useFade.ts              # フェードアニメーション
    useKeys.ts              # キーボード入力
    index.ts                # barrel export
  components/
    TitleScreen.tsx          # タイトル画面（前回結果表示・勉強会/ガイドボタン）
    SprintStartScreen.tsx    # スプリント開始画面
    QuizScreen.tsx           # クイズ画面（ジャンルタグ表示・解説表示）
    RetrospectiveScreen.tsx  # 振り返り画面（総合スコア表示）
    ResultScreen.tsx         # 結果画面（ジャンル分析・不正解レビュー）
    StudySelectScreen.tsx    # 勉強会モード - ジャンル選択画面
    StudyScreen.tsx          # 勉強会モード - 学習画面
    StudyResultScreen.tsx    # 勉強会モード - 学習結果画面
    GuideScreen.tsx          # 遊び方 & チーム紹介ガイド画面
    BarChart.tsx             # 棒グラフ
    RadarChart.tsx           # レーダーチャート
    ParticleEffect.tsx       # パーティクルエフェクト
    index.ts                 # barrel export
    styles/
      animations.ts          # アニメーション
      common.ts              # 共通スタイル
      layout.ts              # レイアウト
      quiz.ts                # クイズスタイル
      result.ts              # 結果スタイル
      index.ts               # barrel export
  audio/
    sound.ts                 # 効果音・BGM
    audio-actions.ts         # オーディオアクション
  __tests__/                 # ユニットテスト（234テスト）
    components.test.tsx
    constants.test.ts
    game-logic.test.ts
    questions.test.ts        # 問題データ構造・解説・タグ検証
    tag-stats.test.ts        # ジャンル別統計テスト
    result-storage.test.ts   # localStorage 保存テスト
    study-question-pool.test.ts  # 勉強会モード問題プールテスト
    useGame.test.ts
    useCountdown.test.ts
    classify-engineer-type.test.ts
    answer-processing.test.ts
src/pages/AgileQuizSugorokuPage.tsx  # ページコンポーネント（全モード統合）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- カスタムフック（`useGame`, `useStudy`, `useCountdown`, `useFade`, `useKeys`）で関心を分離
- `useGame`: 通常ゲームモード（タグ別統計・不正解蓄積を含む）
- `useStudy`: 勉強会モード（タイマーなし学習・ジャンル別追跡）

### ゲームモード

| モード | 説明 |
|--------|------|
| 通常ゲーム | 3スプリント × 7イベント、制限時間15秒、技術的負債・緊急対応あり |
| 勉強会モード | ジャンル選択 → タイマーなし学習 → 即時解説表示 → 結果分析 |

### スプリント工程とジャンルの対応

| 工程 | 対応ジャンル |
|------|-------------|
| 計画 (planning) | スクラム、アジャイル、見積もり、バックログ |
| 実装 (impl1/impl2) | 設計原則、デザインパターン、データ構造、プログラミング |
| テスト (test1/test2) | テスト、コード品質、CI/CD |
| リファインメント | リファクタリング、コード品質、バックログ |
| レビュー | リリース、チーム、スクラム |
| 緊急対応 | インシデント、SRE |

### 使用技術

- **CSS Animation**: フェードイン/アウトエフェクト
- **Web Audio API**: 効果音・BGM
- **localStorage**: ゲーム結果の永続化（`aqs_last_result` キー）
- **コンボシステム**: 連続正解でボーナス
- **技術的負債イベント**: 不正解蓄積でペナルティ発生
- **スプリント管理**: ベロシティ計算、振り返り、エンジニアタイプ診断
- **ジャンル別分析**: 16ジャンルの正答率追跡・色分け表示・苦手判定

### 画像アセット

#### スタイルガイド

全画像は統一スタイルで制作:

- **画風**: フラットデザイン × かわいい（カワイイ）イラスト
- **タッチ**: クリーンなベクター調、丸みを帯びた柔らかいライン
- **キャラクター**: デフォルメされたかわいい動物キャラクター（猫エンジニア、犬PM、うさぎテスター）
- **色調**: ダークブルー背景（#060a12〜#0c1220）に映える鮮やかなアクセントカラー
- **テーマ**: アジャイル開発・ソフトウェアエンジニアリング
- **禁則**: テキスト、ウォーターマーク、署名は含めない

#### 画像一覧（22枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル背景 | 1 | `aqs_title.webp` | TitleScreen |
| スプリント開始 | 1 | `aqs_sprint_start.webp` | SprintStartScreen |
| イベントアイコン | 8 | `aqs_event_{id}.webp` | QuizScreen EventCard |
| 振り返り | 1 | `aqs_retro.webp` | RetrospectiveScreen |
| エンジニアタイプ | 6 | `aqs_type_{id}.webp` | ResultScreen TypeCard |
| グレード演出 | 1 | `aqs_grade_celebration.webp` | ResultScreen GradeCircle |
| ビルド成功 | 1 | `aqs_build_success.webp` | ResultScreen |
| フィードバック | 3 | `aqs_correct/incorrect/timeup.webp` | QuizScreen ResultBanner |

#### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/agile-quiz-sugoroku/images.ts` で一元管理
