# 灰燼の城壁 反復1 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** カードを14種に増やし、デッキ構築 UI・シード可変化・オンボーディングを入れて、「ランごとに違う配分の問題になるか」を判定できる状態にする。

**Architecture:** 既存の `stepTick(state, actions, map)` 純粋関数の構造を保ったまま、敵の状態（地上化・足止め）と塔の射程算出を関数に集約する。飛行判定は現在4箇所に散っている `getEnemySpec(...).flying` の直接参照を `isEnemyFlying(enemy, tick)` に統一する。カウントダウンは新しい状態を増やさず、ウェーブの `startTick` を生成時にずらすことで実現する。

**Tech Stack:** React 19 + TypeScript + styled-components / Jest 30 + @testing-library/react

**Spec:** `docs/superpowers/specs/2026-07-30-ashen-rampart-iteration1-design.md`（Issue #194）

## Global Constraints

- コメント・テスト記述は日本語。コード（変数名・関数名）は英語
- `any` 禁止。named export のみ。ファイル名 kebab-case（React コンポーネントは PascalCase.tsx）
- `domain/` は外部依存なし。`application/` は `domain/` のみ参照。`presentation/` は副作用のオーケストレーションを use-case 経由で行う（`domain/` の純粋関数・型は直接 import 可）
- 他 feature への参照禁止。`dangerouslySetInnerHTML` 禁止
- `stepTick` は乱数を取らない純粋関数。引数の state を変更しない。署名を変えない
- **赤 `#8b2635` は危険専用**。危険テキストは `COLORS.dangerText`（`#e8737f`）。好機は `COLORS.opportunity`（`#e8a33d`）。タッチ対象は最小44px
- **`git add` はパス明示**（`git add -A` / `git add .` 禁止）
- コミットメッセージは日本語 Conventional Commits。末尾に `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- ブランチ: `feature/ashen-rampart-iteration1`（main から作成。設計書の docs PR マージ後）
- テストは対象と同じディレクトリに `*.test.ts(x)`
- **恒真式・早期 return・`undefined` 比較で無検証になるテストは禁止**（この作品では過去に6回、同種の欠陥が見つかっている）
- **テストの期待値を緩めることは禁止**。実装とテストが食い違ったら、どちらが正しいかを計算してから判断し、計算過程を報告に書く
- 実行前に `git checkout main && git pull --ff-only && git checkout -b feature/ashen-rampart-iteration1`

---

## ファイル構成

| パス | 扱い | 責務 |
|---|---|---|
| `domain/combat/combat-state.ts` | 変更 | `ActiveEnemy` に `groundedUntilTick` / `stunnedUntilTick` 追加、`levyOptions` 追加、`COUNTDOWN_TICKS` と `countdownLeftAt` 追加、ウェーブの startTick シフト |
| `domain/combat/enemy-status.ts` | 新規 | `isEnemyFlying(enemy, tick)` / `isEnemyStunned(enemy, tick)`（純粋） |
| `domain/combat/step-tick.ts` | 変更 | 飛行判定の統一、`effectiveRange` 新設、新カードの振る舞い、徴発の選択処理 |
| `domain/cards/card-definition.ts` | 変更 | `TowerSpec.aura` に `towerRangeBonus` 追加、`TrapSpec` に `groundedTicks` / `stunTicks` 追加、`TowerSpec` に `heavyBonusThreshold` / `heavyBonusMultiplier` 追加、`LevySpec` 追加 |
| `domain/cards/card-pool.ts` | 変更 | カード6種追加（計14種）、プリセット2種を14種前提で再構成 |
| `domain/cards/deck.ts` | 変更 | `peekTop(deck, n)` / `takeFromPeek(deck, index)` 追加 |
| `domain/cards/deck-builder.ts` | 新規 | `validateDeck(cards): DeckValidation`（UI と CI で共用） |
| `domain/combat/run-simulation.ts` | 変更 | `greedyStrategy` に徴発の選択を追加 |
| `domain/combat/balance.test.ts` | 変更 | 新カード6種の支配戦略テスト追加、較正値更新 |
| `application/use-cases/start-run.ts` | 変更 | 任意のカード配列からランを開始できるようにする（構築デッキ対応） |
| `presentation/DeckBuilder.tsx` | 新規 | デッキ構築 UI |
| `presentation/StartOverlay.tsx` | 新規 | 開始前オーバーレイ |
| `presentation/LevyChoice.tsx` | 新規 | 徴発の選択オーバーレイ |
| `presentation/CountdownDisplay.tsx` | 新規 | カウントダウン表示 |
| `presentation/useAshenRampartGame.ts` | 変更 | シード可変化、デッキ受け取り、徴発の選択、画面遷移 |
| `presentation/AshenRampartGame.tsx` | 変更 | 構築 → オーバーレイ → ラン の遷移 |
| `presentation/card-text.ts` | 新規 | カードの「効かない相手」文言（構築 UI と手札で共用） |

---

### Task 1: 敵の状態（地上化・足止め）と飛行判定の統一

新カードの土台。**飛行判定が現在4箇所に散っており、1箇所でも漏れると「地上化した敵に当たらない」または「飛行敵に当たる」が起きる**（設計書 §10 の既知のリスク）。まず判定を関数に集約する。

**Files:**
- Create: `domain/combat/enemy-status.ts`
- Create: `domain/combat/enemy-status.test.ts`
- Modify: `domain/combat/combat-state.ts`（`ActiveEnemy` に2フィールド追加）
- Modify: `domain/combat/step-tick.ts`（4箇所の飛行判定を置換、`moveEnemies` に足止め）
- Test: `domain/combat/step-tick-status.test.ts`（新規）

**Interfaces:**
- Consumes: 既存の `ActiveEnemy` / `getEnemySpec` / `CombatState`
- Produces: `isEnemyFlying(enemy, tick): boolean` / `isEnemyStunned(enemy, tick): boolean`。`ActiveEnemy.groundedUntilTick: number` / `ActiveEnemy.stunnedUntilTick: number`（既定 0）。以降の全タスクがこれを使う

- [ ] **Step 1: 失敗するテストを書く（純粋関数）**

```ts
// src/features/ashen-rampart/domain/combat/enemy-status.test.ts
/**
 * 敵の状態判定のテスト
 *
 * 飛行判定は射撃・範囲巻き込み・罠・業火の4経路から呼ばれる。
 * 直接 getEnemySpec(...).flying を見ていた実装を関数に集約したため、
 * ここが唯一の真実になる。
 */
import { isEnemyFlying, isEnemyStunned } from './enemy-status';
import type { ActiveEnemy } from './combat-state';

const enemy = (enemyId: string, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1,
  enemyId,
  hp: 10,
  maxHp: 10,
  progress: 0,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
  ...overrides,
});

describe('isEnemyFlying', () => {
  it('鴉は飛行している', () => {
    expect(isEnemyFlying(enemy('raven'), 10)).toBe(true);
  });

  it('地上の敵は飛行していない', () => {
    expect(isEnemyFlying(enemy('grunt'), 10)).toBe(false);
  });

  it('地上化中の鴉は飛行していない', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 30)).toBe(false);
  });

  it('地上化が切れた鴉は再び飛行する', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 51)).toBe(true);
  });

  it('地上化の境界 tick では まだ地上にいる', () => {
    expect(isEnemyFlying(enemy('raven', { groundedUntilTick: 50 }), 50)).toBe(false);
  });

  it('地上の敵に地上化を掛けても飛行状態は変わらない', () => {
    expect(isEnemyFlying(enemy('grunt', { groundedUntilTick: 50 }), 30)).toBe(false);
  });
});

describe('isEnemyStunned', () => {
  it('既定では足止めされていない', () => {
    expect(isEnemyStunned(enemy('grunt'), 10)).toBe(false);
  });

  it('足止め中は true', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 20)).toBe(true);
  });

  it('境界 tick では まだ足止めされている', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 40)).toBe(true);
  });

  it('切れたら false', () => {
    expect(isEnemyStunned(enemy('grunt', { stunnedUntilTick: 40 }), 41)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/enemy-status --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: `ActiveEnemy` に2フィールドを追加**

`combat-state.ts` の `ActiveEnemy` に追記する。

```ts
  alive: boolean;
  leaked: boolean;
  /** 地上化が切れる tick。この tick までは飛行敵も地上として扱う（落網） */
  groundedUntilTick: number;
  /** 足止めが切れる tick。この tick までは移動しない（石壁） */
  stunnedUntilTick: number;
```

`spawnAt`（`step-tick.ts`）で敵を生成している箇所に `groundedUntilTick: 0, stunnedUntilTick: 0` を追加する。

- [ ] **Step 4: `enemy-status.ts` を実装**

```ts
// src/features/ashen-rampart/domain/combat/enemy-status.ts
/**
 * 灰燼の城壁 - 敵の状態判定（純粋）
 *
 * 飛行判定は射撃・範囲巻き込み・罠・業火の4経路から呼ばれる。
 * 以前は各経路が getEnemySpec(...).flying を直接見ていたため、
 * 地上化（落網）のような状態を足すと1箇所でも漏れれば矛盾が起きた。
 * 判定をこの関数に集約し、ここを唯一の真実にする。
 */
import type { ActiveEnemy } from './combat-state';
import { getEnemySpec } from './enemies';

/**
 * その tick 時点で敵が飛行しているか
 *
 * 地上化中（groundedUntilTick 以下）は飛行敵も地上として扱う。
 * 地上の敵に地上化が掛かっても意味を持たない。
 */
export const isEnemyFlying = (enemy: ActiveEnemy, tick: number): boolean =>
  getEnemySpec(enemy.enemyId).flying && tick > enemy.groundedUntilTick;

/** その tick 時点で敵が足止めされているか（移動しない） */
export const isEnemyStunned = (enemy: ActiveEnemy, tick: number): boolean =>
  tick <= enemy.stunnedUntilTick;
```

- [ ] **Step 5: `step-tick.ts` の飛行判定4箇所を置換**

以下の4箇所を `isEnemyFlying(enemy, tick)` に置き換える。`tick` を引数で受け取る必要がある関数には追加する。

| 箇所 | 現在のコード |
|---|---|
| `applyTraps` 内 | `if (getEnemySpec(enemy.enemyId).flying) return;` |
| `selectTowerTarget` 内 | `.filter((e) => spec.hitsFlying \|\| !getEnemySpec(e.enemyId).flying)` |
| `applySplashDamage` 内 | `if (!spec.hitsFlying && getEnemySpec(other.enemyId).flying) return;` |
| `applyBlasts` 内 | `if (!enemy.alive \|\| getEnemySpec(enemy.enemyId).flying) return;` |

`import { getEnemySpec }` はウェーブ生成と移動速度で引き続き使うので残す。**`grep -n "flying" step-tick.ts` で `isEnemyFlying` 以外の flying 参照が残っていないことを確認すること。**

- [ ] **Step 6: `moveEnemies` に足止めを実装**

```ts
// moveEnemies 内、既存の「spawnTick === tick なら動かない」判定の直後に追加
    if (isEnemyStunned(enemy, tick)) return enemy;
```

- [ ] **Step 7: 統合テストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-status.test.ts
/**
 * 地上化・足止めが stepTick の各経路に効くことのテスト
 *
 * 飛行判定は4経路（射撃・範囲・罠・業火）から呼ばれる。
 * 1箇所でも漏れると矛盾が起きるため、経路ごとに個別に検証する。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** 鴉1体だけを経路 index 5 に出す */
const ravenWave: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
];

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

/** 鴉を出現させたうえで地上化を掛けた状態を作る */
const groundedRaven = (until: number): CombatState => {
  const spawned = advance(createCombatState(emptyDeck, ravenWave), 1);
  const raven = spawned.enemies[0];
  expect(raven).toBeDefined();
  return {
    ...spawned,
    enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: until })),
  };
};

describe('地上化した飛行敵に地上専用の攻撃が当たる', () => {
  it('射撃: 弓兵（地上のみ）が地上化した鴉を撃てる', () => {
    const state: CombatState = {
      ...groundedRaven(200),
      towers: [{ cardId: 'arrow-tower', pos: { x: 5, y: 2 }, cooldownLeft: 0 }],
    };
    const after = advance(state, 20);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(raven && raven.hp < raven.maxHp).toBe(true);
  });

  it('罠: 棘罠（地上のみ）が地上化した鴉に発動する', () => {
    const spawned = advance(createCombatState(emptyDeck, ravenWave), 1);
    const state: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: 400 })),
      // 経路 index 5 は (4,2)。そこに罠を置く
      traps: [{ cardId: 'spike-trap', pos: { x: 4, y: 2 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 5);
    expect(after.traps[0]?.usesLeft).toBeLessThan(3);
  });

  it('地上化が切れると弓兵は当てられなくなる', () => {
    const state: CombatState = {
      ...groundedRaven(3),
      towers: [{ cardId: 'arrow-tower', pos: { x: 5, y: 2 }, cooldownLeft: 0 }],
    };
    // 地上化が切れた後の HP を基準に、さらに進めても減らないことを見る
    const afterGrounded = advance(state, 5);
    const hpAtEnd = afterGrounded.enemies[0]?.hp;
    expect(hpAtEnd).toBeDefined();
    const later = advance(afterGrounded, 20);
    expect(later.enemies[0]?.hp).toBe(hpAtEnd);
  });
});

