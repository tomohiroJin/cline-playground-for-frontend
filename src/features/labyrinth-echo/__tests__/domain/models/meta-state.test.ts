/**
 * MetaState 集約ルートのテスト
 */
import { createMetaState } from '../../../domain/models/meta-state';
import type { LastRunInfo } from '../../../domain/models/meta-state';
import { FRESH_META } from '../../../domain/constants/config';

describe('MetaState', () => {
  describe('createMetaState', () => {
    describe('正常系', () => {
      it('デフォルト値で初期MetaStateを生成する', () => {
        // Arrange & Act
        const meta = createMetaState();

        // Assert
        expect(meta.runs).toBe(0);
        expect(meta.escapes).toBe(0);
        expect(meta.kp).toBe(0);
        expect(meta.unlocked).toEqual([]);
        expect(meta.bestFloor).toBe(0);
        expect(meta.totalEvents).toBe(0);
        expect(meta.endings).toEqual([]);
        expect(meta.clearedDifficulties).toEqual([]);
        expect(meta.totalDeaths).toBe(0);
        expect(meta.lastRun).toBeNull();
        expect(meta.activeTitle).toBeNull();
      });

      it('FRESH_METAとデフォルト値が一致する（DRY）', () => {
        // Arrange & Act
        const meta = createMetaState();

        // Assert — createMetaState の値は FRESH_META と同一であること
        expect(meta).toEqual(FRESH_META);
      });

      it('部分的な上書きが可能である', () => {
        // Arrange & Act
        const meta = createMetaState({
          runs: 5,
          kp: 10,
          unlocked: ['u1', 'u2'],
        });

        // Assert
        expect(meta.runs).toBe(5);
        expect(meta.kp).toBe(10);
        expect(meta.unlocked).toEqual(['u1', 'u2']);
        expect(meta.escapes).toBe(0);
      });

      it('lastRunにLastRunInfoを設定可能である', () => {
        // Arrange
        const lastRun: LastRunInfo = {
          cause: '体力消耗',
          floor: 3,
          endingId: null,
          hp: 0,
          mn: 20,
          inf: 15,
        };

        // Act
        const meta = createMetaState({ lastRun });

        // Assert
        expect(meta.lastRun).toEqual(lastRun);
        expect(meta.lastRun?.cause).toBe('体力消耗');
      });
    });
  });
});
