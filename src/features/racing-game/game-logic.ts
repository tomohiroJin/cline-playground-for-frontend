// Racing Game ゲームロジック
// 移行期間中: ドメイン層の各モジュールへ委譲

import type { Point, Checkpoint, Player } from './types';
import { Config } from './constants';
import { Utils } from './utils';
import { Track } from './track';
import { movePlayer as movePlayerDomain } from './domain/player/player';
import { updateCheckpoints as updateCheckpointsDomain, allCheckpointsPassed } from './domain/race/checkpoint';
import { handleCollision as handleCollisionDomain } from './domain/race/collision';
import { createCpuStrategy } from './domain/player/cpu-strategy';
import type { CpuDifficulty } from './domain/player/cpu-strategy';

export const Logic = {
  cpuTurn: (p: Player, pts: Point[], skill: number, miss: number) => {
    // 旧インターフェースを維持しつつ CpuStrategy に委譲
    const difficulty: CpuDifficulty = skill >= 0.8 ? 'hard' : skill >= 0.4 ? 'normal' : 'easy';
    const strategy = createCpuStrategy(difficulty);
    return strategy.calculateTurn(p, pts, Config.game.trackWidth);
  },

  cpuShouldDrift: (p: Player, pts: Point[], skill: number): boolean => {
    const difficulty: CpuDifficulty = skill >= 0.8 ? 'hard' : skill >= 0.4 ? 'normal' : 'easy';
    const strategy = createCpuStrategy(difficulty);
    return strategy.shouldDrift(p, pts, Config.game.trackWidth);
  },

  movePlayer: (p: Player, baseSpd: number, pts: Point[], handbrake?: boolean, steering?: number, accelMul?: number, driftBoostMul?: number) => {
    const result = movePlayerDomain(p, baseSpd, pts, Config.game.trackWidth, {
      handbrake,
      steering,
      accelMultiplier: accelMul,
      driftBoostMultiplier: driftBoostMul,
    });
    // 旧インターフェースに合わせて返却
    return {
      p: result.player,
      info: result.trackInfo,
      vel: result.velocity,
      hit: result.wallHit,
      wallStage: result.wallStage,
    };
  },

  updateCheckpoints: (p: Player, checkpointCoords: Checkpoint[], onNew?: () => void) => {
    const { player, newCheckpointPassed } = updateCheckpointsDomain(
      p,
      checkpointCoords,
      Config.game.checkpointRadius,
    );
    if (newCheckpointPassed) onNew?.();
    return player;
  },

  allCheckpointsPassed,

  handleCollision: (p1: Player, p2: Player) => {
    const result = handleCollisionDomain(p1, p2, Config.game.collisionDist);
    if (!result) return null;
    // 旧インターフェースに合わせて返却
    return {
      p1: result.player1,
      p2: result.player2,
      pt: result.contactPoint,
    };
  },
};
