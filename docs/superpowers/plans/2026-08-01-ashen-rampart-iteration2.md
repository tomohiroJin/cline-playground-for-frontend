# 灰燼の城壁 反復2 実装計画 — 盤面で起きていることが、プレイヤーに見えるか

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** domain が計算済みで UI が読んでいない `TickEvent` を描画し、操作の応答を返し、マナとマスの構造的窮屈さを解消する。

**Architecture:** `TickEvent` を「寿命付きエフェクト」に変換する純粋関数 `combat-effects.ts` を presentation に新設し、SVG オーバーレイ（`viewBox` をセル座標系に一致させる）で描く。ドメイン改修は `defeat` への撃破源の付与、`shot` への支援塔貢献の付与、`discard` アクションの追加、配置クールダウンの適用条件の3点に限定する。判定用の集計は純粋関数 `run-summary.ts` に隔離し、リザルト画面へ出す。

**Tech Stack:** React 19 / TypeScript / styled-components / Jotai（本機能では未使用）/ Jest 30 + @testing-library/react

**設計書:** `docs/superpowers/specs/2026-08-01-ashen-rampart-iteration2-design.md`

## Global Constraints

- **配色は既存5色から増やさない。** `theme.ts` の `dominant` `secondary` `danger` `dangerText` `opportunity` `grid` のみを使う。**赤（`danger` / `dangerText`）は危険専用**
- **情報を色だけに載せない。** グレースケールでも形・太さ・位置で弁別できること
- **`opportunity` はエフェクトに使わない。** `BoardGrid` が「再点火可能な燠火」の意味で既に使用している
- `any` 型の使用禁止（`unknown` + 型ガード）
- コメント・docstring は日本語。変数名・関数名は英語
- ファイル名は kebab-case、コンポーネントは PascalCase、テストは対象と同じディレクトリに `*.test.ts(x)`
- `domain/` は外部依存なし。`presentation/` から `domain/` の純粋関数・型の直接 import は可
- 各タスクの最後に必ずコミットする。コミットメッセージは Conventional Commits（日本語本文）
- `npm run lint:ci` は警告ゼロを強制する

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---|---|
| `src/features/ashen-rampart/presentation/combat-effects.ts` | `TickEvent` → 寿命付き `Effect[]` への純粋変換。座標解決・寿命管理・優先度付き破棄 |
| `src/features/ashen-rampart/presentation/combat-effects.test.ts` | 同上のテスト |
| `src/features/ashen-rampart/presentation/BoardEffectLayer.tsx` | `Effect[]` を SVG で描くだけのコンポーネント |
| `src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx` | 同上のテスト |
| `src/features/ashen-rampart/presentation/rejection-text.ts` | 拒否理由の日本語文言（純粋） |
| `src/features/ashen-rampart/presentation/rejection-text.test.ts` | 同上のテスト |
| `src/features/ashen-rampart/presentation/run-summary.ts` | 判定7項目の集計（純粋）。`RunTally` と `accumulateTick` |
| `src/features/ashen-rampart/presentation/run-summary.test.ts` | 同上のテスト |
| `src/features/ashen-rampart/presentation/RunSummary.tsx` | 集計の表示コンポーネント |
| `src/features/ashen-rampart/presentation/RunSummary.test.tsx` | 同上のテスト |

### 変更

| ファイル | 変更内容 |
|---|---|
| `domain/combat/combat-state.ts` | `DefeatSource` 型追加、`defeat` / `shot` イベントの拡張 |
| `domain/combat/step-tick.ts` | 撃破源の追跡、支援塔貢献の付与、`discard` アクション、クールダウン適用条件の変更 |
| `domain/board/stage-map.ts` | `buildSlots` を規則生成に変更（12→22） |
| `domain/cards/card-definition.ts` | `maxCopies?: number` 追加 |
| `domain/cards/card-pool.ts` | 魔力炉の `maxCopies`、`maxCopiesOf` 関数、プリセット再構成 |
| `domain/cards/deck-builder.ts` | `validateDeck` をカード別上限に |
| `domain/combat/balance.test.ts` | 較正の数値閾値を不変条件として追加 |
| `application/ports/play-log-port.ts` | `CURRENT_ITERATION = 2` |
| `presentation/useAshenRampartGame.ts` | エフェクト状態、集計の累積、`discard`、拒否通知 |
| `presentation/BoardGrid.tsx` | エフェクト層の合成、「城壁の外」の背景 |
| `presentation/BoardEffectLayer` 経由で `AshenRampartGame.tsx` | 拒否表示、リザルトの2段階化 |
| `presentation/HandArea.tsx` | 捨札ボタン |
| `presentation/RunStatusBar.tsx` | 漏れ時のライフ連動 |
| `presentation/DeckBuilder.tsx` | カード別上限の表示 |

---

### Task 1: 撃破源の帰属（`DefeatSource`）

**Files:**
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts:9`
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts:61-71`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`（`PendingBlast`, `applyReactivate`, `applyCardEffect`, `applyTraps`, `applyTowerShots`, `applySplashDamage`, `applyBlasts`, `resolveDamage`, `stepTick`）
- Test: `src/features/ashen-rampart/domain/combat/step-tick-defeat-source.test.ts`（新規）

**Interfaces:**
- Consumes: 既存の `CombatState` / `TickEvent` / `ActiveEnemy`
- Produces:
  - `export type DefeatSource = { kind: 'tower'; index: number } | { kind: 'trap'; index: number } | { kind: 'ember'; index: number }`
  - `TickEvent` の `defeat` が `{ kind: 'defeat'; enemyId: number; source: DefeatSource }` になる

- [ ] **Step 1: 反復番号を更新する**

`src/features/ashen-rampart/application/ports/play-log-port.ts` の9行目を書き換える。

```ts
export const CURRENT_ITERATION = 2;
```

**理由:** localStorage は同一キーに追記し続けクリアもされないため、更新を忘れると反復1 のログと混ざり判定が壊れる。実装の最初に行う（設計書 §12）。

- [ ] **Step 2: 失敗するテストを書く**

`src/features/ashen-rampart/domain/combat/step-tick-defeat-source.test.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 撃破源の帰属
 *
 * 塔・罠・燠火の3経路それぞれが単独で撃破を成立させることを検証する。
 * 1経路だけ緑で通る形を避けるため、経路ごとに独立したテストにする。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

/** 敵が出現しないウェーブ（盤面を手で組むため） */
const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const baseState = (): CombatState =>
  createCombatState(createDeck(['reactor'], () => 0), noWave);

/** 瀕死の敵を1体だけ盤面に置く */
const withDyingEnemy = (state: CombatState, progress: number): CombatState => ({
  ...state,
  enemies: [
    {
      id: 1,
      enemyId: 'grunt',
      hp: 1,
      maxHp: 20,
      progress,
      spawnTick: 0,
      spawnPathIndex: 0,
      alive: true,
      leaked: false,
      groundedUntilTick: 0,
      stunnedUntilTick: 0,
    },
  ],
});

describe('撃破源の帰属', () => {
  it('塔が倒したとき source は tower とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
      },
      1
    );
    const next = stepTick(state, [], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'tower', index: 0 } });
  });

  it('罠が倒したとき source は trap とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        traps: [{ cardId: 'spike-trap', pos: { x: 2, y: 3 }, usesLeft: 1, hitEnemyIds: [] }],
      },
      1.9
    );
    const next = stepTick(state, [], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'trap', index: 0 } });
  });

  it('燠火の再点火が倒したとき source は ember とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
      },
      1
    );
    const next = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'ember', index: 0 } });
  });
});
```

- [ ] **Step 3: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-defeat-source.test.ts`
Expected: 3件とも FAIL。`defeat` イベントに `source` が無いため `toEqual` が一致しない。

- [ ] **Step 4: `DefeatSource` 型を追加する**

`src/features/ashen-rampart/domain/combat/combat-state.ts` の `TickEvent` 定義（61行目付近）を書き換える。

```ts
/**
 * 撃破に至らせた主体
 *
 * 契約: **最後に削った者に帰属する**（オーバーキル分は問わない）。
 * 罠・射撃・業火は同じ tick 内で順に hpById を削るため、
 * 最後の書き込み者を記録する。
 */
export type DefeatSource =
  | { kind: 'tower'; index: number }
  | { kind: 'trap'; index: number }
  | { kind: 'ember'; index: number };

export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetId: number }
  | { kind: 'trap'; trapIndex: number; targetId: number }
  | { kind: 'ember'; emberIndex: number }
  | { kind: 'defeat'; enemyId: number; source: DefeatSource }
  | { kind: 'leak'; enemyId: number }
  | { kind: 'mana'; amount: number }
  | { kind: 'draw'; cardId: string }
  | { kind: 'overflow'; cardId: string }
  | { kind: 'played'; cardId: string; pos?: CellPos }
  | { kind: 'rejected'; reason: 'cooldown' | 'mana' | 'target' | 'occupied' | 'pending' };
```

- [ ] **Step 5: `PendingBlast` に燠火の index を持たせる**

`src/features/ashen-rampart/domain/combat/step-tick.ts` の `PendingBlast`（194行目付近）を書き換える。

```ts
interface PendingBlast {
  pos: CellPos;
  radius: number;
  damage: number;
  /** 発生源の燠火 index。撃破の帰属に使う */
  emberIndex: number;
}
```

`applyReactivate` の `blasts.push`（233行目付近）を書き換える。

```ts
  draft.blasts.push({
    pos: ember.pos,
    radius: spec.radius,
    damage: spec.damage,
    emberIndex: action.emberIndex,
  });
```

`applyCardEffect` の `ember` 分岐（251行目付近）を書き換える。

```ts
  } else if (card.type === 'ember' && pos && card.ember) {
    draft.embers.push({ pos, cooldownLeft: card.ember.cooldownTicks });
    draft.freshEmberIndices.add(draft.embers.length - 1);
    draft.blasts.push({
      pos,
      radius: card.ember.radius,
      damage: card.ember.damage,
      emberIndex: draft.embers.length - 1,
    });
  }
```

- [ ] **Step 6: ダメージ書き込みと同時に撃破源を記録する**

`step-tick.ts` に共有の下書き型を追加する（`PendingBlast` の直後に置く）。

```ts
/**
 * 敵ごとの「最後に削った者」
 *
 * hpById と対で更新する。hpById.set と sourceById.set は必ず同じ箇所で行う
 * （片方だけ更新すると帰属が前の tick の値のまま残る）。
 */
type SourceById = Map<number, DefeatSource>;
```

`combat-state.ts` からの import に `DefeatSource` を加える。

以下4箇所で `hpById.set` の直後に `sourceById.set` を追加する。各関数のシグネチャに `sourceById: SourceById` を追加する。

`applyTraps`（482行目付近）:

```ts
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
        sourceById.set(enemy.id, { kind: 'trap', index: trapIndex });
```

`applyTowerShots`（526行目付近）:

```ts
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    sourceById.set(target.id, { kind: 'tower', index: towerIndex });
```

`applySplashDamage`（583行目付近）:

```ts
      const damage = effectiveDamage(stateForDamage, towerIndex, map, other);
      hpById.set(other.id, (hpById.get(other.id) ?? 0) - damage);
      sourceById.set(other.id, { kind: 'tower', index: towerIndex });
```

`applyBlasts`（607行目付近）:

```ts
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - blast.damage);
        sourceById.set(enemy.id, { kind: 'ember', index: blast.emberIndex });
```

- [ ] **Step 7: `resolveDamage` で撃破源を読む**

`resolveDamage`（621行目付近）にパラメータを追加し、`defeat` の発行を書き換える。

```ts
const resolveDamage = (
  moved: readonly ActiveEnemy[],
  hpById: ReadonlyMap<number, number>,
  sourceById: ReadonlyMap<number, DefeatSource>,
  statusById: ReadonlyMap<number, EnemyStatusDraft>,
  events: TickEvent[]
): ActiveEnemy[] =>
  moved.map((enemy) => {
    if (!enemy.alive) return enemy;
    const status = statusById.get(enemy.id);
    const withStatus =
      status === undefined
        ? enemy
        : {
            ...enemy,
            groundedUntilTick: status.groundedUntilTick ?? enemy.groundedUntilTick,
            stunnedUntilTick: status.stunnedUntilTick ?? enemy.stunnedUntilTick,
          };
    const hp = hpById.get(enemy.id) ?? withStatus.hp;
    if (hp > 0) return { ...withStatus, hp };
    const source = sourceById.get(enemy.id);
    // 撃破源が無い hp<=0 は論理的に起こり得ない（誰かが削った結果でしか 0 にならない）。
    // 万一起きた場合に defeat を握り潰すと集計が静かに壊れるため、契約違反として落とす。
    if (!source) {
      throw new Error(`撃破源が記録されていません: enemyId=${enemy.id}`);
    }
    events.push({ kind: 'defeat', enemyId: enemy.id, source });
    return { ...withStatus, hp: 0, alive: false };
  });
```

- [ ] **Step 8: `stepTick` で `sourceById` を作り、各関数へ渡す**

`stepTick` 内（705行目付近）を書き換える。

```ts
  const hpById = new Map<number, number>();
  const sourceById: SourceById = new Map();
  moved.forEach((e) => hpById.set(e.id, e.hp));

  const traps = applyTraps(
    afterActions.traps, moved, hpById, sourceById, statusById, tick, map, events
  );
  const towers = applyTowerShots(
    state, afterActions.towers, moved, map, hpById, sourceById, events, tick
  );
  applyBlasts(afterActions.blasts, moved, map, hpById, sourceById, tick);
```

そして `resolveDamage` の呼び出し（713行目付近）:

```ts
  const damaged = resolveDamage(moved, hpById, sourceById, statusById, events);
```

`applySplashDamage` の呼び出し（529行目付近）にも `sourceById` を渡す。

- [ ] **Step 9: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-defeat-source.test.ts`
Expected: 3件 PASS

- [ ] **Step 10: 既存テストの回帰を確認する**

Run: `npx jest src/features/ashen-rampart`
Expected: 全 PASS。`defeat` イベントを `toEqual` で厳密比較していた既存テストがあれば、`source` を含む形に更新する。

- [ ] **Step 11: ミューテーション検証**

`applyTowerShots` の `sourceById.set` を一時的にコメントアウトし、Step 9 のテストが FAIL することを確認してから元に戻す。「そもそも記録されていない」ために緑になる形でないことを保証する。

- [ ] **Step 12: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/ src/features/ashen-rampart/application/ports/play-log-port.ts
git commit -m "feat(ashen-rampart): defeat イベントに撃破源を付与する

塔・罠・燠火のどれが倒したかを hpById と対の sourceById で追跡し、
resolveDamage が defeat に載せる。契約は「最後に削った者に帰属」。
あわせて CURRENT_ITERATION を 2 に更新した。"
```

---

