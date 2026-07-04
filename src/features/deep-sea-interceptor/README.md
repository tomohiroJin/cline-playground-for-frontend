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
  enemy-visual.ts       # 通常敵の見た目・挙動メタデータ（描画・移動・予兆が共有）
  weapon.ts             # 武器ロジック（純粋関数）
  visuals.ts            # 純粋描画ヘルパー（ネオングロー・当たり判定・敵弾コア）
  achievements.ts       # 実績システム（定義・達成判定・保存）
  game-logic.ts         # ゲームロジック（純粋関数）
  audio.ts              # 効果音生成
  hooks.ts              # カスタムフック
  styles.ts             # スタイル定義
  DeepSeaInterceptorGame.tsx  # メインゲームコンポーネント
  index.ts              # barrel export
  domain/               # ドメイン層
    entities/           #   エンティティ（enemy, position）
    events/             #   ゲームイベント定義
    services/           #   衝突判定・スコア計算サービス
    strategies/         #   ストラテジー（enemy-ai, gimmick, movement, weapon）
  application/          # アプリケーション層
    achievements/       #   実績達成チェッカー
  infrastructure/       # インフラ層
    audio/              #   オーディオシステム
    input/              #   入力ハンドラ
    storage/            #   実績・スコアのリポジトリ（localStorage）
  presentation/         # プレゼンテーション層
    screens/            #   タイトル・リザルト画面
  components/
    BulletSprite.tsx    # 弾描画
    EnemyBulletSprite.tsx  # 敵弾描画（弾種別の演出）
    EnemySprite.tsx     # 敵描画
    HUD.tsx             # ヘッドアップディスプレイ
    PlayerSprite.tsx    # プレイヤー描画
    ShockwaveRing.tsx   # 衝撃波リング（ボス撃破演出）
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
- **実績システム**: プレイ統計に基づく達成判定と localStorage への保存
- **敵弾演出**: 弾種別のネオングロー描画（`EnemyBulletSprite` + `visuals.ts`）
- **衝撃波リング**: ボス撃破時のリング拡散演出（`ShockwaveRing`）
- **敵ビジュアル個性化**: 通常敵の見た目・挙動メタデータを一元管理（`enemy-visual.ts`）
