# PRIMAL PATH バランス調整 (a)(b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** メタ進行の二値支配を緩和し（中間バンド）、即効型と晩成型のパワーカーブを終盤で交差させる。戦闘力スプレッド圧縮（アプローチA）で実現する。

**Architecture:** 新規バランスガードレールテスト（env ガード）に成功基準を数値で記述し「先に書く失敗テスト」とする。本番 reducer 駆動シミュレータで反復計測しながら、ベース初期ステ・上位ツリーノード・トーテム係数・敵踏破スケールの定数を調整して目標バンドへ収束させる。

**Tech Stack:** TypeScript / Jest 30 / 既存シミュレータ（`__sim__/run-simulator.ts`、`Math.random` シード化・NODE_ENV=production 化で本番忠実・決定論）

## Global Constraints

- 成功基準（greedy-atk・トーテム平均勝率）:
  - (a) 上限: フル強化 di3 ∈ [0.55, 0.80]、フル強化 di1 > 0.85。
  - (a) 下限: 無強化 di1 ∈ [0.20, 0.45]、無強化 di2 > 0.0。
  - (a) 際どい帯: ツリー段階×難易度の組のうち 2 つ以上が [0.30, 0.70]。
  - (b) 終盤交差（フル強化・greedy-atk・di0、戦闘開始時 実効ATK 平均）: bc0 と bc1 で blood>ember、bc2 で ember>blood。
- アプローチ A（スプレッド圧縮）。敵スケールはプレイヤー投資と独立のまま（ラバーバンド不採用）。
- 難易度 `constants/difficulty.ts` の hm/am は原則変更しない（目標未達時の最終手段）。
- トーテム atkMul は 0.7〜1.3 の範囲を維持（既存ガードレール）。
- `any` 型禁止。コメントは日本語で「なぜ」。マジックナンバーは既存の定数定義に従う。
- バランスは経験的反復で収束: §初期候補値は出発点。**ガードレール緑が受け入れ基準**。
- 反復は軽量（`SIM_SEEDS=30〜40`）で方向確認 → フル（150）で最終ゲート。レバーは1つずつ動かす。
- フルシミュレーションは重い（数分）。

## 現状の確定値（調査済み）

- `domain/progression/run-service.ts` の `startRunState`（41-42行）:
  `hp: 80 + tb.bH, mhp: 80 + tb.bH, atk: 8 + tb.bA, def: 2 + tb.bD`
- `constants/tree.ts` 上位ノード: atk6(bA+8) / atk7(bA+12) / atk8(bA+20, dM+0.25)、dmg1(dM+0.08)/atk5(dM+0.15)/dmg2(dM+0.20)。
- `constants/totem.ts`: blood `{ mhpMul: 0.8, atkMul: 1.2, crAdd: 0.05 }`、ember `{ atkMul: 0.7, biomeScale: 0.12 }`。
- `domain/battle/battle-service.ts` の `startBattle`（30-33行）:
  `const biomeScale = 0.75 + next.cB * 0.25;` … `scaleEnemy(src, next.dd.hm, next.dd.am, (biomeScale + next.bc * 0.25) * endlessScale)`
- `domain/totem/totem-service.ts`: `applyEmberBiomeScale`（74-81行）が `emberBase × biomeScale` を加算。

## テスト影響（調査済み）

- 壊れない: `run-service.test.ts`（`toBeGreaterThan(0)` のみ）、`tree.test.ts`（構造のみ）、`battle-service.test.ts`（相対比較のみ）、`run-state-builder.test.ts`（ビルダー固有の固定値で run-service と独立）。
- 壊れる: `__tests__/totem-service.test.ts` のうち **ember を変更した場合**（`emberBase×0.12`系・`bc=5でbase×1.6`ガードレール）と **blood の atkMul/mhpMul/crAdd を変更した場合**。これらの期待値を新仕様で更新する。

---

### Task 1: バランスガードレールテストの新規作成（先に書く失敗テスト）

**Files:**
- Create: `src/features/primal-path/__sim__/balance-guardrail.test.ts`
- Test: 同上（このファイル自体がテスト）

**Interfaces:**
- Consumes:
  - `simulateRun(config: SimConfig): SimResult`、`FULL_TREE`（`./run-simulator`）
  - `SimResult.result: 'victory' | 'defeat'`、`SimResult.powerCurve: PowerSnapshot[]`（`PowerSnapshot.bc`、`PowerSnapshot.effAtk`）
  - `TOTEMS`、`TREE`（`../constants`）。`TotemId`（`../types`）
  - 環境変数: `RUN_BALANCE_SIM`（'1' で実行、それ以外 skip）、`SIM_SEEDS`（既定 60）
