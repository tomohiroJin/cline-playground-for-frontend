# 迷宮の残響 (Labyrinth Echo) — 実装計画

## 作成日
- 2026-02-08

## 目的
- `.tmp/迷宮の残響.jsx` をゲームプラットフォームの10番目のゲームとして統合する。
- Phase 1 では「まず動かす」を最優先とし、最小限の変換でプラットフォーム上で動作する状態を目指す。

## スコープ
- 対象: 迷宮の残響ゲームのプラットフォーム統合 (Phase 1: 最小統合)
- 非対象: ゲームロジックの変更、大規模リファクタリング (Phase 2 として後続ブランチで実施)

## 方針
1. 元のゲームファイルの動作を壊さない最小限の変換に留める
2. `window.storage` → `localStorage` の変換は `storage.ts` に分離
3. JSX → TSX 変換は段階的型付け（Phase 1 では一部 `any` 許容）
4. CSS 文字列インジェクションはそのまま維持
5. ErrorBoundary はゲーム内蔵のものを維持（プラットフォーム側と二重で安全）
6. Web Audio API はそのまま維持

---

## Phase 0: 準備

### 0-1. ブランチ作成
- `main` から `feature/labyrinth-echo` ブランチを作成

### 0-2. ドキュメント作成
- `.docs/2026020802/` ディレクトリ作成
- `spec.md` — ゲーム仕様・統合仕様
- `plan.md` — 実装計画（本ファイル）
- `tasks.md` — タスクチェックリスト

---

## Phase 1-1: ディレクトリとファイル準備

### 作業内容
1. `src/features/labyrinth-echo/` ディレクトリ作成
2. `types.ts` — 型定義ファイル作成
   - `Player`, `GamePhase`, `Difficulty`, `StatusEffect`, `Ending`, `SaveData` 等
3. `storage.ts` — Storage ラッパー作成
   - `window.storage` を `localStorage` に変換
   - `safeAsync` を含む
4. `index.ts` — barrel export

### 成果物
```
src/features/labyrinth-echo/
├── index.ts
├── types.ts
└── storage.ts
```

---

## Phase 1-2: JSX → TSX 変換 + Storage 変換

### 作業内容
1. `.tmp/迷宮の残響.jsx` を `src/features/labyrinth-echo/LabyrinthEchoGame.tsx` にコピー
2. 拡張子を `.tsx` に変更
3. Storage 部分を `storage.ts` の import に置き換え
4. 型定義を `types.ts` の import に置き換え
5. 段階的に TypeScript 型を追加
   - 主要な props/state に型を付与
   - Phase 1 では複雑な部分に `any` を許容
6. `export default function Game()` を named export に変更
7. lint エラーの解消

### 変換ポイント
- `window.storage.set(key, value)` → `localStorage.setItem(key, value)`
- `window.storage.get(key)` → `localStorage.getItem(key)` (Promise ラッパー維持)
- `r.value` アクセスパターン → 直接値を使用

---

## Phase 1-3: ページコンポーネント作成

### 作業内容
1. `src/pages/LabyrinthEchoPage.tsx` 作成
2. 既存パターン (`AgileQuizSugorokuPage.tsx`) に準拠
3. `LabyrinthEchoGame` コンポーネントを import して表示

### 構成
```typescript
import React from 'react';
import { LabyrinthEchoGame } from '../features/labyrinth-echo';

const LabyrinthEchoPage: React.FC = () => {
  return <LabyrinthEchoGame />;
};

export default LabyrinthEchoPage;
```

---

## Phase 1-4: プラットフォーム統合

### 作業内容

#### App.tsx
1. lazy import 追加
```typescript
const LabyrinthEchoPage = lazy(
  () => import(/* webpackChunkName: "LabyrinthEchoPage" */ './pages/LabyrinthEchoPage')
);
```
2. Route 追加
```typescript
<Route path="/labyrinth-echo" element={<LabyrinthEchoPage />} />
```

#### GameListPage.tsx
1. カード背景画像の import 追加
2. GameCardContainer エントリ追加
   - navigate先: `/labyrinth-echo`
   - タイトル: 迷宮の残響
   - 説明文: テキストベースのダンジョン探索ゲーム
   - アクセシビリティ対応 (role, tabIndex, onKeyDown)

#### アセット
1. `src/assets/images/labyrinth_echo_card_bg.webp` — プレースホルダー画像配置

---

## Phase 1-5: テスト

### 作業内容
1. GameListPage テストの更新
   - 10個目のゲームカードの存在確認
   - 「迷宮の残響」テキストの存在確認
   - ナビゲーション先の確認
2. 既存テストの通過確認

---

## Phase 1-6: 検証

### 作業内容
1. `npm run build` — ビルド成功確認
2. `npm run lint` — エラー0確認
3. `npm run test` — 全テストパス確認
4. 開発サーバーでの動作確認
   - ゲーム一覧表示
   - ゲーム起動
   - タイトル→難易度選択→ゲーム開始の基本フロー

---

## Phase 2: リファクタリング（今回スコープ外）

後続ブランチ (`feature/labyrinth-echo-refactor`) で実施予定。

### 計画内容
1. モノリスファイルの分割
   - `audio.ts` — AudioEngine 分離
   - `config.ts` — CFG, DIFFICULTY 分離
   - `logic.ts` — Pure game logic 分離
   - `events.ts` — EVENT DATA 分離
   - `definitions.ts` — Titles, Endings 分離
   - `styles.ts` — CSS, PAGE_STYLE 分離
2. カスタムフック分離
   - `hooks/usePersistence.ts`
   - `hooks/useVisualFx.ts`
3. UIコンポーネント分離
   - `components/ErrorBoundary.tsx`
   - `components/Page.tsx`
   - `components/TypewriterText.tsx`
   - その他
4. CSS 文字列インジェクション → CSS Modules or styled-components 変換
5. 完全な TypeScript 型付け（`any` 排除）
6. ユニットテスト追加

---

## 完了条件

- [Phase 0] ブランチ・ドキュメントが揃っている
- [Phase 1] ゲームがプラットフォーム上で起動し基本フローが動作する
- [Phase 1] `npm run build` / `npm run lint` / `npm run test` が全てパスする
- [Phase 1] GameListPage に10番目のゲームカードとして表示される

## システムテスト影響範囲
- 影響画面: `GameListPage` (カード追加), `LabyrinthEchoPage` (新規)
- 既存ゲームへの影響: なし（新規追加のみ）
