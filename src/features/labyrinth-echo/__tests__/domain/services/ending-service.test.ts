/**
 * EndingService（エンディング判定サービス）のテスト
 */
import {
  determineEnding,
  getDeathFlavor,
  getDeathTip,
} from '../../../domain/services/ending-service';
import { createTestPlayer, createTestDifficulty } from '../../helpers/factories';

describe('EndingService', () => {
  describe('determineEnding', () => {
    describe('難易度固有エンディング', () => {
      it('修羅で高ステータス生還時にabyss_perfectを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 40, statuses: [] });
        const diff = createTestDifficulty({ id: 'abyss' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('abyss_perfect');
      });

      it('修羅で通常生還時にabyss_clearを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 20, maxHp: 55, mn: 10, maxMn: 35, inf: 5, statuses: [] });
        const diff = createTestDifficulty({ id: 'abyss' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('abyss_clear');
      });

      it('求道者クリア時にhard_clearを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 20, maxHp: 55, mn: 10, maxMn: 35, inf: 5, statuses: [] });
        const diff = createTestDifficulty({ id: 'hard' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('hard_clear');
      });
    });

    describe('汎用エンディング', () => {
      it('HP/MN高く情報値高い場合にperfectを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 40, statuses: [] });
        const diff = createTestDifficulty({ id: 'normal' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('perfect');
      });

      it('情報値が高い場合にscholarを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 20, maxHp: 55, mn: 10, maxMn: 35, inf: 45, statuses: [] });
        const diff = createTestDifficulty({ id: 'normal' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('scholar');
      });

      it('HP25%以下の場合にbatteredを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 10, maxHp: 55, mn: 30, maxMn: 35, inf: 5, statuses: [] });
        const diff = createTestDifficulty({ id: 'normal' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('battered');
      });

      it('条件にマッチしない場合はstandardを返す', () => {
        // Arrange
        const player = createTestPlayer({ hp: 30, maxHp: 55, mn: 20, maxMn: 35, inf: 5, statuses: [] });
        const diff = createTestDifficulty({ id: 'normal' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('standard');
      });
    });

    describe('優先度', () => {
      it('難易度エンディングが汎用エンディングより優先される', () => {
        // Arrange — 修羅 + perfect条件を同時に満たす
        const player = createTestPlayer({ hp: 50, maxHp: 55, mn: 30, maxMn: 35, inf: 40, statuses: [] });
        const diff = createTestDifficulty({ id: 'abyss' });

        // Act
        const ending = determineEnding(player, [], diff);

        // Assert
        expect(ending.id).toBe('abyss_perfect');
      });
    });
  });

  describe('getDeathFlavor', () => {
    it('体力消耗のフレーバーテキストを返す', () => {
      // Act
      const flavor = getDeathFlavor('体力消耗', 0);

      // Assert
      expect(flavor).toBeTruthy();
      expect(typeof flavor).toBe('string');
    });

    it('精神崩壊のフレーバーテキストを返す', () => {
      const flavor = getDeathFlavor('精神崩壊', 0);
      expect(flavor).toBeTruthy();
    });

    it('ラン数でテキストが回転する', () => {
      // Arrange & Act
      const flavors = [0, 1, 2].map(i => getDeathFlavor('体力消耗', i));

      // Assert — 少なくとも3種類のテキストがある
      expect(new Set(flavors).size).toBe(3);
    });
  });

  describe('getDeathTip', () => {
    it('体力消耗のヒントを返す', () => {
      const tip = getDeathTip('体力消耗', 1);
      expect(tip).toBeTruthy();
    });

    it('精神崩壊のヒントを返す', () => {
      const tip = getDeathTip('精神崩壊', 1);
      expect(tip).toBeTruthy();
    });
  });
});
