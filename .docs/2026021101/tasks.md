# KEYS & ARMS 実作業タスク

## Phase 0: 事前準備

- [x] `.tmp/keys-and-arms.html` からアセット・ロジック要素を棚卸し
- [x] 状態遷移図（title/cave/grass/boss/over/ending）を作成
- [x] sprite定義と描画関数の分割単位を確定

## Phase 1: 基盤作成

- [x] `src/features/keys-and-arms/` を作成
- [x] `types.ts`（ゲーム状態・入力状態・ステージ状態）を作成
- [x] `constants.ts`（画面サイズ、tick、定数）を作成
- [x] `index.ts` を作成

## Phase 2: コアロジック移植

- [x] `engine/state-machine.ts` を作成（状態遷移）
- [x] `engine/difficulty.ts` を作成（難易度パラメータ）
- [x] `engine/scoring.ts` を作成（スコア算出）
- [x] `engine/collision.ts` を作成（当たり判定/被弾）
- [x] `storage.ts` を作成（ハイスコア保存/読込）

## Phase 3: 描画・入力・音声

- [x] `render/sprites.ts` を作成（ピクセルデータ）
- [x] `render/effects.ts` を作成（パーティクル/ポップアップ）
- [x] `render/renderer.ts` を作成（描画統合）
- [x] `input.ts` を作成（keyboard/touch）
- [x] `audio.ts` を作成（SFX/BGM）
- [x] `KeysAndArmsGame.tsx` を作成（canvas loop + lifecycle）

## Phase 4: プラットフォーム統合

- [x] `src/pages/KeysAndArmsPage.tsx` を作成
- [x] `src/App.tsx` に lazy import と `/keys-and-arms` route を追加
- [x] `src/pages/GameListPage.tsx` にカード追加
- [x] `src/pages/GameListPage.test.tsx` の件数・ラベル期待値を更新
- [x] 必要に応じて `src/assets/images/keys_and_arms_card_bg.webp` を追加（今回は `CardImageArea` の `$customBg` を採用）
- [x] ルート `README.md` の収録ゲーム一覧を更新

## Phase 5: テスト・検証

- [x] `difficulty/scoring/state-machine` のユニットテスト作成
- [x] `KeysAndArmsPage` のレンダリングテスト作成
- [x] `npm test` 実行
- [x] `npm run build` 実行
- [ ] キーボード操作の手動確認
- [ ] タッチ操作の手動確認

## Phase 6: 仕上げ

- [x] `src/features/keys-and-arms/README.md` を作成
- [x] 既存ゲームへの回帰影響を最終チェック
- [x] ドキュメント（plan/spec/tasks）との差分を確認し完了報告

## Phase 7: レビュー対応（2026-02-11 追記）

- [x] `highScore` 更新時にゲーム状態が初期化される問題を修正
- [x] RST/ESC のタイトル遷移時にハイスコア保存判定を追加
- [x] 仮想ボタン入力に `touchcancel` 解放処理を追加
- [x] ステージ進行を「固定時間被弾/固定時間クリア」から「ハザード接触/目標達成」へ変更
- [x] 追加回帰テストを作成（状態継続、保存、進行）
- [x] `npm test` と `npm run build` を再実行

## Phase 8: 忠実移植やり直し（2026-02-11 追記）

- [ ] `public/games/keys-and-arms/index.html` に元HTMLを配置
- [ ] `KeysAndArmsPage` を iframe 埋め込み方式へ変更
- [ ] 簡易再実装コード（`src/features/keys-and-arms/`）を撤去し README のみに整理
- [ ] 関連テストを忠実移植方式へ更新
- [ ] `npm test` と `npm run build` を再実行
- [ ] キーボード/タッチの手動確認を実施
