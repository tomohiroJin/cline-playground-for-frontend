# IPNE 敵AIロジック責務分割 実装計画（Phase A）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `enemyAiFunctions.ts`（600行）を責務単位の6ファイル＋`behaviors/`4ファイルへ分割し、方向計算のコピペ5箇所を `calculateStep()` に集約する（振る舞い不変）。

**Architecture:** `enemyAiFunctions.ts` を re-export barrel として残し、実装を新ファイル群へ移動する。内側（`aiGeometry`/`aiRandom`）から外側（`enemyOrchestrator`）の順に作る。既存テスト群（`enemyAiFunctions.test.ts` / `enemyAI.test.ts` / `enemyAttackAnim.test.ts`）が全工程で緑のままであることが振る舞い不変の証明となる。

**Tech Stack:** TypeScript, Jest (SWC), 純粋関数によるドメインロジック。

**設計の出典:** `docs/superpowers/specs/2026-06-14-ipne-enemyai-refactoring-design.md`

---

## 公開 API（barrel で完全維持すべき24エクスポート）

分割後も `enemyAiFunctions.ts` から以下が**同名・同シグネチャ**で export され続けること。これが Definition of Done の中核。

```
setRandomProvider, resetRandomProvider,
canEnemyAttack, setEnemyAttackCooldown,
detectPlayer, shouldChase, shouldStopChase,
moveEnemyTowards, generatePatrolPath, getNextPatrolPoint,
updatePatrolEnemy, updateChargeEnemy, updateRangedEnemy, updateFleeEnemy,
getDirectPathToPlayer, calculateFleeDirection,
updateEnemyAI, updateEnemies, updateEnemiesWithContact,
ENEMY_ATTACK_ANIM_DURATION, markEnemyAttacking, resolveEnemyAttackState,
AI_CONFIG,
type EnemyUpdateResult
```

**barrel で再公開しない（内部共有のみ）**: `getManhattanDistance`, `calculateStep`,
`defaultRandom`, `stepTowards`, `stepAway`, `stepRandom`, `attemptLunge`,
`moveEnemyAway`, `moveEnemyRandom`, `resolveKnockbackState`, `toPositionKey`,
`RANGED_PREFERRED_DISTANCE`。これらは元々 private なので公開してはならない。

## ディレクトリ構成（最終形）

すべて `src/features/ipne/domain/policies/enemyAi/` 配下。

```
enemyAi/
  enemyAiFunctions.ts        # barrel（Task 8 で純粋 re-export 化）
  aiRandom.ts                # Task 2
  aiGeometry.ts              # Task 1
  enemyMovement.ts           # Task 3
  attackState.ts             # Task 4
  enemyOrchestrator.ts       # Task 7
  behaviors/
    patrolBehavior.ts        # Task 5
    chargeBehavior.ts        # Task 5
    rangedBehavior.ts        # Task 6
    fleeBehavior.ts          # Task 6
  # 既存・無修正: EnemyAiPolicyRegistry.ts, policies.ts, types.ts
```

**import パス規約:**
- `enemyAi/` 直下のファイル → `../../types`, `../../services/collisionService`, `../../config/gameBalance`, `../../ports`
- `enemyAi/behaviors/` 配下のファイル → `../../../types` 等（1階層深い）。兄弟 enemyAi モジュールは `../aiGeometry` 等

---

## Task 0: ベースライン確認

**Files:** なし（確認のみ）

- [ ] **Step 1: 現ブランチと作業ディレクトリを確認**

Run: `git branch --show-current && pwd`
Expected: `refactor/ipne-enemyai-split` / `/workspaces/claym/local/cline-playground-for-frontend`

- [ ] **Step 2: 対象テストがすべて緑であることを確認（安全網の起点）**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -20`
Expected: PASS（`enemyAiFunctions.test.ts` / `EnemyAiPolicyRegistry.test.ts` / `enemyAI.test.ts` / `enemyAttackAnim.test.ts` 全件 green）

- [ ] **Step 3: 型チェックのベースライン**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし（exit 0）

---

## Task 1: `aiGeometry.ts` を作成（calculateStep を TDD で新設＋幾何/検知を移動）

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/aiGeometry.ts`
- Create: `src/features/ipne/domain/policies/enemyAi/aiGeometry.test.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`（該当関数を削除し re-export 追加）

移動する要素: `getManhattanDistance`(private), `AI_CONFIG`, `detectPlayer`, `shouldChase`,
`shouldStopChase`, `calculateFleeDirection`, `getDirectPathToPlayer`。
新設: `calculateStep`。`calculateFleeDirection` と `getDirectPathToPlayer` は `calculateStep` を使う形に書き換える。

- [ ] **Step 1: `calculateStep` の失敗テストを書く**

Create `aiGeometry.test.ts`:

