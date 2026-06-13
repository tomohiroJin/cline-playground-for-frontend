# Agile Quiz Sugoroku ブラッシュアップ 設計ドキュメント

- 作成日: 2026-06-13
- 対象: `src/features/agile-quiz-sugoroku/`
- 種別: 機能追加・コンテンツ拡充・UI/UX 品質向上（挙動変更を含む）
- 進め方: 3 領域を 1 spec に統合し、基盤 → コンテンツ → 機能・演出 の 3 フェーズで実装

## 1. 背景と目的

AQS は 2026-06 の構造統一リファクタリング（PR #105〜#110）で
`domain / infrastructure / presentation` の 3 層構造が確立した。
土台が整ったため、本 spec ではプロダクト価値の向上に取り組む。目的は 3 つ。

1. **問題追加** — クイズコンテンツのタグ分布の偏りを是正し、学習価値と出題バランスを高める
2. **機能ブラッシュアップ** — 学習ゲームとして不足している機能（復習・サウンド設定・アクセシビリティ・解説）を補う
3. **UI/UX 品質向上** — デザイントークン統一・レスポンシブ・視覚的洗練・画面間の一貫性

### 現状の課題（調査結果）

- **タグ分布の偏り**: 全 366 問中、`testing` 79 / `scrum` 54 / `backlog` 48 に対し、
  `design-patterns` 8 / `agile` 10 / `ci-cd` 11 / `data-structures` 14 / `estimation` 15 と下位タグが手薄
  （※ `doc/quiz-content.md` には「306 問」とあり実データと乖離。本対応で更新する）
- **復習導線の欠如**: 誤答は結果画面の `IncorrectReview` で表示されるのみ。再出題・ブックマークがない
- **サウンド設定の欠如**: タイマーのティック音等があるが、ユーザーがミュートする UI がない
  （`prefers-reduced-motion` は 7 コンポーネントで尊重済み）
- **アクセシビリティが薄い**: 51 個の tsx 中 `aria-`/`role` 使用は 5 ファイルのみ
- **インライン style の多用**: `DESIGN_TOKENS` が整備済みにもかかわらず `style={{...}}` 直書きが多く一貫性が崩れている
- **レスポンシブが部分的**: `@media` 使用は 51 tsx 中 7 ファイルのみ

## 2. 設計方針と前提

### 2.1 既存パターンの踏襲

- ストレージは `Repository + StoragePort` パターン（`HistoryRepository` 等）に揃える
- 公開 API は `index.ts` の名前付きエクスポートのみ。新規シンボルもここから公開
- 依存方向は `domain → なし` / `infrastructure → ports` / `presentation → domain・infrastructure` を厳守
- `architecture.test.ts` の 4 ガード（ルート直下許可リスト・旧パス禁止・Page の深いインポート禁止・presentation 直下構造）を維持。新パスは許可リストへ追記

### 2.2 重要な設計判断：問題の同定キー

`Question` 型に `id` フィールドは存在しない（`question/options/answer/tags?/explanation?` のみ）。
366 問への一括 `id` 付与は大規模・高リスクなため、**復習・ブックマークの永続化は問題文ベースの安定キーを採用する**。

- 同定キー = 問題文文字列（`question`）。`makeQuestionKey(question: Question): string` をドメインに置き、将来差し替え可能にする
- 永続データは「キー + 表示用メタ（問題文・選択肢・正解・タグ・解説）」のスナップショットを保持し、
  問題データの後日改変に対しても表示が壊れないようにする（参照ではなくコピーで持つ）

## 3. Phase 1：基盤（横断作業）

後続フェーズが乗る土台を最初に固める。視覚的挙動は原則変えない（1-C のトグル追加を除く）。

### 3.1 デザイントークン統一（1-A）

- 対象: インライン `style={{...}}` 直書きで `DESIGN_TOKENS` を使っていないコンポーネント（`IncorrectReview` 他）
- 方針: `spacing` / `borderRadius` / `fontSize` / `colors` / `transition` トークンへの参照に置換
- styled-components への全面移行は**スコープ外**（YAGNI）。既存の混在スタイル様式は維持し、値だけトークンに寄せる
- 完了基準: 対象コンポーネントのマジックナンバー（px・色リテラル）がトークン参照に置換され、視覚回帰がない