- Produces: なし（テストのみ）

- [ ] **Step 1: ガードレールテストを作成する**

`src/features/primal-path/__sim__/balance-guardrail.test.ts` を新規作成:

```typescript
/**
 * バランスガードレール（手動実行）。
 *
 *   RUN_BALANCE_SIM=1 npx jest balance-guardrail --no-coverage
 *   RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail --no-coverage   // 調整用の軽量実行
 *
 * 面白さ検証の設計目標（(a) メタ進行二値支配の是正 / (b) パワーカーブ終盤交差）を
 * 本番 reducer 駆動シミュレータで定量検証し、目標バンドをハードアサーションで強制する。
 * 重いため CI ではスキップ（health check は run-simulator.test.ts）。
 */
import { simulateRun, FULL_TREE, type SimResult } from './run-simulator';
import { TOTEMS, TREE } from '../constants';
import type { TotemId } from '../types';

const RUN = process.env.RUN_BALANCE_SIM === '1';
const d = RUN ? describe : describe.skip;

const TOTEM_IDS: readonly TotemId[] = TOTEMS.map(t => t.id);
const SEEDS = Number(process.env.SIM_SEEDS ?? 60);

/** Tier maxTier 以下のツリーノードを全解放した部分メタ進行状態 */
const treeUpToTier = (maxTier: number): Record<string, number> =>
  Object.fromEntries(TREE.filter(n => n.t <= maxTier).map(n => [n.id, 1]));

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** ある条件で SEEDS 回シミュレートする */
function batch(opts: { di: number; totemId: TotemId; tree?: Record<string, number> }): SimResult[] {
  return Array.from({ length: SEEDS }, (_, i) =>
    simulateRun({ ...opts, evoStrategy: 'greedy-atk', seed: i * 7919 + 13 }));
}

const winRate = (rs: SimResult[]): number => rs.filter(r => r.result === 'victory').length / rs.length;

/** トーテム平均勝率（greedy-atk） */
function totemAvgWinRate(di: number, tree?: Record<string, number>): number {
  return mean(TOTEM_IDS.map(t => winRate(batch({ di, totemId: t, tree }))));
}

/** あるトーテムの bc 開始時 実効ATK 平均（フル強化・di0） */
function curveAt(totemId: TotemId, bc: number): number {
  const rs = batch({ di: 0, totemId, tree: FULL_TREE });
  return mean(rs.flatMap(r => {
    const s = r.powerCurve.find(p => p.bc === bc);
    return s ? [s.effAtk] : [];
  }));
}

d('PRIMAL PATH バランスガードレール', () => {
  jest.setTimeout(900_000);

  it('(a) 上限: フル強化 di3 トーテム平均勝率が [0.55, 0.80]（必勝でない）', () => {
    const wr = totemAvgWinRate(3, FULL_TREE);
    expect(wr).toBeGreaterThanOrEqual(0.55);
    expect(wr).toBeLessThanOrEqual(0.80);
  });

  it('(a) 上限の妥当性: フル強化 di1 トーテム平均勝率が 0.85 超（強化は報われる）', () => {
    expect(totemAvgWinRate(1, FULL_TREE)).toBeGreaterThan(0.85);
  });

  it('(a) 下限: 無強化 di1 トーテム平均勝率が [0.20, 0.45]', () => {
    const wr = totemAvgWinRate(1, undefined);
    expect(wr).toBeGreaterThanOrEqual(0.20);
    expect(wr).toBeLessThanOrEqual(0.45);
  });

  it('(a) 下限: 無強化 di2 トーテム平均勝率が 0 超（わずかでも手が届く）', () => {
    expect(totemAvgWinRate(2, undefined)).toBeGreaterThan(0.0);
  });

  it('(a) 際どい帯: ツリー段階×難易度の 2 つ以上が [0.30, 0.70]', () => {
    const tiers = [undefined, treeUpToTier(1), treeUpToTier(2), treeUpToTier(3), treeUpToTier(4), FULL_TREE];
    const diffs = [1, 2, 3];
    let closeCount = 0;
    for (const tree of tiers) {
      for (const di of diffs) {
        const wr = totemAvgWinRate(di, tree);
        if (wr >= 0.30 && wr <= 0.70) closeCount++;
      }
    }
    expect(closeCount).toBeGreaterThanOrEqual(2);
  });

  it('(b) 終盤交差: bc0/bc1 は blood>ember、bc2 は ember>blood', () => {
    const bloodBc0 = curveAt('blood', 0);
    const emberBc0 = curveAt('ember', 0);
    const bloodBc1 = curveAt('blood', 1);
    const emberBc1 = curveAt('ember', 1);
    const bloodBc2 = curveAt('blood', 2);
    const emberBc2 = curveAt('ember', 2);
    expect(bloodBc0).toBeGreaterThan(emberBc0);
    expect(bloodBc1).toBeGreaterThan(emberBc1);
    expect(emberBc2).toBeGreaterThan(bloodBc2);
  });
});
```

