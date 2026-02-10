# タスク一覧・進捗管理（Sprint Note Inc.1「Loop」）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ 1: 基盤・型定義 | ✅ 完了 | 6/6 |
| フェーズ 2: ゲームロジック（TDD） | ✅ 完了 | 5/5 |
| フェーズ 3: ゲームエンジンフック | ✅ 完了 | 3/3 |
| フェーズ 4: UI 基盤・スタイル | ✅ 完了 | 4/4 |
| フェーズ 5: 画面コンポーネント群 | ✅ 完了 | 12/12 |
| フェーズ 6: 統合 | ✅ 完了 | 5/5 |
| フェーズ 7: テスト・品質保証 | 🔄 進行中 | 2/7 |
| **合計** | **88%** | **37/42** |

---

## フェーズ 1: 基盤・型定義

- [x] `src/features/sprint-note/types.ts` を作成
  - [x] Phase 型（10 状態の Union 型）
  - [x] GoalId 型、Goal 型
  - [x] TaskCategory 型、Task 型
  - [x] ReleaseType 型、SprintRecord 型
  - [x] Improvement 型
  - [x] GameState 型（全パラメータ含む）
- [x] `src/features/sprint-note/constants/game-config.ts` を作成
  - [x] 初期値定義（teamTrust: 50, productProgress: 0, qualityScore: 50）
  - [x] 定数定義（MAX_SPRINT: 3, PARAM_MIN: 0, PARAM_MAX: 100）
- [x] `src/features/sprint-note/constants/goals.ts` を作成
  - [x] 4 ゴール定義（stability, value, deadline, quality）
  - [x] 各ゴールの evaluateScore 関数
- [x] `src/features/sprint-note/constants/tasks.ts` を作成
  - [x] Sprint 1 タスク候補（s1_t1, s1_t2, s1_t3）
  - [x] Sprint 2 タスク候補（s2_t1, s2_t2, s2_t3）
  - [x] Sprint 3 タスク候補（s3_t1, s3_t2, s3_t3）
- [x] `src/features/sprint-note/constants/improvements.ts` を作成
  - [x] 6 種の改善アクション定義
  - [x] 候補選出ロジック（Sprint 1, 2 の条件分岐）
- [x] `src/features/sprint-note/constants/texts.ts` を作成
  - [x] 開発フレーバーテキスト（5 パターン）
  - [x] qualityWarning テキスト（4 パターン）
  - [x] fullReleaseRisk テキスト（2 パターン）
  - [x] ユーザー反応テキスト（レビュー用 4 パターン + リザルト用 3 パターン）
  - [x] ステークホルダー反応テキスト（レビュー用 4 パターン + リザルト用 3 パターン）
  - [x] PM の一言テキスト（4 パターン）
  - [x] チームの空気テキスト（3 パターン）
  - [x] 振り返りナレーションテキスト（4 パターン）

---

## フェーズ 2: ゲームロジック（TDD）

- [x] `src/features/sprint-note/utils/game-logic.test.ts` を作成（先にテスト）
  - [x] タスク効果適用テスト（productProgress, qualityScore 増減 + clamp）
  - [x] リリース判断効果テスト（3 パターン × 品質条件 + 進捗ボーナス/ペナルティ）
  - [x] 改善アクション効果テスト（6 種 × 適用条件 + 二重適用防止）
  - [x] 改善アクション候補選出テスト（Sprint 1, 2 の条件分岐）
  - [x] スコア算出テスト（4 ゴール × 各条件）
  - [x] ランク判定テスト（A〜D 境界値: 80, 60, 40）
  - [x] テキスト選出テスト（レビュー、開発フレーバー、ナレーション、リザルト）
