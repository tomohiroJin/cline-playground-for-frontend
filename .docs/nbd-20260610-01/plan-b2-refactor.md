# Non-Brake Descent ループ・リファクタ計画（B2: frame-processor 化）

> 前提: B0/B1 = `use-game-engine.test.tsx`（PR #102）の安全網が main にある状態で実施。
> 目標アーキテクチャ: `.docs/nbd-20260610-01/spec.md` §2-3。
> 方針: 一括書き換えはしない。各 Stage は CI 緑・単独コミット/マージ可能。既存挙動（ゲームフィール・スコア・当たり判定・P2-P5 演出）は不変。

## 解消する課題
1. `setState` updater 内の副作用多発（React 契約違反）。
2. 25+ の `useState` が分散し `application/game-loop`（`GameWorld`/`UIState`）と二重化・乖離。
3. ループ本体が無テスト（B1 は外形的統合テストのみ）。

## 既存資産（再利用可能）
- `application/game-loop/game-state.ts`: `GameWorld`/`UIState`/`createInitialGameWorld`/`createInitialUIState`
- `application/game-loop/game-clock.ts`/`motion-scale.ts`（P0-P1 で配線済み）
- `application/collision/collision-processor.ts`: `processCollisions`
- `domain/events/game-events.ts`: `GameEvent`
- `domain/strategies/collision/*`: 衝突ハンドラ Strategy
- 安全網: `presentation/hooks/use-game-engine.test.tsx`（全 Stage の回帰テスト）

## Stage 一覧

| Stage | 内容 | 規模 | リスク |
|-------|------|:---:|:---:|
| **S1** | 副作用の分離（ループ外 ref パターン確立・updater 内副作用排除） | 中 | 中 |
| **S2** | `processFrame` 純粋関数の抽出 + 単体テスト | 大 | 低 |
| **S3** | `useReducer(GameWorld)` へ集約 | 小 | 低 |
| **S4** | `useReducer(UIState)` + 副作用イベント化の完成 | 中 | 中 |
| **S5** | 旧 `domains/` import 整理（cleanup） | 極小 | 極低 |

各 Stage 完了で `npm run ci` グリーン → コミット。S2 完了後にユーザーの体感確認チェックポイントを推奨。

---

## S1: 副作用の分離（ループ外 ref パターン）
- 対象: `use-game-engine.ts`
- ループ内の `setPlayer(prev => {...})` 2連（移動/遷移系・衝突系）を **1パスで finalPlayer を計算**する形へ。updater 内の `Audio.play`/`setScore`/`setParticles`/`clockRef` 等の副作用を排除し、**ローカルの副作用リスト**（audioEvents/scoreDelta/particleSpawns/hitstop 等）に蓄積 → updater 外でまとめて適用。
- stale closure 解消のため `player`/`speed`/`ramps`/`camY`/`effect`/`combo`/`comboTimer`/`lastRamp` を ref に昇格（setter で ref を同期）。ゲームループ `useEffect` の依存配列を `[state]` のみに縮小。
- 外部 API（`UseGameEngineResult`）は不変。新規テスト不要（B1 が守る）。
- リスク緩和: ref 同期は updater 形式で flush と整合。B1 の Audio 呼び出し検証が副作用漏れを検出。

## S2: `processFrame` 純粋関数の抽出
- 新規: `application/game-loop/frame-processor.ts` + `.test.ts`
- `processFrame(world, ui, input, ctx): FrameResult`（副作用なし・Audio/React/DOM 非依存）。
  - `FrameContext`: screenW/H, rampHeight, minSpeed, isGodMode, motionScale, passedObstacles, frameIndex, wasOnGround。
  - `FrameResult`: world, ui, events[], isGoal, isDead, newPassedObstacles[], hitstopFrames, slowMoFrames, slowMoFactor。
  - 内部: effect timer / speed / combo timer / particles / clouds / jet / speedLines / trail / 移動・ジャンプ / 遷移 / danger / `processCollisions` / camera / rank 変化検出。
  - 着地検出は `ctx.wasOnGround` で純粋化。
- フック側: ループ内 200+ 行を `processFrame` 呼び出し + ref 即時更新 + events 処理 + clock 更新 + dispatch に簡素化。
- 必要なら `game-events.ts` に `SPEED_RANK_CHANGED`/`LANDED` 等を追加。
- 高価値テスト資産: `frame-processor.test.ts`（effect timer / rank 変化 / 遷移 / 着地 / 不変条件）。純粋関数なので Audio モック不要。

## S3: `useReducer(GameWorld)`
- 変更: `game-state.ts` に `worldReducer`（`COMMIT_FRAME`/`RESET`）+ `game-state.test.ts`。
- フック: GameWorld 系 11 useState を `useReducer` 1本へ。`worldRef` で最新値をループに供給。戻り値は `world.*` から展開（呼び出し側変更ゼロ）。

## S4: `useReducer(UIState)` + イベント化完成
- 変更: `game-state.ts` の `UIState` に `speedLines`/`playerTrail` を追加（spec §4）。`uiReducer`（`COMMIT_UI`/`RESET_UI`）。
- フック: UI 系 useState を `useReducer` へ。`dispatchGameEvent(event)` を **ループ外** の `useCallback` として実装し、`Audio.play`/`Audio.setSpeedRank`/`handleDeath`/`handleClear` をここで処理。→ updater 内副作用が完全に消える。
- 注意: `shake` は死亡ループとゲームループ双方が更新するため、統合は慎重に（必要なら useState 維持 or 専用 action）。

## S5: 旧 import 整理
- 対象: `use-game-engine.ts` の `../../domains/*`（@deprecated 再エクスポート）参照を `domain/services/` 直参照へ、または `processFrame` 統合で不要化して削除。
- typecheck/CI で確認。旧 `domains/*.ts` 本体の削除は別 PR（スコープ外）。

## YAGNI（見送り）
- rAF 全面移行 / `GameAction` の細分化 / immer / `shake` の reducer 統合 / 旧 `domains/*` ファイル削除。
