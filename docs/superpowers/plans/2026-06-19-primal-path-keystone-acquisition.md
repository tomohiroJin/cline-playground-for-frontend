# PRIMAL PATH キーストーン取得（節目提示）Phase 2b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** バイオーム踏破ごとに専用 `keystone` フェーズで3択を提示し、Phase 2a の効果エンジンに繋いでキーストーンをゲーム内で取得・発動できるようにする。

**Architecture:** バイオーム踏破後の唯一のチョークポイント `transitionAfterBiome`（reducer-helpers）に節目提示を挿入する。未取得キーストーンが残っていれば `keystone` フェーズへ遷移し、選択（`SELECT_KEYSTONE`）後に `applyKeystone`（Phase 2a）を適用してから元の遷移先（biome/evo/prefinal）へ続ける。新しい GameState フィールド `keystonePicks` は optional とし既存非破壊。

**Tech Stack:** React 19 + TypeScript / useReducer フェーズステートマシン / Jest 30 + @testing-library/react / styled-components

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数名・関数名）は英語可。
- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先。
- ドメイン層（`domain/`）は純粋関数。`presentation`/`infrastructure` を参照しない。
- 定数は `Object.freeze`。名前付きエクスポート。
- TDD（Red → Green → Refactor）。テストは `__tests__/` に `*.test.ts(x)`。
- Conventional Commits（日本語）。1コミット＝1論理変更。
- 既存テスト（Phase 2a マージ後の全グリーン）を壊さない。`GameState`/`RunStats` への新フィールドは optional。
- フェーズ追加時は `types/phase.ts` の `PHASE_TRANSITIONS` と `__tests__/phase-transitions.test.ts` の `allPhases` 配列を同時更新する。
- このフィーチャは `types.ts`（後方互換 barrel・`import from '../types'` はこちらに解決）と `types/index.ts` の2 barrel を持つ。新型は両方に export。
- Phase 2a で実装済み: `hasKeystone(r,id)`・`applyKeystone(r,id)`・`KEYSTONES`・`KeystoneId`/`KeystoneDef`・`RunState.keystones?`。これらを再実装しない。
- 検証コマンド: `npm test`、`npm run typecheck`、`npm run lint`。

## 設計判断（実装者は遵守）

- **提示タイミング**: バイオーム踏破ごと（`transitionAfterBiome` が呼ばれる各回）に、未取得キーストーンが残っていれば提示。1ラン最大3回（3バイオーム）。`ally_revive` 経由でも踏破1回につき提示は1回（`transitionAfterBiome` がチョークポイントのため重複しない）。
- **提示数**: 最大3択。未取得が3未満ならその残り全てを提示。0なら提示せず通常遷移。
- **トーテム軸の重み付け**: 選択中トーテムの `curve` と一致する `curve` のキーストーンを重み2倍で優先提示（Phase 2b の解釈。totem に tag フィールドが無いため curve を軸に用いる）。
- **ドラフト混入（spec の②）は本計画のスコープ外**: キーストーンは Evolution と別型で、`rollE`/EvolutionScreen のカードモデル統合を要する。型モデル整合を伴う独立変更として後続（Phase 2c もしくは Phase 3 で扱う）。

---

## File Structure

**新規作成:**
- `src/features/primal-path/components/KeystoneScreen.tsx` — キーストーン3択 UI。
- `src/features/primal-path/__tests__/KeystoneScreen.test.tsx` — UI テスト。

**修正:**
- `src/features/primal-path/domain/keystone/keystone-service.ts` — `unownedKeystones`/`shouldOfferKeystone`/`rollKeystones` 追加。
- `src/features/primal-path/game-logic.ts` — 上記を re-export。
- `src/features/primal-path/types/phase.ts` — `GamePhase` に `'keystone'`、`PHASE_TRANSITIONS` 更新。
- `src/features/primal-path/types/game-state.ts` — `GameState.keystonePicks?` 追加。
- `src/features/primal-path/hooks/use-game-state.ts` — `initialState` に `keystonePicks: []`。
- `src/features/primal-path/hooks/actions.ts` — `SELECT_KEYSTONE` 追加。
- `src/features/primal-path/hooks/reducer-helpers.ts` — `transitionAfterBiome` に提示挿入＋`continueAfterBiome` 抽出。
- `src/features/primal-path/hooks/reducers/progression-reducer.ts` — `SELECT_KEYSTONE` 処理。
- `src/features/primal-path/PrimalPathGame.tsx` — `keystone` フェーズ描画。
- `src/features/primal-path/types/stats.ts` ＋ `domain/progression/run-service.ts` — `RunStats.keystoneCount`。
- `src/features/primal-path/__tests__/phase-transitions.test.ts` — `allPhases`・遷移テスト。

