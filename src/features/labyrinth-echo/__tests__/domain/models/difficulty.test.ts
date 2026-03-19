/**
 * Difficulty 値オブジェクトのテスト
 */
import type { DifficultyId, DifficultyDef } from '../../../domain/models/difficulty';

describe('Difficulty', () => {
  describe('DifficultyId 型', () => {
    it('有効な難易度IDが使用可能である', () => {
      // Arrange
      const validIds: DifficultyId[] = ['easy', 'normal', 'hard', 'abyss'];

      // Assert
      expect(validIds).toHaveLength(4);
    });
  });

  describe('DifficultyDef 型', () => {
    it('必須フィールドを持つDifficultyDefが作成可能である', () => {
      // Arrange & Act
      const diff: DifficultyDef = {
        id: 'normal',
        name: '挑戦者',
        subtitle: '標準難度',
        color: '#818cf8',
        icon: '⚔',
        description: '均衡の取れた難易度。',
        modifiers: {
          hpMod: 0,
          mnMod: 0,
          drainMod: -1,
          dmgMult: 1,
        },
        rewards: {
          kpOnDeath: 1,
          kpOnWin: 3,
        },
      };

      // Assert
      expect(diff.id).toBe('normal');
      expect(diff.modifiers.hpMod).toBe(0);
      expect(diff.rewards.kpOnWin).toBe(3);
    });
  });
});
