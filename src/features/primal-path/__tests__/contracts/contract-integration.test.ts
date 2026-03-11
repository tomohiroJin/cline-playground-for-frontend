/**
 * 契約の統合テスト
 *
 * ドメインサービスに適用された契約が正しく機能することを検証する。
 */
import { startBattle } from '../../domain/battle/battle-service';
import { applyEvo } from '../../domain/evolution/evolution-service';
import { applySkill } from '../../domain/skill/skill-service';
import { gameReducer } from '../../hooks/reducers/game-reducer';
import { makeRun, makeGameState } from '../test-helpers';
import type { Evolution } from '../../types';

const mockEvo: Evolution = {
  n: 'テスト進化', t: 'tech', d: 'テスト',
  e: { mhp: 10, atk: 5 }, r: 0, tags: [],
};

describe('契約の統合テスト', () => {
  describe('startBattle', () => {
    it('HP が負の状態で呼び出すと事前条件違反', () => {
      const run = makeRun({ hp: -1, mhp: 100 });
      expect(() => startBattle(run, false)).toThrow(/HP/);
    });

    it('正常な状態では事前条件が通る', () => {
      const run = makeRun({ hp: 50, mhp: 100 });
      expect(() => startBattle(run, false)).not.toThrow();
    });
  });

  describe('applyEvo', () => {
    it('進化数が上限を超えている状態で呼び出すと事前条件違反', () => {
      const run = makeRun({
        evs: [mockEvo, mockEvo, mockEvo],
        maxEvo: 2,
      });
      expect(() => applyEvo(run, mockEvo)).toThrow(/進化数/);
    });
  });

  describe('applySkill', () => {
    it('ATK が負の状態で呼び出すと事前条件違反', () => {
      const run = makeRun({ atk: -1 });
      expect(() => applySkill(run, 'fB')).toThrow(/ATK/);
    });
  });

  describe('gameReducer 不変条件', () => {
    it('HP が最大HP を超える状態になると不変条件違反', () => {
      // Arrange: hp > mhp の不正な RunState を BATTLE_TICK で注入
      const invalidRun = makeRun({ hp: 200, mhp: 100 });
      const state = makeGameState({ phase: 'battle' });

      // Act & Assert: BATTLE_TICK は nextRun をそのまま適用するため不変条件が検出される
      expect(() =>
        gameReducer(state, { type: 'BATTLE_TICK', nextRun: invalidRun }),
      ).toThrow(/HP.*maxHP/);
    });
  });
});
