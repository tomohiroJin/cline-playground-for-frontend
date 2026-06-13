# KEYS & ARMS 状態管理リファクタリング Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 神オブジェクト `GameState` から遷移レジストリとパーティクルプールを分離し、`UninitializedGameState` 型と `as GameState` キャストを根絶して状態の所有権を明確化する（振る舞い不変）。

**Architecture:** (A) ステージ遷移用の4関数を `StageNavigator` に隔離し `EngineContext` に注入。(B) 16種のパーティクル配列を各ステージ state スライスへ移動、トランジション4フィールドを `G.transition` に集約、死蔵 `grsDust` を削除、完全初期状態ファクトリを導入してキャストを廃止。純粋な構造変更のため `npm run typecheck` を各タスクの安全網とする。

**Tech Stack:** TypeScript, React 19, Jest 30 (SWC), Webpack 5。テスト: `npm test` / 型: `npm run typecheck` / 全体: `npm run ci`。

**作業ディレクトリ:** `src/features/keys-and-arms/`（以下、パスはこのディレクトリ起点。ブランチ `refactor/keys-and-arms-state-management` で作業）

**設計書:** `docs/superpowers/specs/2026-06-14-keys-and-arms-state-management-refactoring-design.md`

---

## 前提コマンド（毎タスクで使用）

- 型チェック: `npm run typecheck`
- 機能テスト: `npm test -- keys-and-arms`
- フルCI: `npm run ci`

> **重要:** 各タスクは「型/テストを赤にする変更 → 全箇所追従 → typecheck と test を緑 → コミット」のサイクル。
> リネーム系タスクでは typecheck のエラー一覧が「残った未移行箇所」のチェックリストになる。

---

## Task 1: StageNavigator 型の追加と EngineContext への注入

ステージ遷移レジストリ（`cavInit/grsInit/bosInit/startGame`）を `GameState` から切り離す土台を作る。

**Files:**
- Create: `types/stage-navigator.ts`
- Modify: `types/engine-context.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: StageNavigator 型を新規作成**

Create `types/stage-navigator.ts`:

```ts
/**
 * KEYS & ARMS — ステージ遷移ナビゲータの型定義
 *
 * 遷移先ステージの init 関数を保持する単一責務レジストリ。
 * 循環依存を避けるため engine.ts で遅延バインドされるが、
 * GameState から隔離することで状態オブジェクトの責務を純化する。
 */
export interface StageNavigator {
  /** 洞窟ステージを初期化する */
  cave: () => void;
  /** 草原ステージを初期化する */
  prairie: () => void;
  /** ボスステージを初期化する */
  boss: () => void;
  /** タイトルからゲームを開始する */
  startGame: () => void;
}
```

- [ ] **Step 2: EngineContext に nav を追加**

Modify `types/engine-context.ts` — import を追加し、`EngineContext` に `nav` フィールドを追加:

```ts
import type { StageNavigator } from './stage-navigator';
```

`EngineContext` インターフェース内（`storage` の下）に追加:

```ts
  /** ステージ遷移ナビゲータ */
  nav: StageNavigator;
```

- [ ] **Step 3: index.ts で型を再エクスポート**

Modify `types/index.ts` — 末尾付近に追加:

```ts
export type { StageNavigator } from './stage-navigator';
```

- [ ] **Step 4: typecheck で「nav 未提供」エラーを確認**

Run: `npm run typecheck`
Expected: `engine.ts` で `EngineContext` に `nav` が無い旨のエラー（次タスクで解消）。
> このエラーは想定どおり。Task 2 で engine.ts が nav を提供すると解消する。

---

## Task 2: engine.ts で StageNavigator を構築・バインドし、呼び出し側を移行

**Files:**
- Modify: `engine.ts:53-64`
- Modify: `screens/title.ts:80`
- Modify: `screens/ending.ts:99`
- Modify: `screens/true-end.ts:169`
- Modify: `screens/game-over.ts:75`
- Modify: `stages/boss/boss-logic.ts:104`
- Modify: `stages/cave/cave-logic.ts:68`
- Modify: `stages/prairie/prairie-logic.ts:102`

- [ ] **Step 1: engine.ts で nav を生成し ctx に注入**

Modify `engine.ts`。`ctx` 生成（51行目付近 `const ctx: EngineContext = { ... }`）の前に nav を宣言し、ctx に含める。
現状:

```ts
  const ctx: EngineContext = { G, draw, audio, particles, hud, storage };

  const cave = createCaveStage(ctx);
  const prairie = createPrairieStage(ctx);
  const boss = createBossStage(ctx);
  const titleScreen = createTitleScreen(ctx);
