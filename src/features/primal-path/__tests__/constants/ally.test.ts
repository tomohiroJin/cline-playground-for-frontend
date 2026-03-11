/**
 * constants/ally.ts のテスト
 */
import { ALT } from '../../constants/ally';

describe('constants/ally', () => {
  it('3つの文明タイプの味方テンプレートが定義されている', () => {
    expect(ALT).toHaveProperty('tech');
    expect(ALT).toHaveProperty('life');
    expect(ALT).toHaveProperty('rit');
  });

  it('各文明に複数の味方テンプレートが存在する', () => {
    Object.values(ALT).forEach(allies => {
      expect(allies.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('各味方テンプレートにn, hp, atk, t が揃っている', () => {
    Object.values(ALT).forEach(allies => {
      allies.forEach(a => {
        expect(a).toHaveProperty('n');
        expect(a).toHaveProperty('hp');
        expect(a).toHaveProperty('atk');
        expect(a).toHaveProperty('t');
      });
    });
  });
});
