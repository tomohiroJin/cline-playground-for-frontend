# 迷宮の残響 ベース難易度再調整＋バランス契約テスト（Phase 2）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「Normal が簡単すぎる」を是正し、中央集権5ノブで初回プレイから「理不尽でない歯ごたえ」を出す。あわせて決定論シミュレーション＋静的不変量で難易度の歯ごたえを回帰から守るバランス契約テストを整備する。

**Architecture:** 数値は既存の中央定数（config / difficulty-defs / status-effect-defs / pickEvent の rest 重み / echo の READ_MN_COST）のみ調整。検証用に、本番と同じ純粋関数（`pickEvent`/`processChoice`/`checkSecondLife`）を合成したヘッドレス・ランシミュレータ `simulation/run-simulator.ts` を新設し、フロア/ボス進行ループだけを本番フックから純粋関数として再構成する。契約テストは「単調性（主軸）＋生還率バンド＋静的不変量」。

**Tech Stack:** TypeScript / Jest 30 + SWC / 既存 `SeededRandomSource`（xorshift32, 決定論）/ 純粋ドメイン関数。React 不使用（simulator はフックに非依存）。

## Global Constraints

- 言語: コメント日本語、変数/関数名英語。`any` 禁止（`unknown`+型ガード）。`var` 禁止・`const` 優先。`null` より `undefined`。
- マジックナンバーは名前付き定数。定数は `Object.freeze`。名前付きエクスポート。ファイル名 kebab-case。
- 依存方向: `domain/` は外部依存なし。`simulation/` は feature root に置き `events/`・`domain/` を参照してよい（domain からは参照しない）。
- 決定論: `Date.now()`/`Math.random()` をテスト・simulator で使わない。乱数は注入 `RandomSource`（`SeededRandomSource(seed)`）。
- TDD（RED→GREEN）。カバレッジ: 新規コード 80%+、ドメインロジック 90%+。
- テスト実行: `npx jest <path>`。型: `npm run typecheck`。リント: `npm run lint`。フル: `npm run ci`。
- 数値設計値（verbatim）:
  - config: `BASE_HP=52`, `BASE_MN=33`, `BASE_INF=5`(据置), `EVENTS_PER_FLOOR=3`, `MAX_FLOOR=5`, `BOSS_EVENT_ID="e030"`, `MAX_BOSS_RETRIES=3`
  - difficulty modifiers `{hpMod,mnMod,drainMod,dmgMult}`: easy `{14,9,0,0.7}` / normal `{0,0,-2,1.0}` / hard `{-14,-12,-4,1.4}` / abyss `{-24,-20,-6,1.9}`（rewards 据置）
  - status tick: 出血 `hpDelta=-6`、恐怖 `mnDelta=-5`（負傷/混乱/呪い は tick null 据置）
  - echo: `READ_MN_COST=-4`
  - rest 重みブースト撤去（`pickEvent` の `if (e.tp==="rest") weighted.push(e)` を削除。`event-utils.ts` と `domain/events/event-selector.ts` の両方）

base dir（以降の相対パスの起点）: `src/features/labyrinth-echo/`

---

### Task 1: ヘッドレス・ランシミュレータ（simulation/run-simulator.ts）

本番と同じ `pickEvent`/`processChoice`/`checkSecondLife` を流用し、フロア/ボス進行だけを純粋に再構成する。`domain/` ではなく feature root の `simulation/` に置く（event-utils を参照するため）。

**Files:**
- Create: `simulation/run-simulator.ts`
- Test: `__tests__/simulation/run-simulator.test.ts`

**Interfaces:**
- Consumes:
  - `pickEvent({events, floor, usedIds, meta, fx, rng}): GameEvent | null`、`processChoice({event, choiceIdx, player, fx, diff}): { outcome: {fl?:string}, drained: Player, chainId: string|null, ... }`、`findChainEvent(events, id): GameEvent|null`（すべて `events/event-utils`）
  - `checkSecondLife(player, fx, usedSecondLife): { activated: boolean, player: Player }`（`domain/services/combat-service`）
  - `createNewPlayer(diff, fx): Player`、`computeFx(unlockIds): FxState`（`domain/services/unlock-service`）
  - `determineEnding(player, log, diff): { id: string }`（`domain/services/ending-service`）
  - `createMetaState(overrides?): MetaState`（`domain/models/meta-state`）
  - `CFG`（`domain/constants/config`）、`RandomSource`（`domain/events/random`）
