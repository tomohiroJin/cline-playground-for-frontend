// チェックポイント判定のテスト

import { updateCheckpoints, allCheckpointsPassed } from '../../../domain/race/checkpoint';
import type { Player } from '../../../domain/player/types';
import type { Checkpoint } from '../../../domain/shared/types';

// テスト用プレイヤー生成ヘルパー
const createTestPlayer = (x: number, y: number): Player => ({
  x, y, angle: 0, color: '#f00', name: 'P1', isCpu: false,
  lap: 1, checkpointFlags: 0, lapTimes: [], lapStart: 0,
  speed: 0.5, wallStuck: 0, progress: 0, lastSeg: 0,
  drift: { active: false, duration: 0, slipAngle: 0, boostRemaining: 0, boostPower: 0 },
  heat: { gauge: 0, boostRemaining: 0, boostPower: 0, cooldown: 0 },
  activeCards: [], shieldCount: 0,
});

const checkpoints: Checkpoint[] = [
  { x: 100, y: 100, idx: 0 },
  { x: 200, y: 200, idx: 4 },
  { x: 300, y: 300, idx: 8 },
];

describe('checkpoint', () => {
  describe('updateCheckpoints', () => {
    it('チェックポイント近くのプレイヤーのフラグを更新する', () => {
      const player = createTestPlayer(100, 100);
      const result = updateCheckpoints(player, checkpoints, 90);
      expect(result.player.checkpointFlags & 1).toBe(1);
    });

    it('遠いチェックポイントはフラグが更新されない', () => {
      const player = createTestPlayer(500, 500);
      const result = updateCheckpoints(player, checkpoints, 90);
      expect(result.player.checkpointFlags).toBe(0);
    });

    it('順序を飛ばしてチェックポイントを通過できない', () => {
      const player = createTestPlayer(200, 200);
      const result = updateCheckpoints(player, checkpoints, 90);
      expect(result.player.checkpointFlags & 2).toBe(0);
    });

    it('radius が 0 以下の場合はアサーションエラーになる', () => {
      const player = createTestPlayer(100, 100);
      expect(() => updateCheckpoints(player, checkpoints, 0)).toThrow();
    });
  });

  describe('allCheckpointsPassed', () => {
    it('全チェックポイント通過時に true を返す', () => {
      expect(allCheckpointsPassed(15, 4)).toBe(true);
    });

    it('未通過のチェックポイントがある場合は false を返す', () => {
      expect(allCheckpointsPassed(11, 4)).toBe(false);
    });

    it('全く通過していない場合は false を返す', () => {
      expect(allCheckpointsPassed(0, 4)).toBe(false);
    });
  });
});
