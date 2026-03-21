// 壁衝突物理計算のテスト

import {
  calculateWallPenalty,
  shouldWarp,
  calculateWarpDestination,
  calculateSlideVector,
  calculateWallSlidePosition,
} from '../../../domain/track/wall-physics';

const squareTrack = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('wall-physics', () => {
  describe('calculateWallPenalty', () => {
    it('wallStuck=1 で LIGHT ペナルティを適用する', () => {
      const result = calculateWallPenalty(1, 0, 1);
      expect(result.wallStage).toBe(1);
      expect(result.factor).toBeCloseTo(0.6);
    });

    it('wallStuck=2-3 で MEDIUM ペナルティを適用する', () => {
      const result = calculateWallPenalty(2, 0, 1);
      expect(result.wallStage).toBe(2);
      expect(result.factor).toBeCloseTo(0.4);
    });

    it('wallStuck>=4 で HEAVY ペナルティを適用する', () => {
      const result = calculateWallPenalty(4, 0, 1);
      expect(result.wallStage).toBe(3);
      expect(result.factor).toBeCloseTo(0.2);
    });

    it('シールド所持時はペナルティが無効化される', () => {
      const result = calculateWallPenalty(1, 1, 1);
      expect(result.factor).toBe(1.0);
      expect(result.newShieldCount).toBe(0);
    });

    it('wallDamageMultiplier が反映される', () => {
      const full = calculateWallPenalty(1, 0, 1);
      const half = calculateWallPenalty(1, 0, 0.5);
      expect(half.factor).toBeGreaterThan(full.factor);
    });
  });

  describe('shouldWarp', () => {
    it('stuck が閾値以上で true を返す', () => {
      expect(shouldWarp(3)).toBe(true);
      expect(shouldWarp(5)).toBe(true);
    });

    it('stuck が閾値未満で false を返す', () => {
      expect(shouldWarp(1)).toBe(false);
      expect(shouldWarp(2)).toBe(false);
    });
  });

  describe('calculateWarpDestination', () => {
    it('ワープ先座標と角度を返す', () => {
      const result = calculateWarpDestination(0, squareTrack);
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
      expect(typeof result.angle).toBe('number');
    });
  });

  describe('calculateSlideVector', () => {
    it('スライドベクトルを計算する', () => {
      const result = calculateSlideVector(0, 5, 0, squareTrack);
      expect(typeof result.slideX).toBe('number');
      expect(typeof result.slideY).toBe('number');
      expect(result.slideMag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateWallSlidePosition', () => {
    it('stuck < 2 では元の位置を返す', () => {
      const result = calculateWallSlidePosition(50, 0, 0, squareTrack, 5, 1);
      expect(result.x).toBe(50);
      expect(result.y).toBe(0);
    });

    it('stuck >= 2 ではセグメント中点方向に押し出す', () => {
      const result = calculateWallSlidePosition(50, 0, 0, squareTrack, 5, 2);
      // 中点方向に移動しているので y 座標が変わる
      expect(result.x).not.toBe(50);
    });
  });
});
