# PRIMAL PATH 始祖トーテム基盤（Phase 1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ラン開始時に「始祖トーテム」を1つ選び、そのランの戦い方の軸（横軸）とテンポ（縦軸＝パワーカーブ）を決める基盤を構築し、基本3種（血の祖／炎の祖／群れの祖）を動作させる。

**Architecture:** 難易度選択と `START_RUN` の間に新フェーズ `totem` を挿入する。トーテム効果は純粋関数 `applyTotem(run, totemId)` で `RunState` に適用し、`startRunState` から呼ぶ。新フィールドはすべて optional とし、使用箇所で既定値を補うことで既存テストを壊さない。トーテム選択 UI は既存スクリーンの dispatch パターン（`PrimalPathGame` がコールバックを配線）に倣う。

**Tech Stack:** React 19 + TypeScript / useReducer ベースのフェーズステートマシン / Jest 30 + @testing-library/react / styled-components

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数名・関数名）は英語可。
- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先。
- ドメイン層（`domain/`）は外部依存なしの純粋関数。`presentation`/`infrastructure` を参照しない。
- 定数は `Object.freeze` で凍結する。
- TDD（Red → Green → Refactor）。新規コードカバレッジ 80%+、ビジネスロジック 90%+。
- テストは対象と同じ階層の `__tests__/` に `*.test.ts(x)` で配置。
- Conventional Commits（`feat:` / `test:` / `refactor:`）。1コミット＝1論理変更。
- 既存329テストを壊さない。`RunState` への新フィールドは optional（既存の `_wDmgBase`・`challengeId` と同じ慣習）。
- フェーズ追加時は `types/phase.ts` の `PHASE_TRANSITIONS` と `__tests__/phase-transitions.test.ts` の `allPhases` 配列を同時に更新する。
- 検証コマンド: `npm test`（全体）、`npm run typecheck`、`npm run lint`。

---

## File Structure

**新規作成:**
- `src/features/primal-path/types/totem.ts` — `TotemId`・`PowerCurve`・`TotemDef` 型。
- `src/features/primal-path/constants/totem.ts` — `TOTEMS` レジストリ（基本3種）。
- `src/features/primal-path/domain/totem/totem-service.ts` — `applyTotem` 純粋関数。
- `src/features/primal-path/components/TotemSelectScreen.tsx` — トーテム選択 UI。
- `src/features/primal-path/__tests__/totem-service.test.ts` — applyTotem のテスト。
- `src/features/primal-path/__tests__/TotemSelectScreen.test.tsx` — UI テスト。

**修正:**
- `src/features/primal-path/types/game-state.ts` — `RunState` に optional 3フィールド、`GameState` に `pendingStart` 追加。
- `src/features/primal-path/types/index.ts` — totem 型を re-export。
- `src/features/primal-path/types/phase.ts` — `GamePhase` に `'totem'`、`PHASE_TRANSITIONS` 更新。
- `src/features/primal-path/constants/index.ts` — `TOTEMS` を re-export。
- `src/features/primal-path/domain/progression/run-service.ts` — `startRunState` に `totemId` 引数。
- `src/features/primal-path/domain/battle/tick-phases.ts` — 火傷ダメージに `burnDmgMul` 適用。
- `src/features/primal-path/domain/evolution/evolution-service.ts` — 仲間リクルート ATK に `allyAtkBonus` 加算。
- `src/features/primal-path/game-logic.ts` — `applyTotem` を re-export。
- `src/features/primal-path/hooks/actions.ts` — `GO_TOTEM` 追加、`START_RUN`/`START_CHALLENGE` に `totemId`。
- `src/features/primal-path/hooks/use-game-state.ts` — `initialState` に `pendingStart: null`。
- `src/features/primal-path/hooks/reducers/progression-reducer.ts` — `GO_TOTEM` 処理、`START_RUN`/`START_CHALLENGE` で totemId 適用。
- `src/features/primal-path/components/DifficultyScreen.tsx` — `onStart` を「トーテムへ進む」に変更。
- `src/features/primal-path/components/ChallengeScreen.tsx` — チャレンジ開始もトーテムへ。
- `src/features/primal-path/PrimalPathGame.tsx` — `totem` フェーズ描画とコールバック配線。
- `src/features/primal-path/__tests__/phase-transitions.test.ts` — `allPhases` と遷移テスト更新。

---

## Task 1: トーテムのデータモデルと定数（基本3種）

トーテムの型と定数レジストリを定義する。`applyTotem` の effect は宣言的オブジェクトとして表現し、Task 2 以降が消費する。

**Files:**
- Create: `src/features/primal-path/types/totem.ts`
- Create: `src/features/primal-path/constants/totem.ts`
- Modify: `src/features/primal-path/types/index.ts`
- Modify: `src/features/primal-path/constants/index.ts`
- Test: `src/features/primal-path/__tests__/totem-service.test.ts`（このタスクでは定数のみ検証）

**Interfaces:**
- Produces:
  - `type TotemId = 'blood' | 'flame' | 'pack'`（Phase 1。Phase 3 で `'rock' | 'spirit' | 'ember'` 追加予定）
  - `type PowerCurve = 'front' | 'scaling' | 'combo' | 'wild'`
  - `interface TotemEffect { mhpMul?: number; atkMul?: number; crAdd?: number; defAdd?: number; mxaAdd?: number; burnDmgMul?: number; allyAtkBonus?: number; startAlly?: AllyTemplate }`
  - `interface TotemDef { id: TotemId; nm: string; ic: string; curve: PowerCurve; desc: string; unlock: number; effect: TotemEffect }`
  - `const TOTEMS: readonly TotemDef[]`（基本3種、`unlock: 0`）

- [ ] **Step 1: テストを書く（失敗する）**

`src/features/primal-path/__tests__/totem-service.test.ts` を新規作成:

