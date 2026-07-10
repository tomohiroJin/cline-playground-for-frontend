# Labyrinth of Shadows Phase 2: 逃走の駆け引き再設計 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 敵AIに「視野角コーン＋壁遮蔽の視線モデル」と「巡回→追跡→捜索の状態機械」を導入し、石投げ・索敵UI・速度キャップと合わせて「視線を切れば撒ける」逃走の駆け引きを成立させる。

**Architecture:** ロジックは全て `domain/services`（純粋関数）と `game-tick.ts`/`game-logic.ts` に閉じる。視線判定は新規 `vision.ts`、状態機械は既存 `enemy-strategy.ts` の書き換え、石は新規 `stone.ts`。UI は `EnemyIndicators` コンポーネント追加と HUD/GameController の配線のみ。

**Tech Stack:** TypeScript + React 19 + R3F（描画層は既存流用）、Jest 30（domain 層のユニットテスト）

**Spec:** `docs/superpowers/specs/2026-07-10-labyrinth-of-shadows-phase2-escape-design.md`

## Global Constraints

- 応答・コメント・コミットメッセージは日本語（コミットは Conventional Commits: `feat:`/`test:` 等）
- `any` 禁止。`domain/` から `presentation/` への参照禁止
- TDD: テストを先に書き、失敗を確認してから実装する
- テスト実行: `npx jest src/features/labyrinth-of-shadows --silent`（全体 CI は最終タスクで）
- ブランチ: `feature/labyrinth-of-shadows-phase2-escape`（作成済み・spec コミット済み）
- R3F コンポーネント（`presentation/three/*`）は jsdom テスト対象外（プロジェクト既定）
- 迷路座標系: `maze[y][x]`、セル中心は `+0.5`、`MazeService.isWalkable(maze, x, y)` が歩行可否判定

---

### Task 1: 視線判定サービス vision.ts

**Files:**
- Create: `src/features/labyrinth-of-shadows/domain/services/vision.ts`
- Test: `src/features/labyrinth-of-shadows/domain/__tests__/vision.test.ts`

**Interfaces:**
- Consumes: `MazeService.isWalkable(maze: number[][], x: number, y: number): boolean`（`../../maze-service`）、`distance`/`normAngle`（`../../utils`）
- Produces:
  - `hasLineOfSight(maze: number[][], x1: number, y1: number, x2: number, y2: number): boolean`
  - `isInFieldOfView(dirAngle: number, fromX: number, fromY: number, toX: number, toY: number, fovAngle: number): boolean`
  - `canSeePlayer(params: CanSeePlayerParams): boolean` — Task 3 の ChaserStrategy、Task 4 の TeleporterStrategy が使用

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/features/labyrinth-of-shadows/domain/__tests__/vision.test.ts
import { hasLineOfSight, isInFieldOfView, canSeePlayer } from '../services/vision';

// 5x5 迷路: 外周は壁(1)、内側は通路(0)。中央 (2,2) にだけ壁を置いた盤面も用意
const openMaze = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];
const blockedMaze = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

describe('hasLineOfSight', () => {
  it('遮蔽物のない直線上は見通せる', () => {
    expect(hasLineOfSight(openMaze, 1.5, 1.5, 3.5, 1.5)).toBe(true);
  });

  it('間に壁セルがあると見通せない', () => {
    // (1.5,2.5) → (3.5,2.5) は中央の壁 (2,2) を横切る
    expect(hasLineOfSight(blockedMaze, 1.5, 2.5, 3.5, 2.5)).toBe(false);
  });

  it('同一セル内は常に見通せる', () => {
    expect(hasLineOfSight(blockedMaze, 1.2, 1.2, 1.8, 1.8)).toBe(true);
  });
});

describe('isInFieldOfView', () => {
  const FOV = (Math.PI * 2) / 3; // ±60°

  it('正面方向は視野内', () => {
    // dir=0（+x方向）を向いて、真横 +x にいる対象
    expect(isInFieldOfView(0, 1.5, 1.5, 3.5, 1.5, FOV)).toBe(true);
  });

  it('真後ろは視野外', () => {
    expect(isInFieldOfView(0, 3.5, 1.5, 1.5, 1.5, FOV)).toBe(false);
  });

  it('視野角の境界内（+50°）は視野内', () => {
    const target = { x: 1.5 + Math.cos(Math.PI / 3.6), y: 1.5 + Math.sin(Math.PI / 3.6) };
    expect(isInFieldOfView(0, 1.5, 1.5, target.x, target.y, FOV)).toBe(true);
  });

  it('視野角の境界外（+90°）は視野外', () => {
    expect(isInFieldOfView(0, 1.5, 1.5, 1.5, 3.0, FOV)).toBe(false);
  });
});

