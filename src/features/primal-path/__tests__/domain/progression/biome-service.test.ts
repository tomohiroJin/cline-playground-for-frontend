/**
 * domain/progression/biome-service のテスト
 */
import {
  pickBiomeAuto, applyBiomeSelection, applyFirstBiome, applyAutoLastBiome,
  calcEndlessScale, calcEndlessScaleWithAM, applyEndlessLoop,
} from '../../../domain/progression/biome-service';
import { makeRun } from '../../test-helpers';

describe('domain/progression/biome-service', () => {
  describe('pickBiomeAuto', () => {
    it('最初のバイオームは自動選択される', () => {
      const run = makeRun({ cB: 0, bms: ['grassland', 'glacier', 'volcano'] });
      const result = pickBiomeAuto(run);
      expect(result.needSelection).toBe(false);
      expect(result.biome).toBe('grassland');
    });

    it('2番目のバイオームは選択が必要', () => {
      const run = makeRun({ cB: 1, bms: ['grassland', 'glacier', 'volcano'] });
      const result = pickBiomeAuto(run);
      expect(result.needSelection).toBe(true);
      expect(result.options).toHaveLength(2);
    });

    it('最後のバイオームは自動選択される', () => {
      const run = makeRun({ cB: 2, bms: ['grassland', 'glacier', 'volcano'] });
      const result = pickBiomeAuto(run);
      expect(result.needSelection).toBe(false);
    });
  });

  describe('applyBiomeSelection', () => {
    it('選択バイオームを設定してcBを増加する', () => {
      const run = makeRun({ cB: 1, cW: 5 });
      const result = applyBiomeSelection(run, 'glacier');
      expect(result.cBT).toBe('glacier');
      expect(result.cB).toBe(2);
      expect(result.cW).toBe(0);
    });
  });

  describe('applyFirstBiome', () => {
    it('最初のバイオームを設定する', () => {
      const run = makeRun({ cB: 0, bms: ['volcano', 'glacier', 'grassland'] });
      const result = applyFirstBiome(run);
      expect(result.cBT).toBe('volcano');
      expect(result.cB).toBe(1);
    });
  });

  describe('calcEndlessScale', () => {
    it('wave 0の場合1を返す', () => {
      expect(calcEndlessScale(0)).toBe(1);
    });

    it('waveが増加するとスケールが増加する', () => {
      expect(calcEndlessScale(2)).toBeGreaterThan(calcEndlessScale(1));
    });
  });

  describe('calcEndlessScaleWithAM', () => {
    it('aM=1の場合はベーススケールと同じ', () => {
      const base = calcEndlessScale(2);
      expect(calcEndlessScaleWithAM(2, 1)).toBe(base);
    });

    it('aM>1の場合はベーススケールより大きい', () => {
      const base = calcEndlessScale(2);
      expect(calcEndlessScaleWithAM(2, 2)).toBeGreaterThan(base);
    });
  });

  describe('applyAutoLastBiome', () => {
    it('残り1つのバイオームを自動適用する', () => {
      // Arrange
      const run = makeRun({ cB: 2, bms: ['grassland', 'glacier', 'volcano'] });

      // Act
      const result = applyAutoLastBiome(run);

      // Assert
      expect(result.cBT).toBe('volcano');
      expect(result.cB).toBe(3);
    });

    it('残りがない場合はbms[2]にフォールバックする', () => {
      // Arrange
      const run = makeRun({ cB: 3, bms: ['grassland', 'glacier', 'volcano'] });

      // Act
      const result = applyAutoLastBiome(run);

      // Assert
      expect(result.cBT).toBe('volcano');
      expect(result.cB).toBe(4);
    });
  });

  describe('applyEndlessLoop', () => {
    it('リループ時にbc/cW/cBがリセットされる', () => {
      const run = makeRun({ bc: 3, cW: 5, cB: 3, endlessWave: 0 });
      const result = applyEndlessLoop(run);
      expect(result.bc).toBe(0);
      expect(result.cW).toBe(0);
      expect(result.cB).toBe(0);
      expect(result.endlessWave).toBe(1);
    });

    it('バイオーム順序がリシャッフルされる', () => {
      const run = makeRun({ bc: 3, cW: 5, cB: 3, endlessWave: 0, bms: ['grassland', 'glacier', 'volcano'] });
      const result = applyEndlessLoop(run);
      expect(result.bms).toHaveLength(3);
      // 3つのバイオームが含まれている
      expect(result.bms).toContain('grassland');
      expect(result.bms).toContain('glacier');
      expect(result.bms).toContain('volcano');
    });

    it('cBTが新しいバイオーム順序の最初に設定される', () => {
      const run = makeRun({ bc: 3, cW: 5, cB: 3, endlessWave: 0 });
      const result = applyEndlessLoop(run);
      expect(result.cBT).toBe(result.bms[0]);
    });

    it('元のRunStateを変更しない', () => {
      const run = makeRun({ bc: 3, cW: 5, cB: 3, endlessWave: 0 });
      applyEndlessLoop(run);
      expect(run.bc).toBe(3);
      expect(run.endlessWave).toBe(0);
    });
  });
});