```typescript
import { calculateStep, calculateFleeDirection, getDirectPathToPlayer } from './aiGeometry';
import { createPatrolEnemy } from '../../entities/enemy';

const mockIdGen = {
  generateEnemyId: () => 'e1',
  generateTrapId: () => 't1',
  generateItemId: () => 'i1',
  generateFeedbackId: () => 'f1',
};

describe('aiGeometry', () => {
  describe('calculateStep', () => {
    it('各軸の単位ステップ（-1/0/+1）を返す', () => {
      expect(calculateStep({ x: 2, y: 2 }, { x: 5, y: 1 })).toEqual({ stepX: 1, stepY: -1 });
    });
    it('同一座標では 0 を返す', () => {
      expect(calculateStep({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual({ stepX: 0, stepY: 0 });
    });
    it('負方向では -1 を返す', () => {
      expect(calculateStep({ x: 5, y: 5 }, { x: 1, y: 1 })).toEqual({ stepX: -1, stepY: -1 });
    });
  });

  describe('calculateFleeDirection', () => {
    it('プレイヤーと反対方向の隣接マスを返す', () => {
      const enemy = createPatrolEnemy(3, 3, mockIdGen);
      // プレイヤーが左(x=2)にいるので敵は右(x=4)へ逃げる
      expect(calculateFleeDirection(enemy, { x: 2, y: 3 })).toEqual({ x: 4, y: 3 });
    });
  });

  describe('getDirectPathToPlayer', () => {
    it('敵からプレイヤーへの直線パスを返す', () => {
      const enemy = createPatrolEnemy(1, 1, mockIdGen);
      const path = getDirectPathToPlayer(enemy, { x: 3, y: 1 });
      expect(path).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }]);
    });
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- aiGeometry 2>&1 | tail -15`
Expected: FAIL（`Cannot find module './aiGeometry'`）

- [ ] **Step 3: `aiGeometry.ts` を実装**

Create `aiGeometry.ts`:

```typescript
/**
 * 敵AIの幾何計算・検知判定
 *
 * 座標計算（方向ステップ・距離）とプレイヤー検知・追跡継続判定を提供する。
 * 純粋関数のみ（マップ衝突や乱数には依存しない）。
 */
import { Enemy, Position } from '../../types';
import { GAME_BALANCE } from '../../config/gameBalance';

/** AI の検知・追跡・攻撃に関する時間定数 */
export const AI_CONFIG = {
  updateInterval: GAME_BALANCE.enemyAi.updateIntervalMs,
  chaseTimeout: GAME_BALANCE.enemyAi.chaseTimeoutMs,
  attackCooldown: GAME_BALANCE.enemyAi.attackCooldownMs,
} as const;

/** マンハッタン距離（barrel では非公開。モジュール間共有用） */
export const getManhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * 2点間の各軸の単位ステップ（-1 / 0 / +1）を返す。
 * 座標は整数のため Math.sign は従来の `d>0?1:-1`（0→0）と挙動が一致する。
 */
export const calculateStep = (
  from: Position,
  to: Position
): { stepX: number; stepY: number } => ({
  stepX: Math.sign(to.x - from.x),
  stepY: Math.sign(to.y - from.y),
});

/** プレイヤーが検知範囲内か */
export const detectPlayer = (enemy: Enemy, player: Position): boolean =>
  getManhattanDistance(enemy, player) <= enemy.detectionRange;

/** 追跡を開始すべきか */
export const shouldChase = (enemy: Enemy, player: Position): boolean => {
  if (!detectPlayer(enemy, player)) return false;
  if (enemy.chaseRange === undefined) return true;
  return getManhattanDistance(enemy, player) <= enemy.chaseRange;
};

/** 追跡を中断すべきか */
export const shouldStopChase = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.chaseRange !== undefined && getManhattanDistance(enemy, player) > enemy.chaseRange) {
    return true;
  }
  if (enemy.lastSeenAt !== undefined && currentTime - enemy.lastSeenAt > AI_CONFIG.chaseTimeout) {
    return true;
  }
  return false;
};

/** プレイヤーと反対方向の隣接マス（逃走方向） */
export const calculateFleeDirection = (enemy: Enemy, player: Position): Position => {
  const { stepX, stepY } = calculateStep(player, enemy);
  return { x: enemy.x + stepX, y: enemy.y + stepY };
};

/** 敵からプレイヤーへの直線パス（L字: 先に横、次に縦） */
export const getDirectPathToPlayer = (enemy: Enemy, player: Position): Position[] => {
  const { stepX, stepY } = calculateStep(enemy, player);
  const path: Position[] = [];
  let currentX = enemy.x;
  let currentY = enemy.y;
  while (currentX !== player.x) {
    currentX += stepX;
    path.push({ x: currentX, y: currentY });
  }
  while (currentY !== player.y) {
    currentY += stepY;
    path.push({ x: currentX, y: currentY });
  }
  return path;
};
```

- [ ] **Step 4: `aiGeometry.test.ts` が通ることを確認**

Run: `npm test -- aiGeometry 2>&1 | tail -15`
Expected: PASS

- [ ] **Step 5: `enemyAiFunctions.ts` から移動済み関数を削除し re-export に置換**

`enemyAiFunctions.ts` で以下を実施:
1. 削除する定義: `getManhattanDistance`(51-53行), `AI_CONFIG`(45-49行), `detectPlayer`(69-72行), `shouldChase`(74-78行), `shouldStopChase`(80-88行), `getDirectPathToPlayer`(323-344行), `calculateFleeDirection`(346-353行), 末尾の `export { AI_CONFIG };`(600行)。
2. ファイル冒頭の import 群の直後に以下を追加:

```typescript
import {
  AI_CONFIG,
  getManhattanDistance,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  calculateFleeDirection,
  getDirectPathToPlayer,
} from './aiGeometry';

// 公開 API（barrel）として再公開
export { AI_CONFIG, detectPlayer, shouldChase, shouldStopChase, calculateFleeDirection, getDirectPathToPlayer };
```

> 注: `getManhattanDistance` は import するが **re-export しない**（元々 private）。
> このファイル内に残る関数（`canEnemyAttack` 等）がまだ `getManhattanDistance` / `AI_CONFIG` を
> 参照しているため、import は必要。

