# PRIMAL PATH Phase 3（上位トーテム＋シグネチャーコンボ統合）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上位トーテム3種（岩/霊/種火）を追加し、キーストーン提示のタグ軸重み付け・反射キル1tick遅延の固定・シグネチャーコンボ統合テスト・統計連携を実装して、ビルド多様性ブラッシュアップを完成させる。

**Architecture:** Phase 1/2 で確立した「宣言的トーテム効果（`TotemEffect`）＋ tick フックのキーストーン効果」パターンの拡張。新規 `GamePhase` は追加せず、既存の純粋関数群（`domain/totem/`・`domain/keystone/`・`domain/battle/`・`domain/awakening/`）に新フィールドと新フックを足す。後方互換は optional フィールド＋`?? 既定値` で担保する。

**Tech Stack:** React 19 + TypeScript / Jotai / Jest 30 + @swc/jest / Webpack 5。テストは `__tests__/*.test.ts`、`makeRun()` ヘルパーと `../game-logic` バレル経由でインポートする。

**設計書:** `docs/superpowers/specs/2026-06-20-primal-path-phase3-design.md`

## Global Constraints

- 作業ディレクトリ: `src/features/primal-path/`（パスは全てこのディレクトリ起点の相対表記）。
- `any` 型禁止（`unknown`＋型ガード）。`null` より `undefined` を優先。
- 関数の引数は3個以内・1関数1責務・早期リターンでネストを浅く。
- コメント・docstring は日本語。コミットメッセージは Conventional Commits（`feat:`/`fix:`/`test:`/`docs:`）。
- 後方互換：新フィールドは全て optional＋既定値フォールバック。既存セーブ構造は不変。
- 新規 `GamePhase` を追加しない（`PHASE_TRANSITIONS`・E2E ヘルパー非改変）。
- TDD（Red→Green→Refactor）。各タスクはテスト先行。
- テスト実行: `npm test -- <ファイルパス>`（プロジェクトルート `/workspaces/claym/local/cline-playground-for-frontend` で実行）。
- 型チェック: `npm run typecheck`。lint: `npm run lint:ci`（警告ゼロ強制）。
- コミット末尾に `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` を付与。

## ファイル構成（変更マップ）

| ファイル | 責務 | タスク |
|---|---|---|
| `types/totem.ts` | `TotemId`・`TotemEffect`・`TotemDef` の拡張 | 1, 5 |
| `types/game-state.ts` | `RunState` に `awkMul?`・`emberBase?` 追加 | 1 |
| `types/stats.ts` | `RunStats` に `totemId?` 追加 | 6 |
| `constants/totem.ts` | 上位トーテム3種追加・全6種に `tag` 付与 | 1, 5 |
| `domain/totem/totem-service.ts` | `applyTotem` 拡張・`applyEmberBiomeScale` 追加 | 1, 3 |
| `domain/awakening/awakening-service.ts` | `applyAwkFx` に `awkMul` 反映 | 2 |
| `domain/battle/battle-service.ts` | `afterBattle` に種火踏破フック | 3 |
| `domain/battle/tick-phases.ts` | 反射キル同tick確定（`resolveEnemyDefeat` 抽出） | 4 |
| `domain/keystone/keystone-service.ts` | `keystoneRollWeight` 追加・`rollKeystones` 拡張 | 5 |
| `domain/progression/run-service.ts` | `calcRunStats` に `totemId` 記録 | 6 |
| `components/StatsScreen.tsx` | トーテム・キーストーン表示 | 6 |
| `game-logic.ts` | 新規関数の再エクスポート | 1, 3, 5 |
| `__tests__/*.test.ts` | 各タスクのテスト | 全 |
| `README.md` | Phase 3 内容追記 | 8 |

---

### Task 1: 上位トーテム3種の定義・型拡張・applyTotem 拡張

基本3種に加え、岩/霊/種火の上位トーテムを追加する。型と定数を拡張し、`applyTotem` が新効果（環境ダメ軽減・覚醒要求緩和・覚醒倍率・種火スナップショット）を適用するようにする。

**Files:**
- Modify: `types/totem.ts`
- Modify: `types/game-state.ts`
- Modify: `constants/totem.ts`
- Modify: `domain/totem/totem-service.ts`
- Test: `__tests__/totem-service.test.ts`（既存に追記）

**Interfaces:**
- Consumes: `makeRun()`（`__tests__/test-helpers.ts`）、`applyTotem(r, totemId)`（`game-logic` 経由・既存）。
- Produces:
  - `TotemId` に `'rock' | 'spirit' | 'ember'` を追加。
  - `TotemEffect` に `envDmgR?: number`・`awkReqReduce?: number`・`awkMul?: number`・`biomeScale?: number`。
  - `RunState.awkMul?: number`・`RunState.emberBase?: { atk: number; def: number; mhp: number }`。
  - `applyTotem` が上記効果を適用（環境ダメ軽減は `tb.iR/fR` 加算、覚醒要求は `saReq/fReq` 減算＋最小1クランプ、`awkMul` 設定、`ember` は `emberBase` スナップショット）。

- [ ] **Step 1: 型を拡張する**

`types/totem.ts` を編集する。`TotemId` に3種追加、`TotemEffect` に4フィールド追加：

```typescript
/** トーテム識別子（基本3種＋上位3種） */
export type TotemId = 'blood' | 'flame' | 'pack' | 'rock' | 'spirit' | 'ember';
```

`TotemEffect` インターフェースの末尾（`startAlly?` の後）に追記：

```typescript
  /** 環境ダメージ軽減率（0.3 で -30%。tb.iR/fR に加算される） */
  readonly envDmgR?: number;
  /** 覚醒要求の減算（1 で saReq/fReq を -1、最小1にクランプ） */
  readonly awkReqReduce?: number;
  /** 覚醒効果の増加率（0.25 で覚醒効果 +25%） */
  readonly awkMul?: number;
  /** 踏破ごとの全ステ加算率（0.12 で base×0.12 を ATK/DEF/最大HP に踏破ごと加算） */
  readonly biomeScale?: number;
```

`types/game-state.ts` の `RunState` インターフェース、`ksGuardUsed?` の後に追記：

```typescript
  /** 覚醒効果の増加率（霊の祖。既定0） */
  awkMul?: number;
  /** 種火の祖の踏破スケール基準ステ（ラン初期化時に snapshot） */
  emberBase?: { atk: number; def: number; mhp: number };
```

- [ ] **Step 2: 失敗するテストを書く（上位トーテム定数）**

