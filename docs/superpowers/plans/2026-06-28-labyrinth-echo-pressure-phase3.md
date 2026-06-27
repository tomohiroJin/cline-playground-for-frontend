# 迷宮の残響 NG+残響エスカレーション（Phase 3）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 選択式の周回難易度「残響圧（Echo Pressure）」を導入し、圧を上げるほど迷宮が手強く化け、発見済みの先人が敵性「残響の亡霊」として襲来する。高圧クリアに KP・称号の報酬を与え、周回の動機を作る。

**Architecture:** 圧を `applyPressureToDifficulty(diff, pressure)` で「実効難易度」に畳むことで戦闘系のシグネチャを不変に保つ。圧の生値は selectDiff・pickEvent ゲート・報酬・進捗だけが参照。亡霊は既存の Choice/Outcome 構造の特殊イベント（`tp:"revenant"`、二重ゲート: 圧≥minPressure かつ先人発見済み）。Phase 2 のヘッドレス・シミュレータを圧対応に拡張し、圧0＝Phase 2 一致（回帰）＋圧の単調性を契約テスト化。

**Tech Stack:** React 19 + TypeScript / Jest 30 + SWC / 既存 `SeededRandomSource`（決定論）/ 純粋ドメイン関数。

## Global Constraints

- 言語: コメント/UIテキストは日本語、変数/関数名は英語。`any` 禁止（`unknown`+型ガード）。`var` 禁止・`const` 優先。`null` より `undefined`（ただし既存モデルが `string | null` を使う箇所はその慣習に合わせる）。
- マジックナンバーは名前付き定数。定数は `Object.freeze`。名前付きエクスポート。ファイル名 kebab-case。`dangerouslySetInnerHTML` 禁止。リスト key は安定一意値。
- 依存方向: `domain/` は外部依存なし。`simulation/`・`events/` は feature root で domain/events を参照可（domain からは参照しない）。
- 決定論: simulator・テストで `Date.now()`/`Math.random()` を使わない（`SeededRandomSource` 注入）。
- TDD（RED→GREEN）。カバレッジ: 新規 80%+、ドメイン 90%+。
- テスト実行: `npx jest <path>`。型: `npm run typecheck`。リント: `npm run lint`。フル: `npm run ci`。
- 数値設計値（verbatim）:
  - `PRESSURE_MAX = ECHO_DEPTH_MAX`（=6）
  - escalation/level: `DMG_MULT_PER_LEVEL = 0.08`、drainMod = `-floor(pressure/2)`、hpMod=mnMod = `-floor(pressure/2)*2`、dmgMult増分 = `DMG_MULT_PER_LEVEL * pressure`
  - 圧0で escalation 全項目0（applyPressure は diff を不変返し）
  - KPボーナス: `round(kpOnWin × selectedPressure × 0.25) + revenantsThisRun`
  - 亡霊 minPressure: p_lian 2 / p_twins 2 / p_galen 3 / p_elna 4 / p_first 5
  - 称号: 残響に抗う者(`maxPressureCleared>=3`) / 残響を統べる者(`>=6`) / 亡霊狩り(`revenantsDefeated.length===5`)

base dir（以降の相対パスの起点）: `src/features/labyrinth-echo/`

---

### Task 1: MetaState に maxPressureCleared / revenantsDefeated を追加

`mergeWithDefaults` が `Object.keys(FRESH_META)` を走査するため、`FRESH_META` への追加だけで旧セーブは自動補完される。

**Files:**
- Modify: `domain/models/meta-state.ts`
- Test: `__tests__/presentation/hooks/migrate-meta-state.test.ts`（追記）