- [ ] **Step 2: 現状定数では FAIL することを確認する（ベースライン記録）**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail --no-coverage --silent=false`
Expected: 複数 FAIL。特に「(a) 上限」はフル強化 di3=100% で `<= 0.80` 違反、「(b) 終盤交差」は bc2 で blood>ember のため `emberBc2 > bloodBc2` 違反。失敗内容（実測値）をレポートに記録する。

- [ ] **Step 3: コミット（失敗テストの確定）**

```bash
git add src/features/primal-path/__sim__/balance-guardrail.test.ts
git commit -m "test: PRIMAL PATH バランスガードレールを追加（目標値ハードアサーション・未達）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: (a) スプレッド圧縮 — ベース底上げ＋上位ツリー減弱

**Files:**
- Modify: `src/features/primal-path/domain/progression/run-service.ts:41`（ベース初期ステ）
- Modify: `src/features/primal-path/constants/tree.ts`（atk6/atk7/atk8 の bA、dmg1/atk5/dmg2/atk8 の dM）
- Test: `src/features/primal-path/__sim__/balance-guardrail.test.ts`（(a) 系アサーションで判定）

**Interfaces:**
- Consumes: Task 1 のガードレール（(a) 上限/下限/際どい帯）
- Produces: 調整後のベース初期ステと上位ツリー係数（最終値は反復で確定）

- [ ] **Step 1: ベース初期ステを底上げする（下限救済）**

`run-service.ts:41` を初期候補へ変更（最終値は Step 3 の反復で調整）:

```typescript
// 変更前: hp: 80 + tb.bH, mhp: 80 + tb.bH, atk: 8 + tb.bA, def: 2 + tb.bD,
// 変更後（初期候補）:
hp: 100 + tb.bH, mhp: 100 + tb.bH, atk: 12 + tb.bA, def: 3 + tb.bD,
```

- [ ] **Step 2: 上位ツリーノードを減弱する（上限抑制）**

`constants/tree.ts` の該当ノード効果を初期候補へ変更（最終値は Step 3 で調整）:

- atk6: `bA: 8` → `bA: 6`
- atk7: `bA: 12` → `bA: 8`
- atk8: `bA: 20` → `bA: 12`、`dM: 0.25` → `dM: 0.15`
- dmg2: `dM: 0.20` → `dM: 0.12`
- atk5: `dM: 0.15` → `dM: 0.10`
- dmg1: `dM: 0.08`（据え置き、必要時のみ）

（合計 bA は 51→約33、dM は 0.68→約0.45 に圧縮される想定）

- [ ] **Step 3: 軽量シミュレーションで (a) を反復調整する**

Run（軽量・方向確認）: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail -t "(a)" --no-coverage --silent=false`

判定と調整:
- フル強化 di3 が 0.80 超 → 上位ノード(atk7/atk8/dmg2)をさらに減弱。0.55 未満 → 減弱を戻す。
- フル強化 di1 が 0.85 以下 → 上位ノード減弱がやり過ぎ。ベースまたは中位ノードを少し戻す。
- 無強化 di1 が 0.20 未満 → ベース atk/hp をさらに底上げ。0.45 超 → 底上げを戻す。
- 無強化 di2 が 0 → ベースをもう少し底上げ。
- 際どい帯が 2 未満 → ベースと上位の差をもう少し縮める。
- **レバーは1つずつ動かし、各変更後に再実行**して影響を観測する。

繰り返し、(a) の4テスト（上限/上限妥当性/下限di1/下限di2/際どい帯）が SIM_SEEDS=30 で緑になるまで調整する。

- [ ] **Step 4: (a) をフルシードで確認する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=150 npx jest balance-guardrail -t "(a)" --no-coverage --silent=false`
Expected: (a) 系すべて PASS。境界付近で揺れる場合は Step 3 に戻り中央寄りへ微調整。

- [ ] **Step 5: 既存ユニットテストの回帰を確認する**

