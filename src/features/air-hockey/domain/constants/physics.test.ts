import { PHYSICS_CONSTANTS } from './physics';

describe('物理定数', () => {
  it('キャンバスサイズが定義されている', () => {
    expect(PHYSICS_CONSTANTS.CANVAS_WIDTH).toBe(450);
    expect(PHYSICS_CONSTANTS.CANVAS_HEIGHT).toBe(900);
  });

  it('パック・マレットの半径が定義されている', () => {
    expect(PHYSICS_CONSTANTS.PUCK_RADIUS).toBe(21);
    expect(PHYSICS_CONSTANTS.MALLET_RADIUS).toBe(42);
  });

  it('摩擦係数が定義されている', () => {
    expect(PHYSICS_CONSTANTS.FRICTION).toBe(0.998);
  });

  it('衝突・壁関連の定数が定義されている', () => {
    expect(PHYSICS_CONSTANTS.RESTITUTION).toBe(0.9);
    expect(PHYSICS_CONSTANTS.WALL_DAMPING).toBe(0.95);
    expect(PHYSICS_CONSTANTS.WALL_MARGIN).toBe(5);
  });

  it('定数オブジェクトが不変である', () => {
    expect(Object.isFrozen(PHYSICS_CONSTANTS)).toBe(true);
  });
});
