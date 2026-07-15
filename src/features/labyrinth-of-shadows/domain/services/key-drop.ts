import { MazeService } from '../../maze-service';

/** 4近傍（上下左右）のオフセット */
const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * 落とした鍵の着地セルを選ぶ。
 * プレイヤー隣接の歩けるセルのうち「敵から最も遠い」ものを返し、
 * 取りに戻る動線が即・敵側へ向かわないようにする（デススパイラル対策）。
 * 歩ける隣接が無ければプレイヤー自身のセルを返す（そこは必ず歩ける）。
 */
export const chooseDropCell = (
  maze: number[][],
  playerX: number,
  playerY: number,
  enemyX: number,
  enemyY: number
): { x: number; y: number } => {
  const pcx = Math.floor(playerX);
  const pcy = Math.floor(playerY);

  let best: { x: number; y: number } | undefined;
  let bestDist = -Infinity;
  for (const [dx, dy] of NEIGHBORS) {
    const nx = pcx + dx;
    const ny = pcy + dy;
    if (!MazeService.isWalkable(maze, nx, ny)) continue;
    // セル中心 (nx+0.5, ny+0.5) と敵の距離が最大＝最も敵から遠い方向
    const cx = nx + 0.5;
    const cy = ny + 0.5;
    const dist = (cx - enemyX) ** 2 + (cy - enemyY) ** 2;
    if (dist > bestDist) {
      bestDist = dist;
      best = { x: nx, y: ny };
    }
  }

  return best ?? { x: pcx, y: pcy };
};
