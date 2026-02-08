# 迷宮の残響 (Labyrinth Echo) — タスク

## Phase 0: 準備

- [x] `feature/labyrinth-echo` ブランチを `main` から作成
- [x] `.docs/2026020802/` ディレクトリ作成
- [x] `spec.md` 作成
- [x] `plan.md` 作成
- [x] `tasks.md` 作成

## Phase 1-1: ディレクトリとファイル準備

- [x] `src/features/labyrinth-echo/` ディレクトリ作成
- [x] `types.ts` 作成
  - [x] `GamePhase` 型定義
  - [x] `Player` 型定義
  - [x] `Difficulty` 型定義
  - [x] `StatusEffect` 型定義
  - [x] `Ending` 型定義
  - [x] `SaveData` / `MetaData` 型定義
  - [x] `GameEvent` 型定義
- [x] `storage.ts` 作成
  - [x] `SAVE_KEY` 定数
  - [x] `safeAsync` ヘルパー
  - [x] `Storage.save()` — `localStorage.setItem` ラッパー
  - [x] `Storage.load()` — `localStorage.getItem` ラッパー
- [x] `index.ts` — barrel export 作成

## Phase 1-2: JSX → TSX 変換 + Storage 変換

- [x] `.tmp/迷宮の残響.jsx` → `LabyrinthEchoGame.tsx` にコピー
- [x] 拡張子 `.jsx` → `.tsx` 変更
- [x] `window.storage.set()` → `localStorage.setItem()` に変換 (行146)
- [x] `window.storage.get()` → `localStorage.getItem()` に変換 (行150)
- [x] `r.value` アクセスパターン → 直接値に変更
- [x] Storage 部分を `storage.ts` の import に置き換え
- [x] `export default function Game()` → named export に変更
- [x] React import 文の調整（既存 import 維持）
- [x] 主要な state/props に TypeScript 型を付与
- [x] lint エラーの解消

## Phase 1-3: ページコンポーネント作成

- [x] `src/pages/LabyrinthEchoPage.tsx` 作成
  - [x] `LabyrinthEchoGame` を import
  - [x] React.FC として export default
  - [x] 既存ページパターンに準拠

## Phase 1-4: プラットフォーム統合

### App.tsx
- [x] `LabyrinthEchoPage` の lazy import 追加
- [x] `/labyrinth-echo` の Route 追加

### GameListPage.tsx
- [x] カード背景画像の import 追加
- [x] GameCardContainer エントリ追加
  - [x] navigate 先: `/labyrinth-echo`
  - [x] タイトル: 迷宮の残響
  - [x] 説明文
  - [x] アクセシビリティ対応 (role, tabIndex, onKeyDown)

### アセット
- [x] `src/assets/images/labyrinth_echo_card_bg.webp` プレースホルダー配置

## Phase 1-5: テスト

- [x] GameListPage テスト更新
  - [x] 10個目のゲームカード存在確認
  - [x] 「迷宮の残響」テキスト存在確認
  - [x] ナビゲーション先 `/labyrinth-echo` 確認
- [x] 既存テスト全パス確認

## Phase 1-6: 検証

- [x] `npm run build` — ビルド成功（エラー0）
- [x] `npm run lint` — lint エラー0
- [x] `npm run test` — 全テストパス
- [x] 開発サーバー動作確認
  - [x] ゲーム一覧に迷宮の残響カード表示
  - [x] カードクリック→LabyrinthEchoPage 遷移
  - [x] タイトル画面表示
  - [x] 難易度選択→ゲーム開始フロー
  - [X] イベント選択→結果表示
  - [X] セーブ/ロードの動作
