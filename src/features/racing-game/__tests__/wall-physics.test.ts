import {
  calculateWallPenalty,
  shouldWarp,
  calculateWarpDestination,
  calculateSlideVector,
  calculateWallSlidePosition,
} from '../wall-physics';
import { WALL } from '../constants';

describe('wall-physics', () => {
  describe('calculateWallPenalty', () => {
    test('stuck=1 で LIGHT_FACTOR ベースの減速', () => {
      const result = calculateWallPenalty(1, 0, 1);
      expect(result.wallStage).toBe(1);
      // factor = 1 - (1 - LIGHT_FACTOR) * 1 = LIGHT_FACTOR
      expect(result.factor).toBeCloseTo(WALL.LIGHT_FACTOR);
      expect(result.newShieldCount).toBe(0);
    });

    test('stuck=2 で MEDIUM_FACTOR ベースの減速', () => {
      const result = calculateWallPenalty(2, 0, 1);
      expect(result.wallStage).toBe(2);
      expect(result.factor).toBeCloseTo(WALL.MEDIUM_FACTOR);
    });

    test('stuck=5 で HEAVY_FACTOR ベースの減速', () => {
      const result = calculateWallPenalty(5, 0, 1);
      expect(result.wallStage).toBe(3);
      expect(result.factor).toBeCloseTo(WALL.HEAVY_FACTOR);
    });

    test('シールド所持時は factor=1.0（減速なし）', () => {
      const result = calculateWallPenalty(1, 1, 1);
      expect(result.factor).toBe(1.0);
      expect(result.newShieldCount).toBe(0);
    });

    test('wallDamageMultiplier < 1 で減速が軽減される', () => {
      const result = calculateWallPenalty(1, 0, 0.5);
      // factor = 1 - (1 - LIGHT_FACTOR) * 0.5
      const expected = 1 - (1 - WALL.LIGHT_FACTOR) * 0.5;
      expect(result.factor).toBeCloseTo(expected);
    });
  });

  describe('shouldWarp', () => {
    test('WARP_THRESHOLD 未満では false', () => {
      expect(shouldWarp(WALL.WARP_THRESHOLD - 1)).toBe(false);
    });

    test('WARP_THRESHOLD 以上で true', () => {
      expect(shouldWarp(WALL.WARP_THRESHOLD)).toBe(true);
    });
  });

  describe('calculateWarpDestination', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    test('seg+3 のポイントにワープする', () => {
      const result = calculateWarpDestination(0, pts);
      // seg=0, wi=(0+3)%4=3
      expect(result.x).toBe(pts[3].x);
      expect(result.y).toBe(pts[3].y);
    });

    test('ワープ先の角度は次ポイント方向', () => {
      const result = calculateWarpDestination(0, pts);
      // wi=3, nwi=0
      const expected = Math.atan2(pts[0].y - pts[3].y, pts[0].x - pts[3].x);
      expect(result.angle).toBeCloseTo(expected);
    });
  });

  describe('calculateSlideVector', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    test('スライドベクトルが計算される', () => {
      const result = calculateSlideVector(0, 3, 0, pts);
      expect(typeof result.slideX).toBe('number');
      expect(typeof result.slideY).toBe('number');
      expect(result.slideMag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateWallSlidePosition', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    test('stuck < 2 では info.pt をそのまま返す', () => {
      const result = calculateWallSlidePosition(50, 60, 0, pts, 3, 1);
      expect(result.x).toBe(50);
      expect(result.y).toBe(60);
    });

    test('stuck >= 2 ではセグメント中点方向に押し出す', () => {
      const result = calculateWallSlidePosition(50, 60, 0, pts, 3, 2);
      // セグメント0の中点は (50, 0)、infoPtは(50,60)なので、中点方向（上方向）に押し出される
      expect(result.y).toBeLessThan(60);
    });
  });
});
