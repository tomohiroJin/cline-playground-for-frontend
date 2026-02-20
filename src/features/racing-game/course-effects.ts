// コース環境効果モジュール

import type { CourseEffect } from './types';

/** 各コースの環境効果データ定義 */
const COURSE_EFFECTS: Record<string, CourseEffect> = {
  forest: {
    name: 'Forest',
    frictionMultiplier: 0.85,      // 落ち葉による低グリップ区間
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'leaves',
    segmentBased: true,            // 特定セグメントのみ
  },
  city: {
    name: 'City',
    frictionMultiplier: 0.90,      // 雨天で全体的に滑りやすい
    driftAngleBonus: 0.1,          // ドリフト角度 +10%
    speedModifier: 0,
    visualEffect: 'rain',
    segmentBased: false,
  },
  mountain: {
    name: 'Mountain',
    frictionMultiplier: 1.0,       // 通常グリップ
    driftAngleBonus: 0,
    speedModifier: 0.05,           // セグメント傾斜で速度 ±5%
    visualEffect: 'none',
    segmentBased: true,            // セグメントごとに上り/下り
  },
  beach: {
    name: 'Beach',
    frictionMultiplier: 0.70,      // トラック外縁20%で砂地
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'none',
    segmentBased: true,            // トラック位置に応じて
  },
  night: {
    name: 'Night',
    frictionMultiplier: 1.0,       // グリップ変化なし
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'vignette',      // 視界制限
    segmentBased: false,
  },
  snow: {
    name: 'Snow',
    frictionMultiplier: 0.75,      // 氷面で全体的に低グリップ
    driftAngleBonus: 0.2,          // ドリフト角度 +20%
    speedModifier: 0,
    visualEffect: 'snow',
    segmentBased: false,
  },
};

/** デコタイプからコース効果を取得 */
export const getEffect = (deco: string): CourseEffect => {
  return COURSE_EFFECTS[deco] || {
    name: 'Default',
    frictionMultiplier: 1.0,
    driftAngleBonus: 0,
    speedModifier: 0,
    visualEffect: 'none' as const,
    segmentBased: false,
  };
};

/** 環境効果に基づく摩擦係数を計算 */
export const getFriction = (
  effect: CourseEffect,
  segment: number,
  totalSegments: number,
  distFromCenter: number,
  trackWidth: number
): number => {
  let friction = effect.frictionMultiplier;

  if (effect.segmentBased) {
    switch (effect.name) {
      case 'Forest': {
        // 特定セグメント（偶数セグメント）のみ低グリップ
        if (segment % 3 === 0) {
          friction = 0.85;
        } else {
          friction = 1.0;
        }
        break;
      }
      case 'Mountain': {
        // セグメントの奇数/偶数で上り/下り
        const half = Math.floor(totalSegments / 2);
        if (segment < half) {
          // 上り区間 → 速度ダウン
          friction = 0.95;
        } else {
          // 下り区間 → 速度アップ
          friction = 1.05;
        }
        break;
      }
      case 'Beach': {
        // トラック外縁20%で砂地
        const outerEdge = trackWidth * 0.8;
        if (distFromCenter > outerEdge) {
          friction = 0.70;
        } else {
          friction = 1.0;
        }
        break;
      }
    }
  }

  return friction;
};

/** 環境効果による速度修正を計算 */
export const getSpeedModifier = (
  effect: CourseEffect,
  segment: number,
  totalSegments: number
): number => {
  if (effect.name === 'Mountain' && effect.segmentBased) {
    const half = Math.floor(totalSegments / 2);
    return segment < half ? -effect.speedModifier : effect.speedModifier;
  }
  return 0;
};

export const CourseEffects = {
  getEffect,
  getFriction,
  getSpeedModifier,
};
