# Air Hockey（エアホッケー）

## 概要

CPU対戦型のエアホッケーゲーム。
難易度・フィールド・勝利スコアを選択して対戦する。
物理演算によるリアルなパック挙動とAI戦略を実装。

## 操作方法

- **マウス / タッチ**: マレット（パドル）を操作

## 技術詳細

### ファイル構成

```
src/features/air-hockey/
  core/
    physics.ts          # 物理演算（衝突判定、速度計算）
    ai.ts               # CPU AI ロジック
    entities.ts         # エンティティ定義（パック、マレット）
    items.ts            # アイテムシステム
    sound.ts            # 効果音生成
    config.ts           # ゲーム設定
    constants.ts        # 定数
    types.ts            # 型定義
  hooks/
    useGameLoop.ts      # ゲームループ
    useInput.ts         # 入力ハンドリング
  components/
    Field.tsx           # フィールド描画
    ResultScreen.tsx    # リザルト画面
    Scoreboard.tsx      # スコアボード
    TitleScreen.tsx     # タイトル画面
  AirHockeyGame.tsx     # メインゲームコンポーネント
  renderer.ts           # Canvas 描画
  styles.ts             # スタイル定義
  index.ts              # barrel export
src/pages/AirHockeyPage.tsx  # ページコンポーネント
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useEffect`）
- カスタムフック（`useGameLoop`, `useInput`）でゲームループと入力を分離
- `useRef` でゲームループの状態をフレーム間で保持

### フィールド・ステージ

| ステージ | 特徴 |
|---------|------|
| Original | 障害物なしの標準フィールド |
| Wide | ゴールが広い |
| Pillars | 固定障害物あり |
| Zigzag | ジグザグ配置の固定障害物 |
| Fortress | **破壊可能障害物**（HP3、パック衝突で減少、破壊後5秒で復活） |

### ゲームルール

- 得点後のサーブ: **失点した側にパックが流れる**（失点側がサーブを受ける形）
- フィーバーモード: 連続得点で発動

### 使用技術

- **Canvas 2D**: リアルタイム物理演算＆描画
- **Web Audio API**: 効果音の動的生成
- **物理演算**: 衝突判定（円-円、円-壁）、反射、摩擦
- **AI**: 難易度に応じた CPU 戦略
