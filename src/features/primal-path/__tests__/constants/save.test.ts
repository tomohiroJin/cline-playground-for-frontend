/**
 * constants/save.ts のテスト
 */
import {
  FRESH_SAVE, SAVE_KEY, STATS_KEY, ACHIEVEMENTS_KEY, AGGREGATE_KEY, MAX_RUN_STATS,
} from '../../constants/save';

describe('constants/save', () => {
  describe('FRESH_SAVE（初期セーブデータ）', () => {
    it('初期値が正しく設定されている', () => {
      expect(FRESH_SAVE.bones).toBe(0);
      expect(FRESH_SAVE.clears).toBe(0);
      expect(FRESH_SAVE.runs).toBe(0);
      expect(FRESH_SAVE.loopCount).toBe(0);
    });
  });

  describe('ストレージキー', () => {
    it('各キーが文字列として定義されている', () => {
      expect(typeof SAVE_KEY).toBe('string');
      expect(typeof STATS_KEY).toBe('string');
      expect(typeof ACHIEVEMENTS_KEY).toBe('string');
      expect(typeof AGGREGATE_KEY).toBe('string');
    });
  });

  describe('MAX_RUN_STATS', () => {
    it('ラン統計保持上限が50である', () => {
      expect(MAX_RUN_STATS).toBe(50);
    });
  });
});
