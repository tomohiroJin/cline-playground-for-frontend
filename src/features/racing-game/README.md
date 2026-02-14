# Racing Game（レーシングゲーム）

## 概要

トップダウンビューのレーシングゲーム。
チェックポイントを通過してラップタイムを競う。
環境に応じたデコレーション生成やパーティクルエフェクトで臨場感を演出。

## 操作方法

- **矢印キー上/下**: 加速 / ブレーキ
- **矢印キー左/右**: 旋回
- **モバイル**: タッチボタン操作

## 技術詳細

### ファイル構成

```
src/features/racing-game/
  types.ts              # 型定義
  constants.ts          # ゲーム設定定数
  entities.ts           # エンティティ生成・管理
  track.ts              # コース定義
  utils.ts              # ユーティリティ関数
  game-logic.ts         # ゲームロジック（純粋関数）
  renderer.ts           # Canvas 描画
  audio.ts              # 効果音生成
  hooks.ts              # カスタムフック
  RacingGame.tsx        # メインゲームコンポーネント
  index.ts              # barrel export
  components/
    VolumeControl.tsx   # 音量コントロール
  __tests__/            # ユニットテスト
    entities.test.ts
    game-logic.test.ts
    track.test.ts
    utils.test.ts
src/pages/RacingGamePage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useEffect`, `useCallback`, `memo`）
- カスタムフックによるゲーム状態管理

### 使用技術

- **Canvas 2D**: トップダウン描画、カメラ追従
- **Web Audio API**: エンジン音・衝突音の動的生成
- **パーティクルシステム**: スパーク、紙吹雪エフェクト
- **デコレーション生成**: コースに応じた環境オブジェクト（木、建物、山、ビーチ、雪）
