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
    entities.ts          # エンティティ定義（パック、マレット）
    items.ts             # アイテムシステム
    sound.ts             # 効果音生成
    config.ts            # ゲーム設定
    types.ts             # 型定義
src/pages/AirHockeyPage.tsx   # ページコンポーネント（Canvas 描画含む）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useEffect`）
- `useRef` でゲームループの状態をフレーム間で保持

### 使用技術

- **Canvas 2D**: リアルタイム物理演算＆描画
- **Web Audio API**: 効果音の動的生成
- **物理演算**: 衝突判定（円-円、円-壁）、反射、摩擦
- **AI**: 難易度に応じた CPU 戦略