```

変更後（nav は空関数で初期化 → stage 生成後に実体をバインド）:

```ts
  const nav: StageNavigator = {
    cave: () => {},
    prairie: () => {},
    boss: () => {},
    startGame: () => {},
  };
  const ctx: EngineContext = { G, draw, audio, particles, hud, storage, nav };

  const cave = createCaveStage(ctx);
  const prairie = createPrairieStage(ctx);
  const boss = createBossStage(ctx);
  const titleScreen = createTitleScreen(ctx);
```

- [ ] **Step 2: 遅延バインドを G から nav へ移す**

Modify `engine.ts:62-64`。現状:

```ts
  /* 遅延バインド */
  G.cavInit = cave.init; G.grsInit = prairie.init;
  G.bosInit = boss.init; G.startGame = titleScreen.startGame;
```

変更後:

```ts
  /* 遅延バインド（nav に実体を差し込む） */
  nav.cave = cave.init; nav.prairie = prairie.init;
  nav.boss = boss.init; nav.startGame = titleScreen.startGame;
```

import を追加（ファイル冒頭の型 import 群）:

```ts
import type { EngineContext, GameState, StageNavigator } from './types';
```

- [ ] **Step 3: engine.ts の title 分岐の startGame 呼び出しはそのまま確認**

`engine.ts:120` の `titleScreen.startGame()` はローカル変数経由のため変更不要。確認のみ。

- [ ] **Step 4: 各呼び出し側を nav に置換**

各ファイルの `ctx` 分解または `G` 参照を確認し、以下を置換する。
これらのファイルは `createXxx(ctx)` で `const { G, hud, ... } = ctx;` 形式か `ctx.G` 形式。
`nav` を参照に追加する（分解代入なら `nav` を足す）。

- `screens/title.ts:80`: `transTo('CAVE', G.cavInit, 'FIND 3 KEYS')` → `transTo('CAVE', nav.cave, 'FIND 3 KEYS')`
- `screens/ending.ts:99`: `transTo(\`LOOP ${G.loop}\`, G.cavInit, 'HARDER!')` → `transTo(\`LOOP ${G.loop}\`, nav.cave, 'HARDER!')`
- `screens/true-end.ts:169`: `transTo(\`LOOP ${G.loop} — BEYOND\`, G.cavInit, 'HARDER!')` → `transTo(\`LOOP ${G.loop} — BEYOND\`, nav.cave, 'HARDER!')`
- `screens/game-over.ts:75`: `G.startGame?.()` → `nav.startGame()`
- `stages/boss/boss-logic.ts:104`: `transTo('LOOP ' + G.loop, G.cavInit, 'HARDER!')` → `transTo('LOOP ' + G.loop, nav.cave, 'HARDER!')`
- `stages/cave/cave-logic.ts:68`: `transTo('PRAIRIE', G.grsInit, 'DEFEAT ENEMIES')` → `transTo('PRAIRIE', nav.prairie, 'DEFEAT ENEMIES')`
- `stages/prairie/prairie-logic.ts:102`: `transTo('CASTLE', G.bosInit, 'SET 6 GEMS')` → `transTo('CASTLE', nav.boss, 'SET 6 GEMS')`

> 各ファイルで `nav` が未分解なら、`ctx` 分解行に `nav` を追加（例: `const { G, hud, nav } = ctx;`）。
> `ctx.G` 形式のファイルは `ctx.nav.cave` のように参照する。

- [ ] **Step 5: GameState 型と初期化から遷移レジストリを削除**

Modify `types/game-state.ts` — `GameState` インターフェースの末尾「遅延バインド」ブロックを削除:

```ts
  // 遅延バインド
  cavInit: (() => void) | undefined;
  grsInit: (() => void) | undefined;
  bosInit: (() => void) | undefined;
  startGame: (() => void) | undefined;
```

`UninitializedGameState` 型定義内の同4フィールドも削除し、`Omit<...>` の対象からも外す。現状:

```ts
export type UninitializedGameState = Omit<GameState, 'cav' | 'grs' | 'bos' | 'cavInit' | 'grsInit' | 'bosInit' | 'startGame'> & {
  cav: Partial<CaveState>;
  grs: Partial<PrairieState>;
  bos: Partial<BossState>;
  cavInit: (() => void) | undefined;
  grsInit: (() => void) | undefined;
  bosInit: (() => void) | undefined;
  startGame: (() => void) | undefined;
}
```

変更後:

```ts
export type UninitializedGameState = Omit<GameState, 'cav' | 'grs' | 'bos'> & {
  cav: Partial<CaveState>;
  grs: Partial<PrairieState>;
  bos: Partial<BossState>;
}
```

Modify `core/game-state.ts` — `createInitialGameState` の末尾「遅延バインド」ブロックを削除:

```ts
    // 遅延バインド（engine.ts で設定される）
    cavInit: undefined,
    grsInit: undefined,
    bosInit: undefined,
    startGame: undefined,
```

- [ ] **Step 6: テスト内の遷移レジストリ参照を移行**

`__tests__/helpers/test-engine.ts` 等で `G.cavInit` / `G.startGame` 等を直接呼んでいる箇所を確認:

Run: `grep -rn "cavInit\|grsInit\|bosInit\|startGame" __tests__`

ヒットした箇所は、テストが engine 経由でないなら `nav` 相当のスタブに置換、engine 経由なら不要。
test-engine ヘルパが `createEngine` をラップしているなら、内部の nav は engine が持つため参照不要になる。
個別に `G.startGame?.()` を呼んでいたテストは、その遷移を起こす入力（jAct）を送る形に修正する。

- [ ] **Step 7: typecheck とテストを緑にする**

Run: `npm run typecheck`
Expected: PASS（`cavInit` 等の参照が残っていればここで全て検出される。残りを潰す）

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS のステージ遷移レジストリを StageNavigator に分離

- GameState から cavInit/grsInit/bosInit/startGame を除去
- EngineContext.nav として隔離し、遅延バインドを state から追い出す
- game-over の startGame?.() の握りつぶしを解消

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: 死蔵フィールド grsDust の削除

`G.grsDust` は非テストコードでアクセス 0 件（調査済み）。

**Files:**
- Modify: `types/game-state.ts`
- Modify: `core/game-state.ts`

- [ ] **Step 1: 残存参照がないことを確認**

Run: `grep -rn "grsDust" src/features/keys-and-arms`
Expected: 型定義（`types/game-state.ts`）と初期化（`core/game-state.ts`）のみ。ロジック/テストにあれば本削除前に調査。

- [ ] **Step 2: 型から削除**

Modify `types/game-state.ts` — `GameState` の草原ブロックから `grsDust: Particle[];` を削除。

- [ ] **Step 3: 初期化から削除**

Modify `core/game-state.ts` — `grsSlash: [], grsDead: [], grsGrass: [], grsDust: [],` の行から `grsDust: [],` を削除。

- [ ] **Step 4: typecheck とテストを緑にする**

Run: `npm run typecheck && npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS の死蔵フィールド grsDust を削除

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: 洞窟パーティクルプールを CaveState へ移動

`G.sparks/dust/feathers/smoke/stepDust/keySpk/cavDrips` を `G.cav.*` に収める。

**Files:**
- Modify: `types/stage.ts`（`CaveState` にフィールド追加）
- Modify: `types/game-state.ts`（`GameState` から7フィールド削除）
- Modify: `core/game-state.ts`（初期化から7フィールド削除）
- Modify: `stages/cave/cave-logic.ts`, `stages/cave/cave-background.ts`, `stages/cave/cave-renderer.ts`
- Modify: 参照テスト（cave-flow / game-loop / test-engine）

- [ ] **Step 1: CaveState にパーティクル配列を追加**

Modify `types/stage.ts` の `CaveState` 末尾（`roomName: string;` の後）に追加。
プレフィックスを剥がし、`cavDrips` は `drips` に改名する:

```ts
  // パーティクルプール（旧 GameState トップレベルから移動）
  sparks: SparkParticle[];
  dust: DustParticle[];
  feathers: FeatherParticle[];
  smoke: SmokeParticle[];
  stepDust: Particle[];
  keySpk: KeySparkParticle[];
  drips: DripParticle[];
```

`types/stage.ts` の冒頭に import を追加:

```ts
import type { Particle } from './particles';
import type { SparkParticle, DustParticle, FeatherParticle, SmokeParticle, KeySparkParticle, DripParticle } from './game-state';
```

> 注: `game-state.ts` は `stage.ts` を import しているため循環参照になる。これを避けるため、
> パーティクル要素型（`SparkParticle` 等）を Step 1b で専用ファイル `types/particles.ts` に集約する。

- [ ] **Step 1b: パーティクル要素型を types/particles.ts に集約して循環を断つ**

`types/game-state.ts` に定義されている `DustParticle/SmokeParticle/SparkParticle/FeatherParticle/KeySparkParticle/DripParticle/GrassParticle` を `types/particles.ts` へ移動する（`Particle` 等の既存定義の下に追記）。
`types/game-state.ts` 側はこれらを `import type` し、再エクスポートを維持:

```ts
// types/game-state.ts 冒頭
import type {
  DustParticle, SmokeParticle, SparkParticle, FeatherParticle,
  KeySparkParticle, DripParticle, GrassParticle,
} from './particles';
```

`types/index.ts` の再エクスポート行を、これらが `particles` 由来になるよう調整（既存の `game-state` からの re-export はそのまま型解決されるので、export 文の出所だけ確認）。
`types/stage.ts` の import は `./particles` から行う:

```ts
import type {
  Particle, SparkParticle, DustParticle, FeatherParticle,
  SmokeParticle, KeySparkParticle, DripParticle,
} from './particles';
```

- [ ] **Step 2: GameState から洞窟プール7フィールドを削除**

Modify `types/game-state.ts` の `GameState` 内、洞窟ブロック:

```ts
  sparks: SparkParticle[];
  dust: DustParticle[];
  feathers: FeatherParticle[];
  smoke: SmokeParticle[];
  stepDust: Particle[];
  keySpk: KeySparkParticle[];
  cavDrips: DripParticle[];
```

を削除（`cav: CaveState;` は残す）。

- [ ] **Step 3: 初期化から削除**

Modify `core/game-state.ts` — 行 `sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], cavDrips: [],` を削除。
これで `G.cav` は `{}`（Partial）のまま。各プールは `cavInit` で設定する（次ステップ）。

- [ ] **Step 4: cavInit でプールを cav スライス内に初期化**

Modify `stages/cave/cave-logic.ts:53` 付近の `G.cav = { ... }` ブロックに、7プールの初期化を追加:

```ts
    G.cav = {
      // ...既存フィールド...
      sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], drips: [],
    };
