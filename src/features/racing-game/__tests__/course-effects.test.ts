import { getEffect, getFriction, getSpeedModifier } from '../course-effects';

describe('course-effects', () => {
  // --- getEffect ---
  describe('getEffect', () => {
    test.each(['forest', 'city', 'mountain', 'beach', 'night', 'snow'])('既知のデコ "%s" に対応するCourseEffectを返す', (deco) => {
      const effect = getEffect(deco);
      expect(effect.name).toBe(deco.charAt(0).toUpperCase() + deco.slice(1));
    });

    test('未知のデコにはデフォルト値を返す', () => {
      const effect = getEffect('unknown');
      expect(effect).toEqual({ name: 'Default', frictionMultiplier: 1.0, driftAngleBonus: 0, speedModifier: 0, visualEffect: 'none', segmentBased: false });
    });
  });

  // --- getFriction ---
  describe('getFriction', () => {
    test('Forest: segment%3===0 のとき 0.85 を返す', () => {
      const effect = getEffect('forest');
      expect(getFriction(effect, 0, 10, 0, 100)).toBe(0.85);
      expect(getFriction(effect, 3, 10, 0, 100)).toBe(0.85);
    });

    test('Forest: segment%3!==0 のとき 1.0 を返す', () => {
      const effect = getEffect('forest');
      expect(getFriction(effect, 1, 10, 0, 100)).toBe(1.0);
      expect(getFriction(effect, 2, 10, 0, 100)).toBe(1.0);
    });

    test('Mountain: 前半セグメントは 0.95、後半は 1.05 を返す', () => {
      const effect = getEffect('mountain');
      expect(getFriction(effect, 2, 10, 0, 100)).toBe(0.95);
      expect(getFriction(effect, 7, 10, 0, 100)).toBe(1.05);
    });

    test('Beach: 外縁(distFromCenter > trackWidth*0.8)は 0.70、内側は 1.0 を返す', () => {
      const effect = getEffect('beach');
      expect(getFriction(effect, 0, 10, 90, 100)).toBe(0.70);
      expect(getFriction(effect, 0, 10, 50, 100)).toBe(1.0);
    });

    test('City: segmentBased=false なので固定値 0.90 を返す', () => {
      const effect = getEffect('city');
      expect(getFriction(effect, 0, 10, 0, 100)).toBe(0.90);
    });

    test('Snow: segmentBased=false なので固定値 0.75 を返す', () => {
      const effect = getEffect('snow');
      expect(getFriction(effect, 0, 10, 0, 100)).toBe(0.75);
    });
  });

  // --- getSpeedModifier ---
  describe('getSpeedModifier', () => {
    test('Mountain: 前半セグメントは負の速度修正を返す', () => {
      const effect = getEffect('mountain');
      expect(getSpeedModifier(effect, 2, 10)).toBe(-0.05);
    });

    test('Mountain: 後半セグメントは正の速度修正を返す', () => {
      const effect = getEffect('mountain');
      expect(getSpeedModifier(effect, 7, 10)).toBe(0.05);
    });

    test('Mountain以外のコースは 0 を返す', () => {
      expect(getSpeedModifier(getEffect('forest'), 0, 10)).toBe(0);
      expect(getSpeedModifier(getEffect('city'), 0, 10)).toBe(0);
      expect(getSpeedModifier(getEffect('snow'), 0, 10)).toBe(0);
    });
  });
});
