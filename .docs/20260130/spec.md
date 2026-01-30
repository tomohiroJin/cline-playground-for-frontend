# 仕様・要件定義（Non-Brake Descent）

## 1. 目的

`.temp/non-brake-descent-v4.jsx` を **現行プロダクトに新規ゲームとして追加**する。
既存ゲームの構成に倣い、**ゲーム一覧・ルーティング・テスト・アセット**を追加する。
ゲームの挙動は **極力そのまま** とし、機能追加は **非破壊的** に行う。

---

## 2. 機能要件

### 2.1 ルーティング

- 新規ルート: `/non-brake-descent`
- `src/App.tsx` で `React.lazy` による遅延読み込み。

### 2.2 ゲーム一覧への追加

- `src/pages/GameListPage.tsx` に新規カード追加。
- タイトル: `Non-Brake Descent`
- 説明文: ハイスピード下り坂・ノンブレーキを強調した短文。
- `aria-label` 付与（例: "Non-Brake Descent ゲームをプレイする"）。

### 2.3 画像追加

- 追加画像: `src/assets/images/non_brake_descent_card_bg.webp`
- GameList カード背景に使用。
- 画像は既存カードと同等のサイズ感・トーンで作成。

### 2.4 ゲーム実装（挙動維持）

- 元ファイルのロジック・演出・入力を保持。
- 操作仕様: 
  - ← → 移動
  - Z 加速 / X ジャンプ
  - SPACE 開始 / T タイトル戻り
- モバイル操作: 画面タップスタート + タッチボタン
- 画面サイズ・スクロール演出などは **オリジナルと同等** に再現。

### 2.5 高スコア永続化（既存ゲームと同様）

- `src/utils/score-storage.ts` を利用。
- key: `non_brake_descent`
- タイトル画面でハイスコアを表示。
- CLEAR / GAME OVER 時にスコア保存。

### 2.6 共有ボタン

- `ShareButton` を使用してスコア共有を可能にする。
- ボタン表示は **ゲーム挙動を邪魔しない位置**（ゲーム外下部など）。

---

## 3. 非機能要件

### 3.1 互換性

- 既存の React 19 / TypeScript / styled-components 構成に適合。
- `tsconfig` の `strict` に準拠。

### 3.2 コーディング規約

- `any` 不使用 / `enum` 不使用 / `null` 不使用。
- `as const` と Union 型で定数を表現。
- 既存コードのロジックは **動作を変えずに移植**。

### 3.3 アクセシビリティ

- ゲーム領域に `role="region"` と `aria-label` を付与。
- ボタンやカードに適切な `aria-label` を付与。

---

## 4. アーキテクチャ仕様

### 4.1 初期統合（最小変更）

- `src/pages/NonBrakeDescentPage.tsx` でゲームをラップ。
- ゲーム本体は **1ファイルのまま** 統合し、挙動を保持。

### 4.2 最終リファクタリング（必須）

- `src/features/non-brake-descent/` 配下へ分割。
  - `config.ts` / `constants.ts` / `types.ts`
  - `domains/*.ts`（Speed / Collision / Geometry / Score など）
  - `entities.ts`（Factory）
  - `renderers.tsx`
  - `hooks.ts`
- **純粋関数と副作用の分離**。
- DbC（前提条件・入力範囲チェック）を明文化。

---

## 5. テスト要件（TDD）

### 5.1 ページ統合テスト

- `NonBrakeDescentPage` のタイトル表示確認。
- `role="region"` / `aria-label` の検証。
- GameList のカード数が 7 になること。

### 5.2 ドメイン関数テスト（キャラクタリゼーション）

- `MathUtils.clamp/lerp/normalize`
- `SpeedDomain.getRank/getBonus/accelerate`
- `CollisionDomain.check`
- `ScoringDomain.calcRampScore/calcFinal`

### 5.3 リファクタリング回帰

- テストをリファクタリング前後で継続実行し、
  **全挙動が不変**であることを保証。

---

## 6. 受け入れ基準

- [x] `/non-brake-descent` でゲームが起動・操作可能。
- [x] GameList に新カードが表示され、画像が反映される。
- [x] 高スコアの保存と表示ができる。
- [x] 共有ボタンが追加され、スコアが共有できる。
- [x] テストが追加され、`npm test` が通る。
- [x] 最終リファクタリング後も挙動が変わらない。
