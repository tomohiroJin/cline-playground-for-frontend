# PRIMAL PATH キーストーン効果エンジン（Phase 2a）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「数を積む」ではなく「ルールを変える」キーストーン進化10種の効果エンジンを構築し、`RunState.keystones` に保持されたキーストーンが戦闘で発火するようにする（取得 UI は Phase 2b）。

**Architecture:** キーストーン効果ロジックを `domain/keystone/` に集約し、tick-phases の各フック点（攻撃前ATK算出・キル時・被ダメージ・敵攻撃・死亡判定・戦闘開始）から純粋関数として呼ぶ。スタック値（晩成系の累積）は `RunState.ksStacks` に保持し戦闘間も維持。新フィールドはすべて optional とし、使用箇所で `?? 既定値` して既存挙動を不変に保つ（Phase 1 と同じ後方互換戦略）。

**Tech Stack:** React 19 + TypeScript / useReducer ベースのフェーズステートマシン / Jest 30 + @testing-library/react

## Global Constraints

- 応答・コメント・ドキュメントは日本語。コード（変数名・関数名）は英語可。
- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先。
- ドメイン層（`domain/`）は外部依存なしの純粋関数。`presentation`/`infrastructure` を参照しない。
- 定数は `Object.freeze` で凍結する。
- TDD（Red → Green → Refactor）。新規コードカバレッジ 80%+、ビジネスロジック 90%+。
- テストは対象と同じ階層の `__tests__/` に `*.test.ts(x)` で配置。
- Conventional Commits（`feat:` / `test:` / `refactor:`）。1コミット＝1論理変更。
- 既存テスト（Phase 1 マージ後の全グリーン状態）を壊さない。`RunState` への新フィールドは optional（既存の `_wDmgBase`・`totemId`・`burnDmgMul` と同じ慣習）。
- `PowerCurve = 'front' | 'scaling' | 'combo' | 'wild'` は Phase 1 で定義済み（`types/totem.ts`）。再定義せず再利用する。
- このフィーチャには `types.ts`（後方互換 barrel・`import from '../types'` はこちらに解決）と `types/index.ts` の2 barrel がある。新型は**両方**に export する。
- 検証コマンド: `npm test`（全体）、`npm run typecheck`、`npm run lint`。

## 設計適応（spec からの調整・実装者は遵守すること）

spec のキーストーン効果のうち、現エンジンに合わせて以下を確定仕様とする（理由付き）。

- **連鎖の業火**: spec「倒した敵の火傷を次の敵へ継承」は、現エンジンの火傷モデル（`run.burn` はプレイヤー永続フラグで全敵に適用・敵は1体ずつ出現）と不整合。**確定仕様**: 「**火傷状態（`run.burn`）で敵を倒すと、火傷ダメージ倍率が永続 +0.2（ラン中スタック、`ksStacks['chain_blaze']` 管理）**」。火傷ビルドが倒すほど火力が伸びる🌱晩成寄りのコンボとして spec の「火傷が波を溶かし続ける」意図を保持する。
- **諸刃の進化**: 「DEFを0にし、失ったDEF×3をATKに変換」は tick 毎ではなく**取得時に1回だけ**適用する一過性の変換（`applyKeystone` 内）。
- **原始の咆哮**: 「各戦闘開始時ATK+50%、ウェーブ毎-10%減衰」は現ウェーブ `cW` から導出する乗算: `mult = 1 + max(0, 0.5 - 0.1 * (cW - 1))`（cW は `startBattle` で +1 された 1 始まりのウェーブ番号）。
- **永久凍結**: 「4ターンごとに敵の次の攻撃を無効化」は現ウェーブ内ターン数 `wTurn` を用い、`wTurn > 0 && wTurn % 4 === 0` のターンに敵ダメージを 0 にする。
- **不滅の祈り**: 「戦闘ごとに1回、致死をHP1で耐える」は per-battle フラグ `ksGuardUsed` を `startBattle` でリセットして管理。

## キーストーン一覧（id・タグ・カーブ・効果）

| id | nm | tag | curve | 効果（確定仕様） |
|---|---|---|---|---|
| `madblood` | 狂血の覚醒 | wild | front | HP30%以下の間 ATK×2 |
| `primal_roar` | 原始の咆哮 | hunt | front | ATK×(1+max(0,0.5-0.1*(cW-1))) |
| `hunter_stack` | 狩人の蓄積 | hunt | scaling | キルごとにATK+3恒久（ksStacks） |
| `wolf_pack` | 群狼の戦術 | tribe | scaling | 生存仲間1体ごとにATK×(1+0.1) |
| `bone_eater` | 骨喰らい | spirit | scaling | 獲得骨(bE)10ごとにATK+1 |
| `chain_blaze` | 連鎖の業火 | fire | combo | 火傷中にキルで火傷倍率+0.2恒久（ksStacks） |
| `thorn_guard` | 棘の守護 | shield | combo | 被ダメージの30%を敵に反射 |
| `eternal_freeze` | 永久凍結 | ice | combo | wTurn%4==0 のターンに敵攻撃を無効化 |
| `undying_prayer` | 不滅の祈り | regen | wild | 戦闘ごと1回、致死をHP1で耐える |
| `double_edge` | 諸刃の進化 | wild | wild | 取得時 DEF→0、失ったDEF×3をATKへ |

