import { MathUtils } from './math-utils';
import { SpeedDomain } from './speed-domain';
import { CollisionDomain } from './collision-domain';
import { ScoringDomain } from './scoring-domain';
import { Config } from '../config';
import { SpeedRank } from '../constants';

describe('Non-Brake Descent domains', () => {
  describe('MathUtils', () => {
    it('clamps values within range', () => {
      expect(MathUtils.clamp(5, 0, 3)).toBe(3);
      expect(MathUtils.clamp(-2, 0, 3)).toBe(0);
    });

    it('lerps between values', () => {
      expect(MathUtils.lerp(0, 10, 0.5)).toBe(5);
    });

    it('normalizes values', () => {
      expect(MathUtils.normalize(5, 0, 10)).toBe(0.5);
    });
  });

  describe('SpeedDomain', () => {
    it('returns expected ranks', () => {
      expect(SpeedDomain.getRank(5)).toBe(SpeedRank.LOW);
      expect(SpeedDomain.getRank(8)).toBe(SpeedRank.MID);
      expect(SpeedDomain.getRank(12)).toBe(SpeedRank.HIGH);
    });

    it('calculates speed bonuses', () => {
      expect(SpeedDomain.getBonus(9)).toBe(Config.score.speedBonusMid);
      expect(SpeedDomain.getBonus(12)).toBe(Config.score.speedBonusHigh);
    });

    it('accelerates within limits', () => {
      const boosted = SpeedDomain.accelerate(5, true);
      const slowed = SpeedDomain.accelerate(5, false);
      expect(boosted).toBeCloseTo(5 + Config.speed.accelRate);
      expect(slowed).toBeCloseTo(5 - Config.speed.decelRate);
    });
  });

  describe('CollisionDomain', () => {
    it('detects ground collisions', () => {
      const result = CollisionDomain.check(50, 60, false, 0);
      expect(result.ground).toBe(true);
      expect(result.hit).toBe(true);
      expect(result.air).toBe(false);
    });

    it('detects near miss', () => {
      const result = CollisionDomain.check(50, 80, false, 0);
      expect(result.nearMiss).toBe(true);
      expect(result.hit).toBe(false);
    });
  });

  describe('ScoringDomain', () => {
    it('calculates ramp score with combo', () => {
      const result = ScoringDomain.calcRampScore(10, 3);
      expect(result.base).toBe(300);
      expect(result.bonus).toBe(300);
    });

    it('calculates final score', () => {
      expect(ScoringDomain.calcFinal(1000, 200, 50)).toBe(1250);
    });
  });
});
