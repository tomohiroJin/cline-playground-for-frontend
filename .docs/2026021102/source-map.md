# KEYS & ARMS Source Map（元HTML -> src対応表）

## 禁止事項チェック（Phase 0）

- 元HTMLを `iframe` / 直接実行で再利用しない
- 元HTMLにない新規ルールを最終仕様として確定しない
- 差分は本ファイルに記録し、未確定は明示する

## 主要状態と変数（元HTML）

- `state`: `title/cave/grass/boss/over/ending1/trueEnd`
- `loop`, `score`, `hp`, `maxHp`, `tick`, `beatCtr`, `beatNum`
- Stage 1: `cav`（`keysPlaced`, `carrying`, `trapOn`, `batPhase`, `mimicOpen`, `spiderY`）
- Stage 2: `grs`（lane, combo, goal, enemies, shields）
- Stage 3: `bos`（arms, gems, counter, rage, won）
- 保存: `hi = localStorage.getItem('kaG')`

## 主要関数（元HTML）

- 入力: `J()`, `clearJ()`, `jAct()`
- 音: `ea()`, `tn()`, `noise()`, `bgmTick()`, `S.*`
- 共通進行: `doHurt()`, `doBeat()`, `transTo()`, `drawTrans()`
- Stage 1: `cavInit()`, `cavUpdate()`, `cavDraw()`
- Stage 2: `grsInit()`, `grsUpdate()`, `grsDraw()`
- Stage 3: `bosInit()`, `bosUpdate()`, `bosChk()`, `bosDraw()`
- シーン: `drawTitle()`, `startGame()`, `drawOver()`, `drawEnding1()`, `drawTrueEnd()`
- ループ: `gameTick()`, `render()`, `frame()`

## 対応表

| 区分 | 元HTML要素 | 移植先 | 状態 |
|---|---|---|---|
| Scene | `state` | `src/features/keys-and-arms/types.ts`, `src/features/keys-and-arms/engine/update.ts` | IN_PROGRESS（主要遷移は実装済み） |
| Stage遷移 | `cav->grass->boss->ending` | `src/features/keys-and-arms/engine/transitions.ts`, `src/features/keys-and-arms/engine/update.ts` | IN_PROGRESS（Phase 2 完了） |
| Input | `kd/jp`, `J()`, `jAct()` | `src/features/keys-and-arms/input.ts`, `src/features/keys-and-arms/input.test.ts` | IN_PROGRESS（解放/justPressed はテスト済み） |
| Storage | `kaG` | `src/features/keys-and-arms/storage.ts` | IN_PROGRESS（`game_score_keys_and_arms` 保存 + `kaG` 移行） |
| Audio | `ea()`, `tn()`, `bgmTick()`, `S.*` | `src/features/keys-and-arms/audio.ts`, `src/features/keys-and-arms/audio.test.ts` | IN_PROGRESS（stage別BGM tick 実装） |
| Render | `drawHUD`, `cavDraw/grsDraw/bosDraw` | `src/features/keys-and-arms/render/renderer.ts`, `src/features/keys-and-arms/render/sprites.ts`, `src/features/keys-and-arms/render/effects.ts` | IN_PROGRESS（主要要素のみ） |
| Loop | `frame()` | `src/features/keys-and-arms/KeysAndArmsGame.tsx` | DONE（骨組み） |
| Page統合 | iframe廃止 | `src/pages/KeysAndArmsPage.tsx` | DONE |

## 差分メモ（2026-02-11）

- 現時点は Phase 2 実装。`title -> play -> over/ending1/trueEnd` と `cave -> grass -> boss` の遷移骨格は実装済み。
- Stage固有ロジック（敵パターン/演出/完全一致スコア計算）は `engine/update.ts` と `render/*` で継続移植が必要。
- TODO は `IN_PROGRESS` 行として明示管理し、最終フェーズで `DONE` 化する。