---

## File Structure

**新規作成:**
- `src/features/primal-path/types/keystone.ts` — `KeystoneId`・`KeystoneDef` 型。
- `src/features/primal-path/constants/keystone.ts` — `KEYSTONES` レジストリ（10種）。
- `src/features/primal-path/domain/keystone/keystone-service.ts` — 効果フック純粋関数群。
- `src/features/primal-path/__tests__/keystone-service.test.ts` — エンジンのテスト。

**修正:**
- `src/features/primal-path/types/keystone.ts` を `types/index.ts` と `types.ts` の両 barrel に re-export 追加。
- `src/features/primal-path/types/game-state.ts` — `RunState` に optional フィールド追加。
- `src/features/primal-path/constants/index.ts` — `KEYSTONES` を re-export。
- `src/features/primal-path/domain/battle/battle-service.ts:36-39` — `startBattle` に per-battle リセット配線。
- `src/features/primal-path/domain/battle/tick-phases.ts` — 各フックの呼び出し配線。
- `src/features/primal-path/game-logic.ts` — keystone-service を re-export。

---

## Task 1: キーストーンのデータモデルと定数（10種）

**Files:**
- Create: `src/features/primal-path/types/keystone.ts`
- Create: `src/features/primal-path/constants/keystone.ts`
- Modify: `src/features/primal-path/types/index.ts`, `src/features/primal-path/types.ts`, `src/features/primal-path/constants/index.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Produces:
  - `type KeystoneId = 'madblood' | 'primal_roar' | 'hunter_stack' | 'wolf_pack' | 'bone_eater' | 'chain_blaze' | 'thorn_guard' | 'eternal_freeze' | 'undying_prayer' | 'double_edge'`
  - `interface KeystoneDef { id: KeystoneId; nm: string; ic: string; tag: SynergyTag; curve: PowerCurve; desc: string }`
  - `const KEYSTONES: readonly KeystoneDef[]`（10種）

- [ ] **Step 1: テストを書く（失敗する）**

`src/features/primal-path/__tests__/keystone-service.test.ts` を新規作成:

```typescript
/**
 * キーストーン — 定数とエンジンのテスト
 */
import { KEYSTONES } from '../constants';
import type { KeystoneId } from '../types';

