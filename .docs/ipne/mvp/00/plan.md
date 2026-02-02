# IPNE MVP0 実装計画（計画駆動）

## 概要

「歩けて脱出できる」だけの最小E2Eを、
現行Game Platformに **新規ゲームとして組み込む**。
TDDを前提に、**先にテスト → 最小実装 → 確認** を繰り返す。

---

## 現状把握（既存コード構成）

- ルーティング: `src/App.tsx` で `react-router-dom` 管理（lazy import）
- ゲーム一覧: `src/pages/GameListPage.tsx` のカード追加
- UI: `styled-components` + ページ専用 `*.styles.ts`
- テスト: Jest + React Testing Library
- 既存ゲームは `src/pages/*Page.tsx` に集約、純粋ロジックは `src/features/*` に分離可能

---

## フェーズ構成

### フェーズ0: テスト準備（TDD起点）

- `IpneMvp0Page` のレンダリングテスト追加
- GameList のカード数更新（8件）
- ロジック系テストの土台（移動/衝突/ゴール/マップ）を先に定義

### フェーズ1: 最小E2Eの骨組み

- `src/pages/IpneMvp0Page.tsx` 作成
- タイトル画面 → プロローグ → ゲーム画面 → クリア画面 の遷移
- `role="region"` / `aria-label` などアクセシビリティ付与

### フェーズ2: ゲームコア（固定迷路）

- 固定マップ定義（タイル配列）
- プレイヤー移動（WASD/矢印）
- 壁衝突判定
- ゴール判定 → クリア

### フェーズ3: UI統合

- GameListにカード追加（画像・説明・aria）
- Appルートに `/ipne-mvp0` を追加（lazy import）
- カード背景画像を追加
- タイトル画面用背景画像を追加（雰囲気重視）
- プロローグ画面用背景画像を追加（ライトノベル的）

### フェーズ4: 微調整と確認

- モバイル最低限操作（タップ/簡易Dパッド）
- 2〜3分で終わる迷路サイズ調整
- テスト通過確認

---

## 重要方針

- 変更はMVP0範囲に限定（敵・罠・レベルアップ等は入れない）
- UIは既存ページと同じルール（styled-components / aria）
- **TDD優先**: 先にテスト → 実装 → リファクタ

---

## 完了条件

- `/ipne-mvp0` が起動し、E2Eでクリアできる
- GameListにカードが追加される
- テストが追加され、`npm test` が通る
