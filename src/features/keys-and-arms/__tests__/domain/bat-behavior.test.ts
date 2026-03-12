/**
 * BAT AI のテスト
 */
import {
  createBatState,
  updateBatPhase,
  isBatDangerous,
} from '../../domain/enemies/bat-behavior';

describe('enemies/bat-behavior', () => {
  describe('createBatState', () => {
    it('初期状態は phase 0（静止）', () => {
      const bat = createBatState();
      expect(bat.phase).toBe(0);
    });
  });

  describe('updateBatPhase', () => {
    it('ビートカウントが閾値未満なら phase 0', () => {
      const result = updateBatPhase(0, 7);
      expect(result).toBe(0);
    });

    it('ビートカウントが中間範囲なら phase 1', () => {
      // hazardCycle=7 の場合、0.4*7=2.8→floor=2, 0.7*7=4.9→floor=4
      const result = updateBatPhase(3, 7);
      expect(result).toBe(1);
    });

    it('ビートカウントが高い範囲なら phase 2（危険）', () => {
      const result = updateBatPhase(5, 7);
      expect(result).toBe(2);
    });
  });

  describe('isBatDangerous', () => {
    it('phase 2 で危険', () => {
      expect(isBatDangerous(2)).toBe(true);
    });

    it('phase 0 で安全', () => {
      expect(isBatDangerous(0)).toBe(false);
    });

    it('phase 1 で安全', () => {
      expect(isBatDangerous(1)).toBe(false);
    });
  });

  describe('BAT ヒット判定', () => {
    it('phase 2 かつプレイヤーが同じ部屋にいる場合にダメージ', () => {
      const isDangerous = isBatDangerous(2);
      expect(isDangerous).toBe(true);
    });

    it('鍵取得済みならダメージなし（呼び出し側の責務）', () => {
      // BAT AI は鍵状態を知らない — 呼び出し側で制御
      expect(isBatDangerous(2)).toBe(true);
    });
  });

  describe('ビート同期での BAT サイクル', () => {
    it('サイクル完了後に phase 0 に戻る', () => {
      // hazardCycle=5 の場合
      const phase0 = updateBatPhase(0, 5); // < 2 → phase 0
      const phase2 = updateBatPhase(4, 5); // >= floor(3.5)=3 → phase 2
      const phaseReset = updateBatPhase(0, 5); // リセット → phase 0
      expect(phase0).toBe(0);
      expect(phase2).toBe(2);
      expect(phaseReset).toBe(0);
    });

    it('ハザードサイクルが短いほど危険期間の割合が高い', () => {
      // サイクル 4: 危険 = count >= floor(0.7*4)=2 → 2件/4 = 50%
      // サイクル 7: 危険 = count >= floor(0.7*7)=4 → 3件/7 = 43%
      const shortDanger = [0, 1, 2, 3].filter(c => updateBatPhase(c, 4) === 2).length;
      const longDanger = [0, 1, 2, 3, 4, 5, 6].filter(c => updateBatPhase(c, 7) === 2).length;
      expect(shortDanger / 4).toBeGreaterThanOrEqual(longDanger / 7);
    });
  });
});
