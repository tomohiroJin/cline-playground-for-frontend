# KEYS & ARMS 移植実装計画

## 1. 目的

`local/cline-playground-for-frontend/.tmp/keys-and-arms.html`（単一HTML実装）を、既存ゲームプラットフォーム（React + TypeScript）上で起動可能な新規ゲームとして統合する。

## 2. 解析サマリ

- 元実装は **2522行** の単一HTML + inline CSS + inline JS。
- ゲームループは `requestAnimationFrame` + 固定tick（`TICK_RATE=30`）のハイブリッド。
- 画面状態は `title / cave / grass / boss / over / ending1 / trueEnd / transition` で遷移。
- 入力はキーボード + 仮想D-Pad/ACT（DOMボタン）で `kd/jp` を管理。
- 音声は Web Audio API の生オシレータ実装（`AudioContext`）。
- 永続化は `localStorage` キー `kaG`（ハイスコア）。
- ステージは3部構成（Cave, Prairie, Castle/Boss）+ ループ進行。

## 3. 移植方針

- 単一HTMLをそのまま埋め込まず、プラットフォーム構造に合わせて **機能分割** する。
- `src/features/keys-and-arms/` を新設し、描画・入力・ロジック・音声を分離。
- ページは `src/pages/KeysAndArmsPage.tsx` の薄いラッパー構成にする。
- ルーティングは `src/App.tsx` の lazy import + `<Route>` 追加で統合。
- 一覧は `src/pages/GameListPage.tsx` にカード追加して遷移可能にする。
- 永続化キーは衝突回避のため `kaG` からプラットフォーム固有キーへ変更。

## 4. フェーズ計画

### Phase 1: 基盤整備
- `src/features/keys-and-arms/` ディレクトリ作成
- 型定義（GameState, SceneState, InputState, StageState）
- 定数分離（canvasサイズ、tick、スコア係数、難易度）

### Phase 2: コアロジック移植
- ユーティリティ（乱数、clamp、時間補助）
- ステージ遷移ロジック（cave/grass/boss）
- ループ進行・被弾・クリア・ループ加算
- ハイスコア管理（storageラッパー）

### Phase 3: レンダリング移植
- Canvas描画層の分割（背景、HUD、スプライト、エフェクト）
- ピクセルアート定数の分離（sprite data）
- 既存視覚表現（LCD風）を維持しつつ React 管理下に移行

### Phase 4: 入力・音声移植
- キーボード入力（押下/just pressed）
- モバイル向け仮想ボタン（D-pad + ACT + RST）
- Web Audio API のユーザー操作後有効化

### Phase 5: プラットフォーム統合
- `src/pages/KeysAndArmsPage.tsx` 追加
- `src/App.tsx` に lazy import / route（`/keys-and-arms`）追加
- `src/pages/GameListPage.tsx` にカード追加
- 必要ならカード背景画像 `src/assets/images/keys_and_arms_card_bg.webp` 追加

### Phase 6: 品質保証
- 純粋関数テスト（難易度計算、スコア、遷移条件）
- ページ/ゲーム一覧のレンダリング・遷移テスト
- `npm test` / `npm run build` で回帰確認

## 5. リスクと対策

- リスク: 単一ファイル由来の密結合により不具合混入
- 対策: 状態遷移を reducer/純粋関数に先に分離

- リスク: Canvas描画分割で見た目差異が出る
- 対策: 描画優先度（背景→オブジェクト→HUD）を固定し差分確認

- リスク: モバイル入力の取りこぼし
- 対策: Pointerイベントの一本化 + 既存テストに加えて手動確認

- リスク: localStorageキー競合
- 対策: `game_score_keys_and_arms` などに統一

## 6. 完了条件

- ゲーム一覧から `KEYS & ARMS` を選択してプレイ可能
- 主要状態遷移（Title→3ステージ→Ending/GameOver）が動作
- キーボード・タッチ双方で操作可能
- ハイスコアが保存・復元される
- 既存ゲームのビルド/テストに回帰がない