```

`cave-logic.ts:52` の `G.sparks = []; G.feathers = []; G.smoke = []; G.stepDust = []; ... G.keySpk = [];` の行は、`G.cav = {...}` で初期化されるため不要になる。
ただし `G.cav = {...}` より前に実行されるなら順序に注意。`initDust()`（`G.dust = []` を設定）も `G.cav.dust = []` に変える必要がある。

- [ ] **Step 5: 洞窟内の全参照を G.cav.* に置換**

以下のマッピングで `stages/cave/` 配下（cave-logic.ts, cave-background.ts, cave-renderer.ts）を一括置換:

| 旧 | 新 |
|---|---|
| `G.sparks` | `G.cav.sparks` |
| `G.dust` | `G.cav.dust` |
| `G.feathers` | `G.cav.feathers` |
| `G.smoke` | `G.cav.smoke` |
| `G.stepDust` | `G.cav.stepDust` |
| `G.keySpk` | `G.cav.keySpk` |
| `G.cavDrips` | `G.cav.drips` |

代表的な置換箇所（調査済み）:
- `cave-logic.ts:40` `G.dust = []` → `initDust()` 内。`G.cav.dust = []`
- `cave-renderer.ts:158` `G.cavDrips = G.cavDrips.filter(...)` → `G.cav.drips = G.cav.drips.filter(...)`
- `cave-background.ts:135,137,199,203,206` の各 `G.sparks/smoke/stepDust/keySpk/feathers` フィルタ → `G.cav.*`

Run（残存チェック）: `grep -rn "G\.\(sparks\|dust\|feathers\|smoke\|stepDust\|keySpk\|cavDrips\)\b" src/features/keys-and-arms/stages/cave`
Expected: 置換後は 0 件。

- [ ] **Step 6: typecheck で全未移行箇所を検出して潰す**

Run: `npm run typecheck`
Expected: 旧 `G.sparks` 等が残っていれば「Property does not exist on GameState」エラー。全件 `G.cav.*` に直す。
`cavDrips` の改名（→`drips`）漏れもここで検出される。

- [ ] **Step 7: テストの参照を移行**

Run: `grep -rn "\.\(sparks\|dust\|feathers\|smoke\|stepDust\|keySpk\|cavDrips\)\b" src/features/keys-and-arms/__tests__`
ヒット箇所（cave-flow.test.ts / game-loop.test.ts / test-engine.ts 等）を `G.cav.*`（`cavDrips`→`cav.drips`）に置換。

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS の洞窟パーティクルプールを CaveState へ移動

- sparks/dust/feathers/smoke/stepDust/keySpk/drips を G.cav.* に収める
- cavDrips を drips に改名（スライス内のため接頭辞不要）
- パーティクル要素型を types/particles.ts に集約し循環参照を回避

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 草原パーティクルプールを PrairieState へ移動

`G.grsSlash/grsDead/grsGrass/grsLaneFlash/grsMiss` を `G.grs.*` に収める（接頭辞 `grs` を剥がす）。

**Files:**
- Modify: `types/stage.ts`（`PrairieState`）, `types/game-state.ts`, `core/game-state.ts`
- Modify: `stages/prairie/prairie-logic.ts`, `stages/prairie/prairie-renderer.ts`, `stages/prairie/prairie-background.ts`
- Modify: 参照テスト（prairie-flow / game-loop / test-engine）

- [ ] **Step 1: PrairieState にプールを追加**

Modify `types/stage.ts` の `PrairieState` 末尾（`sweepFlash: number;` の後）に追加:

```ts
  // パーティクルプール（旧 GameState トップレベルから移動）
  slash: Array<{ lane: number; life: number; hit: boolean }>;
  dead: Particle[];
  grass: GrassParticle[];
  laneFlash: Array<{ lane: number; life: number }>;
  miss: Array<{ lane: number; life: number }>;
