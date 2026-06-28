# 迷宮の残響 残響継承（先人レガシービルド・Phase 4）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 先人の断片を全収集すると解禁される「残響継承（レガシー）」を run 開始時に排他選択でき、毎回違うトレードオフ型ビルドで挑めるようにする。

**Architecture:** レガシーを `Partial<FxState>` デルタとし、run 開始で `mergeLegacyIntoFx(baseFx, legacy)` を計算して実効 fx に畳む（Phase 3 の「実効難易度」と同じ境界吸収）。戦闘系・FxState は無改造。解禁は `isPredecessorComplete(predId, fragments)` 由来で新メタフィールド不要。継承なし＝Phase 3 完全一致（回帰ガード）。Phase 2/3 のシミュレータを legacy 対応に拡張し、各レガシーの単調性・健全帯・トレードオフを契約化。

**Tech Stack:** React 19 + TypeScript / Jest 30 + SWC / 既存 `SeededRandomSource`（決定論）/ 純粋ドメイン関数。

## Global Constraints

- 言語: コメント/UIテキストは日本語、変数/関数名は英語。`any` 禁止（`unknown`+型ガード）。`var` 禁止・`const` 優先。`null` より `undefined`（ただし既存モデルが `string | null` を使う箇所はその慣習に合わせる）。
- マジックナンバーは名前付き定数。定数は `Object.freeze`。名前付きエクスポート。ファイル名 kebab-case。`dangerouslySetInnerHTML` 禁止。リスト key は安定一意値。
- 依存方向: `domain/` は外部依存なし。`simulation/`・`events/` は feature root。
- 決定論: simulator・テストで `Date.now()`/`Math.random()` を使わない（`SeededRandomSource`）。
- TDD（RED→GREEN）。カバレッジ: 新規 80%+、ドメイン 90%+。
- テスト実行: `npx jest <path>`。型: `npm run typecheck`。リント: `npm run lint`。フル: `npm run ci`。
- レガシー fx は**既存 FxState キーのみ**で表現。`combat-service`・`FxState` 定義は不変。難易度設計値（Phase 2）・escalation 係数（Phase 3）は不変。
- レガシー5種（verbatim）:
  - lg_lian（p_lian）: fx `{infoBonus:8, infoMult:1.3, healMult:0.55, hpReduce:1.2}`
  - lg_twins（p_twins）: fx `{secondLife:true, hpBonus:-10, mentalBonus:-8}`
  - lg_galen（p_galen）: fx `{dangerSense:true, mentalSense:true, negotiator:true, mnReduce:1.3}`
  - lg_elna（p_elna）: fx `{drainImmune:true, bleedReduce:true, hpReduce:0.82, mnReduce:0.82, hpBonus:-14, mentalBonus:-12}`
  - lg_first（p_first）: fx `{hpBonus:10, mentalBonus:10, infoBonus:6, healMult:1.25, drainImmune:true, hpReduce:1.4, mnReduce:1.4}`
- `selectDiff` シグネチャ: `(d: DifficultyDef, pressure: number, legacyId: string | null) => void`

base dir（以降の相対パスの起点）: `src/features/labyrinth-echo/`

---

### Task 1: EchoLegacy 型とレガシー定義5種

**Files:**
- Modify: `domain/models/echo.ts`（`EchoLegacy` 型）
- Create: `domain/constants/legacy-defs.ts`
- Test: `__tests__/domain/constants/legacy-defs.test.ts`

**Interfaces:**
- Consumes: `FxState`（`domain/models/unlock`）, `PREDECESSORS`（`domain/constants/predecessor-defs`）。
- Produces: `interface EchoLegacy { id, predecessorId, name, icon, color, upside, downside, fx: Partial<FxState> }`、`LEGACIES: readonly EchoLegacy[]`（5種）。

- [ ] **Step 1: 失敗する契約テストを書く**

`__tests__/domain/constants/legacy-defs.test.ts`:

```ts
import { LEGACIES } from '../../../domain/constants/legacy-defs';
import { PREDECESSORS } from '../../../domain/constants/predecessor-defs';

const predIds = new Set(PREDECESSORS.map(p => p.id));

describe('LEGACIES 契約', () => {
  it('レガシーは5種', () => {
    expect(LEGACIES).toHaveLength(5);
  });
  it('id は一意で lg_ プレフィックス', () => {
    const ids = LEGACIES.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('lg_')).toBe(true);
  });
  it('predecessorId は全て有効な先人を指し、先人ごとに1つ', () => {
    const preds = LEGACIES.map(l => l.predecessorId);
    for (const pid of preds) expect(predIds.has(pid)).toBe(true);
    expect(new Set(preds).size).toBe(LEGACIES.length);
  });
  it('upside/downside は非空、fx は非空デルタ', () => {
    for (const l of LEGACIES) {
      expect(l.upside.length).toBeGreaterThan(0);
      expect(l.downside.length).toBeGreaterThan(0);
      expect(Object.keys(l.fx).length).toBeGreaterThan(0);
    }
  });
  it('期待する5種を含む（lg_lian/twins/galen/elna/first）', () => {
    expect(LEGACIES.map(l => l.id).sort()).toEqual(
      ['lg_elna', 'lg_first', 'lg_galen', 'lg_lian', 'lg_twins'],
    );
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest legacy-defs`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: EchoLegacy 型を追加**

