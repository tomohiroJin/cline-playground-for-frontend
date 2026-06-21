# PRIMAL PATH HP負クランプ漏れバグ修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 環境ダメージで負HPになった直後に敵を撃破する経路を塞ぎ、`tick()` 出口でプレイヤーHPが必ず非負になるよう是正する。

**Architecture:** `tick()` の `tickEnvPhase` 直後に既存の `tickDeathCheck` を挿入し、環境ダメージ致死を正規の死亡（または復活/不滅発動）として処理する。加えて `resolveEnemyDefeat` の事後条件呼び出し直前に保険クランプを置く。

**Tech Stack:** TypeScript / Jest 30 / React 19（テストは Jest のみ）

## Global Constraints

- `any` 型禁止（`unknown` + 型ガード）。
- コメントは日本語。「なぜ」を説明する。
- マジックナンバーは既存の定数/挙動に従う（本修正では新規定数なし）。
- テストは AAA パターン、テスト名は日本語で「何をしたら何が起きるか」。
- `domain/` は外部依存なし（純粋ロジック）。
- Jest 実行時の `NODE_ENV` は `test`（≠ `production`）なので DbC コントラクトは有効。

---

### Task 1: 環境ダメージ致死の死亡判定追加＋保険クランプ

**Files:**
- Modify: `src/features/primal-path/domain/battle/tick-phases.ts`
  - `tick`（212-265行）: `tickEnvPhase` 直後に死亡判定を挿入
  - `resolveEnemyDefeat`（196-209行）: 事後条件呼び出し直前に保険クランプを挿入
- Test: `src/features/primal-path/__tests__/domain/battle/tick-phases.test.ts`（既存ファイルに追記）

**Interfaces:**
- Consumes:
  - `tick(r: RunState, finalMode: boolean, rng?: () => number): TickResult`（既存・公開）
  - `tickDeathCheck(next: RunState, events: TickEvent[]): boolean`（既存・同ファイル内）
  - `makeRun(overrides?: Partial<RunState>): RunState`（`__tests__/test-helpers.ts`）
  - `TB_DEFAULTS`（`constants` 経由・`test-helpers` から間接利用可。テストでは `makeRun` の `tb` を上書き）
  - 環境ダメージ発火条件: `cBT: 'glacier'`（`ENV_DMG.glacier.base = 3`）＋ `dd: DIFFS[0]`（`env = 1`）→ 環境ダメージ = 3
  - イベント型: `{ type: 'player_dead' }` / `{ type: 'enemy_killed' }`（`TickEvent`）
- Produces: なし（公開シグネチャ不変。挙動のみ是正）

- [ ] **Step 1: 失敗するテストを追記する**

`src/features/primal-path/__tests__/domain/battle/tick-phases.test.ts` の `describe('tick', () => {` ブロック内、
既存の最後の `it(...)`（52行付近の「元のRunStateを変更しない」テスト）の直後に、以下の `describe` ブロックを追記する。
ファイル先頭の import に `TB_DEFAULTS` を追加する（`import { makeRun } from '../../test-helpers';` を
`import { makeRun } from '../../test-helpers';` のまま維持し、新たに `import { TB_DEFAULTS } from '../../../constants';` を追加）。

```typescript
    describe('環境ダメージによる死亡判定', () => {
      it('環境ダメージが致死量のとき、そのtickでプレイヤーが死亡し敵は撃破されない', () => {
        // Arrange: 氷河バイオーム(環境ダメージ3)、HP2で必ず致死。敵は瀕死だが攻撃前に死ぬ
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
          atk: 100, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: プレイヤー死亡イベントが発火し、敵撃破は発火しない
        expect(result.events.some(e => e.type === 'player_dead')).toBe(true);
        expect(result.events.some(e => e.type === 'enemy_killed')).toBe(false);
        expect(result.nextRun.hp).toBe(0);
      });

      it('環境ダメージで負HPになる状況でも事後条件例外を投げない（回帰）', () => {
        // Arrange: 環境ダメージで負HP→同tickで敵撃破できる構成（旧バグの再現条件）
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          en: { n: 'weak', hp: 1, mhp: 1, atk: 1, def: 0, bone: 5 },
          atk: 100, aM: 1, dm: 1,
        });

        // Act / Assert: dev環境(NODE_ENV=test)でも ensureTickResult が例外を投げない
        expect(() => tick(run, false, () => 0.5)).not.toThrow();
      });

      it('復活の儀を保有していれば環境ダメージ致死でも発動し戦闘継続する', () => {
        // Arrange: tb.rv を有効化。環境ダメージで一度致死になっても復活する
        const run = makeRun({
          cBT: 'glacier',
          hp: 2, mhp: 80,
          tb: { ...TB_DEFAULTS, rv: 1 },
          rvU: 0,
          en: { n: 'tough', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
          atk: 10, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: 死亡せず、HPが正に復帰している
        expect(result.events.some(e => e.type === 'player_dead')).toBe(false);
        expect(result.nextRun.hp).toBeGreaterThan(0);
      });

      it('環境ダメージが非致死なら通常どおり戦闘が継続する', () => {
        // Arrange: 氷河(環境ダメージ3)だがHP80で生存。敵は硬く倒れない
        const run = makeRun({
          cBT: 'glacier',
          hp: 80, mhp: 80,
          en: { n: 'tough', hp: 1000, mhp: 1000, atk: 1, def: 0, bone: 1 },
          atk: 10, aM: 1, dm: 1,
        });

        // Act
        const result = tick(run, false, () => 0.5);

        // Assert: 死亡せずターンが進行し、環境ダメージ3＋敵攻撃1でHP76
        expect(result.events.some(e => e.type === 'player_dead')).toBe(false);
        expect(result.nextRun.turn).toBe(1);
        expect(result.nextRun.hp).toBe(76);
      });
    });
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/primal-path/__tests__/domain/battle/tick-phases.test.ts --no-coverage`
Expected: FAIL。「環境ダメージが致死量のとき…」は `player_dead` が出ず（旧コードは死亡判定を通らない）、
回帰テストは `ensureTickResult` の事後条件違反例外で FAIL する。

