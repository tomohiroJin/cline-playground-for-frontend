# PRIMAL PATH キーストーンのドラフト混入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 進化ドラフト（進化選択画面）に、未取得キーストーンを低確率で1枚混入させ、選んだら取得してバトルへ進めるようにする（節目提示に加わる2つ目の入手経路、spec②）。

**Architecture:** 別チャネル方式。`evoPicks: Evolution[]` は変更せず、`GameState.evoKeystone?: KeystoneDef` を追加。進化ドラフトを生成する各箇所で `rollDraftKeystone`（低確率・未取得のみ）を併せて転がして `evoKeystone` に格納。`EvolutionScreen` はそれを進化カードとは別の専用カードとして1枚描画し、選択で新アクション `SELECT_DRAFT_KEYSTONE` を dispatch → `applyKeystone` → `startBattle` → battle。進化のプレビュー描画ロジックには一切触れない。

**Tech Stack:** React 19 + TypeScript / useReducer フェーズステートマシン / Jest 30 + @testing-library/react / styled-components

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数名・関数名）は英語可。
- `any` 型禁止。`null` より `undefined` を優先。
- ドメイン層（`domain/`）は純粋関数。`presentation`/`infrastructure` を参照しない。
- 定数は `Object.freeze`。名前付きエクスポート。
- TDD（Red → Green → Refactor）。テストは `__tests__/` に `*.test.ts(x)`。
- Conventional Commits（日本語）。1コミット＝1論理変更。
- 既存テスト（Phase 2b マージ後の全グリーン）を壊さない。`GameState` への新フィールドは optional。
- 2 barrel（`types.ts`・`types/index.ts`）。新型を足す場合は両方に export（本計画は既存 `KeystoneDef` のみ使用＝新型なし）。
- **テストで `new RegExp(動的値)` を使わない**（`security/detect-non-literal-regexp` で `lint:ci --max-warnings 0` が失敗する）。部分一致は `getByText(s, { exact: false })`。
- Phase 2a/2b 実装済み: `applyKeystone`・`unownedKeystones`・`hasKeystone`・`SELECT_KEYSTONE`・`KeystoneDef`・`KEYSTONES`。再実装しない。
- 検証コマンド: `npm test`、`npm run typecheck`、`npm run lint:ci`（パイプせず実 exit を確認）。

## 設計判断（実装者は遵守）

- **別チャネル**: `evoPicks` の型は変えない。`evoKeystone?: KeystoneDef` を GameState に追加。
- **低確率**: `DRAFT_KEYSTONE_RATE = 0.12`（12%）。未取得キーストーンが残っている時のみ、各進化ドラフトで確率判定し、当たれば未取得から1枚を選ぶ。
- **取得済み除外**: `unownedKeystones`（Phase 2b）で未取得のみを対象。未取得0なら混入しない。
- **節目提示とは別アクション**: ドラフトのキーストーン選択は `SELECT_DRAFT_KEYSTONE { id }`。`applyKeystone` 後に `startBattle` → `phase: 'battle'`（進化選択と同じくバトルへ直行）。節目用の `SELECT_KEYSTONE`（→`continueAfterBiome`）とは経路が異なるため別アクションにする。
- **maxEvo 時は混入しない**: 進化上限到達（`isMaxEvoReached`）時はスキップUIのみ表示するため、キーストーンカードも描画しない（`evoKeystone` があっても maxEvo 時は無視）。

---

## File Structure

