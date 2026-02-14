# Non-Brake Descent（ノンブレーキ・デッセント）

## 概要

ブレーキなしで高速下り坂を走り続けるハイスピードランニングアクション。
障害物を避け、コインを集めてハイスコアを目指す。
DDD風のドメイン分離による整理されたコード構成が特徴。

## 操作方法

- **矢印キー左/右**: 左右移動
- **モバイル**: タッチボタン操作

## 技術詳細

### ファイル構成

```
src/features/non-brake-descent/
  NonBrakeDescentGame.tsx   # メインゲームコンポーネント
  types.ts                  # 型定義
  config.ts                 # 設定
  constants.ts              # 定数
  hooks.ts                  # カスタムフック
  domains/
    collision-domain.ts     # 衝突判定
    combo-domain.ts         # コンボシステム
    danger-domain.ts        # 危険度判定
    geometry-domain.ts      # 座標計算
    scoring-domain.ts       # スコア計算
    speed-domain.ts         # 速度管理
    math-utils.ts           # 数学ユーティリティ
    non-brake-descent-domains.test.ts  # ドメインテスト
  renderers/
    index.tsx               # エクスポート集約
    effects/index.tsx       # エフェクト描画
    entities/index.tsx      # エンティティ描画
    environment/index.tsx   # 環境描画
    ui/index.tsx            # UI 描画
  entities.ts               # エンティティ定義
  generators.ts             # オブジェクト生成
  physics.ts                # 物理演算
  particles.ts              # パーティクルエフェクト
  audio.ts                  # 効果音
src/pages/NonBrakeDescentPage.tsx   # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`, `useMemo`）
- カスタムフック（`useCheatCode`, `useIsMobile`）

### 使用技術

- **CSS / Styled Components**: DOM ベースのレンダリング（Canvas 不使用）
- **Web Audio API**: 効果音
- **DDD 風設計**: ドメインロジックを `domains/` に分離
- **パーティクルシステム**: エフェクト表現
- **スコアポップアップ**: コンボ時のビジュアルフィードバック