- [ ] **Step 6: 既存テストが緑のままであることを確認（振る舞い不変の証明）**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（全件）

- [ ] **Step 7: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし

- [ ] **Step 8: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/aiGeometry.ts \
        src/features/ipne/domain/policies/enemyAi/aiGeometry.test.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵AIの幾何・検知判定を aiGeometry へ分離

- calculateStep を新設し方向計算の重複を解消する起点を用意
- detectPlayer/shouldChase/shouldStopChase/calculateFleeDirection/getDirectPathToPlayer を移動
- enemyAiFunctions.ts は barrel として後方互換を維持"
```

---

## Task 2: `aiRandom.ts` を作成（乱数プロバイダ DI を移動）

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/aiRandom.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: `defaultRandom`(private), `_random`(private state), `setRandomProvider`(public),
`resetRandomProvider`(public)。`_random` は他モジュールから参照するため getter を設ける。

- [ ] **Step 1: `aiRandom.ts` を実装**

Create `aiRandom.ts`:

```typescript
/**
 * 敵AIの乱数プロバイダ管理
 *
 * テスト時に setRandomProvider で決定的な乱数へ差し替えられる。
 * NOTE: モジュールレベルの可変状態は既知の負債（spec §6）。Phase A では現状維持。
 */
import { RandomProvider } from '../../ports';