```

import に `GrassParticle` を追加（Task 4 で `Particle` は import 済み）:

```ts
import type {
  Particle, SparkParticle, DustParticle, FeatherParticle,
  SmokeParticle, KeySparkParticle, DripParticle, GrassParticle,
} from './particles';
```

- [ ] **Step 2: GameState から草原プール5フィールドを削除**

Modify `types/game-state.ts` の草原ブロックから以下を削除（`grsDust` は Task 3 で削除済み）:

```ts
  grsSlash: Array<{ lane: number; life: number; hit: boolean }>;
  grsDead: Particle[];
  grsGrass: GrassParticle[];
  grsLaneFlash: Array<{ lane: number; life: number }>;
  grsMiss: Array<{ lane: number; life: number }>;
```

- [ ] **Step 3: 初期化から削除し、grsInit 内へ移す**

Modify `core/game-state.ts` — `grsSlash: [], grsDead: [], grsGrass: [], grsLaneFlash: [], grsMiss: [],` の行を削除。
Modify `stages/prairie/prairie-logic.ts` の `G.grs = { ... }`（init）ブロックに追加:

```ts
      slash: [], dead: [], grass: [], laneFlash: [], miss: [],
```

`prairie-logic.ts:32` `G.grsGrass = []` と `:78` `G.grsSlash = []; G.grsDead = []; G.grsLaneFlash = []; G.grsMiss = [];` は init 内で `G.grs` に統合するか、`G.grs.grass = []` 等に置換。

- [ ] **Step 4: 草原内の全参照を G.grs.* に置換**

| 旧 | 新 |
|---|---|
| `G.grsSlash` | `G.grs.slash` |
| `G.grsDead` | `G.grs.dead` |
| `G.grsGrass` | `G.grs.grass` |
| `G.grsLaneFlash` | `G.grs.laneFlash` |
| `G.grsMiss` | `G.grs.miss` |

代表箇所: `prairie-renderer.ts:57,64,123,142`、`prairie-logic.ts:32,78`、`prairie-background.ts`（grass 描画）。

Run: `grep -rn "G\.grs\(Slash\|Dead\|Grass\|LaneFlash\|Miss\)\b" src/features/keys-and-arms/stages/prairie`
Expected: 置換後 0 件。

- [ ] **Step 5: typecheck で残りを潰す**

Run: `npm run typecheck`
Expected: 未移行があればエラー検出 → 全件 `G.grs.*` に修正。

- [ ] **Step 6: テスト参照を移行しテスト緑**

Run: `grep -rn "grs\(Slash\|Dead\|Grass\|LaneFlash\|Miss\)" src/features/keys-and-arms/__tests__`
ヒット箇所を `G.grs.*` に置換。

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS の草原パーティクルプールを PrairieState へ移動

- grsSlash/grsDead/grsGrass/grsLaneFlash/grsMiss を G.grs.* に収める

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: ボスパーティクルプールを BossState へ移動

`G.bosParticles/bosShieldBreak/bosArmTrail` を `G.bos.*` に収める。

**Files:**
- Modify: `types/stage.ts`（`BossState`）, `types/game-state.ts`, `core/game-state.ts`
- Modify: `stages/boss/boss-logic.ts`, `stages/boss/boss-arena-renderer.ts`, `stages/boss/boss-scene-renderer.ts`
- Modify: 参照テスト（boss-flow / game-loop / test-engine）

- [ ] **Step 1: BossState にプールを追加**

Modify `types/stage.ts` の `BossState` 末尾（`quake: number;` の後）に追加:

```ts
  // パーティクルプール（旧 GameState トップレベルから移動）
  particles: Particle[];
  shieldBreak: Array<{ idx: number; life: number }>;
  armTrail: Array<{ idx: number; life: number }>;