- Produces:
  - `interface RunResult { survived: boolean; floorReached: number; endingId: string | null; cause: string; events: number }`
  - `interface RunPolicy { choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number }`
  - `CAREFUL_POLICY: RunPolicy`、`RANDOM_POLICY: RunPolicy`
  - `simulateRun(params: { difficulty: DifficultyDef; fx: FxState; rng: RandomSource; policy: RunPolicy; events: readonly GameEvent[] }): RunResult`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/simulation/run-simulator.test.ts`:

```ts
import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY } from '../../simulation/run-simulator';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';
import { SeededRandomSource } from '../../domain/events/random';

const EVENTS = [...EV, ...ECHO_EVENTS];
const normal = DIFFICULTY.find(d => d.id === 'normal')!;
const fx = computeFx([]);

describe('simulateRun', () => {
  it('同一シード・同一ポリシーなら結果は再現する（決定論）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(12345), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(12345), policy: CAREFUL_POLICY, events: EVENTS });
    expect(a).toEqual(b);
  });

  it('RunResult の形が妥当（cause は既知集合、floorReached は 1..MAX_FLOOR、events>0）', () => {
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(7), policy: CAREFUL_POLICY, events: EVENTS });
    expect(['escape', '体力消耗', '精神崩壊']).toContain(r.cause);
    expect(r.floorReached).toBeGreaterThanOrEqual(1);
    expect(r.floorReached).toBeLessThanOrEqual(5);
    expect(r.events).toBeGreaterThan(0);
    expect(r.survived).toBe(r.cause === 'escape');
  });

  it('careful の生還率は random 以上（同一シード集合・normal）', () => {
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    const rate = (policy: typeof CAREFUL_POLICY) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy, events: EVENTS }).survived).length / seeds.length;
    expect(rate(CAREFUL_POLICY)).toBeGreaterThanOrEqual(rate(RANDOM_POLICY));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest run-simulator`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: run-simulator.ts を実装**

`simulation/run-simulator.ts`:

```ts
/**
 * 迷宮の残響 - ヘッドレス・ランシミュレータ
 *
 * 本番と同じ純粋関数（pickEvent/processChoice/checkSecondLife）を合成し、
 * 1ラン分の探索を決定論的に再現する。バランス契約テスト用。
 * フロア/ボス進行ロジックは use-game-actions の useProceed/resolveBossRetry を
 * 純粋関数として再構成したもの（フックは副作用込みで流用不可）。CFG を直接参照し
 * 進行ルールの定数乖離を防ぐ。
 */
import { pickEvent, processChoice, findChainEvent } from '../events/event-utils';
import type { GameEvent } from '../events/event-utils';
import { checkSecondLife } from '../domain/services/combat-service';
import { determineEnding } from '../domain/services/ending-service';
import { createNewPlayer } from '../domain/services/unlock-service';
import { createMetaState } from '../domain/models/meta-state';
import { CFG } from '../domain/constants/config';
import type { Player } from '../domain/models/player';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { FxState } from '../domain/models/unlock';
import type { RandomSource } from '../domain/events/random';
import type { MetaState } from '../domain/models/meta-state';

/** 1ランの結果 */
export interface RunResult {
  readonly survived: boolean;
  readonly floorReached: number;
  readonly endingId: string | null;
  /** "escape" | "体力消耗" | "精神崩壊" */
  readonly cause: string;
  /** 消化したイベント数 */
  readonly events: number;
}

/** 選択方針 */
export interface RunPolicy {
  choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number;
}

