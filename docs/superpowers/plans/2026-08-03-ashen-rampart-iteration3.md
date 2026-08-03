# 灰燼の城壁 反復3（コンセプト改訂）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 守り手にHPを持たせて地上の敵を前線で止める戦闘モデルへ移行し、進軍路を2レーンに分けて「前線をどこに敷き、何を捨てるか」という判断を成立させる。

**Architecture:** 既存の `stepTick`（純粋関数・1 tick の全段階を順に確定する）の骨格は変えない。加わるのは「移動の前にブロック判定を挟む」ことと「移動の後に敵の攻撃を挟む」ことの2箇所だけ。ステージは `path: CellPos[]` を `lanes: CellPos[][]` に変え、敵は `laneIndex` を持つ。`positionOf` の「経路配列上の進捗」というモデルはそのまま使え、参照する配列がレーンごとに分かれるだけである。

**Tech Stack:** TypeScript 5 / React 19 / Jest 30 + @testing-library/react / styled-components

**設計書:** `docs/superpowers/specs/2026-08-03-ashen-rampart-iteration3-design.md`

## Global Constraints

- 応答・コメント・ドキュメントは**日本語**。コード（変数名・関数名）は英語可
- `any` 型の使用禁止（`unknown` + 型ガードを使う）
- `domain/` から `infrastructure/` や `presentation/` への参照禁止
- 他の Feature モジュールへの直接参照禁止
- `dangerouslySetInnerHTML` の使用禁止
- テストファイルは対象と同じディレクトリに `*.test.ts(x)` で配置
- 関数は30行以内を目安、パラメータは3個以内（超える場合はオブジェクトにまとめる）
- **配色は既存トークンのみ。新しい色を増やさない**（`theme.ts`: `dominant` / `secondary` / `danger` / `dangerText` / `opportunity` / `grid`）
- **情報を色だけに載せない。** グレースケールでも形とサイズで判別できること（`enemy-visual.ts` の規約）
- **`danger` の用途は「脅威の実害」**（漏れ・守り手の消滅）。罠・味方の行動には `secondary`、`opportunity` はエフェクトに使わない
- 単体テスト実行: `npx jest <パス> -t "<テスト名>"`
- 全体確認: `npm run ci`（lint:ci → typecheck → test:coverage → build）

## ファイル構成

**新規作成**

| ファイル | 責務 |
|---|---|
| `domain/combat/blocking.ts` | ブロック判定と敵の攻撃の純粋関数群。`stepTick` から呼ぶ |
| `domain/combat/blocking.test.ts` | 同テスト |
| `domain/combat/step-tick-blocking.test.ts` | `stepTick` 経由の統合テスト（止まる／削れる／消滅して再開する） |
| `domain/combat/step-tick-piercing.test.ts` | 貫通のテスト |

**主要な変更**

| ファイル | 変更内容 |
|---|---|
| `domain/board/stage-map.ts` | `path` → `lanes`、`buildSlots` 廃止、2レーンの平原マップ |
| `domain/combat/combat-state.ts` | `PlacedTower` → `PlacedUnit`（hp/maxHp）、`towers` → `units`、`ActiveEnemy.laneIndex` |
| `domain/combat/enemies.ts` | `EnemySpec.attack` / `attackIntervalTicks` |
| `domain/combat/waves.ts` | `WaveEntry.laneIndex`、ウェーブ再構成 |
| `domain/combat/step-tick.ts` | ブロック判定・敵の攻撃・貫通・クールダウン限定・配置判定 |
| `domain/cards/card-definition.ts` | `TowerSpec.hp` / `piercing`、`PlacementKind` 4種 |
| `domain/cards/card-pool.ts` | 14種の数値改訂、石壁の守り手化 |
| `domain/combat/run-simulation.ts` | 戦略変種2つ |
| `domain/combat/balance.test.ts` | 不変条件5本 |
| `presentation/combat-effects.ts` | `unit-damaged` / `unit-lost` |
| `presentation/BoardEffectLayer.tsx` | 同描画 |
| `presentation/BoardGrid.tsx` | 2レーン描画・自由配置 |
| `presentation/run-summary.ts` | 判定7項目 |
| `application/ports/play-log-port.ts` | `CURRENT_ITERATION = 3` |

---

### Task 1: レーン構造への移行（振る舞いは変えない）

`path: CellPos[]` を `lanes: CellPos[][]` に変える。**この Task では単一レーン（`lanes = [PLAINS_PATH]`）のままにし、既存のテストが全部緑のままであることを確認する。** 形だけ先に変えて、振る舞いの変更（Task 2 以降）と混ぜない。

**Files:**
- Modify: `src/features/ashen-rampart/domain/board/stage-map.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/combat-effects.ts`
- Modify: `src/features/ashen-rampart/presentation/run-summary.ts`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Modify: `src/features/ashen-rampart/application/ports/play-log-port.ts`
- Test: `src/features/ashen-rampart/domain/board/stage-map.test.ts`

**Interfaces:**
- Produces: `StageMap.lanes: CellPos[][]`、`laneOf(map, laneIndex): readonly CellPos[]`、`allPathCells(map): CellPos[]`、`isPathCell(map, pos): boolean`、`fortressCell(map): CellPos | undefined`

- [ ] **Step 1: `CURRENT_ITERATION` を 3 にする**

localStorage は同一キーに追記し続けるため、忘れるとベースラインと混ざる。**最初に更新する。**

`src/features/ashen-rampart/application/ports/play-log-port.ts:9`

```ts
export const CURRENT_ITERATION = 3;
```

- [ ] **Step 2: 失敗するテストを書く**

`src/features/ashen-rampart/domain/board/stage-map.test.ts` に追記する。

```ts
import { PLAINS_MAP, laneOf, allPathCells, isPathCell, fortressCell } from './stage-map';

describe('レーン構造', () => {
  it('lanes は1本以上のレーンを持ち、laneOf でセル列を取得できる', () => {
    expect(PLAINS_MAP.lanes.length).toBeGreaterThanOrEqual(1);
    expect(laneOf(PLAINS_MAP, 0).length).toBeGreaterThan(0);
  });

  it('allPathCells は全レーンのセルを重複なく返す', () => {
    const cells = allPathCells(PLAINS_MAP);
    const keys = cells.map((c) => `${c.x},${c.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('isPathCell は経路セルにだけ true を返す', () => {
    const first = laneOf(PLAINS_MAP, 0)[0];
    expect(first).toBeDefined();
    expect(isPathCell(PLAINS_MAP, first!)).toBe(true);
    expect(isPathCell(PLAINS_MAP, { x: 0, y: 0 })).toBe(false);
  });

  it('fortressCell は全レーンで共通の終端セルを返す', () => {
    const fortress = fortressCell(PLAINS_MAP);
    expect(fortress).toBeDefined();
    PLAINS_MAP.lanes.forEach((lane) => {
      expect(lane[lane.length - 1]).toEqual(fortress);
    });
  });
});
```

- [ ] **Step 3: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/board/stage-map.test.ts -t "レーン構造"`
Expected: FAIL（`laneOf is not a function` など）

- [ ] **Step 4: `stage-map.ts` を書き換える**

`StageMap` から `path` と `buildSlots` を消し、`lanes` を入れる。`buildSlotsNearPath` と `BUILD_SLOT_MAX_DISTANCE` は**削除する**（設計書 §3.2 で捨てるものに挙げた）。

```ts
export interface StageMap {
  id: string;
  name: string;
  width: number;
  height: number;
  /** 敵の進軍路。各レーンは入口→砦の順に並んだ隣接セル列。終端（砦）は全レーンで共通 */
  lanes: CellPos[][];
  /** 高台: 火力ボーナスを得るセル（経路外） */
  highGround?: CellPos[];
  /** 滞留セル: 敵の移動が遅くなる経路セル */
  slowCells?: CellPos[];
}

/** 指定レーンのセル列。未知の index は空配列（呼び出し側で分岐させないため） */
export const laneOf = (map: StageMap, laneIndex: number): readonly CellPos[] =>
  map.lanes[laneIndex] ?? [];

/** 全レーンの経路セルを重複なく返す */
export const allPathCells = (map: StageMap): CellPos[] => {
  const seen = new Set<string>();
  const cells: CellPos[] = [];
  map.lanes.forEach((lane) =>
    lane.forEach((c) => {
      const key = `${c.x},${c.y}`;
      if (seen.has(key)) return;
      seen.add(key);
      cells.push(c);
    })
  );
  return cells;
};

/** 指定セルがいずれかのレーン上にあるか */
export const isPathCell = (map: StageMap, pos: CellPos): boolean =>
  map.lanes.some((lane) => lane.some((c) => samePos(c, pos)));

/** 敵が到達したら漏れとなる終端（砦）。全レーンで共通である前提 */
export const fortressCell = (map: StageMap): CellPos | undefined => {
  const first = map.lanes[0];
  return first?.[first.length - 1];
};

/** 指定レーンの入口 */
export const entranceCell = (map: StageMap, laneIndex: number): CellPos | undefined =>
  laneOf(map, laneIndex)[0];
```

`PLAINS_MAP` は **この Task では単一レーンのまま**にする。

```ts
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: PLAINS_WIDTH,
  height: PLAINS_HEIGHT,
  lanes: [PLAINS_PATH],
  highGround: [{ x: 3, y: 4 }, { x: 7, y: 2 }],
  slowCells: [{ x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 }],
};
```

`pathDirectionAt` / `remainingPathCells` / `coveredPathCells` は `map.path` を参照しているので、レーンを引数に取る形へ変える。

```ts
export const pathDirectionAt = (
  lane: readonly CellPos[],
  pos: CellPos
): PathDirection | undefined => {
  const index = lane.findIndex((c) => samePos(c, pos));
  if (index < 0) return undefined;
  const next = lane[index + 1];
  const current = lane[index];
  if (!next || !current) return undefined;
  if (next.x > current.x) return 'right';
  if (next.x < current.x) return 'left';
  if (next.y > current.y) return 'down';
  if (next.y < current.y) return 'up';
  return undefined;
};

/** from からユークリッド距離 range 以内の経路セル（全レーン）を返す */
export const coveredPathCells = (
  map: StageMap,
  from: CellPos,
  range: number
): CellPos[] =>
  allPathCells(map).filter((c) => Math.hypot(c.x - from.x, c.y - from.y) <= range);
```

`remainingPathCells` は敵の所属レーンが必要になるため、レーンを受け取る形に変える。

```ts
export const remainingPathCells = (
  lane: readonly CellPos[],
  pos: { x: number; y: number }
): number => {
  if (lane.length === 0) return 0;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  lane.forEach((cell, index) => {
    const distance = Math.hypot(cell.x - pos.x, cell.y - pos.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return lane.length - 1 - nearestIndex;
};
```

- [ ] **Step 5: 呼び出し側を追随させる**

この Task では**単一レーンのまま**なので、呼び出し側は `laneOf(map, 0)` または `allPathCells(map)` に置き換えるだけでよい。

- `step-tick.ts`: `map.path` → `laneOf(map, 0)`、`goal = laneOf(map, 0).length - 1`、`map.buildSlots` → **`canPlaceAt` の `slot` 分岐は「経路外の全マス」に変える**（Task 8 で本格的に扱うが、`buildSlots` が消えるためここで暫定対応する）

```ts
// step-tick.ts の canPlaceAt（Task 8 で再度書き換える暫定版）
const isInsideBoard = (map: StageMap, pos: CellPos): boolean =>
  pos.x >= 0 && pos.x < map.width && pos.y >= 0 && pos.y < map.height;

export const canPlaceAt = (
  state: CombatState,
  card: CardDefinition,
  pos: CellPos,
  map: StageMap
): boolean => {
  const kind = placementKindOf(card);
  if (kind === 'none') return false;
  if (!isInsideBoard(map, pos)) return false;
  if (kind === 'path') {
    return isPathCell(map, pos) && !state.traps.some((t) => samePos(t.pos, pos));
  }
  return !isPathCell(map, pos) && !isSlotOccupied(state, pos);
};
```

- `run-simulation.ts`: `const candidates = kind === 'path' ? allPathCells(map) : offPathCells(map);`
  `offPathCells` は `stage-map.ts` に追加する。

```ts
/** 経路外の全セル（左上から行優先） */
export const offPathCells = (map: StageMap): CellPos[] => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const pos = { x, y };
      if (!isPathCell(map, pos)) cells.push(pos);
    }
  }
  return cells;
};
```

- `BoardGrid.tsx` / `combat-effects.ts` / `run-summary.ts` / `useAshenRampartGame.ts`: `map.path` → `laneOf(map, 0)` または `allPathCells(map)`。`map.buildSlots` → `offPathCells(map)`

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart -t "レーン構造"`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: 全緑。**ここで落ちるテストがあれば、それは呼び出し側の追随漏れである。** 数値を緩めて通してはならない

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "refactor(ashen-rampart): 経路をレーン構造へ移行し設置マス規則を廃止する

path: CellPos[] を lanes: CellPos[][] に変える。この時点では
単一レーンのままで振る舞いは変えない。形の変更と振る舞いの変更を
混ぜないため（反復2 の用語改名で得た方針）。

buildSlots と BUILD_SLOT_MAX_DISTANCE を削除し、配置可否は
「経路外か」で判定する暫定形にした（Task 8 で本格化する）。"
```

---

### Task 2: 2レーンの平原マップと敵のレーン所属

**Files:**
- Modify: `src/features/ashen-rampart/domain/board/stage-map.ts`
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`
- Modify: `src/features/ashen-rampart/domain/combat/waves.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Test: `src/features/ashen-rampart/domain/board/stage-map.test.ts`
- Test: `src/features/ashen-rampart/domain/combat/step-tick.test.ts`

