/**
 * 迷宮の残響 - 状態異常定義
 *
 * 各状態異常の視覚情報とターン経過効果を定義する。
 */
import type { StatusEffectId } from '../models/player';
import type { StatusEffectDef } from '../models/status-effect';

/** 状態異常メタ情報 */
export const STATUS_META: Readonly<Record<StatusEffectId, StatusEffectDef>> = Object.freeze({
  "負傷": {
    id: "負傷",
    visual: { primaryColor: "#f87171", bgColor: "rgba(248,113,113,0.08)", borderColor: "rgba(248,113,113,0.18)" },
    tick: null,
  },
  "混乱": {
    id: "混乱",
    visual: { primaryColor: "#c084fc", bgColor: "rgba(192,132,252,0.08)", borderColor: "rgba(192,132,252,0.18)" },
    tick: null,
  },
  "出血": {
    id: "出血",
    visual: { primaryColor: "#fb7185", bgColor: "rgba(251,113,133,0.08)", borderColor: "rgba(251,113,133,0.18)" },
    tick: { hpDelta: -5, mnDelta: 0 },
  },
  "恐怖": {
    id: "恐怖",
    visual: { primaryColor: "#a78bfa", bgColor: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.18)" },
    tick: { hpDelta: 0, mnDelta: -4 },
  },
  "呪い": {
    id: "呪い",
    visual: { primaryColor: "#fb923c", bgColor: "rgba(251,146,60,0.08)", borderColor: "rgba(251,146,60,0.18)" },
    tick: null,
  },
});
