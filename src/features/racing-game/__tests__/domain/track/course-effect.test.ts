// コース環境効果のテスト

import {
  getCourseEffect,
  getSegmentFriction,
  getSegmentSpeedModifier,
} from '../../../domain/track/course-effect';

describe('course-effect', () => {
  describe('getCourseEffect', () => {
    it('各コースタイプの効果を返す', () => {
      expect(getCourseEffect('forest').name).toBe('Forest');
      expect(getCourseEffect('city').name).toBe('City');
      expect(getCourseEffect('snow').name).toBe('Snow');
    });

    it('未知のタイプにはデフォルト効果を返す', () => {
      const effect = getCourseEffect('unknown' as 'forest');
      expect(effect.name).toBe('Default');
      expect(effect.frictionMultiplier).toBe(1.0);
    });
  });

  describe('getSegmentFriction', () => {
    it('Forest: セグメント % 3 === 0 で 0.85', () => {
      const effect = getCourseEffect('forest');
      expect(getSegmentFriction(effect, 0, 16, 30, 55)).toBe(0.85);
      expect(getSegmentFriction(effect, 3, 16, 30, 55)).toBe(0.85);
    });

    it('Forest: セグメント % 3 !== 0 で 1.0', () => {
      const effect = getCourseEffect('forest');
      expect(getSegmentFriction(effect, 1, 16, 30, 55)).toBe(1.0);
    });

    it('Mountain: 前半で 0.95、後半で 1.05', () => {
      const effect = getCourseEffect('mountain');
      expect(getSegmentFriction(effect, 0, 20, 30, 55)).toBe(0.95);
      expect(getSegmentFriction(effect, 15, 20, 30, 55)).toBe(1.05);
    });

    it('Beach: 外縁 20% で 0.70、内側で 1.0', () => {
      const effect = getCourseEffect('beach');
      expect(getSegmentFriction(effect, 0, 16, 50, 55)).toBe(0.70);
      expect(getSegmentFriction(effect, 0, 16, 30, 55)).toBe(1.0);
    });

    it('City: 固定 0.90', () => {
      const effect = getCourseEffect('city');
      expect(getSegmentFriction(effect, 0, 16, 30, 55)).toBe(0.90);
    });

    it('Snow: 固定 0.75', () => {
      const effect = getCourseEffect('snow');
      expect(getSegmentFriction(effect, 0, 16, 30, 55)).toBe(0.75);
    });
  });

  describe('getSegmentSpeedModifier', () => {
    it('Mountain: 前半で負、後半で正', () => {
      const effect = getCourseEffect('mountain');
      expect(getSegmentSpeedModifier(effect, 0, 20)).toBeLessThan(0);
      expect(getSegmentSpeedModifier(effect, 15, 20)).toBeGreaterThan(0);
    });

    it('Mountain 以外は 0 を返す', () => {
      expect(getSegmentSpeedModifier(getCourseEffect('city'), 0, 16)).toBe(0);
      expect(getSegmentSpeedModifier(getCourseEffect('snow'), 0, 16)).toBe(0);
    });
  });
});