**Interfaces:**
- Consumes: Task 1 の `laneOf` / `allPathCells` / `isPathCell` / `fortressCell`
- Produces: `ActiveEnemy.laneIndex: number`、`WaveEntry.laneIndex: number`、2レーンの `PLAINS_MAP`

- [ ] **Step 1: 失敗するテストを書く**

設計書 §5.2 が固定する性質を、そのままテストにする。**具体的なセル列は較正で動くが、この3つの性質は動かない。**

`src/features/ashen-rampart/domain/board/stage-map.test.ts` に追記する。

```ts
import { PLAINS_MAP, laneOf, fortressCell, allPathCells, offPathCells } from './stage-map';

describe('2レーンの平原', () => {
  it('レーンが2本ある', () => {
    expect(PLAINS_MAP.lanes).toHaveLength(2);
  });

  it('砦セル以外を共有しない（共有セルがあると壁1枚で両方塞げてしまう）', () => {
    const [north, south] = PLAINS_MAP.lanes;
    expect(north).toBeDefined();
    expect(south).toBeDefined();
    const fortress = fortressCell(PLAINS_MAP);
    const southKeys = new Set(south!.map((c) => `${c.x},${c.y}`));
    const shared = north!.filter((c) => southKeys.has(`${c.x},${c.y}`));
    expect(shared).toEqual([fortress]);
  });

  it('2レーンは非対称である（対称だと半分ずつが自明解になる）', () => {
    const [north, south] = PLAINS_MAP.lanes;
    expect(north!.length).not.toBe(south!.length);
  });

  it('経路外に、両レーンへ射程1.5で届くセルが存在する', () => {
    const [north, south] = PLAINS_MAP.lanes;
    const reaches = (cell: { x: number; y: number }, lane: readonly { x: number; y: number }[]) =>
      lane.some((c) => Math.hypot(c.x - cell.x, c.y - cell.y) <= 1.5);
    const both = offPathCells(PLAINS_MAP).filter(
      (c) => reaches(c, north!) && reaches(c, south!)
    );
    expect(both.length).toBeGreaterThan(0);
  });

  it('各レーンは隣接セルの連結列である', () => {
    PLAINS_MAP.lanes.forEach((lane) => {
      lane.slice(1).forEach((cell, i) => {
        const prev = lane[i]!;
        expect(Math.abs(cell.x - prev.x) + Math.abs(cell.y - prev.y)).toBe(1);
      });
    });
  });

  it('全レーンのセルが盤面の内側にある', () => {
    allPathCells(PLAINS_MAP).forEach((c) => {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(PLAINS_MAP.width);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThan(PLAINS_MAP.height);
    });
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/board/stage-map.test.ts -t "2レーンの平原"`
Expected: FAIL（`lanes` が1本のため）

- [ ] **Step 3: マップを2レーンにする**

北は短く滞留なし、南は長く滞留2つ。**砦 `(8,3)` のみ共有する。**

```ts
const PLAINS_WIDTH = 9;
const PLAINS_HEIGHT = 7;

/** 砦。全レーンの終端であり、ここには何も置けない（設計書 §4.1） */
const PLAINS_FORTRESS: CellPos = { x: 8, y: 3 };

/** 北レーン: 10セル。短く、滞留がない。処理が間に合わないと早く届く */
const PLAINS_LANE_NORTH: CellPos[] = [
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
  { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
  { x: 8, y: 2 }, PLAINS_FORTRESS,
];

/** 南レーン: 12セル。迂回して長く、滞留セルを2つ持つ */
const PLAINS_LANE_SOUTH: CellPos[] = [
  { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
  { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 },
  { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }, PLAINS_FORTRESS,
];

/**
 * P1 ステージ: 平原（9×7、2レーン）
 *
 * 砦セル以外を共有しない。分岐点を1つ作るだけでは、その共有セルに壁を
 * 置けば両レーンが止まってしまうため（設計書 §5.1 / §15 ①）。
 *
 * 中央列 y=3 は経路外のまま両レーンの射程内に入る。中央に射手を集めれば
 * 両方を撃てるが、経路外なのでブロックはできない。壁は各レーンに別々に要る。
 */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: PLAINS_WIDTH,
  height: PLAINS_HEIGHT,
  lanes: [PLAINS_LANE_NORTH, PLAINS_LANE_SOUTH],
  // 高台は中央列。両レーンに届く希少枠として奪い合いになる
  highGround: [{ x: 2, y: 3 }, { x: 6, y: 3 }],
  // 滞留は南レーンのみ。レーンの非対称性の中身
  slowCells: [{ x: 4, y: 5 }, { x: 5, y: 5 }],
};
```

- [ ] **Step 4: 敵とウェーブにレーンを持たせる**

`combat-state.ts` の `ActiveEnemy` から `spawnPathIndex` を消し、`laneIndex` を入れる。

```ts
export interface ActiveEnemy {
  id: number;
  enemyId: string;
  hp: number;
  maxHp: number;
  /** 所属レーン上の進行度（0 = 入口、lane.length - 1 = 砦） */
  progress: number;
  spawnTick: number;
  /** どのレーンを進むか */
  laneIndex: number;
  alive: boolean;
  leaked: boolean;
  groundedUntilTick: number;
  stunnedUntilTick: number;
}
```

`waves.ts` の `WaveEntry` も同様に。

```ts
export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
  /** どのレーンに出すか。0 = 北（短い）、1 = 南（長い） */
  laneIndex: number;
}
```

ウェーブ定義は**この Task では既存の構成をそのままレーン0に載せるだけ**にする（本格的な再構成は Task 14 の較正で行う）。ただし**鴉の湧き位置だけは入口へ戻す**——これはフィードバック#4 への直接の応答であり、較正ではなく仕様である。

```ts
// ウェーブ4 の鴉。laneIndex を持つ形になり、経路中盤からの出現は無くなる
{ enemyId: 'raven', count: 13, spawnIntervalTicks: 10, laneIndex: 0 },
```

- [ ] **Step 5: `step-tick.ts` を敵ごとのレーンで動かす**

`goal` はレーンごとに変わるため、敵ごとに求める。

```ts
/** その敵の所属レーン */
const laneFor = (map: StageMap, enemy: ActiveEnemy): readonly CellPos[] =>
  laneOf(map, enemy.laneIndex);

/** その敵が砦に到達したとみなす進行度 */
const goalFor = (map: StageMap, enemy: ActiveEnemy): number =>
  Math.max(0, laneFor(map, enemy).length - 1);

/** その敵の現在の盤面座標 */
export const enemyPosition = (map: StageMap, enemy: ActiveEnemy): CellPos =>
  positionOf(enemy.progress, laneFor(map, enemy));
```

`moveEnemies` / `applyTraps` / `applyTowerShots` / `applySplashDamage` / `applyBlasts` / `resolveLeaks` の中で `positionOf(enemy.progress, map.path)` としていた箇所を `enemyPosition(map, enemy)` に、`goal` を使っていた箇所を `goalFor(map, enemy)` に置き換える。