- [x] `src/features/sprint-note/utils/game-logic.ts` を作成
  - [x] `applyTaskEffects()` — タスク効果適用（改善ボーナス含む）
  - [x] `applyReleaseEffects()` — リリース判断効果適用
  - [x] `applyProgressBonus()` — 進捗ボーナス/ペナルティ判定
  - [x] `evaluateScore()` — ゴール別スコア算出
  - [x] `determineRank()` — ランク判定（A〜D）
  - [x] `getImprovementCandidates()` — 改善アクション候補選出
  - [x] `getQualityWarning()` — 品質警告テキスト選出
  - [x] `getFullReleaseRisk()` — リリースリスクテキスト選出
  - [x] `getUserReview()` — ユーザー反応テキスト選出
  - [x] `getStakeholderReview()` — ステークホルダー反応テキスト選出
  - [x] `getDevelopmentFlavorText()` — 開発フレーバーテキスト選出
  - [x] `getRetrospectiveNarrative()` — 振り返りナレーション選出
  - [x] `getResultTexts()` — リザルト 4 視点テキスト選出
- [x] `src/features/sprint-note/utils/index.ts` を作成（バレルエクスポート）
- [x] `npm test` で game-logic テストがすべてパスすることを確認
- [x] `src/features/sprint-note/constants/index.ts` を作成（バレルエクスポート）

---

## フェーズ 3: ゲームエンジンフック

- [x] `src/features/sprint-note/hooks/useGameEngine.ts` を作成
  - [x] GameAction 型定義（SELECT_GOAL, SELECT_TASKS, ADVANCE_PHASE, SELECT_RELEASE, SELECT_IMPROVEMENT, RESTART）
  - [x] `gameReducer` 実装（全 Action の状態遷移）
  - [x] フェーズ遷移ルール実装（RETROSPECTIVE → PLANNING or RESULT）
  - [x] 改善アクションの activeImprovements 管理（スプリント開始時リセット）
- [x] `src/features/sprint-note/hooks/index.ts` を作成（バレルエクスポート）
- [x] `npm test` でフック関連のテストがパスすることを確認

---

## フェーズ 4: UI 基盤・スタイル

- [x] `src/features/sprint-note/components/styles.ts` を作成
  - [x] カラーパレット定義（背景 #0f1117、テキスト #e0e0e0 等）
  - [x] GameContainer — 全体レイアウト（縦 1 カラム、中央配置）
  - [x] Header — ヘッダーコンポーネント（Sprint N / 3 + フェーズ名）
  - [x] ContentArea — メインコンテンツ領域
- [x] 段階的テキスト表示コンポーネント（TextReveal）
  - [x] 0.3 秒間隔のフェードイン
  - [x] タップ/クリックで全文即時表示
- [x] 選択肢ボタンコンポーネント（ChoiceButton）
  - [x] ホバー/タップ反応
  - [x] 選択後のグレーアウト + ハイライト
  - [x] 選択後 0.5 秒ウェイト → 遷移
- [x] レスポンシブ対応
  - [x] モバイル: 幅 100%
  - [x] PC: max-width: 672px

---

## フェーズ 5: 画面コンポーネント群

- [x] `TitleScreen.tsx` — タイトル画面
  - [x] 「Sprint Note ─ スプリントノート」表示
  - [x] 「はじめる」ボタン
- [x] `ProjectIntroScreen.tsx` — プロジェクト提示画面
  - [x] PM の台詞を段階表示
  - [x] 「次へ」ボタン
- [x] `TeamFormationScreen.tsx` — チーム結成画面
  - [x] 5 人のメンバー紹介を段階表示
  - [x] 「次へ」ボタン
- [x] `GoalSelectionScreen.tsx` — ゴール選択画面
  - [x] 4 択ボタン（安定稼働/価値最大化/納期死守/品質文化）
  - [x] 各ゴールの説明と評価軸表示
- [x] `PlanningScreen.tsx` — プランニング画面
  - [x] 3 タスク候補表示
  - [x] 3 通りの組み合わせ選択（[1と2] [1と3] [2と3]）
- [x] `DevelopmentScreen.tsx` — 開発画面
  - [x] 選択したタスク名表示
  - [x] フレーバーテキスト表示（条件分岐）
  - [x] 「次へ」ボタン