describe('足止め', () => {
  it('足止め中は進行度が変わらない', () => {
    const gruntWave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const spawned = advance(createCombatState(emptyDeck, gruntWave), 1);
    const stunned: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, stunnedUntilTick: 100 })),
    };
    const before = stunned.enemies[0]?.progress;
    expect(before).toBeDefined();
    const after = advance(stunned, 20);
    expect(after.enemies[0]?.progress).toBe(before);
  });

  it('足止めが切れると再び進む', () => {
    const gruntWave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const spawned = advance(createCombatState(emptyDeck, gruntWave), 1);
    const stunned: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, stunnedUntilTick: 5 })),
    };
    const atEnd = advance(stunned, 5);
    const progressAtEnd = atEnd.enemies[0]?.progress;
    expect(progressAtEnd).toBeDefined();
    const later = advance(atEnd, 10);
    expect(later.enemies[0]?.progress).toBeGreaterThan(progressAtEnd ?? 0);
  });
});
```

- [ ] **Step 8: 全テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/enemy-status.ts src/features/ashen-rampart/domain/combat/enemy-status.test.ts src/features/ashen-rampart/domain/combat/combat-state.ts src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-status.test.ts
git commit -m "feat(ashen-rampart): 地上化・足止めの状態と飛行判定の統一を追加

- 4経路に散っていた flying 直接参照を isEnemyFlying に集約
- ActiveEnemy に groundedUntilTick / stunnedUntilTick を追加
- 経路ごと（射撃・罠）に地上化が効くことを個別に検証

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 射程算出の関数化と鍛冶場のオーラ拡張

**Files:**
- Modify: `domain/cards/card-definition.ts`（`aura` に `towerRangeBonus` 追加）
- Modify: `domain/combat/step-tick.ts`（`effectiveRange` 新設、射程参照を置換）
- Test: `domain/combat/step-tick-range.test.ts`（新規）

**Interfaces:**
- Consumes: Task 1 の成果、既存の `effectiveDamage`
- Produces: `effectiveRange(state, towerIndex, map): number`。`TowerSpec.aura` が `{ towerDamageBonus?: number; towerRangeBonus?: number }` になる

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-range.test.ts
/**
 * 塔の実効射程のテスト
 *
 * 射程算出を effectiveRange に集約する。effectiveDamage と同じ形で、
 * 加算の二重適用を防ぐために算出責務を1箇所に閉じる。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { effectiveRange } from './step-tick';
import { PLAINS_WAVES } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const withTowers = (towers: { cardId: string; x: number; y: number }[]): CombatState => ({
  ...createCombatState(emptyDeck, PLAINS_WAVES),
  towers: towers.map((t) => ({ cardId: t.cardId, pos: { x: t.x, y: t.y }, cooldownLeft: 0 })),
});

describe('effectiveRange', () => {
  it('支援が無ければカード定義の射程そのまま', () => {
    const state = withTowers([{ cardId: 'arrow-tower', x: 1, y: 2 }]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('隣接する鍛冶場が射程を +0.6 する', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 2, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(2.2, 5);
  });

  it('隣接していない鍛冶場は効かない', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 5, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('鍛冶場2基なら +1.2（加算）', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 2, y: 2 },
      { cardId: 'forge', x: 1, y: 2 },
      { cardId: 'forge', x: 3, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(2.8, 5);
  });

  it('篝火は射程を変えない（火力オーラのみ）', () => {
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'beacon', x: 2, y: 2 },
    ]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBeCloseTo(1.6, 5);
  });

  it('鍛冶場は火力を変えない（射程オーラのみ）', async () => {
    const { effectiveDamage } = await import('./step-tick');
    const state = withTowers([
      { cardId: 'arrow-tower', x: 1, y: 2 },
      { cardId: 'forge', x: 2, y: 2 },
    ]);
    expect(effectiveDamage(state, 0, PLAINS_MAP)).toBe(6);
  });

  it('オーラ塔自身の実効射程は 0', () => {
    const state = withTowers([{ cardId: 'forge', x: 1, y: 2 }]);
    expect(effectiveRange(state, 0, PLAINS_MAP)).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-range --no-coverage`
Expected: FAIL（`effectiveRange` 未定義・`forge` 未定義）

- [ ] **Step 3: `TowerSpec.aura` を拡張**

`card-definition.ts` の `TowerSpec` を変更する。

```ts
  /**
   * オーラ効果（定義されていれば攻撃せず、隣接タワーを強化する）
   *
   * 篝火は火力、鍛冶場は射程を上げる。両方を持つカードは想定していないが、
   * 型としては共存できる（加算されるだけで矛盾しない）。
   */
  aura?: { towerDamageBonus?: number; towerRangeBonus?: number };
```

既存の `beacon` は `aura: { towerDamageBonus: 0.25 }` のままで型が通る。`effectiveDamage` の `otherSpec.aura.towerDamageBonus` は `?? 0` でフォールバックする形に直す。

- [ ] **Step 4: `effectiveRange` を実装**

`step-tick.ts` に `effectiveDamage` の隣へ追加する。

```ts
/**
 * 塔の実効射程
 *
 * 基礎射程 + Σ隣接オーラの射程加算。effectiveDamage と同じく、
 * 算出責務をこの関数だけに持たせて加算の二重適用を防ぐ。
 * オーラ塔自身は攻撃しないため 0 を返す。
 */
export const effectiveRange = (
  state: CombatState,
  towerIndex: number,
  map: StageMap
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
  const bonus = state.towers.reduce((sum, other) => {
    const otherSpec = getCardDefinition(other.cardId).tower;
    const rangeBonus = otherSpec?.aura?.towerRangeBonus;
    if (rangeBonus === undefined) return sum;
    const adjacent =
      Math.abs(other.pos.x - tower.pos.x) <= 1 && Math.abs(other.pos.y - tower.pos.y) <= 1;
    return adjacent ? sum + rangeBonus : sum;
  }, 0);
  return spec.range + bonus;
};
```

> `map` は現状使わないが、`effectiveDamage` と署名を揃えて呼び出し側の一貫性を保つ。将来地形が射程に影響する場合の受け口でもある。

- [ ] **Step 5: 射程の参照箇所を `effectiveRange` に置換**

`selectTowerTarget` が `spec.range` を直接見ているので、`effectiveRange` の結果を受け取る形に変える。`applyTowerShots` から渡す。

```ts
// applyTowerShots 内、effectiveDamage を求めている箇所の隣
    const range = effectiveRange(stateForDamage, towerIndex, map);
    const target = selectTowerTarget(moved, hpById, tower, spec, range, map, tick);
```

`selectTowerTarget` の射程フィルタを `<= range` に変える。**`grep -n "spec.range" step-tick.ts` で直接参照が残っていないことを確認すること。**

- [ ] **Step 6: `forge` を仮追加してテストを通す**

Task 3 でカード6種をまとめて追加するが、このタスクのテストは `forge` を必要とする。`card-pool.ts` に `forge` のみ先に追加する（他5種は Task 3）。

```ts
  {
    id: 'forge',
    name: '鍛冶場',
    type: 'tower',
    cost: 2,
    description: '攻撃しないが、隣接する塔の射程を +0.6 する。',
    tower: {
      range: 0,
      damage: 0,
      cooldownTicks: 0,
      splashRadius: 0,
      hitsFlying: false,
      aura: { towerRangeBonus: 0.6 },
    },
  },
```

`card-pool.test.ts` の「カードは8種ある」を9種に更新する。**Task 3 で14種に更新するので、ここは通過点である。**

- [ ] **Step 7: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-definition.ts src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-range.test.ts
git commit -m "feat(ashen-rampart): 実効射程の算出を関数化し鍛冶場を追加

- effectiveRange を新設し射程の直接参照を廃止（二重適用の防止）
- aura を火力/射程の両対応に拡張。篝火と鍛冶場が対になる

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 残り5種のカード定義とスペック拡張

**Files:**
- Modify: `domain/cards/card-definition.ts`（`TrapSpec` / `TowerSpec` / `LevySpec` の拡張）
- Modify: `domain/cards/card-pool.ts`（残り5種追加＝計14種、プリセット再構成）
- Modify: `domain/cards/card-pool.test.ts`

**Interfaces:**
- Consumes: Task 2 の `aura` 拡張
- Produces: カード14種。`TrapSpec` に `groundedTicks?` / `stunTicks?`、`TowerSpec` に `heavyBonusThreshold?` / `heavyBonusMultiplier?`、`CardType` に `'levy'` 追加、`LevySpec { peekCount: number }`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// card-pool.test.ts に追記（既存の describe は残す。「カードは8種ある」→14種に更新）
describe('反復1で追加したカード', () => {
  it('カードは14種ある', () => {
    expect(CARD_IDS).toHaveLength(14);
  });

  it('落網は飛行を地上化する罠（ダメージなし）', () => {
    const card = getCardDefinition('snare-net');
    expect(card.cost).toBe(2);
    expect(card.type).toBe('trap');
    expect(card.trap?.damage).toBe(0);
    expect(card.trap?.uses).toBe(3);
    expect(card.trap?.groundedTicks).toBe(120);
    expect(card.trap?.stunTicks).toBeUndefined();
  });

  it('石壁は地上を足止めする罠（ダメージなし）', () => {
    const card = getCardDefinition('stone-wall');
    expect(card.cost).toBe(1);
    expect(card.trap?.damage).toBe(0);
    expect(card.trap?.uses).toBe(3);
    expect(card.trap?.stunTicks).toBe(40);
    expect(card.trap?.groundedTicks).toBeUndefined();
  });

  it('投石機は射程3.0の範囲2で、地上のみ', () => {
    const card = getCardDefinition('catapult');
    expect(card.cost).toBe(3);
    expect(card.tower).toMatchObject({
      range: 3.0,
      damage: 8,
      cooldownTicks: 24,
      splashRadius: 2,
      hitsFlying: false,
    });
  });

  it('徹甲弩は飛行可で、HP40以上に2倍', () => {
    const card = getCardDefinition('piercer');
    expect(card.cost).toBe(3);
    expect(card.tower).toMatchObject({
      range: 1.8,
      damage: 7,
      cooldownTicks: 10,
      splashRadius: 0,
      hitsFlying: true,
      heavyBonusThreshold: 40,
      heavyBonusMultiplier: 2,
    });
  });

  it('徴発は山札の上から3枚を見る即時カード', () => {
    const card = getCardDefinition('levy');
    expect(card.cost).toBe(1);
    expect(card.type).toBe('levy');
    expect(card.levy?.peekCount).toBe(3);
  });

  it('飛行に当たる塔は弩砲と徹甲弩の2種になった（必須枠の解消）', () => {
    const flying = CARD_IDS.filter((id) => getCardDefinition(id).tower?.hitsFlying === true);
    expect(flying.sort()).toEqual(['ballista', 'piercer']);
  });

  it('範囲攻撃を持つ塔は火砲台と投石機の2種になった', () => {
    const splash = CARD_IDS.filter((id) => (getCardDefinition(id).tower?.splashRadius ?? 0) > 0);
    expect(splash.sort()).toEqual(['catapult', 'cannon-tower'].sort());
  });

  it('全14種が既知の配置先種別を持つ', () => {
    CARD_IDS.forEach((id) => {
      expect(['slot', 'path', 'none']).toContain(placementKindOf(getCardDefinition(id)));
    });
  });
});
```

プリセットのテストは既存のまま（20枚ちょうど・同名3枚以内）で通る必要がある。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards --no-coverage`
Expected: FAIL（14種でない・新カード未定義）

- [ ] **Step 3: スペックを拡張**

`card-definition.ts` を変更する。

```ts
export type CardType = 'tower' | 'trap' | 'spell' | 'reactor' | 'ember' | 'levy';

/** 罠性能（経路マスに設置、踏んだ敵に発動） */
export interface TrapSpec {
  damage: number;
  /** 発動可能回数 */
  uses: number;
  /** 飛行敵を地上化する tick 数（落網）。持たない罠は undefined */
  groundedTicks?: number;
  /** 地上敵を足止めする tick 数（石壁）。持たない罠は undefined */
  stunTicks?: number;
}
```

`TowerSpec` に追記する。

```ts
  /**
   * 重装特効のしきい値（最大HP）。これ以上の敵に heavyBonusMultiplier を掛ける
   *
   * 徹甲弩は低HP敵に非効率・高HP敵に強いという形で、
   * 「効率の順位が敵によって入れ替わる」状態を作るための仕組み。
   */
  heavyBonusThreshold?: number;
  /** 重装特効の倍率 */
  heavyBonusMultiplier?: number;
```

`LevySpec` を追加し `CardDefinition` に足す。

```ts
/** 徴発（山札の上を見て1枚選ぶ） */
export interface LevySpec {
  /** 提示する枚数 */
  peekCount: number;
}
```

`placementKindOf` に `levy` を追加する（対象を取らないので `'none'`）。

```ts
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap') return 'path';
  if (card.type === 'spell' || card.type === 'levy') return 'none';
  return 'slot';
};
```

- [ ] **Step 4: 残り5種を追加**

`card-pool.ts` の `CARDS` に追加する（`forge` は Task 2 で追加済み）。

```ts
  {
    id: 'snare-net',
    name: '落網',
    type: 'trap',
    cost: 2,
    description: '経路に張る網。踏んだ飛行の敵を120tick 地に落とす。ダメージはない。',
    trap: { damage: 0, uses: 3, groundedTicks: 120 },
  },
  {
    id: 'stone-wall',
    name: '石壁',
    type: 'trap',
    cost: 1,
    description: '経路を塞ぐ石。踏んだ地上の敵を40tick 足止めする。ダメージはない。',
    trap: { damage: 0, uses: 3, stunTicks: 40 },
  },
  {
    id: 'catapult',
    name: '投石機',
    type: 'tower',
    cost: 3,
    description: '遠くまで届き広く砕くが、間隔は長い。飛行には当たらない。',
    tower: { range: 3.0, damage: 8, cooldownTicks: 24, splashRadius: 2, hitsFlying: false },
  },
  {
    id: 'piercer',
    name: '徹甲弩',
    type: 'tower',
    cost: 3,
    description: '硬い敵を貫く。最大HP40以上の敵には2倍。飛行も撃てるが雑兵相手は非効率。',
    tower: {
      range: 1.8,
      damage: 7,
      cooldownTicks: 10,
      splashRadius: 0,
      hitsFlying: true,
      heavyBonusThreshold: 40,
      heavyBonusMultiplier: 2,
    },
  },
  {
    id: 'levy',
    name: '徴発',
    type: 'levy',
    cost: 1,
    description: '山札の上から3枚を見て1枚を手札に加える。残りは墓地へ。',
    levy: { peekCount: 3 },
  },
```