### 3.2 アクセシビリティ強化（1-B）

| 対象 | 対応 |
|------|------|
| 選択肢ボタン | `role="radiogroup"` / 各選択肢に `aria-label`、正誤確定後の状態を `aria-live="polite"` で通知 |
| タイマー | 残り時間を `aria-live` で通知（毎秒ではなく区切り＝残り 10/5/0 秒等のみ。過剰読み上げ回避） |
| スコア・コンボ | 更新を `aria-live="polite"` 領域で通知 |
| フォーカス | `:focus-visible` でフォーカスリングを可視化。キーボード操作可能要素を網羅 |

- WCAG 2.1 AA を目標。コントラスト比は視覚的洗練（3-C）の 60-30-10 点検とあわせて確認
- 既存のキーボード操作（A/B/C/D・1/2/3/4・Enter/Space）の動作は維持

### 3.3 サウンド設定（1-C）

- **新規 `SettingsRepository`**（`infrastructure/storage/settings-repository.ts`）
  - キー: `aqs_settings`、型: `{ soundEnabled: boolean }`（デフォルト `true`）
  - `load()` / `save(settings)` / `setSoundEnabled(enabled)` を提供
- **audio-port 層でゲート**: `soundEnabled=false` のとき発音をスキップ（既存 `silent-audio-adapter` の仕組みを活用、もしくは port 実装内で early return）
- **UI**: タイトル画面にサウンド ON/OFF トグルを追加。状態は永続化し起動時に復元
- 音量スライダーは**スコープ外**（ON/OFF のみ。Tone.js の音量制御は将来課題）

## 4. Phase 2：コンテンツ

### 4.1 問題追加（2-A）

下位タグを底上げし、約 +79 問を追加する。各タグは対応する工程カテゴリのファイルへ投入。

| タグ | 現状 | 目標 | 追加 | 投入先ファイル |
|------|------|------|------|----------------|
| design-patterns | 8 | 25 | +17 | impl1 / impl2 |
| agile | 10 | 25 | +15 | planning |
| ci-cd | 11 | 25 | +14 | test1 / test2 |
| data-structures | 14 | 24 | +10 | impl1 / impl2 |
| estimation | 15 | 24 | +9 | planning |
| programming | 17 | 24 | +7 | impl1 / impl2 |
| refactoring | 17 | 24 | +7 | refinement |

- 既存 JSON フォーマット（`question` / `options`（4 択） / `answer`（0-3） / `tags` / `explanation`）に準拠
- 工程とジャンルの対応（`doc/quiz-content.md`）を尊重して投入先を決める
- 品質基準: 1 問 = 1 論点、選択肢は紛らわしすぎない、解説は「なぜ正解か」を含む
- 完了基準: `questions.test.ts` の検証（配列・スキーマ・`answer` 範囲・タグ妥当性・重複チェック）を全通過

### 4.2 解説の充実（2-B、関連タグ表示のみ）

- 解説の下に、その問題の `tags` を**関連タグチップ**として表示（外部 URL は追加しない）
- 表示箇所: 結果画面の `IncorrectReview`、勉強会モード、復習モード（3-A）
- チップはクリックでそのタグの復習へ繋ぐ導線にする（3-A と接続。Phase 3 で結線）
- 解説が 1 文のみで「なぜ」が弱い問題を 2〜4 文へ補強（データ修正。新規 +79 問および既存の手薄な解説が対象）
- タグ表示名は既存 `TAG_MAP`（`tag-master.ts`）を使用

## 5. Phase 3：機能・演出

### 5.1 復習モード（3-A、新フィーチャー）

学習ゲームとして最大の伸びしろ。誤答とブックマークを蓄積し、タイマーなしで再出題する。

#### データ層

