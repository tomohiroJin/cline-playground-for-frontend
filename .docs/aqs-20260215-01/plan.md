# Agile Quiz Sugoroku - 画像追加 実装計画

## 概要

Agile Quiz Sugoroku に計 22 枚のかわいいイラスト画像を追加し、視覚的な魅力を向上させる。
Labyrinth Echo で確立された画像管理パターン（`images.ts` 一元管理、WebP 形式、README スタイルガイド）を踏襲する。

## ブランチ

`feat/aqs-images`（`main` から分岐）

## フェーズ構成

### Phase 1: ドキュメント作成 + ブランチ作成

| タスク | 成果物 |
|---|---|
| Git ブランチ作成 | `feat/aqs-images` |
| 実装計画 | `.docs/aqs-20260215-01/plan.md`（本ファイル） |
| 仕様書 | `.docs/aqs-20260215-01/spec.md` |
| タスクリスト | `.docs/aqs-20260215-01/tasks.md` |
| README 更新 | `src/features/agile-quiz-sugoroku/README.md` にスタイルガイド追加 |

### Phase 2: 画像アセット配置（AI 生成後）

| タスク | 詳細 |
|---|---|
| 画像配置 | 22 枚の WebP を `src/assets/images/` に配置 |
| サイズ検証 | 各ファイル 300KB 以下を確認 |

### Phase 3: コード実装

| タスク | 対象ファイル | 変更内容 |
|---|---|---|
| 画像一元管理モジュール | `images.ts`（新規） | `AQS_IMAGES` 定数をエクスポート |
| 型定義更新 | `types.ts` | `EngineerType` に `id` フィールド追加 |
| 定数更新 | `constants.ts` | 各 `ENGINEER_TYPES` に `id` を付与 |
| タイトル画面 | `TitleScreen.tsx` | 背景画像（opacity 低 + blur） |
| スプリント開始画面 | `SprintStartScreen.tsx` | 装飾画像 |
| クイズ画面 | `QuizScreen.tsx` | イベントアイコン画像 + フィードバック画像 |
| 振り返り画面 | `RetrospectiveScreen.tsx` | 背景装飾画像 |
| 結果画面 | `ResultScreen.tsx` | エンジニアタイプ画像 + グレード演出 + ビルド成功画像 |

### Phase 4: 検証

| タスク | コマンド |
|---|---|
| テスト | `npm test -- --run` |
| ビルド | `npm run build` |
| ブラウザ確認 | 全 5 画面の表示・フォールバック確認 |

## ファイル変更一覧

### 新規作成

| ファイル | 用途 |
|---|---|
| `src/features/agile-quiz-sugoroku/images.ts` | 画像の一元管理 |
| `src/assets/images/aqs_*.webp` (22 枚) | 画像アセット |

### 変更

| ファイル | 変更内容 |
|---|---|
| `src/features/agile-quiz-sugoroku/types.ts` | `EngineerType.id` 追加 |
| `src/features/agile-quiz-sugoroku/constants.ts` | `ENGINEER_TYPES` に `id` 付与 |
| `src/features/agile-quiz-sugoroku/components/TitleScreen.tsx` | 背景画像統合 |
| `src/features/agile-quiz-sugoroku/components/SprintStartScreen.tsx` | 装飾画像統合 |
| `src/features/agile-quiz-sugoroku/components/QuizScreen.tsx` | イベント画像 + フィードバック画像統合 |
| `src/features/agile-quiz-sugoroku/components/RetrospectiveScreen.tsx` | 背景装飾統合 |
| `src/features/agile-quiz-sugoroku/components/ResultScreen.tsx` | タイプ画像 + グレード + ビルド成功統合 |
| `src/features/agile-quiz-sugoroku/README.md` | スタイルガイドセクション追加 |

### バグ修正（Phase 4 検証で発覚）

| ファイル | 変更内容 |
|---|---|
| `webpack.config.ts` | `publicPath: 'auto'` → `publicPath: '/'`（画像モジュール増加による HMR フルリロードループ修正） |
| `src/styles/GlobalStyle.ts` | `transition: background 0.5s ease` 削除（リロード時のフラッシュ増幅を解消） |

### 変更なし

| ファイル | 理由 |
|---|---|
| `components/styles/*.ts` | 必要に応じて Phase 3 で追加検討 |

## 技術方針

### 画像管理パターン（Labyrinth Echo 準拠）