/** デフォルトの乱数プロバイダー（Math.random ベース） */
export const defaultRandom: RandomProvider = {
  random: () => Math.random(),
  randomInt: (min, max) => min + Math.floor(Math.random() * (max - min)),
  pick: (array) => array[Math.floor(Math.random() * array.length)],
  shuffle: (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};

let _random: RandomProvider = defaultRandom;

/** 現在の乱数プロバイダーを取得する（モジュール間共有用） */
export const getRandom = (): RandomProvider => _random;

/** 乱数プロバイダーを設定する（テスト用） */
export function setRandomProvider(random: RandomProvider): void {
  _random = random;
}

/** 乱数プロバイダーをデフォルトにリセットする */
export function resetRandomProvider(): void {
  _random = defaultRandom;
}
```

- [ ] **Step 2: `enemyAiFunctions.ts` から乱数定義を削除し re-export に置換**

`enemyAiFunctions.ts` で以下を実施:
1. 削除: `defaultRandom`(13-26行), `let _random...`(28-29行), `setRandomProvider`(31-36行), `resetRandomProvider`(38-43行)。
2. import 群に追加し再公開:

```typescript
import { getRandom, setRandomProvider, resetRandomProvider } from './aiRandom';

export { setRandomProvider, resetRandomProvider };
```

3. このファイル内に残る `_random.random()` / `_random.shuffle()` などの参照を **`getRandom()`** 経由に置換する（`attemptLunge`, `stepRandom`, `generatePatrolPath` 内。例: `_random.random()` → `getRandom().random()`）。

> 注: `defaultRandom` は re-export しない（元々 private）。

- [ ] **Step 3: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（特に乱数差し替えに依存するテストが通ること）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/aiRandom.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵AIの乱数プロバイダを aiRandom へ分離

- defaultRandom/setRandomProvider/resetRandomProvider を移動
- モジュール間共有は getRandom() 経由に統一
- グローバル可変状態の DI 化は別フェーズの課題として spec に記録済み"
```

---

## Task 3: `enemyMovement.ts` を作成（移動エンジンを移動・calculateStep 適用）

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/enemyMovement.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: `stepTowards`, `stepAway`, `stepRandom`, `attemptLunge`（全 private）,
`moveEnemyTowards`(public), `moveEnemyAway`, `moveEnemyRandom`（private）,
`generatePatrolPath`(public), `getNextPatrolPoint`(public)。
`stepTowards` / `stepAway` / `attemptLunge` の方向計算を `calculateStep` に置換する。

- [ ] **Step 1: `enemyMovement.ts` を実装**

Create `enemyMovement.ts`:

```typescript
/**
 * 敵の移動エンジン
 *
 * マップ衝突（collisionService）を考慮した1ステップ移動と巡回パス生成を提供する。
 * 方向計算は aiGeometry.calculateStep に集約。
 */
import { Enemy, GameMap, Position } from '../../types';
import { canMove } from '../../services/collisionService';
import { calculateStep, getManhattanDistance } from './aiGeometry';
import { getRandom } from './aiRandom';

/** ターゲットへ1歩近づく（横優先/縦優先を距離差で決定、塞がれたら停止） */
const stepTowards = (enemy: Enemy, target: Position, map: GameMap): Position => {
  const { stepX, stepY } = calculateStep(enemy, target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const tryHorizontal = Math.abs(dx) >= Math.abs(dy);

  const candidates: Position[] = tryHorizontal
    ? [
        { x: enemy.x + stepX, y: enemy.y },
        { x: enemy.x, y: enemy.y + stepY },
      ]
    : [
        { x: enemy.x, y: enemy.y + stepY },
        { x: enemy.x + stepX, y: enemy.y },
      ];

  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

/** プレイヤーから1歩離れる（4方向を順に試行） */
const stepAway = (enemy: Enemy, player: Position, map: GameMap): Position => {
  const { stepX, stepY } = calculateStep(player, enemy);
  const candidates: Position[] = [
    { x: enemy.x + stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y + stepY },
    { x: enemy.x - stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y - stepY },
  ];
  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

/** 突進（最大距離内かつ確率成立時、2マス先まで一気に移動） */
const attemptLunge = (
  enemy: Enemy,
  target: Position,
  map: GameMap,
  maxDistance: number,
  chance: number
): Enemy | null => {
  const distance = getManhattanDistance(enemy, target);
  if (distance > maxDistance) return null;
  if (getRandom().random() > chance) return null;

  const { stepX, stepY } = calculateStep(enemy, target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const preferHorizontal = Math.abs(dx) >= Math.abs(dy);

  const firstStep = preferHorizontal
    ? { x: enemy.x + stepX, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY };
  const secondStep = preferHorizontal
    ? { x: enemy.x + stepX * 2, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY * 2 };

  if (!canMove(map, firstStep.x, firstStep.y)) return null;
  if (!canMove(map, secondStep.x, secondStep.y)) return null;
  return { ...enemy, x: secondStep.x, y: secondStep.y };
};

/** ランダムな方向に1歩移動 */
const stepRandom = (enemy: Enemy, map: GameMap): Position => {
  const directions = [
    { x: enemy.x + 1, y: enemy.y },
    { x: enemy.x - 1, y: enemy.y },
    { x: enemy.x, y: enemy.y + 1 },
    { x: enemy.x, y: enemy.y - 1 },
  ];
  const shuffled = getRandom().shuffle(directions);
  for (const pos of shuffled) {
    if (canMove(map, pos.x, pos.y)) return pos;
  }
  return { x: enemy.x, y: enemy.y };
};

export const moveEnemyTowards = (enemy: Enemy, target: Position, map: GameMap): Enemy => {
  const next = stepTowards(enemy, target, map);
  return { ...enemy, x: next.x, y: next.y };
};

export const moveEnemyAway = (enemy: Enemy, player: Position, map: GameMap): Enemy => {
  const next = stepAway(enemy, player, map);
  return { ...enemy, x: next.x, y: next.y };
};

export const moveEnemyRandom = (enemy: Enemy, map: GameMap): Enemy => {
  const next = stepRandom(enemy, map);
  return { ...enemy, x: next.x, y: next.y };
};

export { attemptLunge };

/** 巡回パスを生成する（往路＋復路、長さ4-8マス） */
export const generatePatrolPath = (origin: Position): Position[] => {
  const length = getRandom().randomInt(4, 9); // 4-8
  const horizontal = getRandom().random() > 0.5;
  const path: Position[] = [];
  for (let i = 0; i < length; i++) {
    path.push({
      x: origin.x + (horizontal ? i : 0),
      y: origin.y + (horizontal ? 0 : i),
    });
  }
  const back = [...path].reverse().slice(1);
  return [...path, ...back];
};

/** 次の巡回ポイントを取得する */
export const getNextPatrolPoint = (enemy: Enemy): Position | undefined => {
  if (!enemy.patrolPath || enemy.patrolPath.length === 0) return undefined;
  const index = enemy.patrolIndex ?? 0;
  return enemy.patrolPath[index];
};
```

- [ ] **Step 2: `enemyAiFunctions.ts` から移動定義を削除し re-export に置換**

`enemyAiFunctions.ts` で以下を実施:
1. 削除: `stepTowards`(90-115行), `stepAway`(117-137行), `attemptLunge`(139-167行), `stepRandom`(169-188行), `moveEnemyTowards`(190-193行), `moveEnemyAway`(195-198行), `moveEnemyRandom`(200-203行), `generatePatrolPath`(205-219行), `getNextPatrolPoint`(221-225行)。
   ※行番号は Task 1/2 の削除でずれているため、関数名で特定すること。
2. import 群に追加し再公開:

```typescript
import {
  moveEnemyTowards,
  moveEnemyAway,
  moveEnemyRandom,
  attemptLunge,
  generatePatrolPath,
  getNextPatrolPoint,
} from './enemyMovement';

export { moveEnemyTowards, generatePatrolPath, getNextPatrolPoint };
```

> 注: `moveEnemyAway` / `moveEnemyRandom` / `attemptLunge` は import するが re-export しない（元々 private）。
> これらは残存する `updatePatrolEnemy` 等がまだ参照するため import が必要。
> Task 2 で導入した `getRandom` の import は、このファイルから乱数を直接使う箇所が無くなれば削除する（lint で検出）。

- [ ] **Step 3: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（特に `enemyAI.test.ts` の「巡回移動がパスに沿って進むこと」「標本型移動がプレイヤーから離れること」）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/enemyMovement.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵の移動エンジンを enemyMovement へ分離

- step/move 系・突進・巡回パス生成を移動
- 方向計算を calculateStep に集約しコピペを解消
- moveEnemyTowards/generatePatrolPath/getNextPatrolPoint は barrel 維持"
```

---

## Task 4: `attackState.ts` を作成（攻撃・ノックバック状態を移動）

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/attackState.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: `canEnemyAttack`(public), `setEnemyAttackCooldown`(public),
`ENEMY_ATTACK_ANIM_DURATION`(public), `markEnemyAttacking`(public),
`resolveEnemyAttackState`(public), `resolveKnockbackState`(private)。

- [ ] **Step 1: `attackState.ts` を実装**

Create `attackState.ts`:

```typescript
/**
 * 敵の攻撃可否・攻撃/ノックバックアニメーション状態の解決
 */
import { Enemy, EnemyState, EnemyType, Position } from '../../types';
import { GAME_BALANCE } from '../../config/gameBalance';
import { AI_CONFIG, getManhattanDistance } from './aiGeometry';

/** 敵攻撃アニメーションの持続時間（ms） */
export const ENEMY_ATTACK_ANIM_DURATION = GAME_BALANCE.enemyAi.attackAnimDurationMs;

/** 敵が攻撃可能かどうか */
export const canEnemyAttack = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.attackRange <= 0) return false;
  if (currentTime < enemy.attackCooldownUntil) return false;
  return getManhattanDistance(enemy, player) <= enemy.attackRange;
};