**修正:**
- `src/features/primal-path/constants/keystone.ts` — `DRAFT_KEYSTONE_RATE` 定数追加。
- `src/features/primal-path/constants/index.ts` — `DRAFT_KEYSTONE_RATE` re-export。
- `src/features/primal-path/domain/keystone/keystone-service.ts` — `rollDraftKeystone` 追加。
- `src/features/primal-path/game-logic.ts` — `rollDraftKeystone` re-export。
- `src/features/primal-path/types/game-state.ts` — `GameState.evoKeystone?` 追加。
- `src/features/primal-path/hooks/use-game-state.ts` — `initialState` に `evoKeystone: undefined`。
- `src/features/primal-path/hooks/actions.ts` — `SELECT_DRAFT_KEYSTONE` 追加。
- `src/features/primal-path/hooks/reducer-helpers.ts` — 3つの evo ロール箇所で `evoKeystone` を設定。
- `src/features/primal-path/hooks/reducers/evolution-reducer.ts` — evo ロール箇所で `evoKeystone` 設定＋`SELECT_DRAFT_KEYSTONE` ハンドラ。
- `src/features/primal-path/components/EvolutionScreen.tsx` — キーストーン専用カード描画。
- `src/features/primal-path/README.md` — 入手経路にドラフト混入を追記。
- テスト: `__tests__/keystone-service.test.ts`・`reducer.test.ts`・`EvolutionScreen.test.tsx`。

---

## Task 1: rollDraftKeystone（低確率抽選）＋ 定数

**Files:**
- Modify: `src/features/primal-path/constants/keystone.ts`, `src/features/primal-path/constants/index.ts`
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`, `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Consumes: `unownedKeystones`（Phase 2b）、`KEYSTONES`
- Produces:
  - `const DRAFT_KEYSTONE_RATE = 0.12`
  - `function rollDraftKeystone(r: RunState, rng?: () => number): KeystoneDef | undefined`（`rng() < DRAFT_KEYSTONE_RATE` かつ未取得が残れば未取得から1枚、それ以外は `undefined`）

- [ ] **Step 1: テストを追記（失敗する）**

`__tests__/keystone-service.test.ts` の末尾に追記:

```typescript
import { rollDraftKeystone } from '../game-logic';
import { DRAFT_KEYSTONE_RATE } from '../constants';

describe('rollDraftKeystone', () => {
  it('確率判定に外れたら undefined', () => {
    const r = makeRun({ keystones: [] });
    // rng が rate 以上 → 混入しない
    expect(rollDraftKeystone(r, () => 0.99)).toBeUndefined();
  });

  it('確率判定に当たれば未取得キーストーンを1枚返す', () => {
    const r = makeRun({ keystones: [] });
    const k = rollDraftKeystone(r, () => 0);
    expect(k).toBeDefined();
    expect(r.keystones?.includes(k!.id)).toBe(false);
  });

  it('未取得が0なら当たっても undefined', () => {
    const r = makeRun({ keystones: KEYSTONES.map(x => x.id) });
    expect(rollDraftKeystone(r, () => 0)).toBeUndefined();
  });

  it('DRAFT_KEYSTONE_RATE は 0〜1 の低確率', () => {
    expect(DRAFT_KEYSTONE_RATE).toBeGreaterThan(0);
    expect(DRAFT_KEYSTONE_RATE).toBeLessThan(0.5);
  });
});
```

> `KEYSTONES` は同テストファイル冒頭で既に import 済み（Phase 2a/2b）。重複 import しないこと。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（`rollDraftKeystone`/`DRAFT_KEYSTONE_RATE` 未定義）

- [ ] **Step 3: 定数を追加**

`constants/keystone.ts` の末尾に追加:

```typescript
/** 進化ドラフトにキーストーンが混入する確率（低確率） */
export const DRAFT_KEYSTONE_RATE = 0.12;
```

`constants/index.ts` の `export { KEYSTONES } from './keystone';` を更新:

```typescript
export { KEYSTONES, DRAFT_KEYSTONE_RATE } from './keystone';
```

- [ ] **Step 4: rollDraftKeystone を実装**

`keystone-service.ts` の import に `DRAFT_KEYSTONE_RATE` を追加（`KEYSTONES, TOTEMS` の行へ）:

```typescript
import { KEYSTONES, TOTEMS, DRAFT_KEYSTONE_RATE } from '../../constants';
```

末尾に追加:

```typescript
/** 進化ドラフトに低確率で混入する未取得キーストーンを1枚返す（外れ/未取得0なら undefined） */
export function rollDraftKeystone(r: RunState, rng: () => number = Math.random): KeystoneDef | undefined {
  if (rng() >= DRAFT_KEYSTONE_RATE) return undefined;
  const pool = unownedKeystones(r);
  if (pool.length === 0) return undefined;
  return pool[Math.floor(rng() * pool.length)];
}
```

- [ ] **Step 5: game-logic から re-export**

`game-logic.ts` のキーストーンサービス export 行に `rollDraftKeystone` を追加。

- [ ] **Step 6: テスト成功 ＋ typecheck**

Run: `npm test -- keystone-service && npm run typecheck`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/constants/keystone.ts src/features/primal-path/constants/index.ts src/features/primal-path/domain/keystone/keystone-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "feat: 進化ドラフトへのキーストーン低確率抽選 rollDraftKeystone を追加"
```

---

## Task 2: GameState.evoKeystone ＋ SELECT_DRAFT_KEYSTONE ＋ ドラフト生成箇所への配線

**Files:**
- Modify: `src/features/primal-path/types/game-state.ts`
- Modify: `src/features/primal-path/hooks/use-game-state.ts`
- Modify: `src/features/primal-path/hooks/actions.ts`
- Modify: `src/features/primal-path/hooks/reducer-helpers.ts`
- Modify: `src/features/primal-path/hooks/reducers/evolution-reducer.ts`
- Test: `src/features/primal-path/__tests__/reducer.test.ts`

**Interfaces:**
- Consumes: `rollDraftKeystone`（Task 1）、`applyKeystone`/`startBattle`（既存）
- Produces:
  - `GameState.evoKeystone?: import('./keystone').KeystoneDef`
  - Action `{ type: 'SELECT_DRAFT_KEYSTONE'; id: KeystoneId }`（`EvolutionAction` に追加）
  - 進化フェーズへ遷移する全箇所で `evoKeystone: rollDraftKeystone(<run>)` を設定

- [ ] **Step 1: テストを書く（失敗する）**

`__tests__/reducer.test.ts` に追記:

```typescript
import { KEYSTONES } from '../constants';

describe('ドラフトキーストーン選択', () => {
  it('SELECT_DRAFT_KEYSTONE で applyKeystone されバトルへ遷移する', () => {
    const run = makeRun({ keystones: [], cBT: 'grassland', cW: 0, wpb: 5 });
    const s0 = { ...initialState(), phase: 'evo' as const, run,
      evoKeystone: KEYSTONES[0] };
    const s1 = gameReducer(s0, { type: 'SELECT_DRAFT_KEYSTONE', id: KEYSTONES[0].id });
    expect(s1.run?.keystones).toContain(KEYSTONES[0].id);
    expect(s1.phase).toBe('battle');
    expect(s1.evoKeystone).toBeUndefined();
  });
});
```

> `makeRun` の `cBT`/`cW`/`wpb` は `startBattle`（敵生成）が成立する値にすること。`startBattle` は `cBT` のバイオームで敵を生成するため、有効なバイオーム ID（'grassland' 等）が必要。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- reducer`
Expected: FAIL（`SELECT_DRAFT_KEYSTONE` 未処理）

- [ ] **Step 3: GameState と initialState を更新**

`types/game-state.ts` の `GameState` に追加（`keystonePicks?` の near）:

```typescript
  /** 進化ドラフトに混入したキーストーン（無ければ undefined） */
  evoKeystone?: import('./keystone').KeystoneDef;
```

`use-game-state.ts` の `initialState` の `keystonePicks: [],` の後に追加:

```typescript
    evoKeystone: undefined,
```

- [ ] **Step 4: SELECT_DRAFT_KEYSTONE アクションを追加**

