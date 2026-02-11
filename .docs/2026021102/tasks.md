# KEYS & ARMS src移植 タスクチェックリスト（再発防止版）

## Phase 0: 分析と対応表作成

- [ ] `public/games/keys-and-arms/index.html` の主要状態と変数を列挙する
- [ ] `public/games/keys-and-arms/index.html` の主要関数を列挙する
- [ ] 入力（keyboard/touch）、音、保存の処理箇所を列挙する
- [ ] `source-map.md` を作成し、元コードと移植先の対応を記載する
- [ ] `source-map.md` の主要項目 TODO を解消する
- [ ] 禁止事項チェックを実施し、逸脱禁止を明記する

## Phase 1: 骨組み移植

- [ ] `src/features/keys-and-arms/` ディレクトリを作成する
- [ ] `types.ts` に主要状態型（scene/score/hp/stage/loop）を定義する
- [ ] `constants.ts` に画面サイズ・キー名・保存キー等を定義する
- [ ] `KeysAndArmsGame.tsx` に Canvas 初期化とループ開始/停止を実装する
- [ ] `KeysAndArmsPage.tsx` を iframe からゲームコンポーネント描画へ置換する
- [ ] `KeysAndArmsPage.test.tsx` を iframe 前提から更新する

## Phase 2: 状態遷移移植

- [ ] `engine/transitions.ts` にシーン遷移を実装する
- [ ] `engine/update.ts` に tick 更新を実装する
- [ ] `title -> play -> over/ending1/trueEnd` の遷移条件を移植する
- [ ] ステージ進行（cave -> grass -> boss）条件を移植する
- [ ] 状態遷移ユニットテストを追加する

## Phase 3: 入力移植

- [ ] `input.ts` に keyboard の down/up/justPressed を実装する
- [ ] 仮想パッド（D-Pad/ACT/RST）入力を実装する
- [ ] `touchcancel` と `window blur` の入力解放を実装する
- [ ] キーリピート時に justPressed が暴発しないことを確認する
- [ ] 手動確認: 入力固着がないことを確認する

## Phase 4: 描画・演出移植

- [ ] `render/sprites.ts` に主要スプライト描画を移植する
- [ ] `render/effects.ts` にポップアップ/ヒット演出を移植する
- [ ] `render/renderer.ts` に描画順（背景→主体→演出→HUD）を実装する
- [ ] HUD（SCORE/HP/LOOP/状態）を元仕様で表示する
- [ ] 手動確認: cave/grass/boss の見た目差分を記録する

## Phase 5: 音・保存・導線

- [ ] `audio.ts` に AudioContext のユーザー操作開始を実装する
- [ ] BGM/SFX の再生タイミングを元仕様に合わせる
- [ ] `storage.ts` にハイスコア保存/復元を実装する
- [ ] 旧キー `kaG` から新キー `game_score_keys_and_arms` へ移行読込を実装する
- [ ] `App.keys-and-arms-route.test.tsx` を iframe 依存なしに更新する
- [ ] `GameListPage` からの導線維持を確認する

## Phase 6: 同等性検証

- [ ] `parity-report.md` を作成する
- [ ] 比較項目: 進行・被弾・スコア・エンディング分岐・入力・音・保存 を記録する
- [ ] 既知差分がある場合は理由と影響を記載する
- [ ] 禁止事項違反がないことを最終確認する
- [ ] `parity-report.md` の判定を `PASS` にする

## Phase 7: 最終検証と完了報告

- [ ] `npm test` を実行して成功させる
- [ ] `npm run build` を実行して成功させる
- [ ] `KeysAndArmsPage` と `keys-and-arms feature` 配下に `iframe` 参照がないことを確認する
- [ ] デプロイ相当環境で `/keys-and-arms` 起動確認を実施する
- [ ] 完了報告に「実装範囲・未解決差分・確認結果」を記載する

## 付録: 実装時の強制チェック

- [ ] 推測実装をしていない（元HTML参照で実装した）
- [ ] 新規ルールを追加していない
- [ ] 簡略化で仕様を置換していない
- [ ] フェーズ証跡（対応表/比較表）を更新した
