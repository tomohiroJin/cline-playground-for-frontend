/**
 * 互換型ヘルパーのテスト
 */
import { getPlayerStatuses, isStatusEffectId } from '../../../domain/models/compat';

describe('compat', () => {
  describe('isStatusEffectId', () => {
    it('有効なStatusEffectIdの場合にtrueを返す', () => {
      expect(isStatusEffectId('負傷')).toBe(true);
      expect(isStatusEffectId('混乱')).toBe(true);
      expect(isStatusEffectId('出血')).toBe(true);
      expect(isStatusEffectId('恐怖')).toBe(true);
      expect(isStatusEffectId('呪い')).toBe(true);
    });

    it('無効な文字列の場合にfalseを返す', () => {
      expect(isStatusEffectId('unknown')).toBe(false);
      expect(isStatusEffectId('')).toBe(false);
      expect(isStatusEffectId('特殊状態')).toBe(false);
    });
  });

  describe('getPlayerStatuses', () => {
    it('新型statusesがある場合はstatusesを返す', () => {
      // Arrange
      const player = { hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 5, statuses: ['負傷' as const, '混乱' as const] };

      // Act
      const result = getPlayerStatuses(player);

      // Assert
      expect(result).toEqual(['負傷', '混乱']);
    });

    it('旧型stのみの場合はstを返す', () => {
      // Arrange
      const player = { hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 5, st: ['負傷', '出血'] };

      // Act
      const result = getPlayerStatuses(player);

      // Assert
      expect(result).toEqual(['負傷', '出血']);
    });

    it('両方ない場合は空配列を返す', () => {
      // Arrange
      const player = { hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 5 };

      // Act
      const result = getPlayerStatuses(player);

      // Assert
      expect(result).toEqual([]);
    });

    it('statusesが優先される（両方存在する場合）', () => {
      // Arrange
      const player = {
        hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 5,
        statuses: ['呪い' as const],
        st: ['負傷'],
      };

      // Act
      const result = getPlayerStatuses(player);

      // Assert
      expect(result).toEqual(['呪い']);
    });
  });
});