- [ ] **Step 5: プリセット2種を14種前提で再構成**

各20枚・同名3枚以内。**プリセット間の差が魔力炉の数だけにならないよう、答えの選び方を変える。**

```ts
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift',
    name: '速攻型',
    description: '安い札を多く回す。対空は弩砲、群れは火砲台。',
    cards: [
      ...repeat('reactor', 2),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 2),
      ...repeat('cannon-tower', 2),
      ...repeat('spike-trap', 2),
      ...repeat('stone-wall', 2),
      ...repeat('mud-time', 2),
      ...repeat('ember-blast', 2),
      ...repeat('levy', 2),
      'beacon',
    ],
  },
  heavy: {
    id: 'heavy',
    name: '重厚型',
    description: '射程と特効で固める。対空は落網と徹甲弩、群れは投石機。',
    cards: [
      ...repeat('reactor', 3),
      ...repeat('piercer', 3),
      ...repeat('catapult', 2),
      ...repeat('snare-net', 2),
      ...repeat('forge', 2),
      ...repeat('arrow-tower', 2),
      ...repeat('ember-blast', 2),
      ...repeat('beacon', 2),
      ...repeat('levy', 2),
    ],
  },
};
```

> 2つのプリセットで**対空の答えが違う**（弩砲 / 落網＋徹甲弩）ことが要点である。PoC ではどちらも弩砲を積むしかなかった。

- [ ] **Step 6: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards --no-coverage`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-definition.ts src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): カードを14種に拡張しプリセットを再構成

- 落網/石壁/投石機/徹甲弩/徴発を追加（鍛冶場は前コミット）
- 飛行への答えを弩砲・落網・徹甲弩の3つに、群れへの答えを2つにして必須枠を解消
- プリセット2種で対空の答えが異なる構成にした

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 罠の新効果（落網の地上化・石壁の足止め）

**Files:**
- Modify: `domain/combat/step-tick.ts`（`applyTraps`）
- Test: `domain/combat/step-tick-traps.test.ts`（新規）

**Interfaces:**
- Consumes: Task 1 の `isEnemyFlying` / `groundedUntilTick` / `stunnedUntilTick`、Task 3 の `TrapSpec.groundedTicks` / `stunTicks`
- Produces: `applyTraps` が罠の種類に応じて状態を付与するようになる。`TickEvent` に変更なし（既存の `trap` イベントを流用）

**実装方針:** 既存の `applyTraps` は「ダメージを与えて `usesLeft` を減らす」だけ。ここに「地上化」「足止め」を足す。**落網は飛行敵にのみ発動し、石壁は地上敵にのみ発動する**（発動条件が既存の棘罠と逆になるカードがある）ため、罠ごとに対象判定を分ける。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-traps.test.ts
/**
 * 罠の新効果のテスト
 *
 * 落網は飛行にのみ発動し、石壁は地上にのみ発動する。
 * 既存の棘罠（地上にダメージ）と合わせて、罠の対象判定が3種類になる。
 */
import { createCombatState } from './combat-state';
import type { CombatState, PlacedTrap } from './combat-state';
import { stepTick } from './step-tick';
import { isEnemyFlying, isEnemyStunned } from './enemy-status';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const waveOf = (enemyId: string, spawnPathIndex: number): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count: 1, spawnIntervalTicks: 0, spawnPathIndex }] },
];

const trap = (cardId: string, x: number, y: number): PlacedTrap => ({
  cardId,
  pos: { x, y },
  usesLeft: 3,
  hitEnemyIds: [],
});

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('落網（飛行を地上化）', () => {
  it('飛行敵を踏ませると地上化し、回数を消費する', () => {
    // 鴉は経路 index 5 = (4,2) から出る
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    const after = advance(state, 5);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(after.traps[0]?.usesLeft).toBe(2);
    expect(raven && isEnemyFlying(raven, after.tick)).toBe(false);
  });

  it('地上化は120tick後に切れる', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    const caught = advance(state, 3);
    const raven = caught.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.groundedUntilTick).toBe(caught.tick + 120 - 1);
  });

  it('地上敵には発動しない（回数を消費しない）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('snare-net', 1, 3)],
    };
    const after = advance(state, 30);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });

  it('ダメージを与えない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    const after = advance(state, 5);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.hp).toBe(raven?.maxHp);
  });
});

describe('石壁（地上を足止め）', () => {
  it('地上敵を踏ませると足止めし、回数を消費する', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const after = advance(state, 15);
    const grunt = after.enemies[0];
    expect(grunt).toBeDefined();
    expect(after.traps[0]?.usesLeft).toBe(2);
    expect(grunt && isEnemyStunned(grunt, after.tick)).toBe(true);
  });

  it('足止め中は進行度が変わらない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const caught = advance(state, 15);
    const progressWhenCaught = caught.enemies[0]?.progress;
    expect(progressWhenCaught).toBeDefined();
    const after = advance(caught, 20);
    expect(after.enemies[0]?.progress).toBe(progressWhenCaught);
  });

  it('飛行敵には発動しない（回数を消費しない）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('stone-wall', 4, 2)],
    };
    const after = advance(state, 10);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });

  it('ダメージを与えない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const after = advance(state, 15);
    const grunt = after.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt?.hp).toBe(grunt?.maxHp);
  });
});

describe('棘罠（既存の回帰）', () => {
  it('地上敵にダメージを与え、飛行には発動しない', () => {
    const ground: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('spike-trap', 1, 3)],
    };
    const afterGround = advance(ground, 15);
    const grunt = afterGround.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt && grunt.hp < grunt.maxHp).toBe(true);

    const air: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('spike-trap', 4, 2)],
    };
    const afterAir = advance(air, 10);
    expect(afterAir.traps[0]?.usesLeft).toBe(3);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-traps --no-coverage`
Expected: FAIL（地上化・足止めが付与されない）

- [ ] **Step 3: `applyTraps` を実装**

罠ごとに対象判定を分け、効果を付与する。既存の `applyTraps` を次の形に置き換える（引数・戻り値の形は変えない。`stunnedUntilTick` / `groundedUntilTick` を返すため、敵の状態変更を戻す仕組みを追加する）。

```ts
/**
 * 罠の発動
 *
 * 罠は3種類の対象判定を持つ:
 *   棘罠   … 地上にダメージ
 *   落網   … 飛行を地上化（ダメージなし）
 *   石壁   … 地上を足止め（ダメージなし）
 * 発動条件が逆のカードがあるため、対象判定は罠ごとに決める。
 *
 * 敵の状態（地上化・足止め）は statusById に積み、呼び出し側が敵へ反映する。
 * hpById と同じ「下書きを集めて最後に一括反映」の形を維持する。
 */
const applyTraps = (
  traps: readonly PlacedTrap[],
  moved: readonly ActiveEnemy[],
  hpById: Map<number, number>,
  statusById: Map<number, { groundedUntilTick?: number; stunnedUntilTick?: number }>,
  tick: number,
  map: StageMap,
  events: TickEvent[]
): PlacedTrap[] =>
  traps.map((trap, trapIndex) => {
    if (trap.usesLeft <= 0) return trap;
    const spec = getCardDefinition(trap.cardId).trap;
    if (!spec) return trap;
    let usesLeft = trap.usesLeft;
    const hitEnemyIds = [...trap.hitEnemyIds];
    moved.forEach((enemy) => {
      if (!enemy.alive || usesLeft <= 0) return;
      if (hitEnemyIds.includes(enemy.id)) return;
      const flying = isEnemyFlying(enemy, tick);
      // 落網は飛行のみ、それ以外の罠は地上のみに発動する
      const targetsFlying = spec.groundedTicks !== undefined;
      if (targetsFlying !== flying) return;
      const pos = positionOf(enemy.progress, map.path);
      if (Math.hypot(pos.x - trap.pos.x, pos.y - trap.pos.y) > TRAP_TRIGGER_DISTANCE) return;

      if (spec.damage > 0) {
        hpById.set(enemy.id, (hpById.get(enemy.id) ?? 0) - spec.damage);
      }
      const status = statusById.get(enemy.id) ?? {};
      if (spec.groundedTicks !== undefined) {
        status.groundedUntilTick = tick + spec.groundedTicks - 1;
      }
      if (spec.stunTicks !== undefined) {
        status.stunnedUntilTick = tick + spec.stunTicks - 1;
      }
      statusById.set(enemy.id, status);

      hitEnemyIds.push(enemy.id);
      usesLeft -= 1;
      events.push({ kind: 'trap', trapIndex, targetId: enemy.id });
    });
    return { ...trap, usesLeft, hitEnemyIds };
  });
```

`TRAP_TRIGGER_DISTANCE` を定数として切り出す（現在は `0.5` のマジックナンバー。`enemy-stack.ts` の `STACK_DISTANCE` と偶然同値なので別名にする）。

```ts
/** 罠が発動する距離（セル）。表示側の STACK_DISTANCE とは無関係 */
export const TRAP_TRIGGER_DISTANCE = 0.5;
```

- [ ] **Step 4: `resolveDamage` で状態を反映**

`stepTick` に `statusById` を用意し、`resolveDamage` が HP と一緒に状態も反映する形にする。

```ts
  const statusById = new Map<number, { groundedUntilTick?: number; stunnedUntilTick?: number }>();
```

`resolveDamage` を変更する。

```ts
const resolveDamage = (
  moved: readonly ActiveEnemy[],
  hpById: Map<number, number>,
  statusById: Map<number, { groundedUntilTick?: number; stunnedUntilTick?: number }>,
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
    events.push({ kind: 'defeat', enemyId: enemy.id });
    return { ...withStatus, hp: 0, alive: false };
  });
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-traps.test.ts
git commit -m "feat(ashen-rampart): 落網の地上化と石壁の足止めを実装

- 罠の対象判定を3種類（地上ダメージ/飛行を地上化/地上を足止め）に分岐
- 敵の状態は statusById に集めて resolveDamage で一括反映（hpById と同じ形）
- 罠の発動距離をマジックナンバーから TRAP_TRIGGER_DISTANCE へ

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 徹甲弩の重装特効と投石機

**Files:**
- Modify: `domain/combat/step-tick.ts`（`effectiveDamage` に特効、`selectTowerTarget` は Task 2 で射程対応済み）
- Test: `domain/combat/step-tick-heavy.test.ts`（新規）

**Interfaces:**
- Consumes: Task 3 の `heavyBonusThreshold` / `heavyBonusMultiplier`、Task 2 の `effectiveRange`
- Produces: `effectiveDamage` が**対象の敵に依存する**ようになる（署名に対象を追加）。呼び出し側は対象決定後に呼ぶ

**設計上の注意:** 現在の `effectiveDamage(state, towerIndex, map)` は対象に依存しない。特効は対象の `maxHp` を見るため、**署名に対象を足す必要がある**。既存の呼び出し（Task 2 で追加した箇所を含む）をすべて更新すること。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-heavy.test.ts
/**
 * 徹甲弩の重装特効と投石機のテスト
 *
 * 徹甲弩は「効率の順位が敵によって入れ替わる」ことを作るカード。
 * 雑兵（HP20）には弓兵に劣り、重装（HP60）には勝つ。
 */
import { createCombatState } from './combat-state';
import type { CombatState, ActiveEnemy } from './combat-state';
import { stepTick, effectiveDamage } from './step-tick';
import { PLAINS_WAVES } from './waves';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const enemyOf = (enemyId: string, maxHp: number): ActiveEnemy => ({
  id: 1,
  enemyId,
  hp: maxHp,
  maxHp,
  progress: 1,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
});

const withTower = (cardId: string, x: number, y: number): CombatState => ({
  ...createCombatState(emptyDeck, PLAINS_WAVES),
  towers: [{ cardId, pos: { x, y }, cooldownLeft: 0 }],
});

describe('徹甲弩の重装特効', () => {
  it('HP40未満の敵には基礎ダメージ', () => {
    const state = withTower('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 20))).toBe(7);
  });

  it('HP40以上の敵には2倍', () => {
    const state = withTower('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(14);
  });

  it('しきい値ちょうど（40）でも特効が乗る', () => {
    const state = withTower('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 40))).toBe(14);
  });

  it('現在HPではなく最大HPで判定する（削れても特効は乗り続ける）', () => {
    const state = withTower('piercer', 1, 2);
    const damaged = { ...enemyOf('brute', 60), hp: 5 };
    expect(effectiveDamage(state, 0, PLAINS_MAP, damaged)).toBe(14);
  });

  it('特効を持たない塔は敵のHPで変わらない', () => {
    const state = withTower('arrow-tower', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 20))).toBe(6);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(6);
  });

  it('特効と篝火オーラと高台が二重適用されない', () => {
    // (3,4) は高台。隣接 (2,4) に篝火
    const state: CombatState = {
      ...createCombatState(emptyDeck, PLAINS_WAVES),
      towers: [
        { cardId: 'piercer', pos: { x: 3, y: 4 }, cooldownLeft: 0 },
        { cardId: 'beacon', pos: { x: 2, y: 4 }, cooldownLeft: 0 },
      ],
    };
    // round(7 * 1.3 * 1.25 * 2) = round(22.75) = 23
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(23);
  });
});

describe('投石機', () => {
  it('射程3.0で遠くの敵に届く', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    // 経路始端 (0,3) に対し (2,1) は距離 hypot(2,2)=2.83 < 3.0
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      towers: [{ cardId: 'catapult', pos: { x: 2, y: 1 }, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < 30; i++) s = stepTick(s, [], PLAINS_MAP);
    const grunt = s.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt && grunt.hp < grunt.maxHp).toBe(true);
  });

  it('範囲2で複数体を巻き込む', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'swarm', count: 4, spawnIntervalTicks: 3, spawnPathIndex: 0 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      towers: [{ cardId: 'catapult', pos: { x: 2, y: 2 }, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < 40; i++) s = stepTick(s, [], PLAINS_MAP);
    const affected = s.enemies.filter((e) => e.hp < e.maxHp || !e.alive);
    expect(affected.length).toBeGreaterThanOrEqual(3);
  });

  it('飛行には当たらない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      towers: [{ cardId: 'catapult', pos: { x: 5, y: 2 }, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < 30; i++) s = stepTick(s, [], PLAINS_MAP);
    const raven = s.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.hp).toBe(raven?.maxHp);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-heavy --no-coverage`