/** 敵の攻撃クールダウンを設定 */
export const setEnemyAttackCooldown = (enemy: Enemy, currentTime: number): Enemy => {
  const cooldown =
    enemy.type === EnemyType.BOSS
      ? GAME_BALANCE.enemyAi.bossAttackCooldownMs
      : AI_CONFIG.attackCooldown;
  return { ...enemy, attackCooldownUntil: currentTime + cooldown };
};

/**
 * 敵を攻撃状態にマークする
 * knockback 状態の敵には適用しない
 */
export const markEnemyAttacking = (enemy: Enemy, now: number): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;
  return {
    ...enemy,
    state: EnemyState.ATTACK,
    attackAnimUntil: now + ENEMY_ATTACK_ANIM_DURATION,
  };
};

/**
 * 敵の攻撃アニメーション状態を解決する
 * 持続時間経過後に IDLE 状態に戻す
 */
export const resolveEnemyAttackState = (enemy: Enemy, now: number): Enemy => {
  if (enemy.state !== EnemyState.ATTACK) return enemy;
  if (enemy.attackAnimUntil === undefined) return { ...enemy, state: EnemyState.IDLE };
  if (now < enemy.attackAnimUntil) return enemy;
  return { ...enemy, state: EnemyState.IDLE, attackAnimUntil: undefined };
};

/** ノックバック状態を解決する（持続時間経過後に IDLE へ） */
export const resolveKnockbackState = (enemy: Enemy, currentTime: number): Enemy => {
  if (enemy.state !== EnemyState.KNOCKBACK) return enemy;
  if (enemy.knockbackUntil === undefined) return { ...enemy, state: EnemyState.IDLE };
  if (currentTime < enemy.knockbackUntil) return enemy;
  return { ...enemy, state: EnemyState.IDLE, knockbackDirection: undefined, knockbackUntil: undefined };
};
```

- [ ] **Step 2: `enemyAiFunctions.ts` から移動定義を削除し re-export に置換**

`enemyAiFunctions.ts` で以下を実施（関数名で特定）:
1. 削除: `canEnemyAttack`, `setEnemyAttackCooldown`, `ENEMY_ATTACK_ANIM_DURATION`, `markEnemyAttacking`, `resolveEnemyAttackState`, `resolveKnockbackState`。
2. import 群に追加し再公開:

```typescript
import {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
  resolveKnockbackState,
} from './attackState';

export {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
};
```

> 注: `resolveKnockbackState` は import するが re-export しない（元々 private、`updateEnemyAI` が使用）。

- [ ] **Step 3: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（特に `enemyAttackAnim.test.ts` と `markEnemyAttacking`/`resolveEnemyAttackState`/`AI_CONFIG` テスト）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/attackState.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵の攻撃・ノックバック状態解決を attackState へ分離"
```

---

## Task 5: `behaviors/patrolBehavior.ts` と `behaviors/chargeBehavior.ts` を作成

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/behaviors/patrolBehavior.ts`
- Create: `src/features/ipne/domain/policies/enemyAi/behaviors/chargeBehavior.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: `updatePatrolEnemy`(public), `updateChargeEnemy`(public)。本体は現状を**逐語移動**し、
依存関数を新モジュールから import するだけ（ロジック不変）。

- [ ] **Step 1: `patrolBehavior.ts` を実装**

Create `behaviors/patrolBehavior.ts`（`updatePatrolEnemy` の本体は `enemyAiFunctions.ts` 227-284行を逐語移動）:

```typescript
/** PATROL 型敵のAI更新 */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { detectPlayer, shouldStopChase } from '../aiGeometry';
import { moveEnemyTowards, moveEnemyRandom, attemptLunge, getNextPatrolPoint } from '../enemyMovement';

export const updatePatrolEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  if (playerDetected) {
    const updated = {
      ...enemy,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
    const lunge = attemptLunge(updated, player, map, 2, 0.1);
    return lunge ?? moveEnemyTowards(updated, player, map);
  }

  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  if (enemy.state === EnemyState.CHASE) {
    const lunge = attemptLunge(enemy, player, map, 2, 0.1);
    const updated = lunge ?? moveEnemyTowards(enemy, player, map);
    return { ...updated, lastKnownPlayerPos: player, lastSeenAt: currentTime };
  }

  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.PATROL };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  if (enemy.patrolPath && enemy.patrolPath.length > 0) {
    const target = getNextPatrolPoint(enemy);
    if (target) {
      const moved = moveEnemyTowards(enemy, target, map);
      if (moved.x === target.x && moved.y === target.y) {
        const nextIndex = (enemy.patrolIndex ?? 0) + 1;
        return { ...moved, patrolIndex: nextIndex % enemy.patrolPath.length };
      }
      return moved;
    }
  }

  return moveEnemyRandom(enemy, map);
};
```

- [ ] **Step 2: `chargeBehavior.ts` を実装**

Create `behaviors/chargeBehavior.ts`（`updateChargeEnemy` 本体を 286-321行から逐語移動）:

