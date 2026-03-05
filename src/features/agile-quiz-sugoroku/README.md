# Agile Quiz Sugoroku（アジャイル・クイズ・すごろく）

## 概要

アジャイル開発・スクラムに関するクイズに答えてすごろくを進む教育ゲーム。
1〜8スプリントを選択して走破し、スコアとベロシティからチームタイプを判定。
技術的負債が溜まると緊急対応イベントが発生するリアルなスプリント体験。

### 主な特徴

- **全306問 + 解説付き**: 各問題に1-2文の簡潔な解説を収録
- **16ジャンルのタグシステム**: スクラム、テスト、設計原則、CI/CD など幅広い領域をカバー
- **ジャンル別成績分析**: 結果画面でジャンルごとの正答率を色分け表示、苦手ジャンルを可視化
- **不正解問題レビュー**: 間違えた問題を解説・正解と共に振り返り
- **ストーリー機能**: スプリント間にノベルゲーム風演出でチームの成長物語を体験
- **エンディングストーリー**: チームタイプ別のエピローグで物語を締めくくる
- **セーブ/ロード機能**: スプリント間で中断・再開が可能
- **勉強会モード**: タイマーなしでジャンルを選んでじっくり学習。キャラクター別ジャンル絞り込み対応
- **イベント別背景画像**: シーンに応じた背景画像のフェード切り替え演出
- **ゲーム結果の保存**: localStorage に自動保存、タイトル画面で前回結果を表示
- **遊び方 & チーム紹介ガイド**: ルール、スコアリング、工程×ジャンル対応表、チームタイプ図鑑

## キャラクタープロフィール

ゲーム内の画像やストーリー、ガイド画面に登場する5キャラクター:

| キャラ | 名前 | 役職 | テーマカラー | 決め台詞 |
|--------|------|------|-------------|---------|
| 🦅 オオタカ | タカ | ビジネスオーナー | 黄 (#f0b040) | 「このプロダクト、市場で翔べるか？鋭く見極めるぞ！」 |
| 🐶 ビーグル犬 | イヌ | プロダクトオーナー | 緑 (#34d399) | 「よし、今日のデイリーは15分で終わらせるワン！」 |
| 🐧 アデリーペンギン | ペンギン | スクラムマスター | 青 (#4FC3F7) | 「みんなで一緒に進めば、どんな嵐も乗り越えられるペン！」 |
| 🐱 オレンジ三毛猫 | ネコ | フルスタックエンジニア | 青 (#4d9fff) | 「にゃるほど、こう書けばキレイに動くにゃ！」 |
| 🐰 白うさぎ | ウサギ | QAエンジニア | シアン (#22d3ee) | 「このエッジケース、見逃してないぴょん？」 |

詳細プロフィールは `character-profiles.ts` に定義。ガイド画面の TEAM セクションで確認可能。

## 操作方法

- **マウスクリック**: 選択肢を選択
- **キーボード**: A/B/C/D または 1/2/3/4 で選択、Enter/Space で次へ
- **ストーリー画面**: Enter/Space で次の行へ、Escape でスキップ

## 技術詳細

### ファイル構成

```
src/features/agile-quiz-sugoroku/
  index.ts                  # barrel export
  types.ts                  # 型定義（GamePhase, TagStats, SavedGameResult 等）
  constants.ts              # ゲーム設定定数・PHASE_GENRE_MAP・SPRINT_OPTIONS
  character-profiles.ts     # 5キャラクターのプロフィール定義
  team-classifier.ts        # チームタイプ判定（6種類）
  save-manager.ts           # セーブ/ロード管理（localStorage）
  story-data.ts             # ストーリーデータ（8スプリント分）
  ending-data.ts            # エンディングデータ（共通 + 6エピローグ）
  character-genre-map.ts    # キャラクター×ジャンルマッピング
  combo-color.ts            # コンボ別カラー設定
  game-logic.ts             # ゲームロジック（純粋関数）
  tag-stats.ts              # ジャンル別統計ユーティリティ
  result-storage.ts         # localStorage 保存・読込
  study-question-pool.ts    # 勉強会モード問題プール構築
  quiz-data.ts              # 互換エクスポート（questions/を再公開）
  engineer-classifier.ts    # エンジニアタイプ判定（レガシー互換）
  answer-processor.ts       # 回答処理ロジック
  images.ts                 # 画像アセット一元管理
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
    TitleScreen.tsx          # タイトル画面（前回結果表示・セーブデータ再開）
    SprintStartScreen.tsx    # スプリント開始画面
    QuizScreen.tsx           # クイズ画面（ジャンルタグ表示・解説表示）
    StoryScreen.tsx          # ストーリー画面（ノベルゲーム風演出）
    RetrospectiveScreen.tsx  # 振り返り画面（総合スコア表示）
    ResultScreen.tsx         # 結果画面（チームタイプ・ジャンル分析・不正解レビュー）
    StudySelectScreen.tsx    # 勉強会モード - ジャンル選択画面（キャラ絞り込み対応）
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
      story.ts               # ストーリー画面スタイル
      index.ts               # barrel export
  audio/
    sound.ts                 # 効果音・BGM
    audio-actions.ts         # オーディオアクション
  __tests__/                 # ユニットテスト（391テスト）
    answer-processing.test.ts
    character-genre-map.test.ts
    character-profiles.test.ts
    classify-engineer-type.test.ts
    classify-team-type.test.ts
    components.test.tsx
    constants.test.ts
    ending-data.test.ts
    ending-phase.test.tsx
    game-logic.test.ts
    questions.test.ts        # 問題データ構造・解説・タグ検証
    result-storage.test.ts   # localStorage 保存テスト
    save-manager.test.ts     # セーブ/ロード機能テスト
    story-data.test.ts       # ストーリーデータ検証
    story-screen.test.tsx    # ストーリー画面コンポーネントテスト
    study-question-pool.test.ts  # 勉強会モード問題プールテスト
    study-select-screen.test.tsx # 勉強会ジャンル選択画面テスト
    tag-stats.test.ts        # ジャンル別統計テスト
    useCountdown.test.ts
    useGame.test.ts
src/pages/AgileQuizSugorokuPage.tsx  # ページコンポーネント（全モード統合）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- カスタムフック（`useGame`, `useStudy`, `useCountdown`, `useFade`, `useKeys`）で関心を分離
- `useGame`: 通常ゲームモード（タグ別統計・不正解蓄積・セーブ/ロードを含む）
- `useStudy`: 勉強会モード（タイマーなし学習・ジャンル別追跡）

### ゲームモード

| モード | 説明 |
|--------|------|
| 通常ゲーム | 1〜8スプリント（選択可能）× 7イベント、制限時間15秒、技術的負債・緊急対応あり |
| 勉強会モード | ジャンル選択（キャラクター別絞り込み対応）→ タイマーなし学習 → 即時解説表示 → 結果分析 |

#### 勉強会モード — キャラクター別ジャンル絞り込み

キャラクターを選ぶと、そのキャラクターの専門分野に関連するジャンルが自動で選択されます。

| キャラ | 役職 | 関連ジャンル |
|--------|------|-------------|
| 🦅 タカ | ビジネスオーナー | アジャイル、スクラム、チーム、リリース |
| 🐶 イヌ | プロダクトオーナー | スクラム、バックログ、見積もり、アジャイル |
| 🐧 ペンギン | スクラムマスター | スクラム、アジャイル、チーム、見積もり |
| 🐱 ネコ | フルスタックエンジニア | 設計原則、デザインパターン、プログラミング、データ構造、リファクタリング |
| 🐰 ウサギ | QAエンジニア | テスト、コード品質、CI/CD、SRE、インシデント |

### チームタイプ判定

ゲーム結果から6種類のチームタイプを判定:

| タイプ | 名前 | 判定条件の概要 |
|--------|------|---------------|
| 🌟 | シナジーチーム | 高い安定性・低負債・高正答率 |
| 🔥 | レジリエントチーム | 緊急対応を複数回成功 |
| 📈 | 成長するチーム | スプリントを重ねるごとに改善 |
| ⚡ | アジャイルチーム | 素早い回答速度と安定した正答率 |
| 💪 | もがくチーム | 技術的負債が高いが前進 |
| 🌱 | 結成したてのチーム | チーム形成途上（デフォルト） |

### ストーリー機能

スプリント間にノベルゲーム風のストーリーが挿入され、5人のキャラクターによるチームの成長物語を体験できます。

- 全8話構成（スプリント数に応じて表示話数が変化）
- キャラクターの台詞とナレーションによる演出
- スプリント背景画像のフェードイン表示
- Enter/Space で進行、Escape でスキップ可能

#### エンディングストーリー

最終スプリント後に、共通パート + チームタイプ別エピローグが再生されます。

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
- **localStorage**: ゲーム結果の永続化（`aqs_last_result` キー）、セーブ/ロード（`aqs_save_state` キー）
- **コンボシステム**: 連続正解でボーナス
- **技術的負債イベント**: 不正解蓄積でペナルティ発生
- **スプリント管理**: ベロシティ計算、振り返り、チームタイプ判定
- **ジャンル別分析**: 16ジャンルの正答率追跡・色分け表示・苦手判定
- **ストーリー演出**: フェードイン表示、スキップ機能、背景画像切り替え
- **背景画像切り替え**: イベント別フェード演出（オフィス、計画、開発、緊急、振り返り）

### 画像アセット

#### スタイルガイド

全画像は統一スタイルで制作:

- **画風**: フラットデザイン × かわいい（カワイイ）イラスト
- **タッチ**: クリーンなベクター調、丸みを帯びた柔らかいライン
- **キャラクター**: デフォルメされたかわいい動物キャラクター（タカ、イヌ、ペンギン、ネコ、ウサギ）
- **色調**: ダークブルー背景（#060a12〜#0c1220）に映える鮮やかなアクセントカラー
- **テーマ**: アジャイル開発・ソフトウェアエンジニアリング
- **禁則**: テキスト、ウォーターマーク、署名は含めない

#### 画像一覧（37枚 + キャラクター7枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル背景 | 1 | `aqs_title.webp` | TitleScreen |
| スプリント開始 | 1 | `aqs_sprint_start.webp` | SprintStartScreen |
| イベントアイコン | 8 | `aqs_event_{id}.webp` | QuizScreen EventCard |
| 振り返り | 1 | `aqs_retro.webp` | RetrospectiveScreen |
| チームタイプ | 6 | `aqs_type_{id}.webp` | ResultScreen TypeCard |
| グレード演出 | 1 | `aqs_grade_celebration.webp` | ResultScreen GradeCircle |
| ビルド成功 | 1 | `aqs_build_success.webp` | ResultScreen |
| フィードバック | 3 | `aqs_correct/incorrect/timeup.webp` | QuizScreen ResultBanner |
| ストーリー | 8 | `aqs_story_{01-08}.webp` | StoryScreen |
| エンディング | 2 | `aqs_ending_common/epilogue.webp` | エンディング画面 |
| 背景 | 5 | `aqs_bg_{id}.webp` | 各画面の背景演出 |
| キャラクター | 7 | `aqs_char_{id}.webp` | GuideScreen・ストーリー・エンディング |

#### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/agile-quiz-sugoroku/images.ts` で一元管理