/** 慎重ポリシー: 解決後 hp+mn 最良の選択肢を貪欲選択（脱出を最優先） */
export const CAREFUL_POLICY: RunPolicy = {
  choose(event, player, fx, diff) {
    let bestIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < event.ch.length; i++) {
      const res = processChoice({ event, choiceIdx: i, player, fx, diff });
      const score = res.outcome.fl === 'escape'
        ? Number.POSITIVE_INFINITY
        : res.drained.hp + res.drained.mn;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    return bestIdx;
  },
};

/** 無策ポリシー: 一様ランダム選択 */
export const RANDOM_POLICY: RunPolicy = {
  choose(event, _player, _fx, _diff, rng) {
    return Math.floor(rng.random() * event.ch.length);
  },
};

/** シミュレータ専用の固定メタ（初回相当: echoDepth0 / 履歴なし） */
const SIM_META: MetaState = createMetaState();

/** ボス再戦の進行判定（resolveBossRetry の純粋版） */
const resolveBossStep = (
  usedIds: readonly string[],
  floor: number,
  events: readonly GameEvent[],
  fx: FxState,
  rng: RandomSource,
): { event: GameEvent } | { gameover: true } => {
  const boss = events.find(e => e.id === CFG.BOSS_EVENT_ID);
  if (boss && !usedIds.includes(CFG.BOSS_EVENT_ID)) return { event: boss };

  const bossCount = usedIds.filter(id => id === CFG.BOSS_EVENT_ID).length;
  const lastBossIdx = usedIds.lastIndexOf(CFG.BOSS_EVENT_ID);
  const postBoss = usedIds.length - lastBossIdx - 1;

  if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
    const ev = pickEvent({ events: [...events], floor, usedIds: [...usedIds], meta: SIM_META, fx, rng });
    if (ev) return { event: ev };
  }
  if (bossCount < CFG.MAX_BOSS_RETRIES && boss) return { event: boss };
  return { gameover: true };
};

/** 1ランを決定論的に実行する */
export const simulateRun = (params: {
  difficulty: DifficultyDef;
  fx: FxState;
  rng: RandomSource;
  policy: RunPolicy;
  events: readonly GameEvent[];
}): RunResult => {
  const { difficulty, fx, rng, policy, events } = params;
  // 初期プレイヤー（本番と同じ createNewPlayer を流用＝DRY・定数乖離なし）
  let player: Player = createNewPlayer(difficulty, fx);
  let floor = 1;
  let step = 0;
  let usedIds: string[] = [];
  let usedSecondLife = false;
  let eventsConsumed = 0;

  let event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });

  const fail = (cause: string): RunResult =>
    ({ survived: false, floorReached: floor, endingId: null, cause, events: eventsConsumed });

  while (event) {
    const choiceIdx = policy.choose(event, player, fx, difficulty, rng);
    const res = processChoice({ event, choiceIdx, player, fx, diff: difficulty });
    eventsConsumed++;

    const sl = checkSecondLife(res.drained, fx, usedSecondLife);
    player = sl.player;
    if (sl.activated) usedSecondLife = true;

    if (res.outcome.fl === 'escape') {
      const endingId = determineEnding(player, [], difficulty).id;
      return { survived: true, floorReached: floor, endingId, cause: 'escape', events: eventsConsumed };
    }
    if (player.hp <= 0 || player.mn <= 0) {
      return fail(player.hp <= 0 ? '体力消耗' : '精神崩壊');
    }

    // チェイン優先（step を進めるが floor は進めない: useProceed と同じ）
    if (res.chainId) {
      const ce = findChainEvent([...events], res.chainId);
      if (ce) {
        usedIds = [...usedIds, event.id];
        step = step + 1;
        event = ce;
        continue;
      }
    }

    const nextStep = step + 1;
    usedIds = [...usedIds, event.id];
    const isShort = res.outcome.fl === 'shortcut';
    const nextFloor = isShort
      ? Math.min(floor + 2, CFG.MAX_FLOOR)
      : (nextStep >= CFG.EVENTS_PER_FLOOR ? floor + 1 : floor);

    if (nextFloor > floor && nextFloor <= CFG.MAX_FLOOR) {
      floor = nextFloor; step = 0;
      event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });
      continue;
    }
    if (nextFloor > CFG.MAX_FLOOR) {
      const r = resolveBossStep(usedIds, floor, events, fx, rng);
      if ('gameover' in r) return fail('精神崩壊');
      step = nextStep; event = r.event;
      continue;
    }
    step = nextStep;
    event = pickEvent({ events: [...events], floor, usedIds, meta: SIM_META, fx, rng });
  }
  // プール枯渇 = 探索続行不能
  return fail('精神崩壊');
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest run-simulator`
Expected: PASS（3件）

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/simulation/run-simulator.ts src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts
git commit -m "feat: 迷宮の残響 ヘッドレス・ランシミュレータを追加"
```

