/**
 * 迷宮の残響 - ManageUnlocksUseCase テスト
 */
import { purchaseUnlock } from '../../../application/use-cases/manage-unlocks';
import { createMetaState } from '../../../domain/models/meta-state';

describe('purchaseUnlock', () => {
  describe('正常購入', () => {
    it('KP十分かつ未購入の場合に購入できる', () => {
      // Arrange: u1(cost: 3)
      const meta = createMetaState({ kp: 10 });

      // Act
      const result = purchaseUnlock({ unlockId: 'u1', meta });

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedMeta.kp).toBe(10 - 3);
      expect(result.updatedMeta.unlocked).toContain('u1');
    });

    it('購入後にKPが正確に減算される', () => {
      // Arrange: u5(cost: 6)
      const meta = createMetaState({ kp: 20 });

      // Act
      const result = purchaseUnlock({ unlockId: 'u5', meta });

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedMeta.kp).toBe(20 - 6);
    });
  });

  describe('KP不足時の拒否', () => {
    it('KPが足りない場合に購入が拒否される', () => {
      // Arrange: u1(cost: 3), KP: 2
      const meta = createMetaState({ kp: 2 });

      // Act
      const result = purchaseUnlock({ unlockId: 'u1', meta });

      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.updatedMeta.kp).toBe(2); // 変更なし
    });
  });

  describe('既購入アイテムの拒否', () => {
    it('既に購入済みの場合に拒否される', () => {
      // Arrange
      const meta = createMetaState({ kp: 100, unlocked: ['u1'] });

      // Act
      const result = purchaseUnlock({ unlockId: 'u1', meta });

      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('ゲート制限の検証', () => {
    it('ゲート制限を満たさない場合に拒否される', () => {
      // Arrange: u21(gate: abyss) — 修羅クリア必須
      const meta = createMetaState({ kp: 100, clearedDifficulties: [] });

      // Act
      const result = purchaseUnlock({ unlockId: 'u21', meta });

      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('ゲート制限を満たす場合に購入できる', () => {
      // Arrange: u21(gate: abyss, cost: 35)
      const meta = createMetaState({ kp: 100, clearedDifficulties: ['abyss'] });

      // Act
      const result = purchaseUnlock({ unlockId: 'u21', meta });

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedMeta.unlocked).toContain('u21');
    });
  });

  describe('不明なアンロックID', () => {
    it('存在しないIDの場合に拒否される', () => {
      // Arrange
      const meta = createMetaState({ kp: 100 });

      // Act
      const result = purchaseUnlock({ unlockId: 'unknown_id', meta });

      // Assert
      expect(result.success).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('metaの他のフィールド保持', () => {
    it('購入成功時にmeta.unlocked以外は既存値が維持される', () => {
      // Arrange
      const meta = createMetaState({
        kp: 50, runs: 10, escapes: 3, unlocked: ['u2'],
      });

      // Act
      const result = purchaseUnlock({ unlockId: 'u1', meta });

      // Assert
      expect(result.updatedMeta.runs).toBe(10);
      expect(result.updatedMeta.escapes).toBe(3);
      expect(result.updatedMeta.unlocked).toContain('u2'); // 既存のu2も残る
      expect(result.updatedMeta.unlocked).toContain('u1'); // 新規u1が追加
    });
  });
});
