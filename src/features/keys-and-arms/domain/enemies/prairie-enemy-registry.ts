/**
 * 草原敵レジストリ（Strategy パターン）
 *
 * 草原ステージの各敵タイプ（normal, shifter, dasher）の
 * ビートごとの移動行動を統一インターフェースで管理する。
 */

import { EnemyBehaviorRegistry } from './enemy-registry';
import type { EnemyBehavior } from './enemy-registry';
import { shouldShifterMove, shiftLane } from './shifter-behavior';
import { shouldDasherCharge } from './dasher-behavior';

/** 草原敵の最小状態（レジストリ用） */
export interface PrairieEnemyState {
  readonly beh: string;
  readonly lane: number;
  readonly step: number;
  readonly dead: boolean;
  readonly spawnT: number;
  readonly wait: number;
  readonly shiftDir: number;
  readonly shifted: boolean;
  readonly dashReady: boolean;
  readonly dashFlash: number;
}

/** 草原敵の更新コンテキスト */
export interface PrairieEnemyContext {
  readonly maxLanes: number;
}

/** 通常敵の行動 — 毎ビート1歩前進 */
const normalBehavior: EnemyBehavior<PrairieEnemyState, PrairieEnemyContext> = {
  update(enemy) {
    if (enemy.dead || enemy.spawnT > 0) return enemy;
    if (enemy.wait > 0) return { ...enemy, wait: enemy.wait - 1 };
    return { ...enemy, step: enemy.step - 1 };
  },
};

/** シフター行動 — step 2 でレーン移動してから前進 */
const shifterBehavior: EnemyBehavior<PrairieEnemyState, PrairieEnemyContext> = {
  update(enemy, context) {
    if (enemy.dead || enemy.spawnT > 0) return enemy;
    if (shouldShifterMove(enemy.step) && !enemy.shifted) {
      const newLane = shiftLane(enemy.lane, enemy.shiftDir, context.maxLanes);
      return { ...enemy, shifted: true, lane: newLane };
    }
    if (enemy.wait > 0) return { ...enemy, wait: enemy.wait - 1 };
    return { ...enemy, step: enemy.step - 1 };
  },
};

/** ダッシャー行動 — step 2 で充電、次ビートで step 0 に突進 */
const dasherBehavior: EnemyBehavior<PrairieEnemyState, PrairieEnemyContext> = {
  update(enemy) {
    if (enemy.dead || enemy.spawnT > 0) return enemy;
    if (shouldDasherCharge(enemy.step) && !enemy.dashReady) {
      return { ...enemy, dashReady: true, dashFlash: 4 };
    }
    if (enemy.dashReady) {
      return { ...enemy, step: 0, dashReady: false, dashFlash: 3 };
    }
    if (enemy.wait > 0) return { ...enemy, wait: enemy.wait - 1 };
    return { ...enemy, step: enemy.step - 1 };
  },
};

/** デフォルトのレジストリを生成（全草原敵を登録済み） */
export function createPrairieEnemyRegistry(): EnemyBehaviorRegistry<PrairieEnemyState, PrairieEnemyContext> {
  const registry = new EnemyBehaviorRegistry<PrairieEnemyState, PrairieEnemyContext>();
  registry.register('normal', normalBehavior);
  registry.register('shifter', shifterBehavior);
  registry.register('dasher', dasherBehavior);
  return registry;
}
