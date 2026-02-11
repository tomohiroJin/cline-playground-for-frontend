# KEYS & ARMS Parity Report（同等性確認レポート）

## 1. 比較対象

- 元実装: `public/games/keys-and-arms/index.html`
- 移植実装: `src/features/keys-and-arms/*`

## 2. 比較結果（2026-02-11 時点）

| 項目 | 結果 | 証跡 |
|---|---|---|
| タイトル開始 | PARTIAL | `engine/update.ts` で `title -> play` 実装 |
| cave進行 | PARTIAL | `engine/update.ts` でキー収集/設置による `cave -> grass` 実装 |
| grass進行 | PARTIAL | `engine/update.ts` で撃破数目標による `grass -> boss` 実装 |
| boss進行 | PARTIAL | `engine/update.ts` + `engine/transitions.ts` で 6封印と loop 分岐実装 |
| game over遷移 | PARTIAL | `engine/update.ts` で HP 0 時 `over` |
| ending1/trueEnd分岐 | PARTIAL | `loop=1 -> ending1`, `loop=2 -> 次ループ`, `loop>=3 -> trueEnd` |
| スコア加算 | PARTIAL | `engine/scoring.ts` + `update.ts` |
| キーボード入力 | PARTIAL | `input.ts` + `input.test.ts`（key repeat） |
| タッチ入力 | PARTIAL | `input.ts` + `input.test.ts`（touchcancel 解放） |
| 音声開始/再生 | PARTIAL | `audio.ts` + `audio.test.ts`（stage別BGM tick） |
| ハイスコア保存/復元 | PARTIAL | `storage.ts` + `storage.test.ts`（`kaG` 移行あり） |

## 3. 既知差分

- Stage 1/2/3 の詳細挙動（敵行動、被弾条件、演出）は未移植
- スプライトは主要要素のみ移植済みで、元HTMLの全ピクセルアート未移植
- BGM/SFX は stage別tickを実装済みだが、元HTMLとの完全同期待ちは未手動検証
- 手動検証（入力固着、見た目比較）は未実施

## 4. 受け入れ判定

- 判定: FAIL
- 理由: Phase 1〜2 の骨組み段階であり、同等性要件をまだ満たしていない

## 5. 検証コマンド記録

- `npm test -- --coverage=false --runInBand src/features/keys-and-arms/engine/update.test.ts src/pages/KeysAndArmsPage.test.tsx src/App.keys-and-arms-route.test.tsx` : PASS
- `npm test -- --coverage=false --runInBand src/features/keys-and-arms/audio.test.ts src/features/keys-and-arms/storage.test.ts src/features/keys-and-arms/input.test.ts src/features/keys-and-arms/engine/update.test.ts src/pages/KeysAndArmsPage.test.tsx src/App.keys-and-arms-route.test.tsx` : PASS
- `npm run build` : PASS（既存アセットのサイズ警告のみ）
- `npm test -- --coverage=false --runInBand src/pages/GameListPage.test.tsx` : PASS
- `rg -n "iframe|games/keys-and-arms/index.html" src/pages/KeysAndArmsPage.tsx src/features/keys-and-arms` : 0件