```

- [ ] **Step 2: GameState からボスプール3フィールドを削除**

Modify `types/game-state.ts` のボスブロックから削除:

```ts
  bosParticles: Particle[];
  bosShieldBreak: Array<{ idx: number; life: number }>;
  bosArmTrail: Array<{ idx: number; life: number }>;
```

- [ ] **Step 3: 初期化から削除し bosInit 内へ移す**

Modify `core/game-state.ts` — `bosParticles: [], bosShieldBreak: [], bosArmTrail: [],` を削除。
Modify `stages/boss/boss-logic.ts:51` `G.bosParticles = []; G.bosShieldBreak = []; G.bosArmTrail = [];` を、`G.bos = {...}` init 内に統合（`particles: [], shieldBreak: [], armTrail: [],`）するか `G.bos.particles = []` 等に置換。

- [ ] **Step 4: ボス内の全参照を G.bos.* に置換**

| 旧 | 新 |
|---|---|
| `G.bosParticles` | `G.bos.particles` |
| `G.bosShieldBreak` | `G.bos.shieldBreak` |
| `G.bosArmTrail` | `G.bos.armTrail` |

代表箇所: `boss-arena-renderer.ts:252`、`boss-scene-renderer.ts:110`、`boss-logic.ts:51`。

Run: `grep -rn "G\.bos\(Particles\|ShieldBreak\|ArmTrail\)\b" src/features/keys-and-arms/stages/boss`
Expected: 置換後 0 件。

- [ ] **Step 5: typecheck で残りを潰す**

Run: `npm run typecheck`
Expected: 未移行があればエラー → 全件修正。

- [ ] **Step 6: テスト参照を移行しテスト緑**

Run: `grep -rn "bos\(Particles\|ShieldBreak\|ArmTrail\)" src/features/keys-and-arms/__tests__`
ヒット箇所を `G.bos.*` に置換。

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS のボスパーティクルプールを BossState へ移動

- bosParticles/bosShieldBreak/bosArmTrail を G.bos.* に収める

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: トランジション4フィールドを G.transition に集約

`trT/trTxt/trFn/trSub` を `G.transition.{t,txt,fn,sub}` にまとめる。

**Files:**
- Create: `types/transition.ts`（型）
- Modify: `types/game-state.ts`, `types/index.ts`, `core/game-state.ts`
- Modify: `core/hud.ts`（transTo/drawTrans）, `engine.ts`（trT 参照）
- Modify: 参照テスト（pause.test.ts 等で trT を見ている箇所）

- [ ] **Step 1: TransitionState 型を作成**

Create `types/transition.ts`:

```ts
/**
 * KEYS & ARMS — 画面トランジション状態の型定義
 */
