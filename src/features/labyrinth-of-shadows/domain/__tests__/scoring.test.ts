import { calculateKeyScore, calculateVictoryScore, calculateCombo } from '../services/scoring';

describe('domain/services/scoring', () => {
  describe('calculateKeyScore', () => {
    test('コンボ1倍で基本スコア100を返す', () => {
      expect(calculateKeyScore(1)).toBe(100);
    });

    test('コンボ3倍で300を返す', () => {
      expect(calculateKeyScore(3)).toBe(300);
    });
  });

  describe('calculateVictoryScore', () => {
    test('残り時間に応じたボーナスを計算する', () => {
      // Arrange: 残り時間 50000ms
      // Act & Assert: floor(50000/100) + 500 = 500 + 500 = 1000
      expect(calculateVictoryScore(50000)).toBe(1000);
    });

    test('残り時間0の場合は勝利ボーナスのみ', () => {
      expect(calculateVictoryScore(0)).toBe(500);
    });

    test('残り時間の小数は切り捨てられる', () => {
      // floor(150/100) + 500 = 1 + 500 = 501
      expect(calculateVictoryScore(150)).toBe(501);
    });
  });

  describe('calculateCombo', () => {
    test('時間窓内の場合、コンボが増加する', () => {
      // Arrange: 最後の鍵取得から5000ms後（窓は10000ms）
      expect(calculateCombo(1, 15000, 10000)).toBe(2);
    });

    test('時間窓外の場合、コンボが1にリセットされる', () => {
      // Arrange: 最後の鍵取得から15000ms後（窓は10000ms）
      expect(calculateCombo(3, 25000, 10000)).toBe(1);
    });

    test('ちょうど時間窓の境界ではリセットされる', () => {
      // Arrange: ちょうど10000ms後（< ではないので false）
      expect(calculateCombo(2, 20000, 10000)).toBe(1);
    });

    test('初回取得（lastKeyTime=0, gameTime=0）はコンボにならない', () => {
      // gameTime(0) - lastKeyTime(0) = 0 < 10000 なのでコンボ
      expect(calculateCombo(0, 0, 0)).toBe(1);
    });
  });
});