`actions.ts` の `EvolutionAction` に追加:

```typescript
  | { type: 'SELECT_DRAFT_KEYSTONE'; id: KeystoneId }
```

`EVOLUTION_TYPES` セットに `'SELECT_DRAFT_KEYSTONE'` を追加。`actions.ts` の import に `KeystoneId` が無ければ追加（`'../types'` から）。

- [ ] **Step 5: evolution-reducer に SELECT_DRAFT_KEYSTONE を実装**

`evolution-reducer.ts` の import に `applyKeystone` を追加（`game-logic` から）:

```typescript
import {
  applyEvo, startBattle, checkAwakeningRules, rollE,
  applyAwkFx, applyKeystone,
} from '../../game-logic';
```

`SELECT_EVO` ケースの後に追加:

```typescript
    case 'SELECT_DRAFT_KEYSTONE': {
      if (!state.run) return state;
      const run = applyKeystone(state.run, action.id);
      const battleRun = startBattle(run, state.finalMode);
      return { ...state, run: battleRun, phase: 'battle', evoKeystone: undefined };
    }
```

- [ ] **Step 6: 進化ドラフト生成箇所に evoKeystone を配線**

`reducer-helpers.ts` の import に `rollDraftKeystone` を追加（既存の `shouldOfferKeystone, rollKeystones` の行へ）。`evoPicks = rollE(...)` を返す3箇所（`continueAfterBiome` の auto 分岐、`transitionToEvoPicks`、`setupInitialRun`）の `phase: 'evo'` 戻り値に `evoKeystone: rollDraftKeystone(<同じ run>)` を追加する。例（`transitionToEvoPicks`）:

```typescript
export function transitionToEvoPicks(state: GameState, run: RunState): GameState {
  const evoPicks = rollE(run);
  return { ...state, run, phase: 'evo', evoPicks, evoKeystone: rollDraftKeystone(run) };
}
```

`continueAfterBiome` の auto 分岐は `autoRun` を、`setupInitialRun` は `next` を、それぞれ `rollDraftKeystone` に渡すこと。

`evolution-reducer.ts` の `PROCEED_AFTER_AWK`（覚醒後に evo を再ロールする箇所、`const evoPicks = rollE(state.run);` 付近）も同様に `evoKeystone: rollDraftKeystone(state.run)` を戻り値へ追加する。

- [ ] **Step 7: テスト成功 ＋ typecheck ＋ 回帰**

Run: `npm test -- reducer progression && npm run typecheck`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/primal-path/types/game-state.ts src/features/primal-path/hooks/use-game-state.ts src/features/primal-path/hooks/actions.ts src/features/primal-path/hooks/reducer-helpers.ts src/features/primal-path/hooks/reducers/evolution-reducer.ts src/features/primal-path/__tests__/reducer.test.ts
git commit -m "feat: evoKeystone と SELECT_DRAFT_KEYSTONE を配線しドラフト生成に混入"
```

---

## Task 3: EvolutionScreen にキーストーン専用カードを描画

**Files:**
- Modify: `src/features/primal-path/components/EvolutionScreen.tsx`
- Test: `src/features/primal-path/__tests__/EvolutionScreen.test.tsx`

**Interfaces:**
- Consumes: `GameState.evoKeystone`（Task 2）、`SELECT_DRAFT_KEYSTONE`（Task 2）、`PowerCurve`
- Produces: `EvolutionScreen` props に `evoKeystone?: KeystoneDef` を追加。進化上限でない時に、`evoKeystone` があれば専用カードを1枚描画し、クリックで `SELECT_DRAFT_KEYSTONE { id }` を dispatch。

- [ ] **Step 1: UI テストを追記（失敗する）**

`__tests__/EvolutionScreen.test.tsx` の末尾に追記（既存の import・render パターンに合わせる。`run`/`evoPicks` のモックは既存テストを参照）:

```typescript
import { KEYSTONES } from '../constants';

