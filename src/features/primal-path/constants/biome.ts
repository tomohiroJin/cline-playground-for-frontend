/**
 * バイオーム関連の定数
 */
import type { BiomeInfo, BiomeId, EnvDmgConfig } from '../types';

/** バイオーム情報 */
export const BIO: Readonly<Record<BiomeId, BiomeInfo>> = Object.freeze({
  grassland: Object.freeze({ ic: '🌿', nm: '草原', ds: 'バランス型' }),
  glacier: Object.freeze({ ic: '❄️', nm: '氷河', ds: '技術有利' }),
  volcano: Object.freeze({ ic: '🌋', nm: '火山', ds: '儀式有利' }),
});

/** バイオーム数 */
export const BIOME_COUNT = 3;

/** バイオーム相性 */
export const BIOME_AFFINITY: Readonly<Record<BiomeId, { check: (l: { tech: number; life: number; rit: number }) => boolean; m: number }>> = Object.freeze({
  glacier: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.tech > l.life && l.tech > l.rit, m: 1.3 }),
  volcano: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.rit > l.life && l.rit > l.tech, m: 1.3 }),
  grassland: Object.freeze({ check: (l: { tech: number; life: number; rit: number }) => l.life > l.tech && l.life > l.rit, m: 1.2 }),
});

/** 環境ダメージ設定 */
export const ENV_DMG: Readonly<Record<string, EnvDmgConfig>> = Object.freeze({
  glacier: Object.freeze({ base: 3, resist: 'iR' as const, immune: 'tech' as const, icon: '❄️ 寒さ', c: 'cc' }),
  volcano: Object.freeze({ base: 2, resist: 'fR' as const, immune: null, icon: '🌋 灼熱', c: 'tc' }),
});