### Task 2: 支援塔の貢献計測

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`（`shot` イベント）
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`（`effectiveDamage` の分解、`applyTowerShots`）
- Test: `src/features/ashen-rampart/domain/combat/step-tick-support.test.ts`（新規）

**Interfaces:**
- Consumes: `effectiveDamage` / `effectiveRange`（既存）
- Produces:
  - `export const damageBreakdown = (state, towerIndex, map, target) => { total: number; auraBonus: number }`
  - `TickEvent` の `shot` が `{ kind: 'shot'; towerIndex: number; targetId: number; auraDamageBonus: number; beyondBaseRange: boolean }` になる

**背景:** 篝火（`aura.towerDamageBonus: 0.25`）と鍛冶場（`aura.towerRangeBonus: 0.6`）は `range: 0` で攻撃しないため、撃破源になり得ない。**効果の種類が違うため測る単位も分ける**（設計書 §4.4.1）。

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/combat/step-tick-support.test.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 支援塔の貢献計測
 *
 * 篝火は与ダメージ増加分、鍛冶場は射程延長で成立した射撃回数で測る。
 * 効果の種類が違うため、同じテストで両方を通そうとすると
 * 片方がゼロのまま緑になる。必ず別のテストにする。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const baseState = (): CombatState =>
  createCombatState(createDeck(['reactor'], () => 0), noWave);

const withEnemyAt = (state: CombatState, progress: number): CombatState => ({
  ...state,
  enemies: [
    {
      id: 1,
      enemyId: 'brute',
      hp: 60,
      maxHp: 60,
      progress,
      spawnTick: 0,
      spawnPathIndex: 0,
      alive: true,
      leaked: false,
      groundedUntilTick: 0,
      stunnedUntilTick: 0,
    },
  ],
});

describe('支援塔の貢献計測', () => {
  it('篝火が隣接していないとき auraDamageBonus は 0 になる', () => {
    const state = withEnemyAt(
      { ...baseState(), towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }] },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ auraDamageBonus: 0 });
  });

  it('篝火が隣接するとき auraDamageBonus に増加分が入る', () => {
    // 弓兵 damage 6 / 篝火 +25% → 実効 round(6 * 1.25) = 8。増加分は 2
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'beacon', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ auraDamageBonus: 2 });
  });

  it('鍛冶場が無ければ届かない距離の射撃は beyondBaseRange が true になる', () => {
    // 弓兵の素の射程は 1.6。鍛冶場 +0.6 で 2.2 になる。
    // 塔 (1,2) から経路 (3,3) までの距離は hypot(2,1)=2.236 > 2.2 なので、
    // 距離 2.0 になる (3,3) 手前の位置を狙わせる（progress 2.6 → x=2.6, y=3）。
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'forge', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      2.6
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ beyondBaseRange: true });
  });

  it('素の射程で届く射撃は beyondBaseRange が false になる', () => {
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'forge', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ beyondBaseRange: false });
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-support.test.ts`
Expected: 4件とも FAIL。`shot` イベントに `auraDamageBonus` / `beyondBaseRange` が無い。

- [ ] **Step 3: `shot` イベントを拡張する**

`combat-state.ts` の `TickEvent` を書き換える。

```ts
  | {
      kind: 'shot';
      towerIndex: number;
      targetId: number;
      /** 隣接オーラ（篝火）によって増えたダメージ量。オーラが無ければ 0 */
      auraDamageBonus: number;
      /** 素の射程では届かず、オーラ（鍛冶場）で初めて届いた射撃か */
      beyondBaseRange: boolean;
    }
```

- [ ] **Step 4: ダメージを分解する関数を作る**

`step-tick.ts` の `effectiveDamage` を書き換え、内訳を返す関数を新設する。

```ts
/**
 * 塔の実効ダメージの内訳
 *
 * 篝火の貢献を測るため、オーラ抜きのダメージと実効ダメージを両方返す。
 * 丸めはそれぞれに適用する（合計してから丸めると差分がずれる）。
 */
export const damageBreakdown = (
  state: CombatState,
  towerIndex: number,
  map: StageMap,
  target: ActiveEnemy
): { total: number; auraBonus: number } => {
  const tower = state.towers[towerIndex];
  if (!tower) return { total: 0, auraBonus: 0 };
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return { total: 0, auraBonus: 0 };
  const auraBonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const damageBonus = otherSpec?.aura?.towerDamageBonus;
    if (damageBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
    return adjacent ? sum + damageBonus : sum;
  }, 0);
  const highGround = isHighGround(map, tower.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
  const threshold = spec.heavyBonusThreshold;
  const heavy =
    threshold !== undefined && target.maxHp >= threshold ? (spec.heavyBonusMultiplier ?? 1) : 1;
  const base = Math.round(spec.damage * heavy * highGround);
  const total = Math.round(spec.damage * heavy * highGround * (1 + auraBonus));
  return { total, auraBonus: total - base };
};

/**
 * 塔の実効ダメージ
 *
 * 倍率の二重適用を避けるため、damageBreakdown だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  towerIndex: number,
  map: StageMap,
  target: ActiveEnemy
): number => damageBreakdown(state, towerIndex, map, target).total;
```

- [ ] **Step 5: `applyTowerShots` でイベントに載せる**

`applyTowerShots` の射撃部分（523行目付近）を書き換える。

```ts
    const range = effectiveRange(stateForDamage, towerIndex, map);
    const target = selectTowerTarget(tower, spec, range, moved, map, hpById, tick);
    if (!target) return tower;
    const { total: damage, auraBonus } = damageBreakdown(stateForDamage, towerIndex, map, target);
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    sourceById.set(target.id, { kind: 'tower', index: towerIndex });
    const targetPos = positionOf(target.progress, map.path);
    const distance = Math.hypot(targetPos.x - tower.pos.x, targetPos.y - tower.pos.y);
    events.push({
      kind: 'shot',
      towerIndex,
      targetId: target.id,
      auraDamageBonus: auraBonus,
      // 素の射程を超えている＝鍛冶場のオーラで初めて届いた射撃
      beyondBaseRange: distance > spec.range,
    });
```

- [ ] **Step 6: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-support.test.ts`
Expected: 4件 PASS

- [ ] **Step 7: 既存テストの回帰を確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit`
Expected: 全 PASS。`shot` を `toEqual` で比較していた既存テストは `toMatchObject` へ、または新フィールドを含める形に更新する。

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/
git commit -m "feat(ashen-rampart): shot イベントに支援塔の貢献を載せる

篝火は与ダメージ増加分(auraDamageBonus)、鍛冶場は射程延長で成立した
射撃か(beyondBaseRange)で測る。range 0 の支援塔は撃破源になり得ないため、
撃破数とは別の単位で貢献を可視化する。"
```

---

### Task 3: エフェクトの寿命管理（純粋関数）

**Files:**
- Create: `src/features/ashen-rampart/presentation/combat-effects.ts`
- Test: `src/features/ashen-rampart/presentation/combat-effects.test.ts`

**Interfaces:**
- Consumes: `CombatState` / `TickEvent` / `DefeatSource` / `positionOf` / `StageMap`
- Produces:
  - `export type Effect`（下記の判別共用体）
  - `export const advanceEffects = (prev: readonly Effect[], state: CombatState, map: StageMap): Effect[]`
  - `export const MAX_CONCURRENT_EFFECTS: number`
  - `export const EFFECT_LIFETIME: Readonly<Record<Effect['kind'], number>>`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/combat-effects.test.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - エフェクトの寿命管理
 *
 * state.events は毎 tick 置き換わり、撃破された敵は次の tick に enemies から
 * 消える。受け取った tick のうちに座標へ解決してスナップショットしないと
 * 二度と描けない。この関数はその変換と寿命管理だけを担う。
 */
import { PLAINS_MAP } from '../domain/board/stage-map';
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import {
  advanceEffects,
  EFFECT_LIFETIME,
  MAX_CONCURRENT_EFFECTS,
  type Effect,
} from './combat-effects';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const stateWith = (tick: number, events: CombatState['events'], extra: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  tick,
  events,
  ...extra,
});

const enemyAt = (id: number, progress: number) => ({
  id,
  enemyId: 'grunt',
  hp: 10,
  maxHp: 20,
  progress,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
});

