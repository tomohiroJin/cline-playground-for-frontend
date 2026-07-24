# 灰燼の城壁 盤面の空間パズル化（集中スライス）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 平原1面で「タワーをどこに置くか」が意味を持つ空間パズルを、決定的sim を壊さず実装する。

**Architecture:** 既存の Clean Architecture + DDD と決定的純粋関数 `simulateWave` を維持。地形（高台・滞留ゾーン）と隣接シナジー（かがり火）を domain の純粋関数として追加し、射程を希少化する。UI は射程オーバーレイと地形タイルで盤面を可読化する。乱数は不要（全て決定的）。

**Tech Stack:** React 19 / TypeScript / styled-components / Jotai / Jest 30 + @testing-library/react

## Global Constraints

- `any` 型禁止（`unknown` + 型ガード）。`null` より `undefined` を優先
- コメント・テスト名は日本語。テスト名は「何をしたら何が起きるか」
- ファイル名 kebab-case、コンポーネント PascalCase、定数 UPPER_SNAKE_CASE
- `domain/` は外部依存なし。乱数は `RandomFn = () => number` のみ受け取る（本スライスでは乱数不使用）
- 戦闘は決定的純粋関数を維持（同一入力→同一出力）。UI にゲームロジックを持たせない
- `dangerouslySetInnerHTML` 禁止。色だけに依存しない情報伝達（アイコン併用）
- 各タスクは TDD（Red→Green→Refactor）。関数30行目安・早期リターン
- 各タスク末尾で対象テストの緑を確認してからコミット。最終タスクで `npm run ci` 全緑

**設計上の初期数値（実プレイ検証で較正する暫定値）:**
- 弓兵の塔 range `2.5→1.6`、火砲台 range `2→1.5`
- 高台 火力倍率 `HIGH_GROUND_DAMAGE_MULT = 1.3`
- 滞留ゾーン 速度倍率 `SLOW_TERRAIN_MULT = 0.6`
- かがり火 隣接火力ボーナス `towerDamageBonus = 0.25`
- 平原 高台 `[{x:3,y:4},{x:7,y:2}]`、滞留セル `[{x:4,y:3},{x:4,y:2},{x:4,y:1}]`

---

## ファイル構成

| ファイル | 責務 | 変更種別 |
|---------|------|---------|
| `domain/board/stage-map.ts` | ステージ地形定義＋地形述語＋カバレッジ計算 | Modify |
| `domain/board/stage-map.test.ts` | 地形述語・カバレッジのテスト | Create |
| `domain/cards/card-definition.ts` | `TowerSpec.aura` の追加 | Modify |
| `domain/cards/card-pool.ts` | 射程調整・かがり火追加・初期デッキ見直し | Modify |
| `domain/combat/simulate-wave.ts` | 滞留減速・タワー実効値（高台/かがり火） | Modify |
| `domain/combat/simulate-wave.test.ts` | 地形・シナジー・射程の決定的テスト | Modify |
| `presentation/BoardGrid.tsx` | 射程オーバーレイ・地形タイル | Modify |
| `presentation/BoardGrid.test.tsx` | 地形タイル描画・オーバーレイのテスト | Create |
| `presentation/AshenRampartGame.tsx` | 選択カード射程を BoardGrid へ受け渡し | Modify |
| `README.md`（feature 直下） | 空間パズル機構の追記 | Modify |

---

### Task 1: 地形メタと述語をステージマップに追加

**Files:**
- Modify: `src/features/ashen-rampart/domain/board/stage-map.ts`
- Test: `src/features/ashen-rampart/domain/board/stage-map.test.ts`（Create）

**Interfaces:**
- Produces:
  - `interface StageMap` に追加: `highGround?: CellPos[]`, `slowCells?: CellPos[]`
  - `isHighGround(map: StageMap, pos: CellPos): boolean`
  - `isSlowCell(map: StageMap, pos: CellPos): boolean`
  - `coveredPathCells(map: StageMap, from: CellPos, range: number): CellPos[]`（`from` からユークリッド距離 `range` 以内の経路セル）
  - `PLAINS_MAP` に `highGround`/`slowCells` を追加

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/domain/board/stage-map.test.ts` を新規作成:

```typescript
import {
  PLAINS_MAP,
  isHighGround,
  isSlowCell,
  coveredPathCells,
} from './stage-map';

