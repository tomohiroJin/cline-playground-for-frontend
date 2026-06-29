# 迷宮の残響 シミュレーション・レポート＆実験的テスト基盤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 迷宮の残響のシミュレーション結果（単発生還率・周回進行・継承分析・END分布）を自己完結HTMLレポートとして出力し、不変条件チェッカで異常を検出する開発支援＆テスト基盤を作る。

**Architecture:** 既存 `run-simulator.ts` を土台に、純粋な集計層（`analysis.ts`）・不変条件層（`invariants.ts`）・周回層（`career-simulator.ts`）を積み、レポート層（`report/`）で HTML 文字列を生成。副作用（fs・日時）は CLI エントリのみ。同じ集計を Jest と HTML が共有する。

**Tech Stack:** TypeScript / Jest 30 + SWC / ts-node（CLI実行）。チャートは inline SVG・div（依存追加なし）。

## Global Constraints

- 言語: コメント・docstring は日本語。コード識別子は英語可。
- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先（外部境界を除く）。
- 名前付きエクスポートを優先。相対 import の `../` は2階層まで。
- `domain/` への参照方向を守る（simulation は domain/events を参照可、その逆は不可）。
- 決定論維持: `analysis.ts`・`career-simulator.ts`・ドメイン層は `Date.now()`/`Math.random()` を直接使わない。乱数は `SeededRandomSource(seed)`、日時は CLI で注入。
- レポートHTMLは `reports/`（gitignore）に出力。ゲーム本体ビルドには非同梱。
- 外部チャートライブラリ等の依存追加禁止。
- テストは対象と同じ feature 配下 `__tests__/simulation/` に配置。`*.test.ts`。
- コミットは Conventional Commits（`feat:`/`test:`/`chore:`）。末尾に
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

## 既存コードの確定済みシグネチャ（参照用）

```typescript
// simulation/run-simulator.ts
interface RunResult { survived: boolean; floorReached: number; endingId: string | null; cause: string; events: number; }
interface RunPolicy { choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number; }
const CAREFUL_POLICY: RunPolicy; const RANDOM_POLICY: RunPolicy;
const simulateRun: (params: { difficulty; fx; rng; policy; events; pressure?; meta?; legacy? }) => RunResult;

// domain/services/echo-service.ts
const ECHO_DEPTH_MAX = 6;
const incrementEchoDepth: (d: number) => number;
const selectSafetyNetFragment: (echoDepth: number, collected: readonly string[]) => EchoFragment | null;
const isPredecessorComplete: (predId: string, collected: readonly string[]) => boolean;

// domain/services/finale-service.ts
const TRUE_ROUTE_DEPTH_GATE = 6;
const isTrueRouteUnlocked: (meta: MetaState) => boolean;

// domain/services/legacy-service.ts
const unlockedLegacies: (fragments: readonly string[]) => EchoLegacy[];   // EchoLegacy.id: 'lg_lian'|'lg_twins'|'lg_galen'|'lg_elna'|'lg_first', .predecessorId
const getLegacyById: (id: string | null) => EchoLegacy | null;

// domain/models/meta-state.ts
const createMetaState: (overrides?: Partial<MetaState>) => MetaState;  // FRESH_META ベース。echoDepth:0, fragments:[], escapes:0, totalDeaths:0, endings:[]

// constants
DIFFICULTY: DifficultyDef[]  // id: 'easy'|'normal'|'hard'|'abyss'
ECHO_FRAGMENTS: 19件 (id 'f_*', predecessorId 'p_*', order, depthGate, floors)
PREDECESSORS: 5件 (id 'p_lian'|'p_twins'|'p_galen'|'p_elna'|'p_first')
LEGACIES: 5件 (id 'lg_*', predecessorId 'p_*')
ENDINGS (ending-defs.ts): 通常END (id 'perfect'|'scholar'|'iron'|'battered'|'madness'|'hard_clear'|'abyss_clear'|'abyss_perfect' 等)
TRUE_ENDINGS (true-ending-defs.ts): 'te_inheritor'|'te_liberator'|'te_inheritor_true'|'te_liberator_true'

// domain/events/random.ts
class SeededRandomSource implements RandomSource { constructor(seed: number); random(): number; }

// events
EV (event-data.ts), ECHO_EVENTS (echo-events.ts), REVENANT_EVENTS (revenant-events.ts)
// domain/services/unlock-service.ts
const computeFx: (unlocked: readonly string[]) => FxState;
```

---

### Task 1: run-simulator に fragmentsRead を追加

**Files:**
- Modify: `src/features/labyrinth-echo/simulation/run-simulator.ts`
- Test: `src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts`

**Interfaces:**
- Consumes: 既存 `simulateRun`, `RunResult`, `EV`, `ECHO_EVENTS`, `SeededRandomSource`, `DIFFICULTY`, `computeFx`。
- Produces: `RunResult` に `readonly fragmentsRead: readonly string[]` を追加。読み解き選択（`o.fl="frag:<id>"`）時に `<id>` を蓄積。

- [ ] **Step 1: 失敗するテストを書く**

`run-simulator.test.ts` の末尾（最後の `});` の直前ではなくファイル末尾、describe外でも可）に追記:

```typescript
import { createMetaState } from '../../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../../domain/constants/echo-fragment-defs';

describe('simulateRun fragmentsRead', () => {
  it('echo を必ず読むポリシーでは fragmentsRead に断片IDが入る', () => {
    // depth1 + 断片未収集で echo イベントが出現しうる状態
    const meta = createMetaState({ echoDepth: 6 });
    const lorePolicy = {
      choose(event: any, player: any, fxArg: any, diff: any, rng: any) {
        const idx = event.ch.findIndex((c: any) => c.o?.some((o: any) => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
        return idx >= 0 ? idx : CAREFUL_POLICY.choose(event, player, fxArg, diff, rng);
      },
    };
    // 複数シードを試し、どれかで断片を読めることを確認（echoはレアなため）
    const anyRead = [1, 2, 3, 4, 5, 6, 7, 8].some(s => {
      const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: lorePolicy, events: [...EVENTS, ...[]], meta });
      return r.fragmentsRead.length > 0;
    });
    expect(anyRead).toBe(true);
  });

  it('careful ポリシーでは fragmentsRead は空（読み解かない＝MN温存）', () => {
    const meta = createMetaState({ echoDepth: 6 });
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: CAREFUL_POLICY, events: EVENTS, meta });
    expect(r.fragmentsRead).toEqual([]);
  });

  it('読み解いた断片IDはすべて有効な ECHO_FRAGMENTS のID', () => {
    const meta = createMetaState({ echoDepth: 6 });
    const lorePolicy = {
      choose(event: any, player: any, fxArg: any, diff: any, rng: any) {
        const idx = event.ch.findIndex((c: any) => c.o?.some((o: any) => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
        return idx >= 0 ? idx : CAREFUL_POLICY.choose(event, player, fxArg, diff, rng);
      },
    };
    const validIds = new Set(ECHO_FRAGMENTS.map(f => f.id));
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(3), policy: lorePolicy, events: EVENTS, meta });
    for (const id of r.fragmentsRead) expect(validIds.has(id)).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts -t fragmentsRead`
Expected: FAIL（`fragmentsRead` が `RunResult` に存在せず型エラー、または `undefined`）

- [ ] **Step 3: 最小実装**

`RunResult` interface に追記（`events: number;` の直後）:

```typescript
  /** 消化したイベント数 */
  readonly events: number;
  /** 探索中に「読み解いた」断片 id 群（キャリアシミュレーション用） */
  readonly fragmentsRead: readonly string[];
```

`simulateRun` 本体、`let eventsConsumed = 0;` の直後に追加:

```typescript
  let eventsConsumed = 0;
  const fragmentsRead: string[] = [];
```

`fail` クロージャの返却に `fragmentsRead` を追加:

```typescript
  const fail = (cause: string): RunResult =>
    ({ survived: false, floorReached: floor, endingId: null, cause, events: eventsConsumed, fragmentsRead });
```

`processChoice` 呼び出し直後（`eventsConsumed++;` の後）に捕捉ロジックを追加:

```typescript
    eventsConsumed++;

    // 探索中に読み解いた断片を記録（fl:"frag:<id>"）
    if (res.outcome.fl?.startsWith('frag:')) fragmentsRead.push(res.outcome.fl.slice('frag:'.length));
```

