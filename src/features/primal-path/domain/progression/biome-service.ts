/**
 * バイオームサービス
 *
 * バイオーム選択、適用、エンドレスモードのスケーリングを担当する。
 */
import type { RunState, BiomeId } from '../../types';
import { ENDLESS_LINEAR_SCALE, ENDLESS_EXP_BASE, ENDLESS_AM_REFLECT_RATIO } from '../../constants';
import { deepCloneRun } from '../shared/utils';

/** バイオーム選択の自動判定 */
export function pickBiomeAuto(r: RunState): { biome: BiomeId; needSelection: boolean; options: BiomeId[] } {
  if (r.cB === 0) {
    return { biome: r.bms[0], needSelection: false, options: [] };
  }
  const rem = r.bms.filter((_, i) => i >= r.cB) as BiomeId[];
  if (rem.length <= 1) {
    return { biome: rem[0] || r.bms[2], needSelection: false, options: [] };
  }
  return { biome: rem[0], needSelection: true, options: rem };
}

/** 選択バイオームを適用する */
export function applyBiomeSelection(r: RunState, biome: BiomeId): RunState {
  const next = deepCloneRun(r);
  next.cBT = biome;
  next.cB++;
  next.cW = 0;
  return next;
}

/** 最初のバイオームを適用する */
export function applyFirstBiome(r: RunState): RunState {
  const next = deepCloneRun(r);
  next.cBT = next.bms[0];
  next.cB = 1;
  return next;
}

/** 最後のバイオームを自動適用する */
export function applyAutoLastBiome(r: RunState): RunState {
  const next = deepCloneRun(r);
  const rem = next.bms.filter((_, i) => i >= next.cB) as BiomeId[];
  next.cBT = rem[0] || next.bms[2];
  next.cB++;
  return next;
}

/** エンドレスモードの敵スケーリング（線形 + 指数の複合） */
export function calcEndlessScale(wave: number): number {
  if (wave <= 0) return 1;
  return (1 + ENDLESS_LINEAR_SCALE * wave) * Math.pow(ENDLESS_EXP_BASE, wave);
}

/** エンドレスモードの敵スケーリング（aM反映版） */
export function calcEndlessScaleWithAM(wave: number, playerAM: number): number {
  const base = calcEndlessScale(wave);
  if (wave <= 0) return base;
  const amExcess = Math.max(0, playerAM - 1);
  const amReflect = 1 + amExcess * ENDLESS_AM_REFLECT_RATIO;
  return base * amReflect;
}

/** エンドレスモードのリループ処理（3バイオーム踏破後に再開） */
export function applyEndlessLoop(r: RunState): RunState {
  const next = deepCloneRun(r);
  next.endlessWave = (next.endlessWave ?? 0) + 1;
  next.bc = 0;
  next.cW = 0;
  next.cB = 0;
  // バイオームをリシャッフル
  const bms: BiomeId[] = ['grassland', 'glacier', 'volcano'];
  for (let i = bms.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bms[i], bms[j]] = [bms[j], bms[i]];
  }
  next.bms = bms;
  next.cBT = bms[0];
  return next;
}
