/**
 * 灰燼の城壁 - 敵の射程が届く経路外セル（反復7 段階2・設計書 §4.3 #5）
 *
 * 射程を持つ敵は、進軍しながら経路の脇に置いた守り手を削る（反復5）。
 * 射程が見えなければ「経路外は安全」という前提が裏切られ、理不尽な事故になる。
 *
 * **台本と地図だけから静的に求める。** 敵の位置はレーン上を連続に動くので、
 * レーンの隣り合うセルを結ぶ線分からの距離で測る（blocking.ts の攻撃判定と同じ
 * ユークリッド距離・`<= attackRange`）。飛行の敵は射程攻撃をしない（blocking.ts）ので除く。
 */
import type { CellPos, StageMap } from '../board/stage-map';
import { laneOf, offPathCells } from '../board/stage-map';
import { getEnemySpec } from './enemies';
import { distanceToSegment } from './geometry';
import type { WaveDefinition } from './waves';

/** レーンごとの、台本に出る射程持ちの最大射程 */
const maxRangeByLane = (waves: readonly WaveDefinition[]): Map<number, number> => {
  const result = new Map<number, number>();
  waves.forEach((wave) =>
    wave.entries.forEach((entry) => {
      const spec = getEnemySpec(entry.enemyId);
      if (spec.flying || spec.attackRange <= 0) return;
      result.set(entry.laneIndex, Math.max(result.get(entry.laneIndex) ?? 0, spec.attackRange));
    })
  );
  return result;
};

/** レーンのどこかから range 以内か */
const isWithinLane = (lane: readonly CellPos[], cell: CellPos, range: number): boolean =>
  lane.some((from, index) => distanceToSegment(cell, from, lane[index + 1] ?? from) <= range);

/** 射程を持つ敵が、進軍中に攻撃できる経路外セル */
export const enemyReachCells = (map: StageMap, waves: readonly WaveDefinition[]): CellPos[] => {
  const ranges = [...maxRangeByLane(waves)];
  if (ranges.length === 0) return [];
  return offPathCells(map).filter((cell) =>
    ranges.some(([laneIndex, range]) => isWithinLane(laneOf(map, laneIndex), cell, range))
  );
};
