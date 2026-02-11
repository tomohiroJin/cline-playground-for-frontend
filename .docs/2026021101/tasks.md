# KEYS & ARMS 実作業タスク

## Phase 0: 事前準備

- [x] `.tmp/keys-and-arms.html` からアセット・ロジック要素を棚卸し
- [x] 状態遷移図（title/cave/grass/boss/over/ending）を作成
- [x] sprite定義と描画関数の分割単位を確定

## Phase 1: 基盤作成

- [ ] `src/features/keys-and-arms/` を作成
- [ ] `types.ts`（ゲーム状態・入力状態・ステージ状態）を作成
- [ ] `constants.ts`（画面サイズ、tick、定数）を作成
- [ ] `index.ts` を作成

## Phase 2: コアロジック移植

- [ ] `engine/state-machine.ts` を作成（状態遷移）
- [ ] `engine/difficulty.ts` を作成（難易度パラメータ）
- [ ] `engine/scoring.ts` を作成（スコア算出）
- [ ] `engine/collision.ts` を作成（当たり判定/被弾）
- [ ] `storage.ts` を作成（ハイスコア保存/読込）

## Phase 3: 描画・入力・音声

- [ ] `render/sprites.ts` を作成（ピクセルデータ）
- [ ] `render/effects.ts` を作成（パーティクル/ポップアップ）
- [ ] `render/renderer.ts` を作成（描画統合）
- [ ] `input.ts` を作成（keyboard/touch）
- [ ] `audio.ts` を作成（SFX/BGM）
- [ ] `KeysAndArmsGame.tsx` を作成（canvas loop + lifecycle）

## Phase 4: プラットフォーム統合

- [ ] `src/pages/KeysAndArmsPage.tsx` を作成
- [ ] `src/App.tsx` に lazy import と `/keys-and-arms` route を追加
- [ ] `src/pages/GameListPage.tsx` にカード追加
- [ ] `src/pages/GameListPage.test.tsx` の件数・ラベル期待値を更新
- [ ] 必要に応じて `src/assets/images/keys_and_arms_card_bg.webp` を追加
- [ ] ルート `README.md` の収録ゲーム一覧を更新

## Phase 5: テスト・検証

- [ ] `difficulty/scoring/state-machine` のユニットテスト作成
- [ ] `KeysAndArmsPage` のレンダリングテスト作成
- [ ] `npm test` 実行
- [ ] `npm run build` 実行
- [ ] キーボード操作の手動確認
- [ ] タッチ操作の手動確認

## Phase 6: 仕上げ

- [ ] `src/features/keys-and-arms/README.md` を作成
- [ ] 既存ゲームへの回帰影響を最終チェック
- [ ] ドキュメント（plan/spec/tasks）との差分を確認し完了報告