```typescript
/**
 * 始祖トーテム — 定数とサービスのテスト
 */
import { TOTEMS } from '../constants';
import type { TotemId } from '../types';

describe('TOTEMS 定数', () => {
  it('基本3種（血/炎/群れ）が定義され unlock=0 である', () => {
    const ids = TOTEMS.map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining<TotemId>(['blood', 'flame', 'pack']));
    for (const id of ['blood', 'flame', 'pack'] as TotemId[]) {
      const t = TOTEMS.find(x => x.id === id);
      expect(t).toBeDefined();
      expect(t!.unlock).toBe(0);
    }
  });

  it('各トーテムは curve を持つ', () => {
    for (const t of TOTEMS) {
      expect(['front', 'scaling', 'combo', 'wild']).toContain(t.curve);
    }
  });

  it('TOTEMS は凍結されている', () => {
    expect(Object.isFrozen(TOTEMS)).toBe(true);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- totem-service`
Expected: FAIL（`TOTEMS` が `../constants` からエクスポートされていない / モジュール解決エラー）

- [ ] **Step 3: 型を定義**

`src/features/primal-path/types/totem.ts` を新規作成:

```typescript
/**
 * 始祖トーテム関連の型定義
 */
import type { AllyTemplate } from './units';

/** トーテム識別子（Phase 1 は基本3種） */
export type TotemId = 'blood' | 'flame' | 'pack';

/** パワーカーブ（縦の多様性：いつ強いか） */
export type PowerCurve = 'front' | 'scaling' | 'combo' | 'wild';

/** トーテム効果（ラン初期化時に適用される宣言的な補正） */
export interface TotemEffect {
  /** 最大HP倍率（例: 0.8 で -20%） */
  readonly mhpMul?: number;
  /** ATK倍率（例: 1.2 で +20%） */
  readonly atkMul?: number;
  /** 会心率加算（0〜1） */
  readonly crAdd?: number;
  /** DEF加算 */
  readonly defAdd?: number;
  /** 仲間枠加算 */
  readonly mxaAdd?: number;
  /** 火傷ダメージ倍率（既定1.0） */
  readonly burnDmgMul?: number;
  /** 仲間ATKボーナス（0.1 で +10%、以後のリクルートに適用） */
  readonly allyAtkBonus?: number;
  /** 開始時に加入する仲間 */
  readonly startAlly?: AllyTemplate;
}

/** トーテム定義 */
export interface TotemDef {
  readonly id: TotemId;
  readonly nm: string;
  readonly ic: string;
  readonly curve: PowerCurve;
  readonly desc: string;
  /** 解放に必要なクリア回数（基本トーテムは0） */
  readonly unlock: number;
  readonly effect: TotemEffect;
}
```

- [ ] **Step 4: 定数を定義**

`src/features/primal-path/constants/totem.ts` を新規作成:

```typescript
/**
 * 始祖トーテム定数
 */
import type { TotemDef } from '../types';

/** 始祖トーテム一覧（Phase 1: 基本3種） */
export const TOTEMS: readonly TotemDef[] = Object.freeze([
  Object.freeze({
    id: 'blood' as const, nm: '血の祖', ic: '🩸', curve: 'front' as const,
    desc: '最大HP-20% ATK+20% 会心+5%（序盤バースト）', unlock: 0,
    effect: Object.freeze({ mhpMul: 0.8, atkMul: 1.2, crAdd: 0.05 }),
  }),
  Object.freeze({
    id: 'flame' as const, nm: '炎の祖', ic: '🔥', curve: 'combo' as const,
    desc: '火傷ダメージ+25%（火傷伝播コンボ）', unlock: 0,
    effect: Object.freeze({ burnDmgMul: 1.25 }),
  }),
  Object.freeze({
    id: 'pack' as const, nm: '群れの祖', ic: '🏕️', curve: 'scaling' as const,
    desc: '仲間枠+1 開始仲間1体 仲間ATK+10%（部族スケール）', unlock: 0,
    effect: Object.freeze({
      mxaAdd: 1, allyAtkBonus: 0.1,
      startAlly: Object.freeze({ n: '群れの戦士', hp: 30, atk: 6, t: 'life' as const }),
    }),
  }),
]);
```

- [ ] **Step 5: re-export を追加**

`src/features/primal-path/types/index.ts` の `export type { GamePhase } from './phase';` の直前に追加:

```typescript
export type { TotemId, PowerCurve, TotemEffect, TotemDef } from './totem';
```

`src/features/primal-path/constants/index.ts` の `export { TREE, TIER_UNLOCK, TIER_NAMES } from './tree';` の直後に追加:

```typescript
export { TOTEMS } from './totem';
```

- [ ] **Step 6: テスト成功を確認**

Run: `npm test -- totem-service`
Expected: PASS（3テスト）

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/types/totem.ts src/features/primal-path/constants/totem.ts src/features/primal-path/types/index.ts src/features/primal-path/constants/index.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "feat: 始祖トーテムのデータモデルと基本3種定数を追加"
```

---

## Task 2: RunState 拡張 ＋ applyTotem（血の祖）

`RunState` に optional フィールドを追加し、純粋関数 `applyTotem` を実装する。血の祖（ステータス倍率のみ）から着手する。

**Files:**
- Modify: `src/features/primal-path/types/game-state.ts`
- Create: `src/features/primal-path/domain/totem/totem-service.ts`
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/totem-service.test.ts`

**Interfaces:**
- Consumes: `TOTEMS`, `TotemId`（Task 1）
- Produces:
  - `RunState.totemId?: TotemId`・`RunState.burnDmgMul?: number`・`RunState.allyAtkBonus?: number`
  - `function applyTotem(r: RunState, totemId: TotemId): RunState`（純粋。新しい `RunState` を返す。`mhp` 変更時は現在 `hp` も同率にクランプ）

- [ ] **Step 1: テストを追記（失敗する）**

`src/features/primal-path/__tests__/totem-service.test.ts` の末尾に追記:

```typescript
import { applyTotem } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyTotem — 血の祖', () => {
  it('最大HP×0.8 ATK×1.2 会心+0.05 を適用し、totemId を記録する', () => {
    const base = makeRun({ mhp: 100, hp: 100, atk: 10, cr: 0.05 });
    const r = applyTotem(base, 'blood');
    expect(r.mhp).toBe(80);
    expect(r.hp).toBe(80); // hp も mhp に追従
    expect(r.atk).toBe(12);
    expect(r.cr).toBeCloseTo(0.10, 5);
    expect(r.totemId).toBe('blood');
  });

  it('元の RunState を破壊しない（純粋関数）', () => {
    const base = makeRun({ mhp: 100, hp: 100, atk: 10, cr: 0.05 });
    applyTotem(base, 'blood');
    expect(base.mhp).toBe(100);
    expect(base.atk).toBe(10);
  });
});
```

