/**
 * 原始進化録 - PRIMAL PATH - meta-reducer テスト
 */
import { metaReducer } from '../../../hooks/reducers/meta-reducer';
import { makeRun, makeGameState, makeSave } from '../../test-helpers';
import { FRESH_SAVE, TREE as TREE_DATA } from '../../../constants';
import { calcBoneReward } from '../../../game-logic';

describe('metaReducer', () => {
  describe('LOAD_SAVE', () => {
    it('セーブデータを展開する', () => {
      const state = makeGameState();
      const save = makeSave({ bones: 999 });
      const next = metaReducer(state, { type: 'LOAD_SAVE', save });
      expect(next.save.bones).toBe(999);
    });
  });

  describe('BUY_TREE_NODE', () => {
    it('存在しないノードIDでは状態が変化しない', () => {
      const state = makeGameState({ save: makeSave({ bones: 100 }) });
      const next = metaReducer(state, { type: 'BUY_TREE_NODE', nodeId: 'non_existent' });
      expect(next.save.bones).toBe(100);
    });

    it('骨が不足している場合は購入できない', () => {
      const firstNode = TREE_DATA[0];
      if (!firstNode) return;
      const state = makeGameState({ save: makeSave({ bones: 0 }) });
      const next = metaReducer(state, { type: 'BUY_TREE_NODE', nodeId: firstNode.id });
      expect(next.save.bones).toBe(0);
    });

    it('既に購入済みのノードは重複購入できない', () => {
      const firstNode = TREE_DATA[0];
      if (!firstNode) return;
      const state = makeGameState({
        save: makeSave({ bones: 999, tree: { [firstNode.id]: 1 } }),
      });
      const next = metaReducer(state, { type: 'BUY_TREE_NODE', nodeId: firstNode.id });
      expect(next.save.bones).toBe(999);
    });
  });

  describe('RETURN_TO_TITLE', () => {
    it('タイトルに戻り run/finalMode/gameResult がリセットされる', () => {
      const state = makeGameState({ run: makeRun(), finalMode: true, gameResult: true });
      const next = metaReducer(state, { type: 'RETURN_TO_TITLE' });
      expect(next.phase).toBe('title');
      expect(next.run).toBeNull();
      expect(next.finalMode).toBe(false);
      expect(next.gameResult).toBeNull();
    });
  });

  describe('GAME_OVER', () => {
    it('battle フェーズ以外では状態が変化しない', () => {
      const state = makeGameState({ run: makeRun(), phase: 'evo' });
      const next = metaReducer(state, { type: 'GAME_OVER', won: false });
      expect(next).toEqual(state);
    });

    it('敗北時に over フェーズに遷移し骨が加算される', () => {
      const run = makeRun({ bE: 50 });
      const state = makeGameState({ run, phase: 'battle', save: makeSave({ bones: 100 }) });
      const next = metaReducer(state, { type: 'GAME_OVER', won: false });
      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(false);
      expect(next.save.bones).toBeGreaterThanOrEqual(100);
    });
  });

  describe('RESET_SAVE', () => {
    it('FRESH_SAVE と同じ構造にリセットされる', () => {
      const state = makeGameState({
        save: makeSave({ bones: 500, clears: 10, runs: 20 }),
      });
      const next = metaReducer(state, { type: 'RESET_SAVE' });
      expect(next.save.bones).toBe(0);
      expect(next.save.clears).toBe(0);
      expect(next.save.runs).toBe(0);
    });
  });

  describe('RECORD_RUN_END', () => {
    it('ラン終了時に獲得ボーンが save.bones に加算される', () => {
      const run = makeRun({ bE: 50, bb: 0 });
      const state = makeGameState({ run, save: makeSave({ bones: 100 }) });
      const next = metaReducer(state, { type: 'RECORD_RUN_END', won: false });
      expect(next.save.bones).toBeGreaterThan(100);
    });

    it('勝利時はボーナス込みで加算される', () => {
      const run = makeRun({ bE: 50, bb: 0 });
      const state = makeGameState({ run, save: makeSave({ bones: 0 }) });
      const nextLose = metaReducer(state, { type: 'RECORD_RUN_END', won: false });
      const nextWin = metaReducer(state, { type: 'RECORD_RUN_END', won: true });
      expect(nextWin.save.bones).toBeGreaterThan(nextLose.save.bones);
    });
  });

  describe('REVIVE_ALLY', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = metaReducer(state, { type: 'REVIVE_ALLY', allyIndex: 0, pct: 50 });
      expect(next).toEqual(state);
    });
  });

  describe('SKIP_REVIVE', () => {
    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const next = metaReducer(state, { type: 'SKIP_REVIVE' });
      expect(next).toEqual(state);
    });
  });

  describe('ENDLESS_CONTINUE', () => {
    it('リループして evo に遷移する', () => {
      const run = makeRun({
        bc: 3, isEndless: true, endlessWave: 1,
        bms: ['grassland', 'glacier', 'volcano'],
        cBT: 'volcano', cB: 3,
      });
      const state = makeGameState({ run, phase: 'endless_checkpoint' });
      const next = metaReducer(state, { type: 'ENDLESS_CONTINUE' });
      expect(next.phase).toBe('evo');
      expect(next.run!.endlessWave).toBe(2);
      expect(next.run!.bc).toBe(0);
    });
  });

  describe('ENDLESS_RETIRE', () => {
    it('over に遷移し骨が加算される', () => {
      const run = makeRun({ bE: 50, bb: 10 });
      const state = makeGameState({
        run, phase: 'endless_checkpoint',
        save: makeSave({ bones: 100 }),
      });
      const next = metaReducer(state, { type: 'ENDLESS_RETIRE' });
      expect(next.phase).toBe('over');
      expect(next.gameResult).toBe(false);
      const expectedBone = calcBoneReward(run, false);
      expect(next.save.bones).toBe(100 + expectedBone);
    });
  });
});
