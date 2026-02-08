# 迷宮の残響（Labyrinth Echo）

## 概要

テキスト探索×判断×ローグライトRPG。
不確かな情報の中で選択を重ね、迷宮からの生還を目指す。
周回プレイで知見ポイント（KP）を蓄積し、アンロック要素を解放して深層攻略に挑む。
全5階層・4難易度・複数エンディングを搭載した本格的なテキストアドベンチャー。

## 操作方法

- **マウスクリック**: 選択肢を選択、メニュー操作

## 技術詳細

### ファイル構成

```
src/features/labyrinth-echo/
  LabyrinthEchoGame.tsx     # メインゲームコンポーネント（約4360行）
  storage.ts                # localStorage ラッパー
  types.ts                  # 型定義
  index.ts                  # barrel export
src/pages/LabyrinthEchoPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useEffect`, `useRef`, `useMemo`）
- カスタムフック（`useMeta` でメタデータ管理、`useShake` で画面振動）

### 使用技術

- **Web Audio API**: AudioEngine による効果音（トーン、ノイズ、スウィープ、環境音）
- **CSS Animation**: フェード、グロー、パルスアニメーション
- **Design-by-Contract (DbC)**: `invariant` によるアサーション
- **ErrorBoundary**: クラスコンポーネントによるエラーハンドリング
- **localStorage**: セーブデータ永続化（周回情報、アンロック状態）

### ゲームシステム

- **階層構造**: 表層回廊→灰色の迷路→深淵の間→忘却の底→迷宮の心臓（全5階層）
- **難易度**: 探索者（Easy）/ 挑戦者（Normal）/ 求道者（Hard）/ 修羅（Abyss）
- **アンロックシステム**: 基本・特別・トロフィー・実績の4カテゴリ（40種）
- **状態異常**: 負傷・混乱・出血・恐怖・呪いの5種
- **複数エンディング**: プレイ内容に応じた分岐
