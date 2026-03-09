/**
 * constants/achievement.ts のテスト
 */
import { ACHIEVEMENTS, CHALLENGES } from '../../constants/achievement';

describe('constants/achievement', () => {
  describe('ACHIEVEMENTS（実績）', () => {
    it('15個の実績が定義されている', () => {
      expect(ACHIEVEMENTS).toHaveLength(15);
    });

    it('各実績にid, name, condition が揃っている', () => {
      ACHIEVEMENTS.forEach(a => {
        expect(a).toHaveProperty('id');
        expect(a).toHaveProperty('name');
        expect(a).toHaveProperty('condition');
      });
    });

    it('実績IDが一意である', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('CHALLENGES（チャレンジ）', () => {
    it('4種類のチャレンジが定義されている', () => {
      expect(CHALLENGES).toHaveLength(4);
    });

    it('各チャレンジにid, name, modifiers が揃っている', () => {
      CHALLENGES.forEach(c => {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('modifiers');
      });
    });
  });
});