**Interfaces:**
- Produces: `MetaState.maxPressureCleared: number`, `MetaState.revenantsDefeated: readonly string[]`, `FRESH_META` に `maxPressureCleared: 0, revenantsDefeated: []`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/migrate-meta-state.test.ts` に追記:

```ts
describe('maxPressureCleared / revenantsDefeated マイグレーション', () => {
  it('未保持の旧セーブはデフォルト補完される', () => {
    const merged = mergeWithDefaults({ runs: 2 });
    expect(merged.maxPressureCleared).toBe(0);
    expect(merged.revenantsDefeated).toEqual([]);
  });
  it('保存済み値は保持される', () => {
    const merged = mergeWithDefaults({ maxPressureCleared: 4, revenantsDefeated: ['p_lian'] });
    expect(merged.maxPressureCleared).toBe(4);
    expect(merged.revenantsDefeated).toEqual(['p_lian']);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest migrate-meta-state -t maxPressureCleared`
Expected: FAIL（`undefined`）

- [ ] **Step 3: MetaState と FRESH_META を更新**

`domain/models/meta-state.ts` の `MetaState` に追加（`fragments` の後）:

```ts
  readonly fragments: readonly string[];
  /** 生還で踏破した最高残響圧 */
  readonly maxPressureCleared: number;
  /** 撃破した先人の残響（亡霊）ID */
  readonly revenantsDefeated: readonly string[];
}
```

`FRESH_META` に追加（`fragments: []` の後）:

```ts
  fragments: [],
  maxPressureCleared: 0,
  revenantsDefeated: [],
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest migrate-meta-state`
Expected: PASS

- [ ] **Step 5: 型チェック**

Run: `npm run typecheck`
Expected: エラーなし（`createMetaState` は Partial 上書きのため既存呼び出し影響なし）

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/domain/models/meta-state.ts src/features/labyrinth-echo/__tests__/presentation/hooks/migrate-meta-state.test.ts
git commit -m "feat: 迷宮の残響 MetaState に maxPressureCleared/revenantsDefeated を追加"
```

---

### Task 2: escalation-defs と pressure-service（純粋）

**Files:**
- Create: `domain/constants/escalation-defs.ts`
- Create: `domain/services/pressure-service.ts`
- Test: `__tests__/domain/services/pressure-service.test.ts`

**Interfaces:**
- Consumes: `ECHO_DEPTH_MAX`（`domain/services/echo-service`）, `DifficultyDef`/`DifficultyModifiers`（`domain/models/difficulty`）, `clamp`（`../../../../utils/math-utils`）。
- Produces:
  - `PRESSURE_MAX: number`, `DMG_MULT_PER_LEVEL: number`
  - `escalationFromPressure(pressure: number): DifficultyModifiers`
  - `applyPressureToDifficulty(diff: DifficultyDef, pressure: number): DifficultyDef`
  - `maxSelectablePressure(echoDepth: number): number`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/services/pressure-service.test.ts`:

```ts
import {
  PRESSURE_MAX, escalationFromPressure, applyPressureToDifficulty, maxSelectablePressure,
} from '../../../domain/services/pressure-service';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';

const normal = DIFFICULTY.find(d => d.id === 'normal')!;

describe('pressure-service', () => {
  it('PRESSURE_MAX は 6', () => {
    expect(PRESSURE_MAX).toBe(6);
  });

  it('圧0は escalation 全項目0', () => {
    expect(escalationFromPressure(0)).toEqual({ hpMod: 0, mnMod: 0, drainMod: 0, dmgMult: 0 });
  });

  it('圧6の escalation は設計値', () => {
    expect(escalationFromPressure(6)).toEqual({ hpMod: -6, mnMod: -6, drainMod: -3, dmgMult: 0.48 });
  });

  it('escalation は圧で単調に厳しくなる', () => {
    for (let p = 1; p <= PRESSURE_MAX; p++) {
      const cur = escalationFromPressure(p);
      const prev = escalationFromPressure(p - 1);
      expect(cur.hpMod).toBeLessThanOrEqual(prev.hpMod);
      expect(cur.drainMod).toBeLessThanOrEqual(prev.drainMod);
      expect(cur.dmgMult).toBeGreaterThanOrEqual(prev.dmgMult);
    }
  });

  it('applyPressureToDifficulty(圧0) は diff を不変返し（回帰ガード）', () => {
    expect(applyPressureToDifficulty(normal, 0)).toEqual(normal);
  });

  it('applyPressureToDifficulty は modifiers のみ変え id/rewards は基底のまま', () => {
    const eff = applyPressureToDifficulty(normal, 6);
    expect(eff.id).toBe('normal');
    expect(eff.rewards).toEqual(normal.rewards);
    expect(eff.modifiers.dmgMult).toBeCloseTo(normal.modifiers.dmgMult + 0.48, 5);
    expect(eff.modifiers.drainMod).toBe(normal.modifiers.drainMod - 3);
    expect(eff.modifiers.hpMod).toBe(normal.modifiers.hpMod - 6);
  });

  it('maxSelectablePressure は echoDepth を 0..PRESSURE_MAX にクランプ', () => {
    expect(maxSelectablePressure(0)).toBe(0);
    expect(maxSelectablePressure(3)).toBe(3);
    expect(maxSelectablePressure(99)).toBe(6);
    expect(maxSelectablePressure(-1)).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest pressure-service`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: escalation-defs.ts を作成**

`domain/constants/escalation-defs.ts`:

```ts
/**
 * 迷宮の残響 - 残響圧エスカレーション定数
 *
 * 残響圧（Echo Pressure）1レベルあたりの難易度増分を定義する。
 */
import { ECHO_DEPTH_MAX } from '../services/echo-service';

/** 選択可能な最大残響圧（echoDepth の上限に一致） */
export const PRESSURE_MAX = ECHO_DEPTH_MAX;

/** 圧1レベルあたりの dmgMult 増分 */
export const DMG_MULT_PER_LEVEL = 0.08;
```

- [ ] **Step 4: pressure-service.ts を作成**

`domain/services/pressure-service.ts`:

```ts
/**
 * 迷宮の残響 - PressureService（残響圧サービス）
 *
 * 残響圧を「実効難易度」に畳む純粋関数群。戦闘系のシグネチャを変えずに
 * 圧によるエスカレーションを難易度の後段として適用する。
 */
import { clamp } from '../../../../utils/math-utils';
import { PRESSURE_MAX, DMG_MULT_PER_LEVEL } from '../constants/escalation-defs';
import type { DifficultyDef, DifficultyModifiers } from '../models/difficulty';

export { PRESSURE_MAX };

/** 残響圧によるエスカレーション増分を求める（圧0なら全項目0） */
export const escalationFromPressure = (pressure: number): DifficultyModifiers => {
  const p = Math.max(0, pressure);
  const halfSteps = Math.floor(p / 2);
  return {
    hpMod: -halfSteps * 2,
    mnMod: -halfSteps * 2,
    drainMod: -halfSteps,
    dmgMult: Number((DMG_MULT_PER_LEVEL * p).toFixed(2)),
  };
};

/**
 * 残響圧を難易度に畳んだ実効難易度を返す。
 * modifiers にエスカレーションを加算する。id/name/rewards 等は基底のまま。
 */
export const applyPressureToDifficulty = (diff: DifficultyDef, pressure: number): DifficultyDef => {
  if (pressure <= 0) return diff;
  const e = escalationFromPressure(pressure);
  return {
    ...diff,
    modifiers: {
      hpMod: diff.modifiers.hpMod + e.hpMod,
      mnMod: diff.modifiers.mnMod + e.mnMod,
      drainMod: diff.modifiers.drainMod + e.drainMod,
      dmgMult: Number((diff.modifiers.dmgMult + e.dmgMult).toFixed(2)),
    },
  };
};

/** echoDepth から選択可能な最大残響圧を求める（0..PRESSURE_MAX にクランプ） */
export const maxSelectablePressure = (echoDepth: number): number =>
  clamp(echoDepth, 0, PRESSURE_MAX);
```

注: `escalationFromPressure(6).dmgMult` は `Number((0.08*6).toFixed(2)) = 0.48`。テストの `toEqual` と一致させるため `toFixed(2)` で丸める。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest pressure-service`
Expected: PASS（全件）

- [ ] **Step 6: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/domain/constants/escalation-defs.ts src/features/labyrinth-echo/domain/services/pressure-service.ts src/features/labyrinth-echo/__tests__/domain/services/pressure-service.test.ts
git commit -m "feat: 迷宮の残響 残響圧エスカレーションの純粋関数を追加"
```

---

### Task 3: revenant イベント種別と pickEvent の圧ゲート

**Files:**
- Modify: `domain/constants/event-type-defs.ts`
- Modify: `events/event-utils.ts`（`GameEvent` に `minPressure?`、`pickEvent` に `pressure`）
- Modify: `domain/events/game-event.ts`（`GameEvent` に `minPressure?`）
- Modify: `domain/events/event-selector.ts`（`pickEvent` に `pressure`）
- Test: `__tests__/events/pressure-gate.test.ts`

**Interfaces:**
- Produces: `EVENT_TYPE.revenant`; `GameEvent.minPressure?: number`; `pickEvent({..., pressure?: number})` が `!e.minPressure || pressure >= e.minPressure` でフィルタ。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/events/pressure-gate.test.ts`:

```ts
import { pickEvent, validateEvents } from '../../events/event-utils';
import type { GameEvent } from '../../events/event-utils';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { createMetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';

const FX = {} as FxState;
const META = createMetaState();
// minPressure を持つ合成イベント
const guarded: GameEvent = {
  id: 'rv_test', fl: [1], tp: 'revenant', minPressure: 2,
  sit: 'テスト亡霊', ch: [{ t: '戦う', o: [{ c: 'default', r: '結果', hp: -10 }] }],
};
const normal: GameEvent = {
  id: 'n_test', fl: [1], tp: 'trap',
  sit: '通常', ch: [{ t: '進む', o: [{ c: 'default', r: '結果', hp: -1 }] }],
};

describe('pickEvent 圧ゲート', () => {
  it('EVENT_TYPE.revenant が登録され validateEvents を通る', () => {
    expect(EVENT_TYPE.revenant).toBeDefined();
    expect(() => validateEvents([guarded], EVENT_TYPE)).not.toThrow();
  });

  it('圧不足では minPressure イベントが選ばれない', () => {
    // floor1 で通常を used にし、圧1 だと guarded(min2) は除外 → null
    const picked = pickEvent({ events: [guarded, normal], floor: 1, usedIds: ['n_test'], meta: META, fx: FX, pressure: 1 });
    expect(picked?.id).not.toBe('rv_test');
  });

  it('圧が閾値以上なら minPressure イベントが選ばれうる', () => {
    const picked = pickEvent({ events: [guarded], floor: 1, usedIds: [], meta: META, fx: FX, pressure: 2 });
    expect(picked?.id).toBe('rv_test');
  });

  it('pressure 未指定（既定0）では minPressure イベントは出ない（回帰ガード）', () => {
    const picked = pickEvent({ events: [guarded], floor: 1, usedIds: [], meta: META, fx: FX });
    expect(picked).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest pressure-gate`
Expected: FAIL（EVENT_TYPE.revenant undefined / pressure 未対応）

- [ ] **Step 3: EVENT_TYPE に revenant を追加**

`domain/constants/event-type-defs.ts` の `EVENT_TYPE` に追記（`echo` の後）:

```ts
  echo:        { label: "残 響", colors: ["#c4b5fd", "rgba(196,181,253,0.08)", "rgba(196,181,253,0.2)"] },
  revenant:    { label: "亡 霊", colors: ["#f43f5e", "rgba(244,63,94,0.10)",   "rgba(244,63,94,0.28)"] },
});
```

- [ ] **Step 4: GameEvent に minPressure を追加（両定義）**

`events/event-utils.ts` の `GameEvent` インターフェースに追加:

```ts
  metaCond?: (meta: MetaState) => boolean;
  /** この残響圧以上で出現可能（亡霊イベント用） */
  minPressure?: number;
}
```

`domain/events/game-event.ts` の `GameEvent` にも同フィールドを追加:

```ts
  readonly metaCond?: (meta: MetaState) => boolean;
  /** この残響圧以上で出現可能（亡霊イベント用） */
  readonly minPressure?: number;
}
```

- [ ] **Step 5: pickEvent に pressure 引数を追加（両実装）**

`events/event-utils.ts` の `PickEventParams` と `pickEvent`:

```ts
export interface PickEventParams {
  readonly events: GameEvent[];
  readonly floor: number;
  readonly usedIds: string[];
  readonly meta: MetaState;
  readonly fx: FxState;
  readonly rng?: RandomSource;
  /** 残響圧（minPressure ゲート用、既定0） */
  readonly pressure?: number;
}

export const pickEvent = ({ events, floor, usedIds, meta, fx, rng, pressure = 0 }: PickEventParams): GameEvent | null => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
    && (!e.minPressure || pressure >= e.minPressure)
  );
  // ...（以降の重み付けロジックは現状のまま）
```

`domain/events/event-selector.ts` の `pickEvent`（位置引数版）も同じ pressure ゲートを追加（末尾に `pressure: number = 0` 引数、pool フィルタに `&& (!e.minPressure || pressure >= e.minPressure)`）。シグネチャは `pickEvent(events, floor, usedIds, meta, fx, rng?, pressure = 0)`。

- [ ] **Step 6: テストが通ることを確認**

Run: `npx jest pressure-gate`
Expected: PASS（全件）

- [ ] **Step 7: 既存イベント系の回帰確認＋型チェック**

Run: `npx jest event && npm run typecheck`
Expected: PASS（圧未指定の既存呼び出しは pressure=0 で従来通り）

- [ ] **Step 8: コミット**

```bash
git add src/features/labyrinth-echo/domain/constants/event-type-defs.ts src/features/labyrinth-echo/events/event-utils.ts src/features/labyrinth-echo/domain/events/game-event.ts src/features/labyrinth-echo/domain/events/event-selector.ts src/features/labyrinth-echo/__tests__/events/pressure-gate.test.ts
git commit -m "feat: 迷宮の残響 revenant 種別と pickEvent の圧ゲートを追加"
```

---

### Task 4: 残響の亡霊イベント5件

**Files:**
- Create: `events/revenant-events.ts`
- Test: `__tests__/events/revenant-events.test.ts`

**Interfaces:**
- Consumes: `GameEvent`（`events/event-utils`）, `isPredecessorDiscovered`（`domain/services/echo-service`）, `PREDECESSORS`（`domain/constants/predecessor-defs`）, `MetaState`。
- Produces: `REVENANT_EVENTS: GameEvent[]`（5件、各 `tp:"revenant"`・`minPressure`・`metaCond`（発見済み）・`fl:"revenant:<predId>"` を持つ鎮静 outcome）。

- [ ] **Step 1: 失敗する契約テストを書く**

`__tests__/events/revenant-events.test.ts`:

```ts
import { REVENANT_EVENTS } from '../../events/revenant-events';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { validateEvents } from '../../events/event-utils';
import { PREDECESSORS } from '../../domain/constants/predecessor-defs';
import { createMetaState } from '../../domain/models/meta-state';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('REVENANT_EVENTS 契約', () => {
  it('亡霊は5件', () => { expect(REVENANT_EVENTS).toHaveLength(5); });

  it('全件が tp:"revenant" で minPressure と metaCond を持つ', () => {
    for (const e of REVENANT_EVENTS) {
      expect(e.tp).toBe('revenant');
      expect(typeof e.minPressure).toBe('number');
      expect(e.minPressure!).toBeGreaterThanOrEqual(2);
      expect(e.minPressure!).toBeLessThanOrEqual(5);
      expect(typeof e.metaCond).toBe('function');
    }
  });

  it('各亡霊に revenant:<predId> フラグの outcome がありその predId は有効', () => {
    const flagged = REVENANT_EVENTS.flatMap(e =>
      e.ch.flatMap(c => c.o).map(o => o.fl).filter((fl): fl is string => !!fl && fl.startsWith('revenant:')).map(fl => fl.slice('revenant:'.length)),
    );
    expect(flagged.length).toBeGreaterThanOrEqual(REVENANT_EVENTS.length);
    for (const id of flagged) expect(predIds.has(id)).toBe(true);
  });

  it('metaCond は対応先人を発見済みのとき true、未発見で false', () => {
    const lian = REVENANT_EVENTS.find(e => e.id === 'rv_lian')!;
    expect(lian.metaCond!(createMetaState({ fragments: [] }))).toBe(false);
    expect(lian.metaCond!(createMetaState({ fragments: ['f_lian_1'] }))).toBe(true);
  });

  it('validateEvents を通過する', () => {
    expect(() => validateEvents([...REVENANT_EVENTS], EVENT_TYPE)).not.toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest revenant-events`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: revenant-events.ts を作成**

`events/revenant-events.ts`:

```ts
/**
 * 迷宮の残響 - 残響の亡霊イベント
 *
 * 発見済みの先人が残響圧で敵性化して襲来する高ステークの特殊イベント（5件・手書き）。
 * 二重ゲート: 圧 >= minPressure かつ その先人を発見済み（metaCond）。
 * 鎮静 outcome は fl:"revenant:<predId>" を付与する。
 */
import { isPredecessorDiscovered } from '../domain/services/echo-service';
import type { MetaState } from '../domain/models/meta-state';
import type { GameEvent } from './event-utils';

export const REVENANT_EVENTS: GameEvent[] = [
  {
    id: 'rv_lian', fl: [1, 2], tp: 'revenant', minPressure: 2,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_lian', m.fragments),
    sit: '通路の闇が紙片の渦になる。無数の手記が宙を舞い、写本師リアンの影が嗤う。「記録を……もっと記録を……」執着の塊が襲いかかる。',
    ch: [
      { t: '記録の山から弱点を読み取る', o: [
        { c: 'inf>25', r: '舞う手記の中に矛盾を見つけ、影の核を突いた。渦が鎮まり、リアンの残響が静かに崩れる。「ああ……これで……足りた」', hp: -6, mn: -4, inf: 12, fl: 'revenant:p_lian' },
        { c: 'default', r: '情報の渦に呑まれ、文字が脳裏で暴れる。視界が滲む。', hp: -10, mn: -14, inf: 4, fl: 'add:混乱' },
      ] },
      { t: '力ずくで紙片を振り払う', o: [
        { c: 'hp>40', r: '腕を盾に渦を突破。紙の刃に切られながらも影を抜けた。', hp: -16, mn: -6, inf: 2 },
        { c: 'default', r: '無数の紙の刃が全身を裂く。血が滲む。', hp: -24, mn: -6, inf: 0, fl: 'add:出血' },
      ] },
      { t: '「お前の記録は確かに残った」と語りかける', o: [
        { c: 'mn>35', r: '影が止まる。「……読んだ、のか」。執着がほどけ、リアンの残響は安らかに散った。', hp: 0, mn: -8, inf: 16, fl: 'revenant:p_lian' },
        { c: 'default', r: '言葉は届かない。影は「足りない、足りない」と精神を抉る。', hp: -4, mn: -18, inf: 2 },
      ] },
    ],
  },
  {
    id: 'rv_twins', fl: [2, 3], tp: 'revenant', minPressure: 2,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_twins', m.fragments),
    sit: '灰色の通路に、片割れだけの影が二人分の足音を響かせる。双子の亡霊だ。「なぜ私だけ……なぜお前が生きている……」嫉妬と哀しみが渦巻く。',
    ch: [
      { t: '「お前は一人で、ここまで来た」と讃える', o: [
        { c: 'mn>30', r: '影が震える。「……見て、いたのか」。背負い続けた重さが報われ、双子の残響は寄り添うように消えた。', hp: -3, mn: -6, inf: 14, fl: 'revenant:p_twins' },
        { c: 'default', r: '哀しみの波に呑まれる。誰かを喪う痛みが胸を貫く。', hp: -6, mn: -16, inf: 4, fl: 'add:恐怖' },
      ] },
      { t: '影を振り切って駆け抜ける', o: [
        { c: 'hp>35', r: '哀しみを背に走った。追いすがる手を振り切り、通路を抜ける。', hp: -14, mn: -10, inf: 2 },
        { c: 'default', r: '足が縺れ、影の手に掴まれた。冷たい絶望が体温を奪う。', hp: -20, mn: -10, inf: 0 },
      ] },
      { t: '共に背負う覚悟を示す', o: [
        { c: 'inf>20', r: '先人たちの記録を胸に、影の手を握り返す。「お前を忘れない」。双子は安らいで散った。', hp: -5, mn: -5, inf: 18, fl: 'revenant:p_twins' },
        { c: 'default', r: '覚悟は揺らぎ、影の重さに膝をつく。', hp: -10, mn: -12, inf: 3 },
      ] },
    ],
  },
  {
    id: 'rv_galen', fl: [3, 4], tp: 'revenant', minPressure: 3,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_galen', m.fragments),
    sit: '空間が軋み、床と天井が入れ替わる。地図屋ガレンの亡霊が歪んだ幾何を操り、現実を捻じ曲げてくる。「角度が……合わない……合わせろ……」',
    ch: [
      { t: '歪みの法則を冷静に解析する', o: [
        { c: 'inf>30', r: '捻じれた空間に一貫した規則を見抜き、歪みの中心を正した。ガレンの影は「……解けた」と崩れ落ちた。', hp: -8, mn: -8, inf: 14, fl: 'revenant:p_galen' },
        { c: 'default', r: '空間酔いに思考が砕ける。上下の感覚を失い嘔吐する。', hp: -12, mn: -16, inf: 3, fl: 'add:混乱' },
      ] },
      { t: '歪みが戻る一瞬を待って走り抜ける', o: [
        { c: 'mn>40', r: '深呼吸で平衡を保ち、空間が整う刹那に駆け抜けた。', hp: -10, mn: -10, inf: 4 },
        { c: 'default', r: 'タイミングを誤り、歪んだ壁に叩きつけられた。', hp: -22, mn: -8, inf: 0, fl: 'add:負傷' },
      ] },
      { t: '「お前の地図は、ここにある」と己の記憶を示す', o: [
        { c: 'inf>25', r: '集めた断片の記憶が、ガレンの未完の地図を補完する。影は「ああ、これが答えか」と満たされて消えた。', hp: -6, mn: -10, inf: 20, fl: 'revenant:p_galen' },
        { c: 'default', r: '記憶は断片的すぎた。影は嗤い、精神を深く抉る。', hp: -6, mn: -18, inf: 5 },
      ] },
    ],
  },
  {
    id: 'rv_elna', fl: [4, 5], tp: 'revenant', minPressure: 4,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_elna', m.fragments),
    sit: '最深部の手前、穏やかだった気配が刃に変わる。守人エルナが行く手を阻む。「ここから先へ進む資格が、お前にあるか。試させてもらう」',
    ch: [
      { t: '対話で資格を示す', o: [
        { c: 'mn>45', r: '先人たちを看取る覚悟を語る。エルナは静かに頷いた。「……お前なら、託せる」。道が開かれた。', hp: -5, mn: -12, inf: 16, fl: 'revenant:p_elna' },
        { c: 'default', r: '言葉は軽く、エルナの眼差しが鋭く精神を刺す。「まだ、足りぬ」', hp: -8, mn: -20, inf: 4 },
      ] },
      { t: '実力で突破を試みる', o: [
        { c: 'hp>45', r: '守人の試練を真正面から受け、満身創痍で押し通った。エルナは微笑む。「良い目だ」', hp: -26, mn: -8, inf: 8, fl: 'revenant:p_elna' },
        { c: 'default', r: '守人の一撃は重い。受け切れず、地に伏した。', hp: -30, mn: -10, inf: 2, fl: 'add:出血' },
      ] },
      { t: '先人たちの残響を束ねて応える', o: [
        { c: 'inf>35', r: '集めた残響の総体がエルナに語りかける。「皆、ここにいる」。守人は道を譲った。', hp: -6, mn: -12, inf: 22, fl: 'revenant:p_elna' },
        { c: 'default', r: '残響は散り散りで、エルナの心は動かない。試練は続く。', hp: -10, mn: -16, inf: 6 },
      ] },
    ],
  },
  {
    id: 'rv_first', fl: [5], tp: 'revenant', minPressure: 5,
    metaCond: (m: MetaState) => isPredecessorDiscovered('p_first', m.fragments),
    sit: '迷宮の核の手前。最古の刻印が光を放ち、始まりの探索者の残響が立ち上がる。「忘れたくなかった……だから、ここを創った……お前も、そうなのか」',
    ch: [
      { t: '「もう、終わらせていい」と告げる', o: [
        { c: 'inf>40', r: '迷宮の起源そのものに、別れを受け入れる言葉を返す。始まりの探索者は、初めて安らいだ表情で薄れていった。', hp: -8, mn: -14, inf: 18, fl: 'revenant:p_first' },
        { c: 'default', r: '願いの重さに言葉が潰される。起源の哀しみが全身を侵蝕する。', hp: -14, mn: -22, inf: 6 },
      ] },
      { t: '己の意志で抗い、押し通る', o: [
        { c: 'hp>40', r: '起源の引力に抗い、一歩ずつ前へ。残響の手をほどき、核へ近づいた。', hp: -24, mn: -12, inf: 10, fl: 'revenant:p_first' },
        { c: 'default', r: '起源の重力が骨を軋ませる。意識が遠のきかける。', hp: -28, mn: -14, inf: 3, fl: 'add:負傷' },
      ] },
      { t: '集めた全ての残響を捧げて鎮める', o: [
        { c: 'inf>45', r: '先人たちの記憶のすべてが、始まりの願いに応える。「お前たちは、忘れられない」。起源は満たされ、静かに眠りについた。', hp: -10, mn: -16, inf: 24, fl: 'revenant:p_first' },
        { c: 'default', r: '捧げた残響は足りず、起源は嘆く。精神が引き裂かれそうだ。', hp: -10, mn: -24, inf: 8, fl: 'add:恐怖' },
      ] },
    ],
  },
];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest revenant-events`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/events/revenant-events.ts src/features/labyrinth-echo/__tests__/events/revenant-events.test.ts
git commit -m "feat: 迷宮の残響 残響の亡霊イベント5件を追加"
```

---

### Task 5: reducer に pressure / revenantsThisRun を追加

**Files:**
- Modify: `presentation/hooks/use-game-orchestrator.ts`
- Test: `__tests__/presentation/hooks/use-game-orchestrator.test.ts`（追記）

**Interfaces:**
- Consumes: 既存 reducer。
- Produces:
  - `GameReducerState.pressure: number`, `GameReducerState.revenantsThisRun: number`
  - `SELECT_DIFFICULTY` アクションに `pressure: number` を追加
  - `APPLY_CHOICE` アクションに任意 `revenantDefeated?: boolean` を追加（true で `revenantsThisRun` をインクリメント）

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/use-game-orchestrator.test.ts` に追記（既存 import の `gameReducer`/`createInitialState` を利用）:

```ts
describe('残響圧 reducer', () => {
  it('初期状態は pressure 0 / revenantsThisRun 0', () => {
    const s = createInitialState();
    expect(s.pressure).toBe(0);
    expect(s.revenantsThisRun).toBe(0);
  });

  it('SELECT_DIFFICULTY が pressure を設定し revenantsThisRun を 0 にリセットする', () => {
    const player = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] };
    const diff = { id: 'normal' } as never;
    const dirty = { ...createInitialState(), revenantsThisRun: 3 };
    const next = gameReducer(dirty, { type: 'SELECT_DIFFICULTY', difficulty: diff, player, pressure: 4 } as never);
    expect(next.pressure).toBe(4);
    expect(next.revenantsThisRun).toBe(0);
  });

  it('APPLY_CHOICE の revenantDefeated:true で revenantsThisRun が増える', () => {
    const base = createInitialState();
    const action = {
      type: 'APPLY_CHOICE', player: base.player, resTxt: '', resChg: { hp: 0, mn: 0, inf: 0 },
      drainInfo: null, logEntry: { fl: 1, step: 1, ch: 'x', hp: 0, mn: 0, inf: 0 },
      chainNext: null, usedSecondLife: false, revenantDefeated: true,
    } as never;
    const next = gameReducer({ ...base, player: { hp: 1, maxHp: 1, mn: 1, maxMn: 1, inf: 0, statuses: [] } } as never, action);
    expect(next.revenantsThisRun).toBe(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest use-game-orchestrator -t 残響圧`
Expected: FAIL

- [ ] **Step 3: reducer を更新**

`presentation/hooks/use-game-orchestrator.ts`:

`GameReducerState` に追加（`usedSecondLife` の後あたり）:

```ts
  readonly usedSecondLife: boolean;
  /** 選択中の残響圧 */
  readonly pressure: number;
  /** このランで撃破した亡霊数 */
  readonly revenantsThisRun: number;
```

`GameAction` の `SELECT_DIFFICULTY` と `APPLY_CHOICE` を更新:

```ts
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyDef; player: Player; pressure: number }
  | { type: 'APPLY_CHOICE'; player: Player; resTxt: string; resChg: ResChg; drainInfo: DrainInfo | null; logEntry: LogEntry; chainNext: string | null; usedSecondLife: boolean; revenantDefeated?: boolean }
```

`createInitialState()` に追加:

```ts
  usedSecondLife: false,
  pressure: 0,
  revenantsThisRun: 0,
```

`SELECT_DIFFICULTY` case に追加（既存の返却オブジェクトに）:

```ts
        usedSecondLife: false,
        pressure: action.pressure,
        revenantsThisRun: 0,
```

`APPLY_CHOICE` case の返却に追加:

```ts
        usedSecondLife: action.usedSecondLife,
        revenantsThisRun: state.revenantsThisRun + (action.revenantDefeated ? 1 : 0),
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest use-game-orchestrator`
Expected: PASS

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-orchestrator.ts src/features/labyrinth-echo/__tests__/presentation/hooks/use-game-orchestrator.test.ts
git commit -m "feat: 迷宮の残響 reducer に残響圧と亡霊撃破カウントを追加"
```

---

### Task 6: presentation 配線（実効難易度・圧伝播・報酬）

**Files:**
- Modify: `presentation/LabyrinthEchoGame.tsx`（selectDiff・pickEvent 圧伝播）
- Modify: `presentation/hooks/use-game-actions.ts`（handleChoice の revenant 検出、escape 報酬、pickEvent 圧伝播）
- Test: `__tests__/presentation/hooks/pressure-rewards.test.ts`

**Interfaces:**
- Consumes: `applyPressureToDifficulty`（pressure-service）, `createNewPlayer`, `pickEvent`（pressure 引数）, reducer の `pressure`/`revenantsThisRun`。
- Produces: 振る舞い（実効難易度でラン、圧で亡霊ゲート、revenant フラグ集計・永続化、escape で KP圧ボーナス＋maxPressureCleared）。

- [ ] **Step 1: 失敗するテストを書く（revenant 収集の純粋検証）**

`__tests__/presentation/hooks/pressure-rewards.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../../../presentation/hooks/use-game-actions';
import type { GameActionsDeps } from '../../../presentation/hooks/use-game-actions';
import { createMetaState } from '../../../domain/models/meta-state';
import { createInitialState } from '../../../presentation/hooks/use-game-orchestrator';
import type { GameEvent } from '../../../events/event-utils';

const rvEvent: GameEvent = {
  id: 'rv_x', fl: [1], tp: 'revenant', minPressure: 2,
  sit: 'テスト亡霊', ch: [{ t: '鎮める', o: [{ c: 'default', r: '鎮めた', fl: 'revenant:p_lian' }] }],
};
const noop = () => undefined;
const audioSfx = { choice: noop, hit: noop, bigHit: noop, heal: noop, status: noop, clear: noop, drain: noop, over: noop, floor: noop, ambient: noop, victory: noop, levelUp: noop };

const makeDeps = (over: Partial<GameActionsDeps>): GameActionsDeps => ({
  state: { ...createInitialState(), phase: 'event', player: { hp: 50, maxHp: 50, mn: 30, maxMn: 35, inf: 30, statuses: [] }, diff: null, event: rvEvent, floor: 1, step: 0, pressure: 2 },
  dispatch: noop, fx: {} as GameActionsDeps['fx'], meta: createMetaState({ fragments: ['f_lian_1'] }),
  events: [rvEvent], sfx: (fn: () => void) => fn(),
  safeTimeout: ((fn: () => void) => { fn(); return 0 as unknown as ReturnType<typeof setTimeout>; }),
  doShake: noop, flash: noop, updateMeta: noop, audioSfx, ...over,
});

describe('亡霊撃破の収集', () => {
  it('revenant:<id> outcome で revenantsDefeated に追加され dispatch に revenantDefeated:true が乗る', () => {
    const updates: Array<Record<string, unknown>> = [];
    const dispatched: Array<Record<string, unknown>> = [];
    const deps = makeDeps({
      updateMeta: ((u: (m: ReturnType<typeof createMetaState>) => Record<string, unknown>) => updates.push(u(createMetaState({ revenantsDefeated: [] })))) as GameActionsDeps['updateMeta'],
      dispatch: ((a: Record<string, unknown>) => dispatched.push(a)) as GameActionsDeps['dispatch'],
    });
    const { result } = renderHook(() => useGameActions(deps));
    act(() => { result.current.handleChoice(0); });
    expect(updates.find(u => 'revenantsDefeated' in u)?.revenantsDefeated).toEqual(['p_lian']);
    expect(dispatched.find(a => a.type === 'APPLY_CHOICE')?.revenantDefeated).toBe(true);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest pressure-rewards`
Expected: FAIL（revenant 収集未実装）

- [ ] **Step 3: LabyrinthEchoGame の selectDiff と pickEvent を更新**

`presentation/LabyrinthEchoGame.tsx`:

import に追加:

```ts
import { applyPressureToDifficulty } from '../domain/services/pressure-service';
```

`selectDiff`（148行目付近）を圧対応に:

```ts
  const selectDiff = useCallback((d: DifficultyDef, pressure: number) => {
    enableAudio();
    const eff = applyPressureToDifficulty(d, pressure);
    const player = createNewPlayer(eff, fx);
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty: eff, player, pressure });
  }, [enableAudio, fx]);
```

`enterFloor` 内の `pickEvent`（163行目付近）に圧を伝播:

```ts
    const nextEvent = pickEvent({ events: EVENTS, floor: state.floor, usedIds: [...state.usedIds], meta, fx, rng: getRandomSource(), pressure: state.pressure });
```

`EVENTS` の組み立てに亡霊を統合（45行目付近の `validateEvents([...EV, ...ECHO_EVENTS], EVENT_TYPE)` を更新）:

```ts
import { REVENANT_EVENTS } from '../events/revenant-events';
// ...
const EVENTS = validateEvents([...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS], EVENT_TYPE);
```

注: `GameHandlers.selectDiff` の型は `(d: DifficultyDef, pressure: number) => void` に更新（GameRouter.tsx の `GameHandlers` インターフェース）。

- [ ] **Step 4: use-game-actions の revenant 検出・escape 報酬・圧伝播を更新**

`presentation/hooks/use-game-actions.ts`:

`useHandleChoice` 内、断片収集（`fl:"frag:"`）処理の直後に revenant 検出を追加し、`APPLY_CHOICE` dispatch に `revenantDefeated` を乗せる。まず revenant 判定を dispatch 前に計算:

```ts
    // 残響の亡霊の撃破（fl:"revenant:<predId>"）
    const REVENANT_PREFIX = 'revenant:';
    const isRevenantDefeat = outcome.fl?.startsWith(REVENANT_PREFIX) ?? false;
```

`dispatch({ type: 'APPLY_CHOICE', ... })` の payload に追加:

```ts
      usedSecondLife: state.usedSecondLife || secondLife.activated,
      revenantDefeated: isRevenantDefeat,
    });
```

`updateMeta(totalEvents)` の後（frag 収集処理の隣）に revenantsDefeated 永続化:

```ts
    if (isRevenantDefeat) {
      const predId = outcome.fl!.slice(REVENANT_PREFIX.length);
      updateMeta(m => ({ revenantsDefeated: m.revenantsDefeated.includes(predId) ? m.revenantsDefeated : [...m.revenantsDefeated, predId] }));
    }
```

`handleEscapeOutcome` の `updateMeta` に KP 圧ボーナスと maxPressureCleared を追加。`kp` 行を更新し、`maxPressureCleared` を加える:

```ts
        kp: m.kp + (state.diff?.rewards.kpOnWin ?? 4) + end.bonusKp
            + Math.round((state.diff?.rewards.kpOnWin ?? 4) * state.pressure * 0.25) + state.revenantsThisRun,
        // ...既存フィールド...
        maxPressureCleared: Math.max(m.maxPressureCleared, state.pressure),
```

`useProceed` と `resolveBossRetry` 内の `pickEvent` 呼び出しに `pressure: state.pressure` を追加（2箇所）:

```ts
    const nextEvent = pickEvent({ events, floor: state.floor, usedIds: nextUsedIds, meta, fx, rng: getRandomSource(), pressure: state.pressure });
```

注: `handleEscapeOutcome` は `state` を引数に受けているため `state.pressure`/`state.revenantsThisRun` を参照できる。useCallback の依存配列に `state` は既に含まれる。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest pressure-rewards`
Expected: PASS

- [ ] **Step 6: 回帰・型チェック**

Run: `npx jest use-game && npm run typecheck`
Expected: PASS（既存 use-game 系が緑、selectDiff の新シグネチャに型が追従）

- [ ] **Step 7: コミット**

```bash
git add src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/presentation/hooks/use-game-actions.ts src/features/labyrinth-echo/presentation/components/GameRouter.tsx src/features/labyrinth-echo/__tests__/presentation/hooks/pressure-rewards.test.ts
git commit -m "feat: 迷宮の残響 残響圧の実効難易度適用・亡霊撃破集計・KP圧ボーナスを配線"
```

---

### Task 7: 難易度選択画面の残響圧セレクタ

**Files:**
- Modify: `components/DiffSelectScreen.tsx`
- Test: `__tests__/diff-select-screen.test.tsx`（追記）

**Interfaces:**
- Consumes: `maxSelectablePressure`（pressure-service）, `applyPressureToDifficulty`, `meta.echoDepth`。`selectDiff: (d: DifficultyDef, pressure: number) => void`。
- Produces: 圧セレクタ（0..maxSelectablePressure）。圧>0 時に各 DiffCard の HP/MN プレビューが実効値になり、選択時に圧を渡す。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/diff-select-screen.test.tsx` に追記:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffSelectScreen } from '../components/DiffSelectScreen';
import { createMetaState } from '../domain/models/meta-state';

const baseProps = (over = {}) => ({
  Particles: null, fx: { hpBonus: 0, mentalBonus: 0, infoBonus: 0 } as never,
  meta: createMetaState({ echoDepth: 3 }), selectDiff: jest.fn(), setPhase: () => undefined, ...over,
});

describe('DiffSelectScreen 残響圧', () => {
  it('echoDepth>0 のとき残響圧セレクタが表示される', () => {
    render(<DiffSelectScreen {...baseProps()} />);
    expect(screen.getByText(/残響圧/)).toBeInTheDocument();
  });

  it('echoDepth=0 のときは圧セレクタを出さない', () => {
    render(<DiffSelectScreen {...baseProps({ meta: createMetaState({ echoDepth: 0 }) })} />);
    expect(screen.queryByText(/残響圧/)).toBeNull();
  });

  it('難易度選択時に現在の圧を添えて selectDiff を呼ぶ', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...baseProps({ selectDiff })} />);
    // 既定圧0で最初の難易度カードを選択
    fireEvent.click(screen.getByText('探索者'));
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'easy' }), 0);
  });
});
```

注: 既存 `DiffCard` の onSelect が難易度カードのどの要素クリックで発火するかを実装で確認し、テストのクリック対象（難易度名 '探索者' 等）を合わせること。発火要素が異なる場合はテストのセレクタを実装に合わせて調整。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest diff-select-screen -t 残響圧`
Expected: FAIL（セレクタ未実装）

- [ ] **Step 3: DiffSelectScreen に圧セレクタを実装**

`components/DiffSelectScreen.tsx` を更新（`useState` 導入、圧セレクタ追加、プレビューと selectDiff を圧対応に）:

```tsx
import { useState, type ReactNode } from 'react';
import { CFG } from '../domain/constants/config';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { maxSelectablePressure, applyPressureToDifficulty } from '../domain/services/pressure-service';
import type { FxState } from '../domain/models/unlock';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { MetaState } from '../domain/models/meta-state';
import type { UIPhase } from '../presentation/hooks/use-game-orchestrator';
import { Page } from './Page';
import { DiffCard, BackBtn } from './GameComponents';

interface DiffSelectScreenProps {
  Particles: ReactNode;
  fx: FxState;
  meta: MetaState;
  selectDiff: (d: DifficultyDef, pressure: number) => void;
  setPhase: (phase: UIPhase) => void;
}

export const DiffSelectScreen = ({ Particles, fx, meta, selectDiff, setPhase }: DiffSelectScreenProps) => {
  const maxP = maxSelectablePressure(meta.echoDepth);
  const [pressure, setPressure] = useState(0);
  const p = Math.min(pressure, maxP);

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: "4vh", animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 22, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 6 }}>難易度選択</h2>
        <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginBottom: 16, fontFamily: "var(--sans)" }}>高難度ほど獲得知見ポイントが増加する</p>

        {maxP > 0 && (
          <div style={{ textAlign: "center", marginBottom: 20, fontFamily: "var(--sans)" }}>
            <div style={{ fontSize: 12, color: "#f43f5e", letterSpacing: 2, marginBottom: 6 }}>残響圧 {p} / {maxP}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {Array.from({ length: maxP + 1 }, (_, i) => (
                <button key={i} onClick={() => setPressure(i)} style={{
                  width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: i <= p ? "rgba(244,63,94,0.18)" : "rgba(20,20,35,0.4)",
                  border: `1px solid ${i === p ? "rgba(244,63,94,0.6)" : "rgba(60,40,50,0.3)"}`,
                  color: i <= p ? "#fda4af" : "#505070",
                }}>{i}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, lineHeight: 1.6 }}>
              {p === 0 ? "圧をかけると迷宮が手強く化け、亡霊が現れる。報酬も増える。" : "侵蝕とダメージが増し、発見した先人の亡霊が襲来する。KP報酬が増加。"}
            </div>
          </div>
        )}

        {DIFFICULTY.map(d => {
          const eff = applyPressureToDifficulty(d, p);
          return (
            <DiffCard key={d.id} d={d}
              hp={CFG.BASE_HP + fx.hpBonus + eff.modifiers.hpMod}
              mn={CFG.BASE_MN + fx.mentalBonus + eff.modifiers.mnMod}
              inf={CFG.BASE_INF + fx.infoBonus}
              cleared={meta.clearedDifficulties?.includes(d.id)}
              onSelect={(picked) => selectDiff(picked, p)} />
          );
        })}
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
};
```

注: `DiffCard` の `onSelect` は現状 `(d: DifficultyDef) => void`。上記では `onSelect={(picked) => selectDiff(picked, p)}` でラップしているため DiffCard 側のシグネチャ変更は不要（picked は元の DifficultyDef）。DiffCard が `d` をそのまま onSelect に渡すことを実装で確認すること。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest diff-select-screen`
Expected: PASS（既存テストも維持。既存テストが旧 selectDiff シグネチャを前提にしている場合は新シグネチャに更新）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/components/DiffSelectScreen.tsx src/features/labyrinth-echo/__tests__/diff-select-screen.test.tsx
git commit -m "feat: 迷宮の残響 難易度選択に残響圧セレクタを追加"
```

---

### Task 8: 称号3種と進捗可視化

**Files:**
- Modify: `domain/constants/title-defs.ts`
- Modify: `components/CollectionScreens.tsx`（Records に最高圧）
- Modify: `components/ArchiveScreen.tsx`（先人カードに亡霊バッジ）
- Test: `__tests__/domain/services/title-service.test.ts`（追記）, `__tests__/archive-screen.test.tsx`（追記）

**Interfaces:**
- Consumes: `meta.maxPressureCleared`/`meta.revenantsDefeated`。
- Produces: 称号 t21/t22/t23、Records の最高圧表示、Archive の亡霊バッジ。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/services/title-service.test.ts` に追記（既存 import の `getUnlockedTitles` を利用）:

```ts
describe('残響圧の称号', () => {
  it('maxPressureCleared>=3 で「残響に抗う者」が解放', () => {
    const got = getUnlockedTitles(createMetaState({ maxPressureCleared: 3 }));
    expect(got.some(t => t.id === 't21')).toBe(true);
  });
  it('revenantsDefeated 全5で「亡霊狩り」が解放', () => {
    const got = getUnlockedTitles(createMetaState({ revenantsDefeated: ['p_lian','p_twins','p_galen','p_elna','p_first'] }));
    expect(got.some(t => t.id === 't23')).toBe(true);
  });
});
```

`__tests__/archive-screen.test.tsx` に追記:

```tsx
it('亡霊撃破済みの先人カードに撃破バッジが出る', () => {
  render(<ArchiveScreen Particles={null} meta={createMetaState({ echoDepth: 2, fragments: ['f_lian_1'], revenantsDefeated: ['p_lian'] })} setPhase={() => undefined} />);
  expect(screen.getByText(/亡霊：撃破/)).toBeInTheDocument();
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest title-service archive-screen -t 残響圧 -t 亡霊`
Expected: FAIL

- [ ] **Step 3: title-defs に3称号を追加**

`domain/constants/title-defs.ts` の配列末尾（`t20` の後）に追加:

```ts
  // 残響圧（Phase 3）
  { id: "t21", name: "残響に抗う者",   icon: "🩸", color: "#f43f5e", cond: (m: MetaState) => (m.maxPressureCleared ?? 0) >= 3, desc: "残響圧3以上で生還した" },
  { id: "t22", name: "残響を統べる者", icon: "👑", color: "#fb7185", cond: (m: MetaState) => (m.maxPressureCleared ?? 0) >= 6, desc: "残響圧6を制覇した" },
  { id: "t23", name: "亡霊狩り",       icon: "⚔",  color: "#fda4af", cond: (m: MetaState) => (m.revenantsDefeated?.length ?? 0) === 5, desc: "全ての先人の亡霊を鎮めた" },
```

- [ ] **Step 4: Records に最高圧表示を追加**

`components/CollectionScreens.tsx` の `RecordsScreen` 内「累計記録」グリッド（`StatEntry` 群）に1行追加:

```tsx
            <StatEntry label="最高残響圧" color="#f43f5e" value={meta.maxPressureCleared ?? 0} />
```

- [ ] **Step 5: ArchiveScreen に亡霊バッジを追加**

`components/ArchiveScreen.tsx` の先人カードで、先人名の行に亡霊撃破バッジを追加。`discovered &&` ブロック内、進捗表示の近くに:

```tsx
                    <div style={{ fontSize: 10, color: meta.revenantsDefeated.includes(p.id) ? '#fda4af' : '#505070', fontFamily: 'var(--sans)' }}>
                      {meta.revenantsDefeated.includes(p.id) ? '亡霊：撃破済' : '亡霊：未遭遇'}
                    </div>
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx jest title-service archive-screen`
Expected: PASS

- [ ] **Step 7: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/domain/constants/title-defs.ts src/features/labyrinth-echo/components/CollectionScreens.tsx src/features/labyrinth-echo/components/ArchiveScreen.tsx src/features/labyrinth-echo/__tests__/domain/services/title-service.test.ts src/features/labyrinth-echo/__tests__/archive-screen.test.tsx
git commit -m "feat: 迷宮の残響 残響圧の称号3種と進捗可視化を追加"
```

---

### Task 9: シミュレータの圧対応

**Files:**
- Modify: `simulation/run-simulator.ts`
- Test: `__tests__/simulation/run-simulator.test.ts`（追記）

**Interfaces:**
- Consumes: `applyPressureToDifficulty`（pressure-service）。
- Produces: `simulateRun` の params に `pressure?: number`（既定0）と `meta?: MetaState`（既定 fresh）を追加。内部で実効難易度を適用し pickEvent に pressure と meta を伝播。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/simulation/run-simulator.test.ts` に追記:

```ts
import { applyPressureToDifficulty } from '../../domain/services/pressure-service';

describe('simulateRun 圧対応', () => {
  it('pressure 未指定（既定0）は現状と同一結果（回帰）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(999), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(999), policy: CAREFUL_POLICY, events: EVENTS, pressure: 0 });
    expect(a).toEqual(b);
  });

  it('高圧ほど careful 生還率が下がる（normal 圧0 >= 圧6、複数シード集計）', () => {
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1);
    const rate = (pressure: number) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure }).survived).length / seeds.length;
    expect(rate(0)).toBeGreaterThanOrEqual(rate(6));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest run-simulator -t 圧対応`
Expected: FAIL（pressure 未対応）

- [ ] **Step 3: simulateRun を圧対応に更新**

`simulation/run-simulator.ts`:

import に追加:

```ts
import { applyPressureToDifficulty } from '../domain/services/pressure-service';
```

`simulateRun` の params 型と本体を更新:

```ts
export const simulateRun = (params: {
  difficulty: DifficultyDef;
  fx: FxState;
  rng: RandomSource;
  policy: RunPolicy;
  events: readonly GameEvent[];
  pressure?: number;
  meta?: MetaState;
}): RunResult => {
  const { difficulty: baseDifficulty, fx, rng, policy, events, pressure = 0, meta = SIM_META } = params;
  const difficulty = applyPressureToDifficulty(baseDifficulty, pressure);
  // ...（以降、createNewPlayer(difficulty, fx) は実効難易度を使う）
```

`simulateRun` 内の全 `pickEvent({...})` 呼び出し（初回・フロア遷移・通常・`resolveBossStep` 内）に `pressure` と `meta` を渡す。`SIM_META` を直接参照していた箇所を引数 `meta` に置換する。`resolveBossStep` にも `pressure`/`meta` を引き渡す（シグネチャ拡張）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest run-simulator`
Expected: PASS（回帰テスト含む）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/simulation/run-simulator.ts src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts
git commit -m "feat: 迷宮の残響 シミュレータを残響圧対応に拡張"
```

---

### Task 10: 圧のバランス契約テスト（圧0回帰＋単調性）

**Files:**
- Modify: `__tests__/domain/services/balance-contract.test.ts`（追記）

**Interfaces:**
- Consumes: `simulateRun`（pressure 対応）, `EV`/`ECHO_EVENTS`/`REVENANT_EVENTS`, `DIFFICULTY`, `computeFx`, `SeededRandomSource`, `ECHO_FRAGMENTS`。

- [ ] **Step 1: 圧の契約テストを追記**

`__tests__/domain/services/balance-contract.test.ts` の末尾に追記:

```ts
import { REVENANT_EVENTS } from '../../../events/revenant-events';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';
// createMetaState がこのファイルに未 import の場合は追加すること:
// import { createMetaState } from '../../../domain/models/meta-state';

const EVENTS_P3 = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const ALL_DISCOVERED = createMetaState({ echoDepth: 6, fragments: ECHO_FRAGMENTS.map(f => f.id) });

const survivalAtPressure = (diffId: string, pressure: number, meta = undefined): number => {
  const difficulty = DIFFICULTY.find(x => x.id === diffId)!;
  const survived = SEEDS.filter(s =>
    simulateRun({ difficulty, fx: BASE_FX, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS_P3, pressure, meta }).survived,
  ).length;
  return survived / N;
};

describe('バランス契約 残響圧', () => {
  it('圧0 は Phase 2 と同等の生還率（回帰: normal が依然 0.45–0.85）', () => {
    const s = survivalAtPressure('normal', 0);
    expect(s).toBeGreaterThanOrEqual(0.45);
    expect(s).toBeLessThanOrEqual(0.85);
  });

  it('圧が上がるほど careful 生還率が単調減少（normal: 0 >= 3 >= 6）', () => {
    const p0 = survivalAtPressure('normal', 0);
    const p3 = survivalAtPressure('normal', 3);
    const p6 = survivalAtPressure('normal', 6);
    expect(p0).toBeGreaterThanOrEqual(p3);
    expect(p3).toBeGreaterThanOrEqual(p6);
  });

  it('高圧 normal はバンド上限が下がる（圧6 careful <= 0.55）', () => {
    expect(survivalAtPressure('normal', 6)).toBeLessThanOrEqual(0.55);
  });

  it('亡霊込み（全先人発見済み）でも単調性が保たれる（normal: 0 >= 6）', () => {
    expect(survivalAtPressure('normal', 0, ALL_DISCOVERED)).toBeGreaterThanOrEqual(survivalAtPressure('normal', 6, ALL_DISCOVERED));
  });
});
```

- [ ] **Step 2: テストを実行し実測する**

Run: `npx jest balance-contract`
Expected: 単調性は PASS。圧6バンド（<=0.55）が外れる場合は実測値を確認。

- [ ] **Step 3: バンド未達なら escalation を較正**

- 圧6 careful が 0.55 超（締め不足）→ `escalation-defs.ts` の `DMG_MULT_PER_LEVEL 0.08→0.10`、または pressure-service の drainMod 係数を `-floor(pressure/2)`→`-Math.ceil(pressure/2)` に調整して再測。
- 圧6 careful が極端に低い（理不尽）→ `DMG_MULT_PER_LEVEL 0.08→0.06`。
- **難易度設計値（Phase 2）は不変**。較正は escalation 係数のみで行う。較正したら `pressure-service.test.ts` の圧6期待値も追随。
- 単調性を最優先。バンドは方向の合格基準であり、収まらない場合は本タスク内でバンド境界を実測に合わせ、コメント明記。

- [ ] **Step 4: 最終的に全契約テストが通ることを確認**

Run: `npx jest balance-contract pressure-service`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/__tests__/domain/services/balance-contract.test.ts src/features/labyrinth-echo/domain/constants/escalation-defs.ts src/features/labyrinth-echo/domain/services/pressure-service.ts src/features/labyrinth-echo/__tests__/domain/services/pressure-service.test.ts
git commit -m "test: 迷宮の残響 残響圧のバランス契約（圧0回帰＋単調性）を追加・較正"
```

---

### Task 11: README 更新と全体 CI 確認

**Files:**
- Modify: `src/features/labyrinth-echo/README.md`

- [ ] **Step 1: README にエスカレーションを追記**

`README.md` の「### ゲームシステム」リスト（バランス再調整の後）に追加:

```markdown
- **NG+残響エスカレーション（Phase 3）**: 難易度選択で「残響圧」を 0〜echoDepth から選択。圧を上げるほど侵蝕・ダメージが増し、発見済みの先人が「残響の亡霊」として襲来する。高圧クリアは KP・称号で報われる。圧0は従来通り（回帰なし）、圧の単調性をバランス契約テストで保護
```

- [ ] **Step 2: 関連テストを一括実行**

Run: `npx jest pressure run-simulator balance-contract revenant migrate use-game title-service diff-select archive`
Expected: 全 PASS

- [ ] **Step 3: lint / typecheck**

Run: `npm run lint && npm run typecheck`
Expected: エラーなし

- [ ] **Step 4: フル CI**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build すべて PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/README.md
git commit -m "docs: 迷宮の残響 README に NG+残響エスカレーション（Phase 3）を追記"
```

---

## 完了時の受け入れ基準（spec §9 対応）

- [x] `maxPressureCleared`/`revenantsDefeated` 追加・旧セーブ自動補完（Task 1）
- [x] 残響圧を 0..echoDepth で選択でき実効難易度に反映（Task 2, 6, 7）
- [x] 圧0で Phase 2 一致（回帰なし）、圧>0 で単調減少（Task 9, 10）
- [x] 亡霊5件が圧＋発見済みゲートで出現・撃破集計が機能（Task 3, 4, 6）
- [x] 生還時 KP 圧ボーナス・maxPressureCleared 更新（Task 6）
- [x] 称号3種・最高圧表示・亡霊バッジ（Task 8）
- [x] `npm run ci` グリーン（Task 11）

## 申し送り（Phase 4 以降）

- Phase 4（残響継承ビルド）では、圧の報酬として継承選択を拡張できる（圧クリアで継承候補を解放等）。
- Phase 5（第6階層＋真END）で `echoDepth` が 7+ に拡張されると `PRESSURE_MAX`/圧上限も自然に伸びる。
- 圧連動エンディング分岐は Phase 5 の真ENDで検討。
