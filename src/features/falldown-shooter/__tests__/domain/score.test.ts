// Score 値オブジェクトのテスト

import { ScoreCalculator } from '../../domain/models/score';
import { CONFIG } from '../../constants';

describe('ScoreCalculator', () => {
  describe('calculateBlockScore', () => {
    test('ヒット数とスコア倍率からブロック破壊スコアを計算すること', () => {
      // Arrange
      const hitCount = 3;
      const scoreMultiplier = 1.0;

      // Act
      const score = ScoreCalculator.calculateBlockScore(hitCount, scoreMultiplier);

      // Assert
      expect(score).toBe(hitCount * CONFIG.score.block * scoreMultiplier);
    });

    test('スコア倍率1.5xで正しく計算されること', () => {
      // Arrange
      const hitCount = 2;
      const scoreMultiplier = 1.5;

      // Act
      const score = ScoreCalculator.calculateBlockScore(hitCount, scoreMultiplier);

      // Assert
      expect(score).toBe(Math.round(hitCount * CONFIG.score.block * scoreMultiplier));
    });

    test('ヒット数0の場合0を返すこと', () => {
      expect(ScoreCalculator.calculateBlockScore(0, 1.0)).toBe(0);
    });
  });

  describe('calculateLineScore', () => {
    test('1ライン消し（ステージ1、倍率1.0）で100点になること', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 1,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.0,
      });
      expect(score).toBe(100);
    });

    test('2ライン同時消し（ステージ1、倍率1.0）で300点になること', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 2,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.0,
      });
      expect(score).toBe(300);
    });

    test('3ライン同時消し（ステージ1、倍率1.0）で600点になること', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 3,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.0,
      });
      expect(score).toBe(600);
    });

    test('4ライン同時消し（ステージ1、倍率1.0）で1200点になること', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 4,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.0,
      });
      expect(score).toBe(1200);
    });

    test('コンボ倍率が適用されること', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 1,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.5,
      });
      expect(score).toBe(150);
    });

    test('ステージ倍率とコンボ倍率が同時に適用されること', () => {
      // 2 × 100 × 1.5(同時消し) × 2(ステージ) × 1.0(難易度) × 1.5(コンボ) = 900
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 2,
        stage: 2,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.5,
      });
      expect(score).toBe(900);
    });

    test('消去ライン数0の場合0を返すこと', () => {
      const score = ScoreCalculator.calculateLineScore({
        clearedLines: 0,
        stage: 1,
        scoreMultiplier: 1.0,
        comboMultiplier: 1.0,
      });
      expect(score).toBe(0);
    });
  });

  describe('calculateSkillScore', () => {
    test('セル数からスキルスコアを計算すること', () => {
      const score = ScoreCalculator.calculateSkillScore(5);
      expect(score).toBe(5 * CONFIG.score.block);
    });

    test('セル数0の場合0を返すこと', () => {
      expect(ScoreCalculator.calculateSkillScore(0)).toBe(0);
    });
  });
});