describe('KEYSTONES 定数', () => {
  it('10種が定義され、id が一意である', () => {
    expect(KEYSTONES).toHaveLength(10);
    const ids = KEYSTONES.map(k => k.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('各キーストーンは tag と curve を持つ', () => {
    for (const k of KEYSTONES) {
      expect(k.tag).toBeTruthy();
      expect(['front', 'scaling', 'combo', 'wild']).toContain(k.curve);
    }
  });

  it('代表 id が含まれる', () => {
    const ids = KEYSTONES.map(k => k.id);
    const expected: KeystoneId[] = ['madblood', 'chain_blaze', 'thorn_guard', 'double_edge'];
    expect(ids).toEqual(expect.arrayContaining(expected));
  });

  it('KEYSTONES は凍結されている', () => {
    expect(Object.isFrozen(KEYSTONES)).toBe(true);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（`KEYSTONES` が未エクスポート）

- [ ] **Step 3: 型を定義**

`src/features/primal-path/types/keystone.ts` を新規作成:

```typescript
/**
 * キーストーン進化（質的効果カード）の型定義
 */
import type { SynergyTag, PowerCurve } from './index';

/** キーストーン識別子（10種） */
export type KeystoneId =
  | 'madblood' | 'primal_roar' | 'hunter_stack' | 'wolf_pack' | 'bone_eater'
  | 'chain_blaze' | 'thorn_guard' | 'eternal_freeze' | 'undying_prayer' | 'double_edge';

/** キーストーン定義（メタ情報。効果ロジックは domain/keystone に分離） */
export interface KeystoneDef {
  readonly id: KeystoneId;
  readonly nm: string;
  readonly ic: string;
  readonly tag: SynergyTag;
  readonly curve: PowerCurve;
  readonly desc: string;
}
```

> `SynergyTag` と `PowerCurve` の import 元が `./index` で循環参照になる場合は、`SynergyTag` を `./evolution`、`PowerCurve` を `./totem` から直接 import すること（実装時に確認）。

- [ ] **Step 4: 定数を定義**

`src/features/primal-path/constants/keystone.ts` を新規作成:

```typescript
/**
 * キーストーン進化の定数レジストリ
 */
import type { KeystoneDef } from '../types';

/** キーストーン一覧（10種・アーキタイプ×カーブ網羅） */
export const KEYSTONES: readonly KeystoneDef[] = Object.freeze([
  Object.freeze({ id: 'madblood' as const, nm: '狂血の覚醒', ic: '🩸', tag: 'wild' as const, curve: 'front' as const, desc: 'HP30%以下の間 ATK×2' }),
  Object.freeze({ id: 'primal_roar' as const, nm: '原始の咆哮', ic: '🦁', tag: 'hunt' as const, curve: 'front' as const, desc: '序盤ATK+50%、ウェーブ毎に減衰' }),
  Object.freeze({ id: 'hunter_stack' as const, nm: '狩人の蓄積', ic: '🏹', tag: 'hunt' as const, curve: 'scaling' as const, desc: 'キルごとにATK+3（ラン中恒久）' }),
  Object.freeze({ id: 'wolf_pack' as const, nm: '群狼の戦術', ic: '🐺', tag: 'tribe' as const, curve: 'scaling' as const, desc: '生存仲間1体ごとにATK+10%' }),
  Object.freeze({ id: 'bone_eater' as const, nm: '骨喰らい', ic: '🦴', tag: 'spirit' as const, curve: 'scaling' as const, desc: '獲得骨10ごとにATK+1' }),
  Object.freeze({ id: 'chain_blaze' as const, nm: '連鎖の業火', ic: '🔥', tag: 'fire' as const, curve: 'combo' as const, desc: '火傷中にキルで火傷倍率+0.2（恒久）' }),
  Object.freeze({ id: 'thorn_guard' as const, nm: '棘の守護', ic: '🛡️', tag: 'shield' as const, curve: 'combo' as const, desc: '被ダメージの30%を反射' }),
  Object.freeze({ id: 'eternal_freeze' as const, nm: '永久凍結', ic: '🧊', tag: 'ice' as const, curve: 'combo' as const, desc: '4ターンごとに敵の攻撃を無効化' }),
  Object.freeze({ id: 'undying_prayer' as const, nm: '不滅の祈り', ic: '♻️', tag: 'regen' as const, curve: 'wild' as const, desc: '戦闘ごと1回、致死をHP1で耐える' }),
  Object.freeze({ id: 'double_edge' as const, nm: '諸刃の進化', ic: '⚔️', tag: 'wild' as const, curve: 'wild' as const, desc: 'DEFを0にし、失ったDEF×3をATKへ' }),
]);
```

- [ ] **Step 5: re-export を追加**

`src/features/primal-path/types/index.ts` の totem 型 re-export 行の直後に追加:

```typescript
export type { KeystoneId, KeystoneDef } from './keystone';
```

`src/features/primal-path/types.ts`（後方互換 barrel）の totem 型 export の近くに追加（実装時に totem 型がどう書かれているか確認し同じ形式で）:

```typescript
export type { KeystoneId, KeystoneDef } from './types/keystone';
```

`src/features/primal-path/constants/index.ts` の `export { TOTEMS } from './totem';` の直後に追加:

```typescript
export { KEYSTONES } from './keystone';
```

- [ ] **Step 6: テスト成功を確認**

Run: `npm test -- keystone-service`
Expected: PASS（4テスト）

- [ ] **Step 7: typecheck（barrel 解決の確認）**

Run: `npm run typecheck`
Expected: エラーなし（`KeystoneId`/`KeystoneDef`/`KEYSTONES` が `../types`・`../constants` から解決できる）

- [ ] **Step 8: コミット**

```bash
git add src/features/primal-path/types/keystone.ts src/features/primal-path/constants/keystone.ts src/features/primal-path/types/index.ts src/features/primal-path/types.ts src/features/primal-path/constants/index.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "feat: キーストーンのデータモデルと10種定数を追加"
```

---

## Task 2: RunState 拡張 ＋ keystone-service 基盤 ＋ applyKeystone（諸刃）＋ 戦闘開始リセット

**Files:**
- Modify: `src/features/primal-path/types/game-state.ts`
- Create: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/battle-service.ts:36-39`
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Consumes: `KeystoneId`, `KEYSTONES`（Task 1）
- Produces:
  - `RunState.keystones?: KeystoneId[]`・`RunState.ksStacks?: Record<string, number>`・`RunState.ksGuardUsed?: boolean`
  - `function hasKeystone(r: RunState, id: KeystoneId): boolean`
  - `function applyKeystone(r: RunState, id: KeystoneId): RunState`（取得時適用。純粋。`keystones` に id 追加。`double_edge` は `def→0`・`atk += lostDef*3`）
  - `function resetKeystoneBattleState(r: RunState): void`（per-battle 状態のリセット。`ksGuardUsed=false`。`startBattle` の `next` に対し破壊的に呼ぶ）

- [ ] **Step 1: テストを追記（失敗する）**

`__tests__/keystone-service.test.ts` の末尾に追記:

```typescript
import { hasKeystone, applyKeystone } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyKeystone / hasKeystone', () => {
  it('applyKeystone は keystones に id を追加し hasKeystone が true を返す', () => {
    const r = applyKeystone(makeRun({ keystones: [] }), 'madblood');
    expect(hasKeystone(r, 'madblood')).toBe(true);
  });

  it('諸刃の進化: DEFを0にし、失ったDEF×3をATKへ変換する', () => {
    const r = applyKeystone(makeRun({ atk: 10, def: 8, keystones: [] }), 'double_edge');
    expect(r.def).toBe(0);
    expect(r.atk).toBe(10 + 8 * 3); // 34
  });

  it('元の RunState を破壊しない（純粋）', () => {
    const base = makeRun({ atk: 10, def: 8, keystones: [] });
    applyKeystone(base, 'double_edge');
    expect(base.def).toBe(8);
    expect(base.atk).toBe(10);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（`hasKeystone`/`applyKeystone` 未定義）

- [ ] **Step 3: RunState を拡張**

`src/features/primal-path/types/game-state.ts` の `RunState` 本体（Phase 1 で追加した `allyAtkBonus?` の直後）に追加:

```typescript
  /** 取得済みキーストーン */
  keystones?: import('./keystone').KeystoneId[];
  /** キーストーンの累積スタック値（晩成系。例: hunter_stack=累積ATK, chain_blaze=火傷倍率加算） */
  ksStacks?: Record<string, number>;
  /** 不滅の祈りの戦闘内使用済みフラグ（startBattle でリセット） */
  ksGuardUsed?: boolean;
```

- [ ] **Step 4: keystone-service を実装**

`src/features/primal-path/domain/keystone/keystone-service.ts` を新規作成:

```typescript
/**
 * キーストーンサービス
 *
 * キーストーン効果を tick-phases の各フックから呼ぶ純粋関数群。
 * 効果ロジックを戦闘ティックから分離し、テスト容易性を保つ。
 */
import type { RunState, KeystoneId } from '../../types';

/** 指定キーストーンを取得済みか */
export function hasKeystone(r: RunState, id: KeystoneId): boolean {
  return (r.keystones ?? []).includes(id);
}

/** キーストーンを取得適用した新しい RunState を返す（純粋） */
export function applyKeystone(r: RunState, id: KeystoneId): RunState {
  const next: RunState = { ...r, keystones: [...(r.keystones ?? []), id] };

  // 諸刃の進化: DEFを0にし、失ったDEF×3をATKへ変換（取得時1回）
  if (id === 'double_edge') {
    const lostDef = next.def;
    next.def = 0;
    next.atk = next.atk + lostDef * 3;
  }

  return next;
}

/** 戦闘開始時に per-battle のキーストーン状態をリセットする（破壊的） */
export function resetKeystoneBattleState(r: RunState): void {
  r.ksGuardUsed = false;
}
```

- [ ] **Step 5: startBattle にリセットを配線**

`src/features/primal-path/domain/battle/battle-service.ts` の import に追加:

```typescript
import { resetKeystoneBattleState } from '../keystone/keystone-service';
```

`startBattle` 内、`next.wTurn = 0;`（38行目付近）の直後に追加:

```typescript
  resetKeystoneBattleState(next);
```

- [ ] **Step 6: game-logic から re-export**

`src/features/primal-path/game-logic.ts` の「トーテムサービス」エクスポート行の直後に追加:

```typescript
// キーストーンサービス
export { hasKeystone, applyKeystone, resetKeystoneBattleState } from './domain/keystone/keystone-service';
```

- [ ] **Step 7: テスト成功 ＋ 回帰確認**

Run: `npm test -- keystone-service battle-service`
Expected: PASS（`resetKeystoneBattleState` は新フィールドのみ変更のため既存 startBattle テスト不変）

- [ ] **Step 8: コミット**

```bash
git add src/features/primal-path/types/game-state.ts src/features/primal-path/domain/keystone/keystone-service.ts src/features/primal-path/domain/battle/battle-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "feat: keystone-service 基盤・諸刃の進化・戦闘開始リセットを実装"
```

---

## Task 3: ATK算出フック（狂血・原始の咆哮・群狼・骨喰らい・狩人累積）

5つの ATK 修飾キーストーンを単一フック `keystonePlayerAtkMods` に集約し、`tickPlayerPhase` の既存「一時ボーナス適用→復元」パターンに乗せる。

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts:46-57`
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Consumes: `hasKeystone`（Task 2）、`aliveAllies`（`domain/battle/combat-calculator`）
- Produces: `function keystonePlayerAtkMods(r: RunState): { flatAdd: number; mult: number }`
  - flatAdd = bone_eater（`floor((r.bE ?? 0)/10)`）+ hunter_stack（`r.ksStacks?.hunter_stack ?? 0`）
  - mult = madblood（hp<mhp*0.3 で ×2）× wolf_pack（`1 + 0.1*生存仲間数`）× primal_roar（`1 + max(0, 0.5 - 0.1*(cW-1))`）

- [ ] **Step 1: テストを追記（失敗する）**

`__tests__/keystone-service.test.ts` の末尾に追記:

```typescript
import { keystonePlayerAtkMods } from '../game-logic';

describe('keystonePlayerAtkMods', () => {
  it('狂血の覚醒: HP30%以下で mult ×2', () => {
    const low = makeRun({ hp: 20, mhp: 100, keystones: ['madblood'] });
    expect(keystonePlayerAtkMods(low).mult).toBeCloseTo(2, 5);
    const high = makeRun({ hp: 80, mhp: 100, keystones: ['madblood'] });
    expect(keystonePlayerAtkMods(high).mult).toBeCloseTo(1, 5);
  });

  it('群狼の戦術: 生存仲間1体ごとに +10%', () => {
    const al = [
      { n: 'a', hp: 1, mhp: 1, atk: 1, t: 'life' as const, a: 1 as const },
      { n: 'b', hp: 1, mhp: 1, atk: 1, t: 'life' as const, a: 1 as const },
    ];
    const r = makeRun({ al, keystones: ['wolf_pack'] });
    expect(keystonePlayerAtkMods(r).mult).toBeCloseTo(1.2, 5);
  });

  it('骨喰らい: 獲得骨10ごとに +1（flat）', () => {
    const r = makeRun({ bE: 35, keystones: ['bone_eater'] });
    expect(keystonePlayerAtkMods(r).flatAdd).toBe(3);
  });

  it('狩人の蓄積: ksStacks.hunter_stack を flat 加算', () => {
    const r = makeRun({ ksStacks: { hunter_stack: 9 }, keystones: ['hunter_stack'] });
    expect(keystonePlayerAtkMods(r).flatAdd).toBe(9);
  });

  it('原始の咆哮: cW=1 で +50%、cW=3 で +30%', () => {
    expect(keystonePlayerAtkMods(makeRun({ cW: 1, keystones: ['primal_roar'] })).mult).toBeCloseTo(1.5, 5);
    expect(keystonePlayerAtkMods(makeRun({ cW: 3, keystones: ['primal_roar'] })).mult).toBeCloseTo(1.3, 5);
  });

  it('キーストーン無しなら flatAdd=0, mult=1', () => {
    const r = makeRun({ keystones: [] });
    expect(keystonePlayerAtkMods(r)).toEqual({ flatAdd: 0, mult: 1 });
  });
});
```

> `makeRun` の `al`（仲間）指定方法は `test-helpers.ts` を確認し、`Ally` 型の必須フィールド（`n,hp,mhp,atk,t,a`）に合わせること。

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（`keystonePlayerAtkMods` 未定義）

- [ ] **Step 3: keystonePlayerAtkMods を実装**

`src/features/primal-path/domain/keystone/keystone-service.ts` の import に追加:

```typescript
import { aliveAllies } from '../battle/combat-calculator';
```

末尾に追加:

```typescript
/** プレイヤー攻撃前の ATK 修飾（flat 加算と乗算）を集計する */
export function keystonePlayerAtkMods(r: RunState): { flatAdd: number; mult: number } {
  let flatAdd = 0;
  let mult = 1;

  // 晩成系の flat 加算
  if (hasKeystone(r, 'bone_eater')) flatAdd += Math.floor((r.bE ?? 0) / 10);
  if (hasKeystone(r, 'hunter_stack')) flatAdd += r.ksStacks?.hunter_stack ?? 0;

  // 乗算系
  if (hasKeystone(r, 'madblood') && r.hp < r.mhp * 0.3) mult *= 2;
  if (hasKeystone(r, 'wolf_pack')) mult *= 1 + 0.1 * aliveAllies(r.al).length;
  if (hasKeystone(r, 'primal_roar')) mult *= 1 + Math.max(0, 0.5 - 0.1 * (r.cW - 1));

  return { flatAdd, mult };
}
```

- [ ] **Step 4: tickPlayerPhase に配線**

`src/features/primal-path/domain/battle/tick-phases.ts` の import に追加:

```typescript
import { keystonePlayerAtkMods } from '../keystone/keystone-service';
```

`tickPlayerPhase` のシナジー一時適用ブロック（46-50行）を、キーストーン修飾も含めるよう変更:

```typescript
  // シナジー＋キーストーンの ATK ボーナスを一時適用
  const prevAtk = next.atk;
  const prevCr = next.cr;
  const ksMods = keystonePlayerAtkMods(next);
  next.atk = Math.floor((next.atk + sb.atkBonus + ksMods.flatAdd) * ksMods.mult);
  next.cr = Math.min(next.cr + sb.crBonus / 100, 1);
```

（54-57行の復元ブロックはそのまま。`next.atk = prevAtk;` で元に戻る。）

- [ ] **Step 5: game-logic から re-export**

`src/features/primal-path/game-logic.ts` のキーストーンサービス行を更新:

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods } from './domain/keystone/keystone-service';
```

- [ ] **Step 6: テスト成功 ＋ 回帰確認**

Run: `npm test -- keystone-service game-logic tick`
Expected: PASS（キーストーン無しなら `flatAdd=0,mult=1` で既存ダメージ計算は不変）

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/domain/keystone/keystone-service.ts src/features/primal-path/domain/battle/tick-phases.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "feat: ATK算出フック（狂血/原始の咆哮/群狼/骨喰らい/狩人累積）を実装"
```

---

## Task 4: キル時フック（狩人の蓄積・連鎖の業火）＋ 火傷倍率反映

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts`（kill 判定ブロック ＋ 火傷計算行）
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Consumes: `hasKeystone`（Task 2）
- Produces: `function onKeystoneKill(r: RunState): void`（破壊的。`ksStacks` を初期化しつつ更新。hunter_stack: +3、chain_blaze: 火傷中(`r.burn`)なら +0.2）
- 火傷ダメージ計算に `(1 + (r.ksStacks?.chain_blaze ?? 0))` を乗算。

- [ ] **Step 1: テストを追記（失敗する）**

```typescript
import { onKeystoneKill } from '../game-logic';

describe('onKeystoneKill', () => {
  it('狩人の蓄積: キルで ksStacks.hunter_stack が +3 される', () => {
    const r = makeRun({ keystones: ['hunter_stack'], ksStacks: {} });
    onKeystoneKill(r);
    onKeystoneKill(r);
    expect(r.ksStacks?.hunter_stack).toBe(6);
  });

  it('連鎖の業火: 火傷中のキルで chain_blaze が +0.2、非火傷では増えない', () => {
    const burning = makeRun({ keystones: ['chain_blaze'], burn: 1, ksStacks: {} });
    onKeystoneKill(burning);
    expect(burning.ksStacks?.chain_blaze).toBeCloseTo(0.2, 5);

    const notBurning = makeRun({ keystones: ['chain_blaze'], burn: 0, ksStacks: {} });
    onKeystoneKill(notBurning);
    expect(notBurning.ksStacks?.chain_blaze ?? 0).toBe(0);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL（`onKeystoneKill` 未定義）

- [ ] **Step 3: onKeystoneKill を実装**

`keystone-service.ts` 末尾に追加:

```typescript
/** 敵撃破時のキーストーン処理（破壊的。スタック更新） */
export function onKeystoneKill(r: RunState): void {
  if (!r.keystones?.length) return;
  const stacks: Record<string, number> = { ...(r.ksStacks ?? {}) };
  if (hasKeystone(r, 'hunter_stack')) stacks.hunter_stack = (stacks.hunter_stack ?? 0) + 3;
  if (hasKeystone(r, 'chain_blaze') && r.burn) stacks.chain_blaze = (stacks.chain_blaze ?? 0) + 0.2;
  r.ksStacks = stacks;
}
```

- [ ] **Step 4: tick の kill 判定と火傷計算に配線**

`src/features/primal-path/domain/battle/tick-phases.ts` の import に `onKeystoneKill` を追加:

```typescript
import { keystonePlayerAtkMods, onKeystoneKill } from '../keystone/keystone-service';
```

火傷計算行（現 77行）を chain_blaze スタック反映に変更:

```typescript
    const bd = Math.floor(pa.dmg * 0.2 * sb.burnMul * (next.burnDmgMul ?? 1) * (1 + (next.ksStacks?.chain_blaze ?? 0)));
```

メインティック `tick` の敵撃破ブロック（`next.kills++;` の直後）に追加:

```typescript
    onKeystoneKill(next);
```

> `tick` 関数内の敵撃破判定（`if (e.hp <= 0)` ブロックの `next.kills++;` 行）を探して直後に挿入すること。

- [ ] **Step 5: game-logic から re-export**

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods, onKeystoneKill } from './domain/keystone/keystone-service';
```

- [ ] **Step 6: テスト成功 ＋ 回帰確認**

Run: `npm test -- keystone-service tick game-logic`
Expected: PASS（chain_blaze スタックが無ければ火傷倍率は `*1` で不変）

- [ ] **Step 7: コミット**

```bash
git add -A && git commit -m "feat: キル時フック（狩人の蓄積・連鎖の業火）と火傷倍率反映を実装"
```

---

## Task 5: 被ダメージ反射（棘の守護）

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts`（`tickEnemyPhase`）
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Produces: `function keystoneReflectDmg(r: RunState, takenDmg: number): number`（反射ダメージ。thorn_guard 有なら `floor(takenDmg*0.3)`、無なら 0）

- [ ] **Step 1: テストを追記（失敗する）**

```typescript
import { keystoneReflectDmg } from '../game-logic';

describe('keystoneReflectDmg', () => {
  it('棘の守護: 被ダメージの30%を反射', () => {
    const r = makeRun({ keystones: ['thorn_guard'] });
    expect(keystoneReflectDmg(r, 100)).toBe(30);
  });
  it('キーストーン無しは反射0', () => {
    expect(keystoneReflectDmg(makeRun({ keystones: [] }), 100)).toBe(0);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL

- [ ] **Step 3: keystoneReflectDmg を実装**

`keystone-service.ts` 末尾に追加:

```typescript
/** 被ダメージの反射量を返す（棘の守護） */
export function keystoneReflectDmg(r: RunState, takenDmg: number): number {
  if (!hasKeystone(r, 'thorn_guard')) return 0;
  return Math.floor(takenDmg * 0.3);
}
```

- [ ] **Step 4: tickEnemyPhase に配線**

`tick-phases.ts` の import に `keystoneReflectDmg` を追加。`tickEnemyPhase` で敵ダメージ `ed` 確定後（`next.hp -= ed;` の直後・131行付近）に追加:

```typescript
  // 棘の守護: 被ダメージの一部を敵へ反射
  const reflect = keystoneReflectDmg(next, ed);
  if (reflect > 0) {
    e.hp -= reflect;
    next.dmgDealt += reflect;
    next.log.push({ x: '  🛡️ 反射 ' + reflect, c: 'gc' });
  }
```

> `tickEnemyPhase` の引数に敵 `e` が含まれることを確認（現シグネチャ `(next, e, events, rng, sb)`）。`e` を使って反射ダメージを与える。

- [ ] **Step 5: game-logic から re-export**

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods, onKeystoneKill, keystoneReflectDmg } from './domain/keystone/keystone-service';
```

- [ ] **Step 6: テスト成功 ＋ 回帰確認**

Run: `npm test -- keystone-service tick`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add -A && git commit -m "feat: 被ダメージ反射（棘の守護）を実装"
```

---

## Task 6: 永久凍結（周期的な敵攻撃無効化）

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts`（`tickEnemyPhase` 冒頭）
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Produces: `function isKeystoneFreezeTurn(r: RunState): boolean`（eternal_freeze 有 かつ `r.wTurn > 0 && r.wTurn % 4 === 0` で true）

- [ ] **Step 1: テストを追記（失敗する）**

```typescript
import { isKeystoneFreezeTurn } from '../game-logic';

describe('isKeystoneFreezeTurn', () => {
  it('永久凍結: wTurn が4の倍数のターンで true', () => {
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 4, keystones: ['eternal_freeze'] }))).toBe(true);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 8, keystones: ['eternal_freeze'] }))).toBe(true);
  });
  it('4の倍数でないターン・wTurn=0・キーストーン無しは false', () => {
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 3, keystones: ['eternal_freeze'] }))).toBe(false);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 0, keystones: ['eternal_freeze'] }))).toBe(false);
    expect(isKeystoneFreezeTurn(makeRun({ wTurn: 4, keystones: [] }))).toBe(false);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL

