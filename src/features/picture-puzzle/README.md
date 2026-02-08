# Picture Puzzle（ピクチャーパズル）

## 概要

画像をスライドパズルとして並び替えるクラシックなパズルゲーム。
画像をアップロードまたはデフォルト画像を選択し、指定した分割数でパズルを楽しめる。
空白の隣のピースをクリックしてスライドし、元の画像を完成させる。

## 操作方法

- **マウスクリック**: ピースをクリックしてスライド移動

## 技術詳細

### ファイル構成

```
src/
  pages/PuzzlePage.tsx              # ページコンポーネント（ラッパー）
  components/PuzzleSections.tsx     # セットアップ・ゲーム画面
  components/molecules/ClearHistoryList.tsx  # クリア履歴表示
  hooks/useGameState.ts             # ゲーム状態管理フック
  hooks/usePuzzle.ts                # パズルロジックフック
  hooks/useHintMode.ts              # ヒントモードフック
  utils/puzzle-utils.ts             # パズルユーティリティ
  utils/storage-utils.ts            # ストレージユーティリティ
```

### 状態管理

- React Hooks（`useState`、カスタムフック）
- `useGameState` でゲームフェーズ管理
- `usePuzzle` でパズルロジック（シャッフル、移動判定、完成判定）

### 使用技術

- **CSS Grid**: パズルピースの配置
- **localStorage**: クリア履歴の永続化
- **画像アップロード**: FileReader API による画像読み込み
