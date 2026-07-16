import { MazeService } from '../../maze-service';

/** ノックバックの判定刻み（この間隔で歩けるか確認しながら押し戻す） */
const KNOCKBACK_STEP = 0.1;

/**
 * 敵をプレイヤーから away 方向へ最大 distance だけ押し戻した着地点を返す。
 *
 * 通常の敵移動（tryMove）と同じく「歩けるセルにしか進まない」不変条件を守り、
 * 壁を越えて押し込まない。刻みごとに歩けるか確認し、壁に当たる直前の
 * 歩けるセルで止める。1歩目から壁なら元の位置（＝呼び出し側で歩ける前提）を返す。
 * これにより敵が壁にめり込んで動けなくなる不具合を防ぐ。
 */
export const resolveKnockback = (
  maze: number[][],
  fromX: number,
  fromY: number,
  awayFromX: number,
  awayFromY: number,
  distance: number
): { x: number; y: number } => {
  const dx = fromX - awayFromX;
  const dy = fromY - awayFromY;
  const len = Math.hypot(dx, dy);
  // 同一座標だと方向が定まらないので押し戻さない（0除算回避）
  if (len === 0) return { x: fromX, y: fromY };

  const ux = dx / len;
  const uy = dy / len;
  let best = { x: fromX, y: fromY };
  for (let t = KNOCKBACK_STEP; t <= distance + 1e-9; t += KNOCKBACK_STEP) {
    const nx = fromX + ux * t;
    const ny = fromY + uy * t;
    if (!MazeService.isWalkable(maze, nx, ny)) break;
    best = { x: nx, y: ny };
  }
  return best;
};
