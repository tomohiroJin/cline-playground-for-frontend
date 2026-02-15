# Agile Quiz Sugoroku - 画像追加 タスクチェックリスト

## Phase 1: ドキュメント作成 + ブランチ作成

- [x] Git ブランチ `feat/aqs-images` 作成
- [x] `.docs/aqs-20260215-01/plan.md` 作成
- [x] `.docs/aqs-20260215-01/spec.md` 作成（全 22 枚の AI 生成プロンプト含む）
- [x] `.docs/aqs-20260215-01/tasks.md` 作成（本ファイル）
- [x] `src/features/agile-quiz-sugoroku/README.md` にスタイルガイドセクション追加

## Phase 2: 画像アセット配置

- [x] AI で 22 枚の画像を生成
  - [x] `aqs_title.webp` — タイトル背景（1024×512px）
  - [x] `aqs_sprint_start.webp` — スプリント開始装飾（1024×512px）
  - [x] `aqs_event_planning.webp` — プランニングアイコン（512×512px）
  - [x] `aqs_event_impl1.webp` — 実装1アイコン（512×512px）
  - [x] `aqs_event_test1.webp` — テスト1アイコン（512×512px）
  - [x] `aqs_event_refinement.webp` — リファインメントアイコン（512×512px）
  - [x] `aqs_event_impl2.webp` — 実装2アイコン（512×512px）
  - [x] `aqs_event_test2.webp` — テスト2アイコン（512×512px）
  - [x] `aqs_event_review.webp` — レビューアイコン（512×512px）
  - [x] `aqs_event_emergency.webp` — 緊急対応アイコン（512×512px）
  - [x] `aqs_retro.webp` — 振り返り背景（1024×512px）
  - [x] `aqs_type_stable.webp` — 安定運用型（512×512px）
  - [x] `aqs_type_firefighter.webp` — 火消し職人（512×512px）
  - [x] `aqs_type_growth.webp` — 成長曲線型（512×512px）
  - [x] `aqs_type_speed.webp` — 高速レスポンス（512×512px）
  - [x] `aqs_type_debt.webp` — 技術的負債型（512×512px）
  - [x] `aqs_type_default.webp` — デフォルト型（512×512px）
  - [x] `aqs_grade_celebration.webp` — グレード演出（512×512px）
  - [x] `aqs_build_success.webp` — ビルド成功演出（1024×512px）
  - [x] `aqs_correct.webp` — 正解フィードバック（512×512px）
  - [x] `aqs_incorrect.webp` — 不正解フィードバック（512×512px）
  - [x] `aqs_timeup.webp` — タイムアップフィードバック（512×512px）
- [x] WebP 形式（品質 82%）で書き出し
- [x] 各ファイル 300KB 以下を確認
- [x] `src/assets/images/` に全画像を配置

## Phase 3: コード実装

### 3-1. 画像管理モジュール

- [x] `src/features/agile-quiz-sugoroku/images.ts` 作成
  - [x] 22 枚の import 文
  - [x] `AQS_IMAGES` 定数オブジェクト（カテゴリ別ネスト構造）
  - [x] `as const` アサーション

### 3-2. 型定義・定数更新

- [x] `types.ts` — `EngineerType` に `id: string` フィールド追加
- [x] `constants.ts` — `ENGINEER_TYPES` 各要素に `id` 追加
  - [x] `stable` — 安定運用型エンジニア
  - [x] `firefighter` — 火消し職人エンジニア
  - [x] `growth` — 成長曲線型エンジニア
  - [x] `speed` — 高速レスポンスエンジニア
  - [x] `debt` — 技術的負債と共に生きる人
  - [x] `default` — 無難に回すエンジニア

### 3-3. TitleScreen.tsx

- [x] `AQS_IMAGES` import 追加
- [x] 背景画像レイヤー追加（opacity: 0.15, blur: 2px）

### 3-4. SprintStartScreen.tsx

- [x] `AQS_IMAGES` import 追加
- [x] パネル上部に装飾画像追加（opacity: 0.3）

### 3-5. QuizScreen.tsx

- [x] `AQS_IMAGES` import 追加
- [x] `imgError` state 追加
- [x] EventIcon を画像/絵文字の条件分岐に変更
- [x] フィードバック画像（correct/incorrect/timeup）追加
- [x] `onError` フォールバック実装

### 3-6. RetrospectiveScreen.tsx

- [x] `AQS_IMAGES` import 追加
- [x] 背景装飾画像レイヤー追加（opacity: 0.12, blur: 2px）

### 3-7. ResultScreen.tsx

- [x] `AQS_IMAGES` import 追加
- [x] `typeImgError` state 追加
- [x] TypeEmoji を画像/絵文字の条件分岐に変更
- [x] GradeCircle 背後にグレード演出画像追加
- [x] BuildSuccess 付近にビルド成功画像追加
- [x] 全画像に `onError` フォールバック実装

## Phase 4: 検証

- [x] `npm test -- --run` 全テスト通過
- [x] `npm run build` ビルド成功
- [x] ブラウザ確認: TitleScreen 背景画像表示
- [x] ブラウザ確認: SprintStartScreen 装飾画像表示
- [x] ブラウザ確認: QuizScreen イベントアイコン画像表示
- [x] ブラウザ確認: QuizScreen フィードバック画像表示
- [x] ブラウザ確認: RetrospectiveScreen 背景装飾表示
- [x] ブラウザ確認: ResultScreen エンジニアタイプ画像表示
- [x] ブラウザ確認: ResultScreen グレード演出画像表示
- [x] ブラウザ確認: ResultScreen ビルド成功画像表示
- [x] フォールバック確認: 画像削除時に絵文字が表示されること

## Phase 5: バグ修正（HMR フルリロードループ）

画像モジュール 22 枚追加によりモジュールグラフが拡大し、`publicPath: 'auto'` と `runtimeChunk: 'single'` の組み合わせで HMR が失敗→フルリロードをループする問題が発生。

- [x] `webpack.config.ts` — `publicPath: 'auto'` → `publicPath: '/'` に変更
- [x] `src/styles/GlobalStyle.ts` — `transition: background 0.5s ease` を削除（リロード時のフラッシュ増幅を解消）
- [x] `npm run build` ビルド成功を確認
- [x] `npm test` 全 103 スイート / 1272 テスト通過を確認
