# KEYS & ARMS Source Map（元HTML -> src対応表）

## 使い方

- 左列に元HTMLの責務（状態/関数/定数）を記載する。
- 右列に移植先ファイルとシンボル名を記載する。
- 未移植は `TODO` として残す。

## 対応表

| 区分 | 元HTML要素 | 移植先 | 状態 |
|---|---|---|---|
| Scene | `state` (`title/cave/grass/boss/over/ending1/trueEnd`) | `src/features/keys-and-arms/engine/transitions.ts` | TODO |
| Input | `kd/jp`, `J()`, `jAct()` | `src/features/keys-and-arms/input.ts` | TODO |
| Storage | `localStorage key: kaG` | `src/features/keys-and-arms/storage.ts` | TODO |
| Audio | `ea()`, `tn()`, `bgmTick()`, `S.*` | `src/features/keys-and-arms/audio.ts` | TODO |
| Render | `drawHUD`, `cavDraw`, `grsDraw`, `bosDraw` | `src/features/keys-and-arms/render/*` | TODO |
| Loop | `requestAnimationFrame` + tick | `src/features/keys-and-arms/KeysAndArmsGame.tsx` | TODO |

## 補足メモ

- TODO をすべて解消するまで実装完了にしない。
- 「移植先」にはファイルだけでなく関数名まで記載する（例: `update.ts:tickGameState`）。