`spawnAt` は `laneIndex: entry.laneIndex` を敵に載せる。

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/board/stage-map.test.ts`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: **`balance.test.ts` は落ちてよい**（マップが変わったため較正が崩れる。Task 14 でやり直す）。それ以外は緑

落ちたテストが `balance.test.ts` 以外にある場合は、レーン対応の漏れである。`it.skip` で逃がさず、原因を直す。

- [ ] **Step 7: `balance.test.ts` を一時的に skip する**

較正は Task 14 でまとめてやり直すため、それまで赤を放置しない。**skip する理由をコメントで明示する**（消し忘れを防ぐ）。

```ts
// TODO(2026-08-03): Task 14 の較正やり直しで復活させる。
// 2レーン化でマップが変わり、既存の勝率閾値は意味を失っている。
describe.skip('バランス較正（Task 14 で再較正するまで停止）', () => {
```

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 進軍路を2レーンに分け敵にレーン所属を持たせる

砦セル以外を共有しない2レーンにする。分岐点を1つ作るだけでは、
その共有セルに壁を置けば両レーンが止まってしまうため。
北は短く滞留なし、南は長く滞留2つ。対称だと半分ずつが自明解になる。

鴉の湧き位置を経路中盤から入口へ戻した（フィードバック#4）。

balance.test.ts は Task 14 の較正やり直しまで skip する。"
```

---

### Task 3: 守り手への改名とHPの導入

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/combat-effects.ts`
- Modify: `src/features/ashen-rampart/presentation/run-summary.ts`
- Test: `src/features/ashen-rampart/domain/combat/step-tick.test.ts`

**Interfaces:**
- Produces: `PlacedUnit { cardId, pos, hp, maxHp, cooldownLeft }`、`CombatState.units`、`TowerSpec.hp`、`DefeatSource` の `'unit'` 種別

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, offPathCells } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { getCardDefinition } from '../cards/card-pool';

describe('守り手のHP', () => {
  it('置いた守り手はカード定義の hp を maxHp として持つ', () => {
    const deck = createDeck(['arrow-tower'], () => 0);
    const state = createCombatState(deck, []);
    const pos = offPathCells(PLAINS_MAP)[0]!;
    const next = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos }], PLAINS_MAP);
    const unit = next.units[0];
    expect(unit).toBeDefined();
    expect(unit!.maxHp).toBe(getCardDefinition('arrow-tower').tower!.hp);
    expect(unit!.hp).toBe(unit!.maxHp);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick.test.ts -t "守り手のHP"`
Expected: FAIL（`next.units` が undefined）

- [ ] **Step 3: 型を変える**

`combat-state.ts`:

```ts
/** 設置済みの守り手（攻撃しない石壁・篝火・鍛冶場を含む） */
export interface PlacedUnit {
  cardId: string;
  pos: CellPos;
  /** 現在のHP。0 で消滅する */
  hp: number;
  maxHp: number;
  /** 次に撃てるまでの残り tick */
  cooldownLeft: number;
}

export type DefeatSource =
  | { kind: 'unit'; index: number }
  | { kind: 'trap'; index: number }
  | { kind: 'ember'; index: number };
```

`CombatState.towers: PlacedTower[]` → `units: PlacedUnit[]`。`createCombatState` の `towers: []` → `units: []`。

`TickEvent` の `shot` は `towerIndex` → `unitIndex` に改める。

`card-definition.ts` の `TowerSpec` に `hp` を足す。

```ts
export interface TowerSpec {
  /** 守り手のHP。敵に殴られて 0 になると消滅する */
  hp: number;
  range: number;
  damage: number;
  cooldownTicks: number;
  splashRadius: number;
  hitsFlying: boolean;
  aura?: { towerDamageBonus?: number; towerRangeBonus?: number };
}
```

`heavyBonusThreshold` / `heavyBonusMultiplier` は Task 10 で貫通に置き換えるため、**この Task では残す**（1タスク1変更）。

- [ ] **Step 4: `step-tick.ts` の呼び出しを追随させる**

`state.towers` → `state.units`、`effectiveDamage` / `effectiveRange` の `towerIndex` → `unitIndex`、`applyTowerShots` → `applyUnitShots`。カード設置時に `hp`/`maxHp` を初期化する。

```ts
// applyCardEffect の tower 分岐
draft.units.push({
  cardId,
  pos,
  hp: spec.hp,
  maxHp: spec.hp,
  cooldownLeft: 0,
});
```

`card-pool.ts` の全 `tower` スペックに暫定の `hp` を足す（正式な値は Task 9）。

```ts
// 暫定値。Task 9 で設計書 §7 の表に置き換える
tower: { hp: 10, range: 1.6, damage: 6, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick.test.ts -t "守り手のHP"`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "refactor(ashen-rampart): 塔を守り手へ改名しHPを持たせる

PlacedTower を PlacedUnit に、CombatState.towers を units に改名し、
TowerSpec に hp を足す。攻撃しない石壁まで含めて1つの語で呼ぶ必要が
あるため。DefeatSource の 'tower' も 'unit' に追随させた。

数値は暫定。設計書 §7 の表への差し替えは Task 9 で行う。"
```

---

### Task 4: ブロック判定（敵が止まる）

**Files:**
- Create: `src/features/ashen-rampart/domain/combat/blocking.ts`
- Create: `src/features/ashen-rampart/domain/combat/blocking.test.ts`
- Create: `src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`

**Interfaces:**
- Consumes: Task 2 の `laneOf` / `laneFor`、Task 3 の `PlacedUnit`
- Produces: `BlockContext { units, map, tick }`、`blockerIndexFor(ctx, enemy): number | undefined`、`isBlocked(ctx, enemy): boolean`

**注記:** `tick` は Task 4 の時点では使わないが、Task 6（飛行の地上化判定）で必要になる。**最初から `BlockContext` にまとめておく**——後から引数を足すとテストも呼び出し側も書き直しになるため。

- [ ] **Step 1: 失敗するテストを書く（純粋関数）**

`src/features/ashen-rampart/domain/combat/blocking.test.ts`

```ts
import { blockerIndexFor } from './blocking';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';

const enemyAt = (progress: number, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1, enemyId: 'grunt', hp: 20, maxHp: 20, progress, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false,
  groundedUntilTick: 0, stunnedUntilTick: 0, ...overrides,
});

const unitAt = (x: number, y: number): PlacedUnit => ({
  cardId: 'stone-wall', pos: { x, y }, hp: 60, maxHp: 60, cooldownLeft: 0,
});

const ctxWith = (units: PlacedUnit[], tick = 0) => ({ units, map: PLAINS_MAP, tick });

describe('blockerIndexFor', () => {
  it('次に進入するセルに守り手がいれば、その index を返す', () => {
    const next = laneOf(PLAINS_MAP, 0)[3]!;
    expect(blockerIndexFor(ctxWith([unitAt(next.x, next.y)]), enemyAt(2))).toBe(0);
  });

  it('次のセルに何もいなければ undefined を返す', () => {
    expect(blockerIndexFor(ctxWith([]), enemyAt(2))).toBeUndefined();
  });

  it('足元のセルに守り手が後から置かれた場合も止まる', () => {
    const here = laneOf(PLAINS_MAP, 0)[2]!;
    // progress 2.0 ちょうど = セル2 の上にいる
    expect(blockerIndexFor(ctxWith([unitAt(here.x, here.y)]), enemyAt(2))).toBe(0);
  });

  it('別レーンの守り手には止められない（レーンの独立）', () => {
    const southCell = laneOf(PLAINS_MAP, 1)[3]!;
    const units = [unitAt(southCell.x, southCell.y)];
    expect(blockerIndexFor(ctxWith(units), enemyAt(2, { laneIndex: 0 }))).toBeUndefined();
  });

  it('死んでいる敵は誰にも止められない', () => {
    const next = laneOf(PLAINS_MAP, 0)[3]!;
    const units = [unitAt(next.x, next.y)];
    expect(blockerIndexFor(ctxWith(units), enemyAt(2, { alive: false }))).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts`
Expected: FAIL（`Cannot find module './blocking'`）

- [ ] **Step 3: `blocking.ts` を実装する**

```ts
/**
 * 灰燼の城壁 - ブロック判定
 *
 * 地上の敵は、次に進入する経路セルに守り手がいればそのセルに進入せず止まる。
 * 足元のセルに守り手が後から置かれた場合も止まる（置いた瞬間に塞げる）。
 *
 * 契約: 飛行はこの判定を通らない。ただし落網で地上化している間は通る
 * （判定の呼び出し側で除外する。ここでは飛行かどうかを見ない）。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/**
 * その敵を止めている守り手の index
 *
 * 「足元」と「次のセル」の両方を見るのは、既に進入済みのセルに守り手を
 * 置かれた場合にすり抜けさせないため。`Math.floor` の切り捨てにより、
 * progress 2.0 も 2.7 も足元はセル2 になる。
 */
/** ブロック判定に必要な文脈。tick は Task 6 の地上化判定で使う */
export interface BlockContext {
  units: readonly PlacedUnit[];
  map: StageMap;
  tick: number;
}

export const blockerIndexFor = (
  ctx: BlockContext,
  enemy: ActiveEnemy
): number | undefined => {
  const { units, map } = ctx;
  if (!enemy.alive) return undefined;
  const lane = laneOf(map, enemy.laneIndex);
  if (lane.length === 0) return undefined;
  const hereIndex = Math.min(Math.floor(enemy.progress), lane.length - 1);
  const here = lane[hereIndex];
  const next = lane[hereIndex + 1];
  const found = [here, next].reduce<number | undefined>((acc, cell) => {
    if (acc !== undefined || !cell) return acc;
    const index = units.findIndex((u) => samePos(u.pos, cell));
    return index >= 0 ? index : undefined;
  }, undefined);
  return found;
};

/** その敵が止められているか */
export const isBlocked = (ctx: BlockContext, enemy: ActiveEnemy): boolean =>
  blockerIndexFor(ctx, enemy) !== undefined;
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: `stepTick` に結線する統合テストを書く**

`src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`

**設計書 §12 の指示に従い、「止まる」だけを単独で検証する。** 「削れる」「消滅して再開する」は Task 5 で別々に書く。1つのテストで全部を通そうとすると、どれかがゼロのまま緑になる。

```ts
import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import type { CombatState } from './combat-state';

const runTicks = (state: CombatState, count: number): CombatState => {
  let s = state;
  for (let i = 0; i < count; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('ブロック判定（stepTick 経由）', () => {
  it('経路上に守り手がいると、地上の敵はそこで止まる', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    // 攻撃しない石壁を置いて、止まること「だけ」を見る
    const deck = createDeck(['stone-wall'], () => 0);
    let state = createCombatState(deck, wave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    state = runTicks(state, 200);

    const enemy = state.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy!.alive).toBe(true);
    // セル3 に進入していない
    expect(enemy!.progress).toBeLessThan(3);
  });

  it('守り手がいなければ同じ条件で砦まで到達する', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const deck = createDeck(['stone-wall'], () => 0);
    let state = createCombatState(deck, wave);
    state = runTicks(state, 200);
    expect(state.life).toBeLessThan(12);
  });
});
```

2つ目のテストは**対照条件**である。1つ目だけだと「そもそも敵が動いていない」ために緑になっている可能性を排除できない。

- [ ] **Step 6: `stepTick` にブロック判定を結線する**

`moveEnemies` に `units` を渡し、止まっている敵を動かさない。

```ts
const moveEnemies = (
  existing: readonly ActiveEnemy[],
  spawned: readonly ActiveEnemy[],
  ctx: { tick: number; slowUntilTick: number; slowMultiplier: number },
  map: StageMap,
  units: readonly PlacedUnit[]
): ActiveEnemy[] => {
  const slowMult = ctx.tick <= ctx.slowUntilTick ? ctx.slowMultiplier : 1;
  return [...existing, ...spawned].map((enemy) => {
    if (!enemy.alive) return enemy;
    if (enemy.spawnTick === ctx.tick) return enemy;
    if (isEnemyStunned(enemy, ctx.tick)) return enemy;
    // 飛行はブロックを無視する。ただし地上化中は通常の地上敵として扱う（Task 6）
    if (isBlocked({ units, map, tick: ctx.tick }, enemy)) return enemy;
    const spec = getEnemySpec(enemy.enemyId);
    const lane = laneOf(map, enemy.laneIndex);
    const cell = lane[Math.min(Math.floor(enemy.progress), lane.length - 1)];
    const terrain = cell && isSlowCell(map, cell) ? SLOW_TERRAIN_MULT : 1;
    return { ...enemy, progress: enemy.progress + spec.speed * terrain * slowMult };
  });
};
```

呼び出し側（`stepTick`）は `afterActions.units` を渡す。**プレイヤー操作の後に呼ぶため、この tick に置いた守り手が即座にブロックに効く。**

- [ ] **Step 7: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`
Expected: PASS（2件）

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 経路上の守り手が地上の敵を止める

次に進入するセル、または足元のセルに守り手がいれば止まる。
足元も見るのは、既に進入済みのセルに置かれた場合にすり抜けさせないため。

「止まる」だけを単独で検証し、対照条件（守り手なしなら砦に届く）を
同時に置いた。片方だけでは敵がそもそも動いていない場合に緑になる。"
```

---

### Task 5: 敵の攻撃と守り手の消滅

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/enemies.ts`
- Modify: `src/features/ashen-rampart/domain/combat/blocking.ts`
- Modify: `src/features/ashen-rampart/domain/combat/combat-state.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Test: `src/features/ashen-rampart/domain/combat/blocking.test.ts`
- Test: `src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`

**Interfaces:**
- Consumes: Task 4 の `blockerIndexFor`
- Produces: `MAX_ATTACKERS_PER_BLOCKER`、`applyEnemyAttacks(...)`、`TickEvent` の `'unit-damaged'` / `'unit-lost'`

- [ ] **Step 1: 敵に攻撃力を持たせる**

`enemies.ts`（設計書 §8.1 の表）:

```ts
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  speed: number;
  flying: boolean;
  /** 止められたときに守り手へ与えるダメージ */
  attack: number;
  /** 攻撃間隔（tick） */
  attackIntervalTicks: number;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt',  name: '雑兵', hp: 20, speed: 0.1,  flying: false, attack: 3,  attackIntervalTicks: 20 },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, flying: false, attack: 2,  attackIntervalTicks: 12 },
  { id: 'swarm',  name: '群れ', hp: 8,  speed: 0.12, flying: false, attack: 1,  attackIntervalTicks: 15 },
  { id: 'brute',  name: '重装', hp: 60, speed: 0.06, flying: false, attack: 10, attackIntervalTicks: 30 },
  // 鴉の攻撃は地上化中のみ使う。0 にすると落網で落とした鴉が壁の前で
  // 何もできず 120tick 膠着し、落網が「足止め」になってしまう（設計書 §8.2）
  { id: 'raven',  name: '鴉',   hp: 16, speed: 0.14, flying: true,  attack: 2,  attackIntervalTicks: 20 },
];
```

- [ ] **Step 2: 失敗するテストを書く（同時攻撃数の上限）**

`blocking.test.ts` に追記する。**設計書 §12 が要求するミューテーション検証**（上限を +1 して結果が変わること）をここで担保する。

```ts
import { MAX_ATTACKERS_PER_BLOCKER, attackersFor } from './blocking';

describe('MAX_ATTACKERS_PER_BLOCKER', () => {
  const lane = laneOf(PLAINS_MAP, 0);
  const blockCell = lane[3]!;
  const units = [unitAt(blockCell.x, blockCell.y)];
  // 同じブロッカーの手前に 10 体を並べる
  const many = Array.from({ length: 10 }, (_, i) => enemyAt(2.9 - i * 0.01, { id: i }));

  it('上限は3である', () => {
    expect(MAX_ATTACKERS_PER_BLOCKER).toBe(3);
  });

  it('同一ブロッカーを殴れるのは先頭3体までである', () => {
    const attackers = attackersFor(ctxWith(units), many, 0);
    expect(attackers).toHaveLength(MAX_ATTACKERS_PER_BLOCKER);
  });

  it('選ばれるのは進行度が高い順（先頭）である', () => {
    const attackers = attackersFor(ctxWith(units), many, 0);
    const progresses = attackers.map((e) => e.progress);
    expect(progresses).toEqual([...progresses].sort((a, b) => b - a));
    expect(progresses[0]).toBe(Math.max(...many.map((e) => e.progress)));
  });

  it('上限より少ない敵しかいなければ全員が殴る', () => {
    const few = many.slice(0, 2);
    expect(attackersFor(ctxWith(units), few, 0)).toHaveLength(2);
  });
});
```

最後のテストが**ミューテーション検証の代わり**になる。「3体までしか殴らない」テストが「そもそも誰も殴っていない」ために緑になる形を、`2` という別の値で塞ぐ。

- [ ] **Step 3: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts -t "MAX_ATTACKERS_PER_BLOCKER"`
Expected: FAIL（`attackersFor is not a function`）

- [ ] **Step 4: `blocking.ts` に攻撃者の選択を実装する**

```ts
/**
 * 1体のブロッカーを同時に殴れる敵の数
 *
 * 群れ22体が同時に殴ると、石壁HP60 は 41tick で溶ける
 * （22 × 1ダメージ / 15tick = 1.47 dps）。上限3 で約300tick 保つ。
 *
 * 副次的に、待たされた敵が経路上に詰まるため範囲攻撃が刺さるようになる。
 */
export const MAX_ATTACKERS_PER_BLOCKER = 3;

/** その守り手を殴っている敵（進行度の高い順に上限まで） */
export const attackersFor = (
  ctx: BlockContext,
  enemies: readonly ActiveEnemy[],
  unitIndex: number
): ActiveEnemy[] =>
  enemies
    .filter((e) => blockerIndexFor(ctx, e) === unitIndex)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, MAX_ATTACKERS_PER_BLOCKER);
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/blocking.test.ts`
Expected: PASS（9件）

- [ ] **Step 6: 統合テストを書く（削れる／消滅して再開する）**

`step-tick-blocking.test.ts` に追記する。**設計書 §12 の3分割の残り2つ。**

```ts
describe('敵の攻撃（stepTick 経由）', () => {
  const singleGrunt = [{
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
  }];

  it('止められた敵は守り手のHPを削る', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    const deck = createDeck(['stone-wall'], () => 0);
    let state = createCombatState(deck, singleGrunt);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    const maxHp = state.units[0]!.maxHp;
    state = runTicks(state, 200);
    const unit = state.units[0];
    expect(unit).toBeDefined();
    expect(unit!.hp).toBeLessThan(maxHp);
  });

  it('HPが0になると守り手は消滅し、敵の前進が再開する', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    // 重装（攻撃10 / 30tick）でHP8の弓兵を確実に壊す
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const deck = createDeck(['arrow-tower'], () => 0);
    let state = createCombatState(deck, wave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    state = runTicks(state, 400);
    expect(state.units).toHaveLength(0);
    // 守り手が消えたので、セル3 より先へ進んでいる
    expect(state.enemies[0]!.progress).toBeGreaterThan(3);
  });

  it('守り手の消滅は unit-lost イベントとして発行される', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const deck = createDeck(['arrow-tower'], () => 0);
    let state = createCombatState(deck, wave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    let sawLost = false;
    for (let i = 0; i < 400; i++) {
      state = stepTick(state, [], PLAINS_MAP);
      if (state.events.some((e) => e.kind === 'unit-lost')) sawLost = true;
    }
    expect(sawLost).toBe(true);
  });

  it('レーンは独立している（片方を塞いでも、もう片方は砦に届く）', () => {
    const wave = [{
      startTick: 0,
      entries: [
        { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
        { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
      ],
    }];
    const northCell = laneOf(PLAINS_MAP, 0)[3]!;
    const deck = createDeck(['stone-wall'], () => 0);
    let state = createCombatState(deck, wave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: northCell }], PLAINS_MAP);
    state = runTicks(state, 400);
    // 南レーンの敵は止められていないので漏れる
    expect(state.life).toBeLessThan(12);
  });
});
```

最後のテストが**設計書 §12 が要求する「レーンの独立」の検知**である。これが緑にならなければ分岐が形骸化している。

- [ ] **Step 7: `stepTick` に敵の攻撃を結線する**

`combat-state.ts` の `TickEvent` に2種を足す。

```ts
  | { kind: 'unit-damaged'; unitIndex: number; enemyId: number; amount: number }
  | { kind: 'unit-lost'; unitIndex: number; cardId: string; pos: CellPos }
```

`step-tick.ts` に段階を1つ足す。**移動の後、罠より前**に置く（移動確定後の座標でブロック関係が決まるため）。

```ts
/**
 * 敵の攻撃と守り手の消滅
 *
 * 移動確定後に呼ぶ。止められている敵が attackIntervalTicks ごとに
 * ブロッカーのHPを削り、0 になった守り手を取り除く。
 *
 * 攻撃タイミングは敵ごとの内部カウンタではなく
 * `tick % attackIntervalTicks === 0` で決める。敵に状態を増やさずに済み、
 * 同じ敵が同じ tick に二度殴ることもない。
 */
const applyEnemyAttacks = (
  ctx: BlockContext,
  moved: readonly ActiveEnemy[],
  events: TickEvent[]
): PlacedUnit[] => {
  const { units, tick } = ctx;
  const damaged = units.map((unit, unitIndex) => {
    const attackers = attackersFor(ctx, moved, unitIndex);
    const total = attackers.reduce((sum, enemy) => {
      const spec = getEnemySpec(enemy.enemyId);
      if (spec.attackIntervalTicks <= 0) return sum;
      if (tick % spec.attackIntervalTicks !== 0) return sum;
      events.push({
        kind: 'unit-damaged', unitIndex, enemyId: enemy.id, amount: spec.attack,
      });
      return sum + spec.attack;
    }, 0);
    return total === 0 ? unit : { ...unit, hp: unit.hp - total };
  });
  damaged.forEach((unit, unitIndex) => {
    if (unit.hp > 0) return;
    events.push({ kind: 'unit-lost', unitIndex, cardId: unit.cardId, pos: unit.pos });
  });
  return damaged.filter((unit) => unit.hp > 0);
};
```

`stepTick` の中で、`moved` を作った直後に呼ぶ。

```ts
  const moved = moveEnemies(state.enemies, spawned, { tick, ... }, map, afterActions.units);
  const blockCtx = { units: afterActions.units, map, tick };
  const survivingUnits = applyEnemyAttacks(blockCtx, moved, events);
  // 以降 afterActions.units の代わりに survivingUnits を使う
  const towers = applyUnitShots(state, survivingUnits, moved, map, hpById, sourceById, events, tick);
```

**注意: `unitIndex` は消滅前の配列の index である。** `unit-lost` の後に配列が縮むため、同一 tick 内の `shot` イベントの `unitIndex` とずれる。`applyUnitShots` は `survivingUnits`（縮んだ後）を受け取るので、**エフェクト側は `unit-damaged` / `unit-lost` が持つ `pos` を使って解決する**（Task 11）。`unit-damaged` にも `pos` を足しておく。

```ts
  | { kind: 'unit-damaged'; unitIndex: number; pos: CellPos; enemyId: number; amount: number }
```

- [ ] **Step 8: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`
Expected: PASS（6件）

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 9: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 止められた敵が守り手を殴り、HP0で消滅させる

MAX_ATTACKERS_PER_BLOCKER = 3。群れ22体が同時に殴ると石壁HP60 が
41tick で溶けるため。上限3 で約300tick 保ち、副次的に待たされた敵が
経路上に詰まって範囲攻撃が刺さるようになる。

「止まる」「削れる」「消滅して再開する」を別々に検証し、
レーンの独立（片方を塞いでも、もう片方は砦に届く）も直接テストした。"
```

---

### Task 6: 飛行のブロック無視と地上化中のブロック

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/blocking.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Test: `src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`

**Interfaces:**
- Consumes: Task 4 の `blockerIndexFor`、既存の `isEnemyGrounded`（`enemy-status.ts`）

- [ ] **Step 1: 失敗するテストを書く**

**ブロッカーを置いた状態で検証する。** ブロッカーが無い盤面では自明に通ってしまう（設計書 §12）。

```ts
describe('飛行とブロック', () => {
  const ravenWave = [{
    startTick: 0,
    entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
  }];

  it('飛行はブロッカーを無視して通過する', () => {
    const blockCell = laneOf(PLAINS_MAP, 0)[3]!;
    const deck = createDeck(['stone-wall'], () => 0);
    let state = createCombatState(deck, ravenWave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    // ブロッカーは確かに置かれている
    expect(state.units).toHaveLength(1);
    state = runTicks(state, 200);
    // 飛行は素通りして砦に届く
    expect(state.life).toBeLessThan(12);
  });

  it('地上化している間はブロックされる', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    // 落網を手前に、石壁をその先に置く
    const netCell = lane[2]!;
    const blockCell = lane[4]!;
    const deck = createDeck(['snare-net', 'stone-wall'], () => 0);
    let state = createCombatState(deck, ravenWave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: netCell }], PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    state = runTicks(state, 100);
    const enemy = state.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy!.alive).toBe(true);
    // 地上化中なので石壁の手前で止まっている
    expect(enemy!.progress).toBeLessThan(4);
  });

  it('地上化している飛行は守り手を殴る（膠着しない）', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const netCell = lane[2]!;
    const blockCell = lane[4]!;
    const deck = createDeck(['snare-net', 'arrow-tower'], () => 0);
    let state = createCombatState(deck, ravenWave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: netCell }], PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    const maxHp = state.units[0]!.maxHp;
    state = runTicks(state, 100);
    const unit = state.units[0];
    // 消滅している場合も「殴った」証拠なので、どちらでもよい
    expect(unit === undefined || unit.hp < maxHp).toBe(true);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts -t "飛行とブロック"`
Expected: FAIL（1件目。現状は飛行も止まってしまう）

- [ ] **Step 3: `blockerIndexFor` に飛行判定を入れる**

```ts
import { getEnemySpec } from './enemies';
import { isEnemyGrounded } from './enemy-status';

export const blockerIndexFor = (
  ctx: BlockContext,
  enemy: ActiveEnemy
): number | undefined => {
  const { units, map, tick } = ctx;
  if (!enemy.alive) return undefined;
  // 契約: 飛行はブロックを通らない。ただし落網で地上化している間は通る。
  // 地上化中に素通りさせると「落として叩く」という落網の意図と食い違う。
  if (getEnemySpec(enemy.enemyId).flying && !isEnemyGrounded(enemy, tick)) return undefined;
  // ...（以降は Task 4 のまま）
};
```

**シグネチャは変わらない。** Task 4 で `BlockContext` に `tick` を含めておいたため、この Task で追加するのは飛行の分岐1行だけである。Task 4・5 のテストは書き直さなくてよい。

- [ ] **Step 4: `enemy-status.ts` の関数名を確認して使う**

Run: `grep -n "export const" src/features/ashen-rampart/domain/combat/enemy-status.ts`

地上化判定の関数名が `isEnemyGrounded` でない場合は、実際の名前に合わせる。**推測で書かない。**

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-blocking.test.ts`
Expected: PASS（9件）

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 飛行はブロックを無視し、地上化中だけ止まる

ブロッカーを置いた状態で検証する。ブロッカーが無い盤面では
自明に通ってしまうため。

地上化中に殴れることも別に検証した。鴉の攻撃力を0にすると、
落網で落とした鴉が壁の前で何もできず120tick 膠着し、
落網が『足止め』になってしまう。"
```

---

### Task 7: 配置クールダウンを魔力炉のみに課す

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Modify: `src/features/ashen-rampart/presentation/HandArea.tsx`
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Test: `src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts`
- Test: `src/features/ashen-rampart/presentation/HandArea.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```ts
describe('配置クールダウンは魔力炉のみ', () => {
  it('守り手は同じ tick に複数置ける（マナがある限り）', () => {
    const deck = createDeck(['arrow-tower', 'arrow-tower'], () => 0);
    let state = { ...createCombatState(deck, []), mana: 10 };
    const [a, b] = offPathCells(PLAINS_MAP);
    state = stepTick(state, [
      { kind: 'play-card', handIndex: 0, pos: a! },
    ], PLAINS_MAP);
    state = stepTick(state, [
      { kind: 'play-card', handIndex: 0, pos: b! },
    ], PLAINS_MAP);
    expect(state.units).toHaveLength(2);
  });

  it('魔力炉には引き続きクールダウンが課される', () => {
    const deck = createDeck(['reactor', 'reactor'], () => 0);
    let state = { ...createCombatState(deck, []), mana: 10 };
    const [a, b] = offPathCells(PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: a! }], PLAINS_MAP);
    expect(state.placeCooldown).toBeGreaterThan(0);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: b! }], PLAINS_MAP);
    expect(state.reactors).toHaveLength(1);
    expect(state.events.some((e) => e.kind === 'rejected' && e.reason === 'cooldown')).toBe(true);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts -t "配置クールダウンは魔力炉のみ"`
Expected: FAIL（1件目。2枚目が cooldown で弾かれる）

- [ ] **Step 3: 判定条件を変える**

`applyPlayCard` の2箇所（検査と設定）を、カード種別で分ける。

```ts
  const card = getCardDefinition(cardId);
  const needsPlacement = placementKindOf(card) !== 'none';
  // クールダウンは魔力炉だけに課す。他の札はマナが唯一の律速になる。
  // 「マナがあるのに置けない」ことが戦略の選択を消していたため（反復2 #1）。
  const usesCooldown = card.type === 'reactor';
  if (usesCooldown && draft.placeCooldown > 0) {
    draft.events.push({ kind: 'rejected', reason: 'cooldown' });
    return;
  }
  // ...
  if (usesCooldown) draft.placeCooldown = PLACE_COOLDOWN_TICKS;
```

- [ ] **Step 4: `HandArea.tsx` のゲージを魔力炉の札だけに出す**

```tsx
// クールダウンゲージは魔力炉の札にだけ出す。他の札は常に置ける
{getCardDefinition(cardId).type === 'reactor' && (
  <CooldownBar
    $ratio={1 - state.placeCooldown / PLACE_COOLDOWN_TICKS}
    aria-label={`次に置けるまで ${toSeconds(state.placeCooldown)}秒`}
  />
)}
```

- [ ] **Step 5: `greedyStrategy` の早期 return を外す**

`run-simulation.ts:63` の `if (state.placeCooldown > 0) return actions;` は、クールダウンが魔力炉だけになったので**魔力炉のみに適用する**。

```ts
  for (let handIndex = 0; handIndex < state.deck.hand.length; handIndex++) {
    const cardId = state.deck.hand[handIndex];
    if (cardId === undefined) continue;
    const card = getCardDefinition(cardId);
    if (card.cost > state.mana) continue;
    // 魔力炉はクールダウン中なら飛ばす。他の札は妨げられない
    if (card.type === 'reactor' && state.placeCooldown > 0) continue;
    // ...
  }
```

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart -t "配置クールダウン"`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 配置クールダウンを魔力炉だけに課す

他の札はマナが唯一の律速になる。「マナがあるのに置けない」ことが
溜めて一気に置くか少しずつ置くかの選択を消していたため（反復2 #1）。

手札のクールダウンゲージも魔力炉の札にだけ出す。"
```

---

### Task 8: 配置先種別の刷新（自由配置・砦セル禁止・魔力炉は経路外）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Test: `src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts`

**Interfaces:**
- Produces: `PlacementKind = 'unit' | 'reactor' | 'path' | 'none'`、`placeableCells(state, card, map): CellPos[]`

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { fortressCell, laneOf, offPathCells, allPathCells } from '../board/stage-map';
import { canPlaceAt } from './step-tick';
import { getCardDefinition } from '../cards/card-pool';

describe('配置先の規則', () => {
  const emptyState = () => createCombatState(createDeck(['arrow-tower'], () => 0), []);

  it('守り手は経路上にも経路外にも置ける', () => {
    const state = emptyState();
    const card = getCardDefinition('arrow-tower');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(true);
  });

  it('砦セルには何も置けない（2レーンの合流点を1体で塞げてしまうため）', () => {
    const state = emptyState();
    const fortress = fortressCell(PLAINS_MAP)!;
    expect(canPlaceAt(state, getCardDefinition('arrow-tower'), fortress, PLAINS_MAP)).toBe(false);
    expect(canPlaceAt(state, getCardDefinition('spike-trap'), fortress, PLAINS_MAP)).toBe(false);
  });

  it('魔力炉は経路外にしか置けない（コスト0・上限なしの壁になるため）', () => {
    const state = emptyState();
    const card = getCardDefinition('reactor');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(false);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(true);
  });

  it('罠は経路上にしか置けない', () => {
    const state = emptyState();
    const card = getCardDefinition('spike-trap');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(false);
  });

  it('1セルに置けるのは守り手1体か罠1つのどちらか', () => {
    const deck = createDeck(['arrow-tower', 'spike-trap'], () => 0);
    let state = { ...createCombatState(deck, []), mana: 10 };
    const cell = laneOf(PLAINS_MAP, 0)[3]!;
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: cell }], PLAINS_MAP);
    expect(canPlaceAt(state, getCardDefinition('spike-trap'), cell, PLAINS_MAP)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-actions.test.ts -t "配置先の規則"`
Expected: FAIL

- [ ] **Step 3: `PlacementKind` を4種にする**

`card-definition.ts`:

```ts
/** カードを出すときに指定する対象の種別 */
export type PlacementKind = 'unit' | 'reactor' | 'path' | 'none';

/**
 * カードの配置先種別を返す
 *
 * 設置マスの概念が消えたため、守り手は砦以外のどこにでも置ける。
 * 魔力炉だけは経路外に限る——コスト0・デッキ上限なしのため、
 * 経路に置けると無限の無料ブロッカーになる（設計書 §7.5）。
 */
export const placementKindOf = (card: CardDefinition): PlacementKind => {
  if (card.type === 'trap' || card.type === 'ember') return 'path';
  if (card.type === 'spell' || card.type === 'levy') return 'none';
  if (card.type === 'reactor') return 'reactor';
  return 'unit';
};
```

**燠火（`ember`）は経路上に置く**（半径2の範囲ダメージを経路に落とすカードのため）。反復2 までは `'slot'` だったが、`'path'` が正しい。

- [ ] **Step 4: `canPlaceAt` を書き換える**

```ts
/** そのセルに既に守り手・魔力炉・燠火・罠のいずれかがあるか */
const isCellOccupied = (state: CombatState, pos: CellPos): boolean =>
  state.units.some((u) => samePos(u.pos, pos)) ||
  state.reactors.some((r) => samePos(r.pos, pos)) ||
  state.embers.some((e) => samePos(e.pos, pos)) ||
  state.traps.some((t) => samePos(t.pos, pos));

export const canPlaceAt = (
  state: CombatState,
  card: CardDefinition,
  pos: CellPos,
  map: StageMap
): boolean => {
  const kind = placementKindOf(card);
  if (kind === 'none') return false;
  if (pos.x < 0 || pos.x >= map.width || pos.y < 0 || pos.y >= map.height) return false;
  // 砦セルは全レーンの合流点。ここに置けると1体で両レーンを塞げてしまう
  const fortress = fortressCell(map);
  if (fortress && samePos(fortress, pos)) return false;
  if (isCellOccupied(state, pos)) return false;
  const onPath = isPathCell(map, pos);
  if (kind === 'path') return onPath;
  if (kind === 'reactor') return !onPath;
  return true;
};

/** そのカードを今置けるセルの一覧（UI のハイライトと集計が使う） */
export const placeableCells = (
  state: CombatState,
  card: CardDefinition,
  map: StageMap
): CellPos[] => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const pos = { x, y };
      if (canPlaceAt(state, card, pos, map)) cells.push(pos);
    }
  }
  return cells;
};
```

- [ ] **Step 5: `greedyStrategy` と `BoardGrid` を追随させる**

`run-simulation.ts`:

```ts
    const pos = placeableCells(state, card, map)[0];
    if (pos) {
      actions.push({ kind: 'play-card', handIndex, pos });
      return actions;
    }
```

`BoardGrid.tsx`: 「置けるマスのハイライト」を `placeableCells` から引く。**「城壁の外」の後退表示（反復2 Task 9）は撤去する**——置けないマスが砦1つだけになったため、意味がなくなった。

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart -t "配置先の規則"`
Expected: PASS（5件）

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 配置先を4種別にし砦以外の全マスへ置けるようにする

守り手は砦セル以外のどこにでも置ける。魔力炉だけは経路外に限る——
コスト0・デッキ上限なしのため、経路に置けると無限の無料ブロッカーに
なるため。砦セルは全レーンの合流点で、置けると1体で両方を塞げる。

燠火の配置先を slot から path へ是正した（経路に範囲ダメージを
落とすカードであり、反復2 までの分類が誤っていた）。"
```

---

### Task 9: カードプールの改訂（コスト帯とHP）

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Test: `src/features/ashen-rampart/domain/cards/card-pool.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

**設計書 §7 の「軸」を、数値そのものではなく性質としてテストする。** 較正で数値は動くが、軸は動かない。

```ts
import { CARD_IDS, getCardDefinition } from './card-pool';

const towerOf = (id: string) => getCardDefinition(id).tower;

describe('カードの軸（設計書 §7）', () => {
  it('コスト帯が 0〜5 に広がっている', () => {
    const costs = new Set(CARD_IDS.map((id) => getCardDefinition(id).cost));
    [0, 1, 2, 3, 4, 5].forEach((c) => expect(costs.has(c)).toBe(true));
  });

  it('攻撃する守り手が同じコストに4種以上固まっていない', () => {
    const attackers = CARD_IDS
      .map((id) => getCardDefinition(id))
      .filter((c) => c.tower && c.tower.damage > 0);
    const byCost = new Map<number, number>();
    attackers.forEach((c) => byCost.set(c.cost, (byCost.get(c.cost) ?? 0) + 1));
    byCost.forEach((count) => expect(count).toBeLessThan(4));
  });

  it('HPと攻撃力が逆相関している（硬いものほど攻撃力が低い）', () => {
    const units = CARD_IDS
      .map((id) => getCardDefinition(id))
      .filter((c) => c.tower !== undefined && c.type === 'tower');
    const hardest = units.reduce((a, b) => (a.tower!.hp >= b.tower!.hp ? a : b));
    const strongest = units.reduce((a, b) => (a.tower!.damage >= b.tower!.damage ? a : b));
    expect(hardest.tower!.damage).toBe(0);
    expect(strongest.tower!.hp).toBeLessThan(hardest.tower!.hp);
  });

  it('対空の税は1マナである（同型の単体守り手で対空の有無だけが違う）', () => {
    const ground = getCardDefinition('arrow-tower');
    const air = getCardDefinition('ballista');
    expect(ground.tower!.hitsFlying).toBe(false);
    expect(air.tower!.hitsFlying).toBe(true);
    expect(air.cost - ground.cost).toBe(1);
  });

  it('すべての守り手がHPを持つ', () => {
    CARD_IDS.forEach((id) => {
      const spec = towerOf(id);
      if (!spec) return;
      expect(spec.hp).toBeGreaterThan(0);
    });
  });

  it('石壁の同名上限は3枚のまま（壁の希少性が本反復の中核）', () => {
    expect(getCardDefinition('stone-wall').maxCopies ?? 3).toBe(3);
  });

  it('魔力炉だけが同名上限を持たない', () => {
    const unlimited = CARD_IDS.filter((id) => (getCardDefinition(id).maxCopies ?? 3) > 3);
    expect(unlimited).toEqual(['reactor']);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts -t "カードの軸"`
Expected: FAIL

- [ ] **Step 3: 数値を設計書 §7 の表に置き換える**

石壁と貫通は Task 10 で扱うため、**ここでは既存の型で表せるものだけ**を反映する。

```ts
  { id: 'arrow-tower', name: '弓兵', type: 'tower', cost: 1,
    description: '単体を速射する。安く、数で押す。飛行には当たらない。',
    tower: { hp: 8, range: 1.6, damage: 4, cooldownTicks: 8, splashRadius: 0, hitsFlying: false } },

  { id: 'ballista', name: '弩砲', type: 'tower', cost: 2,
    description: '射程が長く、飛行を撃ち落とせる。対空の標準解。',
    tower: { hp: 12, range: 2.4, damage: 9, cooldownTicks: 12, splashRadius: 0, hitsFlying: true } },

  { id: 'cannon-tower', name: '火砲台', type: 'tower', cost: 3,
    description: '着弾点の周囲にもダメージ。群れに強い。飛行には当たらない。',
    tower: { hp: 16, range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false } },

  { id: 'catapult', name: '投石機', type: 'tower', cost: 5,
    description: '遠くまで届き広く砕くが、間隔は長い。飛行には当たらない。',
    tower: { hp: 10, range: 3.0, damage: 18, cooldownTicks: 30, splashRadius: 2, hitsFlying: false } },

  { id: 'beacon', name: '篝火', type: 'tower', cost: 2,
    description: '攻撃しないが、隣接する守り手の攻撃力を +25% する。',
    tower: { hp: 8, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false,
             aura: { towerDamageBonus: 0.25 } } },

  { id: 'forge', name: '鍛冶場', type: 'tower', cost: 1,
    description: '攻撃しないが、隣接する守り手の射程を +0.6 する。',
    tower: { hp: 8, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false,
             aura: { towerRangeBonus: 0.6 } } },
```

`levy` は 1、`spike-trap` は 1、`snare-net` は 2、`ember-blast` は 2、`mud-time` は 2 のまま。カード名から「の塔」を落とす（守り手への改名に合わせる）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/cards/card-pool.test.ts`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 5: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): カードのコスト帯を0〜5に広げHPと攻撃力を逆相関させる

攻撃塔5種のうち4種がコスト3に固まっていたのが『似たものがコスト違い』
の実態だった（反復2 #3）。弓兵1・弩砲2・火砲台3・投石機5 に分け、
対空の税を1マナに統一する（弓兵1 対空× / 弩砲2 対空○）。

数値ではなく軸を性質としてテストする。較正で数値は動くが軸は動かない。"
```

---

### Task 10: 石壁の守り手化と徹甲弩の貫通

**Files:**
- Modify: `src/features/ashen-rampart/domain/cards/card-definition.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`
- Modify: `src/features/ashen-rampart/domain/combat/step-tick.ts`
- Create: `src/features/ashen-rampart/domain/combat/step-tick-piercing.test.ts`
- Delete: `src/features/ashen-rampart/domain/combat/step-tick-heavy.test.ts`

- [ ] **Step 1: 失敗するテストを書く（貫通）**

**「一直線上の2体以上に当たる」ことを直接数える。** 1体に当たるだけでも緑になる形を避ける（設計書 §12）。

`src/features/ashen-rampart/domain/combat/step-tick-piercing.test.ts`

```ts
import { createCombatState } from './combat-state';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import type { CombatState } from './combat-state';

describe('貫通（徹甲弩）', () => {
  const wave = [{
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 4, laneIndex: 0 }],
  }];

  const setup = (cardId: string): CombatState => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[5]!;
    // 経路の隣（1マス上）に守り手を置く。列に並んだ敵を横から撃つ形
    const shooter = { x: blockCell.x, y: blockCell.y - 1 };
    const deck = createDeck(['stone-wall', cardId], () => 0);
    let state = { ...createCombatState(deck, wave), mana: 20 };
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: blockCell }], PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: shooter }], PLAINS_MAP);
    return state;
  };

  it('1回の射撃で2体以上にダメージが入る', () => {
    let state = setup('piercer');
    let maxHitsInOneTick = 0;
    for (let i = 0; i < 300; i++) {
      const before = state.enemies.map((e) => e.hp);
      state = stepTick(state, [], PLAINS_MAP);
      const hits = state.enemies.filter((e, idx) => {
        const prev = before[idx];
        return prev !== undefined && e.hp < prev;
      }).length;
      maxHitsInOneTick = Math.max(maxHitsInOneTick, hits);
    }
    expect(maxHitsInOneTick).toBeGreaterThanOrEqual(2);
  });

  it('貫通しない守り手（弩砲）は同じ条件で1体までしか当たらない', () => {
    let state = setup('ballista');
    let maxHitsInOneTick = 0;
    for (let i = 0; i < 300; i++) {
      const before = state.enemies.map((e) => e.hp);
      state = stepTick(state, [], PLAINS_MAP);
      const hits = state.enemies.filter((e, idx) => {
        const prev = before[idx];
        return prev !== undefined && e.hp < prev;
      }).length;
      maxHitsInOneTick = Math.max(maxHitsInOneTick, hits);
    }
    expect(maxHitsInOneTick).toBe(1);
  });
});
```

2つ目が**対照条件**である。1つ目だけでは、範囲攻撃や複数の守り手が原因で2体に当たっている可能性を排除できない。

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-piercing.test.ts`
Expected: FAIL（1件目）

- [ ] **Step 3: `TowerSpec` を変える**

```ts
export interface TowerSpec {
  hp: number;
  range: number;
  damage: number;
  cooldownTicks: number;
  splashRadius: number;
  hitsFlying: boolean;
  aura?: { towerDamageBonus?: number; towerRangeBonus?: number };
  /**
   * 貫通。守り手から標的へ引いた直線上にいる敵すべてに当たる
   *
   * 単体・範囲のどちらとも重ならない3つ目の軸。反復2 のエフェクト設計は
   * 「範囲=太実線 / 単体=細実線 / 貫通=破線」と線種を定義済みだが、
   * 貫通する守り手が存在しなかったため破線は一度も描かれていない。
   */
  piercing?: boolean;
}
```

`heavyBonusThreshold` / `heavyBonusMultiplier` を**削除する**。`damageBreakdown` の該当分岐と `step-tick-heavy.test.ts` も消す。

- [ ] **Step 4: 貫通のダメージ適用を実装する**

`applySplashDamage` の隣に置く。

```ts
/** 点 p と線分 ab の距離（貫通の判定に使う） */
const distanceToSegment = (
  p: { x: number; y: number },
  a: CellPos,
  b: { x: number; y: number }
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** 貫通の当たり幅（セル）。この距離まで直線に近い敵に当たる */
export const PIERCING_WIDTH = 0.5;

/**
 * 貫通ダメージ
 *
 * 守り手から標的へ引いた直線上にいる敵すべてに、同じダメージを与える。
 * 標的より奥の敵にも当たるよう、線分は標的の先まで射程いっぱいに伸ばす。
 */
const applyPiercingDamage = (
  ctx: { from: CellPos; toward: { x: number; y: number }; range: number },
  moved: readonly ActiveEnemy[],
  map: StageMap,
  damage: number,
  hpById: Map<number, number>,
  sourceById: SourceById,
  source: DefeatSource,
  tick: number
): void => {
  const dx = ctx.toward.x - ctx.from.x;
  const dy = ctx.toward.y - ctx.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const end = {
    x: ctx.from.x + (dx / length) * ctx.range,
    y: ctx.from.y + (dy / length) * ctx.range,
  };
  moved.forEach((enemy) => {
    if (!enemy.alive) return;
    const current = hpById.get(enemy.id) ?? enemy.hp;
    if (current <= 0) return;
    const pos = enemyPosition(map, enemy);
    if (distanceToSegment(pos, ctx.from, end) > PIERCING_WIDTH) return;
    hpById.set(enemy.id, current - damage);
    sourceById.set(enemy.id, source);
  });
};
```

`applyUnitShots` の中で、`spec.piercing` なら `applyPiercingDamage` を、`spec.splashRadius > 0` なら既存の `applySplashDamage` を、どちらでもなければ単体ダメージを適用する。

- [ ] **Step 5: 石壁と徹甲弩をカードプールで定義し直す**

```ts
  { id: 'stone-wall', name: '石壁', type: 'tower', cost: 1,
    description: '攻撃しないが非常に硬い。経路に置いて敵を食い止める。',
    tower: { hp: 60, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false } },

  { id: 'piercer', name: '徹甲弩', type: 'tower', cost: 4,
    description: '一直線上の敵をまとめて貫く。飛行も撃てる。',
    tower: { hp: 14, range: 1.8, damage: 14, cooldownTicks: 12, splashRadius: 0,
             hitsFlying: true, piercing: true } },
```

石壁は `type: 'trap'` から `'tower'` になるため、**`trap` スペックを消す**（足止め効果も消える）。`TrapSpec.stunTicks` はどのカードも使わなくなるので型からも削除し、`applyTraps` の該当分岐と `stunnedUntilTick` の書き込みも消す。`ActiveEnemy.stunnedUntilTick` 自体は残す（時泥とは別物だが、将来の足止め札のために型は保つ——**いや、使われないなら消す**。YAGNI）。

**`stunnedUntilTick` を消す。** `isEnemyStunned` と `enemy-status.test.ts` の該当テストも消す。

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/domain/combat/step-tick-piercing.test.ts`
Expected: PASS（2件）

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 7: コミット**

```bash
git add -A src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 石壁を守り手にし徹甲弩を貫通にする

石壁は type: 'trap'（40tick足止め）から type: 'tower'（HP60・攻撃0）へ。
本モデルでは『HP60の壁』のほうが素直であり、足止めと石壁の二重定義も消える。

徹甲弩の『最大HP40以上に2倍』はラン中1体（重装）にしか効かず、
実質的に存在しない特性だった。守り手から標的へ引いた直線上の敵すべてに
当たる貫通に置き換える。単体・範囲のどちらとも重ならない3つ目の軸になる。

貫通は『2体以上に当たる』ことを直接数え、貫通しない守り手を対照条件に置いた。"
```

---

### Task 11: エフェクト2種の追加と破棄優先度

**Files:**
- Modify: `src/features/ashen-rampart/presentation/combat-effects.ts`
- Modify: `src/features/ashen-rampart/presentation/BoardEffectLayer.tsx`
- Test: `src/features/ashen-rampart/presentation/combat-effects.test.ts`
- Test: `src/features/ashen-rampart/presentation/BoardEffectLayer.test.tsx`

**Interfaces:**
- Consumes: Task 5 の `TickEvent` `'unit-damaged'` / `'unit-lost'`（どちらも `pos` を持つ）

- [ ] **Step 1: 失敗するテストを書く**

```ts
import { advanceEffects, EFFECT_LIFETIME, MAX_CONCURRENT_EFFECTS } from './combat-effects';

describe('守り手のエフェクト', () => {
  it('unit-damaged は寿命3tick のエフェクトになる', () => {
    const effects = advanceEffects([], stateWith([
      { kind: 'unit-damaged', unitIndex: 0, pos: { x: 3, y: 2 }, enemyId: 1, amount: 3 },
    ]), PLAINS_MAP);
    const e = effects.find((x) => x.kind === 'unit-damaged');
    expect(e).toBeDefined();
    expect(EFFECT_LIFETIME['unit-damaged']).toBe(3);
  });

  it('unit-lost は寿命8tick のエフェクトになる', () => {
    expect(EFFECT_LIFETIME['unit-lost']).toBe(8);
  });

  it('上限を超えたとき unit-damaged より unit-lost が優先して残る', () => {
    const events = [
      { kind: 'unit-lost' as const, unitIndex: 0, cardId: 'stone-wall', pos: { x: 3, y: 2 } },
      ...Array.from({ length: MAX_CONCURRENT_EFFECTS + 5 }, (_, i) => ({
        kind: 'unit-damaged' as const,
        unitIndex: i, pos: { x: i % 9, y: 2 }, enemyId: i, amount: 1,
      })),
    ];
    const effects = advanceEffects([], stateWith(events), PLAINS_MAP);
    expect(effects.length).toBeLessThanOrEqual(MAX_CONCURRENT_EFFECTS);
    expect(effects.some((e) => e.kind === 'unit-lost')).toBe(true);
  });
});
```

`stateWith` は既存の `combat-effects.test.ts` にあるヘルパーを使う。無ければ同ファイルの既存テストと同じ形で作る（**推測で新設せず、まず既存を確認する**）。

Run: `grep -n "const stateWith\|const makeState" src/features/ashen-rampart/presentation/combat-effects.test.ts`

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/combat-effects.test.ts -t "守り手のエフェクト"`
Expected: FAIL

- [ ] **Step 3: `combat-effects.ts` に2種を足す**

```ts
export const EFFECT_LIFETIME = {
  // ...既存
  'unit-damaged': 3,
  'unit-lost': 8,
} as const;

export type Effect =
  // ...既存
  | { kind: 'unit-damaged'; pos: CellPos; untilTick: number }
  | { kind: 'unit-lost'; pos: CellPos; untilTick: number };
```

破棄優先度を更新する。

```ts
/**
 * 破棄の優先度（大きいほど残す）
 *
 * leak > unit-lost > defeat > trap / ember > shot / unit-damaged
 *
 * 古い順ではなく優先度順に落とす。寿命は shot 3tick に対し leak 8tick で、
 * leak は常に「古い」側になるため、古い順に落とすと密度が最も高い局面で
 * 最も重要な情報が最初に捨てられる（反復2 §4.5）。
 *
 * unit-lost は取り返しがつかない出来事なので leak の次に重い。
 * unit-damaged は攻撃間隔ごとに出る高頻度の出来事なので shot と同格に軽い。
 */
const EFFECT_PRIORITY: Record<Effect['kind'], number> = {
  leak: 5,
  'unit-lost': 4,
  defeat: 3,
  trap: 2,
  ember: 2,
  shot: 1,
  'unit-damaged': 1,
  rejected: 1,
};
```

**既存の `EFFECT_PRIORITY` の実際のキーと値を確認してから書き換える。** 反復2 の実装がどういう形で優先度を持っているかを先に読む。

Run: `sed -n '90,200p' src/features/ashen-rampart/presentation/combat-effects.ts`

- [ ] **Step 4: `BoardEffectLayer.tsx` に描画を足す**

```tsx
{/* 守り手が殴られている: セルの縁を dangerText で囲む。高頻度なので細く短く */}
{effects.filter(isUnitDamaged).map((e, i) => (
  <rect
    key={`ud-${i}`}
    x={e.pos.x - 0.5} y={e.pos.y - 0.5} width={1} height={1}
    fill="none" stroke={theme.dangerText}
    strokeWidth={EFFECT_STROKE_WIDTH.thin}
    vectorEffect="non-scaling-stroke"
    data-testid="effect-unit-damaged"
  />
))}

{/* 守り手が消滅した: danger の ✕。脅威が与えた実害であり漏れと同じ性質 */}
{effects.filter(isUnitLost).map((e, i) => (
  <g key={`ul-${i}`} data-testid="effect-unit-lost">
    <line x1={e.pos.x - 0.3} y1={e.pos.y - 0.3} x2={e.pos.x + 0.3} y2={e.pos.y + 0.3}
      stroke={theme.danger} strokeWidth={EFFECT_STROKE_WIDTH.thick}
      vectorEffect="non-scaling-stroke" />
    <line x1={e.pos.x + 0.3} y1={e.pos.y - 0.3} x2={e.pos.x - 0.3} y2={e.pos.y + 0.3}
      stroke={theme.danger} strokeWidth={EFFECT_STROKE_WIDTH.thick}
      vectorEffect="non-scaling-stroke" />
  </g>
))}
```

**色だけに情報を載せていないことを確認する**——`unit-damaged` は矩形、`unit-lost` は ✕ で、形が違う。

- [ ] **Step 5: 描画のテストを書く（要素数を直接数える）**

`BoardEffectLayer.test.tsx`:

```tsx
it('unit-lost のエフェクトが本数ぶん描画される', () => {
  const effects = [
    { kind: 'unit-lost' as const, pos: { x: 3, y: 2 }, untilTick: 10 },
    { kind: 'unit-lost' as const, pos: { x: 5, y: 4 }, untilTick: 10 },
  ];
  render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
  expect(screen.getAllByTestId('effect-unit-lost')).toHaveLength(2);
});

it('unit-damaged のエフェクトが本数ぶん描画される', () => {
  const effects = [
    { kind: 'unit-damaged' as const, pos: { x: 3, y: 2 }, untilTick: 5 },
  ];
  render(<BoardEffectLayer effects={effects} map={PLAINS_MAP} />);
  expect(screen.getAllByTestId('effect-unit-damaged')).toHaveLength(1);
});
```

**`BoardEffectLayer` の実際の props を確認してから書く。** 反復2 の実装に合わせる。

- [ ] **Step 6: `aria-live` に `unit-lost` を流す**

`battle-announcement.ts` に追加する。基準は反復2 §4.6 のまま——**頻度が低く、かつ取り返しがつかない出来事**。`unit-lost` は該当し、`unit-damaged` は該当しない。

```ts
// 守り手の消滅は頻度が低く取り返しがつかないため読み上げる。
// 被弾（unit-damaged）は攻撃間隔ごとに出る高頻度の出来事なので読み上げない。
// 除外の基準は要素名ではなく性質で書く（反復2 §14.1 の教訓）。
if (event.kind === 'unit-lost') {
  return `${getCardDefinition(event.cardId).name} が破壊されました`;
}
```

- [ ] **Step 7: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 守り手の被弾と消滅をエフェクトに追加する

破棄優先度を leak > unit-lost > defeat > trap/ember > shot/unit-damaged に。
unit-lost は取り返しがつかないので leak の次に重く、unit-damaged は
攻撃間隔ごとに出る高頻度の出来事なので shot と同格に軽い。

aria-live は unit-lost のみ流す。基準は『頻度が低く取り返しがつかない』
という性質であり、要素名ではない。

danger の用途を『漏れ専用』から『脅威の実害』へ一般化した。守り手の
消滅は脅威が与えた実害であり、規約の趣旨に該当する。罠・味方の行動には
引き続き secondary を使う。"
```

---

### Task 12: 盤面の2レーン描画と自由配置

**Files:**
- Modify: `src/features/ashen-rampart/presentation/BoardGrid.tsx`
- Modify: `src/features/ashen-rampart/presentation/EnemyMarker.tsx`
- Test: `src/features/ashen-rampart/presentation/BoardGrid.test.tsx`

- [ ] **Step 1: 失敗するテストを書く**

```tsx
import { PLAINS_MAP, allPathCells, laneOf } from '../domain/board/stage-map';

describe('2レーンの盤面', () => {
  it('両レーンの経路セルが経路として描かれる', () => {
    render(<BoardGrid {...defaultProps} />);
    allPathCells(PLAINS_MAP).forEach((c) => {
      expect(screen.getByTestId(`cell-${c.x}-${c.y}`)).toHaveAttribute('data-path', 'true');
    });
  });

  it('中央列は経路として描かれない（射手を置く場所）', () => {
    render(<BoardGrid {...defaultProps} />);
    expect(screen.getByTestId('cell-4-3')).toHaveAttribute('data-path', 'false');
  });

  it('レーンごとに区別できる属性を持つ（色だけに依存しない）', () => {
    render(<BoardGrid {...defaultProps} />);
    const north = laneOf(PLAINS_MAP, 0)[1]!;
    const south = laneOf(PLAINS_MAP, 1)[1]!;
    const northCell = screen.getByTestId(`cell-${north.x}-${north.y}`);
    const southCell = screen.getByTestId(`cell-${south.x}-${south.y}`);
    expect(northCell.getAttribute('data-lane')).not.toBe(southCell.getAttribute('data-lane'));
  });

  it('守り手のHPバーが表示される', () => {
    const units = [{ cardId: 'stone-wall', pos: { x: 3, y: 2 }, hp: 30, maxHp: 60, cooldownLeft: 0 }];
    render(<BoardGrid {...defaultProps} units={units} />);
    const bar = screen.getByTestId('unit-hp-3-2');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemax', '60');
  });
});
```

**`BoardGrid` の実際の props と `data-testid` の付け方を確認してから書く。** 反復2 の実装に合わせる。

Run: `grep -n "data-testid\|interface BoardGridProps" src/features/ashen-rampart/presentation/BoardGrid.tsx | head -20`

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/BoardGrid.test.tsx -t "2レーンの盤面"`
Expected: FAIL

- [ ] **Step 3: `BoardGrid` を2レーン対応にする**

- 経路判定を `isPathCell(map, pos)` に
- レーンの区別を `data-lane` 属性で出す（**色だけに依存しない**——`enemy-visual.ts` の規約）
- 進行方向の矢印は `pathDirectionAt(laneOf(map, laneIndex), pos)` で、レーンごとに描く
- 「城壁の外」の後退表示を撤去する（置けないマスが砦1つになったため）
- 守り手にHPバーを描く。**S1 の教訓（絶対スケール）に従い、`maxHp` を分母にした比率で描く**

```tsx
<HpBar
  data-testid={`unit-hp-${unit.pos.x}-${unit.pos.y}`}
  role="progressbar"
  aria-valuenow={unit.hp}
  aria-valuemin={0}
  aria-valuemax={unit.maxHp}
  aria-label={`${getCardDefinition(unit.cardId).name} の耐久`}
  $ratio={unit.hp / unit.maxHp}
/>
```

- [ ] **Step 4: 経路上への配置が UI から到達可能であることを統合テストで担保する**

**層ごとのテストが全部緑のまま UI から到達不能だった欠陥が過去に4件ある**（`wave_preview_shown` / `reactivate` / `noteRun` / `exportLogJson`）。ブロックは本反復の中核であり、**経路セルをクリックして守り手を置けなければ機能そのものが存在しない**。ドメインのテストだけでは検出できない。

`src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx` に追記する。

```tsx
it('手札の守り手を選んで経路セルをクリックすると、そこに置かれる', async () => {
  const user = userEvent.setup();
  render(<AshenRampartGame />);
  await startRunWithDeck(['stone-wall']);

  await user.click(screen.getByRole('button', { name: /石壁/ }));
  const pathCell = laneOf(PLAINS_MAP, 0)[3]!;
  await user.click(screen.getByTestId(`cell-${pathCell.x}-${pathCell.y}`));

  expect(screen.getByTestId(`unit-hp-${pathCell.x}-${pathCell.y}`)).toBeInTheDocument();
});
```

`startRunWithDeck` は既存テストの開始手順に合わせる。**同ファイルの既存テストがどうやってランを開始しているかを先に読む。**

Run: `grep -n "const start\|startRun\|データを読み込" src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx | head`

- [ ] **Step 5: 敵マーカーがHPバーを覆わないようにする**

z 順序は **セル(0) < エフェクト(1) < 守り手のHPバー(2) < 敵マーカー(3)** とする。反復2 は「敵マーカーの HP バーをエフェクトが覆ってはならない」と定めており、**守り手のHPバーにも同じ制約が要る**。

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/BoardGrid.test.tsx src/features/ashen-rampart/presentation/AshenRampartGame.test.tsx`
Expected: PASS

Run: `npx jest src/features/ashen-rampart`
Expected: `balance.test.ts`（skip 中）以外は全緑

- [ ] **Step 7: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): 盤面を2レーン表示にし守り手のHPを描く

レーンの区別は data-lane 属性で出す。色だけに情報を載せない
（enemy-visual.ts の規約）。

守り手のHPバーは maxHp を分母にした絶対スケール（S1 の教訓）。
z 順序はセル < エフェクト < 守り手HP < 敵マーカーとし、
エフェクトがHPバーを覆わないようにした。

『城壁の外』の後退表示は撤去した。置けないマスが砦1つになり、
表示する意味が無くなったため。"
```

---

### Task 13: リザルト集計を判定7項目に差し替える

**Files:**
- Modify: `src/features/ashen-rampart/presentation/run-summary.ts`
- Modify: `src/features/ashen-rampart/presentation/RunSummary.tsx`
- Modify: `src/features/ashen-rampart/presentation/useAshenRampartGame.ts`
- Test: `src/features/ashen-rampart/presentation/run-summary.test.ts`
- Test: `src/features/ashen-rampart/presentation/RunSummary.test.tsx`

**Interfaces:**
- Produces: `RunTally` に `laneAllocation` / `blockerPositions` / `unitsLost` / `onPathRatio` / `ravenDefeatProgress` / `costHistogram`

- [ ] **Step 1: 失敗するテストを書く**

設計書 §9.1 の7項目に1対1で対応させる。**判定に使わない数値は出さない**（反復2 §8.2 の原則）。

```ts
import { emptyTally, accumulateTick, summarize } from './run-summary';
import { createCombatState, type CombatState, type TickEvent } from '../domain/combat/combat-state';
import { createDeck } from '../domain/cards/deck';
import { PLAINS_MAP, laneOf } from '../domain/board/stage-map';

/** イベントだけを差し替えた状態を作る。集計は events しか見ないため */
const stateWithEvents = (events: TickEvent[]): CombatState => ({
  ...createCombatState(createDeck([], () => 0), []),
  events,
});

const stateWithPlayed = (cardId: string, pos: { x: number; y: number }): CombatState =>
  stateWithEvents([{ kind: 'played', cardId, pos }]);

/** 鴉を指定の進捗比で倒した状態。進捗比 = progress / (lane.length - 1) */
const stateWithRavenDefeatedAt = (ratio: number): CombatState => {
  const lane = laneOf(PLAINS_MAP, 0);
  const base = stateWithEvents([
    { kind: 'defeat', enemyId: 1, source: { kind: 'unit', index: 0 } },
  ]);
  return {
    ...base,
    enemies: [{
      id: 1, enemyId: 'raven', hp: 0, maxHp: 16,
      progress: ratio * (lane.length - 1), spawnTick: 0, laneIndex: 0,
      alive: false, leaked: false, groundedUntilTick: 0,
    }],
  };
};

describe('判定7項目の集計', () => {
  it('項目1: 2レーンへの配置数の配分を数える', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
    tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 4 }), PLAINS_MAP);
    expect(tally.laneAllocation).toEqual([1, 1]);
  });

  it('項目2: ブロッカーを置いたレーン内位置を記録する', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
    expect(tally.blockerPositions).toEqual([{ laneIndex: 0, index: 3 }]);
  });

  it('項目3: 失った守り手を種類ごとに数える', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithEvents([
      { kind: 'unit-lost', unitIndex: 0, cardId: 'stone-wall', pos: { x: 3, y: 2 } },
      { kind: 'unit-lost', unitIndex: 0, cardId: 'arrow-tower', pos: { x: 4, y: 2 } },
    ]), PLAINS_MAP);
    expect(tally.unitsLost).toEqual({ 'stone-wall': 1, 'arrow-tower': 1 });
  });

  it('項目4: 経路上と経路外の配置数を分けて数える', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithPlayed('stone-wall', { x: 3, y: 2 }), PLAINS_MAP);
    tally = accumulateTick(tally, stateWithPlayed('arrow-tower', { x: 4, y: 3 }), PLAINS_MAP);
    const view = summarize(tally, []);
    expect(view.onPathRatio).toBeCloseTo(0.5);
  });

  it('項目5: 鴉の撃破位置を進捗比で記録する', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithRavenDefeatedAt(0.25), PLAINS_MAP);
    expect(tally.ravenDefeatProgress).toEqual([0.25]);
  });

  it('項目6: 使ったカードのコスト帯を数える', () => {
    let tally = emptyTally();
    tally = accumulateTick(tally, stateWithPlayed('arrow-tower', { x: 4, y: 3 }), PLAINS_MAP);
    expect(tally.costHistogram[1]).toBe(1);
  });

  it('項目6: 一度も出なかったカード種を返す', () => {
    const view = summarize(emptyTally(), ['arrow-tower', 'stone-wall']);
    expect(view.unusedCardIds).toEqual(['arrow-tower', 'stone-wall']);
  });
});
```

- [ ] **Step 2: テストが落ちることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/run-summary.test.ts -t "判定7項目"`
Expected: FAIL

