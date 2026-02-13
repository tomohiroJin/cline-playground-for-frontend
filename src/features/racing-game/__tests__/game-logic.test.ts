import { Logic } from '../game-logic';
import { Entity } from '../entities';
import type { Checkpoint } from '../types';

describe('Racing Game Logic', () => {
  describe('handleCollision', () => {
    test('距離が十分近い場合に衝突情報を返す', () => {
      const p1 = Entity.player(100, 100, 0, '#f00', 'P1', false);
      const p2 = Entity.player(110, 100, 0, '#00f', 'P2', false);
      const result = Logic.handleCollision(p1, p2);
      expect(result).not.toBeNull();
      expect(result!.pt.x).toBeCloseTo(105, 0);
      expect(result!.pt.y).toBeCloseTo(100, 0);
    });

    test('距離が離れている場合はnullを返す', () => {
      const p1 = Entity.player(0, 0, 0, '#f00', 'P1', false);
      const p2 = Entity.player(100, 100, 0, '#00f', 'P2', false);
      expect(Logic.handleCollision(p1, p2)).toBeNull();
    });

    test('同じ位置の場合はnullを返す（距離0）', () => {
      const p1 = Entity.player(100, 100, 0, '#f00', 'P1', false);
      const p2 = Entity.player(100, 100, 0, '#00f', 'P2', false);
      expect(Logic.handleCollision(p1, p2)).toBeNull();
    });
  });

  describe('allCheckpointsPassed', () => {
    test('全チェックポイント通過時にtrueを返す', () => {
      // 4チェックポイント: flags = 0b1111 = 15
      expect(Logic.allCheckpointsPassed(15, 4)).toBe(true);
    });

    test('未通過のチェックポイントがある場合はfalseを返す', () => {
      // 4チェックポイント: flags = 0b1011 = 11 (3番目未通過)
      expect(Logic.allCheckpointsPassed(11, 4)).toBe(false);
    });

    test('全く通過していない場合はfalseを返す', () => {
      expect(Logic.allCheckpointsPassed(0, 4)).toBe(false);
    });
  });

  describe('updateCheckpoints', () => {
    const checkpoints: Checkpoint[] = [
      { x: 100, y: 100, idx: 0 },
      { x: 200, y: 200, idx: 4 },
      { x: 300, y: 300, idx: 8 },
    ];

    test('チェックポイント近くのプレイヤーのフラグを更新する', () => {
      const p = Entity.player(100, 100, 0, '#f00', 'P1', false);
      const result = Logic.updateCheckpoints(p, checkpoints);
      expect(result.checkpointFlags & 1).toBe(1); // 最初のチェックポイント通過
    });

    test('遠いチェックポイントはフラグが更新されない', () => {
      const p = Entity.player(500, 500, 0, '#f00', 'P1', false);
      const result = Logic.updateCheckpoints(p, checkpoints);
      expect(result.checkpointFlags).toBe(0);
    });

    test('順序を飛ばしてチェックポイントを通過できない', () => {
      // 最初のチェックポイントを通過していない状態で2番目に近づく
      const p = Entity.player(200, 200, 0, '#f00', 'P1', false);
      const result = Logic.updateCheckpoints(p, checkpoints);
      // 最初のチェックポイントは遠いのでフラグなし
      expect(result.checkpointFlags & 2).toBe(0);
    });
  });

  describe('movePlayer', () => {
    const simpleTrack = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    test('トラック上の移動で速度が回復する', () => {
      const p = Entity.player(50, 0, 0, '#f00', 'P1', false);
      p.speed = 0.5;
      const result = Logic.movePlayer(p, 3, simpleTrack);
      expect(result.p.speed).toBeGreaterThan(0.5);
      expect(result.hit).toBe(false);
    });
  });
});