- [ ] **Step 3: 死亡判定を追加する（本丸）**

`src/features/primal-path/domain/battle/tick-phases.ts` の `tick` 関数内、現状:

```typescript
  tickEnvPhase(next, events);
  tickPlayerPhase(next, e, events, rng, sb);
```

を、以下に変更する（`tickEnvPhase` と `tickPlayerPhase` の間に死亡判定を挿入）:

```typescript
  tickEnvPhase(next, events);
  // 環境ダメージが致死量の場合はここで死亡（または復活/不滅）を確定し、
  // 負HPのまま敵撃破経路へ抜けるのを防ぐ
  if (tickDeathCheck(next, events)) {
    return { nextRun: next, events };
  }
  tickPlayerPhase(next, e, events, rng, sb);
```

- [ ] **Step 4: 保険クランプを追加する**

同ファイルの `resolveEnemyDefeat` 関数内、現状:

```typescript
  const result = { nextRun: next, events };
  if (process.env.NODE_ENV !== 'production') ensureTickResult(result);
  return result;
```

を、以下に変更する（事後条件呼び出し直前に保険クランプ）:

```typescript
  // 保険: 将来のリグレッションでも事後条件違反を起こさないよう負HPを0に丸める
  if (next.hp < 0) next.hp = 0;
  const result = { nextRun: next, events };
  if (process.env.NODE_ENV !== 'production') ensureTickResult(result);
  return result;
```

- [ ] **Step 5: テストを実行して成功を確認する**

Run: `npx jest src/features/primal-path/__tests__/domain/battle/tick-phases.test.ts --no-coverage`
Expected: PASS（新規4件＋既存5件すべて）。

- [ ] **Step 6: primal-path 全テストで回帰がないことを確認する**

Run: `npx jest src/features/primal-path --no-coverage`
Expected: PASS（全スイート）。特に `battle-service` / `combat-calculator` / `__sim__` の回帰がないこと。

- [ ] **Step 7: 型チェックと lint を実行する**

Run: `npm run typecheck && npm run lint`
Expected: エラー0、警告0。

- [ ] **Step 8: コミットする**

```bash
git add src/features/primal-path/domain/battle/tick-phases.ts \
        src/features/primal-path/__tests__/domain/battle/tick-phases.test.ts
git commit -m "fix: PRIMAL PATH 環境ダメージ致死時のHP負クランプ漏れを修正

- tickEnvPhase 直後に tickDeathCheck を追加し環境ダメージ致死を正しく死亡扱いに
- resolveEnemyDefeat に保険クランプを追加
- 環境ダメージ致死・回帰・復活発動・通常戦闘不変の4テストを追加

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 保険クランプのテストについて（補足）

死亡判定の追加により、`resolveEnemyDefeat` 到達時にプレイヤーHPが負になる経路は構造的に消滅する。
そのため保険クランプ（Step 4）は防御的措置であり、`tick` 経由で単体到達させる自然なテストは書けない。
その健全性は Step 1 の回帰テスト（事後条件例外を投げない）によって担保される。

## Self-Review

- **Spec coverage:** spec §3.1（死亡判定追加）→ Task1 Step3 / §3.2（保険クランプ）→ Step4 / §5 テスト4観点 →
  Step1 の4テスト（致死死亡・回帰・復活・通常不変）。全てカバー済み。
- **Placeholder scan:** TBD/TODO なし。全ステップに実コード・実コマンド・期待値を記載。
- **Type consistency:** `tickDeathCheck` のシグネチャ `(next, events) => boolean`、イベント型 `player_dead`/`enemy_killed`、
  `makeRun` の引数型を実コードと一致確認済み。
