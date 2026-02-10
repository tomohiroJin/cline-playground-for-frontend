# Sprint Note Inc.1「Loop」実装計画（計画駆動）

## 概要

Sprint Note（スプリントノート）は、アジャイル開発の「計画→開発→リリース→レビュー→振り返り」サイクルを
テキストベースのシミュレーションゲームとして体験するプロダクトである。

Inc.1「Loop」では、**スプリントループが機械的に回るか** を検証する。
TDD を前提に、**先にテスト → 最小実装 → 確認** を繰り返す。

---

## Inc.1 の本質

> **Inc.1 は「ゲームとして面白いか」ではない。**
> **スプリントの 5 フェーズが破綻なく回り、テンポが成立するか** を検証するフェーズである。

技術的な実装完了ではなく、以下の体験が生まれているかが成功基準となる：

- 3 スプリントを通しプレイして「退屈しない」テンポか
- 選択に「考える余地」があるか（タスク選択・リリース判断・改善アクション）
- 結末テキストで「自分の選択が反映された」と感じるか
- 5〜8 分で 1 プレイ完結するか
- リプレイ時に「違うゴールでやってみよう」と思えるか

---

## 技術方針

- **TDD 優先**: 先にテスト → 実装 → リファクタ
- **RISK LCD と同じフィーチャーディレクトリパターン**
- 状態管理: `useReducer`（GameState + Action）
- スタイリング: styled-components（既存プロジェクトに合わせる）
- `any` 不使用、`null` は GameState 内のみ最小限
- 純粋ロジックは `src/features/sprint-note/utils/` に分離

---

## ファイル構成

```
src/
├── pages/
│   └── SprintNotePage.tsx          # ページラッパー（FullScreenWrap パターン）
├── features/
│   └── sprint-note/
│       ├── index.ts                # SprintNoteGame エクスポート
│       ├── types.ts                # 全型定義（GameState, Phase, Goal, Task 等）
│       ├── constants/
│       │   ├── index.ts            # 定数バレルエクスポート
│       │   ├── game-config.ts      # ゲーム基本設定（初期値、定数）
│       │   ├── tasks.ts            # タスクプール定義（Sprint 1-3）
│       │   ├── improvements.ts     # 改善アクション定義（6種）
│       │   ├── goals.ts            # ゴール定義（4種 + スコア算出関数）
│       │   └── texts.ts            # 全テキストテンプレート
│       ├── utils/
│       │   ├── index.ts            # ユーティリティバレルエクスポート
│       │   ├── game-logic.ts       # 純粋ロジック（効果適用、スコア算出、ランク判定）
│       │   └── game-logic.test.ts  # ロジックテスト
│       ├── hooks/
│       │   ├── index.ts            # フックバレルエクスポート
│       │   └── useGameEngine.ts    # ゲームエンジンフック（useReducer ラッパー）
│       └── components/
│           ├── SprintNoteGame.tsx       # メインゲームコンポーネント（フェーズルーター）
│           ├── SprintNoteGame.test.tsx  # コンポーネントテスト
│           ├── TitleScreen.tsx          # タイトル画面
│           ├── ProjectIntroScreen.tsx   # プロジェクト提示画面
│           ├── TeamFormationScreen.tsx  # チーム結成画面
│           ├── GoalSelectionScreen.tsx  # ゴール選択画面
│           ├── PlanningScreen.tsx       # プランニング画面
│           ├── DevelopmentScreen.tsx    # 開発画面
│           ├── ReleaseScreen.tsx        # リリース判断画面
│           ├── ReviewScreen.tsx         # レビュー画面
│           ├── RetrospectiveScreen.tsx  # 振り返り画面
│           ├── ResultScreen.tsx         # リザルト画面
│           └── styles.ts              # 共通スタイル定義
```

---

## 実装フェーズ

### フェーズ 1: 基盤・型定義

- `types.ts` に全型定義を作成（GameState, Phase, Goal, Task, SprintRecord, Improvement 等）
- `constants/game-config.ts` に初期値・定数を定義
- `constants/goals.ts` にゴール定義（4種 + evaluateScore 関数）
- `constants/tasks.ts` にタスクプール定義（Sprint 1-3 各 3 タスク）
- `constants/improvements.ts` に改善アクション定義（6種）
- `constants/texts.ts` に全テキストテンプレートを定義

### フェーズ 2: ゲームロジック（TDD）

- `utils/game-logic.test.ts` にテスト定義（先にテスト）
  - タスク効果適用テスト（productProgress, qualityScore, teamTrust の増減）
  - clamp 処理テスト（0〜100 範囲制限）
  - リリース判断効果テスト（3 パターン × 品質条件）
  - 改善アクション効果テスト（6 種 × 適用条件）
  - 改善アクション二重適用防止テスト
  - 改善アクション候補選出テスト（Sprint 1, 2 の条件分岐）
  - スコア算出テスト（4 ゴール × 各条件）
  - ランク判定テスト（A〜D の境界値）
  - レビューテキスト選出テスト
  - 開発フレーバーテキスト選出テスト
  - 振り返りナレーション選出テスト
  - リザルトテキスト選出テスト（4 視点）
  - 進捗ボーナス/ペナルティ判定テスト