Expected: FAIL（`effectiveDamage` の署名が合わない・特効未実装）

- [ ] **Step 3: `effectiveDamage` に対象を追加**

```ts
/**
 * 塔の実効ダメージ
 *
 * round(基礎 × 重装特効 × 高台倍率 × (1 + Σ隣接オーラ))。
 * 特効は対象の**最大HP**で判定する（現在HPだと削るほど弱くなり直感に反する）。
 * 倍率の二重適用を避けるため、この関数だけがダメージ算出の責務を持つ。
 */
export const effectiveDamage = (
  state: CombatState,
  towerIndex: number,
  map: StageMap,
  target: ActiveEnemy
): number => {
  const tower = state.towers[towerIndex];
  if (!tower) return 0;
  const spec = getCardDefinition(tower.cardId).tower;
  if (!spec || spec.aura) return 0;
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
    threshold !== undefined && target.maxHp >= threshold
      ? (spec.heavyBonusMultiplier ?? 1)
      : 1;
  return Math.round(spec.damage * heavy * highGround * (1 + auraBonus));
};
```

- [ ] **Step 4: 呼び出し側を更新**

`applyTowerShots` は「対象を決めてからダメージを算出する」順に変える。範囲巻き込み（`applySplashDamage`）も**巻き込まれる敵ごとにダメージを算出する**（特効が個別に判定されるべきなので、中心の敵の値を流用しない）。

```ts
    const range = effectiveRange(stateForDamage, towerIndex, map);
    const target = selectTowerTarget(moved, hpById, tower, spec, range, map, tick);
    if (!target) return tower;
    const damage = effectiveDamage(stateForDamage, towerIndex, map, target);
    hpById.set(target.id, (hpById.get(target.id) ?? 0) - damage);
    events.push({ kind: 'shot', towerIndex, targetId: target.id });
    if (spec.splashRadius > 0) {
      applySplashDamage(moved, hpById, target, spec, stateForDamage, towerIndex, map, tick);
    }
```

`applySplashDamage` の内側で巻き込む敵ごとに `effectiveDamage(..., other)` を呼ぶ。

