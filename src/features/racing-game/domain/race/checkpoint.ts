// チェックポイント判定（純粋関数・副作用なし）

import type { Checkpoint } from '../shared/types';
import type { Player } from '../player/types';
import { distance } from '../shared/math-utils';
import { assertPositive } from '../shared/assertions';

/** チェックポイント通過判定（ビットフラグ方式: 最大 31 チェックポイントまで対応） */
export const updateCheckpoints = (
  player: Player,
  checkpointCoords: readonly Checkpoint[],
  radius: number,
): { player: Player; newCheckpointPassed: boolean } => {
  // 事前条件
  assertPositive(radius, 'radius');

  let flags = player.checkpointFlags;
  let passed = false;

  checkpointCoords.forEach((cp, i) => {
    if ((flags & (1 << i)) !== 0) return;
    if (i > 0 && (flags & (1 << (i - 1))) === 0) return;

    const dist = distance(player.x, player.y, cp.x, cp.y);
    if (dist < radius) {
      flags |= 1 << i;
      if (i > 0) passed = true;
    }
  });

  return {
    player: { ...player, checkpointFlags: flags },
    newCheckpointPassed: passed,
  };
};

/** 全チェックポイント通過済み判定 */
export const allCheckpointsPassed = (flags: number, totalCheckpoints: number): boolean => {
  const allFlags = (1 << totalCheckpoints) - 1;
  return (flags & allFlags) === allFlags;
};
