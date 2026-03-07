# 技術詳細

## ファイル構成

```
src/features/agile-quiz-sugoroku/
  index.ts                  # barrel export
  types.ts                  # 型定義（GamePhase, TagStats, SavedGameResult, Achievement, Difficulty 等）
  constants.ts              # ゲーム設定定数・PHASE_GENRE_MAP・SPRINT_OPTIONS
  character-profiles.ts     # 5キャラクターのプロフィール定義
  character-reactions.ts    # キャラクターリアクション（状況別コメント・ヒント・タグマッピング）
  character-narrative.ts    # キャラクターナラティブ（スプリント開始/振り返り時の会話）
  team-classifier.ts        # チームタイプ判定（6種類）
  save-manager.ts           # セーブ/ロード管理（localStorage）
  story-data.ts             # ストーリーデータ（8スプリント分）
  ending-data.ts            # エンディングデータ（共通 + 6エピローグ）
  character-genre-map.ts    # キャラクター×ジャンルマッピング
  combo-color.ts            # コンボ別カラー・段階設定
  game-logic.ts             # ゲームロジック（純粋関数）
  tag-stats.ts              # ジャンル別統計ユーティリティ
  result-storage.ts         # localStorage 保存・読込
  achievements.ts           # 実績定義（20個）+ 判定ロジック
  achievement-storage.ts    # 実績の localStorage 管理
  difficulty.ts             # 難易度設定（4段階）+ グレード計算ボーナス
  history-storage.ts        # 履歴保存（最大10件、マイグレーション対応）
  challenge-storage.ts      # チャレンジモードのハイスコア保存
  daily-quiz.ts             # デイリークイズ（日付シード選出・結果保存・ストリーク）
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
    useChallenge.ts         # チャレンジモード状態管理フック（1ミス即終了）
    useCountdown.ts         # カウントダウンタイマー
    useFade.ts              # フェードアニメーション
    useKeys.ts              # キーボード入力
    index.ts                # barrel export
  components/
    TitleScreen.tsx          # タイトル画面（前回結果・セーブ再開・実績/履歴/チャレンジ/デイリーボタン）
    SprintStartScreen.tsx    # スプリント開始画面（キャラクターナラティブ付き）
    QuizScreen.tsx           # クイズ画面（すごろくボード・キャラリアクション・コンボ演出・タイマー演出）
    StoryScreen.tsx          # ストーリー画面（ノベルゲーム風演出）
    RetrospectiveScreen.tsx  # 振り返り画面（キャラクターナラティブ付き）
    ResultScreen.tsx         # 結果画面（グレード発表演出・チームタイプ・ジャンル分析・SNSシェア）
    StudySelectScreen.tsx    # 勉強会モード - ジャンル選択画面（キャラ絞り込み対応）
    StudyScreen.tsx          # 勉強会モード - 学習画面
    StudyResultScreen.tsx    # 勉強会モード - 学習結果画面
    GuideScreen.tsx          # 遊び方 & チーム紹介ガイド画面
    SugorokuBoard.tsx        # すごろくボードUI（経路表示・コマ移動）
    CharacterReaction.tsx    # キャラクターリアクション表示（3体常時表示・吹き出し）
    ComboEffect.tsx          # コンボ段階別エフェクト表示
    FlashOverlay.tsx         # 正解/不正解/タイムアップ時のフラッシュオーバーレイ
    ScoreFloat.tsx           # スコア加算フロートテキスト
    DifficultySelector.tsx   # 難易度選択UI（4択ボタン）
    AchievementScreen.tsx    # 実績一覧画面（獲得済み/未獲得・レア度別色分け）
    AchievementToast.tsx     # 実績獲得時のトースト通知
    HistoryScreen.tsx        # 履歴画面（一覧 + 正答率/速度推移グラフ）
    LineChart.tsx            # SVG ベース折れ線グラフ（グラデーション領域付き）
    ChallengeResultScreen.tsx # チャレンジモード結果画面（記録表示・SNSシェア）
    DailyQuizScreen.tsx      # デイリークイズ画面（クイズ + 結果・ストリーク表示）
    BarChart.tsx             # 棒グラフ
    RadarChart.tsx           # レーダーチャート
    ParticleEffect.tsx       # パーティクルエフェクト
    index.ts                 # barrel export
    styles/
      animations.ts          # アニメーション（フラッシュ・バウンス・コンボ段階エフェクト等）
      common.ts              # 共通スタイル
      layout.ts              # レイアウト
      quiz.ts                # クイズスタイル
      result.ts              # 結果スタイル
      story.ts               # ストーリー画面スタイル
      index.ts               # barrel export
  audio/
    sound.ts                 # 効果音・BGM（コンボ切れ・ドラムロール・ファンファーレ・実績・ティック音等）
    audio-actions.ts         # オーディオアクション
  __tests__/                 # ユニットテスト（577テスト）
    answer-processing.test.ts
    character-genre-map.test.ts
    character-narrative.test.ts   # キャラクターナラティブテスト（16テスト）
    character-profiles.test.ts
    character-reactions.test.ts   # キャラクターリアクションテスト（26テスト）
    classify-engineer-type.test.ts
    classify-team-type.test.ts
    combo-effects.test.ts         # コンボエフェクトテスト（7テスト）
    components.test.tsx
    constants.test.ts
    daily-quiz.test.ts            # デイリークイズテスト（13テスト）
    difficulty.test.ts            # 難易度テスト（10テスト）
    ending-data.test.ts
    ending-phase.test.tsx
    game-logic.test.ts
    questions.test.ts
    result-storage.test.ts
    save-manager.test.ts
    story-data.test.ts
    story-screen.test.tsx
    study-question-pool.test.ts
    study-select-screen.test.tsx
    tag-stats.test.ts
    useCountdown.test.ts
    useGame.test.ts
    achievements.test.ts          # 実績テスト（24テスト）
    achievement-storage.test.ts   # 実績ストレージテスト（8テスト）
    challenge.test.ts             # チャレンジモードテスト（5テスト）
    history-storage.test.ts       # 履歴ストレージテスト（9テスト）
    phase1-components.test.tsx    # フェーズ1コンポーネントテスト（24テスト）
    phase2-components.test.tsx    # フェーズ2コンポーネントテスト（13テスト）
    sound-extensions.test.ts      # サウンド拡張テスト（6テスト）
src/pages/AgileQuizSugorokuPage.tsx  # ページコンポーネント（全モード統合）
```