- [ ] **Step 3: `RunTally` を差し替える**

反復2 の項目（`firstReactorTick` / `manaStarvedTicks` / `placeableCellCounts` / `rejectionCounts`）のうち、**判定に使わなくなったものは消す**。ただし `rejectionCounts` は**残す**——クールダウン限定（Task 7）が効いたかを、設置間隔の拒否がほぼ消えることで確認できるため（設計書 §7.1）。

```ts
export interface RunTally {
  /** 項目1: レーンごとの配置数 */
  laneAllocation: number[];
  /** 項目2: 経路上に置いた守り手の位置 */
  blockerPositions: { laneIndex: number; index: number }[];
  /** 項目3: 失った守り手（カードIDごとの数） */
  unitsLost: Record<string, number>;
  /** 項目4: 経路上／経路外の配置数 */
  placedOnPath: number;
  placedOffPath: number;
  /** 項目5: 鴉を倒したときの進捗比（0 = 入口、1 = 砦） */
  ravenDefeatProgress: number[];
  /** 項目6: 使ったカードのコスト別回数（index = コスト） */
  costHistogram: number[];
  /** 項目6: 使ったカードID */
  playedCardIds: string[];
  /** 補助: 拒否理由の内訳（クールダウン限定が効いたかの確認用） */
  rejectionCounts: Record<string, number>;
  /** 守り手別の撃破数（反復2 から引き継ぐ） */
  defeatsByUnit: Record<string, number>;
  /** 支援2種の貢献（反復2 から引き継ぐ） */
  auraDamageBonus: number;
  forgeExtendedShots: number;
}
```