- [ ] **Step 3: isKeystoneFreezeTurn を実装**

`keystone-service.ts` 末尾に追加:

```typescript
/** このターン敵攻撃を無効化するか（永久凍結） */
export function isKeystoneFreezeTurn(r: RunState): boolean {
  return hasKeystone(r, 'eternal_freeze') && r.wTurn > 0 && r.wTurn % 4 === 0;
}
```

- [ ] **Step 4: tickEnemyPhase に配線（早期リターン）**

`tick-phases.ts` の import に `isKeystoneFreezeTurn` を追加。`tickEnemyPhase` の冒頭（`let ed = ...` の前・117行付近）に追加:

```typescript
  // 永久凍結: 周期的に敵の攻撃を無効化する
  if (isKeystoneFreezeTurn(next)) {
    next.log.push({ x: '  🧊 永久凍結！敵の攻撃を無効化', c: 'lc' });
    events.push({ type: 'sfx', sfx: 'envDmg' });
    return;
  }
```

> `events.push` の `sfx` 種別は既存の `SfxType` に存在する値（例 `'envDmg'`）を使うこと。存在しなければ sfx push を省略する。

- [ ] **Step 5: game-logic から re-export**

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods, onKeystoneKill, keystoneReflectDmg, isKeystoneFreezeTurn } from './domain/keystone/keystone-service';
```

- [ ] **Step 6: テスト成功 ＋ 回帰確認**

Run: `npm test -- keystone-service tick`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add -A && git commit -m "feat: 永久凍結（周期的な敵攻撃無効化）を実装"
```

