/**
 * 敵撃破演出テスト
 */

import {
  ENEMY_DEATH_DURATION,
  getDeathPhase,
  getDeathScale,
  isDeathAnimationComplete,
  getEnemyDeathParticleConfig,
} from './enemyDeath';
import { EnemyType } from '../../types';

describe('敵撃破演出', () => {
  describe('getDeathPhase', () => {
    it('0-100msはフェーズ1（縮小）', () => {
      expect(getDeathPhase(0)).toBe(1);
      expect(getDeathPhase(50)).toBe(1);
      expect(getDeathPhase(99)).toBe(1);
    });

    it('100-150msはフェーズ2（フラッシュ）', () => {
      expect(getDeathPhase(100)).toBe(2);
      expect(getDeathPhase(125)).toBe(2);
      expect(getDeathPhase(149)).toBe(2);
    });

    it('150-300msはフェーズ3（破裂）', () => {
      expect(getDeathPhase(150)).toBe(3);
      expect(getDeathPhase(200)).toBe(3);
      expect(getDeathPhase(299)).toBe(3);
    });

    it('300ms以降はフェーズ3', () => {
      expect(getDeathPhase(300)).toBe(3);
      expect(getDeathPhase(500)).toBe(3);
    });
  });

  describe('getDeathScale', () => {
    it('フェーズ1の開始時はスケール1.0', () => {
      expect(getDeathScale(0)).toBeCloseTo(1.0, 1);
    });

    it('フェーズ1の終了時はスケール0.5付近', () => {
      expect(getDeathScale(99)).toBeLessThan(0.6);
      expect(getDeathScale(99)).toBeGreaterThan(0.4);
    });

    it('フェーズ2以降はスケール0（非表示）', () => {
      expect(getDeathScale(150)).toBe(0);
    });
  });

  describe('isDeathAnimationComplete', () => {
    it('持続時間内は未完了', () => {
      expect(isDeathAnimationComplete(0)).toBe(false);
      expect(isDeathAnimationComplete(150)).toBe(false);
      expect(isDeathAnimationComplete(299)).toBe(false);
    });

    it('持続時間を超えたら完了', () => {
      expect(isDeathAnimationComplete(ENEMY_DEATH_DURATION)).toBe(true);
      expect(isDeathAnimationComplete(500)).toBe(true);
    });
  });

  describe('getEnemyDeathParticleConfig', () => {
    it('PATROL敵は6個のパーティクル', () => {
      const config = getEnemyDeathParticleConfig(EnemyType.PATROL);
      expect(config.particleCount).toBe(6);
      expect(config.duration).toBe(300);
    });

    it('CHARGE敵は8個のパーティクル', () => {
      const config = getEnemyDeathParticleConfig(EnemyType.CHARGE);
      expect(config.particleCount).toBe(8);
    });

    it('BOSS敵は24個のパーティクル', () => {
      const config = getEnemyDeathParticleConfig(EnemyType.BOSS);
      expect(config.particleCount).toBe(24);
      expect(config.duration).toBe(800);
    });

    it('MEGA_BOSS敵は48個のパーティクル', () => {
      const config = getEnemyDeathParticleConfig(EnemyType.MEGA_BOSS);
      expect(config.particleCount).toBe(48);
      expect(config.duration).toBe(1200);
    });

    it('MINI_BOSS敵は16個のパーティクル', () => {
      const config = getEnemyDeathParticleConfig(EnemyType.MINI_BOSS);
      expect(config.particleCount).toBe(16);
      expect(config.duration).toBe(600);
    });

    it('全敵タイプに色配列が定義されている', () => {
      const types = Object.values(EnemyType);
      for (const type of types) {
        const config = getEnemyDeathParticleConfig(type);
        expect(config.colors.length).toBeGreaterThan(0);
      }
    });
  });
});
