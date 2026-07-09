import { collectWallCells, cameraYaw, WALL_HEIGHT, EYE_HEIGHT } from '../geometry';

describe('geometry', () => {
  test('collectWallCells は非0セルのみを壁として列挙する', () => {
    // 0=通行可, 1=壁
    const maze = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];
    const walls = collectWallCells(maze);
    // 中央(1,1)以外の8セルが壁
    expect(walls).toHaveLength(8);
    expect(walls).not.toContainEqual({ x: 1, z: 1 });
    expect(walls).toContainEqual({ x: 0, z: 0 });
  });

  test('cameraYaw(0) は -π/2（angle=0 で +X 方向を向く）', () => {
    expect(cameraYaw(0)).toBeCloseTo(-Math.PI / 2);
  });

  test('cameraYaw は angle の増加に対して単調減少（-angle-π/2）', () => {
    expect(cameraYaw(Math.PI / 2)).toBeCloseTo(-Math.PI);
  });

  test('高さ定数は正の値', () => {
    expect(WALL_HEIGHT).toBeGreaterThan(0);
    expect(EYE_HEIGHT).toBeGreaterThan(0);
    expect(EYE_HEIGHT).toBeLessThan(WALL_HEIGHT);
  });
});
