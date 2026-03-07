/**
 * コンボ色計算・コンボ段階定義
 */
import { COLORS } from './constants';

/** コンボ段階の識別子 */
export type ComboStageId = 'fire' | 'lightning' | 'rainbow' | 'legendary';

/** コンボ段階の型定義 */
export interface ComboStage {
  id: ComboStageId;
  label: string;
  color: string;
  minCombo: number;
}

/** コンボ段階定義（minCombo の降順でルックアップに使用） */
export const COMBO_STAGES: readonly ComboStage[] = [
  { id: 'fire', label: 'FIRE', color: COLORS.orange, minCombo: 2 },
  { id: 'lightning', label: 'LIGHTNING', color: COLORS.purple, minCombo: 4 },
  { id: 'rainbow', label: 'RAINBOW', color: COLORS.cyan, minCombo: 6 },
  { id: 'legendary', label: 'LEGENDARY', color: COLORS.yellow, minCombo: 8 },
] as const;

/**
 * コンボ数に応じた段階を返す
 * minCombo 以上で最も高い段階を選択する
 */
export function getComboStage(combo: number): ComboStage | undefined {
  // 降順に検索して最初にマッチした段階を返す
  for (let i = COMBO_STAGES.length - 1; i >= 0; i--) {
    if (combo >= COMBO_STAGES[i].minCombo) {
      return COMBO_STAGES[i];
    }
  }
  return undefined;
}

/** maxComboに応じた色を返す */
export function getComboColor(maxCombo: number): string {
  if (maxCombo >= 5) return COLORS.orange;
  if (maxCombo >= 3) return COLORS.yellow;
  return COLORS.muted;
}
