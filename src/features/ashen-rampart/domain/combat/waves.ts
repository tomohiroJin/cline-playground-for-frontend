/**
 * 灰燼の城壁 - 平原ステージのウェーブ定義（事前定義・乱数なし）
 *
 * ウェーブ構成を固定にすることで「盤面の答え合わせが運で崩れない」
 * ことを保証する（設計書の方針）。
 */
export interface WaveEntry {
  enemyId: string;
  count: number;
  /** 同一エントリ内のスポーン間隔（tick） */
  spawnIntervalTicks: number;
}

export interface WaveDefinition {
  entries: WaveEntry[];
}

export const PLAINS_WAVES: WaveDefinition[] = [
  // ウェーブ1: 雑兵の小隊
  { entries: [{ enemyId: 'grunt', count: 6, spawnIntervalTicks: 12 }] },
  // ウェーブ2: 雑兵＋俊足の混成
  {
    entries: [
      { enemyId: 'grunt', count: 6, spawnIntervalTicks: 10 },
      { enemyId: 'runner', count: 4, spawnIntervalTicks: 8 },
    ],
  },
  // ウェーブ3: 雑兵の大隊＋重装
  {
    entries: [
      { enemyId: 'grunt', count: 8, spawnIntervalTicks: 8 },
      { enemyId: 'brute', count: 2, spawnIntervalTicks: 20 },
    ],
  },
];
