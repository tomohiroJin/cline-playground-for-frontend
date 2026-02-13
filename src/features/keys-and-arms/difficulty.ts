// @ts-nocheck
/**
 * Keys & Arms - 難易度パラメータ
 *
 * engine.ts から抽出した純粋関数群。
 * ゲームバランスに関する全パラメータを管理する。
 */

/** 値を範囲内にクランプ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** DbC アサーション（テスト時にはエラーを投げる） */
const assert = (cond, msg = 'Assertion failed') => { if (!cond) throw new Error(msg); };

export const Difficulty = {
  /** Beat length in ticks for a given loop (lower = faster) */
  beatLength(loop) {
    assert(loop >= 1, 'loop must be >= 1');
    if (loop <= 3) return Math.max(20, 34 - (loop - 1) * 7);
    return Math.max(14, 20 - (loop - 3) * 2);
  },

  /** Hazard cycle period for cave traps/enemies. Floor = base - 3 */
  hazardCycle(loop, base) {
    assert(base >= 3, 'base period must be >= 3');
    return Math.max(base - 3, base - loop);
  },

  /** Boss arm speed (beats per move) for a given loop */
  bossArmSpeed(loop) { return loop <= 1 ? 3 : 2; },

  /** Boss arm rest time for a given loop */
  bossArmRest(loop) {
    return [5, 4, 3, 2][clamp(loop - 1, 0, 3)];
  },

  /** Stage 2 enemy goal count */
  grassGoal(loop) { return 10 + loop * 4; },

  /** Stage 2 enemy composition probabilities → {shifterChance, dasherChance} */
  grassEnemyMix(loop) {
    if (loop === 1) return { shifter: .15, dasher: 0 };
    if (loop === 2) return { shifter: .25, dasher: .3 };
    return { shifter: .3, dasher: .45 };
  },

  /** Cage max progress for a given loop */
  cageMax(loop) { return 50 + loop * 15; },

  /** Is this loop the true ending? */
  isTrueEnding(loop) { return loop >= 3; },

  /** Shield count for boss stage: base 1 + earned from Stage 2 */
  bossShields(earned) { return Math.min(5, 1 + earned); }
};
