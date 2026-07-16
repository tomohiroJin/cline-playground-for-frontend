import { resolveKnockback } from '../services/knockback';
import { MazeService } from '../../maze-service';
import { FIXED_MAZE_9X9 } from '../../__tests__/helpers/fixed-maze';

describe('resolveKnockback', () => {
  test('壁方向へのノックバックは壁を越えず歩けるセルに留まる', () => {
    // 敵(1.5,1.5)、プレイヤーは南(1.5,1.9)。押し戻し方向=北=上端の壁。
    // 2.5 そのままだと y=-1.0 で枠外/壁にめり込むが、歩けるセルで止まるべき。
    const result = resolveKnockback(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.9, 2.5);
    expect(MazeService.isWalkable(FIXED_MAZE_9X9, result.x, result.y)).toBe(true);
  });

  test('開けた空間では指定距離いっぱいに押し戻す', () => {
    // 内側が全て床の 8x8。敵(3.5,3.5)、プレイヤー南(3.5,5.5)→北へ2.5押す。
    const bigOpen = Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => (x === 0 || y === 0 || x === 7 || y === 7 ? 1 : 0))
    );
    const result = resolveKnockback(bigOpen, 3.5, 3.5, 3.5, 5.5, 2.5);
    expect(MazeService.isWalkable(bigOpen, result.x, result.y)).toBe(true);
    // 判定刻み(0.1)ぶんの手前で止まりうるので、ほぼ指定距離まで押せていれば良い
    const pushedNorth = 3.5 - result.y;
    expect(pushedNorth).toBeGreaterThanOrEqual(2.4);
    expect(pushedNorth).toBeLessThanOrEqual(2.5);
    expect(result.x).toBeCloseTo(3.5, 5);
  });

  test('プレイヤーと同一座標なら押し戻さない（0除算回避）', () => {
    const result = resolveKnockback(FIXED_MAZE_9X9, 1.5, 1.5, 1.5, 1.5, 2.5);
    expect(result).toEqual({ x: 1.5, y: 1.5 });
  });
});