## 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- カスタムフック（`useGame`, `useStudy`, `useChallenge`, `useCountdown`, `useFade`, `useKeys`）で関心を分離
- `useGame`: 通常ゲームモード（タグ別統計・不正解蓄積・セーブ/ロードを含む）
- `useStudy`: 勉強会モード（タイマーなし学習・ジャンル別追跡）
- `useChallenge`: チャレンジモード（1ミス即終了・ハイスコア管理）

## データ永続化（localStorage）

| キー | 用途 | 管理ファイル |
|------|------|-------------|
| `aqs_last_result` | 最新ゲーム結果（レガシー互換） | `result-storage.ts` |
| `aqs_history` | プレイ履歴（最大10件） | `history-storage.ts` |
| `aqs_save_state` | セーブ/ロード | `save-manager.ts` |
| `aqs_achievements` | 実績進捗 | `achievement-storage.ts` |
| `aqs_challenge_high` | チャレンジモードハイスコア | `challenge-storage.ts` |
| `aqs_daily` | デイリークイズ日別結果 | `daily-quiz.ts` |

## 使用技術

- **CSS Animation**: フェードイン/アウト、フラッシュ、バウンス、シェイク、コンボ段階エフェクト
- **CSS Transition**: すごろくコマ移動、タイマー色変化
- **Web Audio API**: 効果音・BGM（コンボ切れ、ドラムロール、ファンファーレ、実績獲得、ティック音ピッチ変化）
- **localStorage**: ゲーム結果・履歴・実績・セーブ/ロード・チャレンジハイスコア・デイリー結果
- **SVG**: 折れ線グラフ（履歴画面）、レーダーチャート（結果画面）
- **コンボシステム**: 連続正解でボーナス + 段階的演出
- **技術的負債イベント**: 不正解蓄積でペナルティ発生
- **スプリント管理**: ベロシティ計算、振り返り、チームタイプ判定
- **ジャンル別分析**: 16ジャンルの正答率追跡・色分け表示・苦手判定
- **ストーリー演出**: フェードイン表示、スキップ機能、背景画像切り替え
- **アクセシビリティ**: `prefers-reduced-motion` 対応（全アニメーション無効化可能）
- **日付シード乱数**: xorshift32 アルゴリズムによるデイリークイズの再現可能なランダム選出

## 画像アセット

### スタイルガイド

全画像は統一スタイルで制作:

- **画風**: フラットデザイン × かわいい（カワイイ）イラスト
- **タッチ**: クリーンなベクター調、丸みを帯びた柔らかいライン
- **キャラクター**: デフォルメされたかわいい動物キャラクター（タカ、イヌ、ペンギン、ネコ、ウサギ）
- **色調**: ダークブルー背景（#060a12〜#0c1220）に映える鮮やかなアクセントカラー
- **テーマ**: アジャイル開発・ソフトウェアエンジニアリング
- **禁則**: テキスト、ウォーターマーク、署名は含めない

### 画像一覧（37枚 + キャラクター7枚）

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
| キャラクター | 7 | `aqs_char_{id}.webp` | GuideScreen・ストーリー・リアクション |

### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/agile-quiz-sugoroku/images.ts` で一元管理