- [ ] **Step 5: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain --no-coverage`
Expected: PASS（既存の `effectiveDamage` テストも署名変更に追随している必要がある。既存テストは Task 6 のカードでは対象を渡していないので、**既存テストの呼び出しも更新すること**）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-heavy.test.ts src/features/ashen-rampart/domain/combat/step-tick-combat.test.ts src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts
git commit -m "feat(ashen-rampart): 徹甲弩の重装特効を実装し投石機を有効化

- effectiveDamage に対象を渡し、最大HPで特効を判定する
- 範囲巻き込みも敵ごとにダメージを算出（特効を個別判定）
- 効率の順位が敵によって入れ替わる状態を作る

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 徴発（選択ドロー）

**Files:**
- Modify: `domain/cards/deck.ts`（`peekTop` / `takeFromPeek`）
- Modify: `domain/cards/deck.test.ts`
- Modify: `domain/combat/combat-state.ts`（`levyOptions` 追加）
- Modify: `domain/combat/step-tick.ts`（徴発の発動と選択処理）
- Test: `domain/combat/step-tick-levy.test.ts`（新規）

**Interfaces:**
- Consumes: Task 3 の `LevySpec` / `levy` カード
- Produces: `CombatState.levyOptions: string[]`（空なら選択待ちなし）。`PlayerAction` に `{ kind: 'choose-levy'; optionIndex: number }` 追加。`TickEvent` の `rejected.reason` に `'pending'` 追加。`peekTop(deck, n): { options: string[]; deck: DeckState }` / `takeFromPeek(deck, options, index): DeckState`

**設計上の要点（設計書 §3.5）:** 選択中もゲームは止まらない。止めると「実質的な一時停止でマナを稼げる」抜け道になる。選択を放置している間も敵は進むため、それ自体がテンポの判断になる。

- [ ] **Step 1: 失敗するテストを書く（デッキ操作）**

```ts
// deck.test.ts に追記
describe('peekTop / takeFromPeek（徴発）', () => {
  it('山札の上から n 枚を取り出し、山札から除く', () => {
    const deck = { drawPile: ['a', 'b', 'c', 'd'], hand: [], graveyard: [] };
    const { options, deck: next } = peekTop(deck, 3);
    expect(options).toEqual(['a', 'b', 'c']);
    expect(next.drawPile).toEqual(['d']);
  });

  it('山札が n 枚未満なら残り全部を取り出す', () => {
    const deck = { drawPile: ['a'], hand: [], graveyard: [] };
    const { options, deck: next } = peekTop(deck, 3);
    expect(options).toEqual(['a']);
    expect(next.drawPile).toEqual([]);
  });

  it('山札が空なら候補は空', () => {
    const deck = { drawPile: [], hand: [], graveyard: [] };
    expect(peekTop(deck, 3).options).toEqual([]);
  });

  it('元の状態を変更しない', () => {
    const deck = { drawPile: ['a', 'b'], hand: [], graveyard: [] };
    peekTop(deck, 2);
    expect(deck.drawPile).toEqual(['a', 'b']);
  });

  it('選んだ札は手札へ、残りは墓地へ', () => {
    const deck = { drawPile: [], hand: ['x'], graveyard: ['z'] };
    const next = takeFromPeek(deck, ['a', 'b', 'c'], 1);
    expect(next.hand).toEqual(['x', 'b']);
    expect(next.graveyard).toEqual(['z', 'a', 'c']);
  });

  it('範囲外のインデックスなら候補すべてを墓地へ送る', () => {
    const deck = { drawPile: [], hand: ['x'], graveyard: [] };
    const next = takeFromPeek(deck, ['a', 'b'], 9);
    expect(next.hand).toEqual(['x']);
    expect(next.graveyard).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: 失敗するテストを書く（stepTick 側）**

```ts
// src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts
/**
 * 徴発のテスト
 *
 * 選択中もゲームは止まらない（止めると一時停止でマナを稼げる抜け道になる）。
 * 徴発自身が手札から墓地へ移るため、選んだ札は必ず手札に入る。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const noWave: WaveDefinition[] = [{ startTick: 99999, entries: [] }];

const stateWith = (hand: string[], drawPile: string[]): CombatState =>
  createCombatState({ drawPile, hand, graveyard: [] }, noWave);

const play = (state: CombatState, handIndex: number) =>
  stepTick(state, [{ kind: 'play-card', handIndex }], PLAINS_MAP);

describe('徴発の発動', () => {
  it('山札の上3枚が候補になり、山札から除かれる', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor', 'beacon']);
    const after = play(state, 0);
    expect(after.levyOptions).toEqual(['arrow-tower', 'ballista', 'reactor']);
    expect(after.deck.drawPile).toEqual(['beacon']);
  });

  it('徴発自身は墓地へ行き、マナを1消費する', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.deck.graveyard).toEqual(['levy']);
    expect(after.mana).toBe(1); // 初期2 - コスト1
  });

  it('配置クールダウンを消費する（他の札と同じ扱い）', () => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.placeCooldown).toBeGreaterThan(0);
  });

  it('山札が空なら候補は空で、効果なしで墓地へ', () => {
    const state = stateWith(['levy'], []);
    const after = play(state, 0);
    expect(after.levyOptions).toEqual([]);
    expect(after.deck.graveyard).toEqual(['levy']);
  });
});

describe('徴発の選択', () => {
  const openLevy = (): CombatState => {
    const state = stateWith(['levy'], ['arrow-tower', 'ballista', 'reactor']);
    const after = play(state, 0);
    expect(after.levyOptions).toHaveLength(3);
    return after;
  };

  it('選んだ札が手札に入り、残りは墓地へ', () => {
    const opened = openLevy();
    const after = stepTick(opened, [{ kind: 'choose-levy', optionIndex: 1 }], PLAINS_MAP);
    expect(after.deck.hand).toEqual(['ballista']);
    expect(after.deck.graveyard).toEqual(['levy', 'arrow-tower', 'reactor']);
    expect(after.levyOptions).toEqual([]);
  });

  it('選択中もゲームは進む（tick が止まらない）', () => {
    const opened = openLevy();
    const after = stepTick(opened, [], PLAINS_MAP);
    expect(after.tick).toBe(opened.tick + 1);
    expect(after.levyOptions).toHaveLength(3);
  });

  it('選択待ち中に徴発を出そうとしても拒否される', () => {
    const opened = openLevy();
    const withAnotherLevy: CombatState = {
      ...opened,
      deck: { ...opened.deck, hand: ['levy'] },
      mana: 5,
      placeCooldown: 0,
    };
    const after = play(withAnotherLevy, 0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'pending' });
    expect(after.levyOptions).toHaveLength(3);
    expect(after.deck.hand).toEqual(['levy']);
  });

  it('選択待ちが無いときに choose-levy を送っても何も起きない', () => {
    const state = stateWith([], []);
    const after = stepTick(state, [{ kind: 'choose-levy', optionIndex: 0 }], PLAINS_MAP);
    expect(after.deck.hand).toEqual([]);
    expect(after.deck.graveyard).toEqual([]);
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain --no-coverage`
Expected: FAIL（`peekTop` / `levyOptions` / `choose-levy` 未実装）

- [ ] **Step 4: `deck.ts` に2関数を追加**

```ts
export interface PeekResult {
  /** 提示する候補（山札から除かれている） */
  options: string[];
  deck: DeckState;
}

/**
 * 山札の上から n 枚を取り出して候補にする（徴発）
 *
 * 取り出した札は山札から除く。選択が終わるまでどこにも属さない
 * 中間状態になるため、CombatState.levyOptions が保持する。
 */
export const peekTop = (deck: DeckState, n: number): PeekResult => ({
  options: deck.drawPile.slice(0, n),
  deck: { ...deck, drawPile: deck.drawPile.slice(n) },
});

/**
 * 候補から1枚を手札に加え、残りを墓地へ送る
 *
 * 徴発を出した時点で徴発自身が手札から抜けているため、
 * 手札には必ず空きがあり上限で溢れない。
 * 範囲外のインデックスなら全部を墓地へ送る（選択せず捨てた扱い）。
 */
export const takeFromPeek = (
  deck: DeckState,
  options: readonly string[],
  index: number
): DeckState => {
  const chosen = options[index];
  const rest = options.filter((_, i) => i !== index);
  return {
    ...deck,
    hand: chosen === undefined ? deck.hand : [...deck.hand, chosen],
    graveyard: [...deck.graveyard, ...rest],
  };
};
```

- [ ] **Step 5: `CombatState` と `PlayerAction` を拡張**

```ts
// combat-state.ts の CombatState に追加
  /** 徴発で提示中の候補。空配列なら選択待ちなし */
  levyOptions: string[];
```

`createCombatState` の初期値に `levyOptions: []` を追加。`TickEvent` の `rejected.reason` に `'pending'` を追加。

```ts
// step-tick.ts の PlayerAction に追加
  | { kind: 'choose-levy'; optionIndex: number };
```

- [ ] **Step 6: `stepTick` に徴発を実装**

`applyCardEffect` に `levy` 分岐を追加する。

```ts
    } else if (card.type === 'levy' && card.levy) {
      const peeked = peekTop(draft.deck, card.levy.peekCount);
      draft.deck = peeked.deck;
      draft.levyOptions = peeked.options;
    }
```

`applyPlayCard` の冒頭に「選択待ち中は徴発を出せない」判定を追加する。

```ts
  if (card.type === 'levy' && draft.levyOptions.length > 0) {
    events.push({ kind: 'rejected', reason: 'pending' });
    return;
  }
```

`applyActions` に `choose-levy` の処理を追加する（配置クールダウンもマナも消費しない）。

```ts
    if (action.kind === 'choose-levy') {
      if (draft.levyOptions.length === 0) return;
      draft.deck = takeFromPeek(draft.deck, draft.levyOptions, action.optionIndex);
      draft.levyOptions = [];
      return;
    }
```

- [ ] **Step 7: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/deck.ts src/features/ashen-rampart/domain/cards/deck.test.ts src/features/ashen-rampart/domain/combat/combat-state.ts src/features/ashen-rampart/domain/combat/step-tick.ts src/features/ashen-rampart/domain/combat/step-tick-levy.test.ts
git commit -m "feat(ashen-rampart): 徴発（山札の上3枚から1枚選ぶ）を実装

- 選択中もゲームは止まらない（一時停止でマナを稼ぐ抜け道を作らない）
- 徴発自身が墓地へ抜けるため選んだ札は手札上限で溢れない
- 選択待ち中の追加の徴発は rejected: pending で拒否

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: カウントダウン

**Files:**
- Modify: `domain/combat/combat-state.ts`（`COUNTDOWN_TICKS` / `countdownLeftAt` / ウェーブの startTick シフト）
- Test: `domain/combat/countdown.test.ts`（新規）

**Interfaces:**
- Consumes: 既存の `createCombatState`
- Produces: `COUNTDOWN_TICKS = 90` / `countdownLeftAt(tick): number`。`createCombatState` が渡されたウェーブの `startTick` を `COUNTDOWN_TICKS` ぶんずらす

**設計上の要点:** 新しい state を増やさない。`countdownLeft` は `tick` から導出でき、ウェーブの出現も `startTick` をずらすだけで止まる。**`spawnAt` と `isCleared` の fencepost 論理に一切手を入れない**（過去にここでバグを出しているため）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/combat/countdown.test.ts
/**
 * カウントダウンのテスト
 *
 * 新しい state を増やさず、ウェーブの startTick をずらすことで実現する。
 * spawnAt / isCleared の fencepost 論理に手を入れないための設計。
 */
import { createCombatState, COUNTDOWN_TICKS, countdownLeftAt } from './combat-state';
import { stepTick } from './step-tick';
import type { CombatState } from './combat-state';
import { PLAINS_WAVES } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('countdownLeftAt', () => {
  it('開始時は COUNTDOWN_TICKS ぶん残っている', () => {
    expect(countdownLeftAt(0)).toBe(COUNTDOWN_TICKS);
  });

  it('tick が進むと減る', () => {
    expect(countdownLeftAt(30)).toBe(COUNTDOWN_TICKS - 30);
  });

  it('カウントダウン後は 0 で止まる', () => {
    expect(countdownLeftAt(COUNTDOWN_TICKS)).toBe(0);
    expect(countdownLeftAt(COUNTDOWN_TICKS + 100)).toBe(0);
  });
});

describe('createCombatState のウェーブシフト', () => {
  it('ウェーブの startTick が COUNTDOWN_TICKS ぶんずれる', () => {
    const state = createCombatState(emptyDeck, PLAINS_WAVES);
    const original = PLAINS_WAVES.map((w) => w.startTick);
    expect(state.waves.map((w) => w.startTick)).toEqual(
      original.map((t) => t + COUNTDOWN_TICKS)
    );
  });

  it('エントリの内容は変わらない', () => {
    const state = createCombatState(emptyDeck, PLAINS_WAVES);
    expect(state.waves[0]?.entries).toEqual(PLAINS_WAVES[0]?.entries);
  });
});

describe('カウントダウン中の振る舞い', () => {
  it('敵は出現しない', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS);
    expect(after.enemies).toHaveLength(0);
  });

  it('カウントダウン明けに敵が出現する', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS + 1);
    expect(after.enemies.filter((e) => e.alive).length).toBeGreaterThan(0);
  });

  it('敵が0体でも勝利判定にならない（カウントダウン中）', () => {
    const after = advance(createCombatState(emptyDeck, PLAINS_WAVES), COUNTDOWN_TICKS - 1);
    expect(after.outcome).toBe('playing');
  });

  it('マナ生成は動く（魔力炉があれば増える）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, PLAINS_WAVES),
      reactors: [{ pos: { x: 1, y: 2 }, ticksToMana: 60 }],
    };
    const after = advance(state, COUNTDOWN_TICKS);
    expect(after.mana).toBeGreaterThan(state.mana);
  });

  it('ドローは動く', () => {
    const state = createCombatState(
      { drawPile: ['arrow-tower', 'ballista'], hand: [], graveyard: [] },
      PLAINS_WAVES
    );
    const after = advance(state, COUNTDOWN_TICKS);
    expect(after.deck.hand.length).toBeGreaterThan(0);
  });

  it('配置できる', () => {
    const state = createCombatState(
      { drawPile: [], hand: ['reactor'], graveyard: [] },
      PLAINS_WAVES
    );
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }], PLAINS_MAP);
    expect(after.reactors).toHaveLength(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/combat/countdown --no-coverage`
Expected: FAIL（`COUNTDOWN_TICKS` / `countdownLeftAt` 未定義・ウェーブがずれていない）

- [ ] **Step 3: 実装**

```ts
// combat-state.ts に追加
/**
 * 開始カウントダウンの長さ（tick）
 *
 * 3 → 2 → 1 を各 30 tick で表示する。この間、敵は出現しないが
 * マナ生成・ドロー・配置は動く（初手を置く猶予にするため）。
 * 実装は「ウェーブの startTick をこのぶんずらす」ことで行い、
 * spawnAt / isCleared の tick 計算には一切手を入れない。
 */
export const COUNTDOWN_TICKS = 90;

/** その tick 時点でカウントダウンの残り（0 なら開始済み） */
export const countdownLeftAt = (tick: number): number =>
  Math.max(0, COUNTDOWN_TICKS - tick);
```

`createCombatState` を変更する。

```ts
export const createCombatState = (
  deck: DeckState,
  waves: readonly WaveDefinition[]
): CombatState => ({
  tick: 0,
  // ...既存のまま...
  // カウントダウンぶんウェーブ全体を後ろにずらす。
  // これにより出現も勝利判定も自然に止まる（fencepost 論理は不変）。
  waves: waves.map((w) => ({ ...w, startTick: w.startTick + COUNTDOWN_TICKS })),
  levyOptions: [],
  events: [],
  outcome: 'playing',
});
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain --no-coverage`
Expected: PASS。**既存テストのうち、絶対 tick を前提にしているもの（`step-tick.test.ts` の出現タイミング等）が落ちる可能性がある。落ちた場合は「カウントダウンぶん後ろにずれた」ことが原因なので、期待値を緩めるのではなく `COUNTDOWN_TICKS` を足した値に直す**。修正した箇所を報告に列挙すること

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/combat-state.ts src/features/ashen-rampart/domain/combat/countdown.test.ts src/features/ashen-rampart/domain/combat/step-tick.test.ts
git commit -m "feat(ashen-rampart): 開始カウントダウンを追加

- state を増やさず、ウェーブの startTick をずらして実現
- spawnAt / isCleared の fencepost 論理には手を入れない
- カウントダウン中もマナ生成・ドロー・配置は動く（初手の猶予）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: デッキ構築の検証（ドメイン）

**Files:**
- Create: `domain/cards/deck-builder.ts`
- Test: `domain/cards/deck-builder.test.ts`

**Interfaces:**
- Consumes: Task 3 の `CARD_IDS` / `getCardDefinition` / `DECK_SIZE` / `MAX_COPIES`
- Produces: `DeckValidation { isValid: boolean; errors: string[] }` / `validateDeck(cards): DeckValidation` / `countByCard(cards): Map<string, number>` / `costCurve(cards): Map<number, number>`。UI（Task 11）と CI の両方が使う

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/domain/cards/deck-builder.test.ts
/**
 * デッキ構築の検証のテスト
 *
 * 検証をドメインに置く理由: UI 側でだけ検証すると、テストが通るのに
 * UI で組めないデッキ（またはその逆）が生まれる。唯一の真実をここに置く。
 */
import { validateDeck, countByCard, costCurve } from './deck-builder';
import { DECK_SIZE, MAX_COPIES } from './card-pool';

const repeat = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

/** 20枚ちょうど・同名3枚以内の妥当なデッキ */
const validCards = [
  ...repeat('reactor', 3),
  ...repeat('arrow-tower', 3),
  ...repeat('ballista', 3),
  ...repeat('cannon-tower', 3),
  ...repeat('spike-trap', 3),
  ...repeat('mud-time', 3),
  ...repeat('beacon', 2),
];

describe('validateDeck', () => {
  it('20枚ちょうど・同名3枚以内なら妥当', () => {
    expect(validCards).toHaveLength(DECK_SIZE);
    const result = validateDeck(validCards);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('枚数が足りないと不正で、必要枚数がエラーに出る', () => {
    const result = validateDeck(validCards.slice(0, 19));
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('20');
  });

  it('枚数が多いと不正', () => {
    const result = validateDeck([...validCards, 'beacon']);
    expect(result.isValid).toBe(false);
  });

  it('同名が上限を超えると不正で、カード名がエラーに出る', () => {
    const tooMany = [...repeat('arrow-tower', MAX_COPIES + 1), ...repeat('reactor', 3), ...repeat('ballista', 3), ...repeat('cannon-tower', 3), ...repeat('spike-trap', 3), ...repeat('mud-time', 3), 'beacon'];
    expect(tooMany).toHaveLength(DECK_SIZE);
    const result = validateDeck(tooMany);
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('弓兵の塔');
  });

  it('未知のカードIDが含まれると不正', () => {
    const result = validateDeck([...validCards.slice(0, 19), 'unknown-card']);
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('unknown-card');
  });

  it('空のデッキは不正', () => {
    const result = validateDeck([]);
    expect(result.isValid).toBe(false);
  });

  it('複数の違反があればすべて報告する', () => {
    const result = validateDeck(repeat('arrow-tower', 25));
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('countByCard', () => {
  it('カードごとの枚数を数える', () => {
    const counts = countByCard(['a', 'b', 'a']);
    expect(counts.get('a')).toBe(2);
    expect(counts.get('b')).toBe(1);
  });

  it('空配列なら空のマップ', () => {
    expect(countByCard([]).size).toBe(0);
  });
});

describe('costCurve', () => {
  it('コストごとの枚数を数える', () => {
    // reactor=0, arrow-tower=2, ballista=3
    const curve = costCurve(['reactor', 'arrow-tower', 'arrow-tower', 'ballista']);
    expect(curve.get(0)).toBe(1);
    expect(curve.get(2)).toBe(2);
    expect(curve.get(3)).toBe(1);
  });

  it('未知のカードは無視する（検証は validateDeck の責務）', () => {
    expect(costCurve(['unknown']).size).toBe(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards/deck-builder --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/domain/cards/deck-builder.ts
/**
 * 灰燼の城壁 - デッキ構築の検証（純粋）
 *
 * UI（構築画面）と CI（バランステスト）の両方がここを使う。
 * UI 側でだけ検証すると「テストは通るが UI で組めないデッキ」が生まれる。
 */
import { CARD_IDS, DECK_SIZE, MAX_COPIES, getCardDefinition } from './card-pool';

export interface DeckValidation {
  isValid: boolean;
  /** 違反の内容（複数ある場合はすべて列挙する） */
  errors: string[];
}

/** カードごとの枚数 */
export const countByCard = (cards: readonly string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return counts;
};

/** コストごとの枚数。未知のカードは無視する（検証は validateDeck の責務） */
export const costCurve = (cards: readonly string[]): Map<number, number> => {
  const curve = new Map<number, number>();
  cards.forEach((id) => {
    if (!CARD_IDS.includes(id)) return;
    const cost = getCardDefinition(id).cost;
    curve.set(cost, (curve.get(cost) ?? 0) + 1);
  });
  return curve;
};

/** デッキが構築規則を満たすか。満たさない場合は理由をすべて返す */
export const validateDeck = (cards: readonly string[]): DeckValidation => {
  const errors: string[] = [];

  if (cards.length !== DECK_SIZE) {
    errors.push(`デッキは${DECK_SIZE}枚ちょうどにしてください（現在${cards.length}枚）`);
  }

  const unknown = cards.filter((id) => !CARD_IDS.includes(id));
  [...new Set(unknown)].forEach((id) => {
    errors.push(`未知のカードが含まれています: ${id}`);
  });

  countByCard(cards).forEach((count, id) => {
    if (count <= MAX_COPIES) return;
    const name = CARD_IDS.includes(id) ? getCardDefinition(id).name : id;
    errors.push(`${name}が${count}枚あります（同名は${MAX_COPIES}枚まで）`);
  });

  return { isValid: errors.length === 0, errors };
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/domain/cards --no-coverage`
Expected: PASS

- [ ] **Step 5: 既存プリセットが検証を通ることをテストで固定**

`card-pool.test.ts` に追記する。

```ts
  it.each(Object.entries(PRESET_DECKS))('%s は構築規則を満たす', (_id, deck) => {
    expect(validateDeck(deck.cards).errors).toEqual([]);
  });
```

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/deck-builder.ts src/features/ashen-rampart/domain/cards/deck-builder.test.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat(ashen-rampart): デッキ構築の検証をドメインに追加

- validateDeck / countByCard / costCurve を純粋関数として提供
- UI と CI で同じ検証を使い、片方だけ通る状態を防ぐ
- 既存プリセットが構築規則を満たすことをテストで固定

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: バランス較正と支配戦略テストの拡張

**この作品の生命線。** 前コンセプトを殺したのは「最効率カードに効かない相手がいない」ことで、カードを6種増やす作業はその欠陥を再導入する最大の機会である。

**Files:**
- Modify: `domain/combat/run-simulation.ts`（`greedyStrategy` に徴発の選択を追加）
- Modify: `domain/combat/balance.test.ts`
- Modify: `domain/combat/waves.ts`（較正の結果として敵数を調整する場合）
- Modify: `domain/combat/waves.test.ts`（総HP・総体数の期待値）

**Interfaces:**
- Consumes: Task 1〜8 のすべて
- Produces: 新カード6種を含む支配戦略の回帰テスト

- [ ] **Step 1: `greedyStrategy` に徴発の選択を追加**

徴発を出したまま選択を放置すると山札が減り続けて実質デッキが痩せるため、素直な戦略は**常に最初の候補を選ぶ**。

```ts
// run-simulation.ts の greedyStrategy 冒頭に追加
  if (state.levyOptions.length > 0) {
    actions.push({ kind: 'choose-levy', optionIndex: 0 });
  }
```

> 「常に先頭を選ぶ」のは賢さではなく最低限の動作である。候補を評価して選ぶ賢い戦略にしてはいけない（`greedyStrategy` は「雑に遊んでも勝ててしまうか」の下限を測る道具）。

- [ ] **Step 2: 支配戦略テストを新カードに拡張**

```ts
// balance.test.ts の「支配戦略が存在しないこと」を全カード網羅に拡張
/**
 * 単一種類に偏ったデッキでは勝てないこと
 *
 * 前コンセプトを殺したのは「最効率カードに効かない相手がいない」ことだった。
 * カードを増やすたびにこの検証を拡張しないと、同じ欠陥が静かに戻る。
 *
 * 魔力炉3枚を混ぜるのは、マナ枯渇で自明に負けるのを避けるため。
 * cardsPlayed の下限アサートで「札は出せていた」ことを保証する。
 */
const DOMINANCE_TARGETS = [
  'arrow-tower',
  'ballista',
  'cannon-tower',
  'beacon',
  'spike-trap',
  'ember-blast',
  'mud-time',
  'snare-net',
  'stone-wall',
  'catapult',
  'piercer',
  'forge',
  'levy',
] as const;

describe('支配戦略が存在しないこと', () => {
  it.each(DOMINANCE_TARGETS)('%s に偏ったデッキ（魔力炉3＋17枚）では勝てない', (cardId) => {
    const cards = [
      ...Array.from({ length: 3 }, () => 'reactor'),
      ...Array.from({ length: 17 }, () => cardId),
    ];
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });

  it('魔力炉だけのデッキでは勝てない（火力ゼロ）', () => {
    const deck = createDeck(Array.from({ length: 20 }, () => 'reactor'), () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });
});
```

- [ ] **Step 3: テストを実行し、較正する**

Run: `npx jest src/features/ashen-rampart/domain/combat/balance --no-coverage`

**カウントダウン（Task 7）で 90 tick ぶんの猶予が増えたため、難度は下がっている**（設計書 §5.2 の注記）。「難度の較正」テストが落ちる場合は次の順で `waves.ts` を調整する。

1. 勝ちすぎる → 各ウェーブの `count` を 1.15 倍ずつ増やす
2. 負けすぎる（全ラン `lifeLeft === 0`）→ `count` を 0.9 倍ずつ減らす
3. 3回調整して収束しない場合は `LIFE_INITIAL` を ±2 動かす

調整のたびに**3箇所を同時更新**する: `waves.ts` / `waves.test.ts`（総HP・総体数）/ `balance.test.ts`（較正の基準値）。

**較正の各ラウンドで、実際の勝利数・生存数を報告に記録すること。** 前回は「全PASS」しか記録せず、閾値の余白がどれだけあったか分からなくなった。`wins` と `lifeLeft` の実測値を残す。

- [ ] **Step 4: 「単一カードでは勝てない」が破れた場合**

もし新カードのいずれかで**勝ててしまう**場合、それは設計上の重大な発見である。テストを緩めたり敵を強くして誤魔化さず、**BLOCKED で報告する**。どのカードが、どの数値で勝ててしまうのかを添える。

- [ ] **Step 5: 全テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/run-simulation.ts src/features/ashen-rampart/domain/combat/balance.test.ts src/features/ashen-rampart/domain/combat/waves.ts src/features/ashen-rampart/domain/combat/waves.test.ts
git commit -m "test(ashen-rampart): 支配戦略テストを全13カードに拡張し較正

- 単一種類に偏ったデッキで勝てないことを新カード6種も含めて検証
- cardsPlayed の下限アサートでマナ枯渇の自明な敗北を排除
- カウントダウン追加による難度低下を敵数で再較正

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: シード可変化とデッキ受け取り（application）

**Files:**
- Modify: `application/use-cases/start-run.ts`
- Modify: `application/use-cases/start-run.test.ts`

**Interfaces:**
- Consumes: Task 8 の `validateDeck`、既存の `PRESET_DECKS` / `createDeck` / `createCombatState`
- Produces: `startRunWithDeck(cards, random): CombatState`（任意のカード配列から開始）。`startRun(presetId, random)` は既存署名を維持し内部で `startRunWithDeck` を呼ぶ。`createSeed(): number`（毎ラン新しいシードを作る）

- [ ] **Step 1: 失敗するテストを書く**

```ts
// start-run.test.ts に追記
import { startRunWithDeck, createSeed } from './start-run';
import { validateDeck } from '../../domain/cards/deck-builder';

describe('startRunWithDeck', () => {
  const cards = [...PRESET_DECKS.swift!.cards];

  it('任意のカード配列からランを開始できる', () => {
    const state = startRunWithDeck(cards, new SeededRandom(1));
    expect(state.deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(state.deck.drawPile).toHaveLength(cards.length - INITIAL_HAND_SIZE);
  });

  it('同じシードからは同じ手札になる', () => {
    const a = startRunWithDeck(cards, new SeededRandom(7));
    const b = startRunWithDeck(cards, new SeededRandom(7));
    expect(a.deck.hand).toEqual(b.deck.hand);
    expect(a.deck.drawPile).toEqual(b.deck.drawPile);
  });

  it('構築規則を満たさないデッキは契約違反として例外', () => {
    expect(() => startRunWithDeck(cards.slice(0, 19), new SeededRandom(1))).toThrow(
      'デッキが構築規則を満たしていません'
    );
  });

  it('例外メッセージに違反理由が含まれる', () => {
    expect(() => startRunWithDeck(cards.slice(0, 19), new SeededRandom(1))).toThrow(/20/);
  });
});

describe('startRun（既存署名の維持）', () => {
  it('プリセットIDから開始でき、startRunWithDeck と同じ結果になる', () => {
    const viaPreset = startRun('swift', new SeededRandom(3));
    const viaCards = startRunWithDeck([...PRESET_DECKS.swift!.cards], new SeededRandom(3));
    expect(viaPreset.deck.hand).toEqual(viaCards.deck.hand);
  });
});

describe('createSeed', () => {
  it('連続で呼んでも必ず異なる値を返す（同一ミリ秒でも衝突しない）', () => {
    const seeds = Array.from({ length: 50 }, () => createSeed());
    expect(new Set(seeds).size).toBe(50);
  });

  it('正の整数を返す（SeededRandom に渡せる形）', () => {
    const seed = createSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/application --no-coverage`
Expected: FAIL（`startRunWithDeck` / `createSeed` 未定義）

- [ ] **Step 3: 実装**

```ts
// start-run.ts（全置換）
/**
 * 灰燼の城壁 - ラン開始
 *
 * 乱数を使うのはここだけ。以後 stepTick は決定的に進むため、
 * シードを記録すればランを完全に再現できる。
 */
import type { RandomPort } from '../ports/random-port';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { createDeck } from '../../domain/cards/deck';
import { validateDeck } from '../../domain/cards/deck-builder';
import { createCombatState, type CombatState } from '../../domain/combat/combat-state';
import { PLAINS_WAVES } from '../../domain/combat/waves';

/**
 * 毎ラン新しいシードを作る
 *
 * PoC ではシード既定値が 1 に固定されており、明示的に変えない限り
 * 毎ラン同じドロー順になっていた（計測のための仕様が遊びを壊していた）。
 * 判定が終わったので既定を可変にする。固定はデバッグと反証条件の検証用に残す。
 */
let seedCounter = 0;

export const createSeed = (): number => {
  // 同一ミリ秒での連続呼び出しでも衝突しないようカウンタを混ぜる。
  // Date.now() だけだとタイトなループで同じ値が返り、
  // 「毎ラン新しいシード」が成立しない。
  seedCounter = (seedCounter + 1) % 100000;
  return ((Date.now() % 2147483647) * 100000 + seedCounter) % 2147483647 || 1;
};

/** 任意のカード配列からランを開始する。構築規則を満たさないデッキは契約違反 */
export const startRunWithDeck = (
  cards: readonly string[],
  random: RandomPort
): CombatState => {
  const validation = validateDeck(cards);
  if (!validation.isValid) {
    throw new Error(`デッキが構築規則を満たしていません: ${validation.errors.join(' / ')}`);
  }
  const deck = createDeck(cards, () => random.random());
  return createCombatState(deck, PLAINS_WAVES);
};

/** プリセットIDからランを開始する */
export const startRun = (presetId: string, random: RandomPort): CombatState => {
  const preset = PRESET_DECKS[presetId];
  if (!preset) {
    throw new Error(`未知のプリセットデッキです: ${presetId}`);
  }
  return startRunWithDeck(preset.cards, random);
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/application/use-cases/start-run.ts src/features/ashen-rampart/application/use-cases/start-run.test.ts
git commit -m "feat(ashen-rampart): 任意デッキからのラン開始とシード生成を追加

- startRunWithDeck で構築デッキから開始できるようにする
- 構築規則の検証をドメインの validateDeck に委ねる
- createSeed で毎ラン新しいシードを作る（既定を可変化）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: カードの説明文と「効かない相手」（presentation の純粋関数）

構築 UI と手札の両方で使う文言を先に用意する。

**Files:**
- Create: `presentation/card-text.ts`
- Test: `presentation/card-text.test.ts`

**Interfaces:**
- Consumes: Task 3 の `getCardDefinition` / `CARD_IDS`
- Produces: `weaknessTextOf(cardId): string`（「効かない相手」の文言）。Task 12・13 が使う

**設計上の要点（設計書 §6.1）:** 14種から20枚を選ぶ画面は読む量が多く、情報量が過大だと選べなくなる。「効かない相手」を明示することで「何のために積むか」の手がかりを与える。設計原則をプレイヤーに開示することでもある。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/features/ashen-rampart/presentation/card-text.test.ts
/**
 * カードの「効かない相手」文言のテスト
 *
 * 全カードに文言があることが要件。1つでも欠けると構築画面で
 * 「何のために積むか」の手がかりが失われる。
 */
import { weaknessTextOf } from './card-text';
import { CARD_IDS } from '../domain/cards/card-pool';

describe('weaknessTextOf', () => {
  it('全14種に文言がある（空文字でない）', () => {
    CARD_IDS.forEach((id) => {
      expect(weaknessTextOf(id).length).toBeGreaterThan(0);
    });
  });

  it('弓兵は飛行に当たらないことを示す', () => {
    expect(weaknessTextOf('arrow-tower')).toContain('飛行');
  });

  it('弩砲は効率の低さを示す（効かない相手が無い代わり）', () => {
    expect(weaknessTextOf('ballista')).toContain('効率');
  });

  it('徹甲弩は低HPへの非効率を示す', () => {
    expect(weaknessTextOf('piercer')).toContain('HP');
  });

  it('落網はダメージを与えないことを示す', () => {
    expect(weaknessTextOf('snare-net')).toContain('ダメージ');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => weaknessTextOf('unknown')).toThrow('文言が未定義のカードIDです: unknown');
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/card-text --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

```ts
// src/features/ashen-rampart/presentation/card-text.ts
/**
 * 灰燼の城壁 - カードの「効かない相手」文言（純粋）
 *
 * 設計原則「最高効率のカードには必ず効かない相手を作る」を
 * プレイヤーに開示する。14種から20枚を選ぶ画面では、
 * この手がかりが無いと「何のために積むか」が読み取れない。
 */
import { CARD_IDS } from '../domain/cards/card-pool';

const WEAKNESS: Readonly<Record<string, string>> = {
  reactor: '攻撃しない。スロットを1つ使う',
  'arrow-tower': '飛行に当たらない',
  ballista: '効かない相手はないが、マナ効率は最低クラス',
  'cannon-tower': '飛行に当たらない。単体の硬い敵には非効率',
  catapult: '飛行に当たらない。間隔が長くマナ効率は最低',
  piercer: '最大HP40未満の敵には非効率（弓兵に劣る）',
  beacon: '単体では0ダメージ',
  forge: '単体では0ダメージ',
  'spike-trap': '飛行に当たらない。3体で尽きる',
  'snare-net': 'ダメージを与えない。地上の敵には無意味。3体で尽きる',
  'stone-wall': 'ダメージを与えない。飛行には無意味。3体で尽きる',
  'ember-blast': '飛行に当たらない。半径2の外には届かない',
  'mud-time': 'ダメージを与えない。盤面に残らない',
  levy: '盤面に何も残らない。山札が尽きると効果がない',
};

/** カードの「効かない相手」文言を返す。未知の id は契約違反として例外 */
export const weaknessTextOf = (cardId: string): string => {
  const text = WEAKNESS[cardId];
  if (text === undefined) {
    throw new Error(`文言が未定義のカードIDです: ${cardId}`);
  }
  return text;
};

/** 文言が全カードを網羅していることを起動時に保証する（開発時の取り漏れ検出） */
export const MISSING_WEAKNESS_IDS: readonly string[] = CARD_IDS.filter(
  (id) => WEAKNESS[id] === undefined
);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation/card-text --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/card-text.ts src/features/ashen-rampart/presentation/card-text.test.ts
git commit -m "feat(ashen-rampart): カードの効かない相手の文言を追加

- 設計原則をプレイヤーに開示し、構築時の手がかりにする
- 全14種の網羅をテストで固定

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: デッキ構築 UI

**Files:**
- Create: `presentation/DeckBuilder.tsx`
- Test: `presentation/DeckBuilder.test.tsx`

**Interfaces:**
- Consumes: Task 8 の `validateDeck` / `countByCard` / `costCurve`、Task 11 の `weaknessTextOf`、既存の `COLORS` / `PRESET_DECKS` / `getCardDefinition` / `CARD_IDS` / `DECK_SIZE` / `MAX_COPIES`
- Produces: `DeckBuilder`（props: `{ onStart: (cards: string[], seed?: number) => void }`）

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/DeckBuilder.test.tsx
/**
 * デッキ構築 UI のテスト
 *
 * 「情報が存在する」ではなく「レンダリングされ操作できる」ことを検証する。
 * 検証ロジックはドメインの validateDeck を使うため、ここでは
 * 「UI が検証結果を正しく反映するか」を見る。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeckBuilder } from './DeckBuilder';
import { CARD_IDS, DECK_SIZE, PRESET_DECKS, getCardDefinition } from '../domain/cards/card-pool';

describe('DeckBuilder', () => {
  it('14種すべてが名前とコスト付きで並ぶ', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    CARD_IDS.forEach((id) => {
      const card = getCardDefinition(id);
      expect(screen.getByRole('group', { name: new RegExp(card.name) })).toBeInTheDocument();
    });
  });

  it('各カードに「効かない相手」が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByText('飛行に当たらない')).toBeInTheDocument();
  });

  it('初期状態では0枚で、開始できない', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    expect(screen.getByText(`0 / ${DECK_SIZE}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeDisabled();
  });

  it('カードを足すと枚数が増える', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '弓兵の塔 を1枚増やす' }));
    expect(screen.getByText(`1 / ${DECK_SIZE}`)).toBeInTheDocument();
  });

  it('同名の上限に達すると増やすボタンが無効になる', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const add = screen.getByRole('button', { name: '弓兵の塔 を1枚増やす' });
    fireEvent.click(add);
    fireEvent.click(add);
    fireEvent.click(add);
    expect(add).toBeDisabled();
  });

  it('減らすボタンで枚数が減り、0枚では無効', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    const remove = screen.getByRole('button', { name: '弓兵の塔 を1枚減らす' });
    expect(remove).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '弓兵の塔 を1枚増やす' }));
    expect(remove).toBeEnabled();
    fireEvent.click(remove);
    expect(screen.getByText(`0 / ${DECK_SIZE}`)).toBeInTheDocument();
  });

  it('プリセットを読み込むと20枚になり開始できる', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    expect(screen.getByText(`${DECK_SIZE} / ${DECK_SIZE}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeEnabled();
  });

  it('開始すると組んだカード配列が渡る', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    expect(onStart).toHaveBeenCalledTimes(1);
    const [cards] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(cards).toHaveLength(DECK_SIZE);
    expect([...cards].sort()).toEqual([...PRESET_DECKS.swift!.cards].sort());
  });

  it('シードを入力すると開始時に渡る', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.change(screen.getByLabelText('シード（空欄なら毎回ランダム）'), {
      target: { value: '4242' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    const [, seed] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(seed).toBe(4242);
  });

  it('シードが空欄なら undefined が渡る（毎回ランダム）', () => {
    const onStart = jest.fn();
    render(<DeckBuilder onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    const [, seed] = onStart.mock.calls[0] as [string[], number | undefined];
    expect(seed).toBeUndefined();
  });

  it('20枚に足りないと理由が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '弓兵の塔 を1枚増やす' }));
    expect(screen.getByText(/20枚ちょうどにしてください/)).toBeInTheDocument();
  });

  it('コスト曲線が表示される', () => {
    render(<DeckBuilder onStart={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    expect(screen.getByRole('list', { name: 'コスト曲線' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation/DeckBuilder --no-coverage`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

```tsx
// src/features/ashen-rampart/presentation/DeckBuilder.tsx
/**
 * 灰燼の城壁 - デッキ構築（ブリーフィング）
 *
 * 14種から20枚ちょうど、同名3枚まで。検証はドメインの validateDeck に委ね、
 * UI は結果を表示するだけにする（UI 側でだけ検証すると
 * 「テストは通るが UI で組めないデッキ」が生まれる）。
 *
 * 各カードに「効かない相手」を出すのは、読む量が多い画面で
 * 「何のために積むか」の手がかりを与えるため（設計書 §6.1）。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import {
  CARD_IDS,
  DECK_SIZE,
  MAX_COPIES,
  PRESET_DECKS,
  getCardDefinition,
} from '../domain/cards/card-pool';
import { countByCard, costCurve, validateDeck } from '../domain/cards/deck-builder';
import { weaknessTextOf } from './card-text';
import { COLORS } from './theme';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  min-height: 70vh;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
`;

const CardRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid ${COLORS.grid};
  border-radius: 4px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepButton = styled.button`
  min-width: 44px;
  min-height: 44px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Weakness = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${COLORS.opportunity};
`;

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  position: sticky;
  bottom: 0;
  padding: 12px 0;
  background: ${COLORS.dominant};
  border-top: 1px solid ${COLORS.grid};
`;

const StartButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: ${COLORS.opportunity};
  color: ${COLORS.dominant};
  border: none;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Errors = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: ${COLORS.dangerText};
  font-size: 12px;
`;

const CurveList = styled.ul`
  display: flex;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 12px;
`;

interface Props {
  onStart: (cards: string[], seed?: number) => void;
}

export const DeckBuilder: React.FC<Props> = ({ onStart }) => {
  const [cards, setCards] = useState<string[]>([]);
  const [seedText, setSeedText] = useState('');

  const counts = countByCard(cards);
  const validation = validateDeck(cards);
  const curve = costCurve(cards);

  const add = (id: string) => setCards((current) => [...current, id]);
  const remove = (id: string) =>
    setCards((current) => {
      const index = current.lastIndexOf(id);
      return index < 0 ? current : current.filter((_, i) => i !== index);
    });

  const start = () => {
    const parsed = Number.parseInt(seedText, 10);
    onStart(cards, Number.isNaN(parsed) ? undefined : parsed);
  };

  return (
    <Layout>
      <h2>デッキを組む</h2>
      <Controls>
        {Object.values(PRESET_DECKS).map((preset) => (
          <StepButton
            key={preset.id}
            type="button"
            onClick={() => setCards([...preset.cards])}
          >
            {preset.name} を読み込む
          </StepButton>
        ))}
      </Controls>

      <Cards>
        {CARD_IDS.map((id) => {
          const card = getCardDefinition(id);
          const count = counts.get(id) ?? 0;
          return (
            <CardRow key={id} role="group" aria-label={`${card.name} コスト${card.cost}`}>
              <strong>
                {card.name}（コスト{card.cost}）
              </strong>
              <span>{card.description}</span>
              <Weakness>{weaknessTextOf(id)}</Weakness>
              <Controls>
                <StepButton
                  type="button"
                  aria-label={`${card.name} を1枚減らす`}
                  disabled={count === 0}
                  onClick={() => remove(id)}
                >
                  −
                </StepButton>
                <span>{count}</span>
                <StepButton
                  type="button"
                  aria-label={`${card.name} を1枚増やす`}
                  disabled={count >= MAX_COPIES}
                  onClick={() => add(id)}
                >
                  ＋
                </StepButton>
              </Controls>
            </CardRow>
          );
        })}
      </Cards>

      <Footer>
        <strong>
          {cards.length} / {DECK_SIZE}
        </strong>
        <CurveList aria-label="コスト曲線">
          {[...curve.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([cost, n]) => (
              <li key={cost}>
                コスト{cost}: {n}枚
              </li>
            ))}
        </CurveList>
        <label htmlFor="ashen-rampart-seed">シード（空欄なら毎回ランダム）</label>
        <input
          id="ashen-rampart-seed"
          value={seedText}
          inputMode="numeric"
          onChange={(e) => setSeedText(e.target.value)}
        />
        <StartButton type="button" disabled={!validation.isValid} onClick={start}>
          この構成で始める
        </StartButton>
      </Footer>

      {validation.errors.length > 0 && (
        <Errors>
          {validation.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </Errors>
      )}
    </Layout>
  );
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS（既存テスト含む全件）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/DeckBuilder.tsx src/features/ashen-rampart/presentation/DeckBuilder.test.tsx
git commit -m "feat(ashen-rampart): デッキ構築 UI を追加

- 14種から20枚ちょうど・同名3枚まで。検証はドメインの validateDeck に委ねる
- 各カードに効かない相手を表示し、構築時の手がかりにする
- コスト曲線とシード入力を備え、プリセットをたたき台として読み込める

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: 開始前オーバーレイ・カウントダウン表示・徴発の選択 UI

**Files:**
- Create: `presentation/StartOverlay.tsx` / `.test.tsx`
- Create: `presentation/CountdownDisplay.tsx` / `.test.tsx`
- Create: `presentation/LevyChoice.tsx` / `.test.tsx`

**Interfaces:**
- Consumes: Task 7 の `countdownLeftAt` / `COUNTDOWN_TICKS`、Task 11 の `weaknessTextOf`、既存の `COLORS` / `getCardDefinition` / `nextWavePreview`
- Produces: `StartOverlay`（props: `{ preview: string; onStart: () => void }`）/ `CountdownDisplay`（props: `{ tick: number }`）/ `LevyChoice`（props: `{ options: readonly string[]; onChoose: (index: number) => void }`）

- [ ] **Step 1: 失敗するテストを書く**

```tsx
// src/features/ashen-rampart/presentation/StartOverlay.test.tsx
/**
 * 開始前オーバーレイのテスト
 *
 * 「何の説明もカウントダウンもなしだと焦る」への対応。
 * 目的・操作・第1ウェーブの予告を静止状態で示す。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartOverlay } from './StartOverlay';

describe('StartOverlay', () => {
  it('目的が示される', () => {
    render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
    expect(screen.getByText(/砦を守/)).toBeInTheDocument();
  });

  it('操作が示される（カード配置・燠火・一時停止）', () => {
    render(<StartOverlay preview="雑兵8" onStart={jest.fn()} />);
    expect(screen.getByText(/カードを選/)).toBeInTheDocument();
    expect(screen.getByText(/燠火/)).toBeInTheDocument();
    expect(screen.getByText(/スペース/)).toBeInTheDocument();
  });

  it('第1ウェーブの予告が示される', () => {
    render(<StartOverlay preview="雑兵8 俊足5" onStart={jest.fn()} />);
    expect(screen.getByText(/雑兵8 俊足5/)).toBeInTheDocument();
  });

  it('開始ボタンで onStart が呼ばれる', () => {
    const onStart = jest.fn();
    render(<StartOverlay preview="雑兵8" onStart={onStart} />);
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
```

```tsx
// src/features/ashen-rampart/presentation/CountdownDisplay.test.tsx
/**
 * カウントダウン表示のテスト
 *
 * 3 → 2 → 1 を各30tick。0 になったら何も表示しない。
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CountdownDisplay } from './CountdownDisplay';
import { COUNTDOWN_TICKS } from '../domain/combat/combat-state';

describe('CountdownDisplay', () => {
  it('開始直後は3を表示する', () => {
    render(<CountdownDisplay tick={0} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('30tick 経過で2を表示する', () => {
    render(<CountdownDisplay tick={30} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('60tick 経過で1を表示する', () => {
    render(<CountdownDisplay tick={60} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('カウントダウン後は何も表示しない', () => {
    const { container } = render(<CountdownDisplay tick={COUNTDOWN_TICKS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('カウントダウン中は「配置できる」ことを伝える', () => {
    render(<CountdownDisplay tick={0} />);
    expect(screen.getByText(/置けます/)).toBeInTheDocument();
  });
});
```

```tsx
// src/features/ashen-rampart/presentation/LevyChoice.test.tsx
/**
 * 徴発の選択 UI のテスト
 *
 * 選択中もゲームは止まらないため、盤面を覆い隠さない位置に出す。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LevyChoice } from './LevyChoice';

describe('LevyChoice', () => {
  it('候補が名前とコスト付きで並ぶ', () => {
    render(<LevyChoice options={['arrow-tower', 'ballista']} onChoose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /弓兵の塔 コスト2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /弩砲 コスト3/ })).toBeInTheDocument();
  });

  it('選ぶと index が渡る', () => {
    const onChoose = jest.fn();
    render(<LevyChoice options={['arrow-tower', 'ballista']} onChoose={onChoose} />);
    fireEvent.click(screen.getByRole('button', { name: /弩砲 コスト3/ }));
    expect(onChoose).toHaveBeenCalledWith(1);
  });

  it('候補が空なら何も表示しない', () => {
    const { container } = render(<LevyChoice options={[]} onChoose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('選択中も時間が進むことを伝える', () => {
    render(<LevyChoice options={['arrow-tower']} onChoose={jest.fn()} />);
    expect(screen.getByText(/進み/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: FAIL（3モジュール未定義）

- [ ] **Step 3: 3コンポーネントを実装**

```tsx
// src/features/ashen-rampart/presentation/StartOverlay.tsx
/**
 * 灰燼の城壁 - 開始前オーバーレイ
 *
 * 「何の説明もカウントダウンもなしだと焦る」への対応。
 * リアルタイムの緊張感は保ちたいので、説明は静止した状態で先に済ませる。
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 24px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  min-height: 60vh;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
`;

const StartButton = styled.button`
  min-height: 44px;
  padding: 0 20px;
  background: ${COLORS.opportunity};
  color: ${COLORS.dominant};
  border: none;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
`;

interface Props {
  /** 第1ウェーブの予告文字列 */
  preview: string;
  onStart: () => void;
}

