# KEYS & ARMS

## 概要

Game & Watch風のLCD表現で進行するステージ制アクション。
`cave -> grass -> boss` の3ステージをループしながらスコアを積み上げる。

## 操作方法

- `ArrowUp / ArrowDown / ArrowLeft / ArrowRight` または `WASD`: 移動
- `Z / Space / Enter`: アクション
- `Escape`: タイトルへ戻る
- 画面内の D-pad / ACT / RST ボタンでも同様に操作可能

## ファイル構成

```text
src/features/keys-and-arms/
  KeysAndArmsGame.tsx       # ゲーム本体（canvas / loop / 統合）
  constants.ts              # 画面サイズ・tick・スコア定数
  types.ts                  # 型定義
  input.ts                  # keyboard / virtual button 入力
  audio.ts                  # Web Audio API ラッパー
  storage.ts                # ハイスコア永続化
  engine/
    state-machine.ts        # 状態遷移
    difficulty.ts           # 難易度計算
    scoring.ts              # スコア計算
    collision.ts            # 当たり判定補助
  render/
    sprites.ts              # スプライト定義
    effects.ts              # ポップアップ更新
    renderer.ts             # 描画統合
```

## 永続化

- 主キー: `game_score_keys_and_arms`
- 互換読込: `kaG`
