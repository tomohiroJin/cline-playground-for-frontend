/**
 * 原始進化録 - PRIMAL PATH - progression-reducer テスト
 */
import { progressionReducer } from '../../../hooks/reducers/progression-reducer';
import { makeRun, makeGameState, makeSave } from '../../test-helpers';
import { DIFFS, LOOP_SCALE_FACTOR } from '../../../constants';

describe('progressionReducer', () => {
  describe('START_RUN', () => {
    it('ランを開始して evo フェーズに遷移する', () => {
      const save = makeSave({ runs: 0 });
      const state = makeGameState({ save });
      const next = progressionReducer(state, { type: 'START_RUN', di: 0, loopOverride: 0 });
      expect(next.phase).toBe('evo');
      expect(next.run).not.toBeNull();
      expect(next.save.runs).toBe(1);
    });

    it('loopOverride に応じたスケーリングが適用される', () => {
      const save = makeSave({ loopCount: 3, runs: 0 });
      const state = makeGameState({ save });
      const next = progressionReducer(state, { type: 'START_RUN', di: 0, loopOverride: 2 });
      expect(next.run!.loopCount).toBe(2);
      const expectedHm = DIFFS[0].hm * (1 + 2 * LOOP_SCALE_FACTOR);
      expect(next.run!.dd.hm).toBeCloseTo(expectedHm);
    });
  });

  describe('GO_DIFF / GO_HOW / GO_TREE', () => {
    it('GO_DIFF で diff フェーズに遷移する', () => {
      const state = makeGameState();
      const next = progressionReducer(state, { type: 'GO_DIFF' });
      expect(next.phase).toBe('diff');
    });

    it('GO_HOW で how フェーズに遷移する', () => {
      const state = makeGameState();
      const next = progressionReducer(state, { type: 'GO_HOW' });
      expect(next.phase).toBe('how');
    });

    it('GO_TREE で tree フェーズに遷移する', () => {
      const state = makeGameState();
      const next = progressionReducer(state, { type: 'GO_TREE' });
      expect(next.phase).toBe('tree');
    });
  });

  describe('PREPARE_BIOME_SELECT', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = progressionReducer(state, { type: 'PREPARE_BIOME_SELECT' });
      expect(next).toEqual(state);
    });

    it('biome フェーズに遷移する', () => {
      const run = makeRun();
      const state = makeGameState({ run });
      const next = progressionReducer(state, { type: 'PREPARE_BIOME_SELECT' });
      expect(next.phase).toBe('biome');
    });
  });

  describe('PICK_BIOME', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = progressionReducer(state, { type: 'PICK_BIOME', biome: 'grassland' });
      expect(next).toEqual(state);
    });

    it('バイオーム選択後に evo フェーズに遷移する', () => {
      const run = makeRun({ bc: 0 });
      const state = makeGameState({ run });
      const next = progressionReducer(state, { type: 'PICK_BIOME', biome: 'glacier' });
      expect(next.phase).toBe('evo');
      expect(next.evoPicks.length).toBeGreaterThan(0);
    });
  });

  describe('GO_FINAL_BOSS', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = progressionReducer(state, { type: 'GO_FINAL_BOSS' });
      expect(next).toEqual(state);
    });

    it('di >= 3 で fe 未設定の場合はゲームオーバー', () => {
      const run = makeRun({ di: 3, fe: null });
      const state = makeGameState({ run });
      const next = progressionReducer(state, { type: 'GO_FINAL_BOSS' });
      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(false);
    });
  });

  describe('BIOME_CLEARED', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = progressionReducer(state, { type: 'BIOME_CLEARED' });
      expect(next).toEqual(state);
    });
  });

  describe('SET_PHASE', () => {
    it('指定したフェーズに遷移する', () => {
      const state = makeGameState();
      const next = progressionReducer(state, { type: 'SET_PHASE', phase: 'diff' });
      expect(next.phase).toBe('diff');
    });
  });

  describe('START_CHALLENGE', () => {
    it('endless チャレンジを開始できる', () => {
      const save = makeSave({ bones: 100, runs: 0 });
      const state = makeGameState({ save });
      const next = progressionReducer(state, { type: 'START_CHALLENGE', challengeId: 'endless', di: 0 });
      expect(next.run).not.toBeNull();
      expect(next.run!.isEndless).toBe(true);
      expect(next.run!.challengeId).toBe('endless');
    });

    it('存在しないチャレンジIDでは状態が変化しない', () => {
      const state = makeGameState();
      const next = progressionReducer(state, { type: 'START_CHALLENGE', challengeId: 'nonexistent', di: 0 });
      expect(next).toEqual(state);
    });
  });
});
