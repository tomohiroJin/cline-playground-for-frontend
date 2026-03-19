/**
 * パックエンティティ
 * - 位置・速度・半径を保持
 * - 不変更新パターン（新しい PuckState を返す）
 */
import { PHYSICS_CONSTANTS } from '../constants/physics';

export type PuckState = Readonly<{
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  visible: boolean;
  hitCount: number;
}>;

export const Puck = {
  /** パックを生成する */
  create(x: number, y: number, radius: number): PuckState {
    return { x, y, vx: 0, vy: 0, radius, visible: true, hitCount: 0 };
  },

  /** 速度に基づいて位置を更新する */
  applyVelocity(puck: PuckState, dt: number): PuckState {
    return {
      ...puck,
      x: puck.x + puck.vx * dt,
      y: puck.y + puck.vy * dt,
    };
  },

  /** 摩擦を適用する */
  applyFriction(puck: PuckState, friction: number): PuckState {
    return {
      ...puck,
      vx: puck.vx * friction,
      vy: puck.vy * friction,
    };
  },

  /** 法線方向に速度を反射する（反発係数は PHYSICS_CONSTANTS.RESTITUTION を使用） */
  reflect(puck: PuckState, normal: { x: number; y: number }): PuckState {
    const restitution = PHYSICS_CONSTANTS.RESTITUTION;
    const dot = puck.vx * normal.x + puck.vy * normal.y;
    return {
      ...puck,
      vx: (puck.vx - 2 * dot * normal.x) * restitution,
      vy: (puck.vy - 2 * dot * normal.y) * restitution,
    };
  },

  /** パックの速度を取得する */
  speed(puck: PuckState): number {
    return Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
  },

  /** パックが移動中かどうかを判定する */
  isMoving(puck: PuckState, threshold = 0.1): boolean {
    return Puck.speed(puck) > threshold;
  },

  /** パックがゴール内かどうかを判定する */
  isInGoal(
    puck: PuckState,
    canvasHeight: number,
    goalSize: number,
    canvasWidth = PHYSICS_CONSTANTS.CANVAS_WIDTH
  ): 'player' | 'cpu' | null {
    const goalLeft = (canvasWidth - goalSize) / 2;
    const goalRight = (canvasWidth + goalSize) / 2;
    const inGoalX = puck.x >= goalLeft && puck.x <= goalRight;

    if (!inGoalX) return null;

    // プレイヤー側ゴール（下端）→ CPU がスコア
    if (puck.y > canvasHeight - puck.radius) return 'cpu';
    // CPU 側ゴール（上端）→ プレイヤーがスコア
    if (puck.y < puck.radius) return 'player';

    return null;
  },
} as const;
