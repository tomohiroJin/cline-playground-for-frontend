# Deep Sea Interceptor（深海インターセプター）

## 概要

深海を舞台にした縦スクロールシューティングゲーム。
多彩な敵タイプとボス戦、チャージショットシステムを搭載。
パワーアップアイテムを集めて火力を強化しながら深海を進む。

## 操作方法

- **マウス**: 自機移動
- **クリック**: 射撃
- **長押し**: チャージショット
- **モバイル**: タッチ操作

## 技術詳細

### ファイル構成

```
src/features/deep-sea-interceptor/
  types.ts              # 型定義
  constants.ts          # ゲーム設定定数
  entities.ts           # エンティティ生成・管理
  movement.ts           # 移動ロジック
  collision.ts          # 衝突判定
  enemy-ai.ts           # 敵AIロジック
  game-logic.ts         # ゲームロジック（純粋関数）
  audio.ts              # 効果音生成
  hooks.ts              # カスタムフック
  styles.ts             # スタイル定義
  DeepSeaInterceptorGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export
  components/
    BulletSprite.tsx    # 弾描画
    EnemySprite.tsx     # 敵描画
    HUD.tsx             # ヘッドアップディスプレイ
    PlayerSprite.tsx    # プレイヤー描画
    TouchControls.tsx   # タッチ操作UI
  __tests__/            # ユニットテスト
    collision.test.ts
    enemy-ai.test.ts
    entities.test.ts
    game-logic.test.ts
    movement.test.ts
src/pages/DeepSeaShooterPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useReducer`, `useCallback`, `memo`）
- カスタムフックによるゲーム状態管理

### 使用技術

- **Canvas 2D**: 描画・当たり判定
- **Web Audio API**: 効果音生成
- **エンティティシステム**: 弾、敵、アイテム、パーティクル、背景レイヤーを統一管理
- **ボス戦**: 専用の行動パターンと体力ゲージ
- **チャージショット**: 長押しでため撃ち
