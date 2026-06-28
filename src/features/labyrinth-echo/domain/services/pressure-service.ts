/**
 * 迷宮の残響 - PressureService（残響圧サービス）
 *
 * 残響圧を「実効難易度」に畳む純粋関数群。戦闘系のシグネチャを変えずに
 * 圧によるエスカレーションを難易度の後段として適用する。
 */
import { clamp } from '../../../../utils/math-utils';
import { PRESSURE_MAX, DMG_MULT_PER_LEVEL } from '../constants/escalation-defs';
import type { DifficultyDef, DifficultyModifiers } from '../models/difficulty';

export { PRESSURE_MAX };

/** 残響圧によるエスカレーション増分を求める（圧0なら全項目0） */
export const escalationFromPressure = (pressure: number): DifficultyModifiers => {
  const p = Math.max(0, pressure);
  if (p === 0) {
    return {
      hpMod: 0,
      mnMod: 0,
      drainMod: 0,
      dmgMult: 0,
    };
  }
  const halfSteps = Math.floor(p / 2);
  const drainSteps = Math.floor(p / 3);
  return {
    hpMod: (-halfSteps * 2) || 0,
    mnMod: (-halfSteps * 2) || 0,
    drainMod: (-drainSteps) || 0,
    dmgMult: Number((DMG_MULT_PER_LEVEL * p).toFixed(2)),
  };
};

/**
 * 残響圧を難易度に畳んだ実効難易度を返す。
 * modifiers にエスカレーションを加算する。id/name/rewards 等は基底のまま。
 */
export const applyPressureToDifficulty = (diff: DifficultyDef, pressure: number): DifficultyDef => {
  if (pressure <= 0) return diff;
  const e = escalationFromPressure(pressure);
  return {
    ...diff,
    modifiers: {
      hpMod: diff.modifiers.hpMod + e.hpMod,
      mnMod: diff.modifiers.mnMod + e.mnMod,
      drainMod: diff.modifiers.drainMod + e.drainMod,
      dmgMult: Number((diff.modifiers.dmgMult + e.dmgMult).toFixed(2)),
    },
  };
};

/** echoDepth から選択可能な最大残響圧を求める（0..PRESSURE_MAX にクランプ） */
export const maxSelectablePressure = (echoDepth: number): number =>
  clamp(echoDepth, 0, PRESSURE_MAX);