escape 時の return に `fragmentsRead` を追加:

```typescript
    if (res.outcome.fl === 'escape') {
      const endingId = determineEnding(player, [], difficulty).id;
      return { survived: true, floorReached: floor, endingId, cause: 'escape', events: eventsConsumed, fragmentsRead };
    }
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts`
Expected: PASS（既存テストも含め全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/run-simulator.ts src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts
git commit -m "$(printf 'feat: 迷宮の残響シミュレータに fragmentsRead を追加\n\n探索中に読み解いた断片IDを記録。キャリアシミュレーションで\n周回をまたぐ断片収集の累積を再現するための土台。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 2: policies.ts（ポリシー集約 + LORE_POLICY）

**Files:**
- Create: `src/features/labyrinth-echo/simulation/policies.ts`
- Modify: `src/features/labyrinth-echo/simulation/run-simulator.ts`（CAREFUL/RANDOM を移設し re-export）
- Test: `src/features/labyrinth-echo/__tests__/simulation/policies.test.ts`

**Interfaces:**
- Consumes: `RunPolicy`（type, run-simulator から type-only import）, `processChoice`（event-utils）。
- Produces: `CAREFUL_POLICY`, `RANDOM_POLICY`, `LORE_POLICY: RunPolicy`。run-simulator はこの3つを re-export（既存 import 互換維持）。

- [ ] **Step 1: 失敗するテストを書く**

`policies.test.ts`:

```typescript
import { LORE_POLICY, CAREFUL_POLICY, RANDOM_POLICY } from '../../simulation/policies';
import type { GameEvent } from '../../events/event-utils';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';
import { SeededRandomSource } from '../../domain/events/random';
import { createNewPlayer } from '../../domain/services/unlock-service';

const normal = DIFFICULTY.find(d => d.id === 'normal')!;
const fx = computeFx([]);
const player = createNewPlayer(normal, fx);

// frag選択肢を持つ擬似 echo イベント
const echoEvent = {
  id: 'echo_test', fl: [1], tp: 'echo', sit: 's',
  ch: [
    { t: '読む', o: [{ c: 'default', r: 'r', mn: -4, inf: 5, fl: 'frag:f_lian_1' }] },
    { t: '進む', o: [{ c: 'default', r: 'r', mn: 0, inf: 0 }] },
  ],
} as unknown as GameEvent;

describe('LORE_POLICY', () => {
  it('frag選択肢があればそのindexを選ぶ', () => {
    expect(LORE_POLICY.choose(echoEvent, player, fx, normal, new SeededRandomSource(1))).toBe(0);
  });

  it('frag選択肢がない通常イベントでは careful と同じ選択', () => {
    const plain = {
      id: 'p1', fl: [1], tp: 'trap', sit: 's',
      ch: [
        { t: 'A', o: [{ c: 'default', r: 'r', hp: -10, mn: 0, inf: 0 }] },
        { t: 'B', o: [{ c: 'default', r: 'r', hp: -1, mn: 0, inf: 0 }] },
      ],
    } as unknown as GameEvent;
    const rng = new SeededRandomSource(1);
    expect(LORE_POLICY.choose(plain, player, fx, normal, rng))
      .toBe(CAREFUL_POLICY.choose(plain, player, fx, normal, rng));
  });
});

describe('re-export 互換', () => {
  it('CAREFUL_POLICY / RANDOM_POLICY が policies からも参照できる', () => {
    expect(typeof CAREFUL_POLICY.choose).toBe('function');
    expect(typeof RANDOM_POLICY.choose).toBe('function');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/policies.test.ts`
Expected: FAIL（`policies` モジュールが存在しない）

- [ ] **Step 3: 最小実装**

`policies.ts` を新規作成。run-simulator から CAREFUL/RANDOM の実体を移植し、LORE を追加:

```typescript
/**
 * 迷宮の残響 - シミュレーション選択ポリシー
 *
 * 1イベントに対する選択方針を集約する。RunPolicy の実装群。
 */
import { processChoice } from '../events/event-utils';
import type { RunPolicy } from './run-simulator';

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

/** ロアハンター: 読み解き選択肢(fl:"frag:")があれば必ず読む。なければ careful。 */
export const LORE_POLICY: RunPolicy = {
  choose(event, player, fx, diff, rng) {
    const fragIdx = event.ch.findIndex(c => c.o?.some(o => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
    if (fragIdx >= 0) return fragIdx;
    return CAREFUL_POLICY.choose(event, player, fx, diff, rng);
  },
};
```

run-simulator.ts: 既存の `CAREFUL_POLICY` / `RANDOM_POLICY` の定義ブロック（`export const CAREFUL_POLICY ...` から `RANDOM_POLICY` の閉じまで）を削除し、`RunPolicy` interface 定義の直後に re-export を追加:

```typescript
/** 選択方針 */
export interface RunPolicy {
  choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number;
}

// ポリシー実体は policies.ts に集約（type-only 依存のため循環参照にならない）
export { CAREFUL_POLICY, RANDOM_POLICY, LORE_POLICY } from './policies';
```

run-simulator 内で `CAREFUL_POLICY` 等を内部利用している箇所がないことを確認（無ければ追加 import 不要。`processChoice` の import は run-simulator にも policies にも必要なので両方に残す）。

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/`
Expected: PASS（policies + run-simulator + balance-contract すべて。balance-contract は run-simulator 経由で CAREFUL/RANDOM を import しており re-export で互換維持）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/policies.ts src/features/labyrinth-echo/simulation/run-simulator.ts src/features/labyrinth-echo/__tests__/simulation/policies.test.ts
git commit -m "$(printf 'refactor: シミュレーションポリシーを policies.ts に集約し LORE_POLICY 追加\n\nCAREFUL/RANDOM を run-simulator から移設、断片を必ず読む\nLORE_POLICY を新設。run-simulator は re-export で互換維持。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 3: career-simulator.ts（周回進行）

**Files:**
- Create: `src/features/labyrinth-echo/simulation/career-simulator.ts`
- Test: `src/features/labyrinth-echo/__tests__/simulation/career-simulator.test.ts`

**Interfaces:**
- Consumes: `simulateRun`, `RunResult`, `RunPolicy`（run-simulator）, `incrementEchoDepth`, `selectSafetyNetFragment`（echo-service）, `isTrueRouteUnlocked`（finale-service）, `unlockedLegacies`（legacy-service）, `createMetaState`, `MetaState`, `SeededRandomSource`, `DifficultyDef`, `FxState`, `EchoLegacy`。
- Produces:
  - `interface CareerStep { runIndex: number; survived: boolean; cause: string; floorReached: number; depth: number; fragmentCount: number; fragsReadThisRun: number; safetyNetGranted: boolean; }`
  - `interface CareerResult { unlocked: boolean; runsToUnlock: number; escapesToUnlock: number; deathsToUnlock: number; finalDepth: number; finalFragments: number; timeline: CareerStep[]; legacyUnlocks: { runIndex: number; legacyId: string }[]; }`
  - `const simulateCareer: (params: { difficulty: DifficultyDef; fx: FxState; policy: RunPolicy; events: readonly GameEvent[]; careerSeed: number; maxRuns: number; pressure?: number; legacy?: EchoLegacy | null; }) => CareerResult`

- [ ] **Step 1: 失敗するテストを書く**

`career-simulator.test.ts`:

```typescript
import { simulateCareer } from '../../simulation/career-simulator';
import { CAREFUL_POLICY, LORE_POLICY } from '../../simulation/policies';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { REVENANT_EVENTS } from '../../events/revenant-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';

const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const fx = computeFx([]);
const easy = DIFFICULTY.find(d => d.id === 'easy')!;
const normal = DIFFICULTY.find(d => d.id === 'normal')!;

