/**
 * 文明システムユーティリティ
 *
 * 文明レベルの取得・比較など、文明に関する共通ロジックを提供する。
 */
import type { RunState, CivLevels, CivType } from '../../types';
import { CIV_KEYS } from '../../constants';

/** 3文明のレベルをオブジェクトとして取得する */
export function civLvs(r: RunState): CivLevels {
  return { tech: r.cT, life: r.cL, rit: r.cR };
}

/** 最小の文明レベルを返す */
export function civMin(r: RunState): number {
  return Math.min(r.cT, r.cL, r.cR);
}

/** 指定文明のレベルを返す */
export function civLv(r: RunState, t: CivType): number {
  return r[CIV_KEYS[t]];
}

/** 最もレベルの高い文明タイプを返す（タイブレーク: tech優先） */
export function dominantCiv(r: RunState): CivType {
  if (r.cT >= r.cL && r.cT >= r.cR) return 'tech';
  if (r.cL >= r.cR) return 'life';
  return 'rit';
}
