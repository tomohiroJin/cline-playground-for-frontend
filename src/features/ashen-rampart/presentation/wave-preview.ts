/**
 * 灰燼の城壁 - 次ウェーブ予告の文字列組み立て（純粋関数）
 *
 * `RunStatusBar`（表示）と `useAshenRampartGame`（ログ記録）の両方が
 * 同じ予告文字列を必要とするため、ここに切り出して重複を避ける。
 *
 * **レーンを出す。** 判定項目1が「2レーンへの配置数の配分」（設計書 §9.1）である以上、
 * 種類と数だけの予告では敵が湧いてから反応するしかなく、事前にどちらを厚くするかを
 * 決められない。表示名は RunSummary.tsx の LANE_LABELS（北=0、南=1）に合わせる。
 */
import type { CombatState } from '../domain/combat/combat-state';
import type { WaveEntry } from '../domain/combat/waves';
import { getEnemySpec } from '../domain/combat/enemies';

/** レーン index → 表示名。平原マップは北・南の2レーン固定（RunSummary.tsx と同じ対応） */
const laneLabel = (laneIndex: number): string =>
  laneIndex === 0 ? '北' : laneIndex === 1 ? '南' : `レーン${laneIndex + 1}`;

/**
 * ウェーブのエントリをレーンごとにまとめ、レーン番号順の文字列群にする
 *
 * 1ウェーブに同じレーンのエントリが複数あることがある（例: 北へ重装と雑兵を
 * 同時に投入するウェーブ4）ため、素直に entries を map するだけでは
 * 同じレーンの表記が2箇所に分かれてしまう。レーンごとに1つへ合流させる。
 */
const groupEntriesByLane = (entries: readonly WaveEntry[]): string[] => {
  const namesByLane = new Map<number, string[]>();
  entries.forEach((entry) => {
    const names = namesByLane.get(entry.laneIndex) ?? [];
    names.push(`${getEnemySpec(entry.enemyId).name}${entry.count}`);
    namesByLane.set(entry.laneIndex, names);
  });
  return [...namesByLane.entries()]
    .sort(([a], [b]) => a - b)
    .map(([laneIndex, names]) => `${laneLabel(laneIndex)} ${names.join(' ')}`);
};

/** 次ウェーブの予告文字列（最終ウェーブ後は固定文言） */
export const nextWavePreview = (state: Pick<CombatState, 'waves' | 'tick'>): string => {
  const nextWave = state.waves.find((w) => w.startTick > state.tick);
  if (!nextWave) return 'これが最後の波';
  return groupEntriesByLane(nextWave.entries).join(' / ');
};