- [ ] **Step 4: `RunSummary.tsx` の表示を差し替える**

**リザルトの2段階表示（勝敗の理由を記録してから集計を表示する）はそのまま維持する。** 判定の汚染防止が実装の都合で崩れることを防ぐため、順序のテストも維持する。

```tsx
<dl>
  <dt>レーンへの配分</dt>
  <dd>北 {tally.laneAllocation[0] ?? 0} / 南 {tally.laneAllocation[1] ?? 0}</dd>

  <dt>前線を敷いた位置</dt>
  <dd>{formatBlockerPositions(tally.blockerPositions)}</dd>

  <dt>失った守り手</dt>
  <dd>{formatUnitsLost(tally.unitsLost)}</dd>

  <dt>経路上／経路外</dt>
  <dd>{tally.placedOnPath} / {tally.placedOffPath}（経路上 {Math.round(view.onPathRatio * 100)}%）</dd>

  <dt>鴉を落とした位置</dt>
  <dd>平均 {Math.round(view.ravenDefeatAverage * 100)}%（0% = 入口、100% = 砦）</dd>

  <dt>使わなかった札</dt>
  <dd>{view.unusedCardIds.map(nameOf).join('・') || 'なし'}</dd>

  <dt>コスト帯の分布</dt>
  <dd>{formatCostHistogram(tally.costHistogram)}</dd>
</dl>
```