export interface TransitionState {
  /** 残りティック数（0 で非アクティブ） */
  t: number;
  /** メインテキスト */
  txt: string;
  /** トランジション中盤で実行するコールバック（次ステージ init 等） */
  fn: (() => void) | undefined;
  /** サブテキスト */
  sub: string;
}
```

- [ ] **Step 2: GameState を更新**

Modify `types/game-state.ts` — トランジションブロック:

```ts
  // トランジション
  trT: number;
  trTxt: string;
  trFn: (() => void) | undefined;
  trSub: string;
```

を以下に置換:

```ts
  // トランジション
  transition: TransitionState;
```

冒頭に import 追加: `import type { TransitionState } from './transition';`
`types/index.ts` に `export type { TransitionState } from './transition';` を追加。

- [ ] **Step 3: 初期化を更新**

Modify `core/game-state.ts` — 現状:

```ts
    // トランジション
    trT: 0,
    trTxt: '',
    trFn: undefined,
    trSub: '',
```

を以下に置換:

```ts
    // トランジション
    transition: { t: 0, txt: '', fn: undefined, sub: '' },
```

- [ ] **Step 4: hud.ts の transTo/drawTrans を更新**

Modify `core/hud.ts:96`:

```ts
    G.trT = TRANSITION_TOTAL; G.trTxt = t; G.trFn = fn; G.trSub = sub || ''; G.bgmBeat = 0;
```

→

```ts
    G.transition = { t: TRANSITION_TOTAL, txt: t, fn, sub: sub || '' }; G.bgmBeat = 0;
```

`drawTrans` 内の参照を置換:
- `if (G.trT <= 0) return false;` → `if (G.transition.t <= 0) return false;`
- `G.trT--;` → `G.transition.t--;`
- `if (G.trT === TRANSITION_MID && G.trFn) G.trFn();` → `if (G.transition.t === TRANSITION_MID && G.transition.fn) G.transition.fn();`
- `const p = G.trT > TRANSITION_MID ? (TRANSITION_TOTAL - G.trT) / TRANSITION_MID : G.trT / TRANSITION_MID;` → `trT` を全て `G.transition.t` に
- `txtC(G.trTxt, ...)` → `txtC(G.transition.txt, ...)`
- `if (G.trSub)` / `txtC(G.trSub, ...)` → `G.transition.sub`

- [ ] **Step 5: engine.ts の trT 参照を更新**

Modify `engine.ts` — `G.trT > 0` の2箇所（`gameTick` の 106行目、`render` の 143行目）を `G.transition.t > 0` に置換。

Run（残存チェック）: `grep -rn "G\.\(trT\|trTxt\|trFn\|trSub\)\b" src/features/keys-and-arms --include=*.ts | grep -v __tests__`
Expected: 0 件。

- [ ] **Step 6: typecheck と テスト参照移行**

Run: `npm run typecheck`
Expected: 残存参照があればエラー → 全件修正。

Run: `grep -rn "trT\|trTxt\|trFn\|trSub" src/features/keys-and-arms/__tests__`
ヒット箇所（pause.test.ts で `G.trT` を確認している等）を `G.transition.t` 等に置換。

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS のトランジション状態を G.transition に集約

- trT/trTxt/trFn/trSub を TransitionState オブジェクトにまとめる

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: 完全初期状態ファクトリ導入と UninitializedGameState・キャスト廃止

`cav/grs/bos` を空 `{}` ではなく完全初期状態で生成し、`UninitializedGameState` 型と `engine.ts:45` の `as GameState` キャストを廃止する。

**Files:**
- Create: `core/initial-cave-state.ts`, `core/initial-prairie-state.ts`, `core/initial-boss-state.ts`
- Modify: `core/game-state.ts`, `types/game-state.ts`, `types/index.ts`, `engine.ts`
- Create: `__tests__/core/initial-state.test.ts`

- [ ] **Step 1: 洞窟初期状態ファクトリを作成**

`stages/cave/cave-logic.ts` の `cavInit` 内 `G.cav = { ... }` のオブジェクト（Task 4 でプール追加済み）を、純粋関数として切り出す。
Create `core/initial-cave-state.ts`:

```ts
/**
 * KEYS & ARMS — 洞窟ステージの初期状態ファクトリ
 *
 * GameState 構築時に cav スライスを完全初期化するために使う。
 * cavInit でも同じ初期形にリセットされる（DRY のため共通利用を推奨）。
 */
