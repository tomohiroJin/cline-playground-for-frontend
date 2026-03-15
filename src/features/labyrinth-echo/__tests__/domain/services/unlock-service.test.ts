/**
 * UnlockService（アンロック計算サービス）のテスト
 */
import {
  computeFx,
  createNewPlayer,
  canPurchaseUnlock,
  checkAutoUnlocks,
} from '../../../domain/services/unlock-service';
import { createTestFx, createTestDifficulty } from '../../helpers/factories';
import { createMetaState } from '../../../domain/models/meta-state';
import { FX_DEFAULTS } from '../../../domain/models/unlock';

describe('UnlockService', () => {
  describe('computeFx', () => {
    describe('正常系', () => {
      it('アンロックなしの場合はデフォルト値を返す', () => {
        // Arrange & Act
        const fx = computeFx([]);

        // Assert
        expect(fx).toEqual(FX_DEFAULTS);
      });

      it('加算効果が正しく集約される', () => {
        // Arrange — u2: hpBonus: 5
        // Act
        const fx = computeFx(['u2']);

        // Assert
        expect(fx.hpBonus).toBe(5);
      });

      it('乗算効果が正しく集約される', () => {
        // Arrange — u4: infoMult: 1.1, u14: infoMult: 1.15
        // Act
        const fx = computeFx(['u4', 'u14']);

        // Assert
        expect(fx.infoMult).toBeCloseTo(1.1 * 1.15);
      });

      it('ブール効果が正しく集約される', () => {
        // Arrange — u6: dangerSense: true
        // Act
        const fx = computeFx(['u6']);

        // Assert
        expect(fx.dangerSense).toBe(true);
      });

      it('複合効果が正しく集約される', () => {
        // Arrange — u26: hpBonus: 12, mentalBonus: 10
        // Act
        const fx = computeFx(['u26']);

        // Assert
        expect(fx.hpBonus).toBe(12);
        expect(fx.mentalBonus).toBe(10);
      });
    });

    describe('境界値', () => {
      it('存在しないIDは無視される', () => {
        // Arrange & Act
        const fx = computeFx(['nonexistent']);

        // Assert
        expect(fx).toEqual(FX_DEFAULTS);
      });
    });
  });

  describe('createNewPlayer', () => {
    describe('正常系', () => {
      it('基本難易度（normal）でプレイヤーが生成される', () => {
        // Arrange
        const diff = createTestDifficulty();
        const fx = createTestFx();

        // Act
        const player = createNewPlayer(diff, fx);

        // Assert
        expect(player.hp).toBe(55); // BASE_HP(55) + hpBonus(0) + hpMod(0)
        expect(player.maxHp).toBe(55);
        expect(player.mn).toBe(35); // BASE_MN(35) + mentalBonus(0) + mnMod(0)
        expect(player.maxMn).toBe(35);
        expect(player.inf).toBe(5); // BASE_INF(5) + infoBonus(0)
        expect(player.statuses).toEqual([]);
      });

      it('FX効果が反映される', () => {
        // Arrange
        const diff = createTestDifficulty();
        const fx = createTestFx({ hpBonus: 10, mentalBonus: 5, infoBonus: 3 });

        // Act
        const player = createNewPlayer(diff, fx);

        // Assert
        expect(player.hp).toBe(65); // 55 + 10
        expect(player.mn).toBe(40); // 35 + 5
        expect(player.inf).toBe(8); // 5 + 3
      });

      it('難易度修正が反映される', () => {
        // Arrange
        const diff = createTestDifficulty({ hpMod: -15, mnMod: -12 });
        const fx = createTestFx();

        // Act
        const player = createNewPlayer(diff, fx);

        // Assert
        expect(player.hp).toBe(40); // 55 - 15
        expect(player.mn).toBe(23); // 35 - 12
      });
    });
  });

  describe('canPurchaseUnlock', () => {
    describe('正常系', () => {
      it('KPが十分で未購入なら購入可能', () => {
        // Arrange
        const meta = createMetaState({ kp: 10, unlocked: [] });

        // Act
        const result = canPurchaseUnlock('u1', meta);

        // Assert
        expect(result.purchasable).toBe(true);
      });

      it('KP不足の場合は購入不可', () => {
        // Arrange
        const meta = createMetaState({ kp: 1, unlocked: [] });

        // Act
        const result = canPurchaseUnlock('u1', meta); // cost: 3

        // Assert
        expect(result.purchasable).toBe(false);
        expect(result.reason).toBeDefined();
      });

      it('既に購入済みの場合は購入不可', () => {
        // Arrange
        const meta = createMetaState({ kp: 100, unlocked: ['u1'] });

        // Act
        const result = canPurchaseUnlock('u1', meta);

        // Assert
        expect(result.purchasable).toBe(false);
      });

      it('ゲート制限（修羅クリア必須）が未達の場合は購入不可', () => {
        // Arrange
        const meta = createMetaState({ kp: 100, unlocked: [], clearedDifficulties: [] });

        // Act
        const result = canPurchaseUnlock('u21', meta); // gate: "abyss"

        // Assert
        expect(result.purchasable).toBe(false);
      });

      it('ゲート制限が達成済みなら購入可能', () => {
        // Arrange
        const meta = createMetaState({ kp: 100, unlocked: [], clearedDifficulties: ['abyss'] });

        // Act
        const result = canPurchaseUnlock('u21', meta);

        // Assert
        expect(result.purchasable).toBe(true);
      });
    });
  });

  describe('checkAutoUnlocks', () => {
    it('トロフィー条件を満たすアンロックが返される', () => {
      // Arrange — u31: req: "easy"
      const meta = createMetaState({
        clearedDifficulties: ['easy'],
        unlocked: [],
      });

      // Act
      const newUnlocks = checkAutoUnlocks(meta);

      // Assert
      expect(newUnlocks).toContain('u31');
    });

    it('実績条件を満たすアンロックが返される', () => {
      // Arrange — u36: runs >= 20
      const meta = createMetaState({
        runs: 25,
        unlocked: [],
      });

      // Act
      const newUnlocks = checkAutoUnlocks(meta);

      // Assert
      expect(newUnlocks).toContain('u36');
    });

    it('既にアンロック済みのものは含まれない', () => {
      // Arrange
      const meta = createMetaState({
        clearedDifficulties: ['easy'],
        unlocked: ['u31'],
      });

      // Act
      const newUnlocks = checkAutoUnlocks(meta);

      // Assert
      expect(newUnlocks).not.toContain('u31');
    });
  });
});