```typescript
/** CHARGE/BOSS 型敵のAI更新 */
import { Enemy, EnemyState, EnemyType, GameMap, Position } from '../../../types';
import { shouldChase, shouldStopChase, getManhattanDistance } from '../aiGeometry';
import { moveEnemyTowards, attemptLunge } from '../enemyMovement';

export const updateChargeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (shouldChase(enemy, player)) {
    const moved = moveEnemyTowards(enemy, player, map);
    return {
      ...moved,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  if (enemy.state === EnemyState.CHASE) {
    if (enemy.type === EnemyType.BOSS) {
      const distance = getManhattanDistance(enemy, player);
      const lungeChance = distance <= 2 ? 0.55 : distance <= 4 ? 0.4 : 0.25;
      const lungeRange = distance <= 2 ? 3 : 4;
      const lunge = attemptLunge(enemy, player, map, lungeRange, lungeChance);
      return lunge ?? moveEnemyTowards(enemy, player, map);
    }
    const lunge = attemptLunge(enemy, player, map, 2, 0.2);
    return lunge ?? moveEnemyTowards(enemy, player, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};
```

- [ ] **Step 3: `enemyAiFunctions.ts` を更新**

`enemyAiFunctions.ts` で `updatePatrolEnemy` / `updateChargeEnemy` の定義を削除し、再公開:

```typescript
import { updatePatrolEnemy } from './behaviors/patrolBehavior';
import { updateChargeEnemy } from './behaviors/chargeBehavior';

export { updatePatrolEnemy, updateChargeEnemy };
```

> 注: これらは Task 7 の registry 構築でも使うため、enemyAiFunctions に残る registry コードが
> import 済みの名前を参照できる状態を保つ。

- [ ] **Step 4: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS

- [ ] **Step 5: 型チェック＆コミット**

Run: `npm run typecheck 2>&1 | tail -5`（エラーなし）

```bash
git add src/features/ipne/domain/policies/enemyAi/behaviors/patrolBehavior.ts \
        src/features/ipne/domain/policies/enemyAi/behaviors/chargeBehavior.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵AIの PATROL/CHARGE 更新を behaviors へ分離"
```

---

## Task 6: `behaviors/rangedBehavior.ts` と `behaviors/fleeBehavior.ts` を作成

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/behaviors/rangedBehavior.ts`
- Create: `src/features/ipne/domain/policies/enemyAi/behaviors/fleeBehavior.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: `updateRangedEnemy`(public), `updateFleeEnemy`(public),
`RANGED_PREFERRED_DISTANCE`(private、ranged 内へ)。

- [ ] **Step 1: `rangedBehavior.ts` を実装**

Create `behaviors/rangedBehavior.ts`（`updateRangedEnemy` 本体を 389-453行から逐語移動。`RANGED_PREFERRED_DISTANCE` も同梱）:

```typescript
/** RANGED 型敵のAI更新（適切な間合いを保つ） */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { GAME_BALANCE } from '../../../config/gameBalance';
import { detectPlayer, shouldStopChase, getManhattanDistance } from '../aiGeometry';
import { moveEnemyTowards, moveEnemyAway } from '../enemyMovement';

/** RANGED敵が維持したい距離 */
const RANGED_PREFERRED_DISTANCE = GAME_BALANCE.enemyAi.rangedPreferredDistance;

export const updateRangedEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  if (playerDetected) {
    const distance = getManhattanDistance(enemy, player);

    if (distance < RANGED_PREFERRED_DISTANCE) {
      const moved = moveEnemyAway(enemy, player, map);
      return { ...moved, state: EnemyState.CHASE, lastKnownPlayerPos: player, lastSeenAt: currentTime };
    }

    if (distance > enemy.attackRange) {
      const moved = moveEnemyTowards(enemy, player, map);
      return { ...moved, state: EnemyState.CHASE, lastKnownPlayerPos: player, lastSeenAt: currentTime };
    }

    return { ...enemy, state: EnemyState.CHASE, lastKnownPlayerPos: player, lastSeenAt: currentTime };
  }

  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  if (enemy.state === EnemyState.CHASE && enemy.lastKnownPlayerPos) {
    return moveEnemyTowards(enemy, enemy.lastKnownPlayerPos, map);
  }

  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.IDLE };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};
```

- [ ] **Step 2: `fleeBehavior.ts` を実装**

Create `behaviors/fleeBehavior.ts`（`updateFleeEnemy` 本体を 355-378行から逐語移動）:

```typescript
/** SPECIMEN（標本）型敵のAI更新（プレイヤーから逃走） */
import { Enemy, EnemyState, GameMap, Position } from '../../../types';
import { detectPlayer, shouldStopChase } from '../aiGeometry';
import { moveEnemyAway } from '../enemyMovement';

export const updateFleeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (detectPlayer(enemy, player)) {
    const moved = moveEnemyAway(enemy, player, map);
    return { ...moved, state: EnemyState.FLEE, lastKnownPlayerPos: player, lastSeenAt: currentTime };
  }

  if (enemy.state === EnemyState.FLEE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  return { ...enemy, state: EnemyState.IDLE };
};
```

- [ ] **Step 3: `enemyAiFunctions.ts` を更新**

`updateRangedEnemy` / `updateFleeEnemy` の定義（および `RANGED_PREFERRED_DISTANCE` 定数）を削除し、再公開:

```typescript
import { updateRangedEnemy } from './behaviors/rangedBehavior';
import { updateFleeEnemy } from './behaviors/fleeBehavior';

export { updateRangedEnemy, updateFleeEnemy };
```

- [ ] **Step 4: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（特に `enemyAI.test.ts` の「遠隔攻撃型敵」5テスト・「標本型移動」テスト）

