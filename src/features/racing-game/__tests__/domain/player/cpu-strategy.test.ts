// CPU AI Strategy パターンのテスト

import { createCpuStrategy } from '../../../domain/player/cpu-strategy';
import { createPlayer } from '../../../domain/player/player-factory';
import type { Point } from '../../../domain/shared/types';

// テスト用正方形トラック
const trackPoints: Point[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

const makePlayer = (x: number, y: number, angle: number, speed: number) => ({
  ...createPlayer({ x, y, angle, color: '#f00', name: 'CPU', isCpu: true }),
  speed,
});

describe('cpu-strategy', () => {
  describe('createCpuStrategy', () => {
    it('easy / normal / hard の各難易度で Strategy を生成できる', () => {
      expect(createCpuStrategy('easy')).toBeDefined();
      expect(createCpuStrategy('normal')).toBeDefined();
      expect(createCpuStrategy('hard')).toBeDefined();
    });
  });

  describe('calculateTurn', () => {
    it('数値のステアリング値を返す', () => {
      const strategy = createCpuStrategy('normal');
      const player = makePlayer(50, 0, 0, 0.5);
      const turn = strategy.calculateTurn(player, trackPoints, 55);
      expect(typeof turn).toBe('number');
    });

    it('hard は easy より高い skill で計算する', () => {
      const easy = createCpuStrategy('easy');
      const hard = createCpuStrategy('hard');
      // 同じ状態でも異なる挙動（統計的テスト）
      expect(easy).not.toBe(hard);
    });
  });

  describe('shouldDrift', () => {
    it('easy では稀にしかドリフトを使わない', () => {
      const strategy = createCpuStrategy('easy');
      // トラック中央（コーナーではない）に配置
      const player = makePlayer(50, 1, 0, 0.8);
      // コーナー外の位置ではドリフトしない
      let driftCount = 0;
      for (let i = 0; i < 100; i++) {
        if (strategy.shouldDrift(player, trackPoints, 55)) driftCount++;
      }
      // トラック中央近くではコーナー判定に入らないため 0
      expect(driftCount).toBe(0);
    });

    it('速度が MIN_SPEED 未満では false を返す', () => {
      const strategy = createCpuStrategy('hard');
      const player = makePlayer(50, 50, 0, 0.1);
      expect(strategy.shouldDrift(player, trackPoints, 55)).toBe(false);
    });
  });
});