`__tests__/totem-service.test.ts` の `describe('TOTEMS 定数', ...)` ブロック内に追記：

```typescript
  it('上位3種（岩/霊/種火）が定義され、解放クリア数が 2/5/10 である', () => {
    const expected: Array<[TotemId, number]> = [['rock', 2], ['spirit', 5], ['ember', 10]];
    for (const [id, unlock] of expected) {
      const t = TOTEMS.find(x => x.id === id);
      expect(t).toBeDefined();
      expect(t!.unlock).toBe(unlock);
    }
  });
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: FAIL（`rock`/`spirit`/`ember` が `TOTEMS` に未定義）

- [ ] **Step 4: 上位トーテム定数を実装する**

`constants/totem.ts` の `TOTEMS` 配列に、基本3種の後（配列末尾の `]);` の前）に追記：

```typescript
  Object.freeze({
    id: 'rock' as const, nm: '岩の祖', ic: '🛡️', curve: 'combo' as const,
    desc: 'DEF+4 環境ダメージ-30%（反射タンク）', unlock: 2,
    effect: Object.freeze({ defAdd: 4, envDmgR: 0.3 }),
  }),
  Object.freeze({
    id: 'spirit' as const, nm: '霊の祖', ic: '👻', curve: 'scaling' as const,
    desc: '覚醒要求-1 覚醒効果+25%（覚醒スケール）', unlock: 5,
    effect: Object.freeze({ awkReqReduce: 1, awkMul: 0.25 }),
  }),
  Object.freeze({
    id: 'ember' as const, nm: '種火の祖', ic: '🌰', curve: 'scaling' as const,
    desc: '開始ATK-30% 踏破ごと全ステ+12%（極・晩成）', unlock: 10,
    effect: Object.freeze({ atkMul: 0.7, biomeScale: 0.12 }),
  }),
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: PASS

- [ ] **Step 6: 失敗するテストを書く（applyTotem の新効果）**

`__tests__/totem-service.test.ts` の末尾に追記：

```typescript
describe('applyTotem — 岩の祖', () => {
  it('DEF+4 と環境抵抗（iR/fR）+0.3 を適用する', () => {
    const base = makeRun({ def: 2 });
    const r = applyTotem(base, 'rock');
    expect(r.def).toBe(6);
    expect(r.tb.iR).toBeCloseTo((makeRun({}).tb.iR ?? 0) + 0.3, 5);
    expect(r.tb.fR).toBeCloseTo((makeRun({}).tb.fR ?? 0) + 0.3, 5);
    expect(r.totemId).toBe('rock');
  });
});

describe('applyTotem — 霊の祖', () => {
  it('覚醒要求 saReq/fReq を -1 し、awkMul=0.25 を設定する', () => {
    const base = makeRun({ saReq: 4, fReq: 5 });
    const r = applyTotem(base, 'spirit');
    expect(r.saReq).toBe(3);
    expect(r.fReq).toBe(4);
    expect(r.awkMul).toBeCloseTo(0.25, 5);
  });

  it('覚醒要求は最小1にクランプされる', () => {
    const base = makeRun({ saReq: 1, fReq: 1 });
    const r = applyTotem(base, 'spirit');
    expect(r.saReq).toBe(1);
    expect(r.fReq).toBe(1);
  });
});

describe('applyTotem — 種火の祖', () => {
  it('開始ATK×0.7 を適用し、適用後ステを emberBase に snapshot する', () => {
    const base = makeRun({ atk: 100, def: 10, mhp: 200, hp: 200 });
    const r = applyTotem(base, 'ember');
    expect(r.atk).toBe(70); // floor(100×0.7)
    expect(r.emberBase).toEqual({ atk: 70, def: 10, mhp: 200 });
  });
});
```

- [ ] **Step 7: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: FAIL（`applyTotem` が新効果未対応）

- [ ] **Step 8: applyTotem を拡張する**

`domain/totem/totem-service.ts` の `applyTotem` 内、`if (e.defAdd) next.def = next.def + e.defAdd;` の直後に追記：

```typescript
  // 環境ダメージ軽減（岩の祖）: 既存の環境抵抗 iR/fR に加算し、calcEnvDmg が自然に反映する
  if (e.envDmgR) {
    next.tb = { ...next.tb, iR: (next.tb.iR || 0) + e.envDmgR, fR: (next.tb.fR || 0) + e.envDmgR };
  }
  // 覚醒要求緩和（霊の祖）: 早期覚醒。最小1にクランプ
  if (e.awkReqReduce) {
    next.saReq = Math.max(1, next.saReq - e.awkReqReduce);
    next.fReq = Math.max(1, next.fReq - e.awkReqReduce);
  }
  // 覚醒効果増（霊の祖）: applyAwkFx が参照する倍率を保持
  if (e.awkMul) next.awkMul = e.awkMul;
```

続いて `applyTotem` の `return next;` の直前（startAlly 適用ブロックの後）に追記：

```typescript
  // 種火の祖: 踏破スケールの基準ステを snapshot（atkMul 適用後の値）
  if (e.biomeScale) {
    next.emberBase = { atk: next.atk, def: next.def, mhp: next.mhp };
  }
```

> 注: `tb.iR/fR` は環境ダメージ抵抗（`calcEnvDmg` が `tb[cfg.resist]` で参照）専用フィールド。これらへの加算は環境ダメージ計算のみに影響し、他のステ計算には波及しない。

- [ ] **Step 9: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: PASS

- [ ] **Step 10: 型チェックとコミット**

Run: `npm run typecheck`
Expected: エラーなし

```bash
git add src/features/primal-path/types/totem.ts src/features/primal-path/types/game-state.ts src/features/primal-path/constants/totem.ts src/features/primal-path/domain/totem/totem-service.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "$(cat <<'EOF'
feat: 上位トーテム3種（岩/霊/種火）を追加

- TotemId/TotemEffect/RunState を拡張（envDmgR/awkReqReduce/awkMul/biomeScale/emberBase）
- applyTotem が環境ダメ軽減・覚醒要求緩和・覚醒倍率・種火snapshot を適用
- 環境ダメ軽減は tb.iR/fR 加算で calcEnvDmg に自然反映

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 覚醒効果増（applyAwkFx に awkMul 反映）

霊の祖の「覚醒効果+25%」を実装する。`applyAwkFx` で覚醒効果の数値を `(1 + awkMul)` 倍してから適用する。

**Files:**
- Modify: `domain/awakening/awakening-service.ts`
- Test: `__tests__/awakening-service.test.ts`（無ければ新規作成）

**Interfaces:**
- Consumes: `RunState.awkMul`（Task 1 で追加）、`applyAwkFx(r, fx, id, nm, cl, fe)`（既存）。
- Produces: `applyAwkFx` が `r.awkMul` を読み、`AwakeningEffect` の数値効果（atk/def/mhp/sd/burn/bb）に `×(1 + awkMul)` を掛けてから適用する。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/awakening-service.test.ts` を確認し、無ければ新規作成（あれば末尾に追記）：

