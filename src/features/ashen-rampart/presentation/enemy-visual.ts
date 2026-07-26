/**
 * 灰燼の城壁 - 敵の視覚表現マッピング（純粋）
 *
 * 敵種を「形 × サイズ × 色」の3重符号で区別する。
 * 色のみに依存すると色覚特性やコントラストで判別できなくなるため、
 * グレースケールでも形とサイズだけで見分けられることを要件とする。
 */
import { getEnemySpec } from '../domain/combat/enemies';

export type EnemyShape = 'circle' | 'diamond' | 'hexagon';

export interface EnemyVisual {
  /** 表示名（aria-label 用） */
  name: string;
  shape: EnemyShape;
  /** 本体色 */
  color: string;
  /** 盤面幅に対するマーカー幅の割合（%） */
  sizePct: number;
  /** 装甲リングの色。持たない敵は undefined */
  ringColor?: string;
}

/** 敵IDごとの形・サイズ・色。3種が互いに形もサイズも異なることが要件 */
const VISUALS: Readonly<Record<string, Omit<EnemyVisual, 'name'>>> = {
  // 雑兵: 基準となる中サイズの円
  grunt: { shape: 'circle', color: '#c0392b', sizePct: 5.5 },
  // 俊足: 小さく鋭い菱形。速さを形で示す
  runner: { shape: 'diamond', color: '#f0a830', sizePct: 4.5 },
  // 重装: 大きな六角形＋装甲リング。硬さを面積とリングで示す
  brute: {
    shape: 'hexagon',
    color: '#9b59b6',
    sizePct: 7.5,
    ringColor: '#d7bde2',
  },
};

/**
 * 敵IDから視覚表現を得る
 *
 * 未知のIDは呼び出し側の契約違反であるため例外を投げる
 * （敵IDはドメインのウェーブ定義由来であり、UI が独自に作ることはない）。
 */
export const getEnemyVisual = (enemyId: string): EnemyVisual => {
  const visual = VISUALS[enemyId];
  if (!visual) {
    throw new Error(`視覚表現が未定義の敵IDです: ${enemyId}`);
  }
  return { ...visual, name: getEnemySpec(enemyId).name };
};

/**
 * HP バーの色は単色にする
 *
 * 残量で色を変える（緑→黄→赤）と、観察者がその色を**敵の種別**と誤読した。
 * 種別は形・サイズ・本体色で示すため、バーの色は情報を持たせない。
 */
export const HP_BAR_COLOR = '#7fb069';

/** 盤面に登場する敵の最大 HP。バーを絶対スケールで描くための基準 */
export const MAX_ENEMY_HP = 60;

/** バー幅の下限と上限（盤面幅に対する％） */
const BAR_MIN_PCT = 2.5;
const BAR_MAX_PCT = 8;

/**
 * 最大 HP から HP バーの幅（盤面幅に対する％）を得る
 *
 * 残量比だけを描くと、満タンの雑兵(HP20)と満タンの重装(HP60)が同じ見え方になり、
 * **個体間の強さの差が原理的に読めない**。バー全長を最大HPの絶対スケールにすることで、
 * 「硬い敵ほどバーが長い」を成立させる。
 */
export const getHpBarWidthPct = (maxHp: number): number => {
  const ratio = Math.max(0, Math.min(1, maxHp / MAX_ENEMY_HP));
  return BAR_MIN_PCT + (BAR_MAX_PCT - BAR_MIN_PCT) * ratio;
};

/** CSS clip-path の値。円は border-radius で描くため clip-path を使わない */
export const getShapeClipPath = (shape: EnemyShape): string | undefined => {
  if (shape === 'diamond') return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  if (shape === 'hexagon')
    return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
  return undefined;
};
