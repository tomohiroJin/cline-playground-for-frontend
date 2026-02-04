# タスク一覧・進捗管理（Non-Brake Descent）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ1: 取り込み準備 | 完了 | 4/4 |
| フェーズ2: アセット・UI統合 | 完了 | 4/4 |
| フェーズ3: テスト追加（TDD） | 進行中 | 3/4 |
| フェーズ4: リファクタリング | 進行中 | 3/4 |
| **合計** | **88%** | **14/16** |

---

## フェーズ1: 取り込み準備（最小変更）

- [x] `.temp/non-brake-descent-v4.jsx` を読み込み、移植対象の構成を把握
- [x] `src/pages/NonBrakeDescentPage.tsx` を作成し、**挙動を変えずに**移植
- [x] `src/App.tsx` に lazy import と `/non-brake-descent` ルート追加
- [x] ゲーム領域に `role="region"` と `aria-label` を付与

---

## フェーズ2: アセット・UI統合

- [x] `src/assets/images/non_brake_descent_card_bg.webp` を追加
- [x] `src/pages/GameListPage.tsx` にカード追加（画像/説明/aria）
- [x] `src/pages/GameListPage.test.tsx` の画像モック追加
- [x] 共有ボタン & ハイスコア永続化の組み込み（ゲーム挙動に影響しない範囲）

---

## フェーズ3: テスト追加（TDD）

- [x] `src/pages/NonBrakeDescentPage.test.tsx` を追加（タイトル・aria）
- [x] `src/pages/GameListPage.test.tsx` を更新（カード数 7）
- [x] ドメイン関数のキャラクタリゼーションテスト追加
- [x] 既存テストと併せて `npm test` 実行

---

## フェーズ4: リファクタリング（必須・振る舞い不変）

- [x] `src/features/non-brake-descent/` へ構造分割
- [x] 純粋関数と副作用を分離し、DbC を明文化
- [x] 型の厳格化（Union/`as const`）と `null` 排除
- [x] テスト再実行で挙動不変を確認
