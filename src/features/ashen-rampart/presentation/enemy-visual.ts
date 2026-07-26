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

/** HP 残量比から HP バーの色を得る（緑→黄→赤） */
export const getHpBarColor = (ratio: number): string => {
  if (ratio > 0.6) return '#6ab04c';
  if (ratio > 0.3) return '#f0c419';
  return '#e74c3c';
};

/** CSS clip-path の値。円は border-radius で描くため clip-path を使わない */
export const getShapeClipPath = (shape: EnemyShape): string | undefined => {
  if (shape === 'diamond') return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
  if (shape === 'hexagon')
    return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
  return undefined;
};