---

## Task 7: 不滅の祈り（致死耐え）＋ 全体検証

**Files:**
- Modify: `src/features/primal-path/domain/keystone/keystone-service.ts`
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts`（`tickDeathCheck`）
- Modify: `src/features/primal-path/game-logic.ts`
- Test: `src/features/primal-path/__tests__/keystone-service.test.ts`

**Interfaces:**
- Produces: `function keystoneLethalGuard(r: RunState): boolean`（破壊的。undying_prayer 有 かつ `!r.ksGuardUsed` なら `hp=1`・`ksGuardUsed=true` にして true を返す。耐えられない場合 false）

- [ ] **Step 1: テストを追記（失敗する）**

```typescript
import { keystoneLethalGuard } from '../game-logic';

describe('keystoneLethalGuard', () => {
  it('不滅の祈り: 未使用なら hp=1 で耐え、ksGuardUsed が立つ', () => {
    const r = makeRun({ hp: 0, keystones: ['undying_prayer'], ksGuardUsed: false });
    expect(keystoneLethalGuard(r)).toBe(true);
    expect(r.hp).toBe(1);
    expect(r.ksGuardUsed).toBe(true);
  });
  it('使用済みなら耐えない', () => {
    const r = makeRun({ hp: 0, keystones: ['undying_prayer'], ksGuardUsed: true });
    expect(keystoneLethalGuard(r)).toBe(false);
  });
  it('キーストーン無しは耐えない', () => {
    expect(keystoneLethalGuard(makeRun({ hp: 0, keystones: [] }))).toBe(false);
  });
});
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npm test -- keystone-service`
Expected: FAIL

- [ ] **Step 3: keystoneLethalGuard を実装**

`keystone-service.ts` 末尾に追加:

```typescript
/** 致死ダメージを HP1 で耐えるか（不滅の祈り）。耐えた場合 true（破壊的） */
export function keystoneLethalGuard(r: RunState): boolean {
  if (!hasKeystone(r, 'undying_prayer') || r.ksGuardUsed) return false;
  r.hp = 1;
  r.ksGuardUsed = true;
  return true;
}
```

- [ ] **Step 4: tickDeathCheck に配線**

`tick-phases.ts` の import に `keystoneLethalGuard` を追加。`tickDeathCheck` の `if (next.hp <= 0) {` 直後、`if (next.tb.rv && !next.rvU)` の**前**に追加（復活の儀より先に祈りで耐える）:

```typescript
    // 不滅の祈り: 戦闘ごと1回、致死をHP1で耐える
    if (keystoneLethalGuard(next)) {
      next.log.push({ x: '  ♻️ 不滅の祈り！HP1で生存', c: 'gc' });
      events.push({ type: 'sfx', sfx: 'heal' });
      return false;
    }
```

- [ ] **Step 5: game-logic から re-export**

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods, onKeystoneKill, keystoneReflectDmg, isKeystoneFreezeTurn, keystoneLethalGuard } from './domain/keystone/keystone-service';
```

- [ ] **Step 6: テスト成功**

Run: `npm test -- keystone-service`
Expected: PASS

- [ ] **Step 7: CI 相当の全体検証**

Run: `npm run lint && npm run typecheck && npm test`
Expected: PASS（lint 警告ゼロ、型エラーなし、全テストグリーン）。失敗時は該当タスクへ戻る。

- [ ] **Step 8: コミット**

```bash
git add -A && git commit -m "feat: 不滅の祈り（致死耐え）を実装しキーストーンエンジンを完成"
```

---

## Self-Review（計画作成者によるチェック結果）

**1. Spec coverage（Phase 2a 範囲）:**
- キーストーン10種のデータモデル → Task 1 ✓
- `RunState.keystones`/`ksStacks` → Task 2 ✓
- `domain/keystone/` への効果分離 → Task 2〜7 ✓
- ATK算出フック（狂血/原始の咆哮/群狼/骨喰らい/狩人累積） → Task 3 ✓
- キル時フック（狩人/連鎖の業火） → Task 4 ✓
- 被ダメージフック（棘の守護） → Task 5 ✓
- 敵攻撃フック（永久凍結） → Task 6 ✓
- 死亡判定フック（不滅の祈り） → Task 7 ✓
- 戦闘開始フック（per-battle リセット） → Task 2（startBattle 配線）✓
- 諸刃の進化（取得時変換） → Task 2 ✓
- **Phase 2b（別計画）**: keystone フェーズ・KeystoneScreen・節目提示・rollE 混入・RunStats 連携・実績。本計画の範囲外。

**2. Placeholder scan:** 各 Step に実コード・実コマンド・期待結果を記載。barrel 解決と `al`/`SfxType` の実体確認は「実装時に確認」と明示（プレースホルダではなく確認指示）。

**3. Type consistency:** `KeystoneId`・`hasKeystone`・`applyKeystone`・`keystonePlayerAtkMods({flatAdd,mult})`・`onKeystoneKill`・`keystoneReflectDmg`・`isKeystoneFreezeTurn`・`keystoneLethalGuard`・`ksStacks.hunter_stack`/`ksStacks.chain_blaze`・`ksGuardUsed` を全タスクで一致させた。`?? 既定値`（`keystones ?? []`・`bE ?? 0`・`ksStacks?.x ?? 0`）も統一。

---

## 次フェーズ（別計画として作成予定）

- **Phase 2b: 節目提示＋ドラフト混入＋統計** — `GamePhase` に `keystone` 追加、`KeystoneScreen`（バイオーム踏破後3択）、`rollE` へのキーストーン低確率混入（取得済み除外）、トーテム軸による提示重み付け、`RunStats`/StatsScreen 連携。
- **Phase 3: 上位トーテム3種＋シグネチャーコンボ統合テスト＋バランス調整**。
