/**
 * 原始進化録 - PRIMAL PATH - evolution-reducer テスト
 */
import { evolutionReducer } from '../../../hooks/reducers/evolution-reducer';
import { makeRun, makeGameState } from '../../test-helpers';
import { EVOS } from '../../../constants';

describe('evolutionReducer', () => {
  describe('SELECT_EVO', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = evolutionReducer(state, { type: 'SELECT_EVO', evo: EVOS[0] });
      expect(next).toEqual(state);
    });

    it('maxEvo に達している場合、バトルへ直行する', () => {
      // Arrange
      const evo = EVOS[0];
      const run = makeRun({
        maxEvo: 5,
        evs: [evo, evo, evo, evo, evo],
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' });

      // Act
      const next = evolutionReducer(state, { type: 'SELECT_EVO', evo });

      // Assert
      expect(next.phase).toBe('battle');
      expect(next.run!.evs.length).toBe(5);
      expect(next.run!.log.some(l => l.x.includes('進化上限'))).toBe(true);
    });

    it('maxEvo 未設定の場合は通常通り進化が適用される', () => {
      const evo = EVOS[0];
      const run = makeRun({
        evs: [evo, evo],
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' });
      const next = evolutionReducer(state, { type: 'SELECT_EVO', evo });
      expect(next.phase).toBe('battle');
      expect(next.run!.evs.length).toBe(3);
    });
  });

  describe('SKIP_EVO', () => {
    it('バトルフェーズに遷移する', () => {
      const run = makeRun({
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'evo' });
      const next = evolutionReducer(state, { type: 'SKIP_EVO' });
      expect(next.phase).toBe('battle');
      expect(next.run!.en).not.toBeNull();
    });

    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = evolutionReducer(state, { type: 'SKIP_EVO' });
      expect(next).toEqual(state);
    });
  });

  describe('SHOW_EVO', () => {
    it('進化選択画面に遷移し新しい進化候補がロールされる', () => {
      const run = makeRun();
      const state = makeGameState({ run, phase: 'battle' });
      const next = evolutionReducer(state, { type: 'SHOW_EVO' });
      expect(next.phase).toBe('evo');
      expect(next.evoPicks.length).toBeGreaterThan(0);
    });
  });

  describe('PROCEED_AFTER_AWK', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = evolutionReducer(state, { type: 'PROCEED_AFTER_AWK' });
      expect(next).toEqual(state);
    });

    it('覚醒がない場合はバトルを開始する', () => {
      const run = makeRun({
        en: { n: 'テスト', hp: 10, mhp: 10, atk: 5, def: 0, bone: 3 },
      });
      const state = makeGameState({ run, phase: 'awakening' });
      const next = evolutionReducer(state, { type: 'PROCEED_AFTER_AWK' });
      expect(next.phase).toBe('battle');
      expect(next.pendingAwk).toBeNull();
    });
  });

  describe('PROCEED_TO_BATTLE', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null, pendingAwk: null });
      const next = evolutionReducer(state, { type: 'PROCEED_TO_BATTLE' });
      expect(next).toEqual(state);
    });

    it('pendingAwk が null の場合は状態が変化しない', () => {
      const run = makeRun();
      const state = makeGameState({ run, pendingAwk: null });
      const next = evolutionReducer(state, { type: 'PROCEED_TO_BATTLE' });
      expect(next).toEqual(state);
    });
  });
});