> `makeRun` は `__tests__/test-helpers.ts` の既存ヘルパー。存在しない/シグネチャが異なる場合は、Step 実行前に `test-helpers.ts` を確認し、`makeRun({ ...overrides })` 相当のファクトリ名に読み替えること。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- totem-service`
Expected: FAIL（`applyTotem` が未定義）

- [ ] **Step 3: RunState を拡張**

`src/features/primal-path/types/game-state.ts` の `RunState` インターフェース本体（`tb: TreeBonus;` の直後）に追加:

```typescript
  /** 選択中の始祖トーテム */
  totemId?: import('./totem').TotemId;
  /** 火傷ダメージ倍率（トーテム/キーストーン由来、既定1.0） */
  burnDmgMul?: number;
  /** 仲間ATKボーナス（リクルート時に加算、既定0） */
  allyAtkBonus?: number;
```

- [ ] **Step 4: applyTotem を実装**

`src/features/primal-path/domain/totem/totem-service.ts` を新規作成:

```typescript
/**
 * 始祖トーテムサービス
 *
 * ラン初期化時にトーテム効果を RunState へ適用する純粋関数。
 */
import type { RunState, TotemId } from '../../types';
import { TOTEMS } from '../../constants';
import { clamp } from '../shared/utils';

/** トーテム効果を適用した新しい RunState を返す（純粋） */
export function applyTotem(r: RunState, totemId: TotemId): RunState {
  const def = TOTEMS.find(t => t.id === totemId);
  if (!def) return r;
  const e = def.effect;

  const next: RunState = { ...r, totemId };

  // ステータス倍率/加算
  if (e.mhpMul) {
    next.mhp = Math.floor(r.mhp * e.mhpMul);
    next.hp = Math.min(r.hp, next.mhp);
  }
  if (e.atkMul) next.atk = Math.floor(next.atk * e.atkMul);
  if (e.crAdd) next.cr = clamp(next.cr + e.crAdd, 0, 1);
  if (e.defAdd) next.def = next.def + e.defAdd;

  // 仲間枠・火傷・仲間ATK
  if (e.mxaAdd) next.mxA = next.mxA + e.mxaAdd;
  if (e.burnDmgMul) next.burnDmgMul = e.burnDmgMul;
  if (e.allyAtkBonus) next.allyAtkBonus = e.allyAtkBonus;

  // 開始仲間（次タスクの群れの祖で利用、配列はコピーして不変性を保つ）
  if (e.startAlly) {
    const am = 1 + (next.tb.aA || 0) + (e.allyAtkBonus || 0);
    next.al = [
      ...r.al,
      {
        n: e.startAlly.n,
        hp: Math.floor(e.startAlly.hp),
        mhp: Math.floor(e.startAlly.hp),
        atk: Math.floor(e.startAlly.atk * am),
        t: e.startAlly.t, a: 1, h: e.startAlly.h, tk: e.startAlly.tk,
      },
    ];
  }

  return next;
}
```

> `clamp(value, min, max)` は `domain/shared/utils` の既存ユーティリティ（`game-logic.ts` が re-export 済み）。シグネチャが異なる場合は `Math.min(1, Math.max(0, ...))` に読み替える。

- [ ] **Step 5: game-logic から re-export**

`src/features/primal-path/game-logic.ts` の「バイオームサービス」エクスポート行の直後に追加:

```typescript
// トーテムサービス
export { applyTotem } from './domain/totem/totem-service';
```

- [ ] **Step 6: テスト成功を確認**

Run: `npm test -- totem-service`
Expected: PASS（血の祖の2テスト含め全て）

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/types/game-state.ts src/features/primal-path/domain/totem/totem-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "feat: applyTotem 純粋関数と血の祖の効果を実装"
```

---

## Task 3: 炎の祖（burnDmgMul の戦闘適用）

炎の祖の `burnDmgMul` を `applyTotem` で設定し、`tickPlayerPhase` の火傷ダメージ計算へ反映する。

**Files:**
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts:75-80`
- Test: `src/features/primal-path/__tests__/totem-service.test.ts`

**Interfaces:**
- Consumes: `applyTotem`（Task 2）、`RunState.burnDmgMul`
- Produces: 火傷ダメージ = `floor(pa.dmg * 0.2 * sb.burnMul * (next.burnDmgMul ?? 1))`

- [ ] **Step 1: テストを追記（失敗する）**

`src/features/primal-path/__tests__/totem-service.test.ts` の末尾に追記:

```typescript
import { tick } from '../game-logic';

describe('applyTotem — 炎の祖', () => {
  it('burnDmgMul を 1.25 に設定する', () => {
    const r = applyTotem(makeRun({}), 'flame');
    expect(r.burnDmgMul).toBeCloseTo(1.25, 5);
  });

  it('火傷ダメージが burnDmgMul で増加する', () => {
    // 火傷あり・会心しない固定RNG（rng=0.99）で2ランを比較
    const baseRun = makeRun({
      atk: 100, aM: 1, dm: 1, burn: 1, cr: 0, def: 0,
      en: { n: 'test', hp: 100000, mhp: 100000, atk: 1, def: 0, bone: 0 },
    });
    const normal = tick(baseRun, false, () => 0.99);
    const flame = tick(applyTotem(baseRun, 'flame'), false, () => 0.99);
    const dmgNormal = normal.nextRun.dmgDealt;
    const dmgFlame = flame.nextRun.dmgDealt;
    // 火傷分のみ +25%。通常攻撃は同値なので flame 側が大きい
    expect(dmgFlame).toBeGreaterThan(dmgNormal);
  });
});
```

> `makeRun` の `en`（敵）指定方法が異なる場合は `test-helpers.ts` の敵生成方法に合わせること。敵HPは1ターンで倒れないよう十分大きく設定する。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- totem-service`
Expected: FAIL（`dmgFlame` と `dmgNormal` が同値 — burnDmgMul 未適用）

