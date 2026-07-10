# Labyrinth of Shadows（迷宮の影）

## 概要

疑似3D視点の迷路ホラーゲーム。
鍵を集めて敵から逃げながら出口を目指す。
レイキャスティングによるレトロFPS風の描画が特徴。

## 操作方法

- **WASD / 矢印キー**: 移動
- **Shift**: ダッシュ
- **Space**: 隠れる
- **左クリック**: 🪨 小石を投げる（着地音で敵を誘導）
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
| 🪨 小石 | 投げて着地音で敵を誘導（初期3個・最大5個所持） |

## 敵の種類

| 敵 | 行動パターン |
|----|------------|
| 👹 追跡型 | プレイヤーを積極的に追跡 |
| 👻 徘徊型 | ランダムに巡回 |
| 🌀 テレポート型 | 瞬間移動して接近 |

### 敵AI・逃走の駆け引き（Phase 2）

- **視線モデル**: 敵は正面 ±60°（合計120°）の視野角と壁遮蔽判定を持つレイキャストで、視野角内かつ壁に遮られていない場合のみプレイヤーを発見する
- **状態機械**: `patrol`（巡回）→ `chase`（追跡。プレイヤーを視認中に遷移）→ `search`（捜索。見失った最終目撃地点へ向かい周囲を捜索）の3状態を遷移する
- **隠れ場所は視線切り連動**: プレイヤーが「隠れる」を使っても即座に安全になるわけではなく、視認されていた場合は最終目撃地点まで敵が来て捜索する（隠れるタイミング・場所が重要）
- **石投げによる索敵誘導**: 左クリックで小石を投げると着地音が発生し、一定半径内の敵を `search` 状態へ誘導して引き付けられる。初期所持数3・最大所持数5で、既に `chase` 状態（追跡中）の敵には効果がない
- **敵速度キャップ**: 敵の移動速度はプレイヤーの0.9倍を上限としてキャップされる。難易度差は敵数・視野範囲・捜索の粘り強さで表現する

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
  domain/               # ドメイン層
    models/             #   ドメインモデル（item）
    services/           #   ドメインサービス（collision, enemy-strategy, pathfinding, scoring）
    types.ts            #   ドメイン型定義
    constants.ts        #   ドメイン定数
  application/          # アプリケーション層
    game-events.ts      #   ゲームイベント定義
  infrastructure/       # インフラ層
    audio/              #   オーディオサービス
    rendering/          #   描画設定・レンガテクスチャ生成
  presentation/         # プレゼンテーション層
    hooks/              #   use-input, use-audio, use-pointer-look（ゲームループは game-tick.ts に分離）
    styles/             #   ゲーム画面スタイル
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