```typescript
/**
 * 覚醒サービス — awkMul（霊の祖）のテスト
 */
import { applyAwkFx } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyAwkFx — awkMul（覚醒効果増）', () => {
  it('awkMul=0.25 のとき覚醒の atk 効果が ×1.25 で適用される', () => {
    const base = makeRun({ atk: 100, awkMul: 0.25 });
    const r = applyAwkFx(base, { atk: 20 }, 'sa_test', 'テスト覚醒', 'rc', null);
    // 20 × 1.25 = 25 が加算される
    expect(r.atk).toBe(125);
  });

  it('awkMul 未設定（既定0）のとき従来どおり等倍で適用される', () => {
    const base = makeRun({ atk: 100 });
    const r = applyAwkFx(base, { atk: 20 }, 'sa_test', 'テスト覚醒', 'rc', null);
    expect(r.atk).toBe(120);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/awakening-service.test.ts`
Expected: FAIL（awkMul=0.25 でも atk が 120 になり 125 にならない）

- [ ] **Step 3: applyAwkFx を実装する**

`domain/awakening/awakening-service.ts` の `applyAwkFx` を編集する。`writeSnapToRun(next, applyStatFx(getSnap(next), fx));` の行を、`awkMul` を反映した効果に置き換える：

```typescript
  // 霊の祖: 覚醒効果を (1 + awkMul) 倍してから適用する（awkMul 未設定時は等倍）
  const mul = 1 + (r.awkMul ?? 0);
  const scaledFx: EvoEffect = mul === 1 ? fx : scaleAwkEffect(fx, mul);
  writeSnapToRun(next, applyStatFx(getSnap(next), scaledFx));
```

同ファイル内（`applyAwkFx` の前）にヘルパー関数を追加する。覚醒の数値効果キーのみ倍率を掛ける：

```typescript
/** 覚醒効果の数値フィールドに倍率を掛ける（霊の祖の awkMul 用） */
function scaleAwkEffect(fx: EvoEffect, mul: number): EvoEffect {
  const numericKeys = ['atk', 'def', 'mhp', 'sd', 'burn', 'bb'] as const;
  const scaled: Record<string, unknown> = { ...(fx as Record<string, unknown>) };
  for (const k of numericKeys) {
    const v = (fx as Record<string, unknown>)[k];
    if (typeof v === 'number') scaled[k] = Math.floor(v * mul);
  }
  return scaled as EvoEffect;
}
```

> 注: `allyAtkMul`/`allyFullHeal` は倍率対象外（数値ステ強化のみを増幅する）。`EvoEffect` 型は既にこのファイルでインポート済みであることを確認すること（未インポートなら `import type { EvoEffect } from '../../types';` を追加）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/awakening-service.test.ts`
Expected: PASS

- [ ] **Step 5: 覚醒関連の既存テスト全体が壊れていないことを確認する**

Run: `npm test -- src/features/primal-path/__tests__/awakening-service.test.ts && npm run typecheck`
Expected: 全 PASS・型エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/awakening/awakening-service.ts src/features/primal-path/__tests__/awakening-service.test.ts
git commit -m "$(cat <<'EOF'
feat: 霊の祖の覚醒効果+25%（awkMul）を applyAwkFx に実装

- 覚醒の数値効果（atk/def/mhp/sd/burn/bb）に (1+awkMul) を乗算
- awkMul 未設定時は等倍で既存挙動を維持

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 種火の踏破スケール（applyEmberBiomeScale + afterBattle フック）

種火の祖の「踏破ごと全ステ+12%（線形・差分回復）」を実装する。純粋関数 `applyEmberBiomeScale` を追加し、バイオーム踏破時（`afterBattle` のボス撃破分岐）に呼ぶ。

**Files:**
- Modify: `domain/totem/totem-service.ts`
- Modify: `domain/battle/battle-service.ts`
- Modify: `game-logic.ts`
- Test: `__tests__/totem-service.test.ts`（追記）、`__tests__/domain/progression/run-service.test.ts` または battle-service テスト

**Interfaces:**
- Consumes: `RunState.emberBase`・`RunState.totemId`（Task 1）、`TOTEMS`（`effect.biomeScale`）。
- Produces: `applyEmberBiomeScale(r: RunState): RunState` — 種火の祖かつ `emberBase` があるとき、`emberBase.{atk,def,mhp} × biomeScale` を ATK/DEF/最大HP に加算し、最大HP増加分（Δmhp）を現在HPにも加算した新 RunState を返す。該当しなければ `r` をそのまま返す。`afterBattle` がボス撃破時にこれを呼ぶ。

- [ ] **Step 1: 失敗するテストを書く（純粋関数）**

`__tests__/totem-service.test.ts` の末尾に追記：

```typescript
import { applyEmberBiomeScale } from '../game-logic';