- [ ] **Step 3: tickPlayerPhase を修正**

`src/features/primal-path/domain/battle/tick-phases.ts` の火傷ブロック（現在 75-80行）を置換:

```typescript
  if (next.burn) {
    const bd = Math.floor(pa.dmg * 0.2 * sb.burnMul * (next.burnDmgMul ?? 1));
    e.hp -= bd;
    next.dmgDealt += bd;
    next.log.push({ x: '  🔥 火傷 ' + bd, c: 'tc' });
  }
```

- [ ] **Step 4: テスト成功を確認**

Run: `npm test -- totem-service`
Expected: PASS

- [ ] **Step 5: 回帰確認（既存の戦闘テスト）**

Run: `npm test -- game-logic tick`
Expected: PASS（`burnDmgMul ?? 1` の既定値により既存挙動は不変）

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/battle/tick-phases.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "feat: 炎の祖の火傷ダメージ倍率を戦闘ティックへ適用"
```

---

## Task 4: 群れの祖（仲間枠＋開始仲間＋仲間ATK）

群れの祖の `applyTotem` 効果（開始仲間・枠+1）を検証し、以後のリクルート ATK に `allyAtkBonus` を反映する。

**Files:**
- Modify: `src/features/primal-path/domain/evolution/evolution-service.ts:92-100`
- Test: `src/features/primal-path/__tests__/totem-service.test.ts`

**Interfaces:**
- Consumes: `applyTotem`（Task 2）、`RunState.allyAtkBonus`、`applyEvo`（既存）
- Produces: `applyEvo` のリクルート ATK = `floor(tpl.atk * (1 + tb.aA + (allyAtkBonus ?? 0)))`

- [ ] **Step 1: テストを追記（失敗する）**

`src/features/primal-path/__tests__/totem-service.test.ts` の末尾に追記:

```typescript
import { applyEvo } from '../game-logic';
import { EVOS } from '../constants';

describe('applyTotem — 群れの祖', () => {
  it('仲間枠+1・開始仲間1体・allyAtkBonus を設定する', () => {
    const base = makeRun({ al: [], mxA: 3 });
    const r = applyTotem(base, 'pack');
    expect(r.mxA).toBe(4);
    expect(r.al).toHaveLength(1);
    expect(r.al[0].a).toBe(1);
    expect(r.allyAtkBonus).toBeCloseTo(0.1, 5);
  });

  it('群れの祖の後にリクルートした仲間 ATK に +10% が乗る', () => {
    // life 系進化で文明Lv2に到達させ仲間加入させる。
    // life 進化を2回適用（Lv2 でリクルート発生）
    const lifeEvo = EVOS.find(e => e.t === 'life')!;
    let r = applyTotem(makeRun({ al: [], mxA: 4, cL: 0 }), 'pack');
    const before = r.al.length;
    r = applyEvo(r, lifeEvo, () => 0).nextRun; // Lv1
    r = applyEvo(r, lifeEvo, () => 0).nextRun; // Lv2 → リクルート
    const recruited = r.al[r.al.length - 1];
    // tb.aA=0 想定。テンプレ atk に 1.1 が乗っていること（floor 後）
    expect(r.al.length).toBeGreaterThan(before);
    expect(recruited.atk).toBeGreaterThan(0);
  });
});
```

> リクルートは文明Lv 2/4/6 で発生（`applyEvo` 参照）。テスト中の civ レベル前提（`cL`）と適用回数は `test-helpers.ts` / `civLv` 実装に合わせて調整すること。本テストの主眼は「`allyAtkBonus` が `applyEvo` の ATK 計算に反映されること」。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- totem-service`
Expected: FAIL（リクルート ATK に allyAtkBonus 未反映 / 値不一致）

- [ ] **Step 3: applyEvo のリクルート ATK を修正**

`src/features/primal-path/domain/evolution/evolution-service.ts` の仲間リクルートブロック（現在 91-101行）の `am` 算出を置換:

```typescript
    const ts = ALT[ev.t];
    const tpl = ts[rng() * ts.length | 0];
    const hm = 1 + next.tb.aH;
    const am = 1 + next.tb.aA + (next.allyAtkBonus ?? 0);
```

（`next.al.push({...})` 以下は変更なし）

- [ ] **Step 4: テスト成功を確認**

Run: `npm test -- totem-service`
Expected: PASS

- [ ] **Step 5: 回帰確認**

Run: `npm test -- game-logic synergy`
Expected: PASS（`allyAtkBonus ?? 0` の既定で既存挙動不変）

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/evolution/evolution-service.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "feat: 群れの祖の仲間ATKボーナスをリクルートへ反映"
```

---

## Task 5: totem フェーズと遷移テーブル

`GamePhase` に `'totem'` を追加し、`diff/challenge → totem → biome/evo` を許可する。

**Files:**
- Modify: `src/features/primal-path/types/phase.ts`
- Test: `src/features/primal-path/__tests__/phase-transitions.test.ts`

**Interfaces:**
- Produces: `GamePhase` に `'totem'`。`PHASE_TRANSITIONS.diff = ['totem', 'title']`、`PHASE_TRANSITIONS.challenge = ['totem', 'title']`、`PHASE_TRANSITIONS.totem = ['biome', 'evo', 'title']`

- [ ] **Step 1: テストを更新（失敗する）**

`src/features/primal-path/__tests__/phase-transitions.test.ts` の `allPhases` 配列に `'totem'` を追加:

```typescript
      const allPhases: GamePhase[] = [
        'title', 'diff', 'how', 'tree', 'biome', 'evo', 'battle',
        'awakening', 'prefinal', 'endless_checkpoint', 'ally_revive',
        'event', 'over', 'stats', 'achievements', 'challenge', 'totem',
      ];
