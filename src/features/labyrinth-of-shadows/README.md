# Labyrinth of Shadows（迷宮の影）

## 概要

疑似3D視点の迷路ホラーゲーム。
鍵を集めて敵から逃げながら出口を目指す。
レイキャスティングによるレトロFPS風の描画が特徴。

## 操作方法

- **WASD / 矢印キー**: 移動
- **Shift**: ダッシュ
- **Space**: 隠れる
- **Escape**: ポーズ
- **モバイル**: タッチボタン操作

## アイテム

| アイテム | 効果 |
|---------|------|
| 🔑 鍵 | 出口を開ける（全て集める必要あり） |
| 📦 ？箱 | 罠！制限時間-12秒 |
| 💊 回復薬 | ライフ+1（体力満タンなら+50pt） |
| ⚡ 加速 | 10秒間移動速度アップ |
| 🗺️ 地図 | 周囲のマップを公開 |

## 敵の種類

| 敵 | 行動パターン |
|----|------------|
| 👹 追跡型 | プレイヤーを積極的に追跡 |
| 👻 徘徊型 | ランダムに巡回 |
| 🌀 テレポート型 | 瞬間移動して接近 |

## 技術詳細

### ファイル構成

```
src/features/labyrinth-of-shadows/
  types.ts              # 型定義
  constants.ts          # ゲーム設定定数
  entity-factory.ts     # エンティティ生成
  maze-service.ts       # 迷路生成サービス（再帰彫刻 + Prim法 + BFS）
  utils.ts              # ユーティリティ関数
  game-logic.ts         # ゲームロジック（純粋関数）
  renderer.ts           # Canvas レイキャスティング描画
  minimap-renderer.ts   # ミニマップ Canvas 描画
  audio.ts              # 効果音・BGM生成
  LabyrinthOfShadowsGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export
  components/
    Controls.tsx        # 操作UI
    HUD.tsx             # ヘッドアップディスプレイ
    Minimap.tsx         # ミニマップ（Canvas ベース）
    ResultScreen.tsx    # リザルト画面
    TitleScreen.tsx     # タイトル画面
  __tests__/            # ユニットテスト
    entity-factory.test.ts
    game-logic.test.ts
    maze-service.test.ts
    renderer.test.ts
    audio.test.ts
    utils.test.ts
src/pages/MazeHorrorPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`）
- HUD/MapData の変化検知による最適化

### 使用技術

- **Canvas 2D**: 疑似3Dレイキャスティング（レトロFPS風描画）
- **Web Audio API**: 効果音 + プロシージャルアンビエントBGM + 3D音響
- **迷路生成アルゴリズム**: 再帰彫刻法 + Prim法
- **敵AI**: BFSパスファインディング + タイプ別行動パターン
- **ミニマップ**: Canvas ベースでリアルタイム描画
- **スタミナ管理**: ダッシュ・隠れるアクションの制限
- **ポストプロセス**: スキャンライン + ビネット効果