---

## Task 1: キーストーン抽選ロジック（domain）

未取得キーストーンの抽出・提示要否・3択抽選（トーテム curve 重み付け）を純粋関数で実装する。

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Consumes: `hasKeystone`（Phase 2a）、`KEYSTONES`、`TOTEMS`、`RunState.totemId`/`keystones`
- Produces:
  - `function unownedKeystones(r: RunState): KeystoneDef[]`（未取得の `KEYSTONES`）
  - `function shouldOfferKeystone(r: RunState): boolean`（未取得が1つ以上）
  - `function rollKeystones(r: RunState, rng?: () => number): KeystoneDef[]`（最大3択・distinct・トーテム curve 一致を重み2で優先。未取得が3以下なら残り全て）

- [ ] **Step 1: テストを追記（失敗する）**

`__tests__/keystone-service.test.ts` の末尾に追記:

```typescript
import { unownedKeystones, shouldOfferKeystone, rollKeystones } from '../game-logic';
import { KEYSTONES } from '../constants';

describe('キーストーン抽選', () => {
  it('unownedKeystones は取得済みを除外する', () => {
    const owned = KEYSTONES.slice(0, 2).map(k => k.id);
    const r = makeRun({ keystones: owned });
    const un = unownedKeystones(r);
    expect(un).toHaveLength(KEYSTONES.length - 2);
    expect(un.some(k => owned.includes(k.id))).toBe(false);
  });

  it('shouldOfferKeystone は未取得が残れば true、全取得で false', () => {
    expect(shouldOfferKeystone(makeRun({ keystones: [] }))).toBe(true);
    expect(shouldOfferKeystone(makeRun({ keystones: KEYSTONES.map(k => k.id) }))).toBe(false);
  });

  it('rollKeystones は最大3択・distinct・未取得のみ', () => {
    const r = makeRun({ keystones: [] });
    const picks = rollKeystones(r, () => 0);
    expect(picks).toHaveLength(3);
    const ids = picks.map(p => p.id);
    expect(new Set(ids).size).toBe(3);
    expect(picks.every(p => !r.keystones?.includes(p.id))).toBe(true);
  });

  it('未取得が3未満なら残り全てを返す', () => {
    const owned = KEYSTONES.slice(0, KEYSTONES.length - 2).map(k => k.id);
    const picks = rollKeystones(makeRun({ keystones: owned }), () => 0);
    expect(picks).toHaveLength(2);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（未定義）

- [ ] **Step 3: 実装**

`keystone-service.ts` の import に `KEYSTONES`・`TOTEMS` を追加（型 `KeystoneDef` も）:

```typescript
import type { RunState, KeystoneId, KeystoneDef } from '../../types';
import { KEYSTONES, TOTEMS } from '../../constants';
```

末尾に追加:

```typescript
/** 未取得のキーストーン一覧を返す */
export function unownedKeystones(r: RunState): KeystoneDef[] {
  return KEYSTONES.filter(k => !hasKeystone(r, k.id));
}

/** 節目でキーストーンを提示すべきか（未取得が残っているか） */
export function shouldOfferKeystone(r: RunState): boolean {
  return unownedKeystones(r).length > 0;
}