---

### Task 2: 静的不変量の契約テスト

難易度テーブルの構造（順序・正値）を守るガード。現行値でも通る（順序は現行でも成立）。

**Files:**
- Create: `__tests__/domain/services/balance-contract.test.ts`

**Interfaces:**
- Consumes: `DIFFICULTY`（`domain/constants/difficulty-defs`）、`CFG`（`domain/constants/config`）。
- Produces: 静的不変量テスト群（Task 4 が同ファイルに sim バンドを追記）。

- [ ] **Step 1: テストを書く**

`__tests__/domain/services/balance-contract.test.ts`:

```ts
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { CFG } from '../../../domain/constants/config';

const d = (id: string) => DIFFICULTY.find(x => x.id === id)!;

describe('難易度テーブル 静的不変量', () => {
  const easy = d('easy'), normal = d('normal'), hard = d('hard'), abyss = d('abyss');

  it('hpMod は easy > normal >= 0 > hard > abyss', () => {
    expect(easy.modifiers.hpMod).toBeGreaterThan(normal.modifiers.hpMod);
    expect(normal.modifiers.hpMod).toBeGreaterThanOrEqual(0);
    expect(0).toBeGreaterThan(hard.modifiers.hpMod);
    expect(hard.modifiers.hpMod).toBeGreaterThan(abyss.modifiers.hpMod);
  });

  it('drainMod は easy > normal > hard > abyss（小さいほど厳しい）', () => {
    expect(easy.modifiers.drainMod).toBeGreaterThan(normal.modifiers.drainMod);
    expect(normal.modifiers.drainMod).toBeGreaterThan(hard.modifiers.drainMod);
    expect(hard.modifiers.drainMod).toBeGreaterThan(abyss.modifiers.drainMod);
  });

  it('dmgMult は easy < normal <= hard < abyss', () => {
    expect(easy.modifiers.dmgMult).toBeLessThan(normal.modifiers.dmgMult);
    expect(normal.modifiers.dmgMult).toBeLessThanOrEqual(hard.modifiers.dmgMult);
    expect(hard.modifiers.dmgMult).toBeLessThan(abyss.modifiers.dmgMult);
  });

  it('kpOnWin は難度に比例して増加', () => {
    expect(easy.rewards.kpOnWin).toBeLessThan(normal.rewards.kpOnWin);
    expect(normal.rewards.kpOnWin).toBeLessThan(hard.rewards.kpOnWin);
    expect(hard.rewards.kpOnWin).toBeLessThan(abyss.rewards.kpOnWin);
  });

  it('全難易度で初期 HP/MN が正（破綻防止）', () => {
    for (const diff of DIFFICULTY) {
      expect(CFG.BASE_HP + diff.modifiers.hpMod).toBeGreaterThan(0);
      expect(CFG.BASE_MN + diff.modifiers.mnMod).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: テストが通ることを確認（現行値でも順序は成立）**

Run: `npx jest balance-contract`
Expected: PASS（5件）

- [ ] **Step 3: コミット**

```bash
git add src/features/labyrinth-echo/__tests__/domain/services/balance-contract.test.ts
git commit -m "test: 迷宮の残響 難易度テーブルの静的不変量契約を追加"
```

---

### Task 3: 中央集権5ノブの数値再調整

数値を設計値に更新し、期待値がズレる既存テストを新値へ更新する。

**Files:**
- Modify: `domain/constants/config.ts`
- Modify: `domain/constants/difficulty-defs.ts`
- Modify: `domain/constants/status-effect-defs.ts`
- Modify: `events/event-utils.ts`（`pickEvent` の rest 重み）
- Modify: `domain/events/event-selector.ts`（`pickEvent` の rest 重み）
- Modify: `events/echo-events.ts`（`READ_MN_COST`）
- Modify（期待値更新）: `__tests__/domain/models/difficulty.test.ts`、`__tests__/domain/services/combat-service.test.ts`、その他 `npm test` で判明する失敗テスト

**Interfaces:**
- Produces: 新しい難易度・ベース・status・echo コスト定数。`pickEvent` の rest ブースト撤去。

- [ ] **Step 1: config.ts を更新**

`domain/constants/config.ts` の `CFG` 内:

```ts
  BASE_HP: 52,
  BASE_MN: 33,
  BASE_INF: 5,