export const StartOverlay: React.FC<Props> = ({ preview, onStart }) => (
  <Panel>
    <h2>砦を守る</h2>
    <p>敵を通すとライフが減ります。0 になると敗北です。</p>
    <List>
      <li>カードを選んで盤面に置きます。置ける場所は琥珀色で示されます</li>
      <li>燠火はクリックで再点火できます（マナも配置の間隔も消費しません）</li>
      <li>スペースキーで一時停止できます。盤面と手札は見られますが、置くことはできません</li>
    </List>
    <p>最初の波: {preview}</p>
    <StartButton type="button" onClick={onStart}>
      開始
    </StartButton>
  </Panel>
);
```

```tsx
// src/features/ashen-rampart/presentation/CountdownDisplay.tsx
/**
 * 灰燼の城壁 - 開始カウントダウン
 *
 * 3 → 2 → 1 を各30tick。この間、敵は出現しないが配置はできる。
 * 「見ているだけの3秒」にしないための猶予である。
 */
import React from 'react';
import styled from 'styled-components';
import { countdownLeftAt } from '../domain/combat/combat-state';
import { COLORS } from './theme';

/** 1つの数字を表示する tick 数 */
const TICKS_PER_NUMBER = 30;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  color: ${COLORS.opportunity};
`;

const Number = styled.span`
  font-size: 64px;
  font-weight: 700;