describe('canSeePlayer', () => {
  const base = {
    maze: openMaze,
    enemyX: 1.5,
    enemyY: 1.5,
    enemyDir: 0, // +x を向く
    playerX: 3.5,
    playerY: 1.5,
    isPlayerHiding: false,
    sightRange: 8,
    fovAngle: (Math.PI * 2) / 3,
  };

  it('視野内・遮蔽なし・隠れていない場合は見える', () => {
    expect(canSeePlayer(base)).toBe(true);
  });

  it('隠れているプレイヤーは見えない', () => {
    expect(canSeePlayer({ ...base, isPlayerHiding: true })).toBe(false);
  });

  it('距離が sightRange を超えると見えない', () => {
    expect(canSeePlayer({ ...base, sightRange: 1 })).toBe(false);
  });

  it('壁越しには見えない', () => {
    expect(
      canSeePlayer({ ...base, maze: blockedMaze, enemyY: 2.5, playerY: 2.5 })
    ).toBe(false);
  });

  it('視野角の外（真後ろ）は見えない', () => {
    expect(canSeePlayer({ ...base, enemyDir: Math.PI })).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/vision.test.ts --silent`
Expected: FAIL（`Cannot find module '../services/vision'`）

- [ ] **Step 3: 最小実装を書く**

```typescript
// src/features/labyrinth-of-shadows/domain/services/vision.ts
/**
 * 視線判定サービス
 * 敵の「視野角コーン＋壁遮蔽」による発見判定を純粋関数で提供する
 */
import { MazeService } from '../../maze-service';
import { distance, normAngle } from '../../utils';

/** 視線サンプリングの刻み幅（セル単位）。壁厚1セルに対し十分細かい値 */
const RAY_STEP = 0.1;

/** canSeePlayer のパラメータ */
export interface CanSeePlayerParams {
  readonly maze: number[][];
  readonly enemyX: number;
  readonly enemyY: number;
  /** 敵の向き（ラジアン） */
  readonly enemyDir: number;
  readonly playerX: number;
  readonly playerY: number;
  readonly isPlayerHiding: boolean;
  /** 発見可能な最大距離（セル） */
  readonly sightRange: number;
  /** 視野角の全体角（ラジアン）。±fovAngle/2 が見える */
  readonly fovAngle: number;
}

/** 2点間に壁がないか、線分を等間隔サンプリングして判定する */
export const hasLineOfSight = (
  maze: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  const d = distance(x1, y1, x2, y2);
  const steps = Math.ceil(d / RAY_STEP);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!MazeService.isWalkable(maze, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) {
      return false;
    }
  }
  return true;
};

/** 対象が視野角コーン内にいるか */
export const isInFieldOfView = (
  dirAngle: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  fovAngle: number
): boolean => {
  const angleToTarget = Math.atan2(toY - fromY, toX - fromX);
  return Math.abs(normAngle(angleToTarget - dirAngle)) <= fovAngle / 2;
};

/**
 * 敵がプレイヤーを発見できるか。
 * 距離・視野角・壁遮蔽・隠れ状態の全条件が成立した場合のみ true
 */
export const canSeePlayer = (p: CanSeePlayerParams): boolean => {
  if (p.isPlayerHiding) return false;
  if (distance(p.enemyX, p.enemyY, p.playerX, p.playerY) > p.sightRange) return false;
  if (!isInFieldOfView(p.enemyDir, p.enemyX, p.enemyY, p.playerX, p.playerY, p.fovAngle))
    return false;
  return hasLineOfSight(p.maze, p.enemyX, p.enemyY, p.playerX, p.playerY);
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/vision.test.ts --silent`
Expected: PASS（13 tests）

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/domain/services/vision.ts src/features/labyrinth-of-shadows/domain/__tests__/vision.test.ts
git commit -m "feat: 敵の視線判定サービスを追加（視野角コーン＋壁遮蔽）"
```

---

### Task 2: 型・定数・ファクトリの拡張

**Files:**
- Modify: `src/features/labyrinth-of-shadows/types.ts`
- Modify: `src/features/labyrinth-of-shadows/domain/constants.ts`
- Modify: `src/features/labyrinth-of-shadows/constants.ts`
- Modify: `src/features/labyrinth-of-shadows/entity-factory.ts`
- Test: `src/features/labyrinth-of-shadows/__tests__/entity-factory.test.ts`（存在すれば追記、なければ新規）

**Interfaces:**
- Produces（後続タスクが依存する正確な形）:
  - `type EnemyAIState = 'patrol' | 'chase' | 'search'`（types.ts）
  - `Enemy` に追加: `aiState: EnemyAIState; searchTimer: number; loseSightTimer: number;`
  - `GameState` に追加: `stones: number; stoneProjectiles: StoneProjectile[]; sightRange: number; searchDuration: number;`
  - `interface StoneProjectile { x: number; y: number; dirX: number; dirY: number; traveled: number; }`（types.ts）
  - `GAME_BALANCE.enemy` に追加: `FOV_ANGLE`, `LOSE_SIGHT_GRACE`, `LAST_SEEN_REACH_DISTANCE`, `MAX_SPEED_RATIO`, `SEARCH_PULL_DISTANCE`
  - `GAME_BALANCE.stone`（新グループ）: `INITIAL_COUNT: 3, MAX_COUNT: 5, SPEED: 0.012, THROW_RANGE: 6, NOISE_RADIUS: 5`
  - `CONFIG.difficulties.*` に追加: `sightRange`, `searchDuration`, `stonePickups`
  - `CONTENT.items.stone`、`CONTENT.sounds.alert/stoneThrow/stoneLand`

- [ ] **Step 1: 失敗するテストを書く**

既存の `src/features/labyrinth-of-shadows/__tests__/entity-factory.test.ts` があるか確認し（`ls src/features/labyrinth-of-shadows/__tests__/`）、以下の describe を追記（ファイルがなければ新規作成）:

```typescript
// src/features/labyrinth-of-shadows/__tests__/entity-factory.test.ts（追記分）
import { EntityFactory, GameStateFactory } from '../entity-factory';
import { CONFIG } from '../constants';
import { GAME_BALANCE } from '../domain/constants';

describe('Phase2: 敵の状態機械フィールド', () => {
  it('createEnemy は patrol 状態・タイマー0で初期化する', () => {
    const e = EntityFactory.createEnemy(2, 3, 0, 'chaser');
    expect(e.aiState).toBe('patrol');
    expect(e.searchTimer).toBe(0);
    expect(e.loseSightTimer).toBe(0);
  });
});

describe('Phase2: 石と索敵の初期状態', () => {
  it('GameState は石の初期所持数・視界パラメータを難易度から引き継ぐ', () => {
    const g = GameStateFactory.create('NORMAL');
    expect(g.stones).toBe(GAME_BALANCE.stone.INITIAL_COUNT);
    expect(g.stoneProjectiles).toEqual([]);
    expect(g.sightRange).toBe(CONFIG.difficulties.NORMAL.sightRange);
    expect(g.searchDuration).toBe(CONFIG.difficulties.NORMAL.searchDuration);
  });

  it('小石アイテムが難易度定義の個数だけ配置される', () => {
    const g = GameStateFactory.create('NORMAL');
    const stones = g.items.filter(i => i.type === 'stone');
    expect(stones).toHaveLength(CONFIG.difficulties.NORMAL.stonePickups);
  });

  it('敵速度はプレイヤー速度の MAX_SPEED_RATIO 以下', () => {
    for (const d of ['EASY', 'NORMAL', 'HARD'] as const) {
      expect(CONFIG.difficulties[d].enemySpeed).toBeLessThanOrEqual(
        GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO
      );
    }
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/entity-factory.test.ts --silent`
Expected: FAIL（型エラーまたは `aiState` undefined）

- [ ] **Step 3: 型と定数を実装する**

`types.ts` — `EnemyType` の下に追加し、`Enemy`/`GameState` を拡張:

```typescript
export type EnemyAIState = 'patrol' | 'chase' | 'search';

/** 投擲中の石 */
export interface StoneProjectile {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  /** 飛行距離の累計（最大飛距離の判定に使う） */
  traveled: number;
}
```

`Enemy` インターフェースに追加:

```typescript
  /** AI 状態機械の現在状態 */
  aiState: EnemyAIState;
  /** 捜索状態の残り時間（ms） */
  searchTimer: number;
  /** 追跡中に視線を失ってからの経過時間（ms） */
  loseSightTimer: number;
```

`GameState` に追加:

```typescript
  /** 石の所持数 */
  stones: number;
  /** 飛行中の石 */
  stoneProjectiles: StoneProjectile[];
  /** 敵の発見可能距離（難易度依存） */
  sightRange: number;
  /** 敵の捜索持続時間 ms（難易度依存） */
  searchDuration: number;
```

`domain/constants.ts` — `GAME_BALANCE.enemy` に追加（`CLOSE_RANGE_THRESHOLD` と `CLOSE_RANGE_SPEED_MULTIPLIER` は Task 3 で使用箇所ごと削除するのでここでは残す）:

```typescript
    /** 視野角の全体角（ラジアン、±60°） */
    FOV_ANGLE: (Math.PI * 2) / 3,
    /** 追跡中に視線を失ってから捜索へ移るまでの猶予（ms） */
    LOSE_SIGHT_GRACE: 2000,
    /** 最終目撃地点への到達判定距離（セル） */
    LAST_SEEN_REACH_DISTANCE: 0.6,
    /** 敵速度の対プレイヤー移動速度比の上限（走り勝てないが視線を切れば撒ける） */
    MAX_SPEED_RATIO: 0.9,
    /** 捜索中に目撃地点へ引き戻される距離しきい値（セル） */
    SEARCH_PULL_DISTANCE: 2,
```

`GAME_BALANCE` に新グループ `stone` を追加（`items` の後）:

```typescript
  stone: {
    /** 初期所持数 */
    INITIAL_COUNT: 3,
    /** 最大所持数 */
    MAX_COUNT: 5,
    /** 石の飛行速度（セル/ms） */
    SPEED: 0.012,
    /** 最大飛距離（セル） */
    THROW_RANGE: 6,
    /** 着地音に敵が反応する半径（セル） */
    NOISE_RADIUS: 5,
  },
```

`constants.ts` — `CONFIG.difficulties` の3難易度を変更・追加。**レベル軸の変更**: 速度は全難易度でプレイヤー(0.0024)の0.9倍以下にキャップし、難易度は視界・捜索の粘り・敵数で表現する:

| 難易度 | enemySpeed（変更） | sightRange（新） | searchDuration（新） | stonePickups（新） | 敵構成（変更） |
|---|---|---|---|---|---|
| EASY | 0.0014 | 5 | 2500 | 2 | 変更なし |
| NORMAL | 0.0018 | 7 | 4000 | 2 | 変更なし |
| HARD | 0.00216 | 9 | 6000 | 3 | `enemyCount: 4, chasers: 2`（wanderers 1, teleporters 1 のまま） |

`GAME_BALANCE.enemy.WANDERER_SPEED_MULTIPLIER` を `0.6` → `1.0` に変更（eSpeed 全体が下がったため、徘徊型の存在感を維持する補正）。

`CONTENT.items` に追加:

```typescript
    stone: { emoji: '🪨', name: '小石', color: '#c0b8a8', bgColor: '#3a362f' },
```

`CONTENT.sounds` に追加:

```typescript
    alert: [1150, 'square', 0.25],
    stoneThrow: [320, 'triangle', 0.12],
    stoneLand: [170, 'square', 0.3],
```

`CONTENT.demo` の「🙈 隠れる」を新ルールに合わせて更新し、小石の説明を追加:

```typescript
    {
      title: '🙈 隠れる',
      items: ['Spaceで隠れる', '見られる前に隠れろ', '動けずゲージ消費'],
      icon: '👁️',
    },
    {
      title: '🪨 小石',
      items: ['クリックで投げる', '音で敵を誘き寄せる', '追跡中の敵には効かない'],
      icon: '🎯',
    },
```

`entity-factory.ts` — `createEnemy` の戻り値に追加:

```typescript
    aiState: 'patrol',
    searchTimer: 0,
    loseSightTimer: 0,
```

`GameStateFactory.create` — items 配列に小石を追加（`maps` の splice の次の行）:

```typescript
      ...cells.splice(0, cfg.stonePickups).map(c => EntityFactory.createItem(c.x, c.y, 'stone')),
```

戻り値オブジェクトに追加（`import { GAME_BALANCE } from './domain/constants';` を追加）:

```typescript
      stones: GAME_BALANCE.stone.INITIAL_COUNT,
      stoneProjectiles: [],
      sightRange: cfg.sightRange,
      searchDuration: cfg.searchDuration,
```

- [ ] **Step 4: テストと型チェックが通ることを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/entity-factory.test.ts --silent && npm run typecheck`
Expected: テスト PASS。typecheck は enemy-strategy 等の既存コードが新フィールド未対応でもコンパイル可能（追加のみで破壊なし）なので PASS。失敗した場合はエラー箇所（Enemy を直接リテラル生成しているテスト等）に新フィールドを追記する。

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/
git commit -m "feat: Phase2 の型・バランス定数・ファクトリを拡張（状態機械/石/視界パラメータ）"
```

---

### Task 3: ChaserStrategy の状態機械化

**Files:**
- Modify: `src/features/labyrinth-of-shadows/application/game-events.ts`
- Modify: `src/features/labyrinth-of-shadows/domain/services/enemy-strategy.ts`
- Test: `src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts`（既存を書き換え）

**Interfaces:**
- Consumes: `canSeePlayer`（Task 1）、`EnemyAIState`/`Enemy` 新フィールド（Task 2）
- Produces:
  - `GameEvent` に追加: `{ type: 'ENEMY_ALERT'; alert: 'spotted' | 'searching'; x: number; y: number }` と `createEnemyAlertEvent(alert, x, y)`
  - `EnemyUpdateParams` に追加: `sightRange: number; searchDuration: number; noise?: { readonly x: number; readonly y: number };`
  - ChaserStrategy: patrol/chase/search の状態遷移（Task 6 の game-logic が alerts を回収する）

- [ ] **Step 1: ゲームイベントを拡張する**

`application/game-events.ts` の `GameEvent` union に追加:

```typescript
  | {
      readonly type: 'ENEMY_ALERT';
      readonly alert: 'spotted' | 'searching';
      readonly x: number;
      readonly y: number;
    }
```

ヘルパーを追加:

```typescript
/** 敵の状態変化アラート（索敵UIのマーカー表示に使う） */
export const createEnemyAlertEvent = (
  alert: 'spotted' | 'searching',
  x: number,
  y: number
): GameEvent => ({ type: 'ENEMY_ALERT', alert, x, y });
```

- [ ] **Step 2: 失敗するテストを書く**

既存の `domain/__tests__/enemy-strategy.test.ts` の ChaserStrategy 関連テストは旧仕様（距離のみで追跡）なので、**旧 Chaser テストを削除して以下に置き換える**（Wanderer/Teleporter のテストは Task 4 まで残す。コンパイルエラーになる場合は enemy 生成ヘルパーに新3フィールドを追加して凌ぐ）:

```typescript
// domain/__tests__/enemy-strategy.test.ts の ChaserStrategy テスト（置き換え）
import { ChaserStrategy } from '../services/enemy-strategy';
import type { Enemy } from '../../types';

// 7x7 の十字通路迷路: 中央行・中央列が通路
const maze = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

const createChaser = (x: number, y: number, dir = 0): Enemy => ({
  x, y, dir,
  active: true, actTime: 0,
  lastSeenX: -1, lastSeenY: -1,
  type: 'chaser', path: [], pathTime: -10000, teleportCooldown: 0,
  aiState: 'patrol', searchTimer: 0, loseSightTimer: 0,
});

const baseParams = (e: Enemy, over: Record<string, unknown> = {}) => ({
  enemy: e,
  playerX: 5.5, playerY: 3.5,
  isPlayerHiding: false,
  maze,
  enemySpeed: 0.002,
  dt: 16,
  gameTime: 1000,
  randomFn: () => 0.5,
  sightRange: 8,
  searchDuration: 4000,
  ...over,
});

describe('ChaserStrategy 状態機械', () => {
  const strategy = new ChaserStrategy();

  it('patrol: 視界内のプレイヤーを発見して chase に遷移し spotted アラートを出す', () => {
    const e = createChaser(1.5, 3.5, 0); // +x を向く。プレイヤーは同一行の (5.5,3.5)
    const result = strategy.update(baseParams(e));
    expect(e.aiState).toBe('chase');
    expect(e.lastSeenX).toBe(5.5);
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'ENEMY_ALERT', alert: 'spotted' })
    );
  });

  it('patrol: 背後のプレイヤーには気づかない', () => {
    const e = createChaser(1.5, 3.5, Math.PI); // -x を向く（プレイヤーに背中）
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('patrol');
  });

  it('patrol: 壁越しのプレイヤーには気づかない', () => {
    const e = createChaser(3.5, 1.5, Math.PI / 2); // 縦通路の上端、+y を向く
    // プレイヤー (1.5,3.5) は横通路。角を挟むので直線は壁を通る
    const p = baseParams(e, { playerX: 1.5, playerY: 3.5 });
    strategy.update(p);
    expect(e.aiState).toBe('patrol');
  });

  it('patrol: 隠れているプレイヤーは発見できない', () => {
    const e = createChaser(1.5, 3.5, 0);
    strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('patrol');
  });

  it('chase: 視認中は lastSeen を更新し続ける', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase';
    strategy.update(baseParams(e, { playerX: 4.5 }));
    expect(e.lastSeenX).toBe(4.5);
    expect(e.loseSightTimer).toBe(0);
  });

  it('chase: 視線を失い猶予時間を超えると search に遷移する', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase';
    e.lastSeenX = 5.5; e.lastSeenY = 3.5;
    e.loseSightTimer = 2100; // LOSE_SIGHT_GRACE=2000 超過
    const result = strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('search');
    expect(e.searchTimer).toBe(4000);
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'ENEMY_ALERT', alert: 'searching' })
    );
  });

  it('chase: 最終目撃地点に到達したら search に遷移する', () => {
    const e = createChaser(3.5, 3.5, 0);
    e.aiState = 'chase';
    e.lastSeenX = 3.6; e.lastSeenY = 3.5; // 到達済み（< LAST_SEEN_REACH_DISTANCE）
    strategy.update(baseParams(e, { isPlayerHiding: true }));
    expect(e.aiState).toBe('search');
  });

  it('search: プレイヤーを再発見すると chase に戻る', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'search'; e.searchTimer = 3000;
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('chase');
  });

  it('search: タイマーが切れると patrol に戻る', () => {
    const e = createChaser(1.5, 3.5, Math.PI); // プレイヤーに背を向けたまま
    e.aiState = 'search'; e.searchTimer = 10;
    strategy.update(baseParams(e));
    expect(e.aiState).toBe('patrol');
    expect(e.lastSeenX).toBe(-1);
  });

  it('patrol: 音（石の着地）に反応して search に遷移する', () => {
    const e = createChaser(1.5, 3.5, Math.PI);
    strategy.update(baseParams(e, { noise: { x: 3.5, y: 3.5 } }));
    expect(e.aiState).toBe('search');
    expect(e.lastSeenX).toBe(3.5);
    expect(e.searchTimer).toBe(4000);
  });

  it('chase: 音には反応しない（追跡を優先する）', () => {
    const e = createChaser(1.5, 3.5, 0);
    e.aiState = 'chase'; e.lastSeenX = 5.5; e.lastSeenY = 3.5;
    strategy.update(baseParams(e, { noise: { x: 3.5, y: 5.5 } }));
    expect(e.aiState).toBe('chase');
    expect(e.lastSeenX).toBe(5.5); // 音で上書きされない
  });

  it('patrol: 遠すぎる音（NOISE_RADIUS 外）には反応しない', () => {
    const e = createChaser(1.5, 3.5, Math.PI);
    strategy.update(baseParams(e, { noise: { x: 30, y: 30 } }));
    expect(e.aiState).toBe('patrol');
  });
});
```

- [ ] **Step 3: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts --silent`
Expected: FAIL（`aiState` が遷移しない／`ENEMY_ALERT` イベントなし）

- [ ] **Step 4: ChaserStrategy を実装する**

`enemy-strategy.ts` — インポートと `EnemyUpdateParams` を拡張し、`ChaserStrategy` を書き換える。移動ヘルパーを module 関数として抽出する:

```typescript
// インポートに追加
import { canSeePlayer } from './vision';
import { createEnemyAlertEvent } from '../../application/game-events';

// 分割代入に追加（CLOSE_RANGE_THRESHOLD / CLOSE_RANGE_SPEED_MULTIPLIER / CHASE_RANGE は削除）
const {
  PATH_RECALC_INTERVAL,
  TELEPORT_COOLDOWN,
  TELEPORT_CHASE_RANGE,
  WANDERER_SPEED_MULTIPLIER,
  TELEPORTER_CHASE_SPEED_MULTIPLIER,
  TELEPORTER_PATROL_SPEED_MULTIPLIER,
  TELEPORT_MIN_DISTANCE,
  TELEPORT_MAX_DISTANCE,
  PATH_NODE_REACH_DISTANCE,
  FOV_ANGLE,
  LOSE_SIGHT_GRACE,
  LAST_SEEN_REACH_DISTANCE,
  SEARCH_PULL_DISTANCE,
} = GAME_BALANCE.enemy;

// EnemyUpdateParams に追加
  /** 敵の発見可能距離（難易度依存） */
  readonly sightRange: number;
  /** 捜索状態の持続時間 ms（難易度依存） */
  readonly searchDuration: number;
  /** このフレームに発生した音源（石の着地点）。未発生なら undefined */
  readonly noise?: { readonly x: number; readonly y: number };
```

module レベルの移動ヘルパー（Chaser 各状態と Wanderer で共有し重複を除去）:

```typescript
/** dir 方向へ速度分移動する。壁なら方向転換して失敗を返す */
const tryMove = (
  e: Enemy,
  maze: number[][],
  speed: number,
  dt: number,
  randomFn: () => number
): boolean => {
  const nx = e.x + Math.cos(e.dir) * speed * dt;
  const ny = e.y + Math.sin(e.dir) * speed * dt;
  if (MazeService.isWalkable(maze, nx, ny)) {
    e.x = nx;
    e.y = ny;
    return true;
  }
  e.dir += Math.PI * 0.5 + randomFn() * 0.5;
  return false;
};

/** ランダムに向きを揺らしながら歩く（巡回・捜索の基本動作） */
const wanderMove = (
  e: Enemy,
  maze: number[][],
  speed: number,
  dt: number,
  randomFn: () => number
): void => {
  e.dir += (randomFn() - 0.5) * 0.055;
  tryMove(e, maze, speed, dt, randomFn);
};

/** 目標地点の方向へ滑らかに旋回する */
const steerToward = (e: Enemy, targetX: number, targetY: number, rate: number): void => {
  e.dir += normAngle(Math.atan2(targetY - e.y, targetX - e.x) - e.dir) * rate;
};

/** BFS パスに沿って移動する（パスが空なら直接旋回） */
const followPath = (
  e: Enemy,
  maze: number[][],
  targetX: number,
  targetY: number,
  speed: number,
  dt: number,
  randomFn: () => number
): void => {
  if (e.path.length > 0) {
    const next = e.path[0];
    if (distance(e.x, e.y, next.x, next.y) < PATH_NODE_REACH_DISTANCE) e.path.shift();
    if (e.path.length > 0) {
      const target = e.path[0];
      e.dir = Math.atan2(target.y - e.y, target.x - e.x);
    }
  } else {
    steerToward(e, targetX, targetY, 0.045);
  }
  tryMove(e, maze, speed, dt, randomFn);
};

/** 発見時の共通処理: chase へ遷移して警戒音とアラートを発行する */
const enterChase = (e: Enemy, playerX: number, playerY: number, events: GameEvent[]): void => {
  e.aiState = 'chase';
  e.lastSeenX = playerX;
  e.lastSeenY = playerY;
  e.loseSightTimer = 0;
  e.path = [];
  e.pathTime = -PATH_RECALC_INTERVAL; // 次フレームで即パス再計算させる
  events.push(createSoundEvent('alert', 0.35), createEnemyAlertEvent('spotted', e.x, e.y));
};

/** 音源が反応半径内なら捜索状態へ遷移する */
const respondToNoise = (e: Enemy, params: EnemyUpdateParams): boolean => {
  const { noise, searchDuration } = params;
  if (!noise) return false;
  if (distance(e.x, e.y, noise.x, noise.y) > GAME_BALANCE.stone.NOISE_RADIUS) return false;
  e.aiState = 'search';
  e.lastSeenX = noise.x;
  e.lastSeenY = noise.y;
  e.searchTimer = searchDuration;
  return true;
};
```

`ChaserStrategy` 本体（全置き換え）:

```typescript
/** 追跡型AI: 巡回→追跡→捜索の状態機械。視野角＋壁遮蔽で発見する */
export class ChaserStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    switch (params.enemy.aiState) {
      case 'chase':
        return this.updateChase(params);
      case 'search':
        return this.updateSearch(params);
      default:
        return this.updatePatrol(params);
    }
  }

  private canSee(params: EnemyUpdateParams): boolean {
    const { enemy: e, playerX, playerY, isPlayerHiding, maze, sightRange } = params;
    return canSeePlayer({
      maze,
      enemyX: e.x,
      enemyY: e.y,
      enemyDir: e.dir,
      playerX,
      playerY,
      isPlayerHiding,
      sightRange,
      fovAngle: FOV_ANGLE,
    });
  }

  private updatePatrol(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, randomFn } = params;
    const events: GameEvent[] = [];
    if (this.canSee(params)) {
      enterChase(e, playerX, playerY, events);
      return { events };
    }
    if (respondToNoise(e, params)) return { events };
    wanderMove(e, maze, enemySpeed * 0.5, dt, randomFn);
    return { events };
  }

  private updateChase(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, gameTime, randomFn, searchDuration } =
      params;
    const events: GameEvent[] = [];

    if (this.canSee(params)) {
      e.lastSeenX = playerX;
      e.lastSeenY = playerY;
      e.loseSightTimer = 0;
    } else {
      e.loseSightTimer += dt;
      const reached = distance(e.x, e.y, e.lastSeenX, e.lastSeenY) < LAST_SEEN_REACH_DISTANCE;
      if (reached || e.loseSightTimer > LOSE_SIGHT_GRACE) {
        e.aiState = 'search';
        e.searchTimer = searchDuration;
        events.push(createEnemyAlertEvent('searching', e.x, e.y));
        return { events };
      }
    }

    if (gameTime - e.pathTime > PATH_RECALC_INTERVAL) {
      e.path = bfsPath(maze, e.x, e.y, e.lastSeenX, e.lastSeenY);
      e.pathTime = gameTime;
    }
    followPath(e, maze, e.lastSeenX, e.lastSeenY, enemySpeed, dt, randomFn);
    return { events };
  }

  private updateSearch(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, randomFn } = params;
    const events: GameEvent[] = [];

    if (this.canSee(params)) {
      enterChase(e, playerX, playerY, events);
      return { events };
    }
    respondToNoise(e, params); // 新しい音で捜索先を更新（search のまま）

    e.searchTimer -= dt;
    if (e.searchTimer <= 0) {
      e.aiState = 'patrol';
      e.lastSeenX = -1;
      e.lastSeenY = -1;
      return { events };
    }

    // 目撃地点の周辺に留まる: 離れたら引き戻し、近くではうろつく
    if (distance(e.x, e.y, e.lastSeenX, e.lastSeenY) > SEARCH_PULL_DISTANCE) {
      steerToward(e, e.lastSeenX, e.lastSeenY, 0.05);
      tryMove(e, maze, enemySpeed * 0.7, dt, randomFn);
    } else {
      wanderMove(e, maze, enemySpeed * 0.7, dt, randomFn);
    }
    return { events };
  }
}
```

`WandererStrategy` の移動部を `wanderMove` ヘルパーで置き換え（挙動パリティ: 方向揺らぎ幅 0.04 と反転確率 0.002 のロジックは維持したいので、既存実装のまま `tryMove` のみ利用する形でよい）。

`domain/constants.ts` から `CLOSE_RANGE_THRESHOLD` / `CLOSE_RANGE_SPEED_MULTIPLIER` / `CHASE_RANGE` を削除（速度キャップ方式に置き換わり不要。`CHASE_RANGE` の役割は難易度別 `sightRange` が引き継ぐ）。参照が残ってコンパイルエラーになる箇所（`constants.ts` の `CONFIG.enemy.chaseRange` は別物なので触らない）を確認する。

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts --silent && npm run typecheck`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-of-shadows/
git commit -m "feat: 追跡型AIを状態機械化（巡回→追跡→捜索、視線ベース発見・音反応）"
```

---

### Task 4: TeleporterStrategy の視認ベース化

**Files:**
- Modify: `src/features/labyrinth-of-shadows/domain/services/enemy-strategy.ts`
- Test: `src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts`

**Interfaces:**
- Consumes: `hasLineOfSight`（Task 1）
- Produces: Teleporter の追跡条件が「距離＋壁遮蔽（360°視界）」に変わる。テレポートの発動条件は現状維持

- [ ] **Step 1: 失敗するテストを書く**

`enemy-strategy.test.ts` に追記:

```typescript
import { TeleporterStrategy } from '../services/enemy-strategy';

