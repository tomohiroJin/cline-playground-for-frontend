/**
 * 灰燼の城壁 - 敵の装甲・回復のエフェクト（反復7 段階2・設計書 §4.3 #1 #2）
 *
 * BoardEffectLayer の SVG の中に描く。座標はセル座標系（viewBox と同じ）。
 * **動きは付けない。** prefers-reduced-motion でも見え方は同じで、寿命は
 * combat-effects.ts が既存の規則（reduced-motion では一律）で管理する。
 * 文字は背景色で縁取り、明るい経路の上でも読めるようにする。
 */
import React from 'react';
import type { Effect } from './combat-effects';
import { EFFECT_STROKE_WIDTH } from './combat-effects';
import { COLORS } from './theme';

/** セルの中心へ寄せる補正 */
const CENTER = 0.5;
/** 文字の大きさ（セル比）。360px 幅でセル約40px → 約10px */
const EFFECT_TEXT_SIZE = 0.26;
/** 文字を敵の頭上へずらす量（セル比） */
const TEXT_LIFT = 0.3;
/** 文字の縁取りの太さ（セル比） */
const TEXT_OUTLINE_WIDTH = 0.05;

/** 装甲の軽減量の表記（例: `-0 (装甲4)`） */
export const armorHitText = (dealt: number, armor: number): string => `-${dealt} (装甲${armor})`;

/** 回復量の表記（例: `+3`） */
export const healText = (amount: number): string => `+${amount}`;

const textProps = {
  fontSize: EFFECT_TEXT_SIZE,
  textAnchor: 'middle',
  stroke: COLORS.dominant,
  strokeWidth: TEXT_OUTLINE_WIDTH,
  paintOrder: 'stroke',
} as const;

export const ArmorMark: React.FC<{ effect: Extract<Effect, { kind: 'armor' }> }> = ({ effect }) => (
  <text
    data-effect="armor"
    x={effect.at.x + CENTER}
    y={effect.at.y + CENTER - TEXT_LIFT}
    fill={COLORS.secondary}
    {...textProps}
  >
    {armorHitText(effect.dealt, effect.armor)}
  </text>
);

export const HealLink: React.FC<{ effect: Extract<Effect, { kind: 'heal' }> }> = ({ effect }) => (
  <g data-effect="heal">
    <line
      x1={effect.from.x + CENTER}
      y1={effect.from.y + CENTER}
      x2={effect.to.x + CENTER}
      y2={effect.to.y + CENTER}
      stroke={COLORS.heal}
      strokeWidth={EFFECT_STROKE_WIDTH.heal}
    />
    <text x={effect.to.x + CENTER} y={effect.to.y + CENTER - TEXT_LIFT} fill={COLORS.heal} {...textProps}>
      {healText(effect.amount)}
    </text>
  </g>
);