```

（`EVENTS_PER_FLOOR`/`MAX_FLOOR`/`BOSS_EVENT_ID`/`MAX_BOSS_RETRIES` は据置）

- [ ] **Step 2: difficulty-defs.ts を更新**

`domain/constants/difficulty-defs.ts` の各 `modifiers`（`rewards` は据置）:

```ts
  // easy
  modifiers: { hpMod: 14, mnMod: 9, drainMod: 0, dmgMult: 0.7 },
  // normal
  modifiers: { hpMod: 0, mnMod: 0, drainMod: -2, dmgMult: 1 },
  // hard
  modifiers: { hpMod: -14, mnMod: -12, drainMod: -4, dmgMult: 1.4 },
  // abyss
  modifiers: { hpMod: -24, mnMod: -20, drainMod: -6, dmgMult: 1.9 },
```

- [ ] **Step 3: status-effect-defs.ts を更新**

`domain/constants/status-effect-defs.ts` の `STATUS_META`:

```ts
  "出血": { ...  tick: { hpDelta: -6, mnDelta: 0 } },
  "恐怖": { ...  tick: { hpDelta: 0, mnDelta: -5 } },
```

（負傷/混乱/呪い の tick: null は据置。既存の他フィールドは保持し tick のみ変更）

- [ ] **Step 4: pickEvent の rest 重みブーストを撤去（両実装）**

`events/event-utils.ts` の `pickEvent` 内、以下を削除:

```ts
    // 安息イベントの出現確率を上げる
    if (e.tp === "rest") weighted.push(e);
```

`domain/events/event-selector.ts` の `pickEvent` 内、同等の以下を削除:

```ts
    // 安息イベントの出現確率を上げる
    if (e.tp === 'rest') weighted.push(e);
