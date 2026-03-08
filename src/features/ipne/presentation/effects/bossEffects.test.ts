/**
 * ボス戦演出テスト
 */

import {
  BossWarningState,
  createBossWarningState,
  shouldTriggerWarning,
  getWarningPhase,
  BOSS_WARNING_DURATION,
  BOSS_DETECTION_RANGE,
  getBossAuraConfig,
  getBossDeathEffectConfig,
} from './bossEffects';
import { EnemyType, Enemy, Direction, EnemyState } from '../../types';

/** テスト用ボス敵生成 */
function createTestBoss(x: number, y: number, id = 'boss-1', type: Enemy['type'] = EnemyType.BOSS): Enemy {
  return {
    id, x, y,
    type,
    hp: 35, maxHp: 35,
    damage: 4, speed: 1.5,
    detectionRange: 8, attackRange: 3,
    attackCooldownUntil: 0,
    state: EnemyState.IDLE,
    homePosition: { x, y },
  };
}

describe('ボスWARNING演出', () => {
  describe('createBossWarningState', () => {
    it('初期状態は非アクティブ', () => {
      const state = createBossWarningState();
      expect(state.isActive).toBe(false);
      expect(state.triggeredBossIds).toHaveLength(0);
    });
  });

  describe('shouldTriggerWarning', () => {
    it('ボスが検知距離内にいる場合、WARNINGが発火する', () => {
      const state = createBossWarningState();
      const boss = createTestBoss(8, 5); // プレイヤー(5,5)から距離3
      expect(shouldTriggerWarning(state, boss, 5, 5)).toBe(true);
    });

    it('ボスが検知距離外にいる場合、WARNINGは発火しない', () => {
      const state = createBossWarningState();
      const boss = createTestBoss(15, 5); // 距離10
      expect(shouldTriggerWarning(state, boss, 5, 5)).toBe(false);
    });

    it('すでに発火済みのボスには再発火しない', () => {
      const state: BossWarningState = {
        isActive: false,
        startTime: 0,
        triggeredBossIds: ['boss-1'],
      };
      const boss = createTestBoss(8, 5);
      expect(shouldTriggerWarning(state, boss, 5, 5)).toBe(false);
    });

    it('通常敵にはWARNINGは発火しない', () => {
      const state = createBossWarningState();
      const normalEnemy = createTestBoss(8, 5, 'enemy-1', EnemyType.PATROL);
      expect(shouldTriggerWarning(state, normalEnemy, 5, 5)).toBe(false);
    });

    it('MINI_BOSSにもWARNINGが発火する', () => {
      const state = createBossWarningState();
      const miniBoss = createTestBoss(8, 5, 'mini-1', EnemyType.MINI_BOSS);
      expect(shouldTriggerWarning(state, miniBoss, 5, 5)).toBe(true);
    });

    it('MEGA_BOSSにもWARNINGが発火する', () => {
      const state = createBossWarningState();
      const megaBoss = createTestBoss(8, 5, 'mega-1', EnemyType.MEGA_BOSS);
      expect(shouldTriggerWarning(state, megaBoss, 5, 5)).toBe(true);
    });
  });

  describe('getWarningPhase', () => {
    it('0-200msは暗転フェーズ', () => {
      expect(getWarningPhase(0)).toBe('darken');
      expect(getWarningPhase(199)).toBe('darken');
    });

    it('200-1000msはテキスト点滅フェーズ', () => {
      expect(getWarningPhase(200)).toBe('text');
      expect(getWarningPhase(999)).toBe('text');
    });

    it('1000-1200msは暗転解除フェーズ', () => {
      expect(getWarningPhase(1000)).toBe('fadeout');
      expect(getWarningPhase(1199)).toBe('fadeout');
    });

    it('1200ms以降は完了', () => {
      expect(getWarningPhase(1200)).toBe('done');
    });
  });

  describe('定数', () => {
    it('WARNING持続時間は1200ms', () => {
      expect(BOSS_WARNING_DURATION).toBe(1200);
    });

    it('検知距離は5タイル', () => {
      expect(BOSS_DETECTION_RANGE).toBe(5);
    });
  });
});

describe('ボスHP残量演出', () => {
  describe('getBossAuraConfig', () => {
    it('HP50%超は演出なし', () => {
      const config = getBossAuraConfig(0.6);
      expect(config).toBeUndefined();
    });

    it('HP50%以下で赤オーラ', () => {
      const config = getBossAuraConfig(0.5);
      expect(config).toBeDefined();
      expect(config!.pulsePeriod).toBe(800);
      expect(config!.hasShake).toBe(false);
    });

    it('HP25%以下で激しいオーラ+シェイク', () => {
      const config = getBossAuraConfig(0.25);
      expect(config).toBeDefined();
      expect(config!.pulsePeriod).toBe(400);
      expect(config!.hasShake).toBe(true);
    });
  });
});

describe('ボス撃破演出', () => {
  describe('getBossDeathEffectConfig', () => {
    it('BOSSは32個パーティクル', () => {
      const config = getBossDeathEffectConfig(EnemyType.BOSS);
      expect(config.particleCount).toBe(32);
      expect(config.flashDuration).toBe(300);
      expect(config.shakeDuration).toBe(400);
    });

    it('MINI_BOSSは24個パーティクル', () => {
      const config = getBossDeathEffectConfig(EnemyType.MINI_BOSS);
      expect(config.particleCount).toBe(24);
      expect(config.flashDuration).toBe(200);
    });

    it('MEGA_BOSSは3段階爆発', () => {
      const config = getBossDeathEffectConfig(EnemyType.MEGA_BOSS);
      expect(config.waves).toBeDefined();
      expect(config.waves!).toHaveLength(3);
      expect(config.waves![0].delay).toBe(0);
      expect(config.waves![1].delay).toBe(400);
      expect(config.waves![2].delay).toBe(800);
    });

    it('通常敵には撃破演出設定がない', () => {
      const config = getBossDeathEffectConfig(EnemyType.PATROL);
      expect(config.particleCount).toBe(0);
    });
  });
});
