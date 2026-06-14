import { calculateStep, calculateFleeDirection, getDirectPathToPlayer } from './aiGeometry';
import { createPatrolEnemy } from '../../entities/enemy';

const mockIdGen = {
  generateEnemyId: () => 'e1',
  generateTrapId: () => 't1',
  generateItemId: () => 'i1',
  generateFeedbackId: () => 'f1',
};

describe('aiGeometry', () => {
  describe('calculateStep', () => {
    it('各軸の単位ステップ（-1/0/+1）を返す', () => {
      expect(calculateStep({ x: 2, y: 2 }, { x: 5, y: 1 })).toEqual({ stepX: 1, stepY: -1 });
    });
    it('同一座標では 0 を返す', () => {
      expect(calculateStep({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual({ stepX: 0, stepY: 0 });
    });
    it('負方向では -1 を返す', () => {
      expect(calculateStep({ x: 5, y: 5 }, { x: 1, y: 1 })).toEqual({ stepX: -1, stepY: -1 });
    });
  });

  describe('calculateFleeDirection', () => {
    it('プレイヤーと反対方向の隣接マスを返す', () => {
      const enemy = createPatrolEnemy(3, 3, mockIdGen);
      expect(calculateFleeDirection(enemy, { x: 2, y: 3 })).toEqual({ x: 4, y: 3 });
    });
  });

  describe('getDirectPathToPlayer', () => {
    it('敵からプレイヤーへの直線パスを返す', () => {
      const enemy = createPatrolEnemy(1, 1, mockIdGen);
      const path = getDirectPathToPlayer(enemy, { x: 3, y: 1 });
      expect(path).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }]);
    });
  });
});
