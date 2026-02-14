# KEYS & ARMS

## 概要

Game & Watch 風のアクションゲームを React コンポーネントとして完全移植した版です。
元の HTML ファイル（2,522行）のゲームロジックを `engine.ts` のクロージャに格納し、
React は薄いラッパーとしてのみ機能します。

## 配置構成

```text
src/features/keys-and-arms/
  engine.ts             # ゲームエンジン（オーケストレータ）
  KeysAndArmsGame.tsx   # React ラッパー（Canvas + 仮想パッド）
  styles.ts             # styled-components スタイル
  constants.ts          # ゲーム定数
  difficulty.ts         # 難易度設定
  core/
    math.ts             # 数学計算
    audio.ts            # 効果音
    rendering.ts        # Canvas 描画共通処理
    particles.ts        # パーティクルエフェクト
    hud.ts              # HUD 描画
  stages/
    cave/index.ts       # 洞窟ステージ
    prairie/index.ts    # 草原ステージ
    boss/index.ts       # ボスステージ
  screens/
    title.ts            # タイトル画面
    game-over.ts        # ゲームオーバー画面
    ending.ts           # エンディング画面
    true-end.ts         # トゥルーエンド画面
  __tests__/
    difficulty.test.ts  # 難易度テスト
src/pages/KeysAndArmsPage.tsx  # ページコンポーネント
```

## 実装方針

- EngineContext パターンを導入し、ゲームロジックを core/ stages/ screens/ に分割
- localStorage キー `kaG` でハイスコア保存（元実装と同一）
- フォント `Press Start 2P` は public/index.html でプリロード

## 起動URL

- `/keys-and-arms`