describe('stage-map 地形述語', () => {
  it('高台セルは isHighGround が真になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 3, y: 4 })).toBe(true);
    expect(isHighGround(PLAINS_MAP, { x: 7, y: 2 })).toBe(true);
  });

  it('高台でないスロットは isHighGround が偽になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 1, y: 2 })).toBe(false);
  });

  it('滞留セルは isSlowCell が真になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 4, y: 2 })).toBe(true);
  });

  it('滞留でない経路セルは isSlowCell が偽になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 0, y: 3 })).toBe(false);
  });
});

describe('coveredPathCells', () => {
  it('射程内の経路セルだけを返す', () => {
    // (3,2) から range 1.6: (3,3)=1.0, (2,3)=1.41, (4,3)=1.41 は含む。
    // (4,1)=2.24 は含まない。
    const covered = coveredPathCells(PLAINS_MAP, { x: 3, y: 2 }, 1.6);
    const has = (x: number, y: number) =>
      covered.some((c) => c.x === x && c.y === y);
    expect(has(3, 3)).toBe(true);
    expect(has(4, 3)).toBe(true);
    expect(has(4, 1)).toBe(false);
  });

  it('射程0ならどの経路セルも覆わない', () => {
    expect(coveredPathCells(PLAINS_MAP, { x: 3, y: 2 }, 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/board/stage-map.test.ts`
Expected: FAIL（`isHighGround` 等が未定義）

- [ ] **Step 3: 最小実装**

`stage-map.ts` の `StageMap` インターフェースに任意フィールドを追加:

```typescript
export interface StageMap {
  id: string;
  name: string;
  width: number;
  height: number;
  path: CellPos[];
  buildSlots: CellPos[];
  /** 高台: 火力ボーナスを得る設置スロット（buildSlots の部分集合） */
  highGround?: CellPos[];
  /** 滞留セル: 敵の移動が遅くなる経路セル（path の部分集合） */
  slowCells?: CellPos[];
}
```

`PLAINS_MAP` オブジェクトの末尾（`buildSlots` の後）に追加:

```typescript
  highGround: [
    { x: 3, y: 4 },
    { x: 7, y: 2 },
  ],
  slowCells: [
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
  ],
```

ファイル末尾に述語とカバレッジ関数を追加:

```typescript
const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** 指定セルが高台か */
export const isHighGround = (map: StageMap, pos: CellPos): boolean =>
  (map.highGround ?? []).some((c) => samePos(c, pos));

/** 指定セルが滞留セルか */
export const isSlowCell = (map: StageMap, pos: CellPos): boolean =>
  (map.slowCells ?? []).some((c) => samePos(c, pos));

/** from からユークリッド距離 range 以内の経路セルを返す（射程オーバーレイ用） */
export const coveredPathCells = (
  map: StageMap,
  from: CellPos,
  range: number
): CellPos[] =>
  map.path.filter((c) => Math.hypot(c.x - from.x, c.y - from.y) <= range);
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/board/stage-map.test.ts`
Expected: PASS（全 6 ケース）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/board/stage-map.ts src/features/ashen-rampart/domain/board/stage-map.test.ts
git commit -m "feat: 灰燼の城壁 地形メタ（高台・滞留ゾーン）と述語を追加"
```

---

### Task 2: 射程の希少化（弓兵・火砲台の射程調整）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts:14,22`
- Test: `src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`（Modify）

**Interfaces:**
- Consumes: `simulateWave`, `placeTower`, `createBoard`, `PLAINS_MAP`（既存）
- Produces: なし（数値変更のみ。既存の公開シグネチャは不変）

- [ ] **Step 1: 失敗するテストを書く**

`simulate-wave.test.ts` の `describe('simulateWave', ...)` 内に追加:

```typescript
  it('射程を希少化した弓兵1基では重装1体を仕留めきれず漏らす', () => {
    // 射程1.6では覆える経路が局所化し、万能ではなくなる（空間パズルの前提）
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'arrow-tower',
      PLAINS_MAP.buildSlots[1] // (2,2)
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 0 }],
    };
    const result = simulateWave(board, wave);
    expect(result.leaked).toBe(1);
    expect(result.defeated).toBe(0);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts -t "重装1体を仕留めきれず"`
Expected: FAIL（旧射程2.5では重装を撃破してしまい `leaked` が 0）

- [ ] **Step 3: 最小実装**

`card-pool.ts` の `arrow-tower` と `cannon-tower` の射程を変更:

```typescript
    // arrow-tower
    tower: { range: 1.6, damage: 6, cooldownTicks: 8, splashRadius: 0 },
```

```typescript
    // cannon-tower
    tower: { range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1 },
```

- [ ] **Step 4: テストが通ることを確認**

新テストと既存テストの両方を実行:

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: PASS（新ケース含む全ケース）。既存の発射周期・splash・撃破テストも緑のまま

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/combat/simulate-wave.test.ts
git commit -m "feat: 灰燼の城壁 射程を希少化（弓兵1.6・火砲台1.5）"
```

---

### Task 3: 滞留ゾーンで敵を減速

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/simulate-wave.ts`（import と移動処理②）
- Test: `src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`（Modify）

**Interfaces:**
- Consumes: `isSlowCell`（Task 1）
- Produces: `SLOW_TERRAIN_MULT`（export 定数）。挙動: 敵が `slowCells` 上にいる tick は移動量が `SLOW_TERRAIN_MULT` 倍になる

- [ ] **Step 1: 失敗するテストを書く**

`simulate-wave.test.ts` の先頭 import に `isSlowCell` は不要。テスト用の直線マップを使う。`describe('simulateWave', ...)` 内に追加:

```typescript
  it('滞留セルを通る敵は到達に多くの tick を要する', () => {
    // 中央3セルを滞留にした直線マップで、有り/無しの突破 tick を比較
    const base = {
      id: 'test-line',
      name: 'テスト直線',
      width: 8,
      height: 1,
      path: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
        { x: 7, y: 0 },
      ],
      buildSlots: [],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const normal = simulateWave(createBoard(base), wave);
    const slowed = simulateWave(
      createBoard({ ...base, slowCells: [{ x: 3, y: 0 }, { x: 4, y: 0 }] }),
      wave
    );
    expect(slowed.ticks.length).toBeGreaterThan(normal.ticks.length);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts -t "滞留セルを通る敵"`
Expected: FAIL（減速未実装のため両者の tick 数が等しい）

- [ ] **Step 3: 最小実装**

`simulate-wave.ts` の import に `isSlowCell` を追加:

```typescript
import type { BoardState } from '../board/board-state';
import type { CellPos } from '../board/stage-map';
import { isSlowCell } from '../board/stage-map';
```

`MAX_TICKS` 付近に定数を追加:

```typescript
/** 滞留セル上の敵の移動量倍率 */
export const SLOW_TERRAIN_MULT = 0.6;
```

移動処理②のループを差し替え:

```typescript
    // ② 移動と漏れ判定（滞留セル上は減速）
    for (const e of enemies) {
      if (!e.alive) continue;
      const cell = path[Math.min(Math.floor(e.progress), path.length - 1)];
      const terrainMult = isSlowCell(board.map, cell) ? SLOW_TERRAIN_MULT : 1;
      e.progress += e.spec.speed * modifiers.speedMultiplier * terrainMult;
      if (e.progress >= path.length - 1) {
        e.alive = false;
        e.leaked = true;
        leaked++;
        events.push({ kind: 'leak', enemyIndex: e.index });
      }
    }
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: PASS（新ケース含む全ケース。既存の落とし穴テストは path[5]=(4,2) が滞留セルだが撃破結果は不変）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/simulate-wave.ts src/features/ashen-rampart/domain/combat/simulate-wave.test.ts
git commit -m "feat: 灰燼の城壁 滞留ゾーンで敵を減速"
```

---

### Task 4: タワー実効値の導入と高台の火力ボーナス

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/simulate-wave.ts`（タワー構築と攻撃処理④）
- Test: `src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`（Modify）

**Interfaces:**
- Consumes: `isHighGround`（Task 1）
- Produces:
  - `HIGH_GROUND_DAMAGE_MULT`（export 定数）
  - タワー実効ダメージ = `round(基礎damage × 高台倍率 × board.towerAttackMultiplier)`。攻撃処理④はこの実効値を使う（`board.towerAttackMultiplier` の二重適用をしない）

- [ ] **Step 1: 失敗するテストを書く**

`simulate-wave.test.ts` に追加。高台の効果だけを分離するため、位置は同じで `highGround` フラグだけ異なる2マップで比較する:

```typescript
  it('高台に置いた弓兵は通常スロットより早く敵を撃破する', () => {
    const line = {
      id: 'test-hg',
      name: 'テスト高台',
      width: 6,
      height: 3,
      path: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      buildSlots: [{ x: 2, y: 0 }],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 0 }],
    };
    const normalBoard = placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 });
    const highBoard = placeTower(
      createBoard({ ...line, highGround: [{ x: 2, y: 0 }] }),
      'arrow-tower',
      { x: 2, y: 0 }
    );
    const defeatTick = (r: ReturnType<typeof simulateWave>) =>
      r.ticks.find((t) => t.events.some((e) => e.kind === 'defeat'))?.tick;
    const normalTick = defeatTick(simulateWave(normalBoard, wave));
    const highTick = defeatTick(simulateWave(highBoard, wave));
    expect(normalTick).toBeDefined();
    expect(highTick).toBeDefined();
    expect(highTick!).toBeLessThan(normalTick!);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts -t "高台に置いた弓兵"`
Expected: FAIL（高台ボーナス未実装で両者の撃破 tick が同じ、または `undefined`）

- [ ] **Step 3: 最小実装**

`simulate-wave.ts` の import に `isHighGround` を追加:

```typescript
import { isSlowCell, isHighGround } from '../board/stage-map';
```

定数を追加:

```typescript
/** 高台に設置したタワーの火力倍率 */
export const HIGH_GROUND_DAMAGE_MULT = 1.3;
```

既存の `const towers = board.towers.map(...)` ブロックを、実効値を先算出する形へ差し替え:

```typescript
  // タワー実効値を戦闘開始時に一括算出（placement は1ウェーブ中不変）
  const towers = board.towers.map((t) => {
    const spec = getCardDefinition(t.cardId).tower;
    if (!spec) {
      throw new Error(`タワーカードではありません: ${t.cardId}`);
    }
    const highGroundMult = isHighGround(board.map, t.pos) ? HIGH_GROUND_DAMAGE_MULT : 1;
    const effectiveDamage = Math.round(
      spec.damage * highGroundMult * board.towerAttackMultiplier
    );
    return {
      pos: t.pos,
      range: spec.range,
      splashRadius: spec.splashRadius,
      cooldownTicks: spec.cooldownTicks,
      effectiveDamage,
      cooldown: 0,
    };
  });
```

攻撃処理④のうち `tower.spec.*` 参照と発射時ダメージを実効値へ差し替え:

```typescript
      let target: RuntimeEnemy | null = null;
      for (const e of enemies) {
        if (!e.alive) continue;
        const p = positionOf(e.progress, path);
        const dist = Math.hypot(p.x - tower.pos.x, p.y - tower.pos.y);
        if (dist <= tower.range && (!target || e.progress > target.progress)) {
          target = e;
        }
      }
      if (!target) return;
      const damage = tower.effectiveDamage;
      const targetPos = positionOf(target.progress, path);
      const victims =
        tower.splashRadius > 0
          ? enemies.filter((e) => {
              if (!e.alive) return false;
              const p = positionOf(e.progress, path);
              return (
                Math.hypot(p.x - targetPos.x, p.y - targetPos.y) <=
                tower.splashRadius
              );
            })
          : [target];
      events.push({ kind: 'shot', towerIndex, targetIndex: target.index });
      for (const v of victims) {
        v.hp -= damage;
        if (v.hp <= 0 && v.alive) kill(v, events);
      }
      tower.cooldown = tower.cooldownTicks - 1;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: PASS（新ケース含む全ケース。実効値化しても既存の撃破数・発射周期は不変）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/combat/simulate-wave.ts src/features/ashen-rampart/domain/combat/simulate-wave.test.ts
git commit -m "feat: 灰燼の城壁 タワー実効値化と高台の火力ボーナス"
```

---

### Task 5: かがり火（隣接シナジー）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`（`TowerSpec.aura`）
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`（かがり火追加）
- Modify: `src/features/ashen-rampart/domain/combat/simulate-wave.ts`（オーラ塔の除外と隣接ボーナス）
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`（アイコン）
- Test: `src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`（Modify）

**Interfaces:**
- Consumes: Task 4 の `towers` 実効値算出ブロック
- Produces:
  - `TowerSpec.aura?: { towerDamageBonus: number }`
  - カード `beacon`（`type: 'tower'`, `tower.aura.towerDamageBonus = 0.25`, `damage: 0`, `range: 0`）
  - 挙動: オーラ塔は攻撃せず、8近傍の攻撃タワーの実効ダメージを `×(1 + Σ隣接オーラボーナス)` する

- [ ] **Step 1: 失敗するテストを書く**

`simulate-wave.test.ts` に追加:

```typescript
  it('かがり火は自身では攻撃しない', () => {
    const board = placeTower(
      createBoard(PLAINS_MAP),
      'beacon',
      PLAINS_MAP.buildSlots[1]
    );
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0 }],
    };
    const result = simulateWave(board, wave);
    expect(result.defeated).toBe(0);
    expect(result.leaked).toBe(1);
  });

  it('かがり火に隣接する弓兵は火力が上がり早く撃破する', () => {
    const line = {
      id: 'test-beacon',
      name: 'テスト篝火',
      width: 6,
      height: 3,
      path: [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      // (2,0) と (3,0) は隣接（Chebyshev=1）
      buildSlots: [{ x: 2, y: 0 }, { x: 3, y: 0 }],
    };
    const wave: WaveDefinition = {
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 0 }],
    };
    const soloBoard = placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 });
    const buffedBoard = placeTower(
      placeTower(createBoard(line), 'arrow-tower', { x: 2, y: 0 }),
      'beacon',
      { x: 3, y: 0 }
    );
    const defeatTick = (r: ReturnType<typeof simulateWave>) =>
      r.ticks.find((t) => t.events.some((e) => e.kind === 'defeat'))?.tick;
    const soloTick = defeatTick(simulateWave(soloBoard, wave));
    const buffedTick = defeatTick(simulateWave(buffedBoard, wave));
    expect(soloTick).toBeDefined();
    expect(buffedTick).toBeDefined();
    expect(buffedTick!).toBeLessThan(soloTick!);
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts -t "かがり火"`
Expected: FAIL（`beacon` カード未定義で `getCardDefinition` が例外）

- [ ] **Step 3: 最小実装**

`card-definition.ts` の `TowerSpec` に `aura` を追加:

```typescript
export interface TowerSpec {
  /** 射程（セル距離・ユークリッド） */
  range: number;
  /** 1発のダメージ */
  damage: number;
  /** 攻撃間隔（tick） */
  cooldownTicks: number;
  /** 範囲ダメージ半径（0 = 単体攻撃） */
  splashRadius: number;
  /** オーラ効果（定義されていれば攻撃せず、隣接タワーを強化する） */
  aura?: { towerDamageBonus: number };
}
```

`card-pool.ts` の `CARDS` 配列に追加（`smith-blessing` の前あたり）:

```typescript
  {
    id: 'beacon',
    name: 'かがり火',
    type: 'tower',
    cost: 2,
    rarity: 'rare',
    description: '攻撃はしないが、隣接する味方タワーの攻撃力を+25%する篝火。',
    tower: {
      range: 0,
      damage: 0,
      cooldownTicks: 0,
      splashRadius: 0,
      aura: { towerDamageBonus: 0.25 },
    },
  },
```

`simulate-wave.ts` の `CellPos` import は既存。タワー構築ブロック（Task 4 で作成）を、オーラ源の分離・除外・隣接ボーナス込みへ差し替え:

```typescript
  // 8近傍判定（対角含む）。同一セルは除く
  const areAdjacent = (a: CellPos, b: CellPos): boolean =>
    Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1;

  // オーラ源（かがり火など）。攻撃タワーの実効値算出に使う
  const auraSources = board.towers.filter(
    (t) => getCardDefinition(t.cardId).tower?.aura
  );

  // タワー実効値を戦闘開始時に一括算出（placement は1ウェーブ中不変）
  const towers = board.towers
    .map((t) => {
      const spec = getCardDefinition(t.cardId).tower;
      if (!spec) {
        throw new Error(`タワーカードではありません: ${t.cardId}`);
      }
      return { pos: t.pos, spec };
    })
    // オーラ塔は攻撃しない
    .filter((t) => !t.spec.aura)
    .map((t) => {
      const beaconBonus = auraSources
        .filter((b) => areAdjacent(b.pos, t.pos))
        .reduce(
          (sum, b) => sum + getCardDefinition(b.cardId).tower!.aura!.towerDamageBonus,
          0
        );
      const highGroundMult = isHighGround(board.map, t.pos)
        ? HIGH_GROUND_DAMAGE_MULT
        : 1;
      const effectiveDamage = Math.round(
        t.spec.damage * highGroundMult * board.towerAttackMultiplier * (1 + beaconBonus)
      );
      return {
        pos: t.pos,
        range: t.spec.range,
        splashRadius: t.spec.splashRadius,
        cooldownTicks: t.spec.cooldownTicks,
        effectiveDamage,
        cooldown: 0,
      };
    });
```

`BoardGrid.tsx` のアイコン算出をオーラ塔対応に差し替え:

```typescript
      const towerSpec = tower ? getCardDefinition(tower.cardId).tower : undefined;
      const icon = towerSpec
        ? towerSpec.aura
          ? '🔥'
          : towerSpec.splashRadius
            ? '💣'
            : '🏹'
        : trap
          ? '🕳'
          : '';
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/combat/simulate-wave.test.ts`
Expected: PASS（かがり火2ケース含む全ケース）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-definition.ts src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/combat/simulate-wave.ts src/features/ashen-rampart/presentation/BoardGrid.tsx src/features/ashen-rampart/domain/combat/simulate-wave.test.ts
git commit -m "feat: 灰燼の城壁 かがり火（隣接火力シナジー）を追加"
```

---

### Task 6: 初期デッキと報酬プールの見直し

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts:95-116`（`INITIAL_DECK`/`REWARD_POOL`）
- Test: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`（Modify）

**Interfaces:**
- Consumes: `getCardDefinition`, `INITIAL_DECK`, `REWARD_POOL`（既存）
- Produces: なし（データ変更のみ）。初期デッキは10枚を維持し、種別多様性を持たせる

- [ ] **Step 1: 失敗するテストを書く**

`card-pool.test.ts` に追加（既存の import・構造に合わせる）:

```typescript
  it('初期デッキは10枚で、かがり火と火砲台を含む', () => {
    expect(INITIAL_DECK).toHaveLength(10);
    expect(INITIAL_DECK).toContain('beacon');
    expect(INITIAL_DECK).toContain('cannon-tower');
  });

  it('初期デッキの弓兵の塔は4枚に抑えられている', () => {
    const arrows = INITIAL_DECK.filter((id) => id === 'arrow-tower');
    expect(arrows).toHaveLength(4);
  });
```

※ `card-pool.test.ts` は既に `INITIAL_DECK`/`REWARD_POOL` を import 済み。既存の「tower6・spell3・trap1」テストは新デッキ（弓兵4＋火砲台1＋かがり火1＝tower6）でもそのまま通る（回帰を壊さない）。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/card-pool.test.ts -t "初期デッキ"`
Expected: FAIL（現行は弓兵6枚・beacon 無し）

- [ ] **Step 3: 最小実装**

`card-pool.ts` の `INITIAL_DECK` と `REWARD_POOL` を差し替え:

```typescript
/** 初期デッキ10枚: 弓兵×4・火砲台×1・かがり火×1・業火×2・補給×1・棘罠×1 */
export const INITIAL_DECK: readonly string[] = [
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'arrow-tower',
  'cannon-tower',
  'beacon',
  'fire-blast',
  'fire-blast',
  'supply',
  'spike-trap',
];

/** ウェーブクリア報酬の抽選プール */
export const REWARD_POOL: readonly string[] = [
  'cannon-tower',
  'beacon',
  'pitfall',
  'mud-time',
  'smith-blessing',
  'arrow-tower',
  'fire-blast',
];
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: PASS（全ケース）

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart/domain/cards/card-pool.ts src/features/ashen-rampart/domain/cards/card-pool.test.ts
git commit -m "feat: 灰燼の城壁 初期デッキに火砲台・かがり火を加え多様化"
```

---

### Task 7: 射程オーバーレイと地形タイル（可読性）

**Files:**
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/AshenRampartGame.tsx`
- Test: `src/features/ashen-rampart/presentation/BoardGrid.test.tsx`（Create）

**Interfaces:**
- Consumes: `isHighGround`, `isSlowCell`, `coveredPathCells`（Task 1）
- Produces:
  - `BoardGrid` の `Props` に `placingRange?: number` を追加
  - 地形タイル: 高台セルは `⛰`、滞留セルは `🌫` を重畳表示し、`aria-label` に「高台」「滞留」を付与
  - タワーカード選択中にスロットへホバーすると、その射程で覆う経路セルを枠でハイライト

- [ ] **Step 1: 失敗するテストを書く**

`src/features/ashen-rampart/presentation/BoardGrid.test.tsx` を新規作成:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BoardGrid } from './BoardGrid';
import { createBoard } from '../domain/board/board-state';
import { PLAINS_MAP } from '../domain/board/stage-map';

describe('BoardGrid 地形タイル', () => {
  const board = createBoard(PLAINS_MAP);

  it('高台セルは aria-label に「高台」を含む', () => {
    render(
      <BoardGrid
        board={board}
        enemies={[]}
        placingType={null}
        onCellClick={() => undefined}
      />
    );
    // 高台は (3,4)
    expect(
      screen.getByRole('button', { name: /マス \(3, 4\).*高台/ })
    ).toBeInTheDocument();
  });

  it('滞留セルは aria-label に「滞留」を含む', () => {
    render(
      <BoardGrid
        board={board}
        enemies={[]}
        placingType={null}
        onCellClick={() => undefined}
      />
    );
    // 滞留は (4,2)
    expect(
      screen.getByRole('button', { name: /マス \(4, 2\).*滞留/ })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/features/ashen-rampart/presentation/BoardGrid.test.tsx`
Expected: FAIL（aria-label に地形が未反映）

- [ ] **Step 3: 最小実装**

`BoardGrid.tsx` を更新。import に地形述語を追加:

```typescript
import {
  isHighGround,
  isSlowCell,
  coveredPathCells,
} from '../domain/board/stage-map';
import { useState } from 'react';
```

`Cell` の styled に地形色とオーバーレイ枠のプロップを追加（`$terrain`, `$covered`）:

```typescript
const Cell = styled.button<{
  $kind: 'path' | 'slot' | 'empty';
  $placeable: boolean;
  $terrain: 'highground' | 'slow' | 'none';
  $covered: boolean;
}>`
  border: none;
  border-radius: 4px;
  font-size: 16px;
  padding: 0;
  position: relative;
  background: ${({ $kind, $terrain }) =>
    $terrain === 'highground'
      ? '#3a4a2a'
      : $terrain === 'slow'
        ? '#2a3348'
        : $kind === 'path'
          ? '#3d3230'
          : $kind === 'slot'
            ? '#222b3a'
            : '#1a1418'};
  outline: ${({ $placeable, $covered }) =>
    $placeable ? '2px solid #7fb069' : $covered ? '2px solid #e8b04b' : 'none'};
  cursor: ${({ $placeable }) => ($placeable ? 'pointer' : 'default')};
`;
```

`Props` に `placingRange` を追加し、コンポーネント本体でホバー状態と被覆セルを計算:

```typescript
interface Props {
  board: BoardState;
  enemies: EnemySnapshot[];
  placingType: 'tower' | 'trap' | null;
  /** 選択中タワーカードの射程（オーバーレイ用）。未選択/非タワーは undefined */
  placingRange?: number;
  onCellClick: (pos: CellPos) => void;
}

export const BoardGrid: React.FC<Props> = ({
  board,
  enemies,
  placingType,
  placingRange,
  onCellClick,
}) => {
  const { width, height, path, buildSlots } = board.map;
  const [hovered, setHovered] = useState<CellPos | null>(null);

  // 選択中タワーをホバーセルに置いた場合に覆う経路セル
  const coveredKeys = new Set<string>();
  if (placingType === 'tower' && placingRange !== undefined && hovered) {
    for (const c of coveredPathCells(board.map, hovered, placingRange)) {
      coveredKeys.add(`${c.x}-${c.y}`);
    }
  }
```

セル生成ループ内で地形・被覆・aria を反映:

```typescript
      const terrain: 'highground' | 'slow' | 'none' = isHighGround(board.map, pos)
        ? 'highground'
        : isSlowCell(board.map, pos)
          ? 'slow'
          : 'none';
      const terrainLabel =
        terrain === 'highground' ? '・高台' : terrain === 'slow' ? '・滞留' : '';
      const marker = terrain === 'highground' ? '⛰' : terrain === 'slow' ? '🌫' : '';
      const covered = coveredKeys.has(`${x}-${y}`);
      cells.push(
        <Cell
          key={`${x}-${y}`}
          $kind={isPath ? 'path' : isSlot ? 'slot' : 'empty'}
          $placeable={placeable}
          $terrain={terrain}
          $covered={covered}
          onClick={() => onCellClick({ x, y })}
          onMouseEnter={() => setHovered({ x, y })}
          onMouseLeave={() => setHovered(null)}
          aria-label={`マス (${x}, ${y})${terrainLabel}`}
        >
          {icon || marker}
        </Cell>
      );
```

※ `icon || marker`: タワー/罠アイコンがある場合はそちらを優先し、無ければ地形マーカーを表示。

`AshenRampartGame.tsx` で選択カードの射程を算出して渡す。既存の `placingType` useMemo の近くに追加:

```typescript
  const placingRange = useMemo(() => {
    if (selectedHandIndex === null) return undefined;
    const cardId = run.deck.hand[selectedHandIndex];
    if (cardId === undefined) return undefined;
    return getCardDefinition(cardId).tower?.range;
  }, [selectedHandIndex, run.deck.hand]);
```

`<BoardGrid ... />` に `placingRange={placingRange}` を追加:

```typescript
          <BoardGrid
            board={run.board}
            enemies={enemies}
            placingType={placingType}
            placingRange={placingRange}
            onCellClick={game.placeAt}
          />
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/features/ashen-rampart/presentation/BoardGrid.test.tsx`
Expected: PASS（高台・滞留の2ケース）

- [ ] **Step 5: 既存プレゼンテーションテストの回帰確認**

Run: `npm test -- src/features/ashen-rampart/presentation`
Expected: PASS（`AshenRampartGame.test.tsx` / `useAshenRampartGame.test.ts` 含め緑）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart/presentation/BoardGrid.tsx src/features/ashen-rampart/presentation/AshenRampartGame.tsx src/features/ashen-rampart/presentation/BoardGrid.test.tsx
git commit -m "feat: 灰燼の城壁 射程オーバーレイと地形タイルで盤面を可読化"
```

---

### Task 8: README 更新・CI 確認・実プレイ検証ゲート

**Files:**
- Modify: `src/features/ashen-rampart/README.md`

**Interfaces:**
- Consumes: 全タスクの成果
- Produces: なし（ドキュメント＋検証）

- [ ] **Step 1: README に空間パズル機構を追記**

`README.md` の「ゲームシステム（P1）」節の後に、新機構の説明を追加:

```markdown
## 盤面の空間パズル（本スライスで追加）

配置そのものを意思決定にするための3機構。すべて決定的シミュレーション内で完結する。

- **射程の希少化**: 弓兵の塔 射程1.6・火砲台1.5。1基で経路全体は覆えず、どのセグメントを守るかを選ぶ
- **地形**:
  - **高台（⛰）**: 設置スロットの一部。置いたタワーの火力 +30%。希少ゆえ争奪が起きる
  - **滞留ゾーン（🌫）**: 経路の一部セルで敵が減速（×0.6）。ここを覆うタワーは手数が増える高価値カバー域
- **かがり火（🔥）**: 攻撃しないオーラ塔。隣接（8近傍）の味方タワー火力を +25%。散らす（カバレッジ）か固める（バフ）かの緊張を生む
- **可読性**: タワーカード選択中にスロットへホバーすると、その射程で覆う経路セルが枠表示される
```

- [ ] **Step 2: 全パイプライン確認**

Run: `npm run ci`
Expected: `lint:ci` / `typecheck` / `test:coverage` / `build` が全て成功（E2E はローカル実行不可のため CI 上で確認）

- [ ] **Step 3: コミット**

```bash
git add src/features/ashen-rampart/README.md
git commit -m "docs: 灰燼の城壁 盤面の空間パズル機構を README に追記"
```

- [ ] **Step 4: 実プレイ検証ゲート（人間の確認が必須）**

`npm start` で起動し、以下を実プレイで確認する。**面白さの核が確認できるまで数値較正を許容する**（射程・高台倍率・減速率・かがり火ボーナス・デッキ配分・高台/滞留の配置）:

- [ ] 「どこに置くか」で結果が変わる（雑な配置では W3 の重装を止められず負けうる）
- [ ] 高台と滞留ゾーンの二律背反が体感できる（最良塔を高台に置くと別の要所が手薄になる）
- [ ] かがり火の「散らす vs 固める」が悩ましい
- [ ] 射程オーバーレイで被覆と穴が読める
- [ ] 勝ち筋が複数あり、一意の正解ではない

検証で物足りなければ、量を足す前に数値・配置を再設計する（早期実プレイ検証の原則）。

---

## Self-Review 記録

- **Spec 網羅**: 機構1（Task 2）／機構2 高台（Task 4）・滞留（Task 3）／機構3 かがり火（Task 5）／可読性（Task 7）／カードプール（Task 6）／README・検証ゲート（Task 8）。スペック全節にタスクが対応。
- **プレースホルダ**: なし（全ステップに実コード・実コマンド・期待出力を記載）。
- **型整合**: `effectiveDamage`/`range`/`splashRadius`/`cooldownTicks`/`cooldown` は Task 4 で導入し Task 5 で拡張（同名）。`aura.towerDamageBonus`・`highGround`/`slowCells`・`placingRange`・`coveredPathCells` はタスク間で一貫。
- **決定性**: 追加機構は全て純粋関数。乱数不使用。既存の決定性テストは不変。
