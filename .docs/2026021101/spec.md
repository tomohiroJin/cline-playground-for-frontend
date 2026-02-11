# KEYS & ARMS 移植仕様

## 1. スコープ

### 1.1 対象
- `keys-and-arms.html` のゲームプレイ体験をプラットフォーム上で再現する。
- 既存プラットフォームの導線（一覧・ルーティング・遅延読込）に統合する。

### 1.2 非対象
- ゲームルールの大幅改変
- 新規ステージや新キャラクター追加
- 既存ゲームのUIリデザイン

## 2. 機能要件

### 2.1 画面遷移
- タイトル画面から開始できること
- ステージ1（Cave）→ステージ2（Prairie）→ステージ3（Boss）へ遷移
- 条件により `ending1` / `trueEnd` に遷移
- 被弾でHP0時はゲームオーバー遷移

### 2.2 入力
- キーボード: `ArrowUp/Down/Left/Right`, `z`, `Space`, `Enter`, `Escape`
- タッチ: 画面内仮想ボタン（D-Pad + ACT + RST）
- just-pressed 判定（1フレーム入力）を保持

### 2.3 描画
- Canvasサイズは元実装準拠（440x340）
- LCD調配色と走査線表現を維持
- HUD（SCORE / HP / LOOP / 状態表示）を表示

### 2.4 音声
- BGM tick / SFX を Web Audio API で再生
- 自動再生制限回避のため初回ユーザー操作で AudioContext を開始
- 設定パネルでミュート時は再生しない設計に接続可能にする

### 2.5 永続化
- ハイスコアを localStorage に保存
- 保存キーは新規: `game_score_keys_and_arms`（予定）
- 旧キー `kaG` からの読み込み互換は任意（実装時に判断）

## 3. アーキテクチャ仕様

## 3.1 推奨ファイル構成

```text
src/features/keys-and-arms/
  index.ts
  KeysAndArmsGame.tsx
  types.ts
  constants.ts
  storage.ts
  input.ts
  audio.ts
  engine/
    state-machine.ts
    difficulty.ts
    scoring.ts
    collision.ts
  render/
    renderer.ts
    sprites.ts
    effects.ts
```

```text
src/pages/KeysAndArmsPage.tsx
```

## 3.2 実装原則
- React側は「初期化・破棄・UIラップ」に限定し、ゲーム進行は engine 層へ分離
- 副作用（audio/storage/event listener）は hooks/モジュールに隔離
- `any` は使わず、主要状態に型を定義

## 4. 統合仕様

### 4.1 ルーティング
- `src/App.tsx` に lazy import を追加
- Route: `/keys-and-arms`

### 4.2 ゲーム一覧
- `src/pages/GameListPage.tsx` にカードを1件追加
- ARIAラベル、キーボード遷移（Enter/Space）を既存パターンに合わせる

### 4.3 ドキュメント
- ルート `README.md` の収録ゲーム一覧へ追記
- `src/features/keys-and-arms/README.md` を新規作成

## 5. テスト仕様

- 単体: 難易度関数、スコア計算、状態遷移判定
- UI: `GameListPage` のカード件数・ラベル確認
- ルート: `/keys-and-arms` がレンダリングされること
- 回帰: `npm run build` が成功すること

## 6. 受け入れ基準

- ゲームが一覧から起動し、プレイ完結可能
- 主要イベント（被弾、クリア、ゲームオーバー、エンディング）が成立
- タッチ・キーボードとも操作可能
- ハイスコアが保存される
- テストとビルドが通る