`domain/models/echo.ts` の末尾に追加:

```ts
import type { FxState } from './unlock';

/** 残響継承（先人レガシー）— トレードオフ型のビルド効果 */
export interface EchoLegacy {
  /** 一意ID（例 "lg_lian"） */
  readonly id: string;
  /** 紐づく先人ID（例 "p_lian"） */
  readonly predecessorId: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  /** 上振れの説明 */
  readonly upside: string;
  /** 下振れの説明 */
  readonly downside: string;
  /** fx デルタ（既存 FxState キーのみ） */
  readonly fx: Partial<FxState>;
}
```

注: `echo.ts` が既に `import type` を持つ場合は `FxState` を既存 import 群に統合してよい。

- [ ] **Step 4: legacy-defs.ts を作成**

`domain/constants/legacy-defs.ts`:

```ts
/**
 * 迷宮の残響 - 残響継承（先人レガシー）定義
 *
 * 先人の断片を全収集すると解禁されるトレードオフ型ビルド効果（5種）。
 * 効果は既存 FxState キーのみで表現する（combat-service 無改造）。
 */
import type { EchoLegacy } from '../models/echo';

/** レガシー定義一覧 */
export const LEGACIES: readonly EchoLegacy[] = Object.freeze([
  {
    id: 'lg_lian', predecessorId: 'p_lian', name: '記録者の継承', icon: '📜', color: '#60a5fa',
    upside: '初期情報+8・情報取得×1.3', downside: '回復×0.55・被ダメ+20%',
    fx: { infoBonus: 8, infoMult: 1.3, healMult: 0.55, hpReduce: 1.2 },
  },
  {
    id: 'lg_twins', predecessorId: 'p_twins', name: '絆の継承', icon: '♊', color: '#a0a0b8',
    upside: '一度だけ半分回復で復活', downside: '初期HP-10・初期精神-8',
    fx: { secondLife: true, hpBonus: -10, mentalBonus: -8 },
  },
  {
    id: 'lg_galen', predecessorId: 'p_galen', name: '解析者の継承', icon: '🗺', color: '#c084fc',
    upside: '危機・精神・遭遇の判定を緩和', downside: '精神被ダメ+30%',
    fx: { dangerSense: true, mentalSense: true, negotiator: true, mnReduce: 1.3 },
  },
  {
    id: 'lg_elna', predecessorId: 'p_elna', name: '守人の継承', icon: '🕯', color: '#fbbf24',
    upside: '侵蝕無効・出血半減・被ダメ-18%', downside: '初期HP-14・初期精神-12',
    fx: { drainImmune: true, bleedReduce: true, hpReduce: 0.82, mnReduce: 0.82, hpBonus: -14, mentalBonus: -12 },
  },
  {
    id: 'lg_first', predecessorId: 'p_first', name: '起源の継承', icon: '✶', color: '#ff8fa3',
    upside: '全ステ強化・回復×1.25・侵蝕無効', downside: '全被ダメ+40%（ガラスの大砲）',
    fx: { hpBonus: 10, mentalBonus: 10, infoBonus: 6, healMult: 1.25, drainImmune: true, hpReduce: 1.4, mnReduce: 1.4 },
  },
]);
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest legacy-defs`
Expected: PASS（全件）

- [ ] **Step 6: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/domain/models/echo.ts src/features/labyrinth-echo/domain/constants/legacy-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/legacy-defs.test.ts
git commit -m "feat: 迷宮の残響 残響継承レガシー5種を定義"
```

---

### Task 2: legacy-service（マージ・解禁・取得）

**Files:**
- Create: `domain/services/legacy-service.ts`
- Test: `__tests__/domain/services/legacy-service.test.ts`

**Interfaces:**
- Consumes: `LEGACIES`（Task 1）, `EchoLegacy`（Task 1）, `FxState`/`FX_MULT`/`FX_BOOL`/`FxMultKey`/`FxBoolKey`（`domain/models/unlock`）, `isPredecessorComplete`（`domain/services/echo-service`）。
- Produces:
  - `mergeLegacyIntoFx(base: FxState, legacy: EchoLegacy | null): FxState`
  - `unlockedLegacies(fragments: readonly string[]): EchoLegacy[]`
  - `getLegacyById(id: string | null): EchoLegacy | null`
  - `legacyForPredecessor(predId: string): EchoLegacy | null`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/domain/services/legacy-service.test.ts`:

```ts
import {
  mergeLegacyIntoFx, unlockedLegacies, getLegacyById, legacyForPredecessor,
} from '../../../domain/services/legacy-service';
import { computeFx } from '../../../domain/services/unlock-service';
import { LEGACIES } from '../../../domain/constants/legacy-defs';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const base = computeFx([]); // FX_DEFAULTS 相当（加算0・乗算1・ブールfalse）
const lian = LEGACIES.find(l => l.id === 'lg_lian')!;
const lianFrags = ECHO_FRAGMENTS.filter(f => f.predecessorId === 'p_lian').map(f => f.id);

describe('legacy-service', () => {
  it('mergeLegacyIntoFx(base, null) は base を不変返し（回帰）', () => {
    expect(mergeLegacyIntoFx(base, null)).toEqual(base);
  });

  it('加算キーは加算・乗算キーは乗算・ブールキーは OR', () => {
    const merged = mergeLegacyIntoFx(base, lian);
    expect(merged.infoBonus).toBe(8);      // 0 + 8
    expect(merged.infoMult).toBeCloseTo(1.3, 5); // 1 * 1.3
    expect(merged.healMult).toBeCloseTo(0.55, 5); // 1 * 0.55
    expect(merged.hpReduce).toBeCloseTo(1.2, 5);  // 1 * 1.2
  });

  it('ブール上振れが OR で立つ（lg_twins の secondLife）', () => {
    const twins = LEGACIES.find(l => l.id === 'lg_twins')!;
    expect(mergeLegacyIntoFx(base, twins).secondLife).toBe(true);
    expect(mergeLegacyIntoFx(base, twins).hpBonus).toBe(-10);
  });

  it('unlockedLegacies は完成先人のレガシーのみ返す', () => {
    expect(unlockedLegacies([])).toEqual([]);
    const unlocked = unlockedLegacies(lianFrags);
    expect(unlocked.map(l => l.id)).toEqual(['lg_lian']);
  });

  it('getLegacyById は null/不明で null、既知で該当を返す', () => {
    expect(getLegacyById(null)).toBeNull();
    expect(getLegacyById('nope')).toBeNull();
    expect(getLegacyById('lg_lian')?.id).toBe('lg_lian');
  });

  it('legacyForPredecessor は先人IDから該当レガシーを返す', () => {
    expect(legacyForPredecessor('p_lian')?.id).toBe('lg_lian');
    expect(legacyForPredecessor('p_none')).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest legacy-service`
Expected: FAIL（モジュール未解決）

- [ ] **Step 3: legacy-service.ts を作成**

`domain/services/legacy-service.ts`:

```ts
/**
 * 迷宮の残響 - LegacyService（残響継承サービス）
 *
 * レガシーの fx デルタを実効 fx に畳み込む純粋関数群。
 * 分類は computeFx と同じ（FX_MULT は乗算・FX_BOOL は OR・残りは加算）。
 */
import { FX_MULT, FX_BOOL } from '../models/unlock';
import type { FxState, FxMultKey, FxBoolKey } from '../models/unlock';
import type { EchoLegacy } from '../models/echo';
import { LEGACIES } from '../constants/legacy-defs';
import { isPredecessorComplete } from './echo-service';

/** レガシーの fx デルタを base にマージした実効 fx を返す（legacy=null なら base 不変返し） */
export const mergeLegacyIntoFx = (base: FxState, legacy: EchoLegacy | null): FxState => {
  if (!legacy) return base;
  const result: Record<string, number | boolean> = { ...base };
  for (const [k, v] of Object.entries(legacy.fx)) {
    if (FX_MULT.has(k as FxMultKey)) {
      result[k] = (result[k] as number) * (v as number);
    } else if (FX_BOOL.has(k as FxBoolKey)) {
      result[k] = (result[k] as boolean) || (v as boolean);
    } else {
      result[k] = (result[k] as number) + (v as number);
    }
  }
  return result as unknown as FxState;
};

/** 全断片収集済みの先人のレガシーだけを返す */
export const unlockedLegacies = (fragments: readonly string[]): EchoLegacy[] =>
  LEGACIES.filter(l => isPredecessorComplete(l.predecessorId, fragments));

/** IDからレガシーを取得（null/不明は null） */
export const getLegacyById = (id: string | null): EchoLegacy | null =>
  id ? LEGACIES.find(l => l.id === id) ?? null : null;

/** 先人IDからレガシーを取得（無ければ null） */
export const legacyForPredecessor = (predId: string): EchoLegacy | null =>
  LEGACIES.find(l => l.predecessorId === predId) ?? null;
```

注: `FX_MULT`/`FX_BOOL`/`FxMultKey`/`FxBoolKey` が `domain/models/unlock.ts` から export されていない場合は export を追加する（computeFx が同ファイル内で使用しているため定義は存在する）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest legacy-service`
Expected: PASS（全件）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/domain/services/legacy-service.ts src/features/labyrinth-echo/__tests__/domain/services/legacy-service.test.ts src/features/labyrinth-echo/domain/models/unlock.ts
git commit -m "feat: 迷宮の残響 legacy-service（fxマージ・解禁判定）を追加"
```

---

### Task 3: reducer に legacyId を追加

**Files:**
- Modify: `presentation/hooks/use-game-orchestrator.ts`
- Test: `__tests__/presentation/hooks/use-game-orchestrator.test.ts`（追記）