- [x] `ReleaseScreen.tsx` — リリース判断画面
  - [x] qualityWarning 動的表示
  - [x] 3 択ボタン（全機能/一部削り/延期）
  - [x] fullReleaseRisk 動的表示
- [x] `ReviewScreen.tsx` — レビュー画面
  - [x] ユーザー反応テキスト（条件分岐）
  - [x] ステークホルダー反応テキスト（条件分岐）
  - [x] 品質追加コメント（条件付き表示）
  - [x] 「次へ」ボタン
- [x] `RetrospectiveScreen.tsx` — 振り返り画面
  - [x] Sprint 1, 2: 改善アクション 2 択
  - [x] Sprint 3: ナレーション形式（条件分岐）
  - [x] Sprint 3: 「結果を見る」ボタン
- [x] `ResultScreen.tsx` — リザルト画面
  - [x] ゴール名とランク名表示
  - [x] 4 視点テキスト表示（PM、ユーザー、SH、チーム）
  - [x] 「もう一度プレイする」ボタン
- [x] `SprintNoteGame.tsx` — メインゲームコンポーネント
  - [x] フェーズルーター（currentPhase に応じて画面切替）
  - [x] useGameEngine フックの統合
- [x] `SprintNoteGame.test.tsx` — コンポーネントテスト
  - [x] レンダリングテスト
  - [x] フェーズ遷移テスト

---

## フェーズ 6: 統合（App.tsx / GameListPage 連携）

- [x] `src/features/sprint-note/index.ts` を作成（SprintNoteGame エクスポート）
- [x] `src/pages/SprintNotePage.tsx` を作成
  - [x] FullScreenWrap パターン（RiskLcdPage 準拠）
  - [x] 背景色 #0f1117
- [x] `src/App.tsx` に追加
  - [x] lazy import: `const SprintNotePage = lazy(() => import('./pages/SprintNotePage'));`
  - [x] Route: `<Route path="/sprint-note" element={<SprintNotePage />} />`
- [x] `src/pages/GameListPage.tsx` にカード追加
  - [x] タイトル「Sprint Note」
  - [x] 説明文
  - [x] パス `/sprint-note`
- [ ] 動作確認（ブラウザでアクセス）

---

## フェーズ 7: テスト・品質保証

- [x] `npm test` で全テストがパス
- [x] TypeScript コンパイル確認（`npx tsc --noEmit`）
- [ ] 手動プレイテスト: ゴール「安定稼働」で通しプレイ
- [ ] 手動プレイテスト: ゴール「価値最大化」で通しプレイ
- [ ] 手動プレイテスト: ゴール「納期死守」で通しプレイ
- [ ] 手動プレイテスト: ゴール「品質文化」で通しプレイ
- [ ] プレイ時間計測（目標: 5〜8 分 / 1 プレイ）

---

## 依存関係

```
フェーズ 1 → フェーズ 2 → フェーズ 3 → フェーズ 4 → フェーズ 5 → フェーズ 6 → フェーズ 7
              ↘                        ↗
                    並行可能（フェーズ 4 はフェーズ 2 完了後に開始可能）
```

- フェーズ 1（型定義・定数）は最初に完了
- フェーズ 2（ゲームロジック）はフェーズ 1 完了後
- フェーズ 3（エンジンフック）はフェーズ 2 完了後
- フェーズ 4（UI 基盤）はフェーズ 2 完了後に並行開始可能
- フェーズ 5（画面）はフェーズ 3, 4 完了後
- フェーズ 6（統合）はフェーズ 5 完了後
- フェーズ 7（テスト・品質）はフェーズ 6 完了後

---

## 注意事項

- TDD ファーストで進める（フェーズ 2 は必ずテスト先行）
- パラメータの clamp 処理を忘れない（0〜100）
- 改善アクション効果の二重適用に注意（タスク 1 つ目にのみ適用）
- styled-components で統一（Tailwind CSS は使用しない）
- テキスト量が多いため、定数ファイルへの分離を徹底する