describe('simulateCareer', () => {
  it('easy×careful は19脱出で真ルート解禁（セーフティネット1/脱出）', () => {
    const r = simulateCareer({ difficulty: easy, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(r.unlocked).toBe(true);
    expect(r.escapesToUnlock).toBe(19);
    expect(r.finalDepth).toBe(6);
    expect(r.finalFragments).toBe(19);
  });

  it('timeline は runs と同数で depth/断片は非減少', () => {
    const r = simulateCareer({ difficulty: normal, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 2, maxRuns: 200 });
    expect(r.timeline.length).toBe(r.runsToUnlock);
    for (let i = 1; i < r.timeline.length; i++) {
      expect(r.timeline[i].depth).toBeGreaterThanOrEqual(r.timeline[i - 1].depth);
      expect(r.timeline[i].fragmentCount).toBeGreaterThanOrEqual(r.timeline[i - 1].fragmentCount);
    }
  });

  it('escapes + deaths == runs', () => {
    const r = simulateCareer({ difficulty: normal, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 3, maxRuns: 200 });
    expect(r.escapesToUnlock + r.deathsToUnlock).toBe(r.runsToUnlock);
  });

  it('legacyUnlocks は5件記録され runIndex 昇順（先人完収集の順）', () => {
    const r = simulateCareer({ difficulty: easy, fx, policy: LORE_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(r.legacyUnlocks.length).toBe(5);
    for (let i = 1; i < r.legacyUnlocks.length; i++) {
      expect(r.legacyUnlocks[i].runIndex).toBeGreaterThanOrEqual(r.legacyUnlocks[i - 1].runIndex);
    }
  });

  it('maxRuns 到達で未解禁なら unlocked=false（censored）', () => {
    const abyss = DIFFICULTY.find(d => d.id === 'abyss')!;
    const r = simulateCareer({ difficulty: abyss, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 5 });
    expect(r.unlocked).toBe(false);
    expect(r.runsToUnlock).toBe(5);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/career-simulator.test.ts`
Expected: FAIL（`career-simulator` が存在しない）

- [ ] **Step 3: 最小実装**

`career-simulator.ts`:

```typescript
/**
 * 迷宮の残響 - キャリア（周回）シミュレータ
 *
 * 真ルート解禁まで run を繰り返し、echoDepth 蓄積・断片収集・レガシー解禁の
 * 累積過程を再現する。本番ドメイン関数（incrementEchoDepth/selectSafetyNetFragment/
 * isTrueRouteUnlocked/unlockedLegacies）を流用し定数乖離を防ぐ。決定論（seed固定）。
 */
import { simulateRun } from './run-simulator';
import type { RunPolicy } from './run-simulator';
import { incrementEchoDepth, selectSafetyNetFragment } from '../domain/services/echo-service';
import { isTrueRouteUnlocked } from '../domain/services/finale-service';
import { unlockedLegacies } from '../domain/services/legacy-service';
import { createMetaState } from '../domain/models/meta-state';
import type { MetaState } from '../domain/models/meta-state';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { FxState } from '../domain/models/unlock';
import type { EchoLegacy } from '../domain/models/echo';
import type { GameEvent } from '../events/event-utils';
import { SeededRandomSource } from '../domain/events/random';

/** 1周（run）の記録 */
export interface CareerStep {
  runIndex: number;
  survived: boolean;
  cause: string;
  floorReached: number;
  depth: number;
  fragmentCount: number;
  fragsReadThisRun: number;
  safetyNetGranted: boolean;
}

/** 1キャリア（真ルート解禁まで）の結果 */
export interface CareerResult {
  unlocked: boolean;
  runsToUnlock: number;
  escapesToUnlock: number;
  deathsToUnlock: number;
  finalDepth: number;
  finalFragments: number;
  timeline: CareerStep[];
  legacyUnlocks: { runIndex: number; legacyId: string }[];
}

/** 1キャリアを決定論的にシミュレートする */
export const simulateCareer = (params: {
  difficulty: DifficultyDef;
  fx: FxState;
  policy: RunPolicy;
  events: readonly GameEvent[];
  careerSeed: number;
  maxRuns: number;
  pressure?: number;
  legacy?: EchoLegacy | null;
}): CareerResult => {
  const { difficulty, fx, policy, events, careerSeed, maxRuns, pressure = 0, legacy = null } = params;
  let meta: MetaState = createMetaState();
  let runs = 0, escapes = 0, deaths = 0;
  const timeline: CareerStep[] = [];
  const legacyUnlocks: { runIndex: number; legacyId: string }[] = [];
  const seenLegacies = new Set<string>();

  while (runs < maxRuns) {
    runs++;
    // 周回ごとに決定論シード（キャリアシード×1000 + run番号）
    const rng = new SeededRandomSource(careerSeed * 1000 + runs);
    const res = simulateRun({ difficulty, fx, rng, policy, events, pressure, meta, legacy });

    let fragsReadThisRun = 0;
    let safetyNetGranted = false;

    if (res.survived) {
      escapes++;
      const newDepth = incrementEchoDepth(meta.echoDepth);
      // 探索中に読んだ断片（未収集のみ採用）
      const readFrags = res.fragmentsRead.filter(id => !meta.fragments.includes(id));
      fragsReadThisRun = readFrags.length;
      let fragments = readFrags.length ? [...meta.fragments, ...readFrags] : meta.fragments;
      // セーフティネット（脱出ごとに1片保証）
      const safety = selectSafetyNetFragment(newDepth, fragments);
      if (safety && !fragments.includes(safety.id)) {
        fragments = [...fragments, safety.id];
        safetyNetGranted = true;
      }
      meta = { ...meta, echoDepth: newDepth, fragments, escapes: meta.escapes + 1 };

      // レガシー解禁検知（新規に完収集された先人）
      for (const lg of unlockedLegacies(meta.fragments)) {
        if (!seenLegacies.has(lg.id)) {
          seenLegacies.add(lg.id);
          legacyUnlocks.push({ runIndex: runs, legacyId: lg.id });
        }
      }
    } else {
      deaths++;
      meta = { ...meta, totalDeaths: meta.totalDeaths + 1 };
    }

    timeline.push({
      runIndex: runs,
      survived: res.survived,
      cause: res.cause,
      floorReached: res.floorReached,
      depth: meta.echoDepth,
      fragmentCount: meta.fragments.length,
      fragsReadThisRun,
      safetyNetGranted,
    });

    if (isTrueRouteUnlocked(meta)) {
      return { unlocked: true, runsToUnlock: runs, escapesToUnlock: escapes, deathsToUnlock: deaths, finalDepth: meta.echoDepth, finalFragments: meta.fragments.length, timeline, legacyUnlocks };
    }
  }
  return { unlocked: false, runsToUnlock: runs, escapesToUnlock: escapes, deathsToUnlock: deaths, finalDepth: meta.echoDepth, finalFragments: meta.fragments.length, timeline, legacyUnlocks };
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/career-simulator.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/career-simulator.ts src/features/labyrinth-echo/__tests__/simulation/career-simulator.test.ts
git commit -m "$(printf 'feat: 迷宮の残響キャリア（周回）シミュレータを追加\n\n真ルート解禁まで run を繰り返し、echoDepth・断片・レガシー解禁の\n累積を再現。timeline と legacyUnlocks で進行を記録。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 4: invariants.ts（不変条件チェッカ）

**Files:**
- Create: `src/features/labyrinth-echo/simulation/invariants.ts`
- Test: `src/features/labyrinth-echo/__tests__/simulation/invariants.test.ts`

**Interfaces:**
- Consumes: `CareerResult`, `CareerStep`（career-simulator）, `RunResult`（run-simulator）, `ECHO_FRAGMENTS`, `ECHO_DEPTH_MAX`（echo-service）, `unlockedLegacies`, `isPredecessorComplete`, `LEGACIES`, `ENDINGS`, `TRUE_ENDINGS`, `CFG`（config: MAX_FLOOR）。
- Produces:
  - `interface Violation { severity: 'error' | 'warn'; rule: string; detail: string; }`
  - `const checkCareer: (career: CareerResult) => Violation[]`
  - `const checkRun: (run: RunResult) => Violation[]`
  - `const checkSurvivalMonotonic: (rates: { label: string; rate: number }[]) => Violation[]`（label 降順に rate が単調減少であるべき列を検査）

- [ ] **Step 1: 失敗するテストを書く**

`invariants.test.ts`:

```typescript
import { checkCareer, checkRun, checkSurvivalMonotonic } from '../../simulation/invariants';
import type { CareerResult } from '../../simulation/career-simulator';
import type { RunResult } from '../../simulation/run-simulator';
import { simulateCareer } from '../../simulation/career-simulator';
import { CAREFUL_POLICY } from '../../simulation/policies';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { REVENANT_EVENTS } from '../../events/revenant-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';

const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const fx = computeFx([]);
const easy = DIFFICULTY.find(d => d.id === 'easy')!;

const baseStep = (over: Partial<import('../../simulation/career-simulator').CareerStep> = {}) => ({
  runIndex: 1, survived: true, cause: 'escape', floorReached: 5,
  depth: 1, fragmentCount: 1, fragsReadThisRun: 0, safetyNetGranted: true, ...over,
});

describe('checkCareer 実シムでは違反0件', () => {
  it('easy×careful キャリアは違反なし', () => {
    const career = simulateCareer({ difficulty: easy, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(checkCareer(career)).toEqual([]);
  });
});

describe('checkCareer 故意の不正を検出', () => {
  it('depth が 6 を超えたら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 7, finalFragments: 1, timeline: [baseStep({ depth: 7 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'depth_max')).toBe(true);
  });

  it('断片数が19を超えたら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 6, finalFragments: 20, timeline: [baseStep({ fragmentCount: 20 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'fragment_max')).toBe(true);
  });

  it('depth が減少したら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 2, escapesToUnlock: 2, deathsToUnlock: 0,
      finalDepth: 1, finalFragments: 2,
      timeline: [baseStep({ runIndex: 1, depth: 2 }), baseStep({ runIndex: 2, depth: 1 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'depth_monotonic')).toBe(true);
  });

  it('escapes+deaths != runs なら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 5, escapesToUnlock: 2, deathsToUnlock: 2,
      finalDepth: 2, finalFragments: 2, timeline: [baseStep()], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'run_count')).toBe(true);
  });

  it('真ルート解禁なのに depth<6 or 断片<19 なら error', () => {
    const bad: CareerResult = {
      unlocked: true, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 5, finalFragments: 10, timeline: [baseStep({ depth: 5, fragmentCount: 10 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'true_route_condition')).toBe(true);
  });
});

describe('checkRun', () => {
  it('正常なrunは違反なし', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r)).toEqual([]);
  });
  it('floorReached が MAX_FLOOR 超過で error', () => {
    const r: RunResult = { survived: true, floorReached: 9, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r).some(v => v.rule === 'floor_range')).toBe(true);
  });
  it('未知の endingId で error', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'nonexistent_ending', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r).some(v => v.rule === 'ending_valid')).toBe(true);
  });
  it('未知の断片IDで error', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: ['f_bogus'] };
    expect(checkRun(r).some(v => v.rule === 'fragment_valid')).toBe(true);
  });
});

describe('checkSurvivalMonotonic', () => {
  it('単調減少なら違反なし', () => {
    expect(checkSurvivalMonotonic([{ label: 'easy', rate: 1 }, { label: 'normal', rate: 0.8 }, { label: 'hard', rate: 0.1 }])).toEqual([]);
  });
  it('途中で増加したら error', () => {
    expect(checkSurvivalMonotonic([{ label: 'easy', rate: 0.5 }, { label: 'normal', rate: 0.8 }]).some(v => v.rule === 'survival_monotonic')).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/invariants.test.ts`
Expected: FAIL（`invariants` が存在しない）

- [ ] **Step 3: 最小実装**

`invariants.ts`:

```typescript
/**
 * 迷宮の残響 - シミュレーション不変条件チェッカ
 *
 * キャリア・単発run・集計レベルの不変条件を検査し、違反レコードを返す純粋関数群。
 * CIテスト（回帰ガード＋検出器自体のテスト）とレポート警告欄の両方で使用する。
 */
import type { CareerResult } from './career-simulator';
import type { RunResult } from './run-simulator';
import { ECHO_DEPTH_MAX } from '../domain/services/echo-service';
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import { ENDINGS } from '../domain/constants/ending-defs';
import { TRUE_ENDINGS } from '../domain/constants/true-ending-defs';
import { CFG } from '../domain/constants/config';

/** 不変条件違反レコード */
export interface Violation {
  severity: 'error' | 'warn';
  rule: string;
  detail: string;
}

const FRAGMENT_IDS = new Set(ECHO_FRAGMENTS.map(f => f.id));
const FRAGMENT_TOTAL = ECHO_FRAGMENTS.length; // 19
const ENDING_IDS = new Set<string>([...ENDINGS.map(e => e.id), ...TRUE_ENDINGS.map(e => e.id)]);
const KNOWN_CAUSES = new Set(['escape', '体力消耗', '精神崩壊']);

/** キャリア結果の不変条件を検査する */
export const checkCareer = (career: CareerResult): Violation[] => {
  const v: Violation[] = [];
  const { timeline } = career;

  for (const step of timeline) {
    if (step.depth > ECHO_DEPTH_MAX) {
      v.push({ severity: 'error', rule: 'depth_max', detail: `run ${step.runIndex}: depth ${step.depth} > ${ECHO_DEPTH_MAX}` });
    }
    if (step.fragmentCount > FRAGMENT_TOTAL) {
      v.push({ severity: 'error', rule: 'fragment_max', detail: `run ${step.runIndex}: 断片 ${step.fragmentCount} > ${FRAGMENT_TOTAL}` });
    }
  }
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].depth < timeline[i - 1].depth) {
      v.push({ severity: 'error', rule: 'depth_monotonic', detail: `run ${timeline[i].runIndex}: depth ${timeline[i].depth} < 前周 ${timeline[i - 1].depth}` });
    }
    if (timeline[i].fragmentCount < timeline[i - 1].fragmentCount) {
      v.push({ severity: 'error', rule: 'fragment_monotonic', detail: `run ${timeline[i].runIndex}: 断片 ${timeline[i].fragmentCount} < 前周 ${timeline[i - 1].fragmentCount}` });
    }
  }
  if (career.escapesToUnlock + career.deathsToUnlock !== career.runsToUnlock) {
    v.push({ severity: 'error', rule: 'run_count', detail: `escapes(${career.escapesToUnlock}) + deaths(${career.deathsToUnlock}) != runs(${career.runsToUnlock})` });
  }
  if (career.escapesToUnlock > career.runsToUnlock) {
    v.push({ severity: 'error', rule: 'escapes_le_runs', detail: `escapes(${career.escapesToUnlock}) > runs(${career.runsToUnlock})` });
  }
  if (career.unlocked && (career.finalDepth !== ECHO_DEPTH_MAX || career.finalFragments !== FRAGMENT_TOTAL)) {
    v.push({ severity: 'error', rule: 'true_route_condition', detail: `解禁時 depth=${career.finalDepth}(要${ECHO_DEPTH_MAX}) 断片=${career.finalFragments}(要${FRAGMENT_TOTAL})` });
  }
  return v;
};

/** 単発run結果の不変条件を検査する */
export const checkRun = (run: RunResult): Violation[] => {
  const v: Violation[] = [];
  if (run.floorReached < 1 || run.floorReached > CFG.MAX_FLOOR) {
    v.push({ severity: 'error', rule: 'floor_range', detail: `floorReached=${run.floorReached} は 1..${CFG.MAX_FLOOR} 外` });
  }
  if (!KNOWN_CAUSES.has(run.cause)) {
    v.push({ severity: 'error', rule: 'cause_valid', detail: `未知の cause: ${run.cause}` });
  }
  if (run.survived && run.endingId !== null && !ENDING_IDS.has(run.endingId)) {
    v.push({ severity: 'error', rule: 'ending_valid', detail: `未知の endingId: ${run.endingId}` });
  }
  for (const id of run.fragmentsRead) {
    if (!FRAGMENT_IDS.has(id)) {
      v.push({ severity: 'error', rule: 'fragment_valid', detail: `未知の断片ID: ${id}` });
    }
  }
  return v;
};

/** label 降順に rate が単調減少であるべき列を検査する（生還率カーブ） */
export const checkSurvivalMonotonic = (rates: { label: string; rate: number }[]): Violation[] => {
  const v: Violation[] = [];
  for (let i = 1; i < rates.length; i++) {
    if (rates[i].rate > rates[i - 1].rate) {
      v.push({ severity: 'error', rule: 'survival_monotonic', detail: `${rates[i].label}(${rates[i].rate}) > ${rates[i - 1].label}(${rates[i - 1].rate})` });
    }
  }
  return v;
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/invariants.test.ts`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/invariants.ts src/features/labyrinth-echo/__tests__/simulation/invariants.test.ts
git commit -m "$(printf 'feat: 迷宮の残響シミュレーションの不変条件チェッカを追加\n\nキャリア・単発run・生還率単調性の不変条件を検査。実シムで\n違反0件を確認しつつ、故意の不正データを検出できることをテスト。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 5: analysis.ts（集計層）

**Files:**
- Create: `src/features/labyrinth-echo/simulation/analysis.ts`
- Test: `src/features/labyrinth-echo/__tests__/simulation/analysis.test.ts`

**Interfaces:**
- Consumes: `simulateRun`, `simulateCareer`, `CareerResult`, `CAREFUL_POLICY`/`RANDOM_POLICY`/`LORE_POLICY`, `checkCareer`/`checkRun`/`checkSurvivalMonotonic`/`Violation`, `DIFFICULTY`, `LEGACIES`, `getLegacyById`, `computeFx`, `SeededRandomSource`, `EV`/`ECHO_EVENTS`/`REVENANT_EVENTS`。
- Produces:
  - `interface SurvivalCell { difficultyId: string; pressure: number; careful: number; random: number; }`
  - `interface SurvivalMatrix { cells: SurvivalCell[]; pressures: number[]; difficultyIds: string[]; }`
  - `interface CareerSummary { label: string; difficultyId: string; policy: string; reachRate: number; runsMedian: number; runsMean: number; escapesMedian: number; deathsMedian: number; sample: CareerResult; }`
  - `interface LegacyAnalysis { unlockTimeline: { legacyId: string; runIndex: number }[]; effects: { legacyId: string; survivalP0: number; survivalP3: number }[]; baselineP0: number; baselineP3: number; }`
  - `interface EndingRow { label: string; counts: Record<string, number>; total: number; }`
  - `interface EndingDistribution { rows: EndingRow[]; endingIds: string[]; }`
  - `const aggregateAll: (cfg: { seeds: number; careers: number; maxRuns: number }) => { survival: SurvivalMatrix; careers: CareerSummary[]; legacies: LegacyAnalysis; endings: EndingDistribution; violations: Violation[]; }`
  - ヘルパ `median`, `mean`（export 不要、内部）

- [ ] **Step 1: 失敗するテストを書く**

`analysis.test.ts`:

```typescript
import { aggregateAll } from '../../simulation/analysis';

describe('aggregateAll', () => {
  // 小さめ設定で高速化
  const result = aggregateAll({ seeds: 40, careers: 20, maxRuns: 60 });

  it('生還率行列: easy>=normal>=hard>=abyss（圧0・careful）', () => {
    const p0 = result.survival.cells.filter(c => c.pressure === 0);
    const get = (id: string) => p0.find(c => c.difficultyId === id)!.careful;
    expect(get('easy')).toBeGreaterThanOrEqual(get('normal'));
    expect(get('normal')).toBeGreaterThanOrEqual(get('hard'));
    expect(get('hard')).toBeGreaterThanOrEqual(get('abyss'));
  });

  it('生還率は 0..1 の範囲', () => {
    for (const c of result.survival.cells) {
      expect(c.careful).toBeGreaterThanOrEqual(0);
      expect(c.careful).toBeLessThanOrEqual(1);
      expect(c.random).toBeGreaterThanOrEqual(0);
      expect(c.random).toBeLessThanOrEqual(1);
    }
  });

  it('キャリアサマリーが条件分あり、reachRate は 0..1', () => {
    expect(result.careers.length).toBeGreaterThan(0);
    for (const s of result.careers) {
      expect(s.reachRate).toBeGreaterThanOrEqual(0);
      expect(s.reachRate).toBeLessThanOrEqual(1);
      expect(s.sample.timeline.length).toBeGreaterThan(0);
    }
  });

  it('レガシー分析: effects は5件、baseline を含む', () => {
    expect(result.legacies.effects.length).toBe(5);
    expect(typeof result.legacies.baselineP0).toBe('number');
  });

  it('エンディング分布: 各行の counts 合計が total に一致', () => {
    for (const row of result.endings.rows) {
      const sum = Object.values(row.counts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(row.total);
    }
  });

  it('実シム集計では違反0件', () => {
    expect(result.violations).toEqual([]);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/analysis.test.ts`
Expected: FAIL（`analysis` が存在しない）

- [ ] **Step 3: 最小実装**

`analysis.ts`:

```typescript
/**
 * 迷宮の残響 - シミュレーション集計層
 *
 * 単発生還率・周回キャリア・継承分析・END分布を plain data に集計する純粋関数群。
 * Jest（数値アサート）と HTML レポートが同じ集計を共有する（数値ソースの単一化）。
 * 決定論: 全シードは引数で与えられた固定値から導出する。
 */
import { simulateRun } from './run-simulator';
import { simulateCareer } from './career-simulator';
import type { CareerResult } from './career-simulator';
import { CAREFUL_POLICY, RANDOM_POLICY, LORE_POLICY } from './policies';
import type { RunPolicy } from './run-simulator';
import { checkCareer, checkRun, checkSurvivalMonotonic } from './invariants';
import type { Violation } from './invariants';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { LEGACIES } from '../domain/constants/legacy-defs';
import { computeFx } from '../domain/services/unlock-service';
import { SeededRandomSource } from '../domain/events/random';
import { EV } from '../events/event-data';
import { ECHO_EVENTS } from '../events/echo-events';
import { REVENANT_EVENTS } from '../events/revenant-events';
import type { EchoLegacy } from '../domain/models/echo';

const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const BASE_FX = computeFx([]);
const DIFFICULTY_IDS = ['easy', 'normal', 'hard', 'abyss'];
const PRESSURES = [0, 1, 2, 3, 4, 5, 6];
const d = (id: string) => DIFFICULTY.find(x => x.id === id)!;

const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export interface SurvivalCell { difficultyId: string; pressure: number; careful: number; random: number; }
export interface SurvivalMatrix { cells: SurvivalCell[]; pressures: number[]; difficultyIds: string[]; }
export interface CareerSummary { label: string; difficultyId: string; policy: string; reachRate: number; runsMedian: number; runsMean: number; escapesMedian: number; deathsMedian: number; sample: CareerResult; }
export interface LegacyAnalysis { unlockTimeline: { legacyId: string; runIndex: number }[]; effects: { legacyId: string; survivalP0: number; survivalP3: number }[]; baselineP0: number; baselineP3: number; }
export interface EndingRow { label: string; counts: Record<string, number>; total: number; }
export interface EndingDistribution { rows: EndingRow[]; endingIds: string[]; }

/** 指定条件の生還率（0..1）を seeds 件で算出 */
const survivalRate = (difficultyId: string, pressure: number, policy: RunPolicy, seeds: number, legacy: EchoLegacy | null = null): number => {
  let survived = 0;
  for (let s = 1; s <= seeds; s++) {
    const r = simulateRun({ difficulty: d(difficultyId), fx: BASE_FX, rng: new SeededRandomSource(s), policy, events: EVENTS, pressure, legacy });
    if (r.survived) survived++;
  }
  return survived / seeds;
};

/** ① 単発生還率行列 */
const buildSurvival = (seeds: number): SurvivalMatrix => {
  const cells: SurvivalCell[] = [];
  for (const id of DIFFICULTY_IDS) {
    for (const p of PRESSURES) {
      cells.push({ difficultyId: id, pressure: p, careful: survivalRate(id, p, CAREFUL_POLICY, seeds), random: survivalRate(id, p, RANDOM_POLICY, seeds) });
    }
  }
  return { cells, pressures: PRESSURES, difficultyIds: DIFFICULTY_IDS };
};

/** ② 周回キャリアサマリー（条件別） */
const CAREER_CONDS: { label: string; difficultyId: string; policyName: string; policy: RunPolicy }[] = [
  { label: 'easy × careful', difficultyId: 'easy', policyName: 'careful', policy: CAREFUL_POLICY },
  { label: 'easy × lorehunter', difficultyId: 'easy', policyName: 'lorehunter', policy: LORE_POLICY },
  { label: 'normal × careful', difficultyId: 'normal', policyName: 'careful', policy: CAREFUL_POLICY },
  { label: 'normal × lorehunter', difficultyId: 'normal', policyName: 'lorehunter', policy: LORE_POLICY },
];

const buildCareers = (careers: number, maxRuns: number): { summaries: CareerSummary[]; all: CareerResult[] } => {
  const summaries: CareerSummary[] = [];
  const all: CareerResult[] = [];
  for (const cond of CAREER_CONDS) {
    const results = Array.from({ length: careers }, (_, i) => simulateCareer({ difficulty: d(cond.difficultyId), fx: BASE_FX, policy: cond.policy, events: EVENTS, careerSeed: i + 1, maxRuns }));
    all.push(...results);
    const unlocked = results.filter(r => r.unlocked);
    summaries.push({
      label: cond.label, difficultyId: cond.difficultyId, policy: cond.policyName,
      reachRate: unlocked.length / careers,
      runsMedian: median(unlocked.map(r => r.runsToUnlock)),
      runsMean: mean(unlocked.map(r => r.runsToUnlock)),
      escapesMedian: median(unlocked.map(r => r.escapesToUnlock)),
      deathsMedian: median(unlocked.map(r => r.deathsToUnlock)),
      sample: results[0],
    });
  }
  return { summaries, all };
};

/** ③ 継承分析（取得タイミングは easy×lorehunter の代表キャリア、効果は各レガシーの生還率） */
const buildLegacies = (seeds: number, maxRuns: number): LegacyAnalysis => {
  const sample = simulateCareer({ difficulty: d('easy'), fx: BASE_FX, policy: LORE_POLICY, events: EVENTS, careerSeed: 1, maxRuns });
  const effects = LEGACIES.map(l => ({
    legacyId: l.id,
    survivalP0: survivalRate('normal', 0, CAREFUL_POLICY, seeds, l),
    survivalP3: survivalRate('normal', 3, CAREFUL_POLICY, seeds, l),
  }));
  return {
    unlockTimeline: sample.legacyUnlocks.map(u => ({ legacyId: u.legacyId, runIndex: u.runIndex })),
    effects,
    baselineP0: survivalRate('normal', 0, CAREFUL_POLICY, seeds),
    baselineP3: survivalRate('normal', 3, CAREFUL_POLICY, seeds),
  };
};

/** ④ エンディング到達分布（脱出時の endingId を条件別に集計） */
const ENDING_CONDS: { label: string; difficultyId: string; pressure: number }[] = [
  { label: 'easy 圧0', difficultyId: 'easy', pressure: 0 },
  { label: 'normal 圧0', difficultyId: 'normal', pressure: 0 },
  { label: 'normal 圧3', difficultyId: 'normal', pressure: 3 },
  { label: 'hard 圧0', difficultyId: 'hard', pressure: 0 },
];

const buildEndings = (seeds: number): EndingDistribution => {
  const idSet = new Set<string>();
  const rows: EndingRow[] = ENDING_CONDS.map(cond => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (let s = 1; s <= seeds; s++) {
      const r = simulateRun({ difficulty: d(cond.difficultyId), fx: BASE_FX, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure: cond.pressure });
      if (r.survived && r.endingId) {
        counts[r.endingId] = (counts[r.endingId] ?? 0) + 1;
        idSet.add(r.endingId);
        total++;
      }
    }
    return { label: cond.label, counts, total };
  });
  return { rows, endingIds: [...idSet].sort() };
};

/** 全シムを実行し集計と違反を返す */
export const aggregateAll = (cfg: { seeds: number; careers: number; maxRuns: number }): {
  survival: SurvivalMatrix; careers: CareerSummary[]; legacies: LegacyAnalysis; endings: EndingDistribution; violations: Violation[];
} => {
  const survival = buildSurvival(cfg.seeds);
  const { summaries, all } = buildCareers(cfg.careers, cfg.maxRuns);
  const legacies = buildLegacies(cfg.seeds, cfg.maxRuns);
  const endings = buildEndings(cfg.seeds);

  // 不変条件: 全キャリア + 生還率の難易度単調性（圧0 careful）
  const violations: Violation[] = [];
  for (const c of all) violations.push(...checkCareer(c));
  const p0 = survival.cells.filter(c => c.pressure === 0).map(c => ({ label: c.difficultyId, rate: c.careful }));
  violations.push(...checkSurvivalMonotonic(p0));
  // 代表 run の健全性（各難易度1本ずつ checkRun）
  for (const id of DIFFICULTY_IDS) {
    const r = simulateRun({ difficulty: d(id), fx: BASE_FX, rng: new SeededRandomSource(1), policy: CAREFUL_POLICY, events: EVENTS });
    violations.push(...checkRun(r));
  }
  return { survival, careers: summaries, legacies, endings, violations };
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/analysis.test.ts`
Expected: PASS（全件）。実行が重い場合も小設定（seeds40/careers20/maxRuns60）で許容範囲。

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/analysis.ts src/features/labyrinth-echo/__tests__/simulation/analysis.test.ts
git commit -m "$(printf 'feat: 迷宮の残響シミュレーションの集計層を追加\n\n単発生還率行列・周回キャリア・継承分析・END分布を plain data に\n集計し、不変条件違反も同時に収集。Jestとレポートで数値を共有。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 6: report/render-html.ts（HTML レンダラ）

**Files:**
- Create: `src/features/labyrinth-echo/simulation/report/render-html.ts`
- Test: `src/features/labyrinth-echo/__tests__/simulation/render-html.test.ts`

**Interfaces:**
- Consumes: `SurvivalMatrix`, `CareerSummary`, `LegacyAnalysis`, `EndingDistribution`, `Violation`（analysis/invariants の型）。
- Produces:
  - `interface ReportData { generatedAt: string; survival: SurvivalMatrix; careers: CareerSummary[]; legacies: LegacyAnalysis; endings: EndingDistribution; violations: Violation[]; config: { careers: number; seeds: number; maxRuns: number }; }`
  - `const renderHtml: (data: ReportData) => string`（自己完結HTML文字列。インラインCSS、div幅%/inline SVGで描画）

- [ ] **Step 1: 失敗するテストを書く**

`render-html.test.ts`:

```typescript
import { renderHtml } from '../../simulation/report/render-html';
import type { ReportData } from '../../simulation/report/render-html';

const data: ReportData = {
  generatedAt: '2026-06-29T00:00:00.000Z',
  survival: { cells: [{ difficultyId: 'easy', pressure: 0, careful: 1, random: 0.66 }], pressures: [0], difficultyIds: ['easy'] },
  careers: [{ label: 'easy × careful', difficultyId: 'easy', policy: 'careful', reachRate: 1, runsMedian: 19, runsMean: 19, escapesMedian: 19, deathsMedian: 0, sample: { unlocked: true, runsToUnlock: 19, escapesToUnlock: 19, deathsToUnlock: 0, finalDepth: 6, finalFragments: 19, timeline: [{ runIndex: 1, survived: true, cause: 'escape', floorReached: 5, depth: 1, fragmentCount: 1, fragsReadThisRun: 0, safetyNetGranted: true }], legacyUnlocks: [{ runIndex: 4, legacyId: 'lg_lian' }] } }],
  legacies: { unlockTimeline: [{ legacyId: 'lg_lian', runIndex: 4 }], effects: [{ legacyId: 'lg_lian', survivalP0: 0.87, survivalP3: 0.6 }], baselineP0: 0.81, baselineP3: 0.47 },
  endings: { rows: [{ label: 'easy 圧0', counts: { perfect: 30, scholar: 10 }, total: 40 }], endingIds: ['perfect', 'scholar'] },
  violations: [],
  config: { careers: 20, seeds: 40, maxRuns: 60 },
};

describe('renderHtml', () => {
  it('自己完結HTML（<html>と<style>を含む）を返す', () => {
    const html = renderHtml(data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<style>');
    expect(html).toContain('迷宮の残響');
  });

  it('主要数値が埋め込まれる（中央値19・到達率）', () => {
    const html = renderHtml(data);
    expect(html).toContain('19');
    expect(html).toContain('easy × careful');
  });

  it('違反0件なら「異常なし」、ありなら詳細を表示', () => {
    expect(renderHtml(data)).toContain('異常なし');
    const withV = renderHtml({ ...data, violations: [{ severity: 'error', rule: 'depth_max', detail: 'run 1: depth 7 > 6' }] });
    expect(withV).toContain('depth_max');
    expect(withV).toContain('run 1: depth 7 &gt; 6'); // HTMLエスケープ確認
  });

  it('generatedAt が表示される', () => {
    expect(renderHtml(data)).toContain('2026-06-29');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/render-html.test.ts`
Expected: FAIL（`render-html` が存在しない）

- [ ] **Step 3: 最小実装**

`report/render-html.ts`（相対 import は `../../` の2階層に収める）:

```typescript
/**
 * 迷宮の残響 - シミュレーションレポート HTML レンダラ
 *
 * ReportData を自己完結HTML文字列に変換する純粋関数。副作用なし（fs/日時に非依存）。
 * チャートは div 幅% / inline SVG で描画し外部依存を持たない。
 */
import type { SurvivalMatrix, CareerSummary, LegacyAnalysis, EndingDistribution } from '../analysis';
import type { Violation } from '../invariants';

/** レポート1枚分のデータ */
export interface ReportData {
  generatedAt: string;
  survival: SurvivalMatrix;
  careers: CareerSummary[];
  legacies: LegacyAnalysis;
  endings: EndingDistribution;
  violations: Violation[];
  config: { careers: number; seeds: number; maxRuns: number };
}

/** HTML 特殊文字をエスケープする（内部データのみだが安全側に倒す） */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pct = (x: number): string => (x * 100).toFixed(1) + '%';

/** 横棒（div幅%）。0..1 を受け取る */
const bar = (ratio: number, color: string): string =>
  `<div class="bar"><div class="bar-fill" style="width:${Math.round(ratio * 100)}%;background:${color}"></div></div>`;

const renderSurvival = (m: SurvivalMatrix): string => {
  const head = `<tr><th>難易度＼圧</th>${m.pressures.map(p => `<th>圧${p}</th>`).join('')}</tr>`;
  const rows = m.difficultyIds.map(id => {
    const tds = m.pressures.map(p => {
      const cell = m.cells.find(c => c.difficultyId === id && c.pressure === p)!;
      // 生還率を色相で表現（高=緑, 低=赤）
      const hue = Math.round(cell.careful * 120);
      return `<td style="background:hsl(${hue},60%,28%)">${pct(cell.careful)}</td>`;
    }).join('');
    return `<tr><th>${esc(id)}</th>${tds}</tr>`;
  }).join('');
  return `<table class="heat">${head}${rows}</table>`;
};

const renderCareers = (cs: CareerSummary[]): string => {
  const rows = cs.map(s => `<tr>
    <td>${esc(s.label)}</td><td>${pct(s.reachRate)}</td>
    <td>${s.runsMedian}</td><td>${s.runsMean.toFixed(1)}</td>
    <td>${s.escapesMedian}</td><td>${s.deathsMedian}</td></tr>`).join('');
  // 代表キャリア（先頭条件のsample）の depth/断片 推移
  const sample = cs[0]?.sample;
  const timeline = sample ? sample.timeline.map(st =>
    `<tr><td>${st.runIndex}</td><td>${st.depth}</td><td>${st.fragmentCount}/19</td>
     <td>${st.survived ? '脱出' : '死亡(' + esc(st.cause) + ')'}</td>
     <td>${bar(st.fragmentCount / 19, '#60a5fa')}</td></tr>`).join('') : '';
  return `<table><tr><th>条件</th><th>解禁率</th><th>総周回(中央)</th><th>平均</th><th>脱出(中央)</th><th>死亡(中央)</th></tr>${rows}</table>
    <h3>代表キャリア（${esc(cs[0]?.label ?? '')}）の進行</h3>
    <table><tr><th>周</th><th>depth</th><th>断片</th><th>結果</th><th>断片進捗</th></tr>${timeline}</table>`;
};

const renderLegacies = (l: LegacyAnalysis): string => {
  const timeline = l.unlockTimeline.map(u => `<tr><td>${esc(u.legacyId)}</td><td>${u.runIndex}周目</td></tr>`).join('');
  const effects = l.effects.map(e => `<tr>
    <td>${esc(e.legacyId)}</td>
    <td>${pct(e.survivalP0)} ${bar(e.survivalP0, '#34d399')}</td>
    <td>${pct(e.survivalP3)} ${bar(e.survivalP3, '#fbbf24')}</td></tr>`).join('');
  return `<h3>取得タイミング（easy×lorehunter 代表キャリア）</h3>
    <table><tr><th>レガシー</th><th>解禁周</th></tr>${timeline}</table>
    <h3>各レガシーの生還率（normal careful）</h3>
    <p>継承なし baseline: 圧0 ${pct(l.baselineP0)} / 圧3 ${pct(l.baselineP3)}</p>
    <table><tr><th>レガシー</th><th>圧0</th><th>圧3</th></tr>${effects}</table>`;
};

const renderEndings = (e: EndingDistribution): string => {
  const head = `<tr><th>条件</th>${e.endingIds.map(id => `<th>${esc(id)}</th>`).join('')}<th>計</th></tr>`;
  const rows = e.rows.map(row => {
    const tds = e.endingIds.map(id => {
      const n = row.counts[id] ?? 0;
      return `<td>${n ? pct(n / row.total) : '-'}</td>`;
    }).join('');
    return `<tr><th>${esc(row.label)}</th>${tds}<td>${row.total}</td></tr>`;
  }).join('');
  return `<table>${head}${rows}</table>`;
};

const renderViolations = (vs: Violation[]): string => {
  if (!vs.length) return `<p class="ok">✓ 異常なし（不変条件 全クリア）</p>`;
  const rows = vs.map(v => `<tr><td>${esc(v.severity)}</td><td>${esc(v.rule)}</td><td>${esc(v.detail)}</td></tr>`).join('');
  return `<p class="ng">⚠ ${vs.length} 件の不変条件違反を検出</p>
    <table><tr><th>重大度</th><th>ルール</th><th>詳細</th></tr>${rows}</table>`;
};

/** ReportData を自己完結HTML文字列に変換する */
export const renderHtml = (data: ReportData): string => {
  const summaryBadge = data.violations.length
    ? `<span class="badge ng">違反 ${data.violations.length}</span>`
    : `<span class="badge ok">✓ 異常なし</span>`;
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>迷宮の残響 シミュレーションレポート</title>
<style>
  body{background:#0f0f17;color:#e5e7eb;font-family:system-ui,sans-serif;margin:0;padding:24px;line-height:1.6}
  h1{color:#a5b4fc} h2{color:#818cf8;border-bottom:1px solid #312e81;padding-bottom:4px;margin-top:32px}
  h3{color:#c4b5fd;margin-top:20px}
  table{border-collapse:collapse;margin:12px 0;font-size:14px} th,td{border:1px solid #312e81;padding:4px 10px;text-align:center}
  th{background:#1e1b4b} .heat td{font-weight:bold;color:#fff}
  .bar{display:inline-block;width:80px;height:10px;background:#1f2937;border-radius:4px;overflow:hidden;vertical-align:middle}
  .bar-fill{height:100%}
  .badge{padding:2px 10px;border-radius:12px;font-weight:bold} .ok{color:#34d399} .ng{color:#f87171}
  .badge.ok{background:#064e3b} .badge.ng{background:#7f1d1d;color:#fecaca}
  .meta{color:#9ca3af;font-size:13px}
</style></head>
<body>
  <h1>迷宮の残響 — シミュレーションレポート</h1>
  <p class="meta">生成日時: ${esc(data.generatedAt)} ｜ 設定: careers=${data.config.careers}, seeds=${data.config.seeds}, maxRuns=${data.config.maxRuns} ｜ ${summaryBadge}</p>

  <h2>① 単発run 生還率カーブ（難易度×残響圧 / careful）</h2>
  ${renderSurvival(data.survival)}

  <h2>② 周回（キャリア）進行 — 真ルート解禁まで</h2>
  ${renderCareers(data.careers)}

  <h2>③ 継承（レガシー）分析</h2>
  ${renderLegacies(data.legacies)}

  <h2>④ エンディング到達分布</h2>
  ${renderEndings(data.endings)}

  <h2>⚠ 検出した異常</h2>
  ${renderViolations(data.violations)}
</body></html>`;
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/render-html.test.ts`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/simulation/report/render-html.ts src/features/labyrinth-echo/__tests__/simulation/render-html.test.ts
git commit -m "$(printf 'feat: 迷宮の残響シミュレーションレポートのHTMLレンダラを追加\n\nReportData を自己完結HTMLに変換する純粋関数。インラインCSSと\ndiv/SVGで描画し依存ゼロ。HTMLエスケープ込み。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 7: report-data.ts + generate-report.ts + npm スクリプト + gitignore

**Files:**
- Create: `src/features/labyrinth-echo/simulation/report/report-data.ts`
- Create: `src/features/labyrinth-echo/simulation/report/generate-report.ts`
- Modify: `package.json`（scripts に `sim:labyrinth-echo`）
- Modify: `.gitignore`（`reports/` 追加）

**Interfaces:**
- Consumes: `aggregateAll`（analysis）, `renderHtml`/`ReportData`（render-html）。
- Produces:
  - `report-data.ts`: `const buildReportData: (cfg: { seeds: number; careers: number; maxRuns: number }, generatedAt: string) => ReportData`（純粋: aggregateAll の結果に generatedAt/config を載せるだけ）
  - `generate-report.ts`: CLI エントリ（副作用: 日時生成・fs書き込み・パス表示）

- [ ] **Step 1: report-data.ts を作成（テスト先行）**

Test: `src/features/labyrinth-echo/__tests__/simulation/report-data.test.ts`

```typescript
import { buildReportData } from '../../simulation/report/report-data';

describe('buildReportData', () => {
  it('generatedAt と config を載せ、4軸＋violations を持つ ReportData を返す', () => {
    const data = buildReportData({ seeds: 30, careers: 10, maxRuns: 50 }, '2026-06-29T00:00:00.000Z');
    expect(data.generatedAt).toBe('2026-06-29T00:00:00.000Z');
    expect(data.config).toEqual({ seeds: 30, careers: 10, maxRuns: 50 });
    expect(data.survival.cells.length).toBeGreaterThan(0);
    expect(data.careers.length).toBeGreaterThan(0);
    expect(data.legacies.effects.length).toBe(5);
    expect(data.endings.rows.length).toBeGreaterThan(0);
    expect(Array.isArray(data.violations)).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/report-data.test.ts`
Expected: FAIL（`report-data` が存在しない）

- [ ] **Step 3: report-data.ts を実装**

```typescript
/**
 * 迷宮の残響 - レポートデータ構築
 *
 * aggregateAll の集計結果に generatedAt/config を載せ、ReportData を組み立てる純粋関数。
 * 時刻は引数で注入する（決定論維持: Date.now を内部で呼ばない）。
 */
import { aggregateAll } from '../analysis';
import type { ReportData } from './render-html';

/** 集計を実行し ReportData を構築する（generatedAt は呼び出し側が注入） */
export const buildReportData = (cfg: { seeds: number; careers: number; maxRuns: number }, generatedAt: string): ReportData => {
  const agg = aggregateAll(cfg);
  return { generatedAt, ...agg, config: cfg };
};
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation/report-data.test.ts`
Expected: PASS

- [ ] **Step 5: generate-report.ts を実装（CLIエントリ・副作用）**

```typescript
/**
 * 迷宮の残響 - シミュレーションレポート生成 CLI
 *
 * 集計→HTML化→ファイル書き込みを行う唯一の副作用境界。
 * 実行: npm run sim:labyrinth-echo
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { buildReportData } from './report-data';
import { renderHtml } from './render-html';

/** レポート設定（重すぎない既定値。必要なら環境変数で調整） */
const CFG = {
  seeds: Number(process.env.SIM_SEEDS ?? 200),
  careers: Number(process.env.SIM_CAREERS ?? 100),
  maxRuns: Number(process.env.SIM_MAX_RUNS ?? 120),
};

const main = (): void => {
  const generatedAt = new Date().toISOString();
  const datePart = generatedAt.slice(0, 10);
  const data = buildReportData(CFG, generatedAt);
  const html = renderHtml(data);

  const outDir = resolve(process.cwd(), 'reports');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `labyrinth-echo-sim-${datePart}.html`);
  writeFileSync(outPath, html, 'utf-8');

  const errors = data.violations.filter(v => v.severity === 'error').length;
  console.log(`レポートを生成しました: ${outPath}`);
  console.log(`不変条件違反: ${data.violations.length} 件（error: ${errors}）`);
  if (errors > 0) process.exitCode = 1; // CIで異常検知できるよう非0終了
};

main();
```

- [ ] **Step 6: package.json に npm スクリプトを追加**

`scripts` に追記（ts-node の module 設定を含める）:

```json
    "sim:labyrinth-echo": "TS_NODE_COMPILER_OPTIONS='{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}' ts-node --transpile-only src/features/labyrinth-echo/simulation/report/generate-report.ts",
```

- [ ] **Step 7: .gitignore に reports/ を追加**

`.gitignore` の末尾に追記:

```
# シミュレーションレポート出力（開発支援ツール）
reports/
```

- [ ] **Step 8: 実際にレポートを生成して動作確認**

Run: `SIM_SEEDS=40 SIM_CAREERS=15 SIM_MAX_RUNS=60 npm run sim:labyrinth-echo`
Expected: `reports/labyrinth-echo-sim-<日付>.html` が生成され、「不変条件違反: 0 件」と表示。生成HTMLをブラウザで開いて4軸＋警告欄が表示されることを目視。

- [ ] **Step 9: コミット**

```bash
git add src/features/labyrinth-echo/simulation/report/report-data.ts src/features/labyrinth-echo/simulation/report/generate-report.ts src/features/labyrinth-echo/__tests__/simulation/report-data.test.ts package.json .gitignore
git commit -m "$(printf 'feat: 迷宮の残響シミュレーションレポートのCLIと生成を追加\n\nbuildReportData(純粋)とgenerate-report(副作用境界)を分離。\nnpm run sim:labyrinth-echo でHTML出力。reports/ はgitignore。\nerror違反時は非0終了でCI検知可能。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

### Task 8: 検証ループ（lint / typecheck / test）と最終確認

**Files:** なし（検証のみ。必要に応じて軽微修正）

- [ ] **Step 1: typecheck**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 2: lint（警告ゼロ強制）**

Run: `npx eslint src/features/labyrinth-echo/simulation --max-warnings=0`
Expected: exit 0

- [ ] **Step 3: simulation テスト全実行**

Run: `npx jest src/features/labyrinth-echo/__tests__/simulation`
Expected: 全 PASS（run-simulator / policies / career-simulator / invariants / analysis / render-html / report-data / balance-contract）

- [ ] **Step 4: feature 全体テスト（回帰確認）**

Run: `npx jest src/features/labyrinth-echo`
Expected: 全 PASS（既存テストへの影響なし）

- [ ] **Step 5: レポート再生成して目視（既定設定）**

Run: `npm run sim:labyrinth-echo`
Expected: 違反0件・HTML生成。ブラウザで開いて① heatmap ② 周回表＋代表キャリア ③ レガシー取得タイミング＋効果 ④ END分布 ⑤ 異常なし、を確認。

- [ ] **Step 6: 必要なら微修正をコミット**

```bash
git add -A
git commit -m "$(printf 'chore: 迷宮の残響シミュレーションレポートの検証ループ対応\n\nlint/typecheck/test の指摘を反映。\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>')"
```

---

## Self-Review 結果

**1. Spec coverage:**
- HTMLレポート生成 → Task 6/7 ✓
- 4軸（生還率/周回/継承/END分布） → Task 5（集計）+ Task 6（描画）✓
- 継承の取得方法考慮 → Task 3（legacyUnlocks）+ Task 5（buildLegacies の unlockTimeline）✓
- 不変条件チェック（CI＋レポート両方） → Task 4（チェッカ）+ Task 5（aggregateで収集）+ Task 6（警告欄）+ generate-report の非0終了 ✓
- 故意の不正データで検出器テスト → Task 4 ✓
- 依存追加なし・reports gitignore・決定論・副作用隔離 → Global Constraints + Task 6/7 ✓
- ts-node module 設定 → Task 7 Step 6 ✓

**2. Placeholder scan:** プレースホルダなし。全ステップに実コード/実コマンド記載。

**3. Type consistency:** `RunResult.fragmentsRead`（T1）→ career の `res.fragmentsRead`（T3）一致。`CareerResult`/`CareerStep`（T3）→ invariants（T4）→ analysis（T5）一致。`ReportData`（T6）→ report-data（T7）一致。`Violation`（T4）→ analysis/render（T5/6）一致。`aggregateAll` 戻り値の分解（survival/careers/legacies/endings/violations）が buildReportData のスプレッドと一致 ✓。
