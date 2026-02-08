# 迷宮の残響 (Labyrinth Echo) — タスク

## Phase 0: 準備

- [x] `feature/labyrinth-echo` ブランチを `main` から作成
- [x] `.docs/2026020802/` ディレクトリ作成
- [x] `spec.md` 作成
- [x] `plan.md` 作成
- [x] `tasks.md` 作成

## Phase 1-1: ディレクトリとファイル準備

- [ ] `src/features/labyrinth-echo/` ディレクトリ作成
- [ ] `types.ts` 作成
  - [ ] `GamePhase` 型定義
  - [ ] `Player` 型定義
  - [ ] `Difficulty` 型定義
  - [ ] `StatusEffect` 型定義
  - [ ] `Ending` 型定義
  - [ ] `SaveData` / `MetaData` 型定義
  - [ ] `GameEvent` 型定義
- [ ] `storage.ts` 作成
  - [ ] `SAVE_KEY` 定数
  - [ ] `safeAsync` ヘルパー
  - [ ] `Storage.save()` — `localStorage.setItem` ラッパー
  - [ ] `Storage.load()` — `localStorage.getItem` ラッパー
- [ ] `index.ts` — barrel export 作成

## Phase 1-2: JSX → TSX 変換 + Storage 変換

- [ ] `.tmp/迷宮の残響.jsx` → `LabyrinthEchoGame.tsx` にコピー
- [ ] 拡張子 `.jsx` → `.tsx` 変更
- [ ] `window.storage.set()` → `localStorage.setItem()` に変換 (行146)
- [ ] `window.storage.get()` → `localStorage.getItem()` に変換 (行150)
- [ ] `r.value` アクセスパターン → 直接値に変更
- [ ] Storage 部分を `storage.ts` の import に置き換え
- [ ] `export default function Game()` → named export に変更
- [ ] React import 文の調整（既存 import 維持）
- [ ] 主要な state/props に TypeScript 型を付与
- [ ] lint エラーの解消

## Phase 1-3: ページコンポーネント作成

- [ ] `src/pages/LabyrinthEchoPage.tsx` 作成
  - [ ] `LabyrinthEchoGame` を import
  - [ ] React.FC として export default
  - [ ] 既存ページパターンに準拠

## Phase 1-4: プラットフォーム統合

### App.tsx
- [ ] `LabyrinthEchoPage` の lazy import 追加
- [ ] `/labyrinth-echo` の Route 追加

### GameListPage.tsx
- [ ] カード背景画像の import 追加
- [ ] GameCardContainer エントリ追加
  - [ ] navigate 先: `/labyrinth-echo`
  - [ ] タイトル: 迷宮の残響
  - [ ] 説明文
  - [ ] アクセシビリティ対応 (role, tabIndex, onKeyDown)

### アセット
- [ ] `src/assets/images/labyrinth_echo_card_bg.webp` プレースホルダー配置

## Phase 1-5: テスト

- [ ] GameListPage テスト更新
  - [ ] 10個目のゲームカード存在確認
  - [ ] 「迷宮の残響」テキスト存在確認
  - [ ] ナビゲーション先 `/labyrinth-echo` 確認
- [ ] 既存テスト全パス確認

## Phase 1-6: 検証

- [ ] `npm run build` — ビルド成功（エラー0）
- [ ] `npm run lint` — lint エラー0
- [ ] `npm run test` — 全テストパス
- [ ] 開発サーバー動作確認
  - [ ] ゲーム一覧に迷宮の残響カード表示
  - [ ] カードクリック→LabyrinthEchoPage 遷移
  - [ ] タイトル画面表示
  - [ ] 難易度選択→ゲーム開始フロー
  - [ ] イベント選択→結果表示
  - [ ] セーブ/ロードの動作