describe('applyEmberBiomeScale — 種火の踏破スケール', () => {
  it('emberBase×0.12 を ATK/DEF/最大HP に加算し、Δmhp を現在HPにも加算する', () => {
    const base = makeRun({
      atk: 100, def: 10, mhp: 200, hp: 50,
      totemId: 'ember', emberBase: { atk: 100, def: 10, mhp: 200 },
    });
    const r = applyEmberBiomeScale(base);
    expect(r.atk).toBe(112); // 100 + floor(100×0.12)=12
    expect(r.def).toBe(11);  // 10 + floor(10×0.12)=1
    expect(r.mhp).toBe(224); // 200 + floor(200×0.12)=24
    expect(r.hp).toBe(74);   // 50 + Δmhp(24)
  });

  it('種火の祖以外では変化しない', () => {
    const base = makeRun({ atk: 100, totemId: 'blood' });
    expect(applyEmberBiomeScale(base)).toBe(base);
  });

  it('emberBase 未設定なら変化しない', () => {
    const base = makeRun({ atk: 100, totemId: 'ember' });
    expect(applyEmberBiomeScale(base)).toBe(base);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: FAIL（`applyEmberBiomeScale` が未定義）

- [ ] **Step 3: applyEmberBiomeScale を実装する**

`domain/totem/totem-service.ts` の末尾（`applyTotem` の後）に追加：

```typescript
/**
 * 種火の祖の踏破スケールを適用する（純粋）。
 *
 * emberBase×biomeScale を ATK/DEF/最大HP に加算する線形スケール。
 * 最大HP増加分は現在HPにも加算する（差分回復）。
 * 種火の祖でない、または emberBase 未設定なら元の RunState を返す。
 */
export function applyEmberBiomeScale(r: RunState): RunState {
  const scale = TOTEMS.find(t => t.id === r.totemId)?.effect.biomeScale;
  if (!scale || !r.emberBase) return r;
  const dAtk = Math.floor(r.emberBase.atk * scale);
  const dDef = Math.floor(r.emberBase.def * scale);
  const dMhp = Math.floor(r.emberBase.mhp * scale);
  return { ...r, atk: r.atk + dAtk, def: r.def + dDef, mhp: r.mhp + dMhp, hp: r.hp + dMhp };
}
```

- [ ] **Step 4: game-logic バレルに再エクスポートを追加する**

`game-logic.ts` の line 49 を編集する：

```typescript
export { applyTotem, applyEmberBiomeScale } from './domain/totem/totem-service';
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: PASS

- [ ] **Step 6: 失敗するテストを書く（afterBattle 統合）**

`__tests__/totem-service.test.ts` の末尾に追記（`afterBattle` を import）：

```typescript
import { afterBattle } from '../game-logic';

describe('afterBattle — 種火の踏破フック', () => {
  it('ボス撃破でバイオームクリア時、種火スケールが適用される', () => {
    // cW > wpb でボス撃破扱い → bc++ とスケール適用
    const base = makeRun({
      cW: 5, wpb: 4, bc: 0, atk: 100, def: 10, mhp: 200, hp: 100,
      totemId: 'ember', emberBase: { atk: 100, def: 10, mhp: 200 },
    });
    const { nextRun, biomeCleared } = afterBattle(base);
    expect(biomeCleared).toBe(true);
    expect(nextRun.bc).toBe(1);
    expect(nextRun.atk).toBe(112); // 種火スケール +12
    expect(nextRun.mhp).toBe(224); // 種火スケール +24
    // hp: ember 100+Δmhp(24)=124 → ボス回復 floor(224×0.2)=44 → min(124+44,224)=168
    expect(nextRun.hp).toBe(168);
  });

  it('種火以外ではボス撃破時もステは変化しない（bc のみ増加）', () => {
    const base = makeRun({ cW: 5, wpb: 4, bc: 0, atk: 100, mhp: 200, hp: 100, totemId: 'blood' });
    const { nextRun } = afterBattle(base);
    expect(nextRun.bc).toBe(1);
    expect(nextRun.atk).toBe(100);
  });
});
```

- [ ] **Step 7: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: FAIL（afterBattle が種火スケール未適用で atk が 100 のまま）

- [ ] **Step 8: afterBattle にフックを実装する**

`domain/battle/battle-service.ts` の `afterBattle` のボス撃破分岐を編集する。`import { applyEmberBiomeScale } from '../totem/totem-service';` をファイル冒頭の import に追加し、`if (boss) { ... }` ブロックを以下に置き換える：

```typescript
  if (boss) {
    // ボス撃破 → 即バイオームクリア
    next.bc++;
    // 種火の祖: 踏破スケールを適用（種火以外は素通り）
    const scaled = applyEmberBiomeScale(next);
    scaled.cW = 0;
    const rec = Math.floor(scaled.mhp * 0.2);
    scaled.hp = Math.min(scaled.hp + rec, scaled.mhp);
    return { nextRun: scaled, biomeCleared: true };
  }
```

> 注: `applyEmberBiomeScale` は純粋関数で新オブジェクトを返す（種火以外は同一参照）。`next.bc++` 後に呼ぶことで、スケール後の `scaled` に対してボス回復（mhp×20%）を適用する。順序＝種火スケール→ボス回復。

- [ ] **Step 9: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: PASS

- [ ] **Step 10: battle-service の既存テストが壊れていないことを確認する**

Run: `npm test -- src/features/primal-path/__tests__ && npm run typecheck`
Expected: 全 PASS・型エラーなし

- [ ] **Step 11: コミット**

```bash
git add src/features/primal-path/domain/totem/totem-service.ts src/features/primal-path/domain/battle/battle-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "$(cat <<'EOF'
feat: 種火の祖の踏破スケール（線形・差分回復）を実装

- applyEmberBiomeScale: emberBase×0.12 を全ステに加算、Δmhp を現在HPにも加算
- afterBattle のボス撃破分岐で踏破ごとに適用（種火以外は素通り）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 棘の守護の反射キル1tick遅延の固定

Phase 2a 積み残しのバグ修正。`tick` 内で敵撃破判定が `tickEnemyPhase`（反射を含む）より前にあるため、反射killが次tickまで検出されない。撃破処理を `resolveEnemyDefeat` に抽出し、反射後にも同tickで撃破を確定する。

**Files:**
- Modify: `domain/battle/tick-phases.ts`
- Test: `__tests__/tick-phases.test.ts`（無ければ新規）または既存の tick テストファイルに追記

**Interfaces:**
- Consumes: `tick(r, finalMode, rng)`（既存）、`keystoneReflectDmg`（既存）。
- Produces: `tick` が、敵攻撃→反射で敵HPが0以下になった場合、同一tick内で撃破を確定（`kills++`・`onKeystoneKill`・`enemy_killed`イベント）する。プレイヤー死亡判定が先（反射killはプレイヤー生存時のみ）。

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/tick-phases.test.ts` を確認し、無ければ新規作成（あれば追記）：

```typescript
/**
 * tick-phases — 棘の守護の反射キル同tick確定のテスト
 */
import { tick } from '../game-logic';
import { makeRun } from './test-helpers';

describe('tick — 棘の守護の反射キル（同tick確定）', () => {
  it('反射ダメージで敵が倒れたら、その tick 内で撃破が確定する', () => {
    // プレイヤー攻撃では敵を倒せない（敵DEF高く dm=1）が、反射で倒れる状況を作る
    //   player atk=8, en.def=1000 → 通常攻撃 dm = max(1, 8-1000)=1 → en.hp 2→1
    //   en.atk=100, player def=0 → 被ダメ 100、反射 = floor(100×0.3)=30 → en.hp 1-30=-29
    //   rng=0.99 で会心なし・追撃なし
    const r = makeRun({
      keystones: ['thorn_guard'],
      atk: 8, def: 0, hp: 1000, mhp: 1000, cr: 0, kills: 0,
      en: { n: '岩亀', hp: 2, mhp: 100, atk: 100, def: 1000, bone: 3 },
    });
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.kills).toBe(1);
    expect(res.events.some(ev => ev.type === 'enemy_killed')).toBe(true);
    expect(res.nextRun.en!.hp).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/tick-phases.test.ts`
Expected: FAIL（反射killが次tickに持ち越され、この tick では `kills` が 0・`enemy_killed` が無い）

- [ ] **Step 3: resolveEnemyDefeat を抽出する**

`domain/battle/tick-phases.ts` の「メインティック」セクション、`export function tick(...)` の直前に撃破確定ヘルパーを追加する：

```typescript
/** 敵撃破を確定し TickResult を返す（破壊的。step2 と反射killの両方から呼ぶ） */
function resolveEnemyDefeat(next: RunState, e: Enemy, events: TickEvent[], finalMode: boolean): TickResult {
  e.hp = 0;
  next.bE += e.bone;
  next.kills++;
  // キーストーンのキル時フック（狩人の蓄積・連鎖の業火のスタック更新）
  onKeystoneKill(next);
  next.log.push({ x: '━━━ 💀 ' + e.n + ' 撃破！ 🦴+' + e.bone + ' ━━━', c: 'gc' });
  events.push({ type: 'sfx', sfx: 'kill' });
  events.push({ type: 'shake_enemy' });
  events.push(finalMode ? { type: 'final_boss_killed' } : { type: 'enemy_killed' });
  const result = { nextRun: next, events };
  if (process.env.NODE_ENV !== 'production') ensureTickResult(result);
  return result;
}
```

- [ ] **Step 4: tick の撃破判定を resolveEnemyDefeat に差し替える**

`tick` 内の既存の `if (e.hp <= 0) { ... }` ブロック（プレイヤー/仲間/再生フェーズ直後の撃破判定、`e.hp = 0;` から `return result;` まで）を以下に置き換える：

```typescript
  // 敵撃破判定（プレイヤー/仲間/再生フェーズ後）
  if (e.hp <= 0) {
    return resolveEnemyDefeat(next, e, events, finalMode);
  }
```

続いて、`tickEnemyPhase(next, e, events, rng, sb);` と `if (tickDeathCheck(next, events)) { return { nextRun: next, events }; }` の後（プレイヤー生存確定後）に、反射killの確定処理を追加する：

```typescript
  // 棘の守護などの反射で敵が倒れた場合、同一tick内で撃破を確定する（プレイヤー生存が前提）
  if (e.hp <= 0) {
    return resolveEnemyDefeat(next, e, events, finalMode);
  }
```

> 注: プレイヤー死亡判定（`tickDeathCheck`）を反射killより先に行う。これにより、敵の攻撃が致死で不滅の祈り/復活が無ければ、反射killよりプレイヤー死亡が優先される（反射タンクは「まず生き延びる」設計）。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/tick-phases.test.ts`
Expected: PASS

- [ ] **Step 6: 既存の戦闘テスト全体が壊れていないことを確認する**

Run: `npm test -- src/features/primal-path/__tests__ && npm run typecheck`
Expected: 全 PASS・型エラーなし（撃破処理の抽出が既存の通常キル・火傷キルの挙動を変えていないこと）

- [ ] **Step 7: コミット**

```bash
git add src/features/primal-path/domain/battle/tick-phases.ts src/features/primal-path/__tests__/tick-phases.test.ts
git commit -m "$(cat <<'EOF'
fix: 棘の守護の反射キルが1tick遅延する問題を修正

- 撃破確定を resolveEnemyDefeat に抽出
- 敵攻撃→反射で敵HP0以下になった場合、同tick内で撃破を確定
- プレイヤー死亡判定を反射killより優先

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: キーストーン提示の curve+tag 合算重み付け

`rollKeystones` の重みを「curve 一致＋tag 一致」の合算に拡張する。各トーテムに推しアーキタイプ `tag` を付与する。

**Files:**
- Modify: `types/totem.ts`
- Modify: `constants/totem.ts`
- Modify: `domain/keystone/keystone-service.ts`
- Modify: `game-logic.ts`
- Test: `__tests__/keystone-service.test.ts`（追記）

**Interfaces:**
- Consumes: `TOTEMS`（`curve`・`tag`）、`KEYSTONES`（`curve`・`tag`）、`SynergyTag`。
- Produces:
  - `TotemDef.tag?: SynergyTag`。全6種に付与（blood→wild, flame→fire, pack→tribe, rock→shield, spirit→spirit, ember→hunt）。
  - `keystoneRollWeight(totemCurve, totemTag, k): number` = `1 + (curve一致?1:0) + (tag一致?1:0)`（最小1・最大3）。
  - `rollKeystones` が `keystoneRollWeight` を使う。

- [ ] **Step 1: TotemDef に tag を追加する**

`types/totem.ts` の冒頭 import に `SynergyTag` を追加：

```typescript
import type { AllyTemplate } from './units';
import type { SynergyTag } from './evolution';
```

`TotemDef` インターフェースの `effect: TotemEffect;` の前に追記：

```typescript
  /** 推しアーキタイプ（節目のキーストーン提示で tag 一致を優先） */
  readonly tag?: SynergyTag;
```

- [ ] **Step 2: 全トーテムに tag を付与する**

`constants/totem.ts` の各トーテム定義に `tag` を追加する（`curve` の隣に）。基本3種：

```
blood:  tag: 'wild' as const,
flame:  tag: 'fire' as const,
pack:   tag: 'tribe' as const,
```

上位3種（Task 1 で追加済みの定義）：

```
rock:   tag: 'shield' as const,
spirit: tag: 'spirit' as const,
ember:  tag: 'hunt' as const,
```

各 `Object.freeze({ id: ..., nm: ..., ic: ..., curve: ..., tag: '...' as const, desc: ..., unlock: ..., effect: ... })` の形になるよう、6種すべてに `tag` フィールドを挿入する。

- [ ] **Step 3: 失敗するテストを書く（重み計算）**

`__tests__/keystone-service.test.ts` の「キーストーン抽選」describe の後に追記：

```typescript
import { keystoneRollWeight } from '../game-logic';
import { KEYSTONES } from '../constants';

describe('keystoneRollWeight — curve+tag 合算', () => {
  const thorn = KEYSTONES.find(k => k.id === 'thorn_guard')!; // tag=shield, curve=combo
  const madblood = KEYSTONES.find(k => k.id === 'madblood')!; // tag=wild,  curve=front

  it('curve も tag も一致で重み3', () => {
    // 岩の祖: curve=combo, tag=shield
    expect(keystoneRollWeight('combo', 'shield', thorn)).toBe(3);
  });

  it('curve のみ一致で重み2', () => {
    expect(keystoneRollWeight('combo', 'fire', thorn)).toBe(2);
  });

  it('tag のみ一致で重み2', () => {
    expect(keystoneRollWeight('front', 'shield', thorn)).toBe(2);
  });

  it('どちらも不一致で重み1', () => {
    expect(keystoneRollWeight('front', 'wild', thorn)).toBe(1);
  });

  it('トーテム未選択（undefined）でも重み1', () => {
    expect(keystoneRollWeight(undefined, undefined, madblood)).toBe(1);
  });
});
```

- [ ] **Step 4: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/keystone-service.test.ts`
Expected: FAIL（`keystoneRollWeight` が未定義）

- [ ] **Step 5: keystoneRollWeight を実装し rollKeystones を差し替える**

`domain/keystone/keystone-service.ts` に重み計算関数を追加する（`rollKeystones` の前）。`KeystoneDef`・`PowerCurve`・`SynergyTag` の型を使用するため、必要に応じて import を追加（`import type { ..., PowerCurve } from '../../types';` と `SynergyTag`）：

```typescript
/** 節目抽選の重みを返す: 1 + (curve一致?1:0) + (tag一致?1:0)（最小1・最大3） */
export function keystoneRollWeight(
  totemCurve: PowerCurve | undefined,
  totemTag: SynergyTag | undefined,
  k: KeystoneDef,
): number {
  return 1 + (totemCurve && k.curve === totemCurve ? 1 : 0) + (totemTag && k.tag === totemTag ? 1 : 0);
}
```

`rollKeystones` の中を編集する。`const totemCurve = ...` の行を、トーテム定義から curve と tag を取得するよう変更し、重み計算を `keystoneRollWeight` に委譲する：

```typescript
  const totem = TOTEMS.find(t => t.id === r.totemId);
  const totemCurve = totem?.curve;
  const totemTag = totem?.tag;
  const avail = [...pool];
  const result: KeystoneDef[] = [];
  while (result.length < 3 && avail.length > 0) {
    const weights = avail.map(k => keystoneRollWeight(totemCurve, totemTag, k));
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
```

- [ ] **Step 6: game-logic バレルに再エクスポートを追加する**

`game-logic.ts` の line 52、keystone-service の re-export に `keystoneRollWeight` を追加する：

```typescript
export { hasKeystone, applyKeystone, resetKeystoneBattleState, keystonePlayerAtkMods, onKeystoneKill, keystoneReflectDmg, isKeystoneFreezeTurn, keystoneLethalGuard, unownedKeystones, shouldOfferKeystone, rollKeystones, rollDraftKeystone, keystoneRollWeight } from './domain/keystone/keystone-service';
```

- [ ] **Step 7: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/keystone-service.test.ts`
Expected: PASS（新規＋既存の rollKeystones テスト〔totemId なし→全重み1〕も通る）

- [ ] **Step 8: 型チェックとコミット**

Run: `npm run typecheck`
Expected: エラーなし

```bash
git add src/features/primal-path/types/totem.ts src/features/primal-path/constants/totem.ts src/features/primal-path/domain/keystone/keystone-service.ts src/features/primal-path/game-logic.ts src/features/primal-path/__tests__/keystone-service.test.ts
git commit -m "$(cat <<'EOF'
feat: キーストーン提示を curve+tag 合算重み付けに拡張

- TotemDef に推しアーキタイプ tag を追加（全6種に付与）
- keystoneRollWeight: 1 + (curve一致) + (tag一致)（最大3）
- rollKeystones がトーテムの curve/tag 両方を考慮

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: RunStats に totemId 記録＋StatsScreen 表示

ラン終了時に選択トーテムを記録し、統計画面でトーテムアイコンと取得キーストーン数を表示する。

**Files:**
- Modify: `types/stats.ts`
- Modify: `domain/progression/run-service.ts`
- Modify: `components/StatsScreen.tsx`
- Test: `__tests__/domain/progression/run-service.test.ts`（追記）

**Interfaces:**
- Consumes: `RunState.totemId`・`RunState.keystones`、`TOTEMS`、`calcRunStats(run, result, boneEarned)`（既存）。
- Produces: `RunStats.totemId?: TotemId`。`calcRunStats` が `totemId: run.totemId` を含める。`StatsScreen` が各ランにトーテムアイコンとキーストーン数を表示。

- [ ] **Step 1: RunStats 型に totemId を追加する**

`types/stats.ts` の `RunStats` インターフェース、`keystoneCount?: number;` の後に追記。`TotemId` の import を確認（無ければ `import type { TotemId } from './totem';` を追加）：

```typescript
  /** 選択した始祖トーテム */
  totemId?: import('./totem').TotemId;
```

- [ ] **Step 2: 失敗するテストを書く**

`__tests__/domain/progression/run-service.test.ts` の `calcRunStats` 関連 describe に追記（無ければ新規 describe）：

```typescript
describe('calcRunStats — totemId 記録', () => {
  it('選択トーテムIDを RunStats に記録する', () => {
    const run = makeRun({ totemId: 'ember', keystones: ['hunter_stack'] });
    const stats = calcRunStats(run, 'victory', 10);
    expect(stats.totemId).toBe('ember');
    expect(stats.keystoneCount).toBe(1);
  });

  it('トーテム未選択なら totemId は undefined', () => {
    const run = makeRun({});
    const stats = calcRunStats(run, 'defeat', 0);
    expect(stats.totemId).toBeUndefined();
  });
});
```

> 注: テスト冒頭の import に `calcRunStats`（`'../../../game-logic'` または既存テストの import 元に合わせる）と `makeRun`（`'../../test-helpers'`）が含まれることを確認すること。既存ファイルの import パターンに従う。

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npm test -- src/features/primal-path/__tests__/domain/progression/run-service.test.ts`
Expected: FAIL（`stats.totemId` が undefined のまま 'ember' にならない）

- [ ] **Step 4: calcRunStats に totemId を追加する**

`domain/progression/run-service.ts` の `calcRunStats` の return オブジェクト、`keystoneCount: run.keystones?.length ?? 0,` の後に追記：

```typescript
    totemId: run.totemId,
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/domain/progression/run-service.test.ts`
Expected: PASS

- [ ] **Step 6: StatsScreen にトーテム・キーストーン表示を追加する**

`components/StatsScreen.tsx` を編集する。冒頭の constants import に `TOTEMS` を追加（既存の `DIFFS` import 行に合わせる）：

```typescript
import { DIFFS, TOTEMS } from '../constants';
```

ラン1行の描画（`{[...runStats].reverse().slice(0, 20).map((s) => { ... })}`）内、`const awk = ...` の後に追記：

```typescript
          const totem = s.totemId ? TOTEMS.find(t => t.id === s.totemId) : undefined;
          const totemLabel = totem ? ` ${totem.ic}` : '';
          const ksLabel = s.keystoneCount && s.keystoneCount > 0 ? ` 🔑${s.keystoneCount}` : '';
```

`<span>{awk}</span>` の直後に追記：

```typescript
              <span>{totemLabel}{ksLabel}</span>
```

- [ ] **Step 7: 表示が壊れていないことを確認する**

Run: `npm test -- src/features/primal-path/__tests__ && npm run typecheck`
Expected: 全 PASS・型エラーなし

- [ ] **Step 8: コミット**

```bash
git add src/features/primal-path/types/stats.ts src/features/primal-path/domain/progression/run-service.ts src/features/primal-path/components/StatsScreen.tsx src/features/primal-path/__tests__/domain/progression/run-service.test.ts
git commit -m "$(cat <<'EOF'
feat: ラン統計にトーテムを記録し統計画面に表示

- RunStats に totemId を追加、calcRunStats で記録
- StatsScreen にトーテムアイコンとキーストーン数を表示

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: シグネチャーコンボ統合テスト6種

6コンボそれぞれを「メカニズム単体＋戦闘スモーク」で検証する。検証軸は「狙った乗算効果が発火する」（必勝の断定はしない）。Task 4 で反射タンクのメカニズムは固定済み、本タスクはコンボ全体の結合を検証する。

**Files:**
- Test: `__tests__/signature-combos.test.ts`（新規）

**Interfaces:**
- Consumes: `tick`・`applyKeystone`・`applyTotem`・`applyEmberBiomeScale`・`keystonePlayerAtkMods`・`onKeystoneKill`（全て `game-logic` 経由）、`makeRun`。
- Produces: 6コンボの統合テスト（新規ファイル）。

- [ ] **Step 1: コンボ統合テストファイルを作成する**

`__tests__/signature-combos.test.ts` を新規作成する：

```typescript
/**
 * シグネチャーコンボ統合テスト（Phase 3）
 *
 * 各コンボの「狙った乗算効果が発火する」ことを検証する。
 * 必勝は断定しない（設計指針＝成立はするが必勝ではない）。
 */
import { tick, applyKeystone, applyTotem, applyEmberBiomeScale, keystonePlayerAtkMods, onKeystoneKill } from '../game-logic';
import { makeRun } from './test-helpers';

describe('コンボ1: 低空飛行（不滅の祈り＋狂血の覚醒＋血の祖）', () => {
  it('低HP維持で ATK×2、致死を祈りで耐える', () => {
    let r = makeRun({ atk: 100, mhp: 100, hp: 100 });
    r = applyTotem(r, 'blood');           // mhp×0.8=80, atk×1.2=120, cr+0.05
    r = applyKeystone(r, 'madblood');     // HP30%以下で ATK×2
    r = applyKeystone(r, 'undying_prayer');
    r.hp = Math.floor(r.mhp * 0.2);       // 低空飛行（30%以下）
    const mods = keystonePlayerAtkMods(r);
    expect(mods.mult).toBe(2);            // 狂血の ATK×2 が発火
  });

  it('不滅の祈りで致死ダメージを HP1 で耐える', () => {
    let r = makeRun({ atk: 10, def: 0, hp: 5, mhp: 100, keystones: [] });
    r = applyKeystone(r, 'undying_prayer');
    r.ksGuardUsed = false;
    r.en = { n: '猛獣', hp: 100000, mhp: 100000, atk: 9999, def: 0, bone: 0 };
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.hp).toBe(1);       // 致死をHP1で耐える
  });
});

describe('コンボ2: 反射タンク（棘の守護＋岩の祖）', () => {
  it('岩の祖の環境抵抗が tb.iR/fR に加算される', () => {
    const r = applyTotem(makeRun({ def: 2 }), 'rock');
    expect(r.def).toBe(6);
    expect(r.tb.iR).toBeGreaterThanOrEqual(0.3);
  });

  it('反射で敵が同tick内で撃破される（Task4 の結合確認）', () => {
    const r = makeRun({
      keystones: ['thorn_guard'], atk: 8, def: 0, hp: 1000, mhp: 1000, cr: 0,
      en: { n: '岩亀', hp: 2, mhp: 100, atk: 100, def: 1000, bone: 3 },
    });
    const res = tick(r, false, () => 0.99);
    expect(res.nextRun.kills).toBe(1);
  });
});

describe('コンボ3: 火傷伝播（連鎖の業火＋火傷）', () => {
  it('火傷状態でのキルで火傷倍率スタックが恒久加算される', () => {
    const r = makeRun({ keystones: ['chain_blaze'], burn: 1, ksStacks: {} });
    onKeystoneKill(r);
    expect(r.ksStacks?.chain_blaze).toBeCloseTo(0.2, 5);
    onKeystoneKill(r);
    expect(r.ksStacks?.chain_blaze).toBeCloseTo(0.4, 5);
  });
});

describe('コンボ4: 群狼（群狼の戦術＋群れの祖）', () => {
  it('生存仲間数に比例してプレイヤーATKが乗算される', () => {
    let r = makeRun({ atk: 100 });
    r = applyTotem(r, 'pack');            // 開始仲間1体＋仲間枠
    r = applyKeystone(r, 'wolf_pack');
    const alive = r.al.filter(a => a.a).length;
    const mods = keystonePlayerAtkMods(r);
    expect(mods.mult).toBeCloseTo(1 + 0.1 * alive, 5);
    expect(alive).toBeGreaterThan(0);
  });
});

describe('コンボ5: 諸刃の逆転（諸刃の進化＋高DEF）', () => {
  it('高DEFが ATK へ ×3 変換される', () => {
    const r = applyKeystone(makeRun({ atk: 10, def: 30 }), 'double_edge');
    expect(r.def).toBe(0);
    expect(r.atk).toBe(10 + 30 * 3); // 100
  });
});

describe('コンボ6: 極・晩成（種火の祖＋狩人の蓄積）', () => {
  it('踏破スケールとキルスタックが累積する', () => {
    let r = makeRun({ atk: 100, def: 10, mhp: 200, hp: 200 });
    r = applyTotem(r, 'ember');           // atk×0.7=70, emberBase snapshot
    r = applyKeystone(r, 'hunter_stack');
    r.bc = 1;
    r = applyEmberBiomeScale(r);          // +floor(70×0.12)=8 → atk 78
    expect(r.atk).toBe(78);
    onKeystoneKill(r);                    // 狩人 +3
    expect(r.ksStacks?.hunter_stack).toBe(3);
    const mods = keystonePlayerAtkMods(r);
    expect(mods.flatAdd).toBe(3);         // 狩人スタックが攻撃に反映
  });
});
```

- [ ] **Step 2: テストを実行して通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/signature-combos.test.ts`
Expected: PASS（Task 1〜5 の実装が揃っていれば全コンボが成立）

> もし FAIL する場合、原因のメカニズムを担当する Task（1〜5）の実装漏れを示す。該当 Task に戻って修正すること（このタスクでテスト内容を緩めない）。

- [ ] **Step 3: コミット**

```bash
git add src/features/primal-path/__tests__/signature-combos.test.ts
git commit -m "$(cat <<'EOF'
test: シグネチャーコンボ6種の統合テストを追加

- 低空飛行/反射タンク/火傷伝播/群狼/諸刃の逆転/極・晩成
- 各コンボの乗算効果の発火を検証（必勝は断定しない）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: バランスガードレールテスト＋ドキュメント更新＋全体検証

種火の線形成長が想定範囲に収まることを保証するガードレールテストを追加し、README に Phase 3 を追記、CI 全体を通す。

**Files:**
- Test: `__tests__/totem-service.test.ts`（追記）
- Modify: `README.md`

**Interfaces:**
- Consumes: `applyTotem`・`applyEmberBiomeScale`、`makeRun`。

- [ ] **Step 1: ガードレールテストを書く**

`__tests__/totem-service.test.ts` の末尾に追記：

```typescript
describe('バランスガードレール — 種火の線形成長', () => {
  it('bc=5 で base×1.6 になる（線形・非指数）', () => {
    // emberBase=100 のステを 5 回踏破。各回 +floor(100×0.12)=12 → 100 + 12×5 = 160
    let r = makeRun({ atk: 100, def: 100, mhp: 100, hp: 100, totemId: 'ember', emberBase: { atk: 100, def: 100, mhp: 100 } });
    for (let i = 0; i < 5; i++) r = applyEmberBiomeScale(r);
    expect(r.atk).toBe(160); // base×1.6（指数なら 100×1.12^5≈176 になるはず）
    expect(r.def).toBe(160);
    expect(r.mhp).toBe(160);
  });

  it('上位トーテムのステ倍率が極端でない（atkMul は 0.7〜1.3 の範囲）', () => {
    const r1 = applyTotem(makeRun({ atk: 100 }), 'ember');
    expect(r1.atk).toBeGreaterThanOrEqual(70);  // 種火は -30% 始動
    const r2 = applyTotem(makeRun({ atk: 100 }), 'blood');
    expect(r2.atk).toBeLessThanOrEqual(130);    // 血の祖でも +30% 以内
  });
});
```

- [ ] **Step 2: テストを実行して通ることを確認する**

Run: `npm test -- src/features/primal-path/__tests__/totem-service.test.ts`
Expected: PASS

- [ ] **Step 3: README に Phase 3 を追記する**

`README.md`（`src/features/primal-path/README.md`）のトーテム/キーストーンに関する記述箇所に、上位トーテム3種（岩/霊/種火）の解放条件と効果、curve+tag 提示重み付けを追記する。既存の記述スタイル（見出し・表）に合わせること。最低限、以下の内容を含める：

- 🛡️ 岩の祖（2クリア解放）: DEF+4・環境ダメージ-30%（反射タンク）
- 👻 霊の祖（5クリア解放）: 覚醒要求-1・覚醒効果+25%（覚醒スケール）
- 🌰 種火の祖（10クリア解放）: 開始ATK-30%・踏破ごと全ステ+12%（極・晩成）
- キーストーン節目提示はトーテムの curve と tag に一致するものを優先（最大3倍重み）

- [ ] **Step 4: CI 全体を通す**

Run: `npm run lint:ci && npm run typecheck && npm test -- src/features/primal-path`
Expected: lint 警告ゼロ・型エラーなし・全テスト PASS

> 注: `npm run test:e2e`（Playwright）はローカル実行不可（CI のみ）。本フェーズは新規フェーズ追加なしのため E2E ヘルパー非改変で挙動不変。

- [ ] **Step 5: コミット**

```bash
git add src/features/primal-path/__tests__/totem-service.test.ts src/features/primal-path/README.md
git commit -m "$(cat <<'EOF'
test: 種火スケールのバランスガードレール／docs: README に Phase 3 追記

- bc=5 で base×1.6 の線形成長を保証（指数化の検出）
- 上位トーテムのステ倍率が極端でないことを確認
- README に上位トーテム3種と提示重み付けを追記

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 完了条件

- 上位トーテム3種が解放条件（2/5/10クリア）付きで選択・適用できる。
- 霊の祖の覚醒要求緩和・効果増、種火の踏破スケール（線形・差分回復）が動作する。
- 棘の守護の反射キルが同tick内で確定する。
- キーストーン節目提示が curve+tag 合算で重み付けされる。
- 統計画面にトーテム・キーストーンが表示される。
- シグネチャーコンボ6種の統合テストが通る。
- `npm run ci` 相当（lint:ci・typecheck・test）が全てパスする。

## スコープ外（設計書 D 節の制約に基づく明示的除外）

- **トーテム専用実績の追加**は本計画から除外する。理由：新しい `AchievementCondition` 型と「どのトーテムでクリアしたか」を追跡する累計統計基盤が必要で、設計書 D 節の制約「**既存の実績判定基盤に乗る範囲のみ**」を超えるため。統計成果物は RunStats/StatsScreen に限定する（既存の実績判定は不変）。
