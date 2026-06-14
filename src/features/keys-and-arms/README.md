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

## 操作方法

| キー | 動作 |
|------|------|
| ←→↑↓ | 移動 |
| Z / スペース | アクション（拾う、攻撃、設置） |
| P / PAUSE ボタン | ポーズ / 再開 |
| ESC / RST ボタン | タイトルに戻る（確認あり） |
| ↑（タイトル画面） | 操作ガイド表示 |

### 各ステージの操作

- **CAVE（洞窟）**: ←→↑↓で移動、Zで鍵を拾う/置く、Z長押しでケージ開放
- **PRAIRIE（草原）**: ↑→↓で攻撃方向、←でガード、コンボで高スコア
- **CASTLE（城）**: ←→で移動、Zで宝石設置、↑でシールド、↓でカウンター

## 注意事項

- **音声あり**: Web Audio API による効果音・BGM が再生されます
- **フラッシュ演出あり**: ダメージ時やビートパルスで画面が点滅します

## デバッグ / 隠しコマンド（GOD MODE）

タイトル画面で隠しコマンドを入力すると、HP を増やした状態でゲームを開始できます。

1. **タイトル画面で**キーボードから `j` → `i` → `n`（"jin"）と入力する
2. 画面に **`— GOD MODE —`** と表示されればチート有効
3. **スペース** または **Enter** でゲームを開始すると、HP / 最大HP が `3` → `20` になる

- 判定ロジック: `screens/title.ts`（`cheatBuf.endsWith('jin')` → `hp = cheat ? 20 : 3`）
- 入力蓄積: `engine.ts` の title 節（a〜z のキー入力を `G.cheatBuf` に蓄積）
- 仮想パッドでは a〜z を入力できないため、**物理キーボード必須**

## 既知の問題

### GOD MODE が `z` 開始だと発動しない

`engine.ts` の title 節では、開始キー `z` が「チート文字蓄積ループ（a〜z）」にも含まれます。
そのため `z` で開始すると、同じティック内で `G.cheatBuf` が `jin` → **`jinz`** になり、
直後の `startGame()` の `cheatBuf.endsWith('jin')` が `false` になって GOD MODE が発動しません。

- **回避策**: 開始は **スペース** か **Enter** で行う（どちらも a〜z 外なので `cheatBuf` が保たれる）
- **発生源**: 2026-06 の状態管理リファクタリング以前から存在する既存バグ（当該リファクタは無関係）
- **根治案**: title 節のチート蓄積ループで開始キー `z` を除外する、
  または開始判定をチート蓄積より前に移動する
- **挙動の固定**: `__tests__/integration/god-mode.test.ts` がスペース/Enter 発動・`z` 非発動を
  実行可能な形で検証している（根治した際はこのテストの期待値を更新すること）

## 起動URL

- `/keys-and-arms`