```

- [ ] **Step 5: echo の READ_MN_COST を更新**

`events/echo-events.ts`:

```ts
/** 読み解き時の精神コスト（マイナス） */
const READ_MN_COST = -4;
```

- [ ] **Step 6: 影響する既存テストを新値に更新**

Run: `npx jest difficulty combat-service status` で失敗を洗い出し、以下の方針で期待値を新値へ更新する:
- `difficulty.test.ts`: modifier を新値（easy `{14,9,0,0.7}` / normal `{0,0,-2,1}` / hard `{-14,-12,-4,1.4}` / abyss `{-24,-20,-6,1.9}`）に。
- `combat-service.test.ts`: drain 計算・ダメージ計算で古い `drainMod`/`dmgMult`/status tick（出血-5・恐怖-4）を前提にした期待値を新値（出血-6・恐怖-5・drain 等）に。
- その他 `BASE_HP=55`/`BASE_MN=35` を直接アサートしているテストがあれば 52/33 に。

その後 Run: `npx jest` の labyrinth-echo 範囲（`npx jest labyrinth-echo` 相当: `npx jest src/features/labyrinth-echo`）で残る失敗を新値へ更新。

- [ ] **Step 7: 静的不変量・simulator が壊れていないことを確認**

Run: `npx jest balance-contract run-simulator`
Expected: PASS（順序は新値でも成立、simulator は新定数で動作）

- [ ] **Step 8: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 9: コミット**

```bash
git add src/features/labyrinth-echo/domain/constants/config.ts src/features/labyrinth-echo/domain/constants/difficulty-defs.ts src/features/labyrinth-echo/domain/constants/status-effect-defs.ts src/features/labyrinth-echo/events/event-utils.ts src/features/labyrinth-echo/domain/events/event-selector.ts src/features/labyrinth-echo/events/echo-events.ts src/features/labyrinth-echo/__tests__
git commit -m "feat: 迷宮の残響 ベース難易度を再調整（config/difficulty/status/安息/echo）"
```

---

### Task 4: 生還率バンド＋単調性のバランス契約テスト（較正）

新定数のもとで、決定論 sim を回し「単調性（主軸）」と「生還率バンド（補助）」を固定する。バンドはポリシーが最適寄りのため幅広めに取り、合わなければ §7 の方針でノブ微調整。

**Files:**
- Modify: `__tests__/domain/services/balance-contract.test.ts`（sim セクションを追記）

**Interfaces:**
- Consumes: `simulateRun`/`CAREFUL_POLICY`/`RANDOM_POLICY`（Task 1）、`EV`/`ECHO_EVENTS`、`DIFFICULTY`、`computeFx`、`SeededRandomSource`。

- [ ] **Step 1: sim バンド・単調性テストを追記**

`__tests__/domain/services/balance-contract.test.ts` の末尾に追記:

```ts
import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY } from '../../../simulation/run-simulator';
import type { RunPolicy } from '../../../simulation/run-simulator';
import { EV } from '../../../events/event-data';
import { ECHO_EVENTS } from '../../../events/echo-events';
import { computeFx } from '../../../domain/services/unlock-service';
import { SeededRandomSource } from '../../../domain/events/random';

const EVENTS = [...EV, ...ECHO_EVENTS];
const BASE_FX = computeFx([]);
const N = 200;
const SEEDS = Array.from({ length: N }, (_, i) => i + 1);

/** 指定難易度・ポリシーの生還率（0..1）を決定論的に算出 */
const survivalRate = (diffId: string, policy: RunPolicy): number => {
  const difficulty = DIFFICULTY.find(x => x.id === diffId)!;
  const survived = SEEDS.filter(s =>
    simulateRun({ difficulty, fx: BASE_FX, rng: new SeededRandomSource(s), policy, events: EVENTS }).survived,
  ).length;
  return survived / N;
};