describe('EvolutionScreen — ドラフトキーストーン', () => {
  // 既存テストの run/evoPicks 生成ヘルパーに合わせて最小の run を用意すること
  const baseRun = makeRun({ evs: [], cBT: 'grassland', cW: 1, wpb: 5 });

  it('evoKeystone があれば専用カード（名前）を表示する', () => {
    render(
      <EvolutionScreen run={baseRun} evoPicks={[]} evoKeystone={KEYSTONES[0]}
        dispatch={jest.fn()} playSfx={jest.fn()} battleSpd={750} />,
    );
    expect(screen.getByText(KEYSTONES[0].nm, { exact: false })).toBeInTheDocument();
  });

  it('キーストーンカードのクリックで SELECT_DRAFT_KEYSTONE を dispatch する', () => {
    const dispatch = jest.fn();
    render(
      <EvolutionScreen run={baseRun} evoPicks={[]} evoKeystone={KEYSTONES[0]}
        dispatch={dispatch} playSfx={jest.fn()} battleSpd={750} />,
    );
    fireEvent.click(screen.getByText(KEYSTONES[0].nm, { exact: false }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_DRAFT_KEYSTONE', id: KEYSTONES[0].id }),
    );
  });

  it('evoKeystone が undefined ならキーストーンカードを表示しない', () => {
    render(
      <EvolutionScreen run={baseRun} evoPicks={[]} evoKeystone={undefined}
        dispatch={jest.fn()} playSfx={jest.fn()} battleSpd={750} />,
    );
    expect(screen.queryByText('💠 キーストーン', { exact: false })).not.toBeInTheDocument();
  });
});
```

> `__tests__/EvolutionScreen.test.tsx` の既存 import（`render`/`screen`/`fireEvent`/`makeRun` 等）を確認し、不足のみ追加。`new RegExp` は使わない。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- EvolutionScreen`
Expected: FAIL（`evoKeystone` prop 未対応／カード未描画）

- [ ] **Step 3: EvolutionScreen を更新**

`EvolutionScreen.tsx` の import に型を追加:

```typescript
import type { RunState, Evolution, SfxType, KeystoneDef, KeystoneId, PowerCurve } from '../types';
```

`Props` に `evoKeystone?: KeystoneDef;` を追加し、分割代入に追加:

```typescript
interface Props {
  run: RunState;
  evoPicks: Evolution[];
  evoKeystone?: KeystoneDef;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  battleSpd: number;
}

export const EvolutionScreen: React.FC<Props> = ({ run, evoPicks, evoKeystone, dispatch, playSfx, battleSpd }) => {
```

ファイル先頭付近（コンポーネント外）にカーブラベルを追加:

```typescript
/** カーブの表示ラベル */
const CURVE_LABEL: Readonly<Record<PowerCurve, string>> = {
  front: '⚡ 即効', scaling: '🌱 晩成', combo: '🔗 コンボ', wild: '🃏 ワイルド',
};
```

キーストーン選択ハンドラをコンポーネント内（`handlePick` の後）に追加:

```typescript
  const handlePickKeystone = (id: KeystoneId) => {
    playSfx('evo');
    dispatch({ type: 'SELECT_DRAFT_KEYSTONE', id });
  };
```

進化カードの `.map(...)` ブロックの直後（`})}` の後、`{(() => { ... })()}` ヒントの前）に、キーストーン専用カードを追加:

```typescript
      {!isMaxEvoReached && evoKeystone && (
        <EvoCard $rare onClick={() => handlePickKeystone(evoKeystone.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, color: '#f0c040' }}>💠 {evoKeystone.ic} {evoKeystone.nm}</span>{' '}
              <span style={{ fontSize: 11, color: '#908870' }}>{evoKeystone.desc}</span>
            </div>
            <span style={{ fontSize: 8, color: '#988070' }}>{CURVE_LABEL[evoKeystone.curve]}</span>
          </div>
          <div style={{ fontSize: 7, color: '#d060ff', marginTop: 2 }}>キーストーン（ルールを変える）</div>
        </EvoCard>
      )}
```

> `EvoCard` の `$rare` prop は既存（レア進化の強調枠）。これを流用してキーストーンカードを視覚的に際立たせる。

- [ ] **Step 4: テスト成功**

Run: `npm test -- EvolutionScreen`
Expected: PASS

- [ ] **Step 5: PrimalPathGame の配線確認**

`PrimalPathGame.tsx` の `phase === 'evo'` 描画に `evoKeystone` を渡す:

```typescript
        {phase === 'evo' && run && (
          <EvolutionScreen run={run} evoPicks={evoPicks} evoKeystone={state.evoKeystone} dispatch={dispatch} playSfx={playSfx} battleSpd={battleSpd} />
        )}
```

> `state.evoKeystone` を参照。既存の分割代入に `evoKeystone` が無ければ `state.evoKeystone` で直接参照する。

- [ ] **Step 6: 統合テスト ＋ typecheck**

Run: `npm test -- EvolutionScreen reducer && npm run typecheck`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/components/EvolutionScreen.tsx src/features/primal-path/PrimalPathGame.tsx src/features/primal-path/__tests__/EvolutionScreen.test.tsx
git commit -m "feat: 進化選択画面にドラフトキーストーン専用カードを追加"
```

---

## Task 4: 全体検証 ＋ README

**Files:**
- Modify: `src/features/primal-path/README.md`

- [ ] **Step 1: CI 相当の全体検証（パイプ禁止・各 exit を個別確認）**

Run: `npm run lint:ci`（exit 0）、`npm run typecheck`（exit 0）、`npm test`（全 PASS）
Expected: すべて PASS。失敗時は該当タスクへ戻る。

- [ ] **Step 2: README 追記**

`src/features/primal-path/README.md` の「キーストーン」項目の説明に入手経路を追記する。既存のキーストーン行（Phase 2b で追加）を以下に置換:

```markdown
- **キーストーン**: 「ルールを変える」質的効果カード10種（火傷伝播/反射/致死耐え/会心スタック等。⚡即効/🌱晩成/🔗コンボ/🃏ワイルド）。入手は2経路：バイオーム踏破ごとの節目3択、および進化ドラフトへの低確率混入
```

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/README.md
git commit -m "docs: README にキーストーンのドラフト混入入手経路を追記"
```

---

## Self-Review（計画作成者によるチェック結果）

**1. Spec coverage（spec② ドラフト混入）:**
- `rollE` にキーストーン低確率混入 → Task 1（`rollDraftKeystone`）＋ Task 2（生成箇所配線）✓
- 既に取得済みのキーストーンは除外 → Task 1（`unownedKeystones` 使用）✓
- ドラフト画面での表示・選択 → Task 3（EvolutionScreen 専用カード）✓
- 取得時の適用（諸刃の変換含む）→ Task 2（`applyKeystone`）✓

**2. Placeholder scan:** 各 Step に実コード・実コマンド・期待結果。EvolutionScreen テストの既存 import/モック確認は「実装時に確認」と明示。

**3. Type consistency:** `rollDraftKeystone`/`DRAFT_KEYSTONE_RATE`/`evoKeystone`/`SELECT_DRAFT_KEYSTONE.id`/`KeystoneDef`/`KeystoneId`/`PowerCurve` を全タスクで一致。`applyKeystone`/`unownedKeystones`/`startBattle` は既存。

---

## 次フェーズ（別計画）

- **Phase 3**: 上位トーテム3種（rock/spirit/ember）＋シグネチャーコンボ統合テスト（反射タンク勝利等で Phase 2a の反射キル1tick遅延を固定）＋バランス調整。
