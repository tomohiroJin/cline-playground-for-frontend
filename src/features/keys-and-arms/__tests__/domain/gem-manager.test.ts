/**
 * 宝石管理のテスト
 */
import {
  createPedestalState,
  placeGem,
  removeGem,
  applyShield,
  breakShield,
  isAllGemsPlaced,
} from '../../domain/items/gem-manager';

describe('items/gem-manager', () => {
  describe('createPedestalState', () => {
    it('6 つの空の台座を生成する', () => {
      const peds = createPedestalState();
      expect(peds).toEqual([0, 0, 0, 0, 0, 0]);
    });
  });

  describe('placeGem', () => {
    it('空の台座に宝石を設置できる', () => {
      const peds = createPedestalState();
      const result = placeGem(peds, 0);
      expect(result[0]).toBe(1);
    });

    it('既に宝石がある台座には設置不可（変化なし）', () => {
      let peds = createPedestalState();
      peds = placeGem(peds, 0);
      const result = placeGem(peds, 0);
      expect(result[0]).toBe(1);
    });
  });

  describe('removeGem', () => {
    it('宝石を除去して台座を空にする', () => {
      let peds = createPedestalState();
      peds = placeGem(peds, 0);
      const result = removeGem(peds, 0);
      expect(result[0]).toBe(0);
    });
  });

  describe('applyShield', () => {
    it('宝石にシールドを付与する（1 → 2）', () => {
      let peds = createPedestalState();
      peds = placeGem(peds, 0);
      const result = applyShield(peds, 0);
      expect(result[0]).toBe(2);
    });
  });

  describe('breakShield', () => {
    it('シールドを破壊して宝石に戻す（2 → 1）', () => {
      let peds = createPedestalState();
      peds = placeGem(peds, 0);
      peds = applyShield(peds, 0);
      const result = breakShield(peds, 0);
      expect(result[0]).toBe(1);
    });
  });

  describe('isAllGemsPlaced', () => {
    it('全台座に宝石があれば true', () => {
      const peds = [1, 1, 1, 1, 1, 1];
      expect(isAllGemsPlaced(peds)).toBe(true);
    });

    it('シールド付きも含めて true', () => {
      const peds = [1, 2, 1, 2, 1, 1];
      expect(isAllGemsPlaced(peds)).toBe(true);
    });

    it('空の台座があれば false', () => {
      const peds = [1, 0, 1, 1, 1, 1];
      expect(isAllGemsPlaced(peds)).toBe(false);
    });
  });
});
