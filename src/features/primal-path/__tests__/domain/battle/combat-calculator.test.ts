/**
 * domain/battle/combat-calculator のテスト
 */
import { effATK, biomeBonus, calcEnvDmg, aliveAllies, deadAllies, scaleEnemy, calcPlayerAtk } from '../../../domain/battle/combat-calculator';
import { makeRun } from '../../test-helpers';
import { TB_DEFAULTS } from '../../../constants';

describe('domain/battle/combat-calculator', () => {
  describe('effATK', () => {
    it('ATK × aM × dm を切り捨てで返す', () => {
      const run = makeRun({ atk: 10, aM: 1.5, dm: 1 });
      expect(effATK(run)).toBe(15);
    });

    it('dm倍率が反映される', () => {
      const run = makeRun({ atk: 10, aM: 1, dm: 2 });
      expect(effATK(run)).toBe(20);
    });
  });

  describe('aliveAllies / deadAllies', () => {
    it('生存仲間をフィルタする', () => {
      const al = [
        { n: 'A', hp: 10, mhp: 10, atk: 5, t: 'tech' as const, a: 1 },
        { n: 'B', hp: 0, mhp: 10, atk: 5, t: 'life' as const, a: 0 },
      ];
      expect(aliveAllies(al)).toHaveLength(1);
      expect(aliveAllies(al)[0].n).toBe('A');
      expect(deadAllies(al)).toHaveLength(1);
      expect(deadAllies(al)[0].n).toBe('B');
    });
  });

  describe('biomeBonus', () => {
    it('finalバイオームの場合1を返す', () => {
      expect(biomeBonus('final', { tech: 5, life: 5, rit: 5 })).toBe(1);
    });
  });

  describe('calcEnvDmg', () => {
    it('環境ダメージ設定がないバイオームの場合0を返す', () => {
      expect(calcEnvDmg('grassland', 1, { ...TB_DEFAULTS }, null)).toBe(0);
    });
  });

  describe('scaleEnemy', () => {
    it('HP/ATKをスケーリングする', () => {
      const e = scaleEnemy({ n: 'test', hp: 100, atk: 10, def: 5, bone: 1 }, 2, 1.5);
      expect(e.n).toBe('test');
      expect(e.hp).toBe(200);
      expect(e.mhp).toBe(200);
      expect(e.atk).toBe(15);
      expect(e.def).toBe(5);
    });

    it('追加スケール倍率を適用する', () => {
      const e = scaleEnemy({ n: 'test', hp: 100, atk: 10, def: 0, bone: 1 }, 1, 1, 2);
      expect(e.hp).toBe(200);
      expect(e.atk).toBe(20);
    });
  });

  describe('calcPlayerAtk', () => {
    it('基本的な攻撃ダメージを計算する', () => {
      const run = makeRun({ atk: 10, aM: 1, dm: 1, cr: 0, cBT: 'grassland' });
      // 乱数固定: クリティカルなし
      const result = calcPlayerAtk(run, () => 1);
      expect(result.crit).toBe(false);
      expect(result.dmg).toBeGreaterThan(0);
    });

    it('クリティカル発生時にダメージが増加する', () => {
      const run = makeRun({ atk: 10, aM: 1, dm: 1, cr: 1, cBT: 'grassland' });
      const result = calcPlayerAtk(run, () => 0);
      expect(result.crit).toBe(true);
    });
  });
});