- **新規 `WrongAnswerRepository`**（`aqs_wrong_answers`）
  - 誤答問題のスナップショット（キー + 問題文・選択肢・正解・タグ・解説）を保存
  - 回答評価フロー（クイズ・チャレンジ・デイリー）で誤答時に記録
  - 正解で該当エントリを除去（克服の可視化）。上限件数を設け古いものから削除
- **新規 `BookmarkRepository`**（`aqs_bookmarks`）
  - 問題のブックマークをスナップショットで保存。トグルで追加・削除

#### ドメイン層

- `makeQuestionKey(question)` — 同定キー生成（2.2）
- 復習対象の問題プールを組み立てるロジック（誤答 / ブックマーク / タグ別）。
  既存の `study-question-pool.ts` の構造を参考に `review-question-pool.ts` を追加

#### プレゼンテーション層

- `GamePhase` に `'review-select' | 'review'` を追加
- **復習選択画面**（`ReviewSelectScreen`）: 「誤答から復習」「ブックマークから復習」「タグ別復習」を選択
- **復習画面**: タイマーなしで再出題し即時解説。勉強会モード（`StudyScreen` / `useStudy`）の仕組みを再利用
- クイズ画面・結果画面に**ブックマークボタン**を追加
- タイトル画面に復習モードへの入口を追加

#### 状態遷移

```
title → review-select → review → (結果/タイトルへ戻る)
```

### 5.2 レスポンシブ / モバイル（3-B）

- 対象: Title / Quiz / Result / Story を中心に主要画面
- スマホ幅（〜480px）で検証し `@media` を追加。タップ領域 44px 以上、文字サイズとすごろくボード縮尺を調整
- 既存の `@media (prefers-reduced-motion)` 群とは別軸（ビューポート幅）の追加

### 5.3 視覚的洗練（3-C）

- 配色の 60-30-10 ルール点検（背景 60 / サーフェス・主要 30 / アクセント 10）
- 余白リズムを `spacing` トークンに統一（1-A の成果を活用）
- ホバー・遷移のマイクロインタラクションを磨く。`prefers-reduced-motion` 尊重は維持
- タイポグラフィスケールを `fontSize` トークンに揃える

## 6. テスト・検証戦略

### 6.1 TDD

- 各 Repository（Settings / WrongAnswer / Bookmark）はテスト先行。`in-memory-storage-adapter` を用いた単体テスト
- ドメインロジック（`makeQuestionKey`・`review-question-pool`）はテスト先行
- 問題追加は `questions.test.ts` で保証（スキーマ・重複・タグ妥当性）
- 新規コンポーネントは `@testing-library/react` でレンダリング・操作テスト

### 6.2 ガードレール

- `architecture.test.ts` の 4 ガードを維持。新規 presentation パスは許可リストへ追記
- アクセシビリティは可能な範囲で `jest-axe` 相当の検証、または `getByRole` ベースのテストで担保

### 6.3 各フェーズ完了時

- `npm run ci`（lint:ci → typecheck → test:coverage → build）を全通過
- カバレッジ目標: 新規コード 80%+、ドメインロジック 90%+

### 6.4 PR 分割

- フェーズ単位で 3 PR を想定（Phase 1 基盤 / Phase 2 コンテンツ / Phase 3 機能・演出）
- 各 PR は単独で CI を通せる単位

## 7. スコープ外（明示）

- 問題への `id` フィールド一括付与（同定キーで代替）
- styled-components への全面移行（値のトークン化に留める）
- 音量スライダー（ON/OFF トグルのみ）
- 解説への外部 URL・参考リンク追加（関連タグ表示のみ）
- 上位タグ（testing/scrum 等）の問題削減・再分類
- 新ゲームモードの追加（復習モードは既存学習モードの仕組みを再利用）

## 8. ドキュメント更新

- `doc/quiz-content.md`: 問題総数（306 → 実数）とカテゴリ別・タグ別問題数を更新
- `doc/game-design.md`: 復習モード・サウンド設定を追記、`GamePhase` 表に新フェーズ追加
- `doc/effects-and-ui.md`: デザイントークン統一・アクセシビリティ方針を追記
- `README.md`: 必要に応じてモード一覧を更新