Run: `npx jest src/features/primal-path --no-coverage`
Expected: PASS。Task 2 のレバー（run-service ベース・tree ノード）は調査上テストを壊さない。
万一 FAIL があればそのテストの期待値が新仕様と整合するか確認し、整合する更新のみ行う（挙動是正が目的）。

- [ ] **Step 6: コミット**

```bash
git add src/features/primal-path/domain/progression/run-service.ts \
        src/features/primal-path/constants/tree.ts
git commit -m "perf: PRIMAL PATH メタ進行二値支配を緩和（スプレッド圧縮）

- ベース初期ステを底上げ（下限救済）／上位ツリーノードを減弱（上限抑制）
- フル強化di3を必勝から[0.55,0.80]へ、無強化di1を[0.20,0.45]へ
- balance-guardrail (a) 系が緑

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: (b) パワーカーブ終盤交差 — 晩成強化＋敵踏破スケール鈍化

**Files:**
- Modify: `src/features/primal-path/constants/totem.ts`（ember `biomeScale`、必要時 blood `atkMul`）
- Modify: `src/features/primal-path/domain/battle/battle-service.ts:30`（敵踏破スケール係数）
- Test: `src/features/primal-path/__tests__/totem-service.test.ts`（ember 数値アサーションの期待値更新）
- Test: `src/features/primal-path/__sim__/balance-guardrail.test.ts`（(b) アサーションで判定）

**Interfaces:**
- Consumes: Task 2 後の定数、Task 1 のガードレール (b)
- Produces: 調整後の ember biomeScale・敵踏破スケール係数（最終値は反復で確定）

- [ ] **Step 1: ember の晩成スケールを強化する**

`constants/totem.ts` の ember を初期候補へ変更（最終値は Step 3 で調整）:

```typescript
// 変更前: effect: { atkMul: 0.7, biomeScale: 0.12 }
// 変更後（初期候補）:
effect: { atkMul: 0.7, biomeScale: 0.22 }
```

（atkMul は 0.7 据え置き＝序盤は弱いまま、biomeScale 増で終盤に伸びる。atkMul を変える場合も 0.7〜1.3 範囲を維持）

- [ ] **Step 2: 敵の踏破スケール成長を鈍化する**

`domain/battle/battle-service.ts:30` を初期候補へ変更（最終値は Step 3 で調整）:

```typescript
// 変更前: const biomeScale = 0.75 + next.cB * 0.25;
// 変更後（初期候補）:
const biomeScale = 0.75 + next.cB * 0.18;
```

（踏破ごとの敵強化を鈍らせ、晩成型の終盤追い上げを可能にする。下流の `(biomeScale + next.bc * 0.25)` の `bc*0.25` は据え置き）

- [ ] **Step 3: 軽量シミュレーションで (b) を反復調整する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=30 npx jest balance-guardrail -t "(b)" --no-coverage --silent=false`

判定と調整:
- bc2 で ember が blood を超えない → ember biomeScale をさらに増（例 0.22→0.26）、または敵踏破スケール係数をさらに鈍化（0.18→0.15）。
- bc1 で ember が blood を超えてしまう（中盤交差してしまう） → ember biomeScale を少し下げる、または blood atkMul を微減（1.2→1.15、範囲内）で序盤優位を保ちつつ交差点を後ろへ。
- bc0 で blood が ember を超えない（通常起きないが） → blood atkMul を確認。
- **レバーは1つずつ動かす**。(b) は bc0/bc1 で blood>ember かつ bc2 で ember>blood の3条件同時成立が目標。

- [ ] **Step 4: ember 系の既存ユニットテスト期待値を更新する**

`__tests__/totem-service.test.ts` の ember 数値アサーションを新 biomeScale に合わせて更新する。
（biomeScale を 0.22 等にした場合の例。実際の採用値で再計算すること）

- `it('emberBase×0.12 を ATK/DEF/最大HP に加算し...')`: テスト名と期待値を新係数へ。
  例 biomeScale=0.22: emberBase.atk=100 なら 1 回踏破で +floor(100×0.22)=+22。テストのセットアップ値に応じて再計算。
- `it('ボス撃破でバイオームクリア時、種火スケールが適用される')`: 同様に再計算。
- `it('bc=5 で base×1.6 になる（線形・非指数）')`: biomeScale=0.22 なら base×(1+0.22×5)=base×2.1。
  テスト名を「bc=5 で base×2.1 になる（線形・非指数）」へ更新し、`expect(r.atk).toBe(210)` 等へ（emberBase=100 の場合）。
  「線形・非指数」の検証意図は保持する（指数なら 100×1.22^5≈270 になる、というコメントも更新）。
