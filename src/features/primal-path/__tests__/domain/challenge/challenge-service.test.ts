/**
 * domain/challenge/challenge-service のテスト
 */
import { applyChallenge } from '../../../domain/challenge/challenge-service';
import { makeRun } from '../../test-helpers';
import type { ChallengeDef } from '../../../types';

describe('domain/challenge/challenge-service', () => {
  describe('applyChallenge', () => {
    it('HP倍率チャレンジを適用する', () => {
      const run = makeRun({ hp: 80, mhp: 80 });
      const challenge: ChallengeDef = {
        id: 'test_hp',
        name: 'HP半減',
        description: 'HP半減チャレンジ',
        modifiers: [{ type: 'hp_multiplier', value: 0.5 }],
        icon: '💔',
      };
      const result = applyChallenge(run, challenge);
      expect(result.mhp).toBe(40);
      expect(result.hp).toBeLessThanOrEqual(40);
      expect(result.challengeId).toBe('test_hp');
    });

    it('回復禁止チャレンジを適用する', () => {
      const run = makeRun();
      const challenge: ChallengeDef = {
        id: 'test_no_heal',
        name: '回復禁止',
        description: '回復禁止チャレンジ',
        modifiers: [{ type: 'no_healing' }],
        icon: '🚫',
      };
      const result = applyChallenge(run, challenge);
      expect(result.noHealing).toBe(true);
    });

    it('エンドレスチャレンジを適用する', () => {
      const run = makeRun();
      const challenge: ChallengeDef = {
        id: 'test_endless',
        name: 'エンドレス',
        description: 'エンドレスチャレンジ',
        modifiers: [{ type: 'endless' }],
        icon: '♾️',
      };
      const result = applyChallenge(run, challenge);
      expect(result.isEndless).toBe(true);
      expect(result.endlessWave).toBe(0);
    });
  });
});