describe('advanceEffects', () => {
  it('shot イベントを塔から敵への線に変換する', () => {
    const state = stateWith(
      10,
      [{ kind: 'shot', towerIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false }],
      {
        towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 1)],
      }
    );
    const effects = advanceEffects([], state, PLAINS_MAP);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      kind: 'shot',
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 },
      untilTick: 10 + EFFECT_LIFETIME.shot,
    });
  });

  it('寿命が切れた tick でエフェクトが消える', () => {
    const born = stateWith(
      10,
      [{ kind: 'shot', towerIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false }],
      {
        towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 1)],
      }
    );
    const effects = advanceEffects([], born, PLAINS_MAP);

    // 寿命の最後の tick では残る
    const alive = advanceEffects(effects, stateWith(10 + EFFECT_LIFETIME.shot - 1, []), PLAINS_MAP);
    expect(alive).toHaveLength(1);

    // 寿命の tick に達したら消える
    const gone = advanceEffects(effects, stateWith(10 + EFFECT_LIFETIME.shot, []), PLAINS_MAP);
    expect(gone).toHaveLength(0);
  });

  it('defeat を撃破源から撃破位置への線に変換する', () => {
    const state = stateWith(
      5,
      [{ kind: 'defeat', enemyId: 1, source: { kind: 'tower', index: 0 } }],
      {
        towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 2)],
      }
    );
    const effects = advanceEffects([], state, PLAINS_MAP);
    expect(effects[0]).toMatchObject({
      kind: 'defeat',
      from: { x: 1, y: 2 },
      to: { x: 2, y: 3 },
    });
  });

  it('上限を超えたら優先度の低いものから落とす（leak は残る）', () => {
    const shots: Effect[] = Array.from({ length: MAX_CONCURRENT_EFFECTS }, (_, i) => ({
      kind: 'shot',
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 },
      untilTick: 100,
      id: `shot-${i}`,
      wide: false,
      dashed: false,
    }));
    const state = stateWith(1, [{ kind: 'leak', enemyId: 9 }], {
      enemies: [enemyAt(9, 10)],
    });
    const effects = advanceEffects(shots, state, PLAINS_MAP);
    expect(effects).toHaveLength(MAX_CONCURRENT_EFFECTS);
    expect(effects.some((e) => e.kind === 'leak')).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/combat-effects.test.ts`
Expected: FAIL。`combat-effects` モジュールが存在しない。

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/combat-effects.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - エフェクトの寿命管理（純粋）
 *
 * state.events は毎 tick 丸ごと置き換わり、shot は towerIndex、defeat は
 * enemyId という参照しか持たない。撃破された敵は次の tick に enemies から
 * 消えるため、**受け取ったその tick のうちに座標へ解決してスナップショット
 * しないと二度と描けない**。この関数だけがその責務を持つ。
 *
 * 座標はセル座標系のまま保持する（SVG の viewBox をセル座標に一致させるため）。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { fortressCell } from '../domain/board/stage-map';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';
import { positionOf } from '../domain/combat/step-tick';
import { getCardDefinition } from '../domain/cards/card-pool';

/**
 * 同時に描くエフェクトの上限
 *
 * 塔6基 × クールダウン8 tick では常時1〜3本の線が明滅し、群れ22体と
 * 重なる局面がある。反証条件「情報量そのものが過大」に当たったときは
 * まずこの値を下げる（設計書 §8.4）。
 */
export const MAX_CONCURRENT_EFFECTS = 12;

/** 各エフェクトの寿命（tick）。1 tick = 100ms */
export const EFFECT_LIFETIME = {
  shot: 3,
  trap: 3,
  ember: 5,
  defeat: 8,
  leak: 8,
} as const;

/**
 * 破棄の優先度（大きいほど残す）
 *
 * 寿命は shot 3 tick に対し leak 8 tick で、leak は常に「古い」側になる。
 * 古い順に落とすと最も重要な情報が最初に捨てられるため、優先度順にする。
 */
const EFFECT_PRIORITY = {
  leak: 4,
  defeat: 3,
  trap: 2,
  ember: 2,
  shot: 1,
} as const;

export type Effect =
  | {
      kind: 'shot';
      id: string;
      from: CellPos;
      to: CellPos;
      untilTick: number;
      /** 範囲攻撃の塔は太線で描く */
      wide: boolean;
      /** 貫通の塔は破線で描く */
      dashed: boolean;
    }
  | { kind: 'defeat'; id: string; from: CellPos; to: CellPos; untilTick: number }
  | { kind: 'trap'; id: string; at: CellPos; untilTick: number }
  | { kind: 'ember'; id: string; at: CellPos; radius: number; untilTick: number }
  | { kind: 'leak'; id: string; at: CellPos; untilTick: number };

/** 敵の現在位置。既に消えた敵は undefined */
const enemyPos = (state: CombatState, enemyId: number, map: StageMap): CellPos | undefined => {
  const enemy = state.enemies.find((e) => e.id === enemyId);
  if (!enemy) return undefined;
  return positionOf(enemy.progress, map.path);
};

/** 撃破源の座標。既に消えた設置物は undefined */
const sourcePos = (state: CombatState, source: Extract<TickEvent, { kind: 'defeat' }>['source']): CellPos | undefined => {
  if (source.kind === 'tower') return state.towers[source.index]?.pos;
  if (source.kind === 'trap') return state.traps[source.index]?.pos;
  return state.embers[source.index]?.pos;
};

/** 1件の TickEvent をエフェクトへ変換する。描かないイベントは undefined */
const toEffect = (
  event: TickEvent,
  state: CombatState,
  map: StageMap,
  index: number
): Effect | undefined => {
  const tick = state.tick;
  const id = `${tick}-${index}`;
  if (event.kind === 'shot') {
    const from = state.towers[event.towerIndex]?.pos;
    const to = enemyPos(state, event.targetId, map);
    if (!from || !to) return undefined;
    const spec = getCardDefinition(state.towers[event.towerIndex]?.cardId ?? '').tower;
    return {
      kind: 'shot',
      id,
      from,
      to,
      untilTick: tick + EFFECT_LIFETIME.shot,
      wide: (spec?.splashRadius ?? 0) > 0,
      dashed: spec?.heavyBonusThreshold !== undefined,
    };
  }
  if (event.kind === 'defeat') {
    const from = sourcePos(state, event.source);
    const to = enemyPos(state, event.enemyId, map);
    if (!from || !to) return undefined;
    return { kind: 'defeat', id, from, to, untilTick: tick + EFFECT_LIFETIME.defeat };
  }
  if (event.kind === 'trap') {
    const at = state.traps[event.trapIndex]?.pos;
    if (!at) return undefined;
    return { kind: 'trap', id, at, untilTick: tick + EFFECT_LIFETIME.trap };
  }
  if (event.kind === 'ember') {
    const at = state.embers[event.emberIndex]?.pos;
    if (!at) return undefined;
    const radius = getCardDefinition('ember-blast').ember?.radius ?? 1;
    return { kind: 'ember', id, at, radius, untilTick: tick + EFFECT_LIFETIME.ember };
  }
  if (event.kind === 'leak') {
    const at = fortressCell(map);
    if (!at) return undefined;
    return { kind: 'leak', id, at, untilTick: tick + EFFECT_LIFETIME.leak };
  }
  return undefined;
};

/**
 * 前 tick までのエフェクトを進め、この tick のイベントを足す
 *
 * 上限を超えた場合は**優先度の低いものから**落とす。同一優先度の中でのみ
 * 古い順（untilTick が小さい順）に落とす。
 */
export const advanceEffects = (
  prev: readonly Effect[],
  state: CombatState,
  map: StageMap
): Effect[] => {
  const alive = prev.filter((e) => e.untilTick > state.tick);
  const born = state.events
    .map((event, index) => toEffect(event, state, map, index))
    .filter((e): e is Effect => e !== undefined);
  const all = [...alive, ...born];
  if (all.length <= MAX_CONCURRENT_EFFECTS) return all;
  return [...all]
    .sort((a, b) => {
      const priority = EFFECT_PRIORITY[b.kind] - EFFECT_PRIORITY[a.kind];
      return priority !== 0 ? priority : b.untilTick - a.untilTick;
    })
    .slice(0, MAX_CONCURRENT_EFFECTS);
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/combat-effects.test.ts`
Expected: 4件 PASS

- [ ] **Step 5: ミューテーション検証（寿命）**

`EFFECT_LIFETIME.shot` を `3` から `4` に変えて Step 4 を実行し、「寿命が切れた tick でエフェクトが消える」が FAIL することを確認してから戻す。**「そもそも生成されていない」ために緑になる形でないことを保証する**（設計書 §9）。

- [ ] **Step 6: ミューテーション検証（優先度）**

`advanceEffects` の sort を優先度なし（`b.untilTick - a.untilTick` のみ）に変えて Step 4 を実行し、「上限を超えたら優先度の低いものから落とす」が FAIL することを確認してから戻す。

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/presentation/combat-effects.ts src/features/ashen-rampart/presentation/combat-effects.test.ts
git commit -m "feat(ashen-rampart): TickEvent を寿命付きエフェクトへ変換する純粋関数を追加

events は毎 tick 置き換わり参照しか持たないため、受け取った tick のうちに
座標へ解決する。上限超過時は優先度順(leak > defeat > trap/ember > shot)に
破棄する。古い順だと最長寿命の leak が最初に消えるため。"
```

---

### Task 4: SVG エフェクト層の描画

**Files:**
- Create: `src/features/ashen-rampart/presentation/BoardEffectLayer.tsx`
- Test: `src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`

**Interfaces:**
- Consumes: `Effect`（Task 3）
- Produces: `export const BoardEffectLayer: React.FC<{ effects: readonly Effect[]; map: StageMap }>`
- Produces: `useAshenRampartGame` の戻り値に `effects: readonly Effect[]` が加わる

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - エフェクト層の描画
 *
 * 「情報が存在する」テストと「レンダリングされる」テストは別物である。
 * S1 では aria-label と descriptor 値だけを見ていたため、滞留セルで
 * 矢印が消えるバグを既存テスト7件が1件も検出できなかった。
 * ここでは要素の数を直接数える。
 */
import React from 'react';
import { render } from '@testing-library/react';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { BoardEffectLayer } from './BoardEffectLayer';
import type { Effect } from './combat-effects';

const shot = (id: string): Effect => ({
  kind: 'shot',
  id,
  from: { x: 1, y: 2 },
  to: { x: 1, y: 3 },
  untilTick: 10,
  wide: false,
  dashed: false,
});

describe('BoardEffectLayer', () => {
  it('shot の数だけ line 要素を描く', () => {
    const { container } = render(
      <BoardEffectLayer effects={[shot('a'), shot('b')]} map={PLAINS_MAP} />
    );
    expect(container.querySelectorAll('line')).toHaveLength(2);
  });

  it('defeat は線と終端マークの両方を描く', () => {
    const effects: Effect[] = [
      { kind: 'defeat', id: 'd', from: { x: 1, y: 2 }, to: { x: 2, y: 3 }, untilTick: 10 },
    ];
    const { container } = render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
    expect(container.querySelectorAll('line').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-effect="defeat-mark"]')).not.toBeNull();
  });

  it('viewBox が盤面のセル座標系に一致する', () => {
    const { container } = render(<BoardEffectLayer effects={[]} map={PLAINS_MAP} />);
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 9 7');
  });

  it('エフェクトが無いときも SVG 自体は存在する', () => {
    const { container } = render(<BoardEffectLayer effects={[]} map={PLAINS_MAP} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx`
Expected: FAIL。モジュールが存在しない。

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/BoardEffectLayer.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - エフェクト層
 *
 * viewBox をセル座標系（0 0 width height）に一致させることで、
 * セル座標をそのまま x1/y1/x2/y2 に書ける（px 換算が不要）。
 * Frame は aspect-ratio 固定のため歪みは出ない。
 *
 * 色は既存5色のみを使う。味方の攻撃は secondary、脅威は danger。
 * opportunity は BoardGrid が「再点火可能」の意味で使っているため使わない。
 */
import React from 'react';
import styled from 'styled-components';
import type { StageMap } from '../domain/board/stage-map';
import type { Effect } from './combat-effects';
import { COLORS } from './theme';

/** セルの中心へ寄せる補正（セル座標は左上基準のため） */
const CENTER = 0.5;

const Svg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 盤面セルのクリックを吸わない。z 順序は セル(0) < エフェクト(1) < 敵マーカー(2) */
  pointer-events: none;
  z-index: 1;

  /* stroke-width を viewBox のスケールから独立させる。
     viewBox 座標系では stroke-width: 1 がセル1個分の太さになるため */
  line,
  circle,
  rect {
    vector-effect: non-scaling-stroke;
  }
`;

interface Props {
  effects: readonly Effect[];
  map: StageMap;
}

export const BoardEffectLayer: React.FC<Props> = ({ effects, map }) => (
  <Svg
    viewBox={`0 0 ${map.width} ${map.height}`}
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    {effects.map((effect) => {
      if (effect.kind === 'shot') {
        return (
          <line
            key={effect.id}
            data-effect="shot"
            x1={effect.from.x + CENTER}
            y1={effect.from.y + CENTER}
            x2={effect.to.x + CENTER}
            y2={effect.to.y + CENTER}
            stroke={COLORS.secondary}
            strokeWidth={effect.wide ? 3 : 1}
            strokeDasharray={effect.dashed ? '4 3' : undefined}
            opacity={0.8}
          />
        );
      }
      if (effect.kind === 'defeat') {
        return (
          <g key={effect.id}>
            <line
              data-effect="defeat"
              x1={effect.from.x + CENTER}
              y1={effect.from.y + CENTER}
              x2={effect.to.x + CENTER}
              y2={effect.to.y + CENTER}
              stroke={COLORS.secondary}
              strokeWidth={4}
            />
            {/* 終端の ✕。色だけでなく形でも撃破と分かるようにする */}
            <g data-effect="defeat-mark" stroke={COLORS.secondary} strokeWidth={3}>
              <line
                x1={effect.to.x + 0.25}
                y1={effect.to.y + 0.25}
                x2={effect.to.x + 0.75}
                y2={effect.to.y + 0.75}
              />
              <line
                x1={effect.to.x + 0.75}
                y1={effect.to.y + 0.25}
                x2={effect.to.x + 0.25}
                y2={effect.to.y + 0.75}
              />
            </g>
          </g>
        );
      }
      if (effect.kind === 'trap') {
        return (
          <rect
            key={effect.id}
            data-effect="trap"
            x={effect.at.x + 0.05}
            y={effect.at.y + 0.05}
            width={0.9}
            height={0.9}
            fill="none"
            stroke={COLORS.danger}
            strokeWidth={3}
          />
        );
      }
      if (effect.kind === 'ember') {
        return (
          <circle
            key={effect.id}
            data-effect="ember"
            cx={effect.at.x + CENTER}
            cy={effect.at.y + CENTER}
            r={effect.radius}
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth={2}
            opacity={0.7}
          />
        );
      }
      return (
        <rect
          key={effect.id}
          data-effect="leak"
          x={effect.at.x}
          y={effect.at.y}
          width={1}
          height={1}
          fill={COLORS.danger}
          opacity={0.65}
        />
      );
    })}
  </Svg>
);
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx`
Expected: 4件 PASS

- [ ] **Step 5: フックにエフェクト状態を持たせる**

`useAshenRampartGame.ts` に以下を追加する。

import 文に追加:

```ts
import { advanceEffects, type Effect } from './combat-effects';
```

state 宣言の後（48行目付近）に追加:

```ts
  const [effects, setEffects] = useState<readonly Effect[]>([]);
```

`// tick イベントをログと通知へ流す` の useEffect の**直前**に追加する。

```ts
  // tick イベントを寿命付きエフェクトへ変換する。
  // events は毎 tick 置き換わるため、この tick のうちに座標へ解決する
  useEffect(() => {
    setEffects((current) => advanceEffects(current, state, PLAINS_MAP));
  }, [state]);
```

`restart` の中（`setOverflowNotice(undefined);` の隣）に追加:

```ts
      setEffects([]);
```

戻り値のオブジェクトに `effects,` を追加する。

- [ ] **Step 6: `BoardGrid` にエフェクト層を合成する**

`BoardGrid.tsx` の Props に `effects` を追加し、`Frame` の中で敵マーカーの**前**に置く。

```tsx
interface Props {
  map: StageMap;
  state: CombatState;
  /** 配置可能なマス（カード選択中のみ非空） */
  placeableCells: readonly CellPos[];
  effects: readonly Effect[];
  onCellClick: (pos: CellPos) => void;
}
```

`Frame` 内の `stacks.map` の**直前**に挿入する。

```tsx
      <BoardEffectLayer effects={effects} map={map} />
      {stacks.map((stack) => (
```

`EnemyMarker` の `Wrapper` に `z-index: 2;` を追加し、z 順序を セル(0) < エフェクト(1) < 敵マーカー(2) に固定する。

`AshenRampartGame.tsx` の `<BoardGrid ... />` に `effects={game.effects}` を渡す。

- [ ] **Step 7: 統合テストを追加する**

`src/features/ashen-rampart/presentation/BoardGrid.test.tsx` に追加する。

```tsx
  it('エフェクトが盤面に描画される', () => {
    const effects = [
      {
        kind: 'shot' as const,
        id: 'a',
        from: { x: 1, y: 2 },
        to: { x: 1, y: 3 },
        untilTick: 10,
        wide: false,
        dashed: false,
      },
    ];
    const { container } = render(
      <BoardGrid
        map={PLAINS_MAP}
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        placeableCells={[]}
        effects={effects}
        onCellClick={() => undefined}
      />
    );
    expect(container.querySelectorAll('[data-effect="shot"]')).toHaveLength(1);
  });
```

既存の `BoardGrid` テストの呼び出しにも `effects={[]}` を追加する。

- [ ] **Step 8: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation && npx tsc --noEmit`
Expected: 全 PASS

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/
git commit -m "feat(ashen-rampart): エフェクト層を SVG で盤面に描画する

viewBox をセル座標系に一致させ px 換算を排除。z 順序は
セル < エフェクト < 敵マーカーで固定し、HPバーを覆わない。
色は既存5色のみ、帰属は線と ✕ の形で示す。"
```

---

### Task 5: reduced-motion と支援技術への対応

**Files:**
- Modify: `src/features/ashen-rampart/presentation/combat-effects.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardEffectLayer.tsx`
- Create: `src/features/ashen-rampart/presentation/BattleAnnouncer.tsx`
- Test: `src/features/ashen-rampart/presentation/BattleAnnouncer.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/combat-effects.test.ts`

**Interfaces:**
- Consumes: `Effect` / `CombatState`
- Produces:
  - `export const REDUCED_MOTION_LIFETIME: number`
  - `export interface AdvanceOptions { reducedMotion?: boolean }`
  - `advanceEffects` の第4引数に `options: AdvanceOptions = {}` が加わる
  - `export const BattleAnnouncer: React.FC<{ message?: string }>`
  - `useAshenRampartGame` の戻り値に `announcement?: string`

**背景:** `GlobalStyle.ts:98` の `prefers-reduced-motion` 対応はページフェードインのみで、ゲーム内エフェクトはカバーされていない。

- [ ] **Step 1: 失敗するテストを書く（reduced-motion）**

`combat-effects.test.ts` に追加する。

**注意:** 寿命の統一と上限の半減は**エフェクトを生成する時点**で行う必要がある。生成後に `untilTick` を書き換える関数にすると、毎 tick 呼ばれて寿命が延び続けエフェクトが二度と消えない。`advanceEffects` にオプションを足す形にする。

```ts
describe('advanceEffects（reduced-motion）', () => {
  const shotEvent = {
    kind: 'shot' as const,
    towerIndex: 0,
    targetId: 1,
    auraDamageBonus: 0,
    beyondBaseRange: false,
  };

  const stateWithTower = (tick: number, events: CombatState['events']) =>
    stateWith(tick, events, {
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
      enemies: [enemyAt(1, 1)],
    });

  it('寿命が一律になる', () => {
    const state = stateWithTower(10, [shotEvent]);
    const normal = advanceEffects([], state, PLAINS_MAP);
    const reduced = advanceEffects([], state, PLAINS_MAP, { reducedMotion: true });

    expect(normal[0]?.untilTick).toBe(10 + EFFECT_LIFETIME.shot);
    expect(reduced[0]?.untilTick).toBe(10 + REDUCED_MOTION_LIFETIME);
  });

  it('同時表示の上限が半分になる', () => {
    const existing: Effect[] = Array.from({ length: MAX_CONCURRENT_EFFECTS }, (_, i) => ({
      kind: 'shot',
      id: `s${i}`,
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 },
      untilTick: 999,
      wide: false,
      dashed: false,
    }));
    const reduced = advanceEffects(existing, stateWith(1, []), PLAINS_MAP, {
      reducedMotion: true,
    });
    expect(reduced).toHaveLength(Math.floor(MAX_CONCURRENT_EFFECTS / 2));
  });

  it('reduced-motion でもエフェクトは消えない（0件にならない）', () => {
    const reduced = advanceEffects([], stateWithTower(10, [shotEvent]), PLAINS_MAP, {
      reducedMotion: true,
    });
    // 消すと reduced-motion のユーザーだけ判定項目1 が達成不能になる
    expect(reduced.length).toBeGreaterThan(0);
  });
});
```

`import` に `REDUCED_MOTION_LIFETIME` を追加する。

- [ ] **Step 2: 失敗するテストを書く（aria-live）**

`src/features/ashen-rampart/presentation/BattleAnnouncer.test.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - 戦況の読み上げ
 *
 * 流す基準は「頻度が低く、かつ取り返しがつかない」出来事のみ。
 * 撃破は総敵数52体・群れ22体が短時間で溶けるため流さない
 * （射撃と同じく読み上げが詰まり、かえって情報が失われる）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BattleAnnouncer } from './BattleAnnouncer';

describe('BattleAnnouncer', () => {
  it('aria-live 領域としてメッセージを出す', () => {
    render(<BattleAnnouncer message="1体が砦に到達" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('1体が砦に到達');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('メッセージが無いときは空のまま領域を保持する', () => {
    render(<BattleAnnouncer />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
```

- [ ] **Step 3: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/combat-effects.test.ts src/features/ashen-rampart/presentation/BattleAnnouncer.test.tsx`
Expected: 両方 FAIL

- [ ] **Step 4: `advanceEffects` に reduced-motion オプションを足す**

`combat-effects.ts` を書き換える。定数を追加する。

```ts
/**
 * reduced-motion 時の一律の寿命（tick）
 *
 * 寿命 3/5/8 tick のものが同時に静止すると、動きで区別していた手がかりが
 * 消え、罠の縁と漏れの塗り（どちらも danger）が位置以外で弁別できなくなる。
 * 最長に揃えて数を減らし、1つずつ確実に見せる方向へ倒す。
 */
export const REDUCED_MOTION_LIFETIME = EFFECT_LIFETIME.defeat;

export interface AdvanceOptions {
  /** prefers-reduced-motion: reduce のとき true */
  reducedMotion?: boolean;
}
```

`toEffect` に `lifetimeOf` を通す。各 `untilTick` の算出を書き換える。

```ts
/** そのイベントに与える寿命。reduced-motion では一律にする */
const lifetimeOf = (kind: Effect['kind'], reducedMotion: boolean): number =>
  reducedMotion ? REDUCED_MOTION_LIFETIME : EFFECT_LIFETIME[kind];
```

`toEffect` のシグネチャに `reducedMotion: boolean` を加え、各分岐の `untilTick` を
`tick + lifetimeOf('shot', reducedMotion)` のように書き換える。

`advanceEffects` を書き換える。

```ts
/**
 * 前 tick までのエフェクトを進め、この tick のイベントを足す
 *
 * 上限を超えた場合は**優先度の低いものから**落とす。同一優先度の中でのみ
 * 古い順（untilTick が小さい順）に落とす。
 *
 * **寿命の統一と上限の半減は生成時に行う。** 生成後に untilTick を書き換える
 * 関数にすると、毎 tick 呼ばれて寿命が延び続けエフェクトが二度と消えない。
 */
export const advanceEffects = (
  prev: readonly Effect[],
  state: CombatState,
  map: StageMap,
  options: AdvanceOptions = {}
): Effect[] => {
  const reducedMotion = options.reducedMotion ?? false;
  const limit = reducedMotion
    ? Math.floor(MAX_CONCURRENT_EFFECTS / 2)
    : MAX_CONCURRENT_EFFECTS;
  const alive = prev.filter((e) => e.untilTick > state.tick);
  const born = state.events
    .map((event, index) => toEffect(event, state, map, index, reducedMotion))
    .filter((e): e is Effect => e !== undefined);
  const all = [...alive, ...born];
  if (all.length <= limit) return all;
  return [...all]
    .sort((a, b) => {
      const priority = EFFECT_PRIORITY[b.kind] - EFFECT_PRIORITY[a.kind];
      return priority !== 0 ? priority : b.untilTick - a.untilTick;
    })
    .slice(0, limit);
};
```

- [ ] **Step 5: `BattleAnnouncer` を実装する**

`src/features/ashen-rampart/presentation/BattleAnnouncer.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - 戦況の読み上げ
 *
 * **流す基準は要素名ではなく性質で決める**: 「頻度が低く、かつ
 * 取り返しがつかない」出来事のみ。具体的には漏れとウェーブ境界。
 * 撃破・射撃は頻度が高く、読み上げが詰まってかえって情報が失われる。
 */
import React from 'react';
import styled from 'styled-components';

/** 視覚的には隠すが支援技術からは読める */
const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

interface Props {
  message?: string;
}

export const BattleAnnouncer: React.FC<Props> = ({ message }) => (
  <VisuallyHidden role="status" aria-live="polite">
    {message ?? ''}
  </VisuallyHidden>
);
```

- [ ] **Step 6: フックで reduced-motion とアナウンスを配線する**

`useAshenRampartGame.ts` に追加する。

```ts
/** 読み上げを保持する tick 数 */
const ANNOUNCE_TICKS = 20;
```

state 宣言に追加:

```ts
  const [announcement, setAnnouncement] = useState<string | undefined>(undefined);
  const announceUntilRef = useRef(0);
```

エフェクト変換の useEffect の後に追加:

```ts
  // 支援技術への通知。頻度が低く取り返しがつかない出来事だけを流す
  useEffect(() => {
    const leaks = state.events.filter((e) => e.kind === 'leak').length;
    if (leaks > 0) {
      setAnnouncement(`${leaks}体が砦に到達。残りライフ ${state.life}`);
      announceUntilRef.current = state.tick + ANNOUNCE_TICKS;
      return;
    }
    if (state.tick >= announceUntilRef.current) setAnnouncement(undefined);
  }, [state.events, state.tick, state.life]);
```

`effects` を返す箇所を書き換え、reduced-motion を反映する。

```ts
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

```

エフェクト変換の useEffect を書き換え、生成時にオプションを渡す。

```ts
  useEffect(() => {
    setEffects((current) =>
      advanceEffects(current, state, PLAINS_MAP, { reducedMotion: prefersReducedMotion })
    );
  }, [state, prefersReducedMotion]);
```

**注意:** `prefersReducedMotion` はレンダーごとに `matchMedia` を読むため、
`useState` の初期化関数で1度だけ解決して定数として保持する。

```ts
  const [prefersReducedMotion] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
```

戻り値に `announcement,` を追加する。`effects` はそのまま返す。

`AshenRampartGame.tsx` の `<Center>` 直下に `<BattleAnnouncer message={game.announcement} />` を置く。

- [ ] **Step 7: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation && npx tsc --noEmit`
Expected: 全 PASS

`window.matchMedia` は jsdom に存在しないため、`src/setupTests.ts` に定義が無ければ以下を追加する（既にある場合は不要）。

```ts
// jsdom は matchMedia を実装していない。prefers-reduced-motion を読むコードのため定義する
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/presentation/ src/setupTests.ts
git commit -m "feat(ashen-rampart): reduced-motion と支援技術に対応する

reduced-motion では寿命を揃えて同時表示を半減させる(消さない)。
aria-live に流すのは漏れのみ。撃破は頻度が高く読み上げが詰まるため
除外する。基準を要素名ではなく性質で記述した。"
```

---

### Task 6: 配置クールダウンを「盤面に置く札」だけに課す

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts:265-300`（`applyPlayCard`）
- Test: `src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts`（追記）

**Interfaces:**
- Consumes: `placementKindOf`（既存）
- Produces: 振る舞いの変更のみ。シグネチャ変更なし

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts` の末尾に追加する。

```ts
describe('配置クールダウンの適用範囲', () => {
  it('クールダウン中でも徴発は使える', () => {
    const state: CombatState = {
      ...createCombatState(createDeck(['levy', 'reactor', 'reactor', 'reactor'], () => 0), noWave),
      placeCooldown: 30,
      mana: 5,
    };
    const levyIndex = state.deck.hand.indexOf('levy');
    expect(levyIndex).toBeGreaterThanOrEqual(0);

    const next = stepTick(state, [{ kind: 'play-card', handIndex: levyIndex }], PLAINS_MAP);

    expect(next.events.some((e) => e.kind === 'rejected')).toBe(false);
    expect(next.levyOptions.length).toBeGreaterThan(0);
  });

  it('徴発を使ってもクールダウンは消費されない', () => {
    const state: CombatState = {
      ...createCombatState(createDeck(['levy', 'reactor', 'reactor', 'reactor'], () => 0), noWave),
      placeCooldown: 0,
      mana: 5,
    };
    const levyIndex = state.deck.hand.indexOf('levy');
    const next = stepTick(state, [{ kind: 'play-card', handIndex: levyIndex }], PLAINS_MAP);
    expect(next.placeCooldown).toBe(0);
  });

  it('盤面に置く札はクールダウン中に拒否される', () => {
    const state: CombatState = {
      ...createCombatState(createDeck(['arrow-tower', 'reactor', 'reactor', 'reactor'], () => 0), noWave),
      placeCooldown: 30,
      mana: 5,
    };
    const towerIndex = state.deck.hand.indexOf('arrow-tower');
    const next = stepTick(
      state,
      [{ kind: 'play-card', handIndex: towerIndex, pos: { x: 1, y: 2 } }],
      PLAINS_MAP
    );
    expect(next.events).toContainEqual({ kind: 'rejected', reason: 'cooldown' });
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts`
Expected: 最初の2件が FAIL（クールダウン中に徴発が拒否される / クールダウンが消費される）。3件目は現状でも PASS。

- [ ] **Step 3: `applyPlayCard` の検査順序を変える**

`step-tick.ts` の `applyPlayCard`（265行目付近）を書き換える。

```ts
/**
 * カード使用操作を適用する（手札・カード種別・マナ・設置可否を順に検査）
 *
 * **配置クールダウンは「盤面に何かを置く札」だけに課す。**
 * 徴発・時泥のような即時札は盤面を占有しないため、配置の間合いに縛る理由がない。
 * 反復1 で徴発が機能しなかったのは、カードを特定する前にクールダウンを
 * 見ていたためであり、バグというより層の取り違えだった。
 */
const applyPlayCard = (
  draft: ActionsDraft,
  state: CombatState,
  map: StageMap,
  tick: number,
  action: Extract<PlayerAction, { kind: 'play-card' }>
): void => {
  const cardId = draft.deck.hand[action.handIndex];
  if (cardId === undefined) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  const card = getCardDefinition(cardId);
  const needsPlacement = placementKindOf(card) !== 'none';
  if (needsPlacement && draft.placeCooldown > 0) {
    draft.events.push({ kind: 'rejected', reason: 'cooldown' });
    return;
  }
  if (card.type === 'levy' && draft.levyOptions.length > 0) {
    draft.events.push({ kind: 'rejected', reason: 'pending' });
    return;
  }
  if (card.cost > draft.mana) {
    draft.events.push({ kind: 'rejected', reason: 'mana' });
    return;
  }
  if (needsPlacement && (!action.pos || !canPlaceAt(state, card, action.pos, map))) {
    draft.events.push({ kind: 'rejected', reason: 'target' });
    return;
  }
  // ここから確定
  draft.mana -= card.cost;
  draft.deck = discardFromHand(draft.deck, action.handIndex);
  if (needsPlacement) draft.placeCooldown = PLACE_COOLDOWN_TICKS;
  draft.events.push({ kind: 'played', cardId, pos: action.pos });
  applyCardEffect(draft, card, cardId, action.pos, tick);
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts`
Expected: 全 PASS

- [ ] **Step 5: 回帰を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat`
Expected: 全 PASS。バランス関連が落ちる場合は Task 13 で較正するため、**落ちたテスト名をメモして次へ進まず、ここで原因を確認する**（時泥が連打できるようになった影響が出た場合は仕様どおり）。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/
git commit -m "fix(ashen-rampart): 配置クールダウンを盤面に置く札だけに課す

カードを特定する前にクールダウンを検査していたため、盤面を占有しない
徴発・時泥まで配置の間合いに縛られていた。反復1 で徴発が機能しなかった
原因はこれ。"
```

---

### Task 7: 拒否理由の表示

**Files:**
- Create: `src/features/ashen-rampart/presentation/rejection-text.ts`
- Test: `src/features/ashen-rampart/presentation/rejection-text.test.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`

**Interfaces:**
- Consumes: `TickEvent` の `rejected`
- Produces: `export const rejectionText = (reason: RejectionReason, state: CombatState) => string`
- Produces: `useAshenRampartGame` の戻り値に `rejectionNotice?: string`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/rejection-text.test.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 拒否理由の文言
 *
 * cooldown のみ残り秒数を含める。「あと何秒か分からない」ことが
 * 不満の本体であるため（設計書 §5.2）。
 */
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import { rejectionText } from './rejection-text';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const base = (over: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  ...over,
});