- `it('開始ATK×0.7 を適用し、emberBase に snapshot する')`: atkMul を変えていなければ更新不要。変えた場合のみ期待値更新。

採用した biomeScale 値で各期待値を正確に再計算し、`applyEmberBiomeScale`/`applyTotem` の実挙動と一致させる。

- [ ] **Step 5: (b) をフルシードで確認しつつ (a) の非回帰も確認する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=150 npx jest balance-guardrail --no-coverage --silent=false`
Expected: (a)(b) すべて PASS。(b) 調整で (a)（特にフル強化勝率）が動くため、崩れていたら Task 2 Step 3 と Task 3 Step 3 を交互に微調整して両立させる。

- [ ] **Step 6: 既存ユニットテスト全体の回帰を確認する**

Run: `npx jest src/features/primal-path --no-coverage`
Expected: PASS（更新した totem-service.test.ts 含む）。

- [ ] **Step 7: 型チェックと lint**

Run: `npm run typecheck && npm run lint`
Expected: EXIT=0、警告0。

- [ ] **Step 8: コミット**

```bash
git add src/features/primal-path/constants/totem.ts \
        src/features/primal-path/domain/battle/battle-service.ts \
        src/features/primal-path/__tests__/totem-service.test.ts
git commit -m "perf: PRIMAL PATH パワーカーブを終盤交差させる（晩成ハイリスク化）

- ember biomeScale 強化＋敵踏破スケール鈍化で bc2 に交差点
- blood は bc0/bc1 を優位維持、ember が bc2 で逆転
- 種火ガードレール期待値を新係数で更新／balance-guardrail (a)(b) 緑

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 最終ゲート — フルシードでの (a)(b) 同時成立と全体回帰

**Files:**
- Test: `src/features/primal-path/__sim__/balance-guardrail.test.ts`（全アサーション）
- Verify: primal-path 全スイート・typecheck・lint

**Interfaces:**
- Consumes: Task 2・3 の最終定数
- Produces: 緑のガードレール（最終バランス確定）

- [ ] **Step 1: フルシードでガードレール全件 PASS を確認する**

Run: `RUN_BALANCE_SIM=1 SIM_SEEDS=150 npx jest balance-guardrail --no-coverage --silent=false`
Expected: (a) 5件 + (b) 1件すべて PASS。実測勝率・カーブ値をレポートに記録する。

- [ ] **Step 2: primal-path 全テスト・型・lint の最終確認**

Run: `npx jest src/features/primal-path --no-coverage && npm run typecheck && npm run lint`
Expected: 全 PASS、EXIT=0、警告0。

- [ ] **Step 3: 検証レポートのバランス結果を追記する**

`docs/superpowers/reports/2026-06-21-primal-path-fun-verification-report.md` に、調整後の勝率テーブル
（無強化/フル × di0-3）とパワーカーブ（blood/ember × bc0/1/2）を「改善後」セクションとして追記し、
(a)(b) の壁が解消されたことを Before/After で示す。

- [ ] **Step 4: コミット**

```bash
git add docs/superpowers/reports/2026-06-21-primal-path-fun-verification-report.md
git commit -m "docs: PRIMAL PATH バランス調整(a)(b)の改善後結果を検証レポートに追記

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

- **Spec coverage:** spec §2 目標値 → Task 1 ガードレール＋Global Constraints。spec §3 レバー(a) → Task 2、レバー(b) → Task 3。spec §4 反復手法 → 各 Task の軽量→フルの2段。spec §5 テスト影響 → Task 3 Step 4。全カバー。
- **Placeholder scan:** 「最終値は反復で確定」は TBD ではなく経験的調整の明示（初期候補値と調整手順・受け入れ基準を具体記載）。それ以外に TBD/TODO なし。
- **Type consistency:** `simulateRun`/`SimConfig`/`SimResult`/`PowerSnapshot`/`FULL_TREE`/`TOTEMS`/`TREE`/`TotemId` を実 API と一致確認済み。`treeUpToTier`/`batch`/`winRate`/`curveAt` は balance-report.test.ts と同型。

## 実行上の注意（コントローラ向け）

- バランス調整（Task 2・3 の Step 3）は **シミュレータを何度も回す長時間の経験的ループ**。フル（150 seeds）は数分かかるため、調整は必ず軽量（30 seeds）で行い、フルは節目のみ。
- レバーは1つずつ。多変数同時変更は収束を見失う。
- 最終採用値は実測に依存するため、計画の初期候補値どおりになるとは限らない（ガードレール緑が正）。