- `utils/game-logic.ts` に純粋ロジック実装

### フェーズ 3: ゲームエンジンフック

- `hooks/useGameEngine.ts` に useReducer ベースのゲームエンジン実装
  - gameReducer: 全 Action に対する状態遷移
  - Action: SELECT_GOAL, SELECT_TASKS, ADVANCE_PHASE, SELECT_RELEASE, SELECT_IMPROVEMENT, RESTART
  - 各フェーズの遷移ルール実装

### フェーズ 4: UI 基盤・スタイル

- `components/styles.ts` に共通スタイル定義
  - ダークテーマカラーパレット
  - テキスト段階表示コンポーネント
  - 選択肢ボタンコンポーネント
  - ヘッダーコンポーネント
  - レイアウト（縦 1 カラム、中央配置、max-w-2xl 相当）

### フェーズ 5: 画面コンポーネント群

10 画面を実装する：

1. `TitleScreen.tsx` — タイトル画面（「はじめる」ボタン）
2. `ProjectIntroScreen.tsx` — PM の台詞表示（段階表示 + 「次へ」）
3. `TeamFormationScreen.tsx` — 5 人メンバー紹介（段階表示 + 「次へ」）
4. `GoalSelectionScreen.tsx` — 4 択ゴール選択
5. `PlanningScreen.tsx` — 3 タスクから 2 つ選択（3 通りの組み合わせ）
6. `DevelopmentScreen.tsx` — 開発中テキスト表示（フレーバーテキスト + 「次へ」）
7. `ReleaseScreen.tsx` — リリース判断 3 択（動的テキスト付き）
8. `ReviewScreen.tsx` — レビュー結果表示（ユーザー + ステークホルダー反応）
9. `RetrospectiveScreen.tsx` — 改善アクション 2 択 / Sprint 3 ナレーション
10. `ResultScreen.tsx` — スコア・ランク・4 視点テキスト + 「もう一度プレイする」

`SprintNoteGame.tsx` をフェーズルーターとして実装し、currentPhase に応じて画面を切り替える。

### フェーズ 6: 統合（App.tsx / GameListPage 連携）

- `src/pages/SprintNotePage.tsx` を作成（RiskLcdPage パターン）
- `src/App.tsx` に lazy import + Route `/sprint-note` 追加
- `src/pages/GameListPage.tsx` にゲームカード追加
- `src/features/sprint-note/index.ts` でバレルエクスポート

### フェーズ 7: テスト・品質保証

- `utils/game-logic.test.ts` で全ユニットテスト通過確認
- `components/SprintNoteGame.test.tsx` で統合テスト
  - フェーズ遷移の E2E テスト
  - 全ゴール × 全ランクのリザルト表示テスト
  - テキスト条件分岐テスト
- `npm test` で全体パス確認
- TypeScript コンパイル確認（`npx tsc --noEmit`）
- 手動プレイテスト（5〜8 分で完結するか）

---

## リスクと対策

| # | リスク | 影響 | 対策 |
|---|--------|------|------|
| 1 | テキスト量が多く画面が見づらい | UX 劣化 | 段階表示 + スキップ機能で緩和 |
| 2 | 選択肢の効果がわかりにくい | プレイヤーが考えずに選択 | リリース判断時の警告テキストで間接的に状態を伝える |
| 3 | 3 スプリントだとテンポが速すぎる | 振り返り感が薄い | レビューと振り返りのテキストで「変化した」実感を持たせる |
| 4 | パラメータバランスが崩壊 | ゲームが成立しない | TDD でパラメータ計算を先にテスト、境界値で検証 |
| 5 | Inc.2 への拡張が困難 | リファクタコスト増大 | GameState を拡張しやすい構造、タスクプールとロジックの分離 |
| 6 | styled-components と Tailwind の混在 | 一貫性の欠如 | styled-components 統一（既存プロジェクトに合わせる） |

---

## 完了条件

- [ ] `/sprint-note` でゲームが開始できる
- [ ] TITLE → PROJECT_INTRO → TEAM_FORMATION → GOAL_SELECTION → [SPRINT×3] → RESULT の E2E が成立
- [ ] 4 つのゴールそれぞれでゲーム完走可能
- [ ] タスク選択・リリース判断・改善アクション選択が正しく動作する
- [ ] パラメータ（productProgress, qualityScore, teamTrust）が仕様通りに増減する
- [ ] 全パラメータが 0〜100 の範囲に clamp される
- [ ] リザルトのスコア算出・ランク判定が仕様通り
- [ ] テキストの条件分岐が全パターンで正しく動作する
- [ ] テストが追加され `npm test` が通る
- [ ] 1 プレイ 5〜8 分で完結する（要手動検証）
- [ ] GameListPage にカードが追加されている

---

## Inc.1 → Inc.2 への判断基準

以下を満たしたら Inc.2（ロールの声・個人パラメータ導入）に進む。

- スプリントループが退屈なく回る
- 選択に「考える余地」がある
- 結末に「自分の選択の結果」を感じる
- 次に「チームメンバーの反応が欲しい」と自然に思える