```typescript
// src/features/agile-quiz-sugoroku/images.ts
import title from '../../assets/images/aqs_title.webp';
import eventPlanning from '../../assets/images/aqs_event_planning.webp';
// ...

export const AQS_IMAGES = {
  title,
  sprintStart,
  events: {
    planning: eventPlanning,
    impl1: eventImpl1,
    // ...
  },
  types: {
    stable: typeStable,
    firefighter: typeFirefighter,
    // ...
  },
  feedback: {
    correct: feedbackCorrect,
    incorrect: feedbackIncorrect,
    timeup: feedbackTimeup,
  },
  retro,
  gradeCelebration,
  buildSuccess,
} as const;
```

### 統合パターン

| パターン | 適用 | CSS |
|---|---|---|
| 背景画像 | TitleScreen, RetrospectiveScreen | `backgroundImage` + `opacity: 0.12-0.2` + `filter: blur(2px)` + gradient overlay |
| インライン画像 | QuizScreen EventCard, ResultBanner | `<img>` + `onError` フォールバック |
| カード画像 | ResultScreen TypeCard | 丸形 `overflow: hidden` + `objectFit: cover` |
| 演出画像 | ResultScreen GradeCircle, BuildSuccess | absolute 配置 + アニメーション |

### フォールバック戦略

全画像に絵文字フォールバックを実装:

```tsx
const [imgError, setImgError] = useState(false);

{!imgError ? (
  <img src={AQS_IMAGES.events[event.id]} onError={() => setImgError(true)} />
) : (
  <span>{event.ic}</span>
)}
```

## 画像一覧（22 枚）

| # | ファイル名 | カテゴリ | 推定サイズ | 用途 |
|---|---|---|---|---|
| 1 | `aqs_title.webp` | タイトル | ~60KB | TitleScreen 背景 |
| 2 | `aqs_sprint_start.webp` | スプリント | ~50KB | SprintStartScreen 装飾 |
| 3 | `aqs_event_planning.webp` | イベント | ~30KB | 📋 プランニング |
| 4 | `aqs_event_impl1.webp` | イベント | ~30KB | ⌨️ 実装（1回目） |
| 5 | `aqs_event_test1.webp` | イベント | ~30KB | 🧪 テスト（1回目） |
| 6 | `aqs_event_refinement.webp` | イベント | ~30KB | 🔧 リファインメント |
| 7 | `aqs_event_impl2.webp` | イベント | ~30KB | ⌨️ 実装（2回目） |
| 8 | `aqs_event_test2.webp` | イベント | ~30KB | ✅ テスト（2回目） |
| 9 | `aqs_event_review.webp` | イベント | ~30KB | 📊 スプリントレビュー |
| 10 | `aqs_event_emergency.webp` | イベント | ~35KB | 🚨 緊急対応 |
| 11 | `aqs_retro.webp` | 振り返り | ~50KB | RetrospectiveScreen 装飾 |
| 12 | `aqs_type_stable.webp` | タイプ | ~40KB | 🛡️ 安定運用型 |
| 13 | `aqs_type_firefighter.webp` | タイプ | ~40KB | 🔥 火消し職人 |
| 14 | `aqs_type_growth.webp` | タイプ | ~40KB | 📈 成長曲線型 |
| 15 | `aqs_type_speed.webp` | タイプ | ~40KB | ⚡ 高速レスポンス |
| 16 | `aqs_type_debt.webp` | タイプ | ~40KB | 💀 技術的負債と共に生きる人 |
| 17 | `aqs_type_default.webp` | タイプ | ~40KB | ⚙️ 無難に回す |
| 18 | `aqs_grade_celebration.webp` | グレード | ~45KB | グレード発表演出 |
| 19 | `aqs_build_success.webp` | ビルド | ~45KB | BUILD SUCCESS 演出 |
| 20 | `aqs_correct.webp` | フィードバック | ~25KB | 正解時バナー |
| 21 | `aqs_incorrect.webp` | フィードバック | ~25KB | 不正解時バナー |
| 22 | `aqs_timeup.webp` | フィードバック | ~25KB | タイムアップ時バナー |

推定合計: ~890KB

## エンジニアタイプ ID マッピング

| タイプ名 | 絵文字 | ID |
|---|---|---|
| 安定運用型エンジニア | 🛡️ | `stable` |
| 火消し職人エンジニア | 🔥 | `firefighter` |
| 成長曲線型エンジニア | 📈 | `growth` |
| 高速レスポンスエンジニア | ⚡ | `speed` |
| 技術的負債と共に生きる人 | 💀 | `debt` |
| 無難に回すエンジニア | ⚙️ | `default` |
