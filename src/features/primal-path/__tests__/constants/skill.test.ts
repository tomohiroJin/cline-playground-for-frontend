/**
 * constants/skill.ts のテスト
 */
import { A_SKILLS, SFX_DEFS } from '../../constants/skill';

describe('constants/skill', () => {
  describe('A_SKILLS（アクティブスキル）', () => {
    it('4種類のスキルが定義されている', () => {
      expect(A_SKILLS).toHaveLength(4);
    });

    it('各スキルに必要なプロパティが揃っている', () => {
      A_SKILLS.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('nm');
        expect(s).toHaveProperty('fx');
        expect(s).toHaveProperty('cd');
      });
    });
  });

  describe('SFX_DEFS（SFX定義）', () => {
    it('主要なSFXが定義されている', () => {
      expect(SFX_DEFS).toHaveProperty('hit');
      expect(SFX_DEFS).toHaveProperty('crit');
      expect(SFX_DEFS).toHaveProperty('kill');
      expect(SFX_DEFS).toHaveProperty('heal');
    });
  });
});
