/**
 * SPIDER AI のテスト
 */
import {
  updateSpiderPhase,
  isSpiderDangerous,
} from '../../domain/enemies/spider-behavior';

describe('enemies/spider-behavior', () => {
  describe('updateSpiderPhase', () => {
    it('ビートカウントが閾値未満なら phase 0（安全）', () => {
      const result = updateSpiderPhase(0, 7);
      expect(result).toBe(0);
    });

    it('ビートカウントが中間範囲なら phase 1（下降中）', () => {
      const result = updateSpiderPhase(3, 7);
      expect(result).toBe(1);
    });

    it('ビートカウントが高い範囲なら phase 2（底部・危険）', () => {
      const result = updateSpiderPhase(5, 7);
      expect(result).toBe(2);
    });
  });

  describe('isSpiderDangerous', () => {
    it('phase 2 で危険', () => {
      expect(isSpiderDangerous(2)).toBe(true);
    });

    it('phase 0 で安全', () => {
      expect(isSpiderDangerous(0)).toBe(false);
    });

    it('phase 1 で安全', () => {
      expect(isSpiderDangerous(1)).toBe(false);
    });
  });

  describe('サイクル動作', () => {
    it('hazardCycle を通じてフェーズが循環する', () => {
      const cycle = 5;
      const phases = Array.from({ length: cycle }, (_, i) => updateSpiderPhase(i, cycle));
      expect(phases[0]).toBe(0);
      expect(phases[cycle - 1]).toBe(2);
    });

    it('全フェーズが 0, 1, 2 のいずれかである', () => {
      for (let i = 0; i < 10; i++) {
        const phase = updateSpiderPhase(i, 10);
        expect([0, 1, 2]).toContain(phase);
      }
    });
  });
});