**支援2種の行は、デッキに入れなかったランでは出さない**（反復2 の方針を維持）。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx jest src/features/ashen-rampart/presentation/run-summary.test.ts`
Expected: PASS

Run: `npx jest src/features/ashen-rampart/presentation/RunSummary.test.tsx`
Expected: PASS（2段階表示の順序テストを含む）

- [ ] **Step 6: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "feat(ashen-rampart): リザルト集計を反復3の判定7項目に差し替える

レーンへの配分・前線の位置・失った守り手・経路上/外の比率・
鴉を落とした位置・使わなかった札・コスト帯の分布。
判定に使わない数値は出さない（反復2 §8.2 の原則）。

リザルトの2段階表示（理由を記録してから集計）は維持する。
拒否理由の内訳も残した。クールダウン限定が効いたかを、設置間隔の
拒否がほぼ消えることで確認できるため。"
```

---

### Task 14: 較正（戦略変種2つと不変条件5本）

**Files:**
- Modify: `src/features/ashen-rampart/domain/combat/run-simulation.ts`
- Modify: `src/features/ashen-rampart/domain/combat/waves.ts`
- Modify: `src/features/ashen-rampart/domain/cards/card-pool.ts`（プリセット2種）
- Modify: `src/features/ashen-rampart/domain/combat/balance.test.ts`

