# Falldown Shooter（フォールダウンシューター）

## 概要

上から落ちてくるブロックを弾で撃って消すシューティングゲーム。
ステージが進むと難易度が上昇し、パワーアップアイテムやスキルを駆使して高得点を目指す。

## 操作方法

- **矢印キー左/右**: 移動
- **スペース**: 射撃
- **Z / X / C**: スキル発動
- **モバイル**: タッチボタン操作

## 技術詳細

### ファイル構成

```
src/features/falldown-shooter/
  types.ts              # 型定義
  constants.ts          # ゲーム設定定数
  block.ts              # ブロック生成・管理
  bullet.ts             # 弾管理
  grid.ts               # グリッド管理
  stage.ts              # ステージ進行
  utils.ts              # ユーティリティ関数
  collision.ts          # 衝突判定
  game-logic.ts         # ゲームロジック（純粋関数）
  audio.ts              # 効果音生成
  hooks.ts              # カスタムフック
  FalldownShooterGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export
  components/
    BulletView.tsx      # 弾描画
    CellView.tsx        # セル描画
    Effects.tsx         # エフェクト
    Overlays.tsx        # オーバーレイ
    PlayerShip.tsx      # プレイヤー描画
    PowerUpIndicator.tsx # パワーアップ表示
    SkillGauge.tsx      # スキルゲージ
    StatusBar.tsx       # ステータスバー
  __tests__/            # ユニットテスト
    block.test.ts
    bullet.test.ts
    collision.test.ts
    game-logic.test.ts
    grid.test.ts
    stage.test.ts
    utils.test.ts
src/pages/FallingShooterPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useCallback`）
- カスタムフックによるゲーム状態管理
- パフォーマンス最適化のため `useRef` でゲーム状態管理

### 使用技術

- **CSS Animation**: レーザー、爆発、デンジャーラインエフェクト
- **Web Audio API**: 効果音生成
- **スキルゲージシステム**: 3種類のスキル（Z/X/C）
- **パワーアップ**: トリプルショット、貫通弾、爆弾など
