# Labyrinth of Shadows（迷宮の影）

## 概要

疑似3D視点の迷路ホラーゲーム。
鍵を集めて敵から逃げながら出口を目指す。
レイキャスティングによるレトロFPS風の描画が特徴。

## 操作方法

- **WASD / 矢印キー**: 移動
- **Shift**: ダッシュ
- **Ctrl**: 隠れる
- **モバイル**: タッチボタン操作

## 技術詳細

### ファイル構成

```
src/features/labyrinth-of-shadows/
  types.ts              # 型定義
  constants.ts          # ゲーム設定定数
  entity-factory.ts     # エンティティ生成
  maze-service.ts       # 迷路生成サービス
  utils.ts              # ユーティリティ関数
  game-logic.ts         # ゲームロジック（純粋関数）
  renderer.ts           # Canvas レイキャスティング描画
  audio.ts              # 効果音生成
  LabyrinthOfShadowsGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export
  components/
    Controls.tsx        # 操作UI
    HUD.tsx             # ヘッドアップディスプレイ
    Minimap.tsx         # ミニマップ
    ResultScreen.tsx    # リザルト画面
    TitleScreen.tsx     # タイトル画面
  __tests__/            # ユニットテスト
    entity-factory.test.ts
    game-logic.test.ts
    maze-service.test.ts
    utils.test.ts
src/pages/MazeHorrorPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`）

### 使用技術

- **Canvas 2D**: 疑似3Dレイキャスティング（レトロFPS風描画）
- **Web Audio API**: 効果音生成
- **迷路生成アルゴリズム**: ランダム迷路の自動生成
- **敵AI**: プレイヤー追跡ロジック
- **ミニマップ**: 画面端にリアルタイム表示
- **スタミナ管理**: ダッシュ・隠れるアクションの制限
