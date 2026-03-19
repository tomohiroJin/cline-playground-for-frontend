# 迷宮の残響 テストカバレッジ ベースライン (Phase 0)

計測日: 2026-03-15

## サマリー

| ディレクトリ | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| labyrinth-echo 全体 | 28.44% | 19.77% | 20.76% | 34.07% |
| components/ | 57.38% | 53.50% | 48.83% | 58.25% |
| events/ | 2.63% | 0% | 0% | 3.44% |

## ファイル別カバレッジ

### コア（src/features/labyrinth-echo/）

| ファイル | Stmts | Branch | Funcs | Lines | 備考 |
|---|---|---|---|---|---|
| game-logic.ts | 90% | 81.18% | 72.22% | 88.42% | ★ 高カバレッジ |
| storage.ts | 100% | 75% | 100% | 100% | ★ 高カバレッジ |
| styles.ts | 100% | 100% | 100% | 100% | ★ 完全カバー |
| definitions.ts | 62.16% | 15.21% | 62.5% | 66.66% | エンディング条件関数が未テスト |
| images.ts | 85.86% | 36.36% | 100% | 90.69% | |
| hooks.ts | 15.29% | 4.49% | 10.52% | 15.44% | ✗ カバレッジ低 |
| contracts.tsx | 26.08% | 0% | 0% | 28.57% | ✗ カバレッジ低 |
| audio.ts | 8.24% | 0% | 1.72% | 14.28% | ✗ カバレッジ低 |
| LabyrinthEchoGame.tsx | 0% | 0% | 0% | 0% | ✗ 未テスト |
| index.ts | 0% | 100% | 0% | 0% | barrel export |

### コンポーネント（components/）

| ファイル | Stmts | Branch | Funcs | Lines | 備考 |
|---|---|---|---|---|---|
| DiffSelectScreen.tsx | 100% | 100% | 100% | 100% | ★ 完全カバー |
| Page.tsx | 100% | 100% | 100% | 100% | ★ 完全カバー |
| Section.tsx | 100% | 100% | 100% | 100% | ★ 完全カバー |
| Badge.tsx | 100% | 100% | 100% | 100% | ★ 完全カバー |
| SettingsScreens.tsx | 93.54% | 83.33% | 86.66% | 92.3% | ★ 高カバレッジ |
| EndScreens.tsx | 75.6% | 61.53% | 47.36% | 77.14% | |
| TitleScreen.tsx | 69.81% | 85.45% | 57.14% | 77.5% | |
| EventResultScreen.tsx | 64.16% | 63.55% | 68.96% | 68.96% | |
| ParallaxBg.tsx | 63.15% | 70% | 62.5% | 67.64% | |
| GameComponents.tsx | 61.87% | 59.33% | 43.18% | 57.73% | |
| CollectionScreens.tsx | 0% | 0% | 0% | 0% | ✗ 未テスト |
| FloorIntroScreen.tsx | 0% | 0% | 0% | 0% | ✗ 未テスト |
| StatusOverlay.tsx | 0% | 0% | 0% | 0% | ✗ 未テスト |

### イベント（events/）

| ファイル | Stmts | Branch | Funcs | Lines | 備考 |
|---|---|---|---|---|---|
| event-data.ts | 16.66% | 0% | 0% | 16.66% | データ定義のみ |
| event-utils.ts | 0% | 0% | 0% | 0% | ✗ 未テスト |

## カバレッジ目標との差分

| 対象 | 現在 | 目標 | 差分 |
|---|---|---|---|
| 新規コード全体 | - | 80% | - |
| ビジネスロジック (game-logic.ts) | 90% | 90% | ★ 達成 |
| UI コンポーネント | 57.38% | 70% | -12.62% |
| events/event-utils.ts | 0% | 90% | -90% |
| hooks.ts | 15.29% | 70% | -54.71% |

## Phase 5 でのテスト追加計画

以下のファイルのカバレッジ向上が優先:
1. **event-utils.ts** (0%) — processChoice, pickEvent, findChainEvent のテスト追加
2. **hooks.ts** (15%) — useTextReveal, usePersistence, useVisualFx のテスト追加
3. **LabyrinthEchoGame.tsx** (0%) — Phase 4 でリファクタリング後にテスト追加
4. **CollectionScreens.tsx** (0%) — コンポーネントテスト追加
5. **FloorIntroScreen.tsx** (0%) — コンポーネントテスト追加
6. **StatusOverlay.tsx** (0%) — コンポーネントテスト追加