```

同ファイルの `describe('GamePhase ステートマシン', ...)` 内に新しい `describe` を追加:

```typescript
  describe('トーテムフェーズ', () => {
    it('diff から totem に遷移できる', () => {
      expect(isValidTransition('diff', 'totem')).toBe(true);
    });
    it('challenge から totem に遷移できる', () => {
      expect(isValidTransition('challenge', 'totem')).toBe(true);
    });
    it('totem から biome / evo に遷移できる', () => {
      expect(isValidTransition('totem', 'biome')).toBe(true);
      expect(isValidTransition('totem', 'evo')).toBe(true);
    });
  });
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- phase-transitions`
Expected: FAIL（`totem` がテーブルに存在しない）

- [ ] **Step 3: phase.ts を更新**

`src/features/primal-path/types/phase.ts` の `GamePhase` union に `'totem'` を追加（`'challenge'` の後）:

```typescript
  | 'challenge'
  | 'totem';
```

`PHASE_TRANSITIONS` を更新（`diff`・`challenge` の値を変更し、`totem` キーを追加）:

```typescript
  diff: ['totem', 'title'],
```

```typescript
  challenge: ['totem', 'title'],
```

`PHASE_TRANSITIONS` オブジェクトの末尾（`achievements: ['title'],` の後）に追加:

```typescript
  totem: ['biome', 'evo', 'title'],
```

- [ ] **Step 4: テスト成功を確認**

Run: `npm test -- phase-transitions`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/primal-path/types/phase.ts src/features/primal-path/__tests__/phase-transitions.test.ts
git commit -m "feat: totem フェーズと遷移を追加"
```

---

## Task 6: pendingStart 状態と GO_TOTEM / START_RUN 配線

難易度選択でトーテム画面へ進み、トーテム選択でランを開始するための reducer 配線を行う。

**Files:**
- Modify: `src/features/primal-path/types/game-state.ts`
- Modify: `src/features/primal-path/hooks/actions.ts`
- Modify: `src/features/primal-path/hooks/use-game-state.ts`
- Modify: `src/features/primal-path/domain/progression/run-service.ts`
- Modify: `src/features/primal-path/hooks/reducers/progression-reducer.ts`
- Test: `src/features/primal-path/__tests__/reducer.test.ts`

**Interfaces:**
- Consumes: `applyTotem`（Task 2）、`startRunState`（既存）
- Produces:
  - `GameState.pendingStart?: { di: number; loopOverride: number; challengeId?: string } | null`
  - Action `{ type: 'GO_TOTEM'; di: number; loopOverride: number; challengeId?: string }`
  - `START_RUN`/`START_CHALLENGE` に `totemId: TotemId` フィールド追加
  - `startRunState(di: number, save: SaveData, totemId?: TotemId): RunState`（`totemId` 指定時は内部で `applyTotem` を適用）

- [ ] **Step 1: テストを書く（失敗する）**

`src/features/primal-path/__tests__/reducer.test.ts` に新しい `describe` を追記（既存の import 構成に合わせて `gameReducer`・`initialState` を import 済み前提。無い場合は先頭で import する）:

```typescript
import { gameReducer } from '../hooks/use-game-state';
import { initialState } from '../hooks/use-game-state';

describe('トーテム開始フロー', () => {
  it('GO_TOTEM で phase=totem になり pendingStart が記録される', () => {
    const s0 = { ...initialState(), phase: 'diff' as const };
    const s1 = gameReducer(s0, { type: 'GO_TOTEM', di: 1, loopOverride: 0 });
    expect(s1.phase).toBe('totem');
    expect(s1.pendingStart).toEqual({ di: 1, loopOverride: 0, challengeId: undefined });
  });

  it('START_RUN に totemId を渡すと run.totemId が設定される', () => {
    const s0 = { ...initialState(), phase: 'totem' as const,
      pendingStart: { di: 0, loopOverride: 0 } };
    const s1 = gameReducer(s0, { type: 'START_RUN', di: 0, loopOverride: 0, totemId: 'blood' });
    expect(s1.run).not.toBeNull();
    expect(s1.run!.totemId).toBe('blood');
    expect(s1.pendingStart).toBeNull();
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- reducer`
Expected: FAIL（`GO_TOTEM` 未処理 / `totemId` プロパティが型に無い）

- [ ] **Step 3: GameState に pendingStart を追加**

`src/features/primal-path/types/game-state.ts` の `GameState` インターフェース末尾（`newAchievements: string[];` の後）に追加:

```typescript
  /** トーテム選択前に保持する開始パラメータ */
  pendingStart?: { di: number; loopOverride: number; challengeId?: string } | null;
```

- [ ] **Step 4: アクション型を更新**

`src/features/primal-path/hooks/actions.ts` の `ProgressionAction` を更新。先頭の import に `TotemId` を追加:

```typescript
import type {
  GamePhase, RunState, Evolution, SaveData,
  BiomeId, ASkillId, EventChoice, RandomEventDef, TotemId,
} from '../types';
```

`ProgressionAction` の `START_RUN`・`START_CHALLENGE` を変更し `GO_TOTEM` を追加:

```typescript
export type ProgressionAction =
  | { type: 'START_RUN'; di: number; loopOverride: number; totemId: TotemId }
  | { type: 'START_CHALLENGE'; challengeId: string; di: number; totemId: TotemId }
  | { type: 'GO_TOTEM'; di: number; loopOverride: number; challengeId?: string }
  | { type: 'GO_DIFF' }
  | { type: 'GO_HOW' }
  | { type: 'GO_TREE' }
  | { type: 'PREPARE_BIOME_SELECT' }
  | { type: 'PICK_BIOME'; biome: BiomeId }
  | { type: 'GO_FINAL_BOSS' }
  | { type: 'BIOME_CLEARED' }
  | { type: 'SET_PHASE'; phase: GamePhase };
```

`PROGRESSION_TYPES` セットに `'GO_TOTEM'` を追加:

```typescript
const PROGRESSION_TYPES: ReadonlySet<string> = new Set([
  'START_RUN', 'START_CHALLENGE', 'GO_TOTEM', 'GO_DIFF', 'GO_HOW', 'GO_TREE',
  'PREPARE_BIOME_SELECT', 'PICK_BIOME', 'GO_FINAL_BOSS', 'BIOME_CLEARED',
  'SET_PHASE',
]);
```

- [ ] **Step 5: initialState に pendingStart を追加**

`src/features/primal-path/hooks/use-game-state.ts` の `initialState` 戻り値の `newAchievements: [],` の後に追加:

```typescript
    pendingStart: null,
```

