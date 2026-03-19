/**
 * 迷宮の残響 - TitleService（称号判定サービス）
 *
 * 称号の解放判定・アクティブ称号取得を提供する純粋関数群。
 * definitions.ts から抽出。
 */
import { TITLES } from '../constants/title-defs';
import type { TitleDef } from '../constants/title-defs';
import type { MetaState } from '../models/meta-state';

/** 解放済み称号を全取得する */
export const getUnlockedTitles = (meta: MetaState): TitleDef[] =>
  TITLES.filter(t => t.cond(meta));

/** アクティブ称号オブジェクトを取得する */
export const getActiveTitle = (meta: MetaState): TitleDef => {
  if (meta.activeTitle) {
    const found = TITLES.find(t => t.id === meta.activeTitle);
    if (found?.cond(meta)) return found;
  }
  const unlocked = getUnlockedTitles(meta);
  // TITLES は定数配列のため空になることはないが、型安全のため非アサーション演算子を使用
  return unlocked.at(-1) ?? TITLES.at(0)!;
};

export type { TitleDef };
