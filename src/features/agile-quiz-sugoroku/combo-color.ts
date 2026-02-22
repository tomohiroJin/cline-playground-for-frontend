/**
 * コンボ色計算（DRY解消）
 */
import { COLORS } from './constants';

/** maxComboに応じた色を返す */
export function getComboColor(maxCombo: number): string {
  if (maxCombo >= 5) return COLORS.orange;
  if (maxCombo >= 3) return COLORS.yellow;
  return COLORS.muted;
}
