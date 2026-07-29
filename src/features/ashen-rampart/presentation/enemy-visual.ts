/**
 * 灰燼の城壁 - 敵の視覚表現マッピング（純粋）
 *
 * 敵種を「形 × サイズ × 色」の3重符号で区別する。色のみに依存すると
 * 色覚特性やコントラストで判別できなくなるため、グレースケールでも
 * 形とサイズだけで見分けられることを要件とする（S1 の教訓）。
 */
import { getEnemySpec } from '../domain/combat/enemies';

export type EnemyShape = 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'square';

export interface EnemyVisual {
  name: string;
  shape: EnemyShape;
  color: string;
  /** 盤面幅に対するマーカー幅の割合（%） */
  sizePct: number;
  ringColor?: string;
}

const VISUALS: Readonly<Record<string, Omit<EnemyVisual, 'name'>>> = {
  // 雑兵: 基準となる中サイズの円。全52体中29体・全4ウェーブに登場する最頻出の敵のため、
  // 危険色 #8b2635 と色相の近い赤系は使わない（青灰にして「赤=本当の危険」を守る、指摘7）
  grunt: { shape: 'circle', color: '#8a95a5', sizePct: 5.5 },
  // 俊足: 小さく鋭い菱形。速さを形で示す
  runner: { shape: 'diamond', color: '#f0a830', sizePct: 4.5 },
  // 群れ: 最小の四角。数で押すことをサイズで示す
  swarm: { shape: 'square', color: '#7f8c8d', sizePct: 3.5 },
  // 重装: 大きな六角形＋装甲リング。硬さを面積とリングで示す
  brute: { shape: 'hexagon', color: '#9b59b6', sizePct: 7.5, ringColor: '#d7bde2' },
  // 鴉: 上向き三角。飛行を「地に着かない形」で示す
  raven: { shape: 'triangle', color: '#5dade2', sizePct: 5, ringColor: '#aed6f1' },
};

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
 * 残量で色を変える（緑→黄→赤）と、観察者がその色を敵の種別と誤読した。
 */
export const HP_BAR_COLOR = '#7fb069';

/** 盤面に登場する敵の最大 HP。バーを絶対スケールで描くための基準 */
export const MAX_ENEMY_HP = 60;

const BAR_MIN_PCT = 2.5;
const BAR_MAX_PCT = 8;

/**
 * 最大 HP から HP バーの幅を得る
 *
 * 残量比だけを描くと満タンの雑兵(20)と満タンの重装(60)が同じ見え方になり、
 * 個体間の強さの差が原理的に読めない。バー全長を絶対スケールにする。
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
  if (shape === 'triangle') return 'polygon(50% 0%, 100% 100%, 0% 100%)';
  return undefined;
};
