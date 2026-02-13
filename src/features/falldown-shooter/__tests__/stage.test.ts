import { Stage } from '../stage';
import { CONFIG } from '../constants';

describe('Stage', () => {
  describe('create', () => {
    test('初期状態のGameStateを生成すること', () => {
      const state = Stage.create(1, 0, 12, 18);
      expect(state.stage).toBe(1);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.linesNeeded).toBe(CONFIG.stages[0]);
      expect(state.playerY).toBe(16);
      expect(state.time).toBe(0);
      expect(state.grid.length).toBe(18);
      expect(state.grid[0].length).toBe(12);
      expect(state.blocks).toEqual([]);
      expect(state.bullets).toEqual([]);
    });

    test('スコアを引き継いで生成すること', () => {
      const state = Stage.create(2, 500, 12, 18);
      expect(state.stage).toBe(2);
      expect(state.score).toBe(500);
      expect(state.linesNeeded).toBe(CONFIG.stages[1]);
    });
  });

  describe('isFinal', () => {
    test('最終ステージでtrueを返すこと', () => {
      expect(Stage.isFinal(CONFIG.stages.length)).toBe(true);
    });

    test('最終ステージ未満でfalseを返すこと', () => {
      expect(Stage.isFinal(1)).toBe(false);
    });
  });
});
