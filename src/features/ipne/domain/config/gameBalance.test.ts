/**
 * ゲームバランス定数のテスト
 */
import { GAME_BALANCE } from './gameBalance';

describe('GAME_BALANCE', () => {
  describe('combat（戦闘定数）', () => {
    it('攻撃クールダウンが正の値である', () => {
      expect(GAME_BALANCE.combat.baseCooldownMs).toBeGreaterThan(0);
    });

    it('ノックバック距離が正の値である', () => {
      expect(GAME_BALANCE.combat.knockbackDistance).toBeGreaterThan(0);
    });

    it('無敵時間が正の値である', () => {
      expect(GAME_BALANCE.combat.invincibleDurationMs).toBeGreaterThan(0);
    });

    it('基本攻撃ダメージが正の値である', () => {
      expect(GAME_BALANCE.combat.playerAttackDamage).toBeGreaterThan(0);
    });

    it('ノックバック持続時間が正の値である', () => {
      expect(GAME_BALANCE.combat.knockbackDurationMs).toBeGreaterThan(0);
    });
  });

  describe('regen（回復定数）', () => {
    it('基本回復間隔が正の値である', () => {
      expect(GAME_BALANCE.regen.baseIntervalMs).toBeGreaterThan(0);
    });

    it('最短回復間隔が基本回復間隔より短い', () => {
      expect(GAME_BALANCE.regen.minIntervalMs).toBeLessThan(GAME_BALANCE.regen.baseIntervalMs);
    });

    it('回復量が正の値である', () => {
      expect(GAME_BALANCE.regen.baseHealAmount).toBeGreaterThan(0);
    });

    it('ボーナスあたりの短縮量が正の値である', () => {
      expect(GAME_BALANCE.regen.reductionPerBonus).toBeGreaterThan(0);
    });
  });

  describe('movement（移動定数）', () => {
    it('基本移動間隔が正の値である', () => {
      expect(GAME_BALANCE.movement.baseMoveIntervalMs).toBeGreaterThan(0);
    });

    it('初回移動遅延が正の値である', () => {
      expect(GAME_BALANCE.movement.initialMoveDelayMs).toBeGreaterThan(0);
    });
  });

  describe('enemyAi（敵AI定数）', () => {
    it('更新間隔が正の値である', () => {
      expect(GAME_BALANCE.enemyAi.updateIntervalMs).toBeGreaterThan(0);
    });

    it('追跡タイムアウトが更新間隔より長い', () => {
      expect(GAME_BALANCE.enemyAi.chaseTimeoutMs).toBeGreaterThan(
        GAME_BALANCE.enemyAi.updateIntervalMs
      );
    });

    it('攻撃クールダウンが正の値である', () => {
      expect(GAME_BALANCE.enemyAi.attackCooldownMs).toBeGreaterThan(0);
    });

    it('ボス攻撃クールダウンが通常より短い', () => {
      expect(GAME_BALANCE.enemyAi.bossAttackCooldownMs).toBeLessThan(
        GAME_BALANCE.enemyAi.attackCooldownMs
      );
    });

    it('遠距離敵の希望距離が正の値である', () => {
      expect(GAME_BALANCE.enemyAi.rangedPreferredDistance).toBeGreaterThan(0);
    });

    it('攻撃アニメーション持続時間が正の値である', () => {
      expect(GAME_BALANCE.enemyAi.attackAnimDurationMs).toBeGreaterThan(0);
    });
  });

  describe('combo（コンボ定数）', () => {
    it('コンボ窓が正の値である', () => {
      expect(GAME_BALANCE.combo.windowMs).toBeGreaterThan(0);
    });

    it('コンボ表示の最小値が1より大きい', () => {
      expect(GAME_BALANCE.combo.minDisplay).toBeGreaterThan(1);
    });

    it('最大エフェクト倍率が1以上である', () => {
      expect(GAME_BALANCE.combo.maxEffectMultiplier).toBeGreaterThanOrEqual(1);
    });

    it('最大エフェクトコンボが正の値である', () => {
      expect(GAME_BALANCE.combo.maxEffectCombo).toBeGreaterThan(0);
    });
  });

  describe('player（プレイヤー定数）', () => {
    it('戦士の初期HPが正の値である', () => {
      expect(GAME_BALANCE.player.warrior.initialHp).toBeGreaterThan(0);
    });

    it('盗賊の初期HPが正の値である', () => {
      expect(GAME_BALANCE.player.thief.initialHp).toBeGreaterThan(0);
    });

    it('戦士のHPが盗賊より高い', () => {
      expect(GAME_BALANCE.player.warrior.initialHp).toBeGreaterThan(
        GAME_BALANCE.player.thief.initialHp
      );
    });

    it('能力上限が定義されている', () => {
      expect(GAME_BALANCE.player.statLimits.attackRange).toBeGreaterThan(0);
      expect(GAME_BALANCE.player.statLimits.moveSpeed).toBeGreaterThan(0);
      expect(GAME_BALANCE.player.statLimits.attackSpeed).toBeGreaterThan(0);
      expect(GAME_BALANCE.player.statLimits.healBonus).toBeGreaterThan(0);
    });
  });
});
