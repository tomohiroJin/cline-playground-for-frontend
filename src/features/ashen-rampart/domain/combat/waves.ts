/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * 設計書 §6 の較正値。総HP 668（Task 9 再較正後の値）は「15回の配置枠を
 * 使い切る必然性」と「対空を無視すると必ず負ける」（鴉10体）を両立させるために
 * 設定されており、難度は快適さではなく仮説成立の条件。
 *
 * 敵数を変更したら §9.3 の描画密度（スタック表示）を必ず再計算すること。
 */
import { getEnemySpec } from './enemies';

export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
  /** 出現する経路 index。0 = 入口、5 = 中盤（鴉のみ） */
  spawnPathIndex: number;
}

export interface WaveDefinition {
  /** ラン開始からの絶対 tick。ウェーブは重なりうる */
  startTick: number;
  entries: WaveEntry[];
}

export const PLAINS_WAVES: readonly WaveDefinition[] = [
  // ウェーブ1: 雑兵の小隊
  {
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, spawnPathIndex: 0 }],
  },
  // ウェーブ2: 雑兵＋俊足（テンポ要求）
  {
    startTick: 250,
    entries: [
      { enemyId: 'grunt', count: 3, spawnIntervalTicks: 8, spawnPathIndex: 0 },
      { enemyId: 'runner', count: 2, spawnIntervalTicks: 6, spawnPathIndex: 0 },
    ],
  },
  // ウェーブ3: 群れの大量投入（範囲要求）
  {
    startTick: 500,
    entries: [
      { enemyId: 'swarm', count: 8, spawnIntervalTicks: 3, spawnPathIndex: 0 },
      { enemyId: 'grunt', count: 4, spawnIntervalTicks: 8, spawnPathIndex: 0 },
    ],
  },
  // ウェーブ4: 重装＋鴉（属性・位置要求）
  {
    startTick: 750,
    entries: [
      { enemyId: 'brute', count: 2, spawnIntervalTicks: 15, spawnPathIndex: 0 },
      // 鴉は「対空を無視すると必ず負ける」を成立させるための数（3→10、Task 9 再較正）。
      // 全数漏らすと -10 ライフで初期ライフ12を超える。難度較正では動かさない。
      { enemyId: 'raven', count: 10, spawnIntervalTicks: 10, spawnPathIndex: 5 },
      { enemyId: 'grunt', count: 5, spawnIntervalTicks: 8, spawnPathIndex: 0 },
    ],
  },
];

/** 全ウェーブの敵の総体数 */
export const totalEnemyCount = (waves: readonly WaveDefinition[]): number =>
  waves.reduce((sum, w) => sum + w.entries.reduce((s, e) => s + e.count, 0), 0);

/** 全ウェーブの敵の総HP。バランス較正の基準値 */
export const totalEnemyHp = (waves: readonly WaveDefinition[]): number =>
  waves.reduce(
    (sum, w) =>
      sum + w.entries.reduce((s, e) => s + e.count * getEnemySpec(e.enemyId).hp, 0),
    0
  );
