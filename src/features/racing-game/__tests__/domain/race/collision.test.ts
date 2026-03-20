// 衝突判定のテスト

import { handleCollision } from '../../../domain/race/collision';
import type { Player } from '../../../domain/player/types';

const createTestPlayer = (x: number, y: number, name: string): Player => ({
  x, y, angle: 0, color: '#f00', name, isCpu: false,
  lap: 1, checkpointFlags: 0, lapTimes: [], lapStart: 0,
  speed: 0.5, wallStuck: 0, progress: 0, lastSeg: 0,
  drift: { active: false, duration: 0, slipAngle: 0, boostRemaining: 0, boostPower: 0 },
  heat: { gauge: 0, boostRemaining: 0, boostPower: 0, cooldown: 0 },
  activeCards: [], shieldCount: 0,
});

describe('collision', () => {
  describe('handleCollision', () => {
    it('距離が十分近い場合に衝突情報を返す', () => {
      const p1 = createTestPlayer(100, 100, 'P1');
      const p2 = createTestPlayer(110, 100, 'P2');
      const result = handleCollision(p1, p2, 25);
      expect(result).not.toBeNull();
      expect(result!.contactPoint.x).toBeCloseTo(105, 0);
      expect(result!.contactPoint.y).toBeCloseTo(100, 0);
    });

    it('距離が離れている場合は null を返す', () => {
      const p1 = createTestPlayer(0, 0, 'P1');
      const p2 = createTestPlayer(100, 100, 'P2');
      expect(handleCollision(p1, p2, 25)).toBeNull();
    });

    it('同じ位置の場合は null を返す（距離 0）', () => {
      const p1 = createTestPlayer(100, 100, 'P1');
      const p2 = createTestPlayer(100, 100, 'P2');
      expect(handleCollision(p1, p2, 25)).toBeNull();
    });

    it('衝突時にドリフト中のプレイヤーはドリフトがキャンセルされる', () => {
      const p1 = {
        ...createTestPlayer(100, 100, 'P1'),
        drift: { active: true, duration: 1.0, slipAngle: 0.3, boostRemaining: 0, boostPower: 0 },
      };
      const p2 = createTestPlayer(110, 100, 'P2');
      const result = handleCollision(p1, p2, 25);
      expect(result).not.toBeNull();
      expect(result!.player1.drift.active).toBe(false);
      expect(result!.player1.drift.boostRemaining).toBe(0);
    });

    it('collisionDist が 0 以下の場合はアサーションエラーになる', () => {
      const p1 = createTestPlayer(100, 100, 'P1');
      const p2 = createTestPlayer(110, 100, 'P2');
      expect(() => handleCollision(p1, p2, 0)).toThrow();
    });
  });
});