- [ ] **Step 6: startRunState に totemId 引数を追加**

`src/features/primal-path/domain/progression/run-service.ts` の import に `applyTotem`・`TotemId` を追加し、シグネチャと return を変更。

import 部:

```typescript
import type { RunState, SaveData, BiomeId, Difficulty, RunStats, TotemId } from '../../types';
import { DIFFS, WAVES_PER_BIOME, LOOP_SCALE_FACTOR } from '../../constants';
import { getTB } from './tree-service';
import { calcSynergies } from '../evolution/synergy-service';
import { applyTotem } from '../totem/totem-service';
```

`startRunState` のシグネチャを変更:

```typescript
export function startRunState(di: number, save: SaveData, totemId?: TotemId): RunState {
```

関数末尾の `return { ... };` を一旦ローカル変数に受け、トーテム適用を挟む。`return {` を以下に置換し、オブジェクト直後の `;` の後に適用処理を追加:

```typescript
  const run: RunState = {
    hp: 80 + tb.bH, mhp: 80 + tb.bH, atk: 8 + tb.bA, def: 2 + tb.bD,
    cr: Math.min(0.05 + tb.cr, 1), burn: 0, aM: 1, dm: 1 + tb.dM,
    cT: tb.sC, cL: tb.sC, cR: tb.sC,
    al: [], bms,
    cB: 0, cBT: bms[0], cW: 0, wpb: WAVES_PER_BIOME, bE: 0, bb: 0,
    di, dd, fe: null, tb,
    mxA: 3 + tb.aS, evoN: 3 + tb.eN,
    fReq: 5 + tb.fQ, saReq: 4 + tb.aQ,
    rvU: 0, bc: 0, log: [], turn: 0, kills: 0,
    dmgDealt: 0, dmgTaken: 0, maxHit: 0, wDmg: 0, wTurn: 0,
    awoken: [],
    en: null,
    sk: { avl: [], cds: {}, bfs: [] },
    evs: [],
    btlCount: 0, eventCount: 0,
    skillUseCount: 0, totalHealing: 0,
    loopCount: save.loopCount ?? 0,
    isEndless: false,
    endlessWave: 0,
    _wDmgBase: 0, _fbk: '', _fPhase: 0,
    burnDmgMul: 1, allyAtkBonus: 0,
  };
  return totemId ? applyTotem(run, totemId) : run;
```

- [ ] **Step 7: progression-reducer を更新**

`src/features/primal-path/hooks/reducers/progression-reducer.ts` の `START_RUN`・`START_CHALLENGE` を totemId 対応にし、`GO_TOTEM` を追加。

`START_RUN` ケースを置換:

```typescript
    case 'START_RUN': {
      const save = { ...state.save, runs: state.save.runs + 1, loopCount: action.loopOverride };
      const run = startRunState(action.di, save, action.totemId);
      return { ...setupInitialRun(state, run, save), pendingStart: null };
    }
```

`GO_DIFF` ケースの直前に `GO_TOTEM` を追加:

```typescript
    case 'GO_TOTEM':
      return {
        ...state, phase: 'totem',
        pendingStart: { di: action.di, loopOverride: action.loopOverride, challengeId: action.challengeId },
      };
```

`START_CHALLENGE` ケースの `startRunState(action.di, save)` を `startRunState(action.di, save, action.totemId)` に変更し、return を `pendingStart: null` 付きに:

```typescript
      let run = startRunState(action.di, save, action.totemId);
```

```typescript
      return { ...setupInitialRun(state, run, save, { newAchievements: [], pendingStart: null }) };
```

- [ ] **Step 8: テスト成功を確認**

Run: `npm test -- reducer`
Expected: PASS

- [ ] **Step 9: 回帰確認 ＋ 型チェック**

Run: `npm test -- reducer progression && npm run typecheck`
Expected: PASS（既存の `START_RUN`/`START_CHALLENGE` 呼び出し箇所は Task 7 で UI 更新するまで型エラーが出る場合があるため、typecheck エラーが UI 由来であれば Task 7 完了後に再確認する）

> 注: この時点で `DifficultyScreen`/`ChallengeScreen` はまだ旧 dispatch のため、`npm run typecheck` で `totemId` 欠落エラーが出る。Task 7 で解消する。reducer 単体テストの PASS を本タスクの完了条件とする。

- [ ] **Step 10: コミット**

```bash
git add src/features/primal-path/types/game-state.ts src/features/primal-path/hooks/actions.ts src/features/primal-path/hooks/use-game-state.ts src/features/primal-path/domain/progression/run-service.ts src/features/primal-path/hooks/reducers/progression-reducer.ts src/features/primal-path/__tests__/reducer.test.ts
git commit -m "feat: GO_TOTEM/pendingStart とトーテム付きラン開始の reducer を実装"
```

---

## Task 7: TotemSelectScreen UI とオーケストレータ配線

トーテム選択画面を作成し、難易度/チャレンジ選択 → トーテム → ラン開始の流れを完成させる。

**Files:**
- Create: `src/features/primal-path/components/TotemSelectScreen.tsx`
- Modify: `src/features/primal-path/components/DifficultyScreen.tsx`
- Modify: `src/features/primal-path/components/ChallengeScreen.tsx`
- Modify: `src/features/primal-path/PrimalPathGame.tsx`
- Test: `src/features/primal-path/__tests__/TotemSelectScreen.test.tsx`

**Interfaces:**
- Consumes: `TOTEMS`（Task 1）、`save.clears`、`GO_TOTEM`/`START_RUN`/`START_CHALLENGE`（Task 6）
- Produces:
  - `TotemSelectScreen` props: `{ save: SaveData; pendingStart: { di: number; loopOverride: number; challengeId?: string }; dispatch: React.Dispatch<GameAction>; playSfx: (t: SfxType) => void }`
  - 解放済みトーテム＝`TOTEMS.filter(t => save.clears >= t.unlock)`（Phase 1 は全て unlock=0 のため常に3種）
  - トーテム選択時: `challengeId` 有→`START_CHALLENGE`、無→`START_RUN`

- [ ] **Step 1: UI テストを書く（失敗する）**

