/**
 * 灰燼の城壁 - 次ウェーブ予告の文字列組み立て（純粋関数）
 *
 * `RunStatusBar`（表示）と `useAshenRampartGame`（ログ記録）の両方が
 * 同じ予告文字列を必要とするため、ここに切り出して重複を避ける。
 */
import type { CombatState } from '../domain/combat/combat-state';
import { getEnemySpec } from '../domain/combat/enemies';

/** 次ウェーブの予告文字列（最終ウェーブ後は固定文言） */
export const nextWavePreview = (state: Pick<CombatState, 'waves' | 'tick'>): string => {
  const nextWave = state.waves.find((w) => w.startTick > state.tick);
  if (!nextWave) return 'これが最後の波';
  return nextWave.entries.map((e) => `${getEnemySpec(e.enemyId).name}${e.count}`).join(' ');
};
