# Non-Brake Descent 組み込み計画

## 概要

`.temp/non-brake-descent-v4.jsx` を **現行プロダクトのゲームとして追加**し、
「動作・演出・操作感は極力そのまま」を最優先に統合する。
そのうえで、**追加画像・ルーティング・ゲーム一覧への登録・テスト追加**を行い、
**最終段階で必ずリファクタリング**（関数型 / DRY / SOLID / DbC）を実施する。

## 現状把握（プロダクト読解）

- ルーティング: `src/App.tsx` で `react-router-dom` のルート管理。ゲームは lazy import。
- ゲーム一覧: `src/pages/GameListPage.tsx` にカード一覧。背景画像は `src/assets/images/*.webp`。
- テスト: Jest + Testing Library。ゲーム一覧テストは `src/pages/GameListPage.test.tsx`。
- 既存ゲームページ: `src/pages/*Page.tsx`。大規模ゲームは単一ファイルだが、
  一部 `src/features/air-hockey` のように機能分割あり。
- 高スコア永続化: `src/utils/score-storage.ts` を利用。
- 共有ボタン: `src/components/molecules/ShareButton.tsx`。

## 目的

- 新ゲーム「Non-Brake Descent」を **極力改変せず**にプロダクトへ組み込み。
- カード画像の追加とゲーム一覧への掲載。
- テスト駆動で安全な統合。
- **最後に必ずリファクタリング**（振る舞い不変・責務分割・型安全化）。

---

## 実装フェーズ

### フェーズ1: 取り込み準備（最小変更で統合）

- `.temp/non-brake-descent-v4.jsx` の中核ロジックを **そのまま** `src/pages/NonBrakeDescentPage.tsx` に移植。
- 既存の構成に合わせて **最低限のラッパー**（PageContainer / section / aria）を付与。
- `src/App.tsx` に `/non-brake-descent` ルートを追加（lazy import）。
- `src/pages/GameListPage.tsx` にカードを追加。

### フェーズ2: アセット追加・UI統合

- ゲームカード用の背景画像を追加。
- アクセシビリティラベルとタイトル表記を既存ルールに合わせる。
- 共有ボタン・ハイスコア永続化は **ゲーム挙動に影響しない範囲**で追加。

### フェーズ3: テスト追加（TDD）

- ページレンダリング・アクセシビリティ・ルーティングを **先にテスト化**。
- 純粋関数（Math/Domain/Collision 等）に対する **キャラクタリゼーションテスト**を用意。
- GameList のカード数 / ラベル増加をテスト更新。

### フェーズ4: リファクタリング（必須・振る舞い不変）

- `src/features/non-brake-descent/` に機能分割（domain / config / renderer / hooks）。
- 関数型設計 + DRY + SOLID + DbC（前提条件チェック）に沿うよう整理。
- **必ず挙動不変**（テストで保証）。

---

## 重要な方針

- **ゲームロジックは極力そのまま**（アルゴリズム・演出・入力感を変えない）。
- 変更は「型付け」「配置変更」「ラッパー追加」など **非破壊的**なものに限定。
- リファクタリングは **最後**。先にキャラクタリゼーションテストを作成。

---

## 完了条件

- `/non-brake-descent` でゲームが再現性高く動作。
- GameList にカードが追加され、画像が表示される。
- テストが追加され、`npm test` が通る。
- リファクタリング完了後も **振る舞いが不変**であることが確認できる。