`src/features/primal-path/__tests__/TotemSelectScreen.test.tsx` を新規作成:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TotemSelectScreen } from '../components/TotemSelectScreen';
import { FRESH_SAVE } from '../constants';

const baseSave = { ...FRESH_SAVE, tree: {}, best: {} };

describe('TotemSelectScreen', () => {
  it('解放済みトーテム（基本3種）を表示する', () => {
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 0, loopOverride: 0 }}
        dispatch={jest.fn()}
        playSfx={jest.fn()}
      />,
    );
    expect(screen.getByText(/血の祖/)).toBeInTheDocument();
    expect(screen.getByText(/炎の祖/)).toBeInTheDocument();
    expect(screen.getByText(/群れの祖/)).toBeInTheDocument();
  });

  it('トーテムをクリックすると START_RUN を totemId 付きで dispatch する', () => {
    const dispatch = jest.fn();
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 2, loopOverride: 1 }}
        dispatch={dispatch}
        playSfx={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/血の祖/));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'START_RUN', di: 2, loopOverride: 1, totemId: 'blood' }),
    );
  });

  it('challengeId 有の場合 START_CHALLENGE を dispatch する', () => {
    const dispatch = jest.fn();
    render(
      <TotemSelectScreen
        save={baseSave}
        pendingStart={{ di: 0, loopOverride: 0, challengeId: 'hp_half' }}
        dispatch={dispatch}
        playSfx={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/炎の祖/));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'START_CHALLENGE', challengeId: 'hp_half', di: 0, totemId: 'flame' }),
    );
  });
});
```

> `challengeId: 'hp_half'` は例示。実際の `CHALLENGES` の id は本テストでは未使用（dispatch 引数の透過のみ検証）なので任意文字列で良い。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- TotemSelectScreen`
Expected: FAIL（`TotemSelectScreen` が存在しない）

- [ ] **Step 3: TotemSelectScreen を実装**

`src/features/primal-path/components/TotemSelectScreen.tsx` を新規作成:

```typescript
/**
 * 始祖トーテム選択画面
 * ラン開始時に戦い方の軸（横軸）とカーブ（縦軸）を決める。
 */
import React from 'react';
import type { SaveData, SfxType, TotemId, PowerCurve } from '../types';
import type { GameAction } from '../hooks';
import { TOTEMS } from '../constants';
import { Screen, SubTitle, Divider, GameButton } from '../styles';

/** カーブの表示ラベル */
const CURVE_LABEL: Readonly<Record<PowerCurve, string>> = {
  front: '⚡ 即効',
  scaling: '🌱 晩成',
  combo: '🔗 コンボ',
  wild: '🃏 ワイルド',
};

interface Props {
  save: SaveData;
  pendingStart: { di: number; loopOverride: number; challengeId?: string };
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const TotemSelectScreen: React.FC<Props> = ({ save, pendingStart, dispatch, playSfx }) => {
  const available = TOTEMS.filter(t => save.clears >= t.unlock);

  const handlePick = (totemId: TotemId): void => {
    playSfx('click');
    if (pendingStart.challengeId) {
      dispatch({ type: 'START_CHALLENGE', challengeId: pendingStart.challengeId, di: pendingStart.di, totemId });
    } else {
      dispatch({ type: 'START_RUN', di: pendingStart.di, loopOverride: pendingStart.loopOverride, totemId });
    }
  };

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 8 }}>🗿</div>
      <SubTitle>始祖トーテムを選べ</SubTitle>
      <div style={{ color: '#908070', fontSize: 11, margin: '2px 0' }}>
        このランの戦い方の軸とテンポが決まる
      </div>
      <Divider />
      {available.map(t => (
        <GameButton
          key={t.id}
          style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
          onClick={() => handlePick(t.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f0c040', fontSize: 13 }}>{t.ic} {t.nm}</span>
            <span style={{ fontSize: 11, color: '#988070' }}>{CURVE_LABEL[t.curve]}</span>
          </div>
          <div style={{ color: '#988070', fontSize: 12, marginTop: 2 }}>{t.desc}</div>
        </GameButton>
      ))}
      <GameButton style={{ marginTop: 10 }} onClick={() => { playSfx('click'); dispatch({ type: 'GO_DIFF' }); }}>
        ◀ もどる
      </GameButton>
    </Screen>
  );
};
```

- [ ] **Step 4: テスト成功を確認**

Run: `npm test -- TotemSelectScreen`
Expected: PASS（3テスト）

- [ ] **Step 5: DifficultyScreen を更新**

`src/features/primal-path/components/DifficultyScreen.tsx` の `Props.onStart` の型コメントは据え置き、`onClick` の dispatch を変更する。難易度ボタンの `onClick`（現 68行）を変更:

```typescript
            onClick={() => { playSfx('click'); dispatch({ type: 'GO_TOTEM', di: i, loopOverride: selectedLoop }); }}
```

`onStart` prop はもう使わないため、Props から削除し関数引数からも除去:

```typescript
interface Props {
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const DifficultyScreen: React.FC<Props> = ({ save, dispatch, playSfx }) => {
```

- [ ] **Step 6: ChallengeScreen を更新**

`src/features/primal-path/components/ChallengeScreen.tsx` を開き、`onStartChallenge(challengeId, di)` を呼んでいる箇所を `dispatch({ type: 'GO_TOTEM', di, loopOverride: 0, challengeId })` に置換する。

具体手順:
1. ファイル内で `onStartChallenge` の呼び出し箇所を grep し、`onStartChallenge(<challengeId式>, <di式>)` を以下に置換:

```typescript
dispatch({ type: 'GO_TOTEM', di: <di式>, loopOverride: 0, challengeId: <challengeId式> });
```

2. `onStartChallenge` prop が他で未使用になれば Props 定義と分割代入から削除する。`dispatch` が Props に無ければ追加する（`dispatch: React.Dispatch<GameAction>`）。

> ChallengeScreen の現行シグネチャは未確認のため、実装時に該当ファイルを開いて呼び出し箇所と Props を確認してから最小変更を行うこと。チャレンジ開始演出（overlay）は totem 選択後の `START_CHALLENGE` 経路で従来通り表示される。

- [ ] **Step 7: PrimalPathGame を配線**