describe('rejectionText', () => {
  it('cooldown は残り秒数を含む', () => {
    expect(rejectionText('cooldown', base({ placeCooldown: 25 }))).toBe(
      '次の設置まで あと 2.5 秒'
    );
  });

  it('mana は不足量ではなく現在のマナを示す', () => {
    expect(rejectionText('mana', base({ mana: 1 }))).toBe('マナが足りない（現在 1）');
  });

  it('target / occupied / pending はそれぞれ固有の文言になる', () => {
    expect(rejectionText('target', base())).toBe('そこには置けない');
    expect(rejectionText('occupied', base())).toBe('すでに何かが置かれている');
    expect(rejectionText('pending', base())).toBe('徴発の選択が先');
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/rejection-text.test.ts`
Expected: FAIL。モジュールが存在しない。

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/rejection-text.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 拒否理由の文言（純粋）
 *
 * 表示位置は盤面直下。近接の法則により、フィードバックは原因の近くに置く。
 * 「置けない」は盤面をクリックしたときに起きるため視線は盤面にあり、
 * 手札の上に出すと見落とされる（手札溢れ通知とは別枠にする理由）。
 */
import type { CombatState, TickEvent } from '../domain/combat/combat-state';

export type RejectionReason = Extract<TickEvent, { kind: 'rejected' }>['reason'];

/** tick を秒へ（1 tick = 100ms） */
const toSeconds = (ticks: number): string => (ticks / 10).toFixed(1);

export const rejectionText = (reason: RejectionReason, state: CombatState): string => {
  if (reason === 'cooldown') return `次の設置まで あと ${toSeconds(state.placeCooldown)} 秒`;
  if (reason === 'mana') return `マナが足りない（現在 ${state.mana}）`;
  if (reason === 'occupied') return 'すでに何かが置かれている';
  if (reason === 'pending') return '徴発の選択が先';
  return 'そこには置けない';
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/rejection-text.test.ts`
Expected: 4件 PASS

- [ ] **Step 5: フックで拒否通知を配線する**

`useAshenRampartGame.ts` に追加する。

```ts
/** 拒否通知を表示し続ける tick 数（0.6秒） */
const REJECTION_NOTICE_TICKS = 6;
```

state 宣言に追加:

```ts
  const [rejectionNotice, setRejectionNotice] = useState<string | undefined>(undefined);
  const rejectionUntilRef = useRef(0);
```

エフェクト変換の useEffect の後に追加:

```ts
  // 拒否理由の通知。同一 tick に複数出た場合は最初の1件だけを出し、
  // 同じ理由が続いた場合は件数を添える（表示欄は1つしかないため）
  useEffect(() => {
    const rejections = state.events.filter(
      (e): e is Extract<typeof e, { kind: 'rejected' }> => e.kind === 'rejected'
    );
    const first = rejections[0];
    if (first) {
      const sameReason = rejections.filter((e) => e.reason === first.reason).length;
      const text = rejectionText(first.reason, state);
      setRejectionNotice(sameReason > 1 ? `${text} ×${sameReason}` : text);
      rejectionUntilRef.current = state.tick + REJECTION_NOTICE_TICKS;
      return;
    }
    if (state.tick >= rejectionUntilRef.current) setRejectionNotice(undefined);
  }, [state]);
```

戻り値に `rejectionNotice,` を追加する。

- [ ] **Step 6: 盤面直下に表示する**

`AshenRampartGame.tsx` の `BoardWrapper` の**直後**（`<EnemyLegend />` の直前）に追加する。

```tsx
        {game.rejectionNotice && <RejectionNotice>{game.rejectionNotice}</RejectionNotice>}
```

styled-components の定義を追加する（`Result` の近く）。

```tsx
/** 拒否理由。盤面直下に置く（原因は盤面クリックなので視線が盤面にあるため） */
const RejectionNotice = styled.p`
  margin: 4px 0 0;
  color: ${COLORS.dangerText};
  text-align: center;
`;
```

- [ ] **Step 7: 統合テストを追加する**

`AshenRampartGame.test.tsx` に追加する。

```tsx
  it('置けないセルをクリックすると理由が盤面直下に出る', async () => {
    render(<AshenRampartGame />);
    // デッキ構築 → ブリーフィングを飛ばして開始する既存ヘルパに従う
    await startRunWithPreset();

    const hand = screen.getByRole('group', { name: '手札' });
    const towerCard = within(hand).getAllByRole('button')[0];
    fireEvent.click(towerCard);
    // 経路セル（塔は置けない）をクリックする
    fireEvent.click(screen.getByLabelText(/^0,3 経路/));

    expect(await screen.findByText(/そこには置けない|次の設置まで|マナが足りない/)).toBeVisible();
  });
```

**注意:** `startRunWithPreset` は既存テストの開始手順に合わせる。既存の `AshenRampartGame.test.tsx` にある開始処理をヘルパ関数へ抽出して再利用する。

- [ ] **Step 8: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation && npx tsc --noEmit`
Expected: 全 PASS

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/
git commit -m "feat(ashen-rampart): 操作が通らなかった理由を盤面直下に表示する

rejected は理由付きで発行されていたが UI が読んでいなかった。
同一 tick に複数出た場合は最初の1件のみ表示し、同じ理由は件数を添える。
表示位置は原因の近く(盤面直下)にする。手札溢れ通知とは別枠。"
```

---

### Task 8: 能動的な捨て札

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`（`PlayerAction`, `applyActions`）
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/presentation/HandArea.tsx`
- Test: `src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts`（追記）
- Test: `src/features/ashen-rampart/presentation/HandArea.test.tsx`（追記）

**Interfaces:**
- Produces: `PlayerAction` に `{ kind: 'discard'; handIndex: number }` が加わる
- Produces: `useAshenRampartGame` の戻り値に `discardCard: (handIndex: number) => void`
- Produces: `HandArea` の Props に `onDiscard: (handIndex: number) => void`

- [ ] **Step 1: 失敗するテストを書く（ドメイン）**

`src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts` に追加する。

```ts
describe('能動的な捨て札', () => {
  it('指定した札が手札から墓地へ移る', () => {
    const state = createCombatState(
      createDeck(['arrow-tower', 'reactor', 'reactor', 'reactor'], () => 0),
      noWave
    );
    const before = state.deck.hand.length;
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);

    expect(next.deck.hand).toHaveLength(before - 1);
    expect(next.deck.graveyard).toContain(state.deck.hand[0]);
  });

  it('捨て札はマナも配置クールダウンも消費しない', () => {
    const state = {
      ...createCombatState(createDeck(['arrow-tower', 'reactor', 'reactor', 'reactor'], () => 0), noWave),
      mana: 3,
    };
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);

    expect(next.mana).toBe(3);
    expect(next.placeCooldown).toBe(0);
  });

  it('存在しない index は何も起こさない', () => {
    const state = createCombatState(createDeck(['reactor'], () => 0), noWave);
    const next = stepTick(state, [{ kind: 'discard', handIndex: 99 }], PLAINS_MAP);
    expect(next.deck.hand).toEqual(state.deck.hand);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts`
Expected: FAIL（型エラーまたは振る舞い不一致）

- [ ] **Step 3: `PlayerAction` に `discard` を追加する**

`step-tick.ts` の `PlayerAction` 定義に追加する。

```ts
  | { kind: 'discard'; handIndex: number }
```

`applyActions` のディスパッチに分岐を追加する（`play-card` / `reactivate` / `choose-levy` を振り分けている箇所）。

```ts
    if (action.kind === 'discard') {
      applyDiscard(draft, action);
      return;
    }
```

`applyPlayCard` の直前に実装を追加する。

```ts
/**
 * 手札から1枚を能動的に捨てる
 *
 * コストもクールダウンも消費しない。**ドローは早まらない**
 * （ドローは DRAW_INTERVAL_TICKS の時間駆動）ため、「捨てて回す」戦術は
 * 成立せず、効果は手札の枠を空けることに限定される。有限デッキという
 * 前提を緩めないための意図的な設計（設計書 §5.3）。
 */
const applyDiscard = (
  draft: ActionsDraft,
  action: Extract<PlayerAction, { kind: 'discard' }>
): void => {
  if (draft.deck.hand[action.handIndex] === undefined) return;
  draft.deck = discardFromHand(draft.deck, action.handIndex);
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts`
Expected: 3件 PASS

- [ ] **Step 5: 失敗するテストを書く（UI）**

`src/features/ashen-rampart/presentation/HandArea.test.tsx` に追加する。

```tsx
  it('マナが足りない札でも捨てられる', () => {
    const onDiscard = jest.fn();
    const state = {
      ...createCombatState(createDeck(['ballista', 'reactor', 'reactor', 'reactor'], () => 0), PLAINS_WAVES),
      mana: 0,
    };
    render(
      <HandArea
        state={state}
        selectedIndex={null}
        onSelect={() => undefined}
        onDiscard={onDiscard}
      />
    );

    // 捨札ボタンは Card ボタンとは別要素にする。
    // Card は disabled={!affordable} のため、内包すると押せなくなる
    const discardButtons = screen.getAllByRole('button', { name: /を捨てる$/ });
    fireEvent.click(discardButtons[0]);
    expect(onDiscard).toHaveBeenCalledWith(0);
  });
```

- [ ] **Step 6: `HandArea` に捨札ボタンを追加する**

`HandArea.tsx` を書き換える。`Cards` の中身をカードごとのラッパーに変える。

```tsx
const CardSlot = styled.div`
  display: flex;
  align-items: stretch;
  gap: 2px;
`;

/**
 * 捨札ボタン
 *
 * Card は disabled={!affordable} のため、内側に置くと払えない札を捨てられない。
 * 兄弟要素にする（ボタンの入れ子は HTML としても不正）。
 */
const DiscardButton = styled.button`
  min-width: 28px;
  min-height: 44px;
  padding: 0;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
  cursor: pointer;
`;
```

Props に追加:

```tsx
  onDiscard: (handIndex: number) => void;
```

`Cards` の中を書き換える:

```tsx
      <Cards role="group" aria-label="手札">
        {state.deck.hand.map((cardId, index) => {
          const card = getCardDefinition(cardId);
          const affordable = card.cost <= state.mana;
          return (
            <CardSlot key={`${cardId}-${index}`}>
              <Card
                type="button"
                $selected={selectedIndex === index}
                aria-pressed={selectedIndex === index}
                aria-label={`${card.name} コスト${card.cost}`}
                disabled={!affordable}
                onClick={() => onSelect(index)}
              >
                {card.name}
                <br />
                コスト{card.cost}
              </Card>
              <DiscardButton
                type="button"
                aria-label={`${card.name}を捨てる`}
                onClick={() => onDiscard(index)}
              >
                ×
              </DiscardButton>
            </CardSlot>
          );
        })}
      </Cards>
```

- [ ] **Step 7: フックに `discardCard` を追加する**

`useAshenRampartGame.ts` に追加する。

```ts
  /**
   * 手札から1枚捨てる（UI から到達する唯一の入口）
   *
   * 一時停止中・決着後は無反応にする（他の操作と同じ防御）。
   */
  const discardCard = useCallback(
    (handIndex: number) => {
      if (isPaused || state.outcome !== 'playing') return;
      pendingRef.current.push({ kind: 'discard', handIndex });
      setSelectedIndex((current) => (current === handIndex ? null : current));
    },
    [isPaused, state.outcome]
  );
```

戻り値に `discardCard,` を追加し、`AshenRampartGame.tsx` の `<HandArea ... onDiscard={game.discardCard} />` を渡す。

- [ ] **Step 8: UI からの到達を統合テストで担保する**

`AshenRampartGame.test.tsx` に追加する。

```tsx
  it('捨札ボタンを押すと手札が1枚減る', async () => {
    render(<AshenRampartGame />);
    await startRunWithPreset();

    const hand = screen.getByRole('group', { name: '手札' });
    const before = within(hand).getAllByRole('button', { name: /を捨てる$/ }).length;
    fireEvent.click(within(hand).getAllByRole('button', { name: /を捨てる$/ })[0]);

    await waitFor(() => {
      const after = within(screen.getByRole('group', { name: '手札' })).getAllByRole('button', {
        name: /を捨てる$/,
      }).length;
      expect(after).toBe(before - 1);
    });
  });
```

**理由:** `wave_preview_shown` / `reactivate` / `noteRun` / `exportLogJson` の4件は、層ごとのテストが全部緑のまま UI から到達不能だった。**層をまたぐ配線は統合テストでしか守れない。**

- [ ] **Step 9: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit`
Expected: 全 PASS

- [ ] **Step 10: コミット**

```bash
git add src/features/ashen-rampart/
git commit -m "feat(ashen-rampart): 手札を能動的に捨てられるようにする

溢れた瞬間に選択を迫るモーダルは採らない(リアルタイムで敵が進軍中に
選択を迫ると理不尽、止めれば緊張感が消える)。溢れる前に自分で整理する形。
捨札ボタンは Card と兄弟要素にする(Card は払えない札を disabled にするため)。"
```

---

### Task 9: 設置マスの規則化と「城壁の外」

**Files:**
- Modify: `src/features/ashen-rampart/domain/board/stage-map.ts`
- Test: `src/features/ashen-rampart/domain/board/stage-map.test.ts`（追記）
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`

**Interfaces:**
- Produces: `export const BUILD_SLOT_MAX_DISTANCE = 1.5`
- Produces: `export const buildSlotsNearPath = (width: number, height: number, path: readonly CellPos[], maxDistance: number): CellPos[]`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/board/stage-map.test.ts` に追加する。

```ts
describe('設置スロットの規則化', () => {
  const LEGACY_SLOTS = [
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
    { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
    { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
    { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
  ];

  it('経路から距離1.5以内の非経路セルが22マスになる', () => {
    expect(PLAINS_MAP.buildSlots).toHaveLength(22);
  });

  it('従来の12マスはすべて含まれる（配置が不可能になるマスを作らない）', () => {
    LEGACY_SLOTS.forEach((slot) => {
      expect(PLAINS_MAP.buildSlots).toContainEqual(slot);
    });
  });

  it('高台2マスは設置スロットに含まれる', () => {
    (PLAINS_MAP.highGround ?? []).forEach((cell) => {
      expect(PLAINS_MAP.buildSlots).toContainEqual(cell);
    });
  });

  it('経路セルは設置スロットに含まれない', () => {
    PLAINS_MAP.path.forEach((cell) => {
      expect(PLAINS_MAP.buildSlots).not.toContainEqual(cell);
    });
  });

  it('すべての設置スロットから主力2種（射程1.5/1.6）が経路に届く', () => {
    // 「増やしたのに置いても無駄だった」という新種の不満を作らないための不変条件
    PLAINS_MAP.buildSlots.forEach((slot) => {
      const reachable = PLAINS_MAP.path.some(
        (c) => Math.hypot(c.x - slot.x, c.y - slot.y) <= 1.5
      );
      expect(reachable).toBe(true);
    });
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/board/stage-map.test.ts`
Expected: 「22マスになる」が FAIL（現状12）

- [ ] **Step 3: 規則生成に置き換える**

`stage-map.ts` の `PLAINS_MAP` 定義を書き換える。

```ts
/**
 * 設置スロットを経路からの距離で決める上限
 *
 * 塔の射程は 火砲台1.5 / 弓兵1.6 / 徹甲弩1.8 / 弩砲2.2 / 投石機3.0。
 * 主力の下限が1.5 なので、この距離までなら**どのマスからも主力2種が届く**。
 * 距離2.0（33マス）にすると弓兵・火砲台が届かないマスが生まれ、
 * 死にマスを別の形で再生産してしまう（設計書 §6.1）。
 */
export const BUILD_SLOT_MAX_DISTANCE = 1.5;

/** 経路から maxDistance 以内にある非経路セルを列挙する（左上から行優先） */
export const buildSlotsNearPath = (
  width: number,
  height: number,
  path: readonly CellPos[],
  maxDistance: number
): CellPos[] => {
  const slots: CellPos[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (path.some((c) => c.x === x && c.y === y)) continue;
      if (path.some((c) => Math.hypot(c.x - x, c.y - y) <= maxDistance)) slots.push({ x, y });
    }
  }
  return slots;
};

const PLAINS_WIDTH = 9;
const PLAINS_HEIGHT = 7;

const PLAINS_PATH: CellPos[] = [
  { x: 0, y: 3 },
  { x: 1, y: 3 },
  { x: 2, y: 3 },
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 4, y: 2 },
  { x: 4, y: 1 },
  { x: 5, y: 1 },
  { x: 6, y: 1 },
  { x: 7, y: 1 },
  { x: 8, y: 1 },
];

/** P1 ステージ: 平原（9×7、S字経路） */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: PLAINS_WIDTH,
  height: PLAINS_HEIGHT,
  path: PLAINS_PATH,
  buildSlots: buildSlotsNearPath(
    PLAINS_WIDTH,
    PLAINS_HEIGHT,
    PLAINS_PATH,
    BUILD_SLOT_MAX_DISTANCE
  ),
  highGround: [
    { x: 3, y: 4 },
    { x: 7, y: 2 },
  ],
  slowCells: [
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
  ],
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/board/stage-map.test.ts`
Expected: 5件 PASS

- [ ] **Step 5: 「城壁の外」を盤面に描く**

`BoardGrid.tsx` の `Cell` の背景を書き換える。

```tsx
const Cell = styled.button<{ $kind: string; $highlighted: boolean }>`
  border: 1px solid ${COLORS.grid};
  background: ${({ $kind }) =>
    $kind === 'path' ? '#2a2320' : $kind === 'slot' ? '#211c19' : 'transparent'};
  /* 城壁の外（置けないマス）は境界を落とし、盤面から後退させる。
     「置けそうに見えるのに置けない」ことが窮屈さの一因だったため */
  ${({ $kind }) => ($kind === 'empty' ? `border-color: transparent; opacity: 0.35;` : '')}
```

`label` の生成にも追加する（`isPath ? '経路' : isSlot ? '設置可' : ''` を書き換える）。

```tsx
          isPath ? '経路' : isSlot ? '設置可' : '城壁の外',
```

- [ ] **Step 6: 表示のテストを追加する**

`BoardGrid.test.tsx` に追加する。

```tsx
  it('設置できないマスは「城壁の外」と読める', () => {
    render(
      <BoardGrid
        map={PLAINS_MAP}
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        placeableCells={[]}
        effects={[]}
        onCellClick={() => undefined}
      />
    );
    // (0,0) は経路からも設置スロットからも遠い
    expect(screen.getByLabelText(/^0,0 城壁の外/)).toBeInTheDocument();
  });
```

- [ ] **Step 7: 回帰を確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit`
Expected: 全 PASS。**バランステストが落ちる可能性がある**（設置可能マスが増えたため）。落ちた場合は Task 13 で較正するので、**落ちたテスト名を記録して次へ進む**。

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/
git commit -m "feat(ashen-rampart): 設置スロットを経路からの距離で規則化する

座標直書き12マス → 経路から距離1.5以内の22マス。従来の12マスは
すべて含まれ純増のみ(検算済み)。距離1.5 は主力2種(射程1.5/1.6)が
どのマスからも届く上限で、死にマスの再生産を避ける。
置けないマスは「城壁の外」として後退させる。"
```

---

### Task 10: 同名上限のカード別化

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Modify: `src/features/ashen-rampart/domain/cards/deck-builder.ts`
- Modify: `src/features/ashen-rampart/presentation/DeckBuilder.tsx`
- Test: `src/features/ashen-rampart/domain/cards/deck-builder.test.ts`（追記）

**Interfaces:**
- Produces: `CardDefinition` に `maxCopies?: number`
- Produces: `export const maxCopiesOf = (id: string): number`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/cards/deck-builder.test.ts` に追加する。

```ts
describe('カード別の同名上限', () => {
  it('魔力炉は3枚を超えても有効になる', () => {
    const cards = [
      ...Array.from({ length: 8 }, () => 'reactor'),
      ...Array.from({ length: 3 }, () => 'arrow-tower'),
      ...Array.from({ length: 3 }, () => 'cannon-tower'),
      ...Array.from({ length: 3 }, () => 'spike-trap'),
      ...Array.from({ length: 3 }, () => 'ballista'),
    ];
    expect(cards).toHaveLength(20);
    expect(validateDeck(cards).isValid).toBe(true);
  });

  it('魔力炉以外は従来どおり3枚までに制限される', () => {
    const cards = [
      ...Array.from({ length: 4 }, () => 'arrow-tower'),
      ...Array.from({ length: 8 }, () => 'reactor'),
      ...Array.from({ length: 3 }, () => 'cannon-tower'),
      ...Array.from({ length: 3 }, () => 'spike-trap'),
      ...Array.from({ length: 2 }, () => 'ballista'),
    ];
    expect(cards).toHaveLength(20);
    const result = validateDeck(cards);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('弓兵の塔'))).toBe(true);
  });

  it('maxCopiesOf は魔力炉にデッキ枚数、それ以外に MAX_COPIES を返す', () => {
    expect(maxCopiesOf('reactor')).toBe(DECK_SIZE);
    expect(maxCopiesOf('arrow-tower')).toBe(MAX_COPIES);
  });
});
```

`import` に `maxCopiesOf` / `DECK_SIZE` / `MAX_COPIES` を追加する。

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck-builder.test.ts`
Expected: FAIL

- [ ] **Step 3: `CardDefinition` に上限を追加する**

`card-definition.ts` の `CardDefinition` に追加する。

```ts
  /**
   * デッキに入れられる同名の上限。省略時は MAX_COPIES（3枚）
   *
   * マナ源だけを別扱いにするための逃がし口。MAX_COPIES の目的は
   * 弓兵スパムの防止であって、マナ源を絞ることではなかった。
   */
  maxCopies?: number;
```

- [ ] **Step 4: 魔力炉に上限なしを設定する**

`card-pool.ts` の魔力炉の定義に追加する。

```ts
  {
    id: 'reactor',
    name: '魔力炉',
    type: 'reactor',
    cost: 0,
    description: '60tick ごとにマナを1得る。設置スロットを1つ使う。',
    reactor: { intervalTicks: 60, manaPerTick: 1 },
    // 盤面では3〜4基で消費レート（3マナ/60tick）を飽和させるため、
    // 並べるほど強くはならない。上限を外すのは「確実に引くため」である。
    // 20枚中3枚(15%)ではマナ基盤が確立する前にランが進んでしまっていた。
    maxCopies: DECK_SIZE,
  },
```

**注意:** `DECK_SIZE` は `CARDS` 配列より後ろで定義されているため、`DECK_SIZE` の宣言を `CARDS` の**前**へ移動する。

`card-pool.ts` に関数を追加する。

```ts
/** カードごとの同名上限。定義が無ければ MAX_COPIES */
export const maxCopiesOf = (id: string): number =>
  getCardDefinition(id).maxCopies ?? MAX_COPIES;
```

- [ ] **Step 5: `validateDeck` をカード別上限にする**

`deck-builder.ts` を書き換える。

```ts
import { CARD_IDS, DECK_SIZE, maxCopiesOf, getCardDefinition } from './card-pool';
```

```ts
  countByCard(cards).forEach((count, id) => {
    if (!CARD_IDS.includes(id)) return;
    const limit = maxCopiesOf(id);
    if (count <= limit) return;
    const name = getCardDefinition(id).name;
    errors.push(`${name}が${count}枚あります（同名は${limit}枚まで）`);
  });
```

- [ ] **Step 6: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/`
Expected: 全 PASS

- [ ] **Step 7: `DeckBuilder` の表示を更新する**

`DeckBuilder.tsx` で `MAX_COPIES` を直接参照している箇所を `maxCopiesOf(cardId)` に置き換える。枚数の上限表示・増加ボタンの `disabled` 判定の両方を対象にする。

`DeckBuilder.test.tsx` に追加する。

```tsx
  it('魔力炉は4枚以上でも追加できる', () => {
    render(<DeckBuilder onStart={() => undefined} />);
    const addReactor = screen.getByRole('button', { name: /魔力炉を追加/ });
    for (let i = 0; i < 6; i++) fireEvent.click(addReactor);
    expect(addReactor).not.toBeDisabled();
  });
```

**注意:** ボタンの `aria-label` は既存実装に合わせる。異なる場合は既存のラベルに合わせてセレクタを修正する。

- [ ] **Step 8: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit`
Expected: 全 PASS（バランステストを除く。落ちた場合は Task 13 で扱う）

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/
git commit -m "feat(ashen-rampart): 同名上限をカード別にし魔力炉の上限を外す

MAX_COPIES の目的は弓兵スパム防止であって、マナ源を絞ることでは
なかった。盤面では3〜4基で消費レートを飽和させるため並べるほど強くは
ならず、上限撤廃は「確実に引くため」の手当てである。"
```

---

### Task 11: 判定7項目の集計（純粋関数）

**Files:**
- Create: `src/features/ashen-rampart/presentation/run-summary.ts`
- Test: `src/features/ashen-rampart/presentation/run-summary.test.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`

**Interfaces:**
- Produces:
  - `export interface RunTally`
  - `export const emptyTally = (): RunTally`
  - `export const accumulateTick = (tally: RunTally, prevState: CombatState, state: CombatState, map: StageMap): RunTally`
  - `export const summarize = (tally: RunTally, deckCards: readonly string[]) => RunSummaryView`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/run-summary.test.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 判定7項目の集計
 *
 * events は毎 tick 消えるため、tick ごとに累積する。
 * 「配置時に選べたマス数」は prevState から機械的に再計算する
 * （UI の選択状態に依存させると、拒否されたクリックも数えてしまう）。
 */
import { PLAINS_MAP } from '../domain/board/stage-map';
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import { accumulateTick, emptyTally, summarize } from './run-summary';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];
const base = (over: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  ...over,
});

describe('accumulateTick', () => {
  it('塔別の撃破数を数える', () => {
    const prev = base();
    const state = base({
      tick: 5,
      events: [
        { kind: 'defeat', enemyId: 1, source: { kind: 'tower', index: 0 } },
        { kind: 'defeat', enemyId: 2, source: { kind: 'tower', index: 0 } },
        { kind: 'defeat', enemyId: 3, source: { kind: 'trap', index: 1 } },
      ],
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
      traps: [
        { cardId: 'spike-trap', pos: { x: 0, y: 3 }, usesLeft: 1, hitEnemyIds: [] },
        { cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 1, hitEnemyIds: [] },
      ],
    });
    const tally = accumulateTick(emptyTally(), prev, state, PLAINS_MAP);
    expect(tally.defeatsByCard['arrow-tower']).toBe(2);
    expect(tally.defeatsByCard['spike-trap']).toBe(1);
  });

  it('支援塔の貢献を2つの単位で数える', () => {
    const state = base({
      tick: 5,
      events: [
        { kind: 'shot', towerIndex: 0, targetId: 1, auraDamageBonus: 2, beyondBaseRange: false },
        { kind: 'shot', towerIndex: 0, targetId: 1, auraDamageBonus: 3, beyondBaseRange: true },
      ],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.beaconBonusDamage).toBe(5);
    expect(tally.forgeExtendedShots).toBe(1);
  });

  it('拒否を理由別に数える', () => {
    const state = base({
      tick: 3,
      events: [
        { kind: 'rejected', reason: 'mana' },
        { kind: 'rejected', reason: 'cooldown' },
        { kind: 'rejected', reason: 'mana' },
      ],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.rejections.mana).toBe(2);
    expect(tally.rejections.cooldown).toBe(1);
  });

  it('配置が成立した瞬間に選べたマス数を記録する', () => {
    const prev = base({ mana: 5 });
    const state = base({
      tick: 10,
      mana: 3,
      events: [{ kind: 'played', cardId: 'arrow-tower', pos: { x: 1, y: 2 } }],
    });
    const tally = accumulateTick(emptyTally(), prev, state, PLAINS_MAP);
    // 盤面に何も無い状態なら 22 マスすべてが候補
    expect(tally.placeableCounts).toEqual([22]);
  });

  it('魔力炉の初号機が置かれた tick を記録する', () => {
    const state = base({
      tick: 210,
      events: [{ kind: 'played', cardId: 'reactor', pos: { x: 1, y: 2 } }],
    });
    const tally = accumulateTick(emptyTally(), base(), state, PLAINS_MAP);
    expect(tally.firstReactorTick).toBe(210);
  });

  it('手札が非空で1枚も払えない tick をマナ待ちとして数える', () => {
    const state = base({ tick: 4, mana: 0 });
    const withExpensiveHand: CombatState = {
      ...state,
      deck: { ...state.deck, hand: ['arrow-tower'] },
    };
    const tally = accumulateTick(emptyTally(), base(), withExpensiveHand, PLAINS_MAP);
    expect(tally.manaStarvedTicks).toBe(1);
  });
});

describe('summarize', () => {
  it('選べたマスの平均と最小を出す', () => {
    const tally = { ...emptyTally(), placeableCounts: [4, 12, 20] };
    const view = summarize(tally, ['reactor']);
    expect(view.placeableAverage).toBe(12);
    expect(view.placeableMin).toBe(4);
  });

  it('デッキにあって一度も場に出なかった札を挙げる', () => {
    const tally = { ...emptyTally(), playedCardIds: new Set(['arrow-tower']) };
    const view = summarize(tally, ['arrow-tower', 'stone-wall', 'forge', 'forge']);
    expect(view.unusedCardNames).toEqual(['石壁', '鍛冶場']);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/run-summary.test.ts`
Expected: FAIL。モジュールが存在しない。

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/run-summary.ts` を新規作成する。

```ts
/**
 * 灰燼の城壁 - 判定7項目の集計（純粋）
 *
 * 反復1 では判定項目が未集計のまま判定された。ログはブラウザの
 * localStorage にあり開発側から読めないため、**画面に出す**。
 * ここは集計の計算だけを持ち、表示は RunSummary.tsx が持つ。
 */
import type { CellPos, StageMap } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState, TickEvent } from '../domain/combat/combat-state';
import { canPlaceAt } from '../domain/combat/step-tick';

type RejectionReason = Extract<TickEvent, { kind: 'rejected' }>['reason'];

export interface RunTally {
  /** カード id ごとの撃破数（撃破源のカードで数える） */
  defeatsByCard: Record<string, number>;
  /** 篝火の隣接オーラで増えた与ダメージの累計 */
  beaconBonusDamage: number;
  /** 鍛冶場の射程延長で初めて届いた射撃の回数 */
  forgeExtendedShots: number;
  /** 拒否の理由別回数 */
  rejections: Record<RejectionReason, number>;
  /** 徴発を使った回数 */
  levyPlayed: number;
  /** 徴発の選択が成立した回数 */
  levyResolved: number;
  /** 配置が成立した瞬間に選べたマス数の履歴 */
  placeableCounts: number[];
  /** 最初の魔力炉が置かれた tick。未設置なら undefined */
  firstReactorTick?: number;
  /** 手札が非空で1枚も払えなかった tick 数 */
  manaStarvedTicks: number;
  /** 一度でも場に出たカード id */
  playedCardIds: Set<string>;
}

export const emptyTally = (): RunTally => ({
  defeatsByCard: {},
  beaconBonusDamage: 0,
  forgeExtendedShots: 0,
  rejections: { cooldown: 0, mana: 0, target: 0, occupied: 0, pending: 0 },
  levyPlayed: 0,
  levyResolved: 0,
  placeableCounts: [],
  firstReactorTick: undefined,
  manaStarvedTicks: 0,
  playedCardIds: new Set(),
});

/** 撃破源に対応するカード id */
const sourceCardId = (
  state: CombatState,
  source: Extract<TickEvent, { kind: 'defeat' }>['source']
): string | undefined => {
  if (source.kind === 'tower') return state.towers[source.index]?.cardId;
  if (source.kind === 'trap') return state.traps[source.index]?.cardId;
  return 'ember-blast';
};

/**
 * その盤面でそのカードを置けるマスの数
 *
 * UI の選択状態ではなく prevState から機械的に再計算する。
 * UI 由来にすると、拒否されたクリックまで数えてしまう。
 */
const placeableCountFor = (
  state: CombatState,
  cardId: string,
  map: StageMap
): number => {
  const card = getCardDefinition(cardId);
  const kind = placementKindOf(card);
  if (kind === 'none') return 0;
  // useAshenRampartGame の placeableCells と同じ判定を使う。
  // 独自に card.type で分けると、盤面に置く札の判定が2箇所に分かれて食い違う
  const candidates: readonly CellPos[] = kind === 'path' ? map.path : map.buildSlots;
  return candidates.filter((pos) => canPlaceAt(state, card, pos, map)).length;
};

/** 手札に1枚も払える札が無い（かつ手札が空でない）か */
const isManaStarved = (state: CombatState): boolean =>
  state.deck.hand.length > 0 &&
  state.deck.hand.every((id) => getCardDefinition(id).cost > state.mana);

/** この tick のイベントを累積する */
export const accumulateTick = (
  tally: RunTally,
  prevState: CombatState,
  state: CombatState,
  map: StageMap
): RunTally => {
  const next: RunTally = {
    ...tally,
    defeatsByCard: { ...tally.defeatsByCard },
    rejections: { ...tally.rejections },
    placeableCounts: [...tally.placeableCounts],
    playedCardIds: new Set(tally.playedCardIds),
  };

  state.events.forEach((event) => {
    if (event.kind === 'defeat') {
      const cardId = sourceCardId(state, event.source);
      if (cardId) next.defeatsByCard[cardId] = (next.defeatsByCard[cardId] ?? 0) + 1;
      return;
    }
    if (event.kind === 'shot') {
      next.beaconBonusDamage += event.auraDamageBonus;
      if (event.beyondBaseRange) next.forgeExtendedShots += 1;
      return;
    }
    if (event.kind === 'rejected') {
      next.rejections[event.reason] += 1;
      return;
    }
    if (event.kind === 'played') {
      next.playedCardIds.add(event.cardId);
      if (event.cardId === 'levy') next.levyPlayed += 1;
      if (event.cardId === 'reactor' && next.firstReactorTick === undefined) {
        next.firstReactorTick = state.tick;
      }
      if (event.pos) {
        next.placeableCounts.push(placeableCountFor(prevState, event.cardId, map));
      }
    }
  });

  // 徴発の選択成立（候補が出ていた状態から空になった遷移）
  if (prevState.levyOptions.length > 0 && state.levyOptions.length === 0) {
    next.levyResolved += 1;
  }

  if (isManaStarved(state)) next.manaStarvedTicks += 1;

  return next;
};

export interface RunSummaryView {
  defeats: { name: string; count: number }[];
  beaconBonusDamage: number;
  forgeExtendedShots: number;
  rejectionTotal: number;
  rejectionDetail: { label: string; count: number }[];
  levyPlayed: number;
  levyResolved: number;
  placeableAverage: number;
  placeableMin: number;
  firstReactorTick?: number;
  manaStarvedTicks: number;
  unusedCardNames: string[];
}

const REJECTION_LABEL: Record<RejectionReason, string> = {
  cooldown: '設置間隔',
  mana: 'マナ不足',
  target: '置けない場所',
  occupied: '設置済み',
  pending: '徴発の選択待ち',
};

/** 集計を表示用に整える */
export const summarize = (tally: RunTally, deckCards: readonly string[]): RunSummaryView => {
  const counts = tally.placeableCounts;
  const unused = [...new Set(deckCards)].filter((id) => !tally.playedCardIds.has(id));
  return {
    defeats: Object.entries(tally.defeatsByCard)
      .map(([id, count]) => ({ name: getCardDefinition(id).name, count }))
      .sort((a, b) => b.count - a.count),
    beaconBonusDamage: tally.beaconBonusDamage,
    forgeExtendedShots: tally.forgeExtendedShots,
    rejectionTotal: Object.values(tally.rejections).reduce((sum, n) => sum + n, 0),
    rejectionDetail: (Object.keys(REJECTION_LABEL) as RejectionReason[])
      .filter((reason) => tally.rejections[reason] > 0)
      .map((reason) => ({ label: REJECTION_LABEL[reason], count: tally.rejections[reason] })),
    levyPlayed: tally.levyPlayed,
    levyResolved: tally.levyResolved,
    placeableAverage:
      counts.length === 0 ? 0 : counts.reduce((sum, n) => sum + n, 0) / counts.length,
    placeableMin: counts.length === 0 ? 0 : Math.min(...counts),
    firstReactorTick: tally.firstReactorTick,
    manaStarvedTicks: tally.manaStarvedTicks,
    unusedCardNames: unused.map((id) => getCardDefinition(id).name),
  };
};
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/run-summary.test.ts`
Expected: 8件 PASS

- [ ] **Step 5: フックで累積する**

`useAshenRampartGame.ts` に追加する。

```ts
import { accumulateTick, emptyTally, summarize, type RunTally } from './run-summary';
```

state 宣言に追加:

```ts
  const [tally, setTally] = useState<RunTally>(() => emptyTally());
  const prevStateRef = useRef<CombatState>(state);
```

エフェクト変換の useEffect の後に追加:

```ts
  // 判定用の集計を累積する。events は毎 tick 消えるため tick ごとに足す
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;
    setTally((current) => accumulateTick(current, prev, state, PLAINS_MAP));
  }, [state]);
```

`restart` に追加:

```ts
      setTally(emptyTally());
      prevStateRef.current = startRunWithDeck(cards, new SeededRandom(seedToUse));
```

**注意:** `restart` は既に `setState(startRunWithDeck(...))` を呼んでいる。同じ値を2回作らないよう、`const nextState = startRunWithDeck(cards, new SeededRandom(seedToUse));` を先に宣言して `setState(nextState)` と `prevStateRef.current = nextState` の両方に使う。

戻り値に追加:

```ts
    summary: summarize(tally, cards),
```

- [ ] **Step 6: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit`
Expected: 全 PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/presentation/
git commit -m "feat(ashen-rampart): 判定7項目の集計を純粋関数で行う

「選べたマス数」は prevState から機械的に再計算する(UI の選択状態に
依存させると拒否されたクリックも数えてしまう)。窮屈さは置いた数では
なく置くときに選べた数に現れ、過剰も同じ指標の上振れで検出できる。"
```

---

### Task 12: リザルトの2段階表示

**Files:**
- Create: `src/features/ashen-rampart/presentation/RunSummary.tsx`
- Test: `src/features/ashen-rampart/presentation/RunSummary.test.tsx`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Modify: `src/features/ashen-rampart/presentation/RunStatusBar.tsx`

**Interfaces:**
- Consumes: `RunSummaryView`（Task 11）
- Produces: `export const RunSummary: React.FC<{ view: RunSummaryView }>`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/RunSummary.test.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 支援塔をデッキに入れなかったランでは行ごと出さない（情報量の抑制）。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RunSummary } from './RunSummary';
import type { RunSummaryView } from './run-summary';

const view = (over: Partial<RunSummaryView> = {}): RunSummaryView => ({
  defeats: [{ name: '弓兵の塔', count: 12 }],
  beaconBonusDamage: 0,
  forgeExtendedShots: 0,
  rejectionTotal: 0,
  rejectionDetail: [],
  levyPlayed: 0,
  levyResolved: 0,
  placeableAverage: 11.2,
  placeableMin: 4,
  firstReactorTick: 210,
  manaStarvedTicks: 340,
  unusedCardNames: [],
  ...over,
});

describe('RunSummary', () => {
  it('塔別の撃破数を出す', () => {
    render(<RunSummary view={view()} />);
    expect(screen.getByText(/弓兵の塔/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('選べたマスの平均と最小を出す', () => {
    render(<RunSummary view={view()} />);
    expect(screen.getByText(/平均 11.2/)).toBeInTheDocument();
    expect(screen.getByText(/最小 4/)).toBeInTheDocument();
  });

  it('篝火の貢献が0のときはその行を出さない', () => {
    render(<RunSummary view={view({ beaconBonusDamage: 0 })} />);
    expect(screen.queryByText(/篝火/)).not.toBeInTheDocument();
  });

  it('篝火の貢献があるときは与ダメージ増加分を出す', () => {
    render(<RunSummary view={view({ beaconBonusDamage: 34 })} />);
    expect(screen.getByText(/篝火.*34/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npx jest src/features/ashen-rampart/presentation/RunSummary.test.tsx`
Expected: FAIL

- [ ] **Step 3: 実装する**

`src/features/ashen-rampart/presentation/RunSummary.tsx` を新規作成する。

```tsx
/**
 * 灰燼の城壁 - リザルト集計の表示
 *
 * 判定7項目に1対1で対応させる。**判定に使わない数値は出さない**。
 * 支援塔を入れなかったランでは該当行を出さない（情報量の抑制）。
 */
import React from 'react';
import styled from 'styled-components';
import type { RunSummaryView } from './run-summary';
import { COLORS } from './theme';

const List = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 8px 0 0;
  color: ${COLORS.secondary};
  text-align: left;
`;

const Term = styled.dt`
  color: ${COLORS.secondary};
  opacity: 0.75;
`;

const Detail = styled.dd`
  margin: 0;
`;

/** tick を秒へ（1 tick = 100ms） */
const toSeconds = (ticks: number): string => (ticks / 10).toFixed(1);

interface Props {
  view: RunSummaryView;
}

export const RunSummary: React.FC<Props> = ({ view }) => (
  <List>
    <Term>撃破の内訳</Term>
    <Detail>
      {view.defeats.length === 0
        ? '撃破なし'
        : view.defeats.map((d) => `${d.name} ${d.count}体`).join(' / ')}
    </Detail>

    {view.beaconBonusDamage > 0 && (
      <>
        <Term>篝火の貢献</Term>
        <Detail>与ダメージ +{view.beaconBonusDamage}</Detail>
      </>
    )}

    {view.forgeExtendedShots > 0 && (
      <>
        <Term>鍛冶場の貢献</Term>
        <Detail>射程延長で {view.forgeExtendedShots} 射</Detail>
      </>
    )}

    <Term>通らなかった操作</Term>
    <Detail>
      {view.rejectionTotal}回
      {view.rejectionDetail.length > 0 &&
        `（${view.rejectionDetail.map((r) => `${r.label}${r.count}`).join('・')}）`}
    </Detail>

    <Term>徴発</Term>
    <Detail>
      {view.levyPlayed}回使用 / 選択成立 {view.levyResolved}回
    </Detail>

    <Term>マナ基盤</Term>
    <Detail>
      {view.firstReactorTick === undefined
        ? '魔力炉を置けなかった'
        : `初号機 ${toSeconds(view.firstReactorTick)}秒`}
      {' / '}マナ待ち {toSeconds(view.manaStarvedTicks)}秒
    </Detail>

    <Term>置くときに選べたマス</Term>
    <Detail>
      平均 {view.placeableAverage.toFixed(1)} / 最小 {view.placeableMin}
    </Detail>

    <Term>使わなかった札</Term>
    <Detail>
      {view.unusedCardNames.length === 0 ? 'なし' : view.unusedCardNames.join('・')}
    </Detail>
  </List>
);
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/RunSummary.test.tsx`
Expected: 4件 PASS

- [ ] **Step 5: リザルトを2段階にする**

`AshenRampartGame.tsx` の `RunView` に state を追加する。

```tsx
  // 集計は「勝敗の理由」を記録した後にだけ出す。
  // 判定項目1 の問いは「戦闘中に読めたか」であり、集計を先に見せると
  // 盤面で読めなかった場合でもリザルトが答えを教えてしまう（設計書 §8.2）
  const [summaryUnlocked, setSummaryUnlocked] = useState(false);
```

`handleNoteSubmit` の中で記録が成立したら `setSummaryUnlocked(true)` を呼ぶ。

`Result` の中身を書き換える。集計・ログコピー・再挑戦の各ボタンは**記録の後**に出す。

```tsx
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <NoteForm onSubmit={handleNoteSubmit}>
              <NoteLabel htmlFor="ashen-rampart-run-note">
                勝敗の理由を記録する（記録すると集計が開きます）
              </NoteLabel>
              <NoteInput
                id="ashen-rampart-run-note"
                value={noteText}
                onChange={(event) => {
                  setNoteText(event.target.value);
                  setNoteSaved(false);
                }}
              />
              <ActionButton type="submit">記録する</ActionButton>
              {noteSaved && <Feedback>記録しました</Feedback>}
            </NoteForm>

            {summaryUnlocked && (
              <>
                <RunSummary view={game.summary} />
                <ActionRow>
                  <ActionButton type="button" onClick={() => game.restart()}>
                    同じデッキで別のシードに挑む
                  </ActionButton>
                  <ActionButton type="button" onClick={onRebuild}>
                    もう一度挑む
                  </ActionButton>
                  <ActionButton type="button" onClick={handleCopyLog}>
                    計測ログをコピー
                  </ActionButton>
                </ActionRow>
                {copyStatus === 'copied' && <Feedback>計測ログをコピーしました</Feedback>}
                {copyStatus === 'failed' && (
                  <Feedback>コピーに失敗しました。コンソールに出力しています</Feedback>
                )}
              </>
            )}
          </Result>
```

`restart` 時に `setSummaryUnlocked(false)` と `setNoteText('')` を呼ぶよう、`game.restart()` を包むハンドラを作る。

- [ ] **Step 6: 順序をテストで固定する**

`AshenRampartGame.test.tsx` に追加する。

```tsx
  it('勝敗の理由を記録するまで集計は表示されない', async () => {
    render(<AshenRampartGame />);
    await startRunWithPreset();
    await reachOutcome(); // 決着まで進める既存ヘルパ

    expect(screen.queryByText(/置くときに選べたマス/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/勝敗の理由を記録する/), {
      target: { value: '鴉を落とせなかった' },
    });
    fireEvent.click(screen.getByRole('button', { name: '記録する' }));

    expect(await screen.findByText(/置くときに選べたマス/)).toBeVisible();
  });
```

**注意:** `reachOutcome` は既存テストの決着到達手順に合わせる（`jest.advanceTimersByTime` を使う既存パターンがあればそれを再利用する）。無ければ既存の決着テストから抽出する。

- [ ] **Step 7: 漏れとライフ表示を連動させる**

`RunStatusBar.tsx` のライフ表示に、直近の漏れがあるとき `dangerText` を適用する。Props に `isLeaking: boolean` を追加し、`AshenRampartGame.tsx` から `game.effects.some((e) => e.kind === 'leak')` を渡す。

**理由:** 共通運命の法則。砦セルが脈動するのに HUD のライフが無音で減ると、同じ出来事が2つの別の出来事に見える。

`RunStatusBar.test.tsx` に追加する。

```tsx
  it('漏れの最中はライフが危険色になる', () => {
    const { container } = render(
      <RunStatusBar
        state={createCombatState(createDeck(['reactor'], () => 0), PLAINS_WAVES)}
        isPaused={false}
        onTogglePause={() => undefined}
        runSeed={1}
        isLeaking
      />
    );
    expect(container.querySelector('[data-leaking="true"]')).not.toBeNull();
  });
```

- [ ] **Step 8: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart && npx tsc --noEmit && npm run lint:ci`
Expected: 全 PASS

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/presentation/
git commit -m "feat(ashen-rampart): リザルトを2段階にし判定7項目の集計を出す

集計を先に見せると判定項目1「戦闘中に読めたか」の答えを教えてしまう
ため、勝敗の理由を記録した後に開く。運用ルールでは必ず破られるので
UI の順序で強制する。漏れとライフ表示も連動させた。"
```

---

### Task 13: プリセット再構成とバランス較正

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`（`PRESET_DECKS`）
- Modify: `src/features/ashen-rampart/domain/combat/balance.test.ts`

**Interfaces:**
- Consumes: `runSimulation` / `greedyStrategy`（既存）
- Produces: 数値の変更のみ

**背景:** 設置マスが12→22、魔力炉のデッキ内上限が撤廃されたため、プリセット2種の勝率を再測定する。**敵側の数値は動かさない**（実プレイ判定の直前に難度を動かさない方針）。

- [ ] **Step 1: 現状の勝率を測る**

`balance.test.ts` に一時的な計測テストを追加して実行する。

```ts
  it.skip('[計測用] プリセットの勝率を出力する', () => {
    ['swift', 'heavy'].forEach((presetId) => {
      const preset = PRESET_DECKS.find((p) => p.id === presetId);
      if (!preset) throw new Error(`プリセットが見つかりません: ${presetId}`);
      let wins = 0;
      for (let seed = 1; seed <= 20; seed++) {
        if (runSimulation(preset.cards, seed, greedyStrategy).outcome === 'won') wins += 1;
      }
      // eslint-disable-next-line no-console
      console.log(`${presetId}: ${wins}/20`);
    });
  });
```

Run: `npx jest src/features/ashen-rampart/domain/combat/balance.test.ts -t "計測用" --testPathIgnorePatterns=[]`

**注意:** `it.skip` を一時的に `it` へ変えて実行し、測り終わったら**このテストごと削除する**（計測用のコードを残さない）。

- [ ] **Step 2: プリセットを魔力炉8枚構成へ組み直す**

`card-pool.ts` の `PRESET_DECKS` を書き換える。両プリセットとも魔力炉を **3枚から8枚**へ増やし、その分を主戦力以外から削る。

```ts
/**
 * プリセットデッキ2種（反復2 の再構成）
 *
 * 魔力炉のデッキ内上限を外したため、MTG の土地比率（40枚中17枚＝42.5%）に
 * 近い **20枚中8枚（40%）** へ組み直した。盤面では3〜4基で消費レートを
 * 飽和させるため並べ得にはならず、増やす目的は「確実に引く」ことにある。
 *
 * **配列の並び順にも意味がある。** createDeck のシャッフルは入力配列の順序に
 * 依存し、同一構成でも並べ替えで勝率が動く。較正の測定はこの順序で行った。
 */
export const PRESET_DECKS: readonly PresetDeck[] = [
  {
    id: 'swift',
    name: '速攻型',
    description: '安い弓兵と棘罠で手数を稼ぎ、群れは火砲台で潰す。',
    cards: [
      ...repeat('reactor', 8),
      ...repeat('arrow-tower', 3),
      ...repeat('spike-trap', 3),
      ...repeat('cannon-tower', 2),
      ...repeat('ballista', 2),
      ...repeat('mud-time', 1),
      ...repeat('levy', 1),
    ],
  },
  {
    id: 'heavy',
    name: '重厚型',
    description: '徹甲弩と投石機で火力を通し、飛行は落網で落として叩く。',
    cards: [
      ...repeat('reactor', 8),
      ...repeat('piercer', 3),
      ...repeat('catapult', 2),
      ...repeat('ballista', 2),
      ...repeat('snare-net', 2),
      ...repeat('ember-blast', 2),
      ...repeat('levy', 1),
    ],
  },
];
```

**注意:** 合計が `DECK_SIZE`（20）ちょうどになることを確認する。上の構成はどちらも 8+3+3+2+2+1+1 = 20 / 8+3+2+2+2+2+1 = 20。

- [ ] **Step 3: プリセットの妥当性テストを実行する**

Run: `npx jest src/features/ashen-rampart/domain/cards/`
Expected: `validateDeck(preset.cards).isValid === true` を検証する既存テストが PASS

- [ ] **Step 4: 較正の不変条件を追加する**

`balance.test.ts` に追加する。

```ts
describe('較正の不変条件（反復2）', () => {
  /** 範囲攻撃（splashRadius > 0）を持たない合法デッキ */
  const noSplashDeck = (): string[] => {
    // ID のハードコードではなくスペック述語で機械的に除外する。
    // 反復1 で「範囲攻撃なし」デッキに ember-blast が混ざっていた事故の再発防止
    const singleTargetTowers = CARD_IDS.filter((id) => {
      const card = getCardDefinition(id);
      return card.type === 'tower' && card.tower !== undefined && card.tower.splashRadius === 0
        && card.tower.aura === undefined;
    });
    const picks = singleTargetTowers.flatMap((id) => repeatId(id, 3));
    return [...repeatId('reactor', DECK_SIZE - picks.length), ...picks].slice(0, DECK_SIZE);
  };

  it('範囲攻撃を含まないデッキの勝率は 4/20 未満である', () => {
    const deck = noSplashDeck();
    expect(validateDeck(deck).isValid).toBe(true);
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      if (runSimulation(deck, seed, greedyStrategy).outcome === 'won') wins += 1;
    }
    expect(wins).toBeLessThan(4);
  });

  it('全要求充足デッキの勝率は 12/20 以上である', () => {
    // 対空・貫通・範囲の3軸をすべて満たす構成
    const deck = [
      ...repeatId('reactor', 8),
      ...repeatId('ballista', 3),
      ...repeatId('cannon-tower', 3),
      ...repeatId('piercer', 3),
      ...repeatId('snare-net', 2),
      ...repeatId('levy', 1),
    ];
    expect(deck).toHaveLength(DECK_SIZE);
    expect(validateDeck(deck).isValid).toBe(true);
    let wins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      if (runSimulation(deck, seed, greedyStrategy).outcome === 'won') wins += 1;
    }
    expect(wins).toBeGreaterThanOrEqual(12);
  });
});
```

`repeatId` は `balance.test.ts` 内のローカルヘルパとして定義する。

```ts
const repeatId = (id: string, count: number): string[] =>
  Array.from({ length: count }, () => id);
```

**両方を同時に課す理由:** 片側だけでは較正が厳しすぎても緩すぎても検出できない（反復1 で4回繰り返した欠陥への対策）。

- [ ] **Step 5: テストを実行して結果を確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/balance.test.ts`
Expected: 全 PASS

**落ちた場合の対応:**
- 「全要求充足デッキが 12/20 未満」→ プリセットではなく**難度が上がりすぎている**。魔力炉8枚で手札が詰まっている可能性を疑い、まず `noSplashDeck` の結果も見る
- 「範囲攻撃なしが 4/20 以上」→ 設置マス増で単体塔が有利になりすぎている。**敵の数値は動かさず**、`BUILD_SLOT_MAX_DISTANCE` の見直しを検討する
- どちらの調整も設計書 §10 の「敵側の数値は動かさない」を守ること

- [ ] **Step 6: 既存のバランステストを更新する**

Task 6 / 9 / 10 で落ちたテストがあれば、ここで新しい数値に合わせて更新する。**数値を緩める場合は、なぜ緩めてよいかをコメントに残す**（反復1 で「主張の方を実態に合わせて訂正した」経緯があるため）。

- [ ] **Step 7: 計測用テストを削除する**

Step 1 で追加した `[計測用]` のテストを削除する。

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/domain/
git commit -m "test(ashen-rampart): 較正をやり直し不変条件に数値閾値を入れる

設置マス12→22・魔力炉のデッキ内上限撤廃を受けてプリセット2種を
魔力炉8枚(40%)構成へ組み直した。敵側の数値は動かしていない。
据え置きだった「範囲攻撃なしでも勝てる」の緩さに 4/20 未満という
閾値を入れ、全要求充足デッキ 12/20 以上と両側で拘束する。"
```

---

### Task 14: ホームボタンと文字の重なり（設計書 §7）

**Files:**
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`（`Layout`）
- Test: `src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`（追記）

**Interfaces:** なし（レイアウトのみ）

**制約:** ヘッダー（ホームボタンを含む）は `App.tsx` の共通レイヤーで、**14ゲームすべてが依存している**。共通側は変更しない。修正は ashen-rampart の `Layout` 側で吸収する。

- [ ] **Step 1: 実際の重なりを確認する**

開発サーバを起動し、`http://localhost:8080/ashen-rampart` を開く。

Run: `npm start`

ブラウザの開発者ツールで、画面左上のホームボタン（共通ヘッダー）の高さを測る。

```js
// 開発者ツールのコンソールで実行
const header = document.querySelector('header');
console.log(header?.getBoundingClientRect());
```

`AshenRampartGame` の `Layout` の最初の子（`LevyChoice` / `RunStatusBar`）の矩形と比較し、**重なっている高さ（px）**を記録する。

- [ ] **Step 2: 失敗するテストを書く**

`AshenRampartGame.test.tsx` に追加する。

```tsx
  it('ゲーム画面の上端に共通ヘッダーぶんの余白がある', () => {
    const { container } = render(<AshenRampartGame />);
    const layout = container.firstElementChild;
    expect(layout).not.toBeNull();
    // 共通ヘッダー（ホームボタン）と重ならないための余白。
    // ヘッダーは 14 ゲーム共通のため、こちら側で吸収する
    expect(layout).toHaveStyleRule('padding-top', HEADER_CLEARANCE);
  });
```

`toHaveStyleRule` は `jest-styled-components` が必要。導入されていない場合は、代わりに `data-testid` を付けて `getComputedStyle` で検証するのではなく、**`Layout` に `data-header-clearance` 属性を持たせて値を検証する**（jsdom は styled-components の CSS を計算しないため）。

```tsx
  it('ゲーム画面の上端に共通ヘッダーぶんの余白がある', () => {
    render(<AshenRampartGame />);
    expect(screen.getByTestId('ashen-rampart-layout')).toHaveAttribute(
      'data-header-clearance',
      HEADER_CLEARANCE
    );
  });
```

- [ ] **Step 3: `Layout` に余白を入れる**

`AshenRampartGame.tsx` を書き換える。

```tsx
/**
 * 共通ヘッダー（ホームボタン）と重ならないための上端の余白
 *
 * ヘッダーは App.tsx の共通レイヤーで 14 ゲームすべてが依存しているため、
 * 共通側は変更せずこちらで吸収する。Step 1 で実測した値を使う。
 */
export const HEADER_CLEARANCE = '56px';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: ${HEADER_CLEARANCE};
  background: ${COLORS.dominant};
`;
```

**注意:** `56px` は Step 1 の実測値に置き換える。既存の `Layout` に他のスタイルがある場合は残したまま `padding-top` だけを足す。

`Layout` の JSX に属性を足す。

```tsx
    <Layout data-testid="ashen-rampart-layout" data-header-clearance={HEADER_CLEARANCE}>
```

- [ ] **Step 4: テストを実行して通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`
Expected: PASS

- [ ] **Step 5: 実画面で重なりが消えたことを確認する**

`npm start` で再度開き、Step 1 と同じ計測を行って矩形が重ならないことを確認する。**この確認はテストでは代替できない**（jsdom はレイアウトを計算しない）。

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/AshenRampartGame.tsx src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx
git commit -m "fix(ashen-rampart): 共通ヘッダーとゲーム画面上端の重なりを解消する

ヘッダーは 14 ゲーム共通で他タイトルへ波及するため、共通側は変更せず
ashen-rampart の Layout 側に余白を入れて吸収する。"
```

---

### Task 15: 全体の統合確認

**Files:**
- Modify: 必要に応じて既存テスト

- [ ] **Step 1: CI パイプライン全体を実行する**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて成功

- [ ] **Step 2: 落ちた箇所を修正する**

**修正の方針:**
- 型エラー → 新しいイベント形状に合わせて既存テストを更新する
- lint 警告 → 未使用 import の削除が大半
- テスト失敗 → **数値を緩める前に、まず原因が本当に仕様変更によるものかを確認する**（反復1 で「緑の理由が誤っていた」欠陥が4件あった）

- [ ] **Step 3: 反復2 のチェックリストを確認する**

設計書に対する実装漏れを目視で確認する。

- [ ] `CURRENT_ITERATION = 2`（Task 1）
- [ ] `defeat` に撃破源、支援塔2種の貢献（Task 1, 2）
- [ ] エフェクトの描画・優先度破棄・上限（Task 3, 4）
- [ ] reduced-motion と `aria-live`（Task 5）
- [ ] クールダウンが配置札のみ（Task 6）
- [ ] 拒否理由が盤面直下（Task 7）
- [ ] 捨札が UI から到達可能（Task 8）
- [ ] 設置マス22・城壁の外（Task 9）
- [ ] 魔力炉の上限撤廃（Task 10）
- [ ] 判定7項目の集計（Task 11）
- [ ] リザルト2段階（Task 12）
- [ ] 較正の数値閾値（Task 13）
- [ ] ホームボタンとの重なり解消（Task 14）

- [ ] **Step 4: 実プレイ前の準備を記録する**

実プレイの前に **localStorage の旧ログをクリアする**必要がある（スキーマ移行は未実装）。この手順を PR の説明に書く。

```
実プレイの前に、ブラウザの開発者ツールで以下を実行してください。
localStorage.removeItem('ashen-rampart-play-log')
```

**注意:** キー名は `infrastructure/play-log/local-storage-play-log.ts` の実際の定数に合わせる。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "chore(ashen-rampart): 反復2 の統合確認と既存テストの追随

npm run ci 全緑。イベント形状の変更に伴う既存テストの更新を含む。"
```

---

## 実装後の手順（コードではない）

1. PR を作成する。本文に localStorage のクリア手順を明記する
2. CI 全緑を確認してマージする
3. **ユーザーが自分で組んだデッキで3ラン実プレイする**
4. 各ランで「勝敗の理由」を記録 → 集計を確認 → 判定7項目を Issue #197 にコメントする
5. 反証条件のいずれかに当たった場合は、どれに当たったかを記録して停止する

**この反復では、実装完了は判定ではない。** DoD（`npm run ci` 緑）と CoS（実プレイ7項目の記録）は別物であり、CI 緑は完了ではない。
