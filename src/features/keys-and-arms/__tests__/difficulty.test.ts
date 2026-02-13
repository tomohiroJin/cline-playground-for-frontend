// @ts-nocheck
/**
 * Keys & Arms - 難易度設定のテスト
 */
import { Difficulty } from '../difficulty';

describe('Keys & Arms - 難易度設定', () => {
  // ── beatLength ───────────────────────────────────────

  describe('beatLength - ビート長', () => {
    it('ループ1で34フレーム', () => {
      expect(Difficulty.beatLength(1)).toBe(34);
    });

    it('ループ2で27フレーム', () => {
      expect(Difficulty.beatLength(2)).toBe(27);
    });

    it('ループ3で20フレーム', () => {
      expect(Difficulty.beatLength(3)).toBe(20);
    });

    it('ループ4以降は徐々に減少する', () => {
      // loop=4: max(14, 20-(4-3)*2) = max(14,18) = 18
      expect(Difficulty.beatLength(4)).toBe(18);
      // loop=5: max(14, 20-(5-3)*2) = max(14,16) = 16
      expect(Difficulty.beatLength(5)).toBe(16);
    });

    it('最低14フレームを下回らない', () => {
      expect(Difficulty.beatLength(10)).toBe(14);
      expect(Difficulty.beatLength(20)).toBe(14);
    });
  });

  // ── hazardCycle ──────────────────────────────────────

  describe('hazardCycle - ハザードサイクル', () => {
    it('ループ1、base6で5を返す', () => {
      // max(6-3, 6-1) = max(3,5) = 5
      expect(Difficulty.hazardCycle(1, 6)).toBe(5);
    });

    it('ループが高いとサイクルが短くなる', () => {
      expect(Difficulty.hazardCycle(3, 6)).toBe(3);
    });

    it('下限 base-3 を下回らない', () => {
      // max(6-3, 6-10) = max(3,-4) = 3
      expect(Difficulty.hazardCycle(10, 6)).toBe(3);
    });
  });

  // ── bossArmSpeed / bossArmRest ───────────────────────

  describe('bossArmSpeed - ボスアームの速度', () => {
    it('ループ1では3を返す', () => {
      expect(Difficulty.bossArmSpeed(1)).toBe(3);
    });

    it('ループ2以降では2を返す', () => {
      expect(Difficulty.bossArmSpeed(2)).toBe(2);
      expect(Difficulty.bossArmSpeed(5)).toBe(2);
    });
  });

  describe('bossArmRest - ボスアームの休憩時間', () => {
    it('ループ別に正しい値を返す', () => {
      expect(Difficulty.bossArmRest(1)).toBe(5);
      expect(Difficulty.bossArmRest(2)).toBe(4);
      expect(Difficulty.bossArmRest(3)).toBe(3);
      expect(Difficulty.bossArmRest(4)).toBe(2);
    });

    it('ループ5以上でも2を下回らない', () => {
      expect(Difficulty.bossArmRest(5)).toBe(2);
      expect(Difficulty.bossArmRest(10)).toBe(2);
    });
  });

  // ── grassGoal / grassEnemyMix ────────────────────────

  describe('grassGoal - ステージ2の目標キル数', () => {
    it('ループ1で14', () => {
      expect(Difficulty.grassGoal(1)).toBe(14);
    });

    it('ループ数に比例して増加する', () => {
      expect(Difficulty.grassGoal(2)).toBe(18);
      expect(Difficulty.grassGoal(3)).toBe(22);
    });
  });

  describe('grassEnemyMix - ステージ2の敵構成', () => {
    it('ループ1ではシフターのみ（ダッシャーなし）', () => {
      const mix = Difficulty.grassEnemyMix(1);
      expect(mix.shifter).toBe(0.15);
      expect(mix.dasher).toBe(0);
    });

    it('ループ2でダッシャーが登場する', () => {
      const mix = Difficulty.grassEnemyMix(2);
      expect(mix.shifter).toBe(0.25);
      expect(mix.dasher).toBe(0.3);
    });

    it('ループ3以降で最大確率になる', () => {
      const mix = Difficulty.grassEnemyMix(3);
      expect(mix.shifter).toBe(0.3);
      expect(mix.dasher).toBe(0.45);
    });

    it('ループ5以降もループ3と同じ値', () => {
      const mix = Difficulty.grassEnemyMix(5);
      expect(mix).toEqual({ shifter: 0.3, dasher: 0.45 });
    });
  });

  // ── cageMax ──────────────────────────────────────────

  describe('cageMax - ケージ進捗上限', () => {
    it('ループ1で65', () => {
      expect(Difficulty.cageMax(1)).toBe(65);
    });

    it('ループ数に比例して増加する', () => {
      expect(Difficulty.cageMax(2)).toBe(80);
      expect(Difficulty.cageMax(3)).toBe(95);
    });
  });

  // ── isTrueEnding ─────────────────────────────────────

  describe('isTrueEnding - 真エンディング判定', () => {
    it('ループ1-2ではfalse', () => {
      expect(Difficulty.isTrueEnding(1)).toBe(false);
      expect(Difficulty.isTrueEnding(2)).toBe(false);
    });

    it('ループ3以上でtrue', () => {
      expect(Difficulty.isTrueEnding(3)).toBe(true);
      expect(Difficulty.isTrueEnding(5)).toBe(true);
    });
  });

  // ── bossShields ──────────────────────────────────────

  describe('bossShields - ボスシールド数', () => {
    it('獲得0で1（ベース）', () => {
      expect(Difficulty.bossShields(0)).toBe(1);
    });

    it('獲得数に応じて増加する', () => {
      expect(Difficulty.bossShields(1)).toBe(2);
      expect(Difficulty.bossShields(3)).toBe(4);
    });

    it('上限5を超えない', () => {
      expect(Difficulty.bossShields(4)).toBe(5);
      expect(Difficulty.bossShields(10)).toBe(5);
    });
  });
});
