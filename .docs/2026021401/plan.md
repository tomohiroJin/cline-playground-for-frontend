# 迷宮の残響 — シナリオ画像生成 実装計画

## 概要

- 全26枚のシナリオ画像をAI生成し、ゲーム全画面に配置
- 画像は `src/assets/images/` に WebP 形式で格納（既存 IPNE パターンに準拠）
- 新規 `images.ts` でマッピングを一元管理

## 背景

「迷宮の残響」はテキスト探索×ローグライトRPGで、現在すべての画面がテキスト＋CSSパーティクルのみ。
全画面（タイトル・難易度選択・フロアイントロ・イベント・エンディング・ゲームオーバー）に統一テイストのイラストを追加し、ゲームの世界観を視覚的に表現する。

画像テイスト: **ノーマン・ロックウェル**（トムソーヤ/ハックルベリーフィンの冒険イラスト）× **ジェフ・イーズリー**（D&D公式アート）の融合。

---

## フェーズ構成

### フェーズ1: 画像スタイルガイド策定・README更新

- `src/features/labyrinth-echo/README.md` に画像スタイルガイドセクションを追記
- 全画像共通のベースプロンプトを定義
- 全26枚の個別プロンプトをレビュー・確定

### フェーズ2: AI画像生成（26枚）

- カテゴリ別に生成: タイトル(1) → 難易度(4) → フロア(5) → イベント(4) → エンディング(11) → ゲームオーバー(1)
- PNG で生成後、WebP に変換（品質82%、1枚300KB以下）
- ファイル名: `le_` プレフィックス + カテゴリ + ID

### フェーズ3: コード実装

- `src/features/labyrinth-echo/images.ts` を新規作成（画像 import 一元管理）
- 各コンポーネントに画像表示を追加:
  - `TitleScreen.tsx` — タイトル背景画像
  - `GameComponents.tsx` — DiffCard に画像ヘッダー
  - `FloorIntroScreen.tsx` — フロア画像
  - `EventResultScreen.tsx` — イベントタイプ画像
  - `EndScreens.tsx` — エンディング/ゲームオーバー画像

### フェーズ4: 検証・最適化

- 全画面の表示確認
- ファイルサイズ確認（全体8MB以下）
- loading 属性の最適化（eager/lazy）
- ビルド確認

---

## コード変更箇所

### 新規ファイル

- `src/features/labyrinth-echo/images.ts` — 画像 import マッピング一元管理

### 変更ファイル（6ファイル）

| ファイル | 変更内容 |
|---|---|
| `components/TitleScreen.tsx` | タイトル背景画像追加（h1の上） |
| `components/GameComponents.tsx` | DiffCard にカードヘッダー画像追加（L116付近） |
| `components/FloorIntroScreen.tsx` | フロア名の上に画像追加 |
| `components/EventResultScreen.tsx` | イベントタイプタグ横に小画像追加 |
| `components/EndScreens.tsx` | VictoryScreen にエンディング画像、GameOverScreen にゲームオーバー画像追加 |
| `README.md` | 画像スタイルガイドセクション追記 |

---

## 検証方法

1. `npm run dev` でローカル起動
2. タイトル画面 → 画像が表示されることを確認
3. 難易度選択 → 4つの DiffCard それぞれに画像が表示されることを確認
4. ゲーム開始 → 各フロアイントロで画像表示を確認（全5層）
5. イベント発生時 → イベントタイプ別の画像が表示されることを確認
6. ゲームクリア → エンディング画像が表示されることを確認
7. ゲームオーバー → ゲームオーバー画像が表示されることを確認
8. `npm run build` でビルド成功を確認
9. ブラウザ DevTools でネットワーク負荷・表示速度を確認

---

## 重要ファイルパス

- `src/features/labyrinth-echo/components/TitleScreen.tsx`
- `src/features/labyrinth-echo/components/GameComponents.tsx` (DiffCard: L116-148)
- `src/features/labyrinth-echo/components/FloorIntroScreen.tsx`
- `src/features/labyrinth-echo/components/EventResultScreen.tsx`
- `src/features/labyrinth-echo/components/EndScreens.tsx`
- `src/features/labyrinth-echo/README.md`
- `src/features/labyrinth-echo/definitions.ts` (ENDINGS, FLOOR_META)
- `src/assets/images/` (画像格納先)
- 参考: `src/features/ipne/ending.ts` (既存の画像 import パターン)
