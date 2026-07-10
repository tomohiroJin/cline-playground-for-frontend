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