- [ ] **Step 5: 型チェック＆コミット**

Run: `npm run typecheck 2>&1 | tail -5`（エラーなし）

```bash
git add src/features/ipne/domain/policies/enemyAi/behaviors/rangedBehavior.ts \
        src/features/ipne/domain/policies/enemyAi/behaviors/fleeBehavior.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵AIの RANGED/FLEE 更新を behaviors へ分離"
```

---

## Task 7: `enemyOrchestrator.ts` を作成（一括更新を移動）

**Files:**
- Create: `src/features/ipne/domain/policies/enemyAi/enemyOrchestrator.ts`
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

移動する要素: registry 構築（`enemyAiPolicyRegistry`）, `updateEnemyAI`(public),
`EnemyUpdateResult`(public type), `toPositionKey`(private),
`updateEnemies`(public), `updateEnemiesWithContact`(public)。本体は 455-571行を逐語移動。

- [ ] **Step 1: `enemyOrchestrator.ts` を実装**

Create `enemyOrchestrator.ts`:

```typescript
/**
 * 敵の一括更新オーケストレーション
 *
 * Policy registry を通じてタイプ別 AI を適用し、移動間隔・衝突・接触/攻撃ダメージを解決する。
 */
import { Enemy, GameMap, Position } from '../../types';
import { buildDefaultEnemyAiPolicyRegistry } from './policies';
import {
  canEnemyAttack,
  setEnemyAttackCooldown,
  markEnemyAttacking,
  resolveEnemyAttackState,
  resolveKnockbackState,
} from './attackState';
import { updatePatrolEnemy } from './behaviors/patrolBehavior';
import { updateChargeEnemy } from './behaviors/chargeBehavior';
import { updateRangedEnemy } from './behaviors/rangedBehavior';
import { updateFleeEnemy } from './behaviors/fleeBehavior';

const enemyAiPolicyRegistry = buildDefaultEnemyAiPolicyRegistry({
  updatePatrolEnemy,
  updateChargeEnemy,
  updateRangedEnemy,
  updateFleeEnemy,
});

export const updateEnemyAI = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  const resolved = resolveKnockbackState(enemy, currentTime);
  return enemyAiPolicyRegistry.update({ enemy: resolved, player, map, currentTime });
};

export interface EnemyUpdateResult {
  enemies: Enemy[];
  contactDamage: number;
  contactEnemy?: Enemy;
  attackDamage: number;
  attackingEnemy?: Enemy;
}

const toPositionKey = (pos: Position): string => `${pos.x},${pos.y}`;

export const updateEnemies = (
  enemies: Enemy[],
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy[] => updateEnemiesWithContact(enemies, player, map, currentTime).enemies;

export const updateEnemiesWithContact = (
  enemies: Enemy[],
  player: Position,
  map: GameMap,
  currentTime: number
): EnemyUpdateResult => {
  const occupied = new Set<string>();
  occupied.add(toPositionKey(player));
  for (const enemy of enemies) {
    occupied.add(toPositionKey(enemy));
  }

  const updatedEnemies: Enemy[] = [];
  let contactDamage = 0;
  let contactEnemy: Enemy | undefined;
  let attackDamage = 0;
  let attackingEnemy: Enemy | undefined;

  for (const enemy of enemies) {
    occupied.delete(toPositionKey(enemy));
    let candidate = updateEnemyAI(enemy, player, map, currentTime);
    const moveInterval = 1000 / Math.max(1, enemy.speed);
    const canStep = currentTime - (enemy.lastMoveAt ?? 0) >= moveInterval;
    if (!canStep) {
      candidate = { ...candidate, x: enemy.x, y: enemy.y, lastMoveAt: enemy.lastMoveAt ?? 0 };
    } else {
      candidate = { ...candidate, lastMoveAt: currentTime };
    }
    const candidateKey = toPositionKey(candidate);
    const playerKey = toPositionKey(player);

    candidate = resolveEnemyAttackState(candidate, currentTime);

    if (canEnemyAttack(candidate, player, currentTime)) {
      if (candidate.damage > attackDamage) {
        attackDamage = candidate.damage;
        attackingEnemy = candidate;
      }
      candidate = setEnemyAttackCooldown(candidate, currentTime);
      candidate = markEnemyAttacking(candidate, currentTime);
    }

    if (candidateKey === playerKey) {
      if (enemy.damage >= contactDamage) {
        contactDamage = enemy.damage;
        contactEnemy = enemy;
      }
      candidate = markEnemyAttacking(candidate, currentTime);
      updatedEnemies.push({ ...candidate, x: enemy.x, y: enemy.y });
      occupied.add(toPositionKey(enemy));
      continue;
    }

    if (occupied.has(candidateKey)) {
      updatedEnemies.push({ ...candidate, x: enemy.x, y: enemy.y });
      occupied.add(toPositionKey(enemy));
      continue;
    }

    updatedEnemies.push(candidate);
    occupied.add(candidateKey);
  }

  return { enemies: updatedEnemies, contactDamage, contactEnemy, attackDamage, attackingEnemy };
};
```

- [ ] **Step 2: `enemyAiFunctions.ts` から orchestrator 定義を削除し re-export に置換**

`enemyAiFunctions.ts` で registry 構築・`updateEnemyAI`・`EnemyUpdateResult`・`toPositionKey`・`updateEnemies`・`updateEnemiesWithContact` を削除し、再公開:

```typescript
import { updateEnemyAI, updateEnemies, updateEnemiesWithContact } from './enemyOrchestrator';
import type { EnemyUpdateResult } from './enemyOrchestrator';

export { updateEnemyAI, updateEnemies, updateEnemiesWithContact };
export type { EnemyUpdateResult };
```

- [ ] **Step 3: 既存テストが緑であることを確認**

Run: `npm test -- enemyAi enemyAI enemyAttackAnim 2>&1 | tail -15`
Expected: PASS（`updateEnemiesWithContact` テスト・`EnemyUpdateResult` 型）

- [ ] **Step 4: 型チェック＆コミット**

Run: `npm run typecheck 2>&1 | tail -5`（エラーなし）

```bash
git add src/features/ipne/domain/policies/enemyAi/enemyOrchestrator.ts \
        src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE 敵の一括更新を enemyOrchestrator へ分離"
```

---

## Task 8: `enemyAiFunctions.ts` を純粋 barrel に整形し最終検証

**Files:**
- Modify: `src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`

この時点で `enemyAiFunctions.ts` には実装が残っていないはず。import＋export を整理し、
冒頭コメントを barrel である旨に更新する。

- [ ] **Step 1: `enemyAiFunctions.ts` を純粋 barrel として書き直す**

`enemyAiFunctions.ts` の全内容を以下に置換:

```typescript
/**
 * 敵AIロジック（barrel）
 *
 * 実装は責務別ファイルへ分割済み。本ファイルは後方互換のための re-export のみを行う。
 * 公開 API（エクスポート名・シグネチャ）は分割前と完全一致を維持する。
 * 設計: docs/superpowers/specs/2026-06-14-ipne-enemyai-refactoring-design.md
 */
export { setRandomProvider, resetRandomProvider } from './aiRandom';
export {
  AI_CONFIG,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  calculateFleeDirection,
  getDirectPathToPlayer,
} from './aiGeometry';
export {
  moveEnemyTowards,
  generatePatrolPath,
  getNextPatrolPoint,
} from './enemyMovement';
export {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
} from './attackState';
export { updatePatrolEnemy } from './behaviors/patrolBehavior';
export { updateChargeEnemy } from './behaviors/chargeBehavior';
export { updateRangedEnemy } from './behaviors/rangedBehavior';
export { updateFleeEnemy } from './behaviors/fleeBehavior';
export { updateEnemyAI, updateEnemies, updateEnemiesWithContact } from './enemyOrchestrator';
export type { EnemyUpdateResult } from './enemyOrchestrator';
```

- [ ] **Step 2: 公開エクスポートが分割前と一致することを確認**

Run: `grep -oE "export (const|function|interface|\{[^}]*\}|type \{[^}]*\})" src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts`
Expected: 「公開 API」セクションの24エクスポートと過不足なく一致（`getManhattanDistance`/`calculateStep` 等の private が混入していないこと）。

- [ ] **Step 3: IPNE 全テストを実行（回帰確認）**

Run: `npm test -- ipne 2>&1 | tail -20`
Expected: PASS（IPNE 全テストスイート green。フレイキー対策済みのパフォーマンステスト含む）

- [ ] **Step 4: 型チェック**

Run: `npm run typecheck 2>&1 | tail -5`
Expected: エラーなし

- [ ] **Step 5: lint（警告ゼロ強制・未使用 import 検出）**

Run: `npm run lint:ci 2>&1 | tail -20`
Expected: エラー・警告なし（途中タスクで残った未使用 import があればここで検出 → 削除して再実行）

- [ ] **Step 6: コミット**

```bash
git add src/features/ipne/domain/policies/enemyAi/enemyAiFunctions.ts
git commit -m "refactor: IPNE enemyAiFunctions を純粋な barrel へ整形

- 全実装を責務別ファイルへ移動完了
- 24個の公開エクスポートを re-export で後方互換維持
- Phase A（敵AIロジック責務分割）完了"
```

---

## Task 9: README とロードマップの更新

**Files:**
- Modify: `src/features/ipne/README.md`

- [ ] **Step 1: README の `policies/` 記述を更新**

`README.md` 105-106行付近の `policies/` 説明を、新ファイル構成（`aiGeometry`/`aiRandom`/`enemyMovement`/`attackState`/`behaviors/`/`enemyOrchestrator`）を反映する形に更新する。`types.ts` の barrel 記述（66-67行付近）と同様に、`enemyAiFunctions.ts` が barrel である旨を1文追記する。

- [ ] **Step 2: コミット**

```bash
git add src/features/ipne/README.md
git commit -m "docs: IPNE README に敵AIの責務分割後の構成を反映"
```

---

## 完了の定義（Definition of Done）

- [ ] `enemyAiFunctions.ts` が純粋 barrel（re-export のみ）
- [ ] `aiRandom` / `aiGeometry` / `enemyMovement` / `attackState` / `enemyOrchestrator` ＋ `behaviors/`4ファイルに責務分割
- [ ] `calculateStep` 新設、方向計算のコピペ5箇所が解消
- [ ] 公開24エクスポートが分割前と完全一致（private の漏洩なし）
- [ ] 参照元4ファイル（index.ts / tickGameState.ts / enemyAI.test.ts / enemyAttackAnim.test.ts）と `policies.ts` が無修正
- [ ] `npm test -- ipne` / `npm run typecheck` / `npm run lint:ci` 全パス
- [ ] README 更新済み
- [ ] 既知の負債（`_random` の DI 化・`getManhattanDistance` の `shared/` 共通化）が spec に記録済み
