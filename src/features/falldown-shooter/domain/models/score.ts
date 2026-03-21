// Score 値オブジェクト — スコア計算ロジックを一元管理する

import { CONFIG, SIMULTANEOUS_LINE_BONUS } from '../../constants';

/** ライン消しスコア計算のパラメータ */
export interface LineScoreParams {
  /** 消去ライン数 */
  clearedLines: number;
  /** 現在のステージ番号 */
  stage: number;
  /** 難易度によるスコア倍率 */
  scoreMultiplier: number;
  /** コンボ倍率 */
  comboMultiplier: number;
}

/** スコア計算ユーティリティ */
export const ScoreCalculator = {
  /**
   * ブロック破壊スコアを計算する
   * @param hitCount ヒット数
   * @param scoreMultiplier 難易度スコア倍率
   * @returns 計算されたスコア（0以上の整数）
   */
  calculateBlockScore(hitCount: number, scoreMultiplier: number): number {
    return Math.round(hitCount * CONFIG.score.block * scoreMultiplier);
  },

  /**
   * ライン消しスコアを計算する
   * 計算式: 消去ライン数 × 基本スコア × 同時消しボーナス × ステージ × 難易度倍率 × コンボ倍率
   */
  calculateLineScore(params: LineScoreParams): number {
    const { clearedLines, stage, scoreMultiplier, comboMultiplier } = params;
    if (clearedLines === 0) return 0;
    const simultaneousBonus = SIMULTANEOUS_LINE_BONUS[clearedLines] ?? 1.0;
    return Math.round(
      clearedLines * CONFIG.score.line * simultaneousBonus * stage * scoreMultiplier * comboMultiplier
    );
  },

  /**
   * スキル使用時のスコアを計算する
   * @param cellCount 破壊セル数
   * @returns 計算されたスコア
   */
  calculateSkillScore(cellCount: number): number {
    return cellCount * CONFIG.score.block;
  },
} as const;