import type { CaveState } from '../types';

/** 洞窟ステージの初期状態を生成する（全フィールド定義済み） */
export function createInitialCaveState(): CaveState {
  return {
    pos: 0, prevPos: 0, dir: 1, keys: [], keysPlaced: 0, carrying: false,
    trapOn: false, trapBeat: 0, trapSparks: [], trapWasDanger: 0,
    cageProgress: 0, cageMax: 0, cageHolding: false,
    batPhase: 0, batBeat: 0, batHitAnim: 0, batWasDanger: 0,
    mimicOpen: false, mimicBeat: 0, pryCount: 0, mimicShake: 0, mimicWasDanger: 0, pryDecayT: 0,
    spiderY: 0, spiderBeat: 0, spiderWasDanger: 0, hurtCD: 0,
    actAnim: 0, actType: '', walkAnim: 0, idleT: 0, won: false, wonT: 0,
    trailAlpha: 0, roomNameT: 0, roomName: '',
    sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], drips: [],
  };
}
```

> 注: 各フィールドの初期値は `cavInit` の現行 `G.cav = {...}` の値に厳密に合わせること。
> 上記は型を満たす既定値の例。実装時に `cave-logic.ts` の現行初期値を正として転記する。

- [ ] **Step 2: 草原・ボス初期状態ファクトリを作成**

同様に `core/initial-prairie-state.ts`（`createInitialPrairieState(): PrairieState`）と
`core/initial-boss-state.ts`（`createInitialBossState(): BossState`）を作成。
各々 `prairie-logic.ts` / `boss-logic.ts` の現行 init オブジェクトの初期値を正として転記し、
Task 5/6 で追加したプール（`slash/dead/grass/laneFlash/miss` / `particles/shieldBreak/armTrail`）を含める。

- [ ] **Step 3: createInitialGameState で完全初期状態を使う**

Modify `core/game-state.ts`:
- import 追加:
  ```ts
  import { createInitialCaveState } from './initial-cave-state';
  import { createInitialPrairieState } from './initial-prairie-state';
  import { createInitialBossState } from './initial-boss-state';
  ```
- `cav: {},` → `cav: createInitialCaveState(),`
- `grs: {},` → `grs: createInitialPrairieState(),`
- `bos: {},` → `bos: createInitialBossState(),`
- 戻り値型を `UninitializedGameState` から `GameState` に変更:
  ```ts
  export function createInitialGameState(
    kd: Record<string, boolean>,
    jp: Record<string, boolean>,
    highScore = 0,
  ): GameState {
  ```
- import を `GameState` に変更（`UninitializedGameState` を外す）。

- [ ] **Step 4: 各 stage init を初期状態ファクトリ利用に統一（DRY）**

Modify `stages/cave/cave-logic.ts` の `cavInit` — `G.cav = { ...手書き... }` を
`G.cav = createInitialCaveState();` に置換し、その後で init 固有の動的値（`keys` の長さ、`pos` 等、loop 依存値）だけ上書きする。
`prairie-logic.ts` / `boss-logic.ts` も同様に置換。
（動的に決まる値があるファクトリ後上書きパターン。完全に静的なら丸ごと置換）

> 実装時の判断: init が loop/難易度依存の値を計算している場合、ファクトリは「静的初期値」を返し、
> init 側で依存値を上書きする。ファクトリと init で初期値がズレないよう、共通定数を参照する。

- [ ] **Step 5: UninitializedGameState 型を削除**

Modify `types/game-state.ts` — `UninitializedGameState` 型定義を丸ごと削除。
Modify `types/index.ts` — `UninitializedGameState` を export から削除。

- [ ] **Step 6: engine.ts のキャストを除去**

Modify `engine.ts:43-45`。現状:

```ts
  const uninitG = createInitialGameState(input.kd, input.jp, storage.getHighScore());
  // 遅延バインド完了後に GameState として使用（各ステージ init でステージ状態が設定される）
  const G = uninitG as GameState;
```

変更後:

```ts
  const G = createInitialGameState(input.kd, input.jp, storage.getHighScore());
```

`engine.ts` 冒頭の import から `GameState` を使わなくなれば型 import を整理（`G` の型は推論される。明示が必要なら `GameState` を残す）。

- [ ] **Step 7: 初期状態ファクトリのテストを追加**

Create `__tests__/core/initial-state.test.ts`:

```ts
import { createInitialCaveState } from '../../core/initial-cave-state';
import { createInitialPrairieState } from '../../core/initial-prairie-state';
import { createInitialBossState } from '../../core/initial-boss-state';

describe('初期状態ファクトリ', () => {
  it('洞窟: 全フィールドが定義済みでパーティクルプールが空配列', () => {
    const s = createInitialCaveState();
    // 代表フィールドが undefined でないこと
    expect(s.pos).toBeDefined();
    expect(s.roomName).toBeDefined();
    expect(s.sparks).toEqual([]);
    expect(s.drips).toEqual([]);
    // どのプロパティも undefined でないこと
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });

  it('草原: 全フィールドが定義済みでプールが空配列', () => {
    const s = createInitialPrairieState();
    expect(s.slash).toEqual([]);
    expect(s.miss).toEqual([]);
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });

  it('ボス: 全フィールドが定義済みでプールが空配列', () => {
    const s = createInitialBossState();
    expect(s.particles).toEqual([]);
    expect(s.armTrail).toEqual([]);
    expect(Object.values(s).every((v) => v !== undefined)).toBe(true);
  });
});
```

- [ ] **Step 8: typecheck・テスト・キャスト不在を確認**

Run: `npm run typecheck`
Expected: PASS

Run: `grep -rn "UninitializedGameState\|as GameState" src/features/keys-and-arms`
Expected: 0 件。

Run: `npm test -- keys-and-arms`
Expected: PASS

- [ ] **Step 9: コミット**

```bash
git add src/features/keys-and-arms
git commit -m "refactor: KEYS & ARMS の初期状態ファクトリ導入とキャスト廃止

- createInitialCaveState/PrairieState/BossState で cav/grs/bos を完全初期化
- UninitializedGameState 型と uninitG as GameState キャストを廃止
- 初期状態ファクトリの全フィールド定義テストを追加

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: 最終検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 完了条件の自動チェック**

Run:
```bash
cd src/features/keys-and-arms
grep -rn "cavInit\|grsInit\|bosInit" . --include=*.ts | grep -v __tests__ | grep -v "nav\." | grep -v "function cavInit\|function grsInit\|function bosInit"
grep -rn "UninitializedGameState\|as GameState\|grsDust" . --include=*.ts
grep -rn "G\.\(sparks\|dust\|feathers\|smoke\|stepDust\|keySpk\|cavDrips\|grsSlash\|grsDead\|grsGrass\|grsLaneFlash\|grsMiss\|bosParticles\|bosShieldBreak\|bosArmTrail\|trT\|trTxt\|trFn\|trSub\)\b" . --include=*.ts
```
Expected: いずれも 0 件（ヒットなし）。

- [ ] **Step 2: フル CI**

Run: `npm run ci`
Expected: lint:ci + typecheck + test + build がすべて PASS。

- [ ] **Step 3: 手動動作確認（任意）**

Run: `npm start` → `/keys-and-arms` を開き、CAVE→PRAIRIE→CASTLE→ループの一連の遷移、
ポーズ/リセット確認、エンディング/トゥルーエンドが従来どおり動くことを目視確認。

- [ ] **Step 4: E2E（ローカル不可の場合は CI に委ねる）**

`npm run test:e2e` はローカル環境で実行不可の可能性あり（プロジェクト運用メモ参照）。
ローカルで動かない場合は PR 上の CI に委ねる。

---

## 完了条件チェックリスト（設計書 §6 と対応）

- [ ] `GameState` から遷移レジストリ4フィールドが消え `StageNavigator` に隔離（Task 1-2）
- [ ] 16種のパーティクルプールが各ステージ state スライスに収まる（Task 4-6）
- [ ] トランジション4フィールドが `G.transition` に集約（Task 7）
- [ ] 死蔵 `grsDust` 削除（Task 3）
- [ ] `UninitializedGameState` 型と `as GameState` キャストが存在しない（Task 8）
- [ ] `npm run ci` グリーン（Task 9）
- [ ] 振る舞い不変（既存テストで担保）