describe('TeleporterStrategy 視認ベース追跡', () => {
  const strategy = new TeleporterStrategy();

  const createTeleporter = (x: number, y: number): Enemy => ({
    x, y, dir: 0,
    active: true, actTime: 0,
    lastSeenX: -1, lastSeenY: -1,
    type: 'teleporter', path: [], pathTime: 0, teleportCooldown: 5000,
    aiState: 'patrol', searchTimer: 0, loseSightTimer: 0,
  });

  it('壁越しのプレイヤーは追跡しない', () => {
    // 縦通路の敵 (3.5,1.5) と横通路のプレイヤー (1.5,3.5): 距離は近いが直線は壁を通る
    const e = createTeleporter(3.5, 1.5);
    const before = { x: e.x, y: e.y };
    strategy.update(baseParams(e, { playerX: 1.5, playerY: 3.5 }));
    // 追跡していれば target 方向に直進するはず。巡回（ランダム歩き）の移動距離と方向で判別
    const movedTowardPlayer =
      Math.hypot(e.x - 1.5, e.y - 3.5) < Math.hypot(before.x - 1.5, before.y - 3.5) - 0.01;
    expect(movedTowardPlayer).toBe(false);
  });

  it('遮蔽のない近距離プレイヤーは追跡する', () => {
    const e = createTeleporter(3.5, 3.5); // プレイヤー (5.5,3.5) と同一通路・距離2
    const before = Math.hypot(e.x - 5.5, e.y - 3.5);
    strategy.update(baseParams(e));
    expect(Math.hypot(e.x - 5.5, e.y - 3.5)).toBeLessThan(before);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts --silent`
Expected: 壁越しテストが FAIL（現行は距離のみで追跡するため）

- [ ] **Step 3: 実装する**

`TeleporterStrategy.update` の追跡条件を変更（1行）:

```typescript
    // 変更前: if (!isPlayerHiding && d < TELEPORT_CHASE_RANGE) {
    // 変更後: 壁越しには追跡しない（視認ベース）。歪みなので視野角はなく360°
    if (!isPlayerHiding && d < TELEPORT_CHASE_RANGE && hasLineOfSight(maze, e.x, e.y, playerX, playerY)) {
```

インポートに `hasLineOfSight` を追加（`./vision` から）。

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/enemy-strategy.test.ts --silent`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/features/labyrinth-of-shadows/domain/
git commit -m "feat: テレポート型AIの追跡を視認ベースに変更（壁越し追跡を解消）"
```

---

### Task 5: 石のドメインロジックとアイテム取得

**Files:**
- Create: `src/features/labyrinth-of-shadows/domain/services/stone.ts`
- Modify: `src/features/labyrinth-of-shadows/game-logic.ts`（updateItems に stone ケース追加）
- Test: `src/features/labyrinth-of-shadows/domain/__tests__/stone.test.ts`

**Interfaces:**
- Consumes: `GameState.stones / stoneProjectiles / player`（Task 2）、`MazeService.isWalkable`
- Produces:
  - `tryThrowStone(g: GameState): boolean` — 投げられたら true（Task 6 の advanceGame が使用）
  - `updateStoneProjectiles(g: GameState, dt: number): { x: number; y: number } | undefined` — 着地したフレームは着地点（音源）を返す

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// src/features/labyrinth-of-shadows/domain/__tests__/stone.test.ts
import { tryThrowStone, updateStoneProjectiles } from '../services/stone';
import { GAME_BALANCE } from '../constants';
import type { GameState } from '../../types';

// 横一直線の通路（y=1）
const maze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const createState = (over: Partial<GameState> = {}): GameState =>
  ({
    maze,
    player: { x: 1.5, y: 1.5, angle: 0, stamina: 100 }, // +x を向く
    stones: 3,
    stoneProjectiles: [],
    hiding: false,
    ...over,
  }) as GameState;

describe('tryThrowStone', () => {
  it('所持数を減らして照準方向の弾を生成する', () => {
    const g = createState();
    expect(tryThrowStone(g)).toBe(true);
    expect(g.stones).toBe(2);
    expect(g.stoneProjectiles).toHaveLength(1);
    expect(g.stoneProjectiles[0].dirX).toBeCloseTo(1);
    expect(g.stoneProjectiles[0].dirY).toBeCloseTo(0);
  });

  it('所持数0では投げられない', () => {
    const g = createState({ stones: 0 });
    expect(tryThrowStone(g)).toBe(false);
    expect(g.stoneProjectiles).toHaveLength(0);
  });

  it('隠れ中は投げられない', () => {
    const g = createState({ hiding: true });
    expect(tryThrowStone(g)).toBe(false);
  });
});

describe('updateStoneProjectiles', () => {
  it('飛行中は位置が進み、音源は返さない', () => {
    const g = createState();
    tryThrowStone(g);
    const noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeUndefined();
    expect(g.stoneProjectiles[0].x).toBeGreaterThan(1.5);
  });

  it('壁に当たると消えて着地点（音源）を返す', () => {
    const g = createState();
    tryThrowStone(g);
    // 通路長より十分大きい時間で必ず壁到達（x=9 が壁）
    let noise: { x: number; y: number } | undefined;
    for (let i = 0; i < 100 && !noise; i++) noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeDefined();
    expect(noise!.x).toBeLessThan(9);
    expect(g.stoneProjectiles).toHaveLength(0);
  });

  it('最大飛距離 THROW_RANGE で着地する', () => {
    // 長い通路を用意して壁より先に飛距離切れさせる
    const longMaze = [
      Array(30).fill(1),
      [1, ...Array(28).fill(0), 1],
      Array(30).fill(1),
    ];
    const g = createState({ maze: longMaze });
    tryThrowStone(g);
    let noise: { x: number; y: number } | undefined;
    for (let i = 0; i < 200 && !noise; i++) noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeDefined();
    expect(noise!.x - 1.5).toBeLessThanOrEqual(GAME_BALANCE.stone.THROW_RANGE + 0.3);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/stone.test.ts --silent`
Expected: FAIL（`Cannot find module '../services/stone'`）

- [ ] **Step 3: stone.ts を実装する**

```typescript
// src/features/labyrinth-of-shadows/domain/services/stone.ts
/**
 * 石投げのドメインロジック
 * 投擲・飛行・着地（音源の発生）を扱う。敵の反応は enemy-strategy 側の noise 処理が担う
 */
import type { GameState } from '../../types';
import { MazeService } from '../../maze-service';
import { GAME_BALANCE } from '../constants';

const { SPEED, THROW_RANGE } = GAME_BALANCE.stone;

/** 石を投げる。所持数がない・隠れ中は投げられない */
export const tryThrowStone = (g: GameState): boolean => {
  if (g.stones <= 0 || g.hiding) return false;
  g.stones--;
  g.stoneProjectiles.push({
    x: g.player.x,
    y: g.player.y,
    dirX: Math.cos(g.player.angle),
    dirY: Math.sin(g.player.angle),
    traveled: 0,
  });
  return true;
};

/**
 * 飛行中の石を進める。壁衝突または最大飛距離で着地し、着地点を音源として返す。
 * 同一フレームに複数着地しても音源は1つで十分（最後の着地点を返す）
 */
export const updateStoneProjectiles = (
  g: GameState,
  dt: number
): { x: number; y: number } | undefined => {
  let noise: { x: number; y: number } | undefined;
  g.stoneProjectiles = g.stoneProjectiles.filter(p => {
    const step = SPEED * dt;
    const nx = p.x + p.dirX * step;
    const ny = p.y + p.dirY * step;
    p.traveled += step;
    if (!MazeService.isWalkable(g.maze, nx, ny) || p.traveled >= THROW_RANGE) {
      noise = { x: p.x, y: p.y }; // 壁にめり込まず手前で着地
      return false;
    }
    p.x = nx;
    p.y = ny;
    return true;
  });
  return noise;
};
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/domain/__tests__/stone.test.ts --silent`
Expected: PASS

- [ ] **Step 5: 小石アイテムの取得処理を追加する**

`game-logic.ts` の `updateItems` ループ先頭の continue 判定の直後に、満杯チェックを追加（`item.got = true;` より**前**）:

```typescript
      // 小石は満杯なら拾わずフィールドに残す
      if (item.type === 'stone' && g.stones >= GAME_BALANCE.stone.MAX_COUNT) continue;
```

switch に case を追加:

```typescript
        case 'stone':
          g.stones++;
          g.msg = `🪨 小石を拾った (${g.stones}/${GAME_BALANCE.stone.MAX_COUNT})`;
          AudioService.play('stoneLand', 0.2);
          break;
```

`game-logic.test.ts` に取得テストを追記:

```typescript
// 既存のテストヘルパー（GameState 生成）に合わせて記述する。要点:
it('小石を拾うと所持数が増える', () => {
  // g.items に { x: player近傍, y: ..., type: 'stone', got: false } を置いて updateItems
  // 期待: g.stones が +1、item.got === true
});
it('所持数が MAX_COUNT のとき小石は拾わない', () => {
  // g.stones = 5 で updateItems → item.got === false のまま
});
```

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-logic.test.ts --silent`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-of-shadows/
git commit -m "feat: 石投げのドメインロジックと小石アイテム取得を追加"
```

---

### Task 6: game-logic / game-tick への統合（速度キャップ・noise・alerts 伝搬）

**Files:**
- Modify: `src/features/labyrinth-of-shadows/game-logic.ts`
- Modify: `src/features/labyrinth-of-shadows/game-tick.ts`
- Test: `src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts`、`__tests__/game-logic.test.ts`（パリティ修正含む）

**Interfaces:**
- Consumes: `tryThrowStone`/`updateStoneProjectiles`（Task 5）、拡張済み `EnemyUpdateParams`（Task 3）
- Produces（Task 7 の UI が依存）:
  - `TickInput` に追加: `readonly throwStone: boolean;`
  - `TickResult` に追加: `readonly alerts: readonly EnemyAlert[];`
  - `export interface EnemyAlert { readonly kind: 'spotted' | 'searching'; readonly x: number; readonly y: number; }`（game-tick.ts）
  - `GameLogic.updateEnemies(g, dt, noise?)` の戻り値: `{ closest: number; nearest: Enemy | undefined; alerts: EnemyAlert[] }`

- [ ] **Step 1: 失敗するテストを書く**

`__tests__/game-tick.test.ts` に追記（既存のヘルパー/GameStateFactory 利用に合わせる）:

```typescript
describe('Phase2: 石投げと索敵の統合', () => {
  it('throwStone 入力で石が減り弾が生成される', () => {
    const g = GameStateFactory.create('NORMAL');
    const before = g.stones;
    advanceGame(g, 16, { ...idleInput, throwStone: true });
    expect(g.stones).toBe(before - 1);
    expect(g.stoneProjectiles).toHaveLength(1);
  });

  it('敵に渡る速度はプレイヤー速度の0.9倍を超えない', () => {
    // GAME_BALANCE.player.MOVE_SPEED * MAX_SPEED_RATIO を超える eSpeed を強制しても
    // capEnemySpeed でキャップされることを確認する（capEnemySpeed を export して直接検証）
    expect(capEnemySpeed(999)).toBeCloseTo(
      GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO
    );
    expect(capEnemySpeed(0.001)).toBe(0.001);
  });

  it('TickResult は alerts 配列を返す', () => {
    const g = GameStateFactory.create('NORMAL');
    const result = advanceGame(g, 16, idleInput);
    expect(Array.isArray(result.alerts)).toBe(true);
  });
});
```

`idleInput` は既存テストの全 false 入力に `throwStone: false` を加えたもの。既存テストの `TickInput` リテラルは型エラーになるため `throwStone: false` を一括追記する。

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/game-tick.test.ts --silent`
Expected: FAIL（型エラー: `throwStone` が存在しない）

- [ ] **Step 3: game-logic.ts を実装する**

`updateEnemyWithStrategy` — strategy.update のパラメータを拡張し、速度をキャップ:

```typescript
// import に追加
import { normAngle } from './utils';
import type { EnemyAlert } from './game-tick';

/** 敵速度をプレイヤー速度の MAX_SPEED_RATIO 倍でキャップする（逃走成立の保証） */
export const capEnemySpeed = (eSpeed: number): number =>
  Math.min(eSpeed, GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO);
```

```typescript
    const result = strategy.update({
      enemy: e,
      playerX: g.player.x,
      playerY: g.player.y,
      isPlayerHiding: g.hiding,
      maze: g.maze,
      enemySpeed: capEnemySpeed(g.eSpeed),
      dt,
      gameTime: g.gTime,
      randomFn: Math.random,
      sightRange: g.sightRange,
      searchDuration: g.searchDuration,
      noise,
    });
```

（`updateEnemyWithStrategy(g, e, dt, noise?)` にシグネチャ変更。イベント処理はそのまま `SOUND_PLAY` を再生し、`ENEMY_ALERT` は上位へ返す。）

`updateEnemies` — 戻り値を拡張:

```typescript
  updateEnemies(
    g: GameState,
    dt: number,
    noise?: { readonly x: number; readonly y: number }
  ): { closest: number; nearest: Enemy | undefined; alerts: EnemyAlert[] } {
    let closest: number = GAME_BALANCE.enemy.INITIAL_CLOSEST_DISTANCE;
    let nearest: Enemy | undefined;
    const alerts: EnemyAlert[] = [];
    for (const e of g.enemies) {
      const r = this.updateEnemyWithStrategy(g, e, dt, noise);
      if (r.distance < closest) {
        closest = r.distance;
        nearest = e;
      }
      for (const ev of r.events) {
        if (ev.type === 'ENEMY_ALERT') alerts.push({ kind: ev.alert, x: ev.x, y: ev.y });
      }
    }
    return { closest, nearest, alerts };
  },
```

旧 `updateEnemy(g, e, dt)` は呼び出し元がなくなるため削除（`git grep "updateEnemy\b"` で他参照がないこと確認）。

`updateSounds` — 最寄り敵の相対方位でパンを付ける:

```typescript
  updateSounds(g: GameState, closestEnemy: number, dt: number, nearest?: Enemy) {
    g.timers.enemySound -= dt;
    g.timers.heartbeat -= dt;

    if (closestEnemy < 10 && g.timers.enemySound <= 0) {
      // 最寄り敵の相対方位を -1(左)〜1(右) のパンに変換して定位させる
      const pan = nearest
        ? Math.sin(normAngle(Math.atan2(nearest.y - g.player.y, nearest.x - g.player.x) - g.player.angle))
        : 0;
      AudioService.playSpatial('enemy', Math.max(0.05, 0.45 * (1 - closestEnemy / 10)), pan);
      g.timers.enemySound = 400;
    }
    if (closestEnemy < 6 && g.timers.heartbeat <= 0) {
      AudioService.play('heartbeat', Math.max(0.08, 0.35 * (1 - closestEnemy / 6)));
      g.timers.heartbeat = Math.max(280, 750 * (closestEnemy / 6));
    }
  },
```

- [ ] **Step 4: game-tick.ts を実装する**

```typescript
// import に追加
import { tryThrowStone, updateStoneProjectiles } from './domain/services/stone';

// TickInput に追加
  readonly throwStone: boolean;

// 追加の公開型
/** 敵の状態変化アラート（索敵UIマーカーの元データ） */
export interface EnemyAlert {
  readonly kind: 'spotted' | 'searching';
  readonly x: number;
  readonly y: number;
}

// TickResult に追加
  readonly alerts: readonly EnemyAlert[];
```

`advanceGame` の敵更新まわり（`GameLogic.updateItems(g);` の後〜 return 部）を変更:

```typescript
  // 石: 投擲入力 → 飛行更新 → 着地音（音源はこのフレームの敵更新に渡す）
  if (input.throwStone && tryThrowStone(g)) {
    AudioService.play('stoneThrow', 0.3);
  }
  const noise = updateStoneProjectiles(g, dt);
  if (noise) AudioService.play('stoneLand', 0.35);

  const exitResult = GameLogic.checkExit(g);
  if (exitResult === 'victory') {
    return { status: 'victory', closestEnemy: Infinity, moved, alerts: [] };
  }

  const enemyResult = GameLogic.updateEnemies(g, dt, noise);
  if (g.lives <= 0) {
    return { status: 'gameover', closestEnemy: enemyResult.closest, moved, alerts: enemyResult.alerts };
  }

  GameLogic.updateSounds(g, enemyResult.closest, dt, enemyResult.nearest);
  AudioService.updateBGM(Math.max(0, 1 - enemyResult.closest / 8));

  return { status: 'playing', closestEnemy: enemyResult.closest, moved, alerts: enemyResult.alerts };
```

timeout の早期 return にも `alerts: []` を追加。

- [ ] **Step 5: 既存テストのパリティを修正して全テストを通す**

Run: `npx jest src/features/labyrinth-of-shadows --silent`

想定される修正:
- `game-tick.test.ts` / `game-logic.test.ts` の `TickInput` リテラルに `throwStone: false` 追記
- 旧 CHASE_RANGE 前提のアサーション（「距離内で追跡開始」）→ 視線前提に書き換え、または削除して Task 3 のテストに委譲
- `updateEnemies` の戻り値が number → object になった箇所の追従

Expected: PASS（全 suite）

- [ ] **Step 6: コミット**

```bash
git add src/features/labyrinth-of-shadows/
git commit -m "feat: 石投げ・視線AI・速度キャップをゲームループに統合"
```

---

### Task 7: 索敵UI・HUD・投擲入力の配線（presentation 層）

**Files:**
- Create: `src/features/labyrinth-of-shadows/components/EnemyIndicators.tsx`
- Create: `src/features/labyrinth-of-shadows/presentation/three/StoneMeshes.tsx`
- Modify: `src/features/labyrinth-of-shadows/types.ts`（HUDData に stones）
- Modify: `src/features/labyrinth-of-shadows/components/HUD.tsx`
- Modify: `src/features/labyrinth-of-shadows/presentation/three/GameController.tsx`
- Modify: `src/features/labyrinth-of-shadows/presentation/three/LabyrinthScene.tsx`
- Modify: `src/features/labyrinth-of-shadows/LabyrinthOfShadowsGame.tsx`
- Test: `src/features/labyrinth-of-shadows/__tests__/enemy-indicators.test.tsx`

**Interfaces:**
- Consumes: `TickResult.alerts`（Task 6）、`GameState.stones/stoneProjectiles`
- Produces:
  - `interface AlertMarker { readonly id: number; readonly kind: 'spotted' | 'searching'; readonly angle: number; }`（EnemyIndicators.tsx から export）
  - `GameControllerProps` に追加: `throwRef: React.MutableRefObject<boolean>; onAlert: (marker: AlertMarker) => void;`
  - `LabyrinthSceneProps` にも同2つを追加（素通しで GameController へ）
  - `HUDData` に追加: `stones: number;`

- [ ] **Step 1: EnemyIndicators の失敗するテストを書く**

```typescript
// src/features/labyrinth-of-shadows/__tests__/enemy-indicators.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyIndicators } from '../components/EnemyIndicators';

describe('EnemyIndicators', () => {
  it('spotted マーカーは "!" を赤系で表示する', () => {
    render(<EnemyIndicators markers={[{ id: 1, kind: 'spotted', angle: 0 }]} />);
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('searching マーカーは "?" を表示する', () => {
    render(<EnemyIndicators markers={[{ id: 2, kind: 'searching', angle: 1 }]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('相対角度に応じて水平位置が変わる（右手方向は右側）', () => {
    render(
      <EnemyIndicators
        markers={[
          { id: 1, kind: 'spotted', angle: -Math.PI / 2 },
          { id: 2, kind: 'searching', angle: Math.PI / 2 },
        ]}
      />
    );
    const left = screen.getByText('!');
    const right = screen.getByText('?');
    expect(parseFloat(left.style.left)).toBeLessThan(parseFloat(right.style.left));
  });

  it('マーカーがなければ何も描画しない', () => {
    const { container } = render(<EnemyIndicators markers={[]} />);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/enemy-indicators.test.tsx --silent`
Expected: FAIL（モジュールなし）

- [ ] **Step 3: EnemyIndicators を実装する**

```tsx
// src/features/labyrinth-of-shadows/components/EnemyIndicators.tsx
import React from 'react';
import { clamp } from '../utils';

/** 索敵マーカー。angle はプレイヤー正面を0とした相対角（ラジアン、右が正） */
export interface AlertMarker {
  readonly id: number;
  readonly kind: 'spotted' | 'searching';
  readonly angle: number;
}

interface EnemyIndicatorsProps {
  markers: readonly AlertMarker[];
}

/** 敵の状態変化（発見=!/捜索=?）を画面端に方向付きで表示するオーバーレイ */
export const EnemyIndicators: React.FC<EnemyIndicatorsProps> = ({ markers }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
    {markers.map(m => {
      // 相対角 -π..π を画面の水平位置 6%..94% に写像（正面=中央、真横=端）
      const ratio = clamp(m.angle / Math.PI, -1, 1);
      const isSpotted = m.kind === 'spotted';
      return (
        <span
          key={m.id}
          style={{
            position: 'absolute',
            top: '16%',
            left: `${50 + ratio * 44}%`,
            transform: 'translateX(-50%)',
            fontSize: '2.2rem',
            fontWeight: 'bold',
            color: isSpotted ? '#ef4444' : '#facc15',
            textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px currentColor',
          }}
          aria-label={isSpotted ? '敵に発見された' : '敵が捜索中'}
        >
          {isSpotted ? '!' : '?'}
        </span>
      );
    })}
  </div>
);
```

Run: `npx jest src/features/labyrinth-of-shadows/__tests__/enemy-indicators.test.tsx --silent`
Expected: PASS

- [ ] **Step 4: HUD に石の残数を追加する**

`types.ts` の `HUDData` に `stones: number;` を追加。

`HUD.tsx` の左側 `HUDGroup`（スタミナパネルの後）に追加:

```tsx
      <HUDPanel $borderColor="#78716c">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🪨</span>
          <span style={{ color: '#d6d3d1', fontWeight: 'bold' }}>{h.stones}</span>
        </div>
      </HUDPanel>
```

`GameController.tsx` の `hudEqual` に `a.stones === b.stones` を追加し、`newHud` に `stones: g.stones` を追加。`LabyrinthOfShadowsGame.tsx` の初期 `hud` state に `stones: 3` を追加。

- [ ] **Step 5: 投擲入力とアラートを配線する**

`GameController.tsx`:

```typescript
// GameControllerProps に追加
  throwRef: React.MutableRefObject<boolean>;
  onAlert: (marker: AlertMarker) => void;

// readInput を変更（throwRef を消費するため useFrame 内で合成）
const input: TickInput = { ...readInput(keysRef.current ?? {}), throwStone: throwRef.current };
throwRef.current = false;
const result = advanceGame(g, dt, input);

// advanceGame 後: アラートをプレイヤー相対角に変換して通知
const alertIdRef = useRef(0);
for (const a of result.alerts) {
  const angle = normAngle(Math.atan2(a.y - g.player.y, a.x - g.player.x) - g.player.angle);
  onAlert({ id: ++alertIdRef.current, kind: a.kind, angle });
}
```

（`normAngle` は `../../utils` から、`AlertMarker` は `../../components/EnemyIndicators` から import。`useRef` はコンポーネントトップレベルで宣言する。）

`LabyrinthScene.tsx`: `LabyrinthSceneProps` に `throwRef` / `onAlert` を追加し `<GameController {...props} lookRef={lookRef} />` で素通し。ポインタロック中の左クリックを投擲として拾う useEffect を追加:

```typescript
  // ポインタロック中の左クリック = 石を投げる（非ロック時のクリックはロック要求に使われる）
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) props.throwRef.current = true;
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [props.throwRef]);
```

`LabyrinthOfShadowsGame.tsx`:

```typescript
  const throwRef = useRef(false);
  const [alertMarkers, setAlertMarkers] = useState<AlertMarker[]>([]);

  // マーカーは2秒で自動消滅
  const onAlert = useCallback((marker: AlertMarker) => {
    setAlertMarkers(prev => [...prev, marker]);
    setTimeout(() => {
      setAlertMarkers(prev => prev.filter(m => m.id !== marker.id));
    }, 2000);
  }, []);
```

`<LabyrinthScene ... throwRef={throwRef} onAlert={onAlert} />` を渡し、`<HUD h={hud} />` の直後に `<EnemyIndicators markers={alertMarkers} />` を追加（`PageContainer` が `position: static` の場合は `game.styles.ts` で `position: relative` を付与する）。

- [ ] **Step 6: 飛んでいる石の3Dメッシュを追加する**

小石アイテム（拾う方）は `ItemMeshes` が `CONTENT.items.stone.color` で自動描画するため対応不要。飛行中の石のみ新規:

```tsx
// src/features/labyrinth-of-shadows/presentation/three/StoneMeshes.tsx
/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState } from '../../types';
import { GAME_BALANCE } from '../../domain/constants';

const THROW_HEIGHT = 0.9;

/** 飛行中の石を描画する。最大同時数ぶんのメッシュを使い回し、毎フレーム位置だけ更新する */
export function StoneMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const slots = GAME_BALANCE.stone.MAX_COUNT;

  useFrame(() => {
    const projectiles = gameRef.current?.stoneProjectiles ?? [];
    for (let i = 0; i < slots; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const p = projectiles[i];
      mesh.visible = !!p;
      if (p) {
        // 放物線風に僅かに沈ませる（演出のみ、当たり判定はドメイン側）
        const drop = (p.traveled / GAME_BALANCE.stone.THROW_RANGE) * 0.4;
        mesh.position.set(p.x, THROW_HEIGHT - drop, p.y);
      }
    }
  });

  return (
    <>
      {Array.from({ length: slots }).map((_, i) => (
        <mesh
          key={i}
          ref={el => {
            meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#c0b8a8" />
        </mesh>
      ))}
    </>
  );
}
```

`LabyrinthScene.tsx` の `<EnemyMeshes gameRef={gameRef} />` の後に `<StoneMeshes gameRef={gameRef} />` を追加。

- [ ] **Step 7: 全テスト・型・lint を確認する**

Run: `npx jest src/features/labyrinth-of-shadows --silent && npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 8: コミット**

```bash
git add src/features/labyrinth-of-shadows/
git commit -m "feat: 索敵UI（!/?マーカー）・石投げ入力・HUD残数・飛翔メッシュを追加"
```

---

### Task 8: 最終検証と仕上げ

**Files:**
- Modify: `src/features/labyrinth-of-shadows/README.md`（Phase 2 の仕様追記）

- [ ] **Step 1: README に Phase 2 の仕様を追記する**

「敵AI」節（相当箇所）に以下の要点を日本語で追記: 視野角±60°＋壁遮蔽の視線モデル、patrol→chase→search の状態機械、隠れ場所は視線切り連動、石投げ（左クリック・初期3/最大5）、敵速度キャップ（プレイヤーの0.9倍）。

- [ ] **Step 2: CI パイプライン全体を実行する**

Run: `npm run ci`
Expected: lint:ci → typecheck → test → build 全て PASS。失敗したら修正（`.claude/worktrees/agent-*` の迷子 worktree があると Jest が汚染される既知問題に注意 — `git worktree list` で確認し `git worktree remove` で除去）。

- [ ] **Step 3: 実機確認（可能な範囲で）**

`npm start` で開発サーバーを起動し（初回ビルド約330秒・watch が変更を拾わない場合は再起動）、Playwright MCP でスモーク確認:
- ゲーム開始 → 3D 描画・HUD に 🪨3 表示
- コンソールにエラーがないこと

ポインタロック（クリック投擲・マウスルック）はヘッドレスで動作しないため、**ユーザーへ実機確認を依頼する**: 石投げ、! / ? マーカー、視線切り逃走、隠れ場所の新ルール。

- [ ] **Step 4: コミットして PR 準備**

```bash
git add -A && git commit -m "docs: README に Phase 2（逃走の駆け引き）の仕様を追記"
git push -u origin feature/labyrinth-of-shadows-phase2-escape
```

PR タイトル: `feat: Labyrinth of Shadows Phase 2 逃走の駆け引き再設計`
本文はリポジトリの PR 規約（概要/変更内容/テスト方法）に従う。

---

## Self-Review 済み確認事項

- spec の全セクション（状態機械/vision/石/索敵UI/バランス/配置/テスト）にタスクが対応している
- 速度キャップは `capEnemySpeed`（game-logic）で一元適用。Chaser の近距離加速（CLOSE_RANGE_*）は削除
- 隠れ場所ルールは `canSeePlayer` の `isPlayerHiding` 一括 false 化＋「lastSeen へ向かい捜索」の組み合わせで spec の挙動（視認中に隠れる→目撃地点に敵が来る）を実現する
- `CHASE_RANGE` の後継は難易度別 `sightRange`。`CONFIG.enemy.chaseRange`（constants.ts 側）は未使用のままなら削除してよい
- Teleporter のテレポート発動条件（cooldown && !hiding）は現状維持（スコープ外）