**Interfaces:**
- Consumes: 全 Task の成果
- Produces: `offPathOnlyStrategy`、`wallAndAirOnlyStrategy`

- [ ] **Step 1: 戦略変種を2つ作る**

**「ブロックが必要か」はデッキ構成では検査できない。** すべての守り手がブロックできる以上、石壁を抜いたデッキでも弓兵を経路上に置けばブロックは成立する。検査したいのは**行為のほう**なので、戦略として作る（設計書 §10）。

```ts
/**
 * 経路外にしか置かない戦略（対照条件）
 *
 * ブロックという行為が本当に必要かを測る。この戦略が勝ててしまうなら、
 * モデルを拡張したのに旧タワーディフェンスとして遊べているということ。
 */
export const offPathOnlyStrategy: Strategy = (state, map) =>
  restrictedGreedy(state, map, (card, pos) => !isPathCell(map, pos));

/**
 * 壁と対空だけを置く戦略（対照条件・逆方向）
 *
 * ブロックが強すぎないかを測る。壁で止めて対空だけ処理する戦略が
 * 勝ちすぎるなら、火力を積む意味が消えている。
 */
export const wallAndAirOnlyStrategy: Strategy = (state, map) =>
  restrictedGreedy(state, map, (card) => {
    const spec = card.tower;
    if (card.type === 'reactor') return true;
    if (!spec) return false;
    return spec.damage === 0 || spec.hitsFlying;
  });
```

`restrictedGreedy` は `greedyStrategy` から述語で絞り込む共通実装にする（DRY）。

```ts
type PlacementFilter = (card: CardDefinition, pos: CellPos) => boolean;

const restrictedGreedy = (
  state: CombatState,
  map: StageMap,
  allow: PlacementFilter
): PlayerAction[] => {
  const actions: PlayerAction[] = [];
  state.embers.forEach((ember, emberIndex) => {
    if (ember.cooldownLeft === 0) actions.push({ kind: 'reactivate', emberIndex });
  });
  if (state.levyOptions.length > 0) actions.push({ kind: 'choose-levy', optionIndex: 0 });

  for (let handIndex = 0; handIndex < state.deck.hand.length; handIndex++) {
    const cardId = state.deck.hand[handIndex];
    if (cardId === undefined) continue;
    const card = getCardDefinition(cardId);
    if (card.cost > state.mana) continue;
    if (card.type === 'reactor' && state.placeCooldown > 0) continue;
    if (placementKindOf(card) === 'none') {
      if (!allow(card, { x: -1, y: -1 })) continue;
      actions.push({ kind: 'play-card', handIndex });
      return actions;
    }
    const pos = placeableCells(state, card, map).find((c) => allow(card, c));
    if (pos) {
      actions.push({ kind: 'play-card', handIndex, pos });
      return actions;
    }
  }
  return actions;
};

export const greedyStrategy: Strategy = (state, map) =>
  restrictedGreedy(state, map, () => true);
```

- [ ] **Step 2: 不変条件を5本書く（まだ落ちてよい）**

`balance.test.ts` の `describe.skip` を外し、中身を差し替える。

