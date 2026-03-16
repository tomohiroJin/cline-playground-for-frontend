import { migrateMetaState } from '../../../presentation/hooks/use-persistence-sync';

describe('migrateMetaState', () => {
  describe('旧フィールド名の変換', () => {
    it('bestFl を bestFloor に変換する', () => {
      const result = migrateMetaState({ bestFl: 3, runs: 5 });
      expect(result.bestFloor).toBe(3);
      expect(result.bestFl).toBeUndefined();
    });

    it('clearedDiffs を clearedDifficulties に変換する', () => {
      const result = migrateMetaState({ clearedDiffs: ['easy', 'normal'] });
      expect(result.clearedDifficulties).toEqual(['easy', 'normal']);
      expect(result.clearedDiffs).toBeUndefined();
    });

    it('title を activeTitle に変換する', () => {
      const result = migrateMetaState({ title: 't01' });
      expect(result.activeTitle).toBe('t01');
      expect(result.title).toBeUndefined();
    });

    it('lastRun.ending を lastRun.endingId に変換する', () => {
      const result = migrateMetaState({ lastRun: { cause: 'escape', floor: 3, ending: 'standard', hp: 30, mn: 20, inf: 10 } });
      const lr = result.lastRun as Record<string, unknown>;
      expect(lr.endingId).toBe('standard');
      expect(lr.ending).toBeUndefined();
    });
  });

  describe('新フィールド名がすでに存在する場合', () => {
    it('bestFloor が既に存在する場合は bestFl を無視する', () => {
      const result = migrateMetaState({ bestFl: 2, bestFloor: 5 });
      expect(result.bestFloor).toBe(5);
    });

    it('clearedDifficulties が既に存在する場合は clearedDiffs を無視する', () => {
      const data = { clearedDiffs: ['easy'], clearedDifficulties: ['easy', 'normal'] };
      const result = migrateMetaState(data);
      expect(result.clearedDifficulties).toEqual(['easy', 'normal']);
    });
  });

  describe('新形式データの通過', () => {
    it('新形式のデータはそのまま通過する', () => {
      const data = { bestFloor: 4, clearedDifficulties: ['easy'], activeTitle: 't01', lastRun: { endingId: 'standard' } };
      const result = migrateMetaState(data);
      expect(result).toEqual(data);
    });
  });

  describe('エッジケース', () => {
    it('lastRun が null の場合はスキップする', () => {
      const result = migrateMetaState({ lastRun: null });
      expect(result.lastRun).toBeNull();
    });

    it('空オブジェクトはそのまま通過する', () => {
      expect(migrateMetaState({})).toEqual({});
    });
  });
});