`;

const Hint = styled.span`
  color: ${COLORS.secondary};
`;

interface Props {
  tick: number;
}

export const CountdownDisplay: React.FC<Props> = ({ tick }) => {
  const left = countdownLeftAt(tick);
  if (left <= 0) return null;
  const shown = Math.ceil(left / TICKS_PER_NUMBER);
  return (
    <Overlay aria-live="polite">
      <Number>{shown}</Number>
      <Hint>いまのうちに置けます</Hint>
    </Overlay>
  );
};
```

```tsx
// src/features/ashen-rampart/presentation/LevyChoice.tsx
/**
 * 灰燼の城壁 - 徴発の選択
 *
 * 選択中もゲームは止まらない（止めると一時停止でマナを稼げる抜け道になる）。
 * したがって盤面を覆い隠さず、上部に横並びで出す。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { COLORS } from './theme';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: ${COLORS.dominant};
  border-bottom: 1px solid ${COLORS.opportunity};
  color: ${COLORS.secondary};
`;

const Option = styled.button`
  min-height: 44px;
  padding: 6px 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.opportunity};
  border-radius: 4px;
  cursor: pointer;
`;

const Note = styled.span`
  font-size: 12px;
`;

interface Props {
  options: readonly string[];
  onChoose: (index: number) => void;
}