`src/features/primal-path/PrimalPathGame.tsx` を更新。

import に追加（`DifficultyScreen` import の直後）:

```typescript
import { TotemSelectScreen } from './components/TotemSelectScreen';
```

`handleStartRun` を「トーテムへ進む」用途に変更し、`START_RUN` の直接 dispatch をやめる。`handleStartRun`（136-141行）を削除し、`DifficultyScreen` の描画（162-164行）を `onStart` 無しに変更:

```typescript
        {phase === 'diff' && (
          <DifficultyScreen save={save} dispatch={dispatch} playSfx={playSfx} />
        )}
```

`handleStartChallenge`（143-147行）は不要になるため削除（チャレンジ開始演出は START_CHALLENGE 経由のままだが、overlay 表示は totem 選択直後に必要。overlay を維持するには `START_CHALLENGE`/`START_RUN` 前の演出を TotemSelectScreen 側ではなく、簡潔に省略する。Phase 1 ではトーテム選択クリック＝即開始とし、開始 overlay は省略してよい）。

`phase === 'diff'` ブロックの直後に totem フェーズの描画を追加:

```typescript
        {phase === 'totem' && state.pendingStart && (
          <TotemSelectScreen
            save={save}
            pendingStart={state.pendingStart}
            dispatch={dispatch}
            playSfx={playSfx}
          />
        )}
```

`phase === 'challenge'` ブロックの `onStartChallenge={handleStartChallenge}` を削除し、`dispatch`/`playSfx`/`save`/`aggregate` のみ渡す形に整える（ChallengeScreen は Step 6 で dispatch 直叩きに変更済み）。

> 開始演出（`showOverlay`）を残したい場合は Phase 1 範囲外の改善として別途検討。本タスクの完了条件は「diff → totem → ラン開始（evo フェーズ到達）」がテストで通ること。

- [ ] **Step 8: 統合テストと型チェック**

Run: `npm test -- TotemSelectScreen DifficultyScreen reducer && npm run typecheck`
Expected: PASS（`totemId` 欠落の型エラーが解消されていること）

- [ ] **Step 9: コミット**

```bash
git add src/features/primal-path/components/TotemSelectScreen.tsx src/features/primal-path/components/DifficultyScreen.tsx src/features/primal-path/components/ChallengeScreen.tsx src/features/primal-path/PrimalPathGame.tsx src/features/primal-path/__tests__/TotemSelectScreen.test.tsx
git commit -m "feat: トーテム選択画面と難易度/チャレンジからの配線を追加"
```

---

## Task 8: 全体検証と README 更新

Phase 1 全体を CI パイプラインで検証し、ゲームの README にトーテムを追記する。

**Files:**
- Modify: `src/features/primal-path/README.md`

**Interfaces:**
- Consumes: Task 1〜7 の成果

- [ ] **Step 1: CI 相当の全体検証**

Run: `npm run lint && npm run typecheck && npm test`
Expected: PASS（lint 警告ゼロ、型エラーなし、全テストグリーン）

失敗時は該当タスクに戻って修正する。lint の未使用 import（削除した `onStart`/`handleStartChallenge` 由来）があれば除去する。

- [ ] **Step 2: README にトーテムを追記**

`src/features/primal-path/README.md` の「## ゲームシステム」リスト内、`- **難易度**:` の直前に追加:

```markdown
- **始祖トーテム**: ラン開始時に戦い方の軸とパワーカーブ（⚡即効/🌱晩成/🔗コンボ）を選択。基本3種（血の祖/炎の祖/群れの祖）
```

- [ ] **Step 3: 手動動作確認（任意だが推奨）**

Run: `npm start`
ブラウザで PRIMAL PATH を開き、タイトル → ステージ選択 → トーテム選択画面が表示され、トーテムを選ぶとランが開始（進化選択へ遷移）することを確認する。

- [ ] **Step 4: コミット**

```bash
git add src/features/primal-path/README.md
git commit -m "docs: PRIMAL PATH README に始祖トーテムを追記"
```

---

## Self-Review（計画作成者によるチェック結果）

**1. Spec coverage（Phase 1 範囲）:**
- 始祖トーテム選択フロー（diff→totem→run） → Task 5,6,7 ✓
- 基本3種の効果（血/炎/群れ） → Task 2,3,4 ✓
- パワーカーブのメタ属性とUI表示 → Task 1（型）・Task 7（CURVE_LABEL 表示）✓
- `save.clears` による解放枠組み（Phase 1 は全 unlock=0） → Task 7 `available` フィルタ ✓
- 既存テスト非破壊（optional フィールド） → 全タスクで `?? 既定値` ✓
- Phase 2（キーストーンエンジン）・Phase 3（上位トーテム/コンボ/調整）は本計画の範囲外（別計画）。

**2. Placeholder scan:** 各 Step に実コード・実コマンド・期待結果を記載。`test-helpers.ts`/`ChallengeScreen.tsx` の現行シグネチャ未確認箇所は「実装時に確認」と明示した上で最小変更手順を提示（プレースホルダではなく確認指示）。

**3. Type consistency:** `TotemId`（'blood'|'flame'|'pack'）・`PowerCurve`・`applyTotem(r, totemId)`・`startRunState(di, save, totemId?)`・`GO_TOTEM`/`START_RUN.totemId`/`START_CHALLENGE.totemId`・`pendingStart` の名称と型を全タスクで一致させた。`burnDmgMul ?? 1`・`allyAtkBonus ?? 0` の既定値も統一。

---

## 次フェーズ（別計画として作成予定）

- **Phase 2: キーストーン効果エンジン＋10種＋節目提示** — `KeystoneId`/`ksStacks`、`domain/keystone/`、tick フック群、`keystone` フェーズ、`KeystoneScreen`、`rollE` 混入。
- **Phase 3: 上位トーテム3種＋コンボ／連携＋調整** — `TotemId` 拡張（rock/spirit/ember）、`save.clears` 解放、提示重み付け、シグネチャーコンボ統合テスト、`RunStats`/StatsScreen 連携、バランス調整。

各フェーズは Phase 1 マージ後に、それぞれ本ファイルと同形式の詳細計画を作成する。
