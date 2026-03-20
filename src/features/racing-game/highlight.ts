// ハイライト表示用定数（プレゼンテーション層の関心事）

import type { HighlightType } from './domain/highlight/types';

/** ハイライトタイプの表示名 */
export const HIGHLIGHT_LABELS: Record<HighlightType, string> = {
  drift_bonus: 'ドリフトボーナス',
  heat_boost: 'HEAT ブースト',
  near_miss: 'ニアミス回避',
  overtake: '逆転',
  fastest_lap: 'ファステストラップ',
  photo_finish: 'フォトフィニッシュ',
};

/** ハイライトタイプの背景色 */
export const HIGHLIGHT_COLORS: Record<HighlightType, string> = {
  drift_bonus: '#FF8C00',
  heat_boost: '#FF2020',
  near_miss: '#FFD700',
  overtake: '#9B59B6',
  fastest_lap: '#2ECC71',
  photo_finish: '#FFFFFF',
};