/** 節目の3択を抽選する（最大3・distinct・トーテム curve 一致を重み2で優先） */
export function rollKeystones(r: RunState, rng: () => number = Math.random): KeystoneDef[] {
  const pool = unownedKeystones(r);
  if (pool.length <= 3) return pool;

  const totemCurve = TOTEMS.find(t => t.id === r.totemId)?.curve;
  const avail = [...pool];
  const result: KeystoneDef[] = [];
  while (result.length < 3 && avail.length > 0) {
    // curve 一致を重み2、それ以外を重み1とした重み付き抽選
    const weights = avail.map(k => (totemCurve && k.curve === totemCurve ? 2 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let pick = rng() * total;
    let idx = 0;
    while (idx < weights.length - 1 && pick >= weights[idx]) {
      pick -= weights[idx];
      idx++;
    }
    result.push(avail[idx]);
    avail.splice(idx, 1);
  }
  return result;
}
```

- [ ] **Step 4: game-logic から re-export**

`game-logic.ts` のキーストーンサービス行に追記（既存の export 行に追加）:

```typescript
export { unownedKeystones, shouldOfferKeystone, rollKeystones } from './domain/keystone/keystone-service';
```

- [ ] **Step 5: テスト成功 ＋ typecheck**

Run: `npm test -- keystone-service && npm run typecheck`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/keystone/keystone-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "feat: キーストーン節目抽選ロジック（未取得抽出・3択・curve重み付け）"
```

---

## Task 2: keystone フェーズと遷移テーブル ＋ GameState.keystonePicks

**Files:**
- Modify: `src/features/primal-path/types/phase.ts`
- Modify: `src/features/primal-path/types/game-state.ts`
- Modify: `src/features/primal-path/hooks/use-game-state.ts`
- Test: `src/features/primal-path/__tests__/phase-transitions.test.ts`

**Interfaces:**
- Produces:
  - `GamePhase` に `'keystone'`
  - `GameState.keystonePicks?: import('./keystone').KeystoneDef[]`
  - 遷移: `battle` と `ally_revive` に `'keystone'` を追加、`keystone: ['biome', 'evo', 'prefinal', 'title']`

- [ ] **Step 1: テストを更新（失敗する）**

`__tests__/phase-transitions.test.ts` の `allPhases` 配列に `'keystone'` を追加:

```typescript
      const allPhases: GamePhase[] = [
        'title', 'diff', 'how', 'tree', 'biome', 'evo', 'battle',
        'awakening', 'prefinal', 'endless_checkpoint', 'ally_revive',
        'event', 'over', 'stats', 'achievements', 'challenge', 'totem', 'keystone',
      ];
```

`describe('GamePhase ステートマシン', ...)` 内に追加:

```typescript
  describe('キーストーンフェーズ', () => {
    it('battle / ally_revive から keystone に遷移できる', () => {
      expect(isValidTransition('battle', 'keystone')).toBe(true);
      expect(isValidTransition('ally_revive', 'keystone')).toBe(true);
    });
    it('keystone から biome / evo / prefinal に遷移できる', () => {
      expect(isValidTransition('keystone', 'biome')).toBe(true);
      expect(isValidTransition('keystone', 'evo')).toBe(true);
      expect(isValidTransition('keystone', 'prefinal')).toBe(true);
    });
  });
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- phase-transitions`
Expected: FAIL（`keystone` 未定義）

- [ ] **Step 3: phase.ts を更新**

`GamePhase` union の `'totem'` の後に追加:

```typescript
  | 'totem'
  | 'keystone';
```

`PHASE_TRANSITIONS` の `battle`・`ally_revive` に `'keystone'` を追加し、`keystone` キーを追加:

```typescript
  battle: ['evo', 'awakening', 'prefinal', 'over', 'event', 'ally_revive', 'endless_checkpoint', 'keystone'],
```

```typescript
  ally_revive: ['evo', 'prefinal', 'keystone'],
```

`totem` 行の後に追加:

```typescript
  keystone: ['biome', 'evo', 'prefinal', 'title'],
```

- [ ] **Step 4: GameState と initialState を更新**

`types/game-state.ts` の `GameState` に追加（`pendingStart?` の近く）:

```typescript
  /** 節目で提示中のキーストーン3択 */
  keystonePicks?: import('./keystone').KeystoneDef[];
```

`hooks/use-game-state.ts` の `initialState` 戻り値の `pendingStart: null,` の後に追加:

```typescript
    keystonePicks: [],
```

- [ ] **Step 5: テスト成功 ＋ typecheck**

Run: `npm test -- phase-transitions && npm run typecheck`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/types/phase.ts src/features/primal-path/types/game-state.ts src/features/primal-path/hooks/use-game-state.ts src/features/primal-path/__tests__/phase-transitions.test.ts
git commit -m "feat: keystone フェーズ・遷移・keystonePicks 状態を追加"
```

---

## Task 3: reducer 配線（節目提示 ＋ SELECT_KEYSTONE）

`transitionAfterBiome` に提示を挿入し、選択で `applyKeystone` 後に元の遷移を続ける。

**Files:**
- Modify: `src/features/primal-path/hooks/reducer-helpers.ts:16-32`
- Modify: `src/features/primal-path/hooks/actions.ts`
- Modify: `src/features/primal-path/hooks/reducers/progression-reducer.ts`
- Test: `src/features/primal-path/__tests__/reducer.test.ts`

**Interfaces:**
- Consumes: `shouldOfferKeystone`/`rollKeystones`/`applyKeystone`（Task 1・Phase 2a）
- Produces:
  - `function continueAfterBiome(state: GameState, run: RunState): GameState`（現 `transitionAfterBiome` の本体）
  - `transitionAfterBiome` は提示要否を判定し `keystone` フェーズか `continueAfterBiome` を返す
  - Action `{ type: 'SELECT_KEYSTONE'; id: KeystoneId }`

- [ ] **Step 1: テストを書く（失敗する）**

`__tests__/reducer.test.ts` に追記（`gameReducer`/`initialState` の import 構成は既存に合わせる）:

```typescript
import { KEYSTONES } from '../constants';

describe('キーストーン節目フロー', () => {
  it('バイオーム踏破で未取得があれば keystone フェーズへ遷移し3択を持つ', () => {
    const run = makeRun({ bc: 1, keystones: [], bms: ['grassland', 'glacier', 'volcano'], cBT: 'grassland' });
    const s0 = { ...initialState(), phase: 'battle' as const, run };
    const s1 = gameReducer(s0, { type: 'BIOME_CLEARED' });
    expect(s1.phase).toBe('keystone');
    expect(s1.keystonePicks && s1.keystonePicks.length).toBeGreaterThan(0);
  });

  it('SELECT_KEYSTONE で applyKeystone され、節目フェーズを抜ける', () => {
    const run = makeRun({ bc: 1, keystones: [], bms: ['grassland', 'glacier', 'volcano'], cBT: 'grassland' });
    const s0 = { ...initialState(), phase: 'keystone' as const, run,
      keystonePicks: KEYSTONES.slice(0, 3) };
    const s1 = gameReducer(s0, { type: 'SELECT_KEYSTONE', id: KEYSTONES[0].id });
    expect(s1.run?.keystones).toContain(KEYSTONES[0].id);
    expect(s1.phase).not.toBe('keystone');
  });

  it('全キーストーン取得済みなら keystone フェーズをスキップして通常遷移', () => {
    const run = makeRun({ bc: 1, keystones: KEYSTONES.map(k => k.id),
      bms: ['grassland', 'glacier', 'volcano'], cBT: 'grassland' });
    const s0 = { ...initialState(), phase: 'battle' as const, run };
    const s1 = gameReducer(s0, { type: 'BIOME_CLEARED' });
    expect(s1.phase).not.toBe('keystone');
  });
});
```

> `makeRun` の `bms`/`cBT`/`bc` 指定が `transitionAfterBiome`（`pickBiomeAuto` 依存）と整合するか、実装前に `test-helpers.ts` と `biome-service.ts` を確認すること。`bc: 1` は「2バイオーム目へ進む（needSelection/auto）」を想定。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- reducer`
Expected: FAIL（keystone 提示未実装／`SELECT_KEYSTONE` 未処理）

- [ ] **Step 3: reducer-helpers を更新**

`reducer-helpers.ts` の import に追加:

```typescript
import { shouldOfferKeystone, rollKeystones } from '../game-logic';
```

現在の `transitionAfterBiome`（16-32行）を、本体を `continueAfterBiome` に改名し、`transitionAfterBiome` を提示判定に置換:

```typescript
/** バイオーム踏破後の状態を決定する（節目キーストーン提示を挟む） */
export function transitionAfterBiome(state: GameState, run: RunState): GameState {
  if (shouldOfferKeystone(run)) {
    const keystonePicks = rollKeystones(run);
    if (keystonePicks.length > 0) {
      return { ...state, run, phase: 'keystone', keystonePicks };
    }
  }
  return continueAfterBiome(state, run);
}

/** キーストーン提示後の遷移先（最終ボス準備/バイオーム選択/進化）を決定する */
export function continueAfterBiome(state: GameState, run: RunState): GameState {
  if (run.bc >= 3) {
    if (run.isEndless) {
      return { ...state, run, phase: 'endless_checkpoint' };
    }
    return { ...state, run, phase: 'prefinal' };
  }
  const pick = pickBiomeAuto(run);
  if (pick.needSelection) {
    return { ...state, run, phase: 'biome' };
  }
  const autoRun = applyAutoLastBiome(run);
  const evoPicks = rollE(autoRun);
  return { ...state, run: autoRun, phase: 'evo', evoPicks };
}
```

- [ ] **Step 4: SELECT_KEYSTONE アクションを追加**

`actions.ts` の import に `KeystoneId` を追加（既に追加済みなら不要）。`ProgressionAction` に追加:

```typescript
  | { type: 'SELECT_KEYSTONE'; id: KeystoneId }
```

`PROGRESSION_TYPES` セットに `'SELECT_KEYSTONE'` を追加。

- [ ] **Step 5: progression-reducer に SELECT_KEYSTONE を実装**

`progression-reducer.ts` の import に追加:

```typescript
import { applyKeystone } from '../../game-logic';
import { continueAfterBiome } from '../reducer-helpers';
```

`SET_PHASE` ケースの前に追加:

```typescript
    case 'SELECT_KEYSTONE': {
      if (!state.run) return state;
      const run = applyKeystone(state.run, action.id);
      return continueAfterBiome({ ...state, keystonePicks: [] }, run);
    }
```

- [ ] **Step 6: テスト成功 ＋ 回帰確認**

Run: `npm test -- reducer && npm run typecheck`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/hooks/reducer-helpers.ts src/features/primal-path/hooks/actions.ts src/features/primal-path/hooks/reducers/progression-reducer.ts src/features/primal-path/__tests__/reducer.test.ts
git commit -m "feat: 節目キーストーン提示と SELECT_KEYSTONE の reducer を配線"
```

---

## Task 4: KeystoneScreen UI ＋ オーケストレータ配線

**Files:**
- Create: `src/features/primal-path/components/KeystoneScreen.tsx`
- Modify: `src/features/primal-path/PrimalPathGame.tsx`
- Test: `src/features/primal-path/__tests__/KeystoneScreen.test.tsx`

**Interfaces:**
- Consumes: `GameState.keystonePicks`、`SELECT_KEYSTONE`（Task 2・3）、`PowerCurve`
- Produces: `KeystoneScreen` props `{ picks: KeystoneDef[]; dispatch: React.Dispatch<GameAction>; playSfx: (t: SfxType) => void }`

- [ ] **Step 1: UI テストを書く（失敗する）**

`__tests__/KeystoneScreen.test.tsx` を新規作成:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeystoneScreen } from '../components/KeystoneScreen';
import { KEYSTONES } from '../constants';

describe('KeystoneScreen', () => {
  const picks = KEYSTONES.slice(0, 3);

  it('提示された3つのキーストーン名を表示する', () => {
    render(<KeystoneScreen picks={picks} dispatch={jest.fn()} playSfx={jest.fn()} />);
    for (const k of picks) {
      expect(screen.getByText(new RegExp(k.nm))).toBeInTheDocument();
    }
  });

  it('クリックで SELECT_KEYSTONE を id 付きで dispatch する', () => {
    const dispatch = jest.fn();
    render(<KeystoneScreen picks={picks} dispatch={dispatch} playSfx={jest.fn()} />);
    fireEvent.click(screen.getByText(new RegExp(picks[0].nm)));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_KEYSTONE', id: picks[0].id }),
    );
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- KeystoneScreen`
Expected: FAIL（`KeystoneScreen` 不在）

- [ ] **Step 3: KeystoneScreen を実装**

`src/features/primal-path/components/KeystoneScreen.tsx` を新規作成（TotemSelectScreen のパターンに倣う）:

```typescript
/**
 * キーストーン選択画面（バイオーム踏破後の節目3択）
 * 「ルールを変える」キーストーンを1つ選ぶ。
 */
import React from 'react';
import type { SfxType, KeystoneDef, KeystoneId, PowerCurve } from '../types';
import type { GameAction } from '../hooks';
import { Screen, SubTitle, Divider, GameButton } from '../styles';

/** カーブの表示ラベル */
const CURVE_LABEL: Readonly<Record<PowerCurve, string>> = {
  front: '⚡ 即効',
  scaling: '🌱 晩成',
  combo: '🔗 コンボ',
  wild: '🃏 ワイルド',
};

interface Props {
  picks: KeystoneDef[];
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const KeystoneScreen: React.FC<Props> = ({ picks, dispatch, playSfx }) => {
  const handlePick = (id: KeystoneId): void => {
    playSfx('click');
    dispatch({ type: 'SELECT_KEYSTONE', id });
  };

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 8 }}>💠</div>
      <SubTitle>キーストーンを選べ</SubTitle>
      <div style={{ color: '#908070', fontSize: 11, margin: '2px 0' }}>
        ルールを変える一手を1つ獲得する
      </div>
      <Divider />
      {picks.map(k => (
        <GameButton
          key={k.id}
          style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
          onClick={() => handlePick(k.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f0c040', fontSize: 13 }}>{k.ic} {k.nm}</span>
            <span style={{ fontSize: 11, color: '#988070' }}>{CURVE_LABEL[k.curve]}</span>
          </div>
          <div style={{ color: '#988070', fontSize: 12, marginTop: 2 }}>{k.desc}</div>
        </GameButton>
      ))}
    </Screen>
  );
};
```

> `KeystoneDef`/`KeystoneId`/`PowerCurve` が `../types` から import できることを確認（Phase 2a で両 barrel に export 済み）。`SubTitle`/`GameButton` 等が `styles` に存在することを確認。

- [ ] **Step 4: テスト成功を確認**

Run: `npm test -- KeystoneScreen`
Expected: PASS

- [ ] **Step 5: PrimalPathGame に配線**

`PrimalPathGame.tsx` の import に追加:

```typescript
import { KeystoneScreen } from './components/KeystoneScreen';
```

`phase === 'totem'` の描画ブロックの近くに追加:

```typescript
        {phase === 'keystone' && state.keystonePicks && state.keystonePicks.length > 0 && (
          <KeystoneScreen picks={state.keystonePicks} dispatch={dispatch} playSfx={playSfx} />
        )}
```

- [ ] **Step 6: 統合テスト ＋ typecheck**

Run: `npm test -- KeystoneScreen reducer && npm run typecheck`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/components/KeystoneScreen.tsx src/features/primal-path/PrimalPathGame.tsx src/features/primal-path/__tests__/KeystoneScreen.test.tsx
git commit -m "feat: キーストーン選択画面とオーケストレータ配線を追加"
```

---

## Task 5: RunStats 連携 ＋ 全体検証 ＋ README

**Files:**
- Modify: `src/features/primal-path/types/stats.ts`
- Modify: `src/features/primal-path/domain/progression/run-service.ts`
- Modify: `src/features/primal-path/README.md`
- Test: `src/features/primal-path/__tests__/game-logic.test.ts`（または run-service の既存テスト）

**Interfaces:**
- Consumes: `RunState.keystones`、`calcRunStats`（既存）
- Produces: `RunStats.keystoneCount?: number`

- [ ] **Step 1: テストを追記（失敗する）**

`calcRunStats` を検証している既存テストファイルを特定（`grep -rn "calcRunStats" src/features/primal-path/__tests__/`）。無ければ `__tests__/game-logic.test.ts` に追記:

```typescript
import { calcRunStats } from '../game-logic';

describe('calcRunStats — keystoneCount', () => {
  it('取得済みキーストーン数を記録する', () => {
    const run = makeRun({ keystones: ['madblood', 'thorn_guard'] });
    const stats = calcRunStats(run, 'victory', 10);
    expect(stats.keystoneCount).toBe(2);
  });
  it('キーストーン未取得なら0', () => {
    const run = makeRun({ keystones: [] });
    expect(calcRunStats(run, 'defeat', 1).keystoneCount).toBe(0);
  });
});
```

> `calcRunStats` のシグネチャ（引数順）は `run-service.ts` で確認（`calcRunStats(run, result, boneEarned)`）。`makeRun` で `keystones` を指定。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- game-logic`
Expected: FAIL（`keystoneCount` 未定義）

- [ ] **Step 3: RunStats 型と calcRunStats を更新**

`types/stats.ts` の `RunStats` インターフェースに optional 追加（`synergyCount` の近く）:

```typescript
  /** 取得キーストーン数 */
  keystoneCount?: number;
```

`domain/progression/run-service.ts` の `calcRunStats` の返却オブジェクトに追加（`synergyCount` の近く）:

```typescript
    keystoneCount: run.keystones?.length ?? 0,
```

- [ ] **Step 4: テスト成功**

Run: `npm test -- game-logic`
Expected: PASS

- [ ] **Step 5: README 追記**

`src/features/primal-path/README.md` の「## ゲームシステム」リスト、始祖トーテムの行の直後に追加:

```markdown
- **キーストーン**: バイオーム踏破ごとに「ルールを変える」質的効果カードを3択から獲得（10種：火傷伝播/反射/致死耐え/会心スタック等。⚡即効/🌱晩成/🔗コンボ/🃏ワイルド）
```

- [ ] **Step 6: CI 相当の全体検証**

Run: `npm run lint && npm run typecheck && npm test`
Expected: PASS（lint 警告ゼロ・型エラーなし・全テストグリーン）。失敗時は該当タスクへ戻る。

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/types/stats.ts src/features/primal-path/domain/progression/run-service.ts src/features/primal-path/README.md src/features/primal-path/__tests__/game-logic.test.ts
git commit -m "feat: RunStats にキーストーン数を記録し README を更新"
```

---

## Self-Review（計画作成者によるチェック結果）

**1. Spec coverage（Phase 2b 範囲＝節目提示路）:**
- 各バイオーム踏破後に専用 `keystone` フェーズで3択 → Task 2・3 ✓
- 必ず1つ選択（提示後 SELECT_KEYSTONE で applyKeystone） → Task 3・4 ✓
- 同一キーストーンの重複取得を避ける（未取得のみ提示） → Task 1（unownedKeystones）✓
- トーテム軸に応じた提示重み付け（curve 基準） → Task 1（rollKeystones）✓
- RunStats 連携 → Task 5 ✓
- **スコープ外（後続）**: ドラフト低確率混入（`rollE`／EvolutionScreen のカードモデル統合を要する）。StatsScreen の表示拡充。

**2. Placeholder scan:** 各 Step に実コード・実コマンド・期待結果を記載。`makeRun` の `bms`/`bc`/`calcRunStats` シグネチャは「実装時に確認」と明示。

**3. Type consistency:** `unownedKeystones`/`shouldOfferKeystone`/`rollKeystones`/`continueAfterBiome`/`SELECT_KEYSTONE.id`/`keystonePicks`/`keystoneCount` を全タスクで一致。`KeystoneDef`/`KeystoneId`/`PowerCurve` は Phase 2a 既存。`applyKeystone` は Phase 2a。

---

## 次フェーズ（別計画）

- **ドラフト混入（spec ②）**: `rollE` へのキーストーン低確率混入 ＋ EvolutionScreen のカードモデル統合（Evolution と KeystoneDef の表示・選択の統一）。型モデル整合を要するため独立変更。
- **Phase 3**: 上位トーテム3種（rock/spirit/ember）＋シグネチャーコンボ統合テスト（反射タンク勝利シナリオ等で Phase 2a の Minor=反射キル1tick遅延の挙動固定を含む）＋バランス調整。