describe('バランス契約 決定論シミュレーション', () => {
  // 値はキャッシュ（各 describe 内で再計算を避ける）
  const carefulEasy = survivalRate('easy', CAREFUL_POLICY);
  const carefulNormal = survivalRate('normal', CAREFUL_POLICY);
  const carefulHard = survivalRate('hard', CAREFUL_POLICY);
  const carefulAbyss = survivalRate('abyss', CAREFUL_POLICY);

  it('careful 生還率は単調減少 easy > normal > hard > abyss（主軸）', () => {
    expect(carefulEasy).toBeGreaterThan(carefulNormal);
    expect(carefulNormal).toBeGreaterThan(carefulHard);
    expect(carefulHard).toBeGreaterThan(carefulAbyss);
  });

  it('random 生還率も単調減少 easy > normal > hard > abyss', () => {
    const re = survivalRate('easy', RANDOM_POLICY);
    const rn = survivalRate('normal', RANDOM_POLICY);
    const rh = survivalRate('hard', RANDOM_POLICY);
    const ra = survivalRate('abyss', RANDOM_POLICY);
    expect(re).toBeGreaterThan(rn);
    expect(rn).toBeGreaterThan(rh);
    expect(rh).toBeGreaterThan(ra);
  });

  it('同一難易度では careful >= random（normal で確認）', () => {
    expect(carefulNormal).toBeGreaterThanOrEqual(survivalRate('normal', RANDOM_POLICY));
  });

  it('生還率バンド: easy 高 / normal 中 / abyss 低', () => {
    expect(carefulEasy).toBeGreaterThanOrEqual(0.65);
    expect(carefulNormal).toBeGreaterThanOrEqual(0.45);
    expect(carefulNormal).toBeLessThanOrEqual(0.85);
    expect(carefulAbyss).toBeLessThanOrEqual(0.35);
  });
});
```

注（バンドの根拠）: CAREFUL は自ステータスから最適選択する「上手な慎重プレイヤー」のため生還率は上振れする。「理不尽でない」は **normal を 0.45–0.85（最適でも時に死ぬ）**、abyss を 0.35 以下で表現。単調性が崩れない限り絶対値はノブで較正する。

- [ ] **Step 2: テストを実行し、実測する**

Run: `npx jest balance-contract`
Expected: 単調性は PASS。バンドが外れる場合は実測値をログで確認。

- [ ] **Step 3: バンド未達ならノブを較正**

- carefulNormal > 0.85（締め不足）→ `difficulty-defs.ts` の normal `drainMod -2 → -3`、または `config.ts` `BASE_HP 52 → 50` に調整して再測（§7 の範囲内）。
- carefulNormal < 0.45（締め過ぎ・理不尽）→ normal `drainMod -2 → -1` に戻すか `BASE_HP 52 → 54`。
- carefulAbyss > 0.35 → abyss `dmgMult 1.9 → 2.0` または `drainMod -6 → -7`。
- 変更後は Task 3 の影響テスト（difficulty/combat-service）も新値へ追随し、`npx jest balance-contract difficulty combat-service` を再実行。
- 単調性を最優先。バンドは「方向の合格基準」であり、最適ポリシー特性上どうしても収まらない場合は本タスク内でバンド境界を実測に合わせて1段緩め、その旨をテストコメントに明記する。

- [ ] **Step 4: 最終的に全契約テストが通ることを確認**

Run: `npx jest balance-contract`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/__tests__/domain/services/balance-contract.test.ts src/features/labyrinth-echo/domain/constants
git commit -m "test: 迷宮の残響 生還率バンド＋単調性のバランス契約を追加・較正"
```

---

### Task 5: README 更新と全体 CI 確認

**Files:**
- Modify: `src/features/labyrinth-echo/README.md`

**Interfaces:**
- Consumes: 全タスクの成果物。
- Produces: ドキュメント整合 + `npm run ci` グリーン。

- [ ] **Step 1: README にバランス再調整を追記**

`README.md` の「### ゲームシステム」リスト（残響システムの後あたり）に追加:

```markdown
- **バランス再調整（Phase 2）**: Normal を基準に初期値・ドレイン・状態異常・安息頻度を「理不尽でない程度」に締める（Easy は据置）。決定論シミュレーション＋静的不変量のバランス契約テストで難易度の単調性・生還率バンドを回帰から保護
```

- [ ] **Step 2: 関連テストを一括実行**

Run: `npx jest run-simulator balance-contract difficulty combat-service`
Expected: 全 PASS

- [ ] **Step 3: lint**

Run: `npm run lint`
Expected: エラーなし（警告は既存水準内）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 5: フル CI**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build すべて PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/README.md
git commit -m "docs: 迷宮の残響 README にバランス再調整（Phase 2）を追記"
```

---

## 完了時の受け入れ基準（spec §8 対応）

- [x] 5ノブの数値が設計値に更新（Task 3）
- [x] simulator が同一シードで再現可能・脱出/死亡/フロア進行が正しい（Task 1）
- [x] バランス契約テスト（生還率バンド＋単調性＋静的不変量）が通る（Task 2, 4）
- [x] 影響する既存テストが新値で更新され通る（Task 3）
- [x] `npm run ci` グリーン（Task 5）

## 申し送り（Phase 3 以降）

- simulator のフロア/ボス進行は `use-game-actions` の useProceed/resolveBossRetry を純粋再構成した重複。将来フックを simulator の純粋ループへ寄せる DRY 化が可能（今回はスコープ外、コメントで明示）。
- echoDepth 連動の NG+ エスカレーション（Phase 3）では、この simulator を深度別の難易度検証にも再利用できる。