**Interfaces:**
- Produces: `GameReducerState.legacyId: string | null`、`SELECT_DIFFICULTY` に `legacyId: string | null`、`createInitialState` に `legacyId: null`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/use-game-orchestrator.test.ts` に追記:

```ts
describe('残響継承 reducer', () => {
  it('初期状態は legacyId null', () => {
    expect(createInitialState().legacyId).toBeNull();
  });
  it('SELECT_DIFFICULTY が legacyId を設定する', () => {
    const player = { hp: 50, maxHp: 50, mn: 30, maxMn: 30, inf: 5, statuses: [] };
    const diff = { id: 'normal' } as never;
    const next = gameReducer(createInitialState(), { type: 'SELECT_DIFFICULTY', difficulty: diff, player, pressure: 0, legacyId: 'lg_lian' } as never);
    expect(next.legacyId).toBe('lg_lian');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest use-game-orchestrator -t 残響継承`
Expected: FAIL

- [ ] **Step 3: reducer を更新**

`presentation/hooks/use-game-orchestrator.ts`:

`GameReducerState` に追加（`revenantsThisRun` の後）:

```ts
  readonly revenantsThisRun: number;
  /** 選択中の残響継承（レガシー）ID */
  readonly legacyId: string | null;
```

`GameAction` の `SELECT_DIFFICULTY` を更新:

```ts
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyDef; player: Player; pressure: number; legacyId: string | null }
```

`createInitialState()` に追加:

```ts
  revenantsThisRun: 0,
  legacyId: null,
```

`SELECT_DIFFICULTY` case の返却に追加:

```ts
        pressure: action.pressure,
        revenantsThisRun: 0,
        legacyId: action.legacyId,
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest use-game-orchestrator`
Expected: PASS

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`
注: `SELECT_DIFFICULTY` の必須プロパティが増えるため、既存の dispatch 呼び出し（`LabyrinthEchoGame.tsx`）と既存テストが型エラーになる。Task 4 で本配線するが、ここでは型を通すため `LabyrinthEchoGame.tsx` の dispatch に `legacyId: null` を暫定追加し、既存 orchestrator テストの SELECT_DIFFICULTY 呼び出しにも `legacyId: null` を追加すること。

```bash
git add src/features/labyrinth-echo/presentation/hooks/use-game-orchestrator.ts src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/__tests__/presentation/hooks/use-game-orchestrator.test.ts
git commit -m "feat: 迷宮の残響 reducer に残響継承 legacyId を追加"
```

---

### Task 4: presentation 配線（selectDiff・実効fx）

**Files:**
- Modify: `presentation/LabyrinthEchoGame.tsx`
- Modify: `presentation/components/GameRouter.tsx`（`GameHandlers.selectDiff` 型）
- Test: `__tests__/presentation/hooks/legacy-fx.test.ts`

**Interfaces:**
- Consumes: `mergeLegacyIntoFx`/`getLegacyById`（legacy-service）, `computeFx`/`createNewPlayer`（unlock-service）, `applyPressureToDifficulty`（pressure-service）。
- Produces: `selectDiff(d, pressure, legacyId)` が実効 fx でラン開始、run 中の fx が activeFx（レガシー反映）になる。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/presentation/hooks/legacy-fx.test.ts`:

```tsx
import { mergeLegacyIntoFx, getLegacyById } from '../../../domain/services/legacy-service';
import { computeFx, createNewPlayer } from '../../../domain/services/unlock-service';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';

/**
 * selectDiff が「圧→実効難易度」と「レガシー→実効fx」を合成して
 * 初期プレイヤーを作る計算を、純粋関数の組み合わせとして固定する。
 */
describe('残響継承の実効fx適用', () => {
  it('lg_lian の infoBonus が初期情報に乗る', () => {
    const base = computeFx([]);
    const fx = mergeLegacyIntoFx(base, getLegacyById('lg_lian'));
    const normal = DIFFICULTY.find(d => d.id === 'normal')!;
    const player = createNewPlayer(normal, fx);
    // BASE_INF(5) + infoBonus(8) = 13
    expect(player.inf).toBe(13);
  });

  it('lg_twins の負の初期値が初期HP/精神を下げる', () => {
    const base = computeFx([]);
    const fx = mergeLegacyIntoFx(base, getLegacyById('lg_twins'));
    const normal = DIFFICULTY.find(d => d.id === 'normal')!;
    const player = createNewPlayer(normal, fx);
    // BASE_HP(52) + hpBonus(-10) = 42、BASE_MN(33) + mentalBonus(-8) = 25
    expect(player.hp).toBe(42);
    expect(player.mn).toBe(25);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest legacy-fx`
Expected: 純粋関数の合成のため初回から PASS しうる。これは「実効fxの計算仕様」を固定するテスト。実コードの配線は Step 3 で行い、Step 5 の回帰で担保する（Phase 3 の純粋テストと同方針）。

- [ ] **Step 3: LabyrinthEchoGame を配線**

`presentation/LabyrinthEchoGame.tsx`:

import に追加:

```ts
import { mergeLegacyIntoFx, getLegacyById } from '../domain/services/legacy-service';
```

既存 `const fx = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);` を base fx として残しつつ、run 中の実効 fx を導出（`state.legacyId` 依存）。`fx` を使っている箇所のうち **run 中の戦闘に使う fx を activeFx に差し替える**。具体的には:

```ts
  const baseFx = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);
  const activeFx = useMemo(
    () => mergeLegacyIntoFx(baseFx, getLegacyById(state.legacyId)),
    [baseFx, state.legacyId],
  );
```

`selectDiff`（Task 3 で `legacyId: null` 暫定の箇所）を本配線:

```ts
  const selectDiff = useCallback((d: DifficultyDef, pressure: number, legacyId: string | null) => {
    enableAudio();
    const eff = applyPressureToDifficulty(d, pressure);
    const runFx = mergeLegacyIntoFx(baseFx, getLegacyById(legacyId));
    const player = createNewPlayer(eff, runFx);
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty: eff, player, pressure, legacyId });
  }, [enableAudio, baseFx]);
```

`useGameActions` に渡す `fx` を `activeFx` に変更（run 中の processChoice/computeDrain がレガシー反映の fx を使う）。`DiffSelectScreen` には `baseFx`（レガシー未適用）を渡す（プレビューは画面内で合成する）。`createNewPlayer` の初回呼び出し等で base fx を使っている箇所は、run 開始は selectDiff 経由なので activeFx 化の対象は useGameActions の fx のみ。

注: 既存で `fx` という変数名を直接参照している箇所を `baseFx`/`activeFx` に正しく振り分けること（DiffSelectScreen=baseFx、useGameActions=activeFx）。

`GameRouter.tsx` の `GameHandlers.selectDiff` 型を更新:

```ts
  selectDiff: (d: DifficultyDef, pressure: number, legacyId: string | null) => void;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest legacy-fx`
Expected: PASS

- [ ] **Step 5: 回帰・型チェック**

Run: `npx jest use-game && npm run typecheck`
Expected: PASS（継承なし=従来通り。selectDiff 新シグネチャに型追従）

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/presentation/components/GameRouter.tsx src/features/labyrinth-echo/__tests__/presentation/hooks/legacy-fx.test.ts
git commit -m "feat: 迷宮の残響 レガシーを実効fxに畳み込みrunへ配線"
```

---

### Task 5: 難易度選択画面の継承セレクタ

**Files:**
- Modify: `components/DiffSelectScreen.tsx`
- Test: `__tests__/diff-select-screen.test.tsx`（追記）

**Interfaces:**
- Consumes: `unlockedLegacies`/`mergeLegacyIntoFx`/`getLegacyById`（legacy-service）。`selectDiff: (d, pressure, legacyId) => void`。
- Produces: 継承セレクタ（解禁済みが1つ以上のときのみ）。選択でプレビュー追従、難易度クリックで `selectDiff(d, pressure, legacyId)`。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/diff-select-screen.test.tsx` の「DiffSelectScreen 残響圧」describe の後に追記。全断片収集済みの meta を作るヘルパを用意:

```tsx
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';

const allFrags = ECHO_FRAGMENTS.map(f => f.id);

describe('DiffSelectScreen 残響継承', () => {
  it('解禁レガシーが無いとき継承セレクタを出さない', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 0, fragments: [] }) })} />);
    expect(screen.queryByText(/継承/)).toBeNull();
  });

  it('解禁レガシーがあるとき継承セレクタを表示する', () => {
    render(<DiffSelectScreen {...basePressureProps({ meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    expect(screen.getByText(/継承/)).toBeInTheDocument();
    expect(screen.getByText('記録者の継承')).toBeInTheDocument();
  });

  it('継承を選び難易度を選ぶと selectDiff に legacyId が渡る', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff, meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    fireEvent.click(screen.getByText('記録者の継承'));
    fireEvent.click(screen.getByText('挑戦者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'normal' }), 0, 'lg_lian');
  });

  it('既定（継承なし）では legacyId が null で渡る', () => {
    const selectDiff = jest.fn();
    render(<DiffSelectScreen {...basePressureProps({ selectDiff, meta: createMetaState({ echoDepth: 3, fragments: allFrags }) })} />);
    fireEvent.click(screen.getByText('探索者').closest('button')!);
    expect(selectDiff).toHaveBeenCalledWith(expect.objectContaining({ id: 'easy' }), 0, null);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest diff-select-screen -t 残響継承`
Expected: FAIL（継承セレクタ未実装 / selectDiff が2引数）

- [ ] **Step 3: DiffSelectScreen に継承セレクタを実装**

`components/DiffSelectScreen.tsx`:

import に追加:

```ts
import { unlockedLegacies, mergeLegacyIntoFx, getLegacyById } from '../domain/services/legacy-service';
```

`selectDiff` の型を更新（Props）:

```ts
  selectDiff: (d: DifficultyDef, pressure: number, legacyId: string | null) => void;
```

コンポーネント本体で、圧の state の近くに継承の state と解禁一覧を用意:

```tsx
  const legacies = unlockedLegacies(meta.fragments);
  const [legacyId, setLegacyId] = useState<string | null>(null);
  const selectedLegacy = getLegacyById(legacyId);
  // レガシー反映後の実効 fx（プレビュー用）
  const previewFx = mergeLegacyIntoFx(fx, selectedLegacy);
```

圧セレクタ行の後に継承セレクタ行を追加（`legacies.length > 0` のときのみ）:

```tsx
        {legacies.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: 20, fontFamily: "var(--sans)" }}>
            <div style={{ fontSize: 12, color: "#fbbf24", letterSpacing: 2, marginBottom: 6 }}>残響継承</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setLegacyId(null)} style={{
                padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "var(--sans)",
                background: legacyId === null ? "rgba(99,102,241,0.18)" : "rgba(20,20,35,0.4)",
                border: `1px solid ${legacyId === null ? "rgba(99,102,241,0.6)" : "rgba(60,60,80,0.3)"}`,
                color: legacyId === null ? "#a5b4fc" : "#505070",
              }}>継承なし</button>
              {legacies.map(l => (
                <button key={l.id} onClick={() => setLegacyId(l.id)} style={{
                  padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "var(--sans)",
                  background: legacyId === l.id ? `${l.color}22` : "rgba(20,20,35,0.4)",
                  border: `1px solid ${legacyId === l.id ? `${l.color}99` : "rgba(60,60,80,0.3)"}`,
                  color: legacyId === l.id ? l.color : "#505070",
                }}>{l.icon} {l.name}</button>
              ))}
            </div>
            {selectedLegacy && (
              <div style={{ fontSize: 10, marginTop: 8, lineHeight: 1.7 }}>
                <span style={{ color: "#4ade80" }}>＋{selectedLegacy.upside}</span>
                <span style={{ color: "#505070" }}> ／ </span>
                <span style={{ color: "#f87171" }}>−{selectedLegacy.downside}</span>
              </div>
            )}
          </div>
        )}
```

DiffCard のプレビュー hp/mn を `previewFx` ベースに変更し、onSelect に legacyId を渡す:

```tsx
        {DIFFICULTY.map(d => {
          const eff = applyPressureToDifficulty(d, p);
          return (
            <DiffCard key={d.id} d={eff}
              hp={CFG.BASE_HP + previewFx.hpBonus + eff.modifiers.hpMod}
              mn={CFG.BASE_MN + previewFx.mentalBonus + eff.modifiers.mnMod}
              inf={CFG.BASE_INF + previewFx.infoBonus}
              cleared={meta.clearedDifficulties?.includes(d.id)}
              onSelect={() => selectDiff(d, p, legacyId)} />
          );
        })}
```

注: 既存の `fx`（Props 名）は base fx。`previewFx` は画面内で合成。`onSelect` は base `d` を捕捉（圧/レガシーは selectDiff/活性fx 側で適用）。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest diff-select-screen`
Expected: PASS（既存テスト含む。既存の `selectDiff` 期待値が2引数なら3引数 `, null` に追随）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/components/DiffSelectScreen.tsx src/features/labyrinth-echo/__tests__/diff-select-screen.test.tsx
git commit -m "feat: 迷宮の残響 難易度選択に残響継承セレクタを追加"
```

---

### Task 6: 書庫の継承解禁表示と実行中バッジ

**Files:**
- Modify: `components/ArchiveScreen.tsx`（完成先人に継承解禁表示）
- Modify: `components/FloorIntroScreen.tsx`（実行中の継承バッジ）
- Modify: `presentation/components/GameRouter.tsx`（legacy を FloorIntro へ伝播）
- Test: `__tests__/archive-screen.test.tsx`（追記）

**Interfaces:**
- Consumes: `legacyForPredecessor`/`getLegacyById`（legacy-service）。
- Produces: 完成先人カードに「継承解禁：〈名〉」、フロア紹介に継承バッジ。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/archive-screen.test.tsx` に追記:

```tsx
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';

it('全断片収集した先人カードに継承解禁が表示される', () => {
  const lianFrags = ECHO_FRAGMENTS.filter(f => f.predecessorId === 'p_lian').map(f => f.id);
  render(<ArchiveScreen Particles={null} meta={createMetaState({ echoDepth: 2, fragments: lianFrags })} setPhase={() => undefined} />);
  expect(screen.getByText(/継承解禁/)).toBeInTheDocument();
  expect(screen.getByText(/記録者の継承/)).toBeInTheDocument();
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest archive-screen -t 継承解禁`
Expected: FAIL

- [ ] **Step 3: ArchiveScreen に継承解禁表示を追加**

`components/ArchiveScreen.tsx`:

import に追加:

```ts
import { legacyForPredecessor } from '../domain/services/legacy-service';
```

`complete && p.summary` を表示している箇所（先人カードの discovered ブロック内）に、`complete` のとき継承解禁行を追加:

```tsx
                    {complete && (() => {
                      const lg = legacyForPredecessor(p.id);
                      return lg ? (
                        <div style={{ fontSize: 10, color: lg.color, marginTop: 6, fontFamily: 'var(--sans)', lineHeight: 1.6 }}>
                          継承解禁：{lg.icon} {lg.name}
                          <div style={{ color: '#707090' }}>＋{lg.upside} ／ −{lg.downside}</div>
                        </div>
                      ) : null;
                    })()}
```

- [ ] **Step 4: FloorIntroScreen に継承バッジを追加**

`components/FloorIntroScreen.tsx` の Props に `legacy?: EchoLegacy | null` を追加し、見出し付近にバッジを表示（legacy があるとき）:

```tsx
      {legacy && (
        <div style={{ fontSize: 11, color: legacy.color, fontFamily: "var(--sans)", marginTop: 4 }}>
          継承：{legacy.icon} {legacy.name}
        </div>
      )}
```

`presentation/components/GameRouter.tsx`: `FloorIntroScreen` の呼び出しに `legacy={getLegacyById(game.legacyId ?? null)}` を渡す（import `getLegacyById`、`game` に `legacyId` を含めるか `derived` 経由で伝播。reducer state に legacyId があるため `game.legacyId` を GameState 型に追加して渡す）。

注: `GameRouter` の `GameState` インターフェースに `legacyId: string | null` を追加し、`LabyrinthEchoGame` から `game` に `legacyId: state.legacyId` を含めて渡す。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest archive-screen`
Expected: PASS

- [ ] **Step 6: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/components/ArchiveScreen.tsx src/features/labyrinth-echo/components/FloorIntroScreen.tsx src/features/labyrinth-echo/presentation/components/GameRouter.tsx src/features/labyrinth-echo/presentation/LabyrinthEchoGame.tsx src/features/labyrinth-echo/__tests__/archive-screen.test.tsx
git commit -m "feat: 迷宮の残響 書庫の継承解禁表示と実行中の継承バッジを追加"
```

---

### Task 7: シミュレータの legacy 対応

**Files:**
- Modify: `simulation/run-simulator.ts`
- Test: `__tests__/simulation/run-simulator.test.ts`（追記）

**Interfaces:**
- Consumes: `mergeLegacyIntoFx`（legacy-service）, `EchoLegacy`（echo model）。
- Produces: `simulateRun` の params に `legacy?: EchoLegacy | null`（既定 null）。内部で fx にマージ。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/simulation/run-simulator.test.ts` に追記:

```ts
import { getLegacyById } from '../../domain/services/legacy-service';

describe('simulateRun legacy 対応', () => {
  it('legacy 未指定（既定null）は現状と同一結果（回帰）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(321), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(321), policy: CAREFUL_POLICY, events: EVENTS, legacy: null });
    expect(a).toEqual(b);
  });

  it('lg_first（被ダメ+40%）は同一シードで生還しにくくなる傾向（80シード集計で <= 継承なし）', () => {
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1);
    const rate = (legacy: ReturnType<typeof getLegacyById>) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure: 3, legacy }).survived).length / seeds.length;
    expect(rate(getLegacyById('lg_first'))).toBeLessThanOrEqual(rate(null));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest run-simulator -t legacy`
Expected: FAIL（legacy 未対応）

- [ ] **Step 3: simulateRun を legacy 対応に更新**

`simulation/run-simulator.ts`:

import に追加:

```ts
import { mergeLegacyIntoFx } from '../domain/services/legacy-service';
import type { EchoLegacy } from '../domain/models/echo';
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
  legacy?: EchoLegacy | null;
}): RunResult => {
  const { difficulty: baseDifficulty, fx: baseFx, rng, policy, events, pressure = 0, meta = SIM_META, legacy = null } = params;
  const difficulty = applyPressureToDifficulty(baseDifficulty, pressure);
  const fx = mergeLegacyIntoFx(baseFx, legacy);
  // ...（以降 createNewPlayer(difficulty, fx)・processChoice で fx を使用）
```

注: 既存の `fx` 参照を、マージ後の `fx`（ローカル）に置換する。`params.fx` を直接使っていた箇所が無いか確認すること。

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest run-simulator`
Expected: PASS（回帰含む）

- [ ] **Step 5: 型チェック＋コミット**

Run: `npm run typecheck`（エラーなし）

```bash
git add src/features/labyrinth-echo/simulation/run-simulator.ts src/features/labyrinth-echo/__tests__/simulation/run-simulator.test.ts
git commit -m "feat: 迷宮の残響 シミュレータを残響継承対応に拡張"
```

---

### Task 8: レガシーのバランス契約（単調性・健全帯・トレードオフ）

**Files:**
- Modify: `__tests__/domain/services/balance-contract.test.ts`（追記）

**Interfaces:**
- Consumes: `simulateRun`（legacy 対応）, `LEGACIES`/`getLegacyById`（legacy）, 既存 `N`/`SEEDS`/`BASE_FX`/`CAREFUL_POLICY`/`DIFFICULTY`。

- [ ] **Step 1: 契約テストを追記**

`__tests__/domain/services/balance-contract.test.ts` の末尾に追記:

```ts
import { LEGACIES } from '../../../domain/constants/legacy-defs';

const legacySurvival = (diffId: string, legacyId: string | null, pressure = 0): number => {
  const difficulty = DIFFICULTY.find(x => x.id === diffId)!;
  const legacy = legacyId ? LEGACIES.find(l => l.id === legacyId)! : null;
  const survived = SEEDS.filter(s =>
    simulateRun({ difficulty, fx: BASE_FX, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS_P3, pressure, legacy }).survived,
  ).length;
  return survived / N;
};

describe('バランス契約 残響継承', () => {
  it('各レガシーで careful Normal 生還率が健全帯 0.40–0.95', () => {
    for (const l of LEGACIES) {
      const s = legacySurvival('normal', l.id);
      expect(s).toBeGreaterThanOrEqual(0.40);
      expect(s).toBeLessThanOrEqual(0.95);
    }
  });

  it('各レガシーで難易度の単調性が保たれる（easy>=normal>=hard>=abyss）', () => {
    for (const l of LEGACIES) {
      const e = legacySurvival('easy', l.id);
      const n = legacySurvival('normal', l.id);
      const h = legacySurvival('hard', l.id);
      const a = legacySurvival('abyss', l.id);
      expect(e).toBeGreaterThanOrEqual(n);
      expect(n).toBeGreaterThanOrEqual(h);
      expect(h).toBeGreaterThanOrEqual(a);
    }
  });

  it('下振れが効く: 起源（lg_first, 被ダメ+40%）は圧3で継承なしより生還率が下がる', () => {
    expect(legacySurvival('normal', 'lg_first', 3)).toBeLessThanOrEqual(legacySurvival('normal', null, 3));
  });
});
```

注: `EVENTS_P3`/`N`/`SEEDS`/`BASE_FX`/`CAREFUL_POLICY`/`DIFFICULTY`/`SeededRandomSource`/`simulateRun` は Phase 3 までの同ファイル定義/import を再利用。**新規追加は `LEGACIES`（legacy-defs）のみ**。`mergeLegacyIntoFx` はテストでは使わない（simulateRun が内部適用）。`legacy` 変数は `LEGACIES.find` で取得。

- [ ] **Step 2: テストを実行し実測する**

Run: `npx jest balance-contract`
Expected: 単調性は概ね PASS。健全帯/下振れが外れる場合は実測値を確認。

- [ ] **Step 3: 健全帯/トレードオフ未達なら legacy の fx デルタを較正**

- あるレガシーの Normal 生還率が 0.95 超（自明化）→ そのレガシーの上振れを弱める（例 lg_elna の被ダメ軽減 0.82→0.88、または下振れを強める）。
- 0.40 未満（破綻）→ 下振れを緩める。
- 起源が継承なしより下がらない → lg_first の hpReduce/mnReduce を 1.4→1.5 に強める。
- **較正は legacy の fx デルタのみ**。難易度設計値（Phase 2）・escalation 係数（Phase 3）は不変。較正したら `legacy-defs.test`/`legacy-service.test` の該当期待値も追随。
- 単調性を最優先。健全帯/トレードオフは方向の合格基準。

- [ ] **Step 4: 全契約テストが通ることを確認**

Run: `npx jest balance-contract legacy-defs legacy-service`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-echo/__tests__/domain/services/balance-contract.test.ts src/features/labyrinth-echo/domain/constants/legacy-defs.ts src/features/labyrinth-echo/__tests__/domain/constants/legacy-defs.test.ts
git commit -m "test: 迷宮の残響 残響継承のバランス契約（単調性・健全帯・トレードオフ）を追加・較正"
```

---

### Task 9: README 更新と全体 CI 確認

**Files:**
- Modify: `src/features/labyrinth-echo/README.md`

- [ ] **Step 1: README に残響継承を追記**

`README.md` の「### ゲームシステム」リスト（エスカレーションの後）に追加:

```markdown
- **残響継承（Phase 4）**: 先人の断片を全収集すると、その先人の「継承（レガシー）」が解禁。難易度選択で1つを排他選択でき、トレードオフ型の効果（例: 記録者=情報強化だが打たれ弱い／起源=全強化だが被ダメ+40%）で毎回違うビルドに挑める。継承なしは従来通り（回帰なし）、各レガシーの単調性・健全帯をバランス契約テストで保護
```

- [ ] **Step 2: 関連テストを一括実行**

Run: `npx jest legacy run-simulator balance-contract diff-select archive use-game migrate`
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
git commit -m "docs: 迷宮の残響 README に残響継承（Phase 4）を追記"
```

---

## 完了時の受け入れ基準（spec §9 対応）

- [x] 先人の全断片収集でその先人のレガシーが解禁（Task 1, 2, 5）
- [x] run 開始時に解禁済みレガシーを排他選択でき実効 fx に反映（Task 3, 4, 5）
- [x] 継承なしで Phase 3 完全一致（回帰なし）（Task 2, 4, 7, 8）
- [x] 5レガシーが単調性・健全帯を満たし下振れが効く（Task 8）
- [x] 継承セレクタ・書庫の継承解禁表示・実行中バッジが機能（Task 5, 6）
- [x] `npm run ci` グリーン（Task 9）

## 申し送り（Phase 5 以降）

- Phase 5（第6階層＋真END）で `echoDepth` が 7+ に拡張。起源の継承（終盤解禁）と真ENDの相性が良い。
- 継承×圧×難易度の3次元バランスは simulator で随時検証可能。