export const LevyChoice: React.FC<Props> = ({ options, onChoose }) => {
  if (options.length === 0) return null;
  return (
    <Bar>
      <strong>徴発: 1枚選ぶ</strong>
      {options.map((id, index) => {
        const card = getCardDefinition(id);
        return (
          <Option
            key={`${id}-${index}`}
            type="button"
            aria-label={`${card.name} コスト${card.cost}`}
            onClick={() => onChoose(index)}
          >
            {card.name}（{card.cost}）
          </Option>
        );
      })}
      <Note>選ぶあいだも時間は進みます</Note>
    </Bar>
  );
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx jest src/features/ashen-rampart/presentation --no-coverage`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/presentation/StartOverlay.tsx src/features/ashen-rampart/presentation/StartOverlay.test.tsx src/features/ashen-rampart/presentation/CountdownDisplay.tsx src/features/ashen-rampart/presentation/CountdownDisplay.test.tsx src/features/ashen-rampart/presentation/LevyChoice.tsx src/features/ashen-rampart/presentation/LevyChoice.test.tsx
git commit -m "feat(ashen-rampart): 開始オーバーレイ・カウントダウン・徴発選択の UI を追加

- 説明は静止状態で先に済ませ、リアルタイムの緊張感を保つ
- カウントダウン中も配置できることを明示する
- 徴発の選択は盤面を覆わず、時間が進むことを伝える

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: 結線・画面遷移・全体検証

**Files:**
- Modify: `presentation/useAshenRampartGame.ts`
- Modify: `presentation/useAshenRampartGame.test.ts`
- Modify: `presentation/AshenRampartGame.tsx`
- Modify: `presentation/AshenRampartGame.test.tsx`
- Modify: `application/ports/play-log-port.ts`（`run_started` にデッキ構成を追加）
- Modify: `docs/superpowers/specs/2026-07-30-ashen-rampart-iteration1-design.md`（Task 9 の較正結果を反映）

**Interfaces:**
- Consumes: Task 10〜13 のすべて
- Produces: フック戻り値に `levyOptions` / `chooseLevy(index)` / `runSeed` を追加。`AshenRampartGame` が「構築 → 説明 → ラン」の3画面を遷移する

- [ ] **Step 1: ログスキーマにデッキ構成を追加**

```ts
// play-log-port.ts の run_started を変更
  | {
      kind: 'run_started';
      runId: string;
      iteration: number;
      seed: number;
      /** 使用したデッキのカードID列（判定項目2「使われなかったカード種」の分母） */
      deckCards: string[];
    }
```

`presetId` は構築デッキでは意味を持たないため削除する。`CURRENT_ITERATION` を `1` に更新する（反復1のログとして区別するため）。

- [ ] **Step 2: 失敗するテストを書く**

```ts
// useAshenRampartGame.test.ts に追記
describe('反復1: デッキ・シード・徴発', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('渡したデッキでランが始まり、ログにデッキ構成が残る', () => {
    const log = createMockPlayLog();
    const cards = [...PRESET_DECKS.swift!.cards];
    renderHook(() => useAshenRampartGame({ cards, seed: 5, playLog: log }));
    const started = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'run_started' }> => e.kind === 'run_started'
    );
    expect(started).toHaveLength(1);
    expect(started[0]?.seed).toBe(5);
    expect(started[0]?.deckCards).toHaveLength(20);
  });

  it('シードを明示すると2ランで同じ山札になる（再現性）', () => {
    const cards = [...PRESET_DECKS.swift!.cards];
    const a = renderHook(() => useAshenRampartGame({ cards, seed: 99 }));
    const b = renderHook(() => useAshenRampartGame({ cards, seed: 99 }));
    expect(a.result.current.runSeed).toBe(99);
    expect(b.result.current.runSeed).toBe(99);
    expect(a.result.current.state.deck.drawPile).toEqual(b.result.current.state.deck.drawPile);
  });

  it('シードを省略すると2ランで異なるシードになる（毎ラン可変）', () => {
    const cards = [...PRESET_DECKS.swift!.cards];
    const a = renderHook(() => useAshenRampartGame({ cards }));
    const b = renderHook(() => useAshenRampartGame({ cards }));
    // createSeed はカウンタを混ぜるため同一ミリ秒でも衝突しない
    expect(a.result.current.runSeed).not.toBe(b.result.current.runSeed);
    expect(a.result.current.runSeed).toBeGreaterThan(0);
  });

  it('徴発を出すと候補が出て、選ぶと手札に入る', () => {
    const cards = [...PRESET_DECKS.swift!.cards];
    const { result } = renderHook(() => useAshenRampartGame({ cards, seed: 1 }));
    // 徴発が手札に来るまで進める（40tick ごとにドロー）
    for (let i = 0; i < 20; i++) {
      const index = result.current.state.deck.hand.indexOf('levy');
      if (index >= 0) {
        act(() => result.current.selectCard(index));
        act(() => {
          jest.advanceTimersByTime(TICK_INTERVAL_MS);
        });
        break;
      }
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 40);
      });
    }
    expect(result.current.levyOptions.length).toBeGreaterThan(0);
    const handBefore = result.current.state.deck.hand.length;
    act(() => result.current.chooseLevy(0));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    expect(result.current.levyOptions).toEqual([]);
    expect(result.current.state.deck.hand.length).toBe(handBefore + 1);
  });
});
```

- [ ] **Step 3: フックを変更**

引数をオブジェクトに変える（引数が3つ以上になるため。`coding-style.md` の「パラメータは3個以内」に従う）。

```ts
export interface UseAshenRampartGameOptions {
  /** 使用するデッキ。構築 UI から渡す */
  cards: readonly string[];
  /** 固定シード。省略すると毎ラン新しいシードになる */
  seed?: number;
  playLog?: PlayLogPort;
}
```

- `startRunWithDeck(cards, new SeededRandom(seed ?? createSeed()))` で開始する
- 使ったシードを `runSeed` state に保持し、戻り値に含める
- `restart(nextSeed?)` は `nextSeed` があればそれを、無ければ `createSeed()` を使う
- `levyOptions` は `state.levyOptions` をそのまま返す
- `chooseLevy(index)` は `pendingRef.current.push({ kind: 'choose-levy', optionIndex: index })`
- `run_started` のログに `deckCards: [...cards]` を含める

- [ ] **Step 4: `AshenRampartGame` を3画面遷移にする**

```tsx
type Phase = 'building' | 'briefing' | 'running';
```

- `building`: `DeckBuilder` を表示。`onStart(cards, seed)` で `cards` / `seed` を保持し `briefing` へ
- `briefing`: `StartOverlay` を表示。`onStart` で `running` へ。**2回目以降は `localStorage` の既読フラグでスキップ**
- `running`: 従来の盤面。`CountdownDisplay` と `LevyChoice` を追加。決着時の「もう一度挑む」は `building` に戻る（デッキを組み直せるようにする）

**フックの呼び出しは `running` に入ってからにする**（`cards` が決まる前にフックを呼べないため、`running` 用の子コンポーネントに切り出す）。

```tsx
/** ラン本体。cards が確定してからマウントされる */
const RunView: React.FC<{ cards: string[]; seed?: number; onRebuild: () => void }> = ({
  cards,
  seed,
  onRebuild,
}) => {
  const game = useAshenRampartGame({ cards, seed });
  // ...既存の盤面レイアウト + CountdownDisplay + LevyChoice...
};
```

- [ ] **Step 5: `AshenRampartGame` のテストを追加**

```tsx
// AshenRampartGame.test.tsx に追記
describe('画面遷移', () => {
  it('最初はデッキ構築が表示される', () => {
    render(<AshenRampartGame />);
    expect(screen.getByRole('button', { name: 'この構成で始める' })).toBeInTheDocument();
  });

  it('構築 → 説明 → 盤面 の順に進む', () => {
    render(<AshenRampartGame />);
    fireEvent.click(screen.getByRole('button', { name: /速攻型 を読み込む/ }));
    fireEvent.click(screen.getByRole('button', { name: 'この構成で始める' }));
    expect(screen.getByRole('button', { name: '開始' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '開始' }));
    expect(screen.getByRole('button', { name: '一時停止' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 設計書に較正結果を反映**

Task 9 で `waves.ts` を調整した場合、設計書 `2026-07-30-ashen-rampart-iteration1-design.md` の §8 に較正後の値（総HP・総体数）を追記する。調整しなかった場合はそのことを明記する。

- [ ] **Step 7: 全体検証**

Run: `npx jest src/features/ashen-rampart --no-coverage`
Expected: PASS（全件）

Run: `npm run lint:ci && npm run typecheck && npm run build`
Expected: すべて成功（`npm run build` は Bash の `timeout` に 600000 を指定して待つ）

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart/presentation/useAshenRampartGame.ts src/features/ashen-rampart/presentation/useAshenRampartGame.test.ts src/features/ashen-rampart/presentation/AshenRampartGame.tsx src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx src/features/ashen-rampart/application/ports/play-log-port.ts docs/superpowers/specs/2026-07-30-ashen-rampart-iteration1-design.md
git commit -m "feat(ashen-rampart): 構築→説明→ランの遷移とシード可変化を結線

- フック引数をオブジェクトにし、デッキとシードを外から渡す
- run_started にデッキ構成を記録（判定項目2の分母）
- カウントダウン表示と徴発の選択 UI を盤面に組み込む

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 自己レビュー結果

**スペック網羅**: 設計書の全10節を確認した。§1〜2（前段・問い）はタスク不要。§3.2 追加6種→Task 2・3／§3.3 効かない相手→Task 11／§3.4 支配戦略チェック→Task 9／§3.5 新機構4つ→Task 1（地上化・足止め）・Task 2（射程加算）・Task 6（選択ドロー）／§4 シード可変化→Task 10・14／§5 オンボーディング→Task 7（カウントダウン機構）・Task 13（表示）／§6 デッキ構築 UI→Task 8（検証）・Task 12（UI）／§7 判定の事前登録→Task 14（`deckCards` のログ追加）／§8 バランス較正→Task 9／§9 作らないもの→対象外／§10 既知のリスク→Task 1 の飛行判定統一で対処。**未カバーなし。**

**型整合**: `isEnemyFlying` / `isEnemyStunned`（Task 1）は Task 4・5 が使用。`effectiveRange`（Task 2）は Task 5 が使用。`groundedTicks` / `stunTicks`（Task 3）は Task 4 が使用。`heavyBonusThreshold`（Task 3）は Task 5 が使用。`levyOptions` / `choose-levy`（Task 6）は Task 9・14 が使用。`countdownLeftAt`（Task 7）は Task 13 が使用。`validateDeck`（Task 8）は Task 10・12 が使用。`weaknessTextOf`（Task 11）は Task 12 が使用。`startRunWithDeck` / `createSeed`（Task 10）は Task 14 が使用。

**プレースホルダ**: 全ステップにコードまたは具体的な実行コマンドがある。Task 9 の較正のみ結果が実行時にしか分からないため、調整の順序と倍率を具体的に明記した。

**既知の残リスクと注意点**:
- **`effectiveDamage` の署名が Task 5 で変わる**（対象の敵を追加）。既存テスト（`step-tick-combat.test.ts` / `step-tick-actions.test.ts`）の呼び出しも更新が必要。Task 5 Step 5 に明記済み
- **Task 7 のカウントダウンで既存テストの絶対 tick が 90 ずれる**。期待値を緩めるのではなく `COUNTDOWN_TICKS` を足す。Task 7 Step 4 に明記済み
- **Task 9 の較正で3箇所を同時更新する必要がある**。実測値（勝利数・残ライフ）を記録することも明記した（前回は「全PASS」しか残さず閾値の余白が分からなくなった）
- `applyTraps` の対象判定が「落網は飛行のみ、それ以外は地上のみ」という反転を含む。**新しい罠を追加するときはこの分岐を必ず見直すこと**を Task 4 のコメントに残す
