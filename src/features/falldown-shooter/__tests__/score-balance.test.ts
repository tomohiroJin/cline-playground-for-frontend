// Phase 3: スコアバランス調整のテスト
// 同時消しボーナスとライン消しスコアへのコンボ倍率適用をテスト

import { SIMULTANEOUS_LINE_BONUS } from '../constants';
import { CONFIG } from '../constants';

describe('SIMULTANEOUS_LINE_BONUS', () => {
  describe('定数定義', () => {
    it('1ライン消しのボーナス倍率が1.0であること', () => {
      expect(SIMULTANEOUS_LINE_BONUS[1]).toBe(1.0);
    });

    it('2ライン同時消しのボーナス倍率が1.5であること', () => {
      expect(SIMULTANEOUS_LINE_BONUS[2]).toBe(1.5);
    });

    it('3ライン同時消しのボーナス倍率が2.0であること', () => {
      expect(SIMULTANEOUS_LINE_BONUS[3]).toBe(2.0);
    });

    it('4ライン同時消しのボーナス倍率が3.0であること', () => {
      expect(SIMULTANEOUS_LINE_BONUS[4]).toBe(3.0);
    });
  });
});

describe('スコア計算式', () => {
  // スコア計算ヘルパー: 仕様書のスコア計算式を再現
  // ラインスコア = CONFIG.score.line × 消したライン数 × 同時消しボーナス × ステージ × 難易度倍率 × コンボ倍率
  const calculateLineScore = (
    clearedLines: number,
    stage: number,
    scoreMultiplier: number,
    comboMultiplier: number
  ): number => {
    const bonus = SIMULTANEOUS_LINE_BONUS[clearedLines] ?? 1.0;
    return Math.round(
      clearedLines * CONFIG.score.line * bonus * stage * scoreMultiplier * comboMultiplier
    );
  };

  describe('同時消しボーナスによるスコア計算', () => {
    it('1ライン消し（ステージ1、倍率1.0）で100点になること', () => {
      const score = calculateLineScore(1, 1, 1.0, 1.0);
      expect(score).toBe(100);
    });

    it('2ライン同時消し（ステージ1、倍率1.0）で300点になること', () => {
      const score = calculateLineScore(2, 1, 1.0, 1.0);
      expect(score).toBe(300);
    });

    it('3ライン同時消し（ステージ1、倍率1.0）で600点になること', () => {
      const score = calculateLineScore(3, 1, 1.0, 1.0);
      expect(score).toBe(600);
    });

    it('4ライン同時消し（ステージ1、倍率1.0）で1200点になること', () => {
      const score = calculateLineScore(4, 1, 1.0, 1.0);
      expect(score).toBe(1200);
    });
  });

  describe('コンボ倍率の適用', () => {
    it('1ライン消し（コンボ倍率1.5x）で150点になること', () => {
      const score = calculateLineScore(1, 1, 1.0, 1.5);
      expect(score).toBe(150);
    });

    it('2ライン同時消し（コンボ倍率2.0x）で600点になること', () => {
      const score = calculateLineScore(2, 1, 1.0, 2.0);
      expect(score).toBe(600);
    });
  });

  describe('バランス比較: 連続消し vs 同時消し', () => {
    it('2ライン同時消し（コンボなし）が1ライン×2回（コンボ2）より高得点になること', () => {
      // 1ライン × 2回（コンボ2、倍率1.5x）: 100 + 100×1.5 = 250点
      const sequentialScore = calculateLineScore(1, 1, 1.0, 1.0) + calculateLineScore(1, 1, 1.0, 1.5);
      // 2ライン同時（コンボなし、倍率1.0x）: 100×2×1.5 = 300点
      const simultaneousScore = calculateLineScore(2, 1, 1.0, 1.0);

      expect(simultaneousScore).toBeGreaterThan(sequentialScore);
    });
  });

  describe('ステージ倍率との組み合わせ', () => {
    it('ステージ2で2ライン同時消し（コンボ倍率1.5x）が正しく計算されること', () => {
      // 2 × 100 × 1.5(同時消し) × 2(ステージ) × 1.0(難易度) × 1.5(コンボ) = 900
      const score = calculateLineScore(2, 2, 1.0, 1.5);
      expect(score).toBe(900);
    });
  });
});
