/**
 * 味方テンプレート関連の定数
 */
import type { CivType, AllyTemplate } from '../types';

/** 味方テンプレート */
export const ALT: Readonly<Record<CivType, readonly AllyTemplate[]>> = Object.freeze({
  tech: Object.freeze([
    Object.freeze({ n: '火の狩人', hp: 28, atk: 5, t: 'tech' as const }),
    Object.freeze({ n: '投石兵', hp: 22, atk: 6, t: 'tech' as const }),
  ]),
  life: Object.freeze([
    Object.freeze({ n: '回復役', hp: 32, atk: 2, t: 'life' as const, h: 1 }),
    Object.freeze({ n: '盾役', hp: 45, atk: 1, t: 'life' as const, tk: 1 }),
  ]),
  rit: Object.freeze([
    Object.freeze({ n: '狂戦士', hp: 18, atk: 9, t: 'rit' as const }),
    Object.freeze({ n: '生贄巫師', hp: 22, atk: 7, t: 'rit' as const }),
  ]),
});
