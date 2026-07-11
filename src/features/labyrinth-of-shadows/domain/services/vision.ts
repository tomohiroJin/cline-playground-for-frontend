/**
 * 視線判定サービス
 * 敵の「視野角コーン＋壁遮蔽」による発見判定を純粋関数で提供する
 */
import { MazeService } from '../../maze-service';
import { distance, normAngle } from '../../utils';

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

/** 2点間に壁がないか判定する。MazeService の実装に委譲 */
export const hasLineOfSight = (
  maze: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => MazeService.hasLineOfSight(maze, x1, y1, x2, y2);

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