```ts
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/**
 * 全要求充足デッキ（壁・射手・対空・範囲・支援を含む20枚）
 *
 * 較正の基準となる1本。ここから述語で札を抜いたものが対照条件になる。
 * 抜いた後の枚数を20枚に戻すため、弓兵で埋める（最も性格が薄い札のため）。
 */
const FULL_DECK: readonly string[] = [
  ...Array(4).fill('reactor'),
  ...Array(3).fill('stone-wall'),
  ...Array(3).fill('arrow-tower'),
  ...Array(3).fill('ballista'),
  ...Array(2).fill('cannon-tower'),
  ...Array(2).fill('spike-trap'),
  'piercer', 'beacon', 'levy',
];

/**
 * 20枚に満たないデッキを弓兵で埋める
 *
 * 対照条件は「特定の性質を持つ札が無い」ことだけを変えたい。枚数まで
 * 減ると「デッキが薄いから負けた」という別の理由が混ざる。
 * 弓兵の同名上限3枚を超える場合は魔力炉で埋める（上限なしのため）。
 */
const padTo20 = (cards: readonly string[]): string[] => {
  const padded = [...cards];
  while (padded.length < 20) {
    const arrows = padded.filter((id) => id === 'arrow-tower').length;
    padded.push(arrows < 3 ? 'arrow-tower' : 'reactor');
  }
  return padded.slice(0, 20);
};

const winsWith = (cards: readonly string[], strategy: Strategy): number =>
  SEEDS.filter((seed) => {
    const deck = createDeck([...cards], createSeededRandom(seed));
    const state = createCombatState(deck, PLAINS_WAVES);
    return simulateRun(state, strategy, PLAINS_MAP).outcome === 'won';
  }).length;

/** 範囲攻撃を持つカード（IDではなくスペック述語で判定する） */
const hasSplash = (id: string) => (getCardDefinition(id).tower?.splashRadius ?? 0) > 0;
/** 対空できるカード */
const hitsFlying = (id: string) =>
  getCardDefinition(id).tower?.hitsFlying === true ||
  getCardDefinition(id).trap?.groundedTicks !== undefined;

describe('バランス較正の不変条件', () => {
  it('全要求充足デッキは 12/20 以上で勝つ', () => {
    expect(winsWith(FULL_DECK, greedyStrategy)).toBeGreaterThanOrEqual(12);
  });

  it('対空を含まないデッキは 4/20 未満しか勝てない', () => {
    const deck = FULL_DECK.filter((id) => !hitsFlying(id));
    expect(deck.length).toBeGreaterThan(0);
    expect(winsWith(padTo20(deck), greedyStrategy)).toBeLessThan(4);
  });

  it('範囲攻撃を含まないデッキは 6/20 未満しか勝てない', () => {
    const deck = FULL_DECK.filter((id) => !hasSplash(id));
    expect(winsWith(padTo20(deck), greedyStrategy)).toBeLessThan(6);
  });

  it('経路上に一切置かない戦略は 4/20 未満しか勝てない（ブロックが必要か）', () => {
    expect(winsWith(FULL_DECK, offPathOnlyStrategy)).toBeLessThan(4);
  });

  it('壁と対空だけを置く戦略は 10/20 未満しか勝てない（ブロックが強すぎないか）', () => {
    expect(winsWith(FULL_DECK, wallAndAirOnlyStrategy)).toBeLessThan(10);
  });
});
```

**両方向を同時に課す。** 片側だけでは較正が厳しすぎても緩すぎても検出できない（反復1で4回繰り返した欠陥への対策）。

- [ ] **Step 3: 落ちることを確認し、現在値を記録する**

Run: `npx jest src/features/ashen-rampart/domain/combat/balance.test.ts`
Expected: FAIL。**各テストの実測値をメモする。**「何勝しているか」が分からないと調整の方向が決まらない。

必要なら一時的に `console.log(winsWith(...))` を入れて実測値を出す（**コミット前に必ず消す**）。

- [ ] **Step 4: ウェーブを2レーンに再構成する**

**敵の種類は増やさない。** 動かすのは数・タイミング・レーン配分だけ。

飛行の保証は**形式**を守る（設計書 §6）。

> 対空手段を1枚も含まないデッキでは、飛行の漏れだけでライフが0を下回る（飛行の体数 > `LIFE_INITIAL`）

```ts
export const PLAINS_WAVES: readonly WaveDefinition[] = [
  // ウェーブ1: 北から雑兵。まず1レーンだけを見ればよい導入
  { startTick: 0, entries: [
    { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
  ]},
  // ウェーブ2: 両レーンに分かれる。ここで初めて配分の判断が要る
  { startTick: 250, entries: [
    { enemyId: 'grunt',  count: 3, spawnIntervalTicks: 8, laneIndex: 0 },
    { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, laneIndex: 1 },
  ]},
  // ウェーブ3: 群れを片側に集中させる。範囲要求。
  // ブロックで詰まるぶん反復2 の22体より効くため、数は較正で決める
  { startTick: 500, entries: [
    { enemyId: 'swarm', count: 18, spawnIntervalTicks: 1, laneIndex: 1 },
    { enemyId: 'grunt', count: 4,  spawnIntervalTicks: 8, laneIndex: 0 },
  ]},
  // ウェーブ4: 重装＋鴉。重装は壁を壊す圧力、鴉は対空要求。
  // 鴉13体 > LIFE_INITIAL(12) の形式を維持する
  { startTick: 750, entries: [
    { enemyId: 'brute', count: 2,  spawnIntervalTicks: 15, laneIndex: 0 },
    { enemyId: 'raven', count: 13, spawnIntervalTicks: 10, laneIndex: 1 },
    { enemyId: 'grunt', count: 3,  spawnIntervalTicks: 8,  laneIndex: 0 },
  ]},
];
```

- [ ] **Step 5: プリセット2種を組み直す**

魔力炉は8枚では多すぎる。**§4.3 の均衡点 R ≈ 2.7 を出発点に 4〜5枚**へ。壁（石壁3枚上限）と対空を必ず含める。

```ts
/**
 * プリセット2種（反復3 の再構成）
 *
 * 魔力炉はクールダウンが律速だった時代の8枚から減らした。§4.3 の均衡は
 * R ≈ 2.7（新プールの平均コスト2.08）で、それを超えるとマナが余って
 * 本命の札が減る。立ち上がり（60R tick）を見て 4〜5枚に置く。
 *
 * **注意: 配列の並び順にも意味がある。** createDeck のシャッフルは入力配列の
 * 順序に依存し、枚数構成が同一でも並べ替えるだけで実測勝率が動く。
 * 順序を変えたら balance.test.ts を必ず再実行すること。
 */
export const PRESET_DECKS: Readonly<Record<string, PresetDeck>> = {
  swift: {
    id: 'swift', name: '速攻型',
    description: '安い弓兵と棘罠で手数を稼ぎ、群れは火砲台で潰す。対空は弩砲。',
    cards: [
      ...repeat('reactor', 4),
      ...repeat('stone-wall', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 2),
      ...repeat('spike-trap', 3),
      ...repeat('forge', 1),
      ...repeat('levy', 1),
    ],
  },
  heavy: {
    id: 'heavy', name: '重厚型',
    description: '徹甲弩と投石機で火力を通し、飛行は落網で落として叩く。',
    cards: [
      ...repeat('reactor', 5),
      ...repeat('stone-wall', 3),
      ...repeat('piercer', 2),
      ...repeat('catapult', 2),
      ...repeat('ballista', 2),
      ...repeat('snare-net', 3),
      ...repeat('beacon', 2),
      ...repeat('levy', 1),
    ],
  },
};
```

`DECK_SIZE = 20` を満たすことを既存テストが検査する。**枚数が合わなければ数を調整する。**

- [ ] **Step 6: 不変条件が全部通るまで調整する**

調整して**よい**もの: ウェーブの数・タイミング・レーン配分、プリセットの構成、カードの数値（§7 の**軸**は崩さない）
調整して**はいけない**もの: 敵の種類、マップの3つの性質（砦以外を共有しない・非対称・両レーンに届く経路外セルがある）、`MAX_ATTACKERS_PER_BLOCKER = 3`

**数値を緩める前に、まず原因が本当に仕様変更によるものかを確認する。** 反復1で「テストは緑、緑の理由が誤っていた」型の欠陥が4件出ている。

Run: `npx jest src/features/ashen-rampart/domain/combat/balance.test.ts`
Expected: PASS（5件）

- [ ] **Step 7: 較正の実測値をコメントに残す**

次の反復が「何がどう動いたか」を追えるように、`card-pool.ts` のプリセット定義の上に実測値を書く。

```ts
 * greedyStrategy・シード1〜20 での実測勝率は **速攻型 N/20・重厚型 M/20**。
 * 対照条件は 経路外のみ K/20 ／ 壁と対空のみ L/20。
```

- [ ] **Step 8: コミット**

```bash
git add src/features/ashen-rampart
git commit -m "test(ashen-rampart): 2レーンの較正をやり直し不変条件を両方向にする

戦略の対照条件を2つ新設した。ブロックが必要かはデッキ構成では
検査できない——すべての守り手がブロックできる以上、石壁を抜いた
デッキでも弓兵を経路上に置けば成立してしまう。検査したいのは行為のほう。

- 経路上に置かない戦略 < 4/20（ブロックが必要か）
- 壁と対空だけを置く戦略 < 10/20（ブロックが強すぎないか）

片側だけでは較正が厳しすぎても緩すぎても検出できない。

飛行の保証は形式（体数 > LIFE_INITIAL）を維持した。"
```

---

### Task 15: 統合確認と「生き残るもの」チェックリスト

**Files:**
- Modify: 必要に応じて既存テスト

- [ ] **Step 1: CI パイプライン全体を実行する**

Run: `npm run ci`
Expected: lint:ci → typecheck → test:coverage → build がすべて成功

- [ ] **Step 2: 落ちた箇所を修正する**

- 型エラー → 新しいイベント形状・レーン構造に合わせて既存テストを更新する
- lint 警告 → 未使用 import の削除が大半（`buildSlotsNearPath` / `isEnemyStunned` の残骸に注意）
- テスト失敗 → **数値を緩める前に、まず原因が本当に仕様変更によるものかを確認する**

- [ ] **Step 3: 設計書 §3.2「生き残るもの」を1項目ずつ目視確認する**

**このプロジェクトは書き直しで物を失った前科がある。** PoC の全面書き直しで `TickEvent` の描画が落ち、反復2でようやく拾い直した。**このチェックリストがその再発防止である。**

- [ ] デッキ構築（`DeckBuilder`）が動く。カードごとの同名上限が表示される
- [ ] マナ経済が動く。魔力炉の上限撤廃が維持されている（`maxCopies: DECK_SIZE`）
- [ ] **エフェクト層が描画されている**（`shot` / `trap` / `ember` / `defeat` / `leak` / `rejected` の6種＋新規2種）
- [ ] エフェクトの破棄が優先度順である（古い順ではない）
- [ ] `prefers-reduced-motion` 対応が生きている（消さずに寿命を揃えて数を半減）
- [ ] `aria-live` が漏れ・ウェーブ境界・守り手の消滅を流す
- [ ] リザルトが**2段階**である（理由を記録してから集計）
- [ ] 支援2種の貢献集計が出る（デッキに入れたランのみ）
- [ ] オンボーディング・カウントダウンが動く
- [ ] 罠2種（棘罠・落網）・燠火・時泥・徴発が動く
- [ ] 高台の火力ボーナス・滞留セルの減速が効いている
- [ ] 拒否理由が盤面直下に出る
- [ ] 手札を能動的に捨てられる
- [ ] `CURRENT_ITERATION = 3`

- [ ] **Step 4: 反復3の実装チェックリストを確認する**

- [ ] 2レーンで、砦セル以外を共有しない
- [ ] 砦セルに何も置けない
- [ ] 魔力炉が経路上に置けない
- [ ] 経路上の守り手が地上の敵を止め、殴られ、HP0 で消滅する
- [ ] `MAX_ATTACKERS_PER_BLOCKER = 3`
- [ ] 飛行がブロックを無視し、地上化中は止まる
- [ ] 配置クールダウンが魔力炉のみ
- [ ] コスト帯が 0〜5 に広がっている
- [ ] 徹甲弩が貫通する（破線で描かれる）
- [ ] 石壁が守り手（HP60・攻撃0）
- [ ] 判定7項目がリザルトに出る
- [ ] 較正の不変条件5本が緑

- [ ] **Step 5: 実プレイ前の準備を PR に書く**

```
実プレイの前に、ブラウザの開発者ツールで以下を実行してください。
localStorage.removeItem('ashen-rampart-play-log')
```

**キー名は `infrastructure/play-log/local-storage-play-log.ts` の実際の定数に合わせる。** 推測で書かない。

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "chore(ashen-rampart): 反復3 の統合確認と既存テストの追随

npm run ci 全緑。レーン構造・守り手・イベント形状の変更に伴う
既存テストの更新を含む。

設計書 §3.2『生き残るもの』を1項目ずつ目視確認した。書き直しで
TickEvent の描画を失った前科への対策。"
```

---

## 実装後の手順（コードではない）

1. PR を作成する。本文に localStorage のクリア手順を明記する
2. CI 全緑を確認してマージする
3. **ユーザーが自分で組んだデッキで3ラン実プレイする。** 判定ランのデッキには**篝火・鍛冶場・石壁を最低1枚ずつ**入れる（集計行が出ない設計のため）
4. 各ランで「勝敗の理由」を記録 → 集計を確認 → 判定7項目を記録する
5. 反証条件（設計書 §9.4）のいずれかに当たった場合は、どれに当たったかを記録して停止する

**この反復では、実装完了は判定ではない。** DoD（`npm run ci` 緑）と CoS（実プレイ7項目の記録）は別物であり、CI 緑は完了ではない。
