/**
 * domain/evolution/synergy-service のテスト
 */
import { calcSynergies, applySynergyBonuses } from '../../../domain/evolution/synergy-service';
import type { Evolution } from '../../../types';

describe('domain/evolution/synergy-service', () => {
  describe('calcSynergies', () => {
    it('タグが2つ以上の場合にシナジーが発動する', () => {
      const evos: Evolution[] = [
        { n: 'A', t: 'tech', e: { atk: 1 }, d: '', r: 0, tags: ['fire'] },
        { n: 'B', t: 'tech', e: { atk: 1 }, d: '', r: 0, tags: ['fire'] },
      ];
      const result = calcSynergies(evos);
      const fireSynergy = result.find(s => s.tag === 'fire');
      expect(fireSynergy).toBeDefined();
      expect(fireSynergy!.tier).toBe(1);
    });

    it('タグが3つ以上の場合にTier2になる', () => {
      const evos: Evolution[] = [
        { n: 'A', t: 'tech', e: { atk: 1 }, d: '', r: 0, tags: ['fire'] },
        { n: 'B', t: 'life', e: { atk: 1 }, d: '', r: 0, tags: ['fire'] },
        { n: 'C', t: 'rit', e: { atk: 1 }, d: '', r: 0, tags: ['fire'] },
      ];
      const result = calcSynergies(evos);
      const fireSynergy = result.find(s => s.tag === 'fire');
      expect(fireSynergy).toBeDefined();
      expect(fireSynergy!.tier).toBe(2);
    });

    it('タグがない進化はシナジーに影響しない', () => {
      const evos: Evolution[] = [
        { n: 'A', t: 'tech', e: { atk: 1 }, d: '', r: 0 },
      ];
      const result = calcSynergies(evos);
      expect(result).toEqual([]);
    });
  });

  describe('applySynergyBonuses', () => {
    it('シナジーがない場合はゼロボーナスを返す', () => {
      const result = applySynergyBonuses([]);
      expect(result.atkBonus).toBe(0);
      expect(result.defBonus).toBe(0);
      expect(result.burnMul).toBe(1);
    });
  });
});
