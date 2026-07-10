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
