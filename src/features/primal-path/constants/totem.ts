/**
 * 始祖トーテム定数
 */
import type { TotemDef } from '../types';

/** 始祖トーテム一覧（Phase 1: 基本3種） */
export const TOTEMS: readonly TotemDef[] = Object.freeze([
  Object.freeze({
    id: 'blood' as const, nm: '血の祖', ic: '🩸', curve: 'front' as const, tag: 'wild' as const,
    desc: '最大HP-20% ATK+20% 会心+5%（序盤バースト）', unlock: 0,
    effect: Object.freeze({ mhpMul: 0.8, atkMul: 1.2, crAdd: 0.05 }),
  }),
  Object.freeze({
    id: 'flame' as const, nm: '炎の祖', ic: '🔥', curve: 'combo' as const, tag: 'fire' as const,
    desc: '火傷ダメージ+25%（火傷伝播コンボ）', unlock: 0,
    effect: Object.freeze({ burnDmgMul: 1.25 }),
  }),
  Object.freeze({
    id: 'pack' as const, nm: '群れの祖', ic: '🏕️', curve: 'scaling' as const, tag: 'tribe' as const,
    desc: '仲間枠+1 開始仲間1体 仲間ATK+10%（部族スケール）', unlock: 0,
    effect: Object.freeze({
      mxaAdd: 1, allyAtkBonus: 0.1,
      startAlly: Object.freeze({ n: '群れの戦士', hp: 30, atk: 6, t: 'life' as const }),
    }),
  }),
  Object.freeze({
    id: 'rock' as const, nm: '岩の祖', ic: '🛡️', curve: 'combo' as const, tag: 'shield' as const,
    desc: 'DEF+4 環境ダメージ-30%（反射タンク）', unlock: 2,
    effect: Object.freeze({ defAdd: 4, envDmgR: 0.3 }),
  }),
  Object.freeze({
    id: 'spirit' as const, nm: '霊の祖', ic: '👻', curve: 'scaling' as const, tag: 'spirit' as const,
    desc: '覚醒要求-1 覚醒効果+25%（覚醒スケール）', unlock: 5,
    effect: Object.freeze({ awkReqReduce: 1, awkMul: 0.25 }),
  }),
  Object.freeze({
    id: 'ember' as const, nm: '種火の祖', ic: '🌰', curve: 'scaling' as const, tag: 'hunt' as const,
    desc: '開始ATK-30% 踏破ごと全ステ+12%（極・晩成）', unlock: 10,
    effect: Object.freeze({ atkMul: 0.7, biomeScale: 0.12 }),
  }),
]);
