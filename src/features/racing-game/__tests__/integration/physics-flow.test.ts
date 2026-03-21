// レイヤー横断統合テスト: 物理フロー

import { createDriftState, startDrift, updateDrift, endDrift, getDriftBoost } from '../../domain/player/drift';
import { createHeatState, updateHeat, getHeatBoost } from '../../domain/player/heat';
import { calculateWallPenalty, shouldWarp } from '../../domain/track/wall-physics';

describe('physics-flow', () => {
  describe('ドリフト → ブースト → 速度回復の連続フロー', () => {
    it('ドリフト開始→維持→終了でブーストが発動する', () => {
      // Arrange
      let drift = createDriftState();

      // Act: ドリフト開始
      drift = startDrift(drift, 0.5);
      expect(drift.active).toBe(true);

      // 1.5 秒間ドリフト維持
      for (let i = 0; i < 90; i++) {
        drift = updateDrift(drift, 1, 0.5, 1 / 60);
      }
      expect(drift.duration).toBeGreaterThan(1.0);

      // ドリフト終了
      drift = endDrift(drift);

      // Assert: ブーストが発動
      expect(drift.active).toBe(false);
      expect(drift.boostRemaining).toBeGreaterThan(0);
      expect(getDriftBoost(drift)).toBeGreaterThan(0);
    });

    it('ブーストは時間経過で減衰する', () => {
      // Arrange
      let drift = createDriftState();
      drift = startDrift(drift, 0.5);
      for (let i = 0; i < 60; i++) {
        drift = updateDrift(drift, 1, 0.5, 1 / 60);
      }
      drift = endDrift(drift);
      const initialBoost = getDriftBoost(drift);

      // Act: ブースト減衰
      for (let i = 0; i < 30; i++) {
        drift = updateDrift(drift, 0, 0.5, 1 / 60);
      }

      // Assert
      expect(getDriftBoost(drift)).toBeLessThan(initialBoost);
    });
  });

  describe('壁接触 → ペナルティ → ワープの連続フロー', () => {
    it('壁接触回数に応じてペナルティが段階的に増加する', () => {
      const light = calculateWallPenalty(1, 0, 1);
      const medium = calculateWallPenalty(2, 0, 1);
      const heavy = calculateWallPenalty(4, 0, 1);

      expect(light.factor).toBeGreaterThan(medium.factor);
      expect(medium.factor).toBeGreaterThan(heavy.factor);
      expect(light.wallStage).toBe(1);
      expect(medium.wallStage).toBe(2);
      expect(heavy.wallStage).toBe(3);
    });

    it('wallStuck がしきい値に達するとワープ判定になる', () => {
      expect(shouldWarp(1)).toBe(false);
      expect(shouldWarp(2)).toBe(false);
      expect(shouldWarp(3)).toBe(true);
    });
  });

  describe('HEAT 蓄積 → ブースト発動の連続フロー', () => {
    it('壁ニアミスでゲージが蓄積しブーストが発動する', () => {
      // Arrange
      let heat = createHeatState();
      const trackWidth = 55;
      const collisionDist = 25;
      const wallDist = trackWidth - 3; // 壁にかなり近い

      // Act: 壁ニアミスを繰り返してゲージを蓄積
      for (let i = 0; i < 600; i++) {
        heat = updateHeat(heat, wallDist, 999, 1 / 60, 1, trackWidth, collisionDist);
        if (heat.boostRemaining > 0) break;
      }

      // Assert: ブーストが発動した
      expect(heat.boostRemaining).toBeGreaterThan(0);
      expect(getHeatBoost(heat)).toBeGreaterThan(0);
    });

    it('ブースト発動後はクールダウンがかかる', () => {
      // Arrange
      let heat = createHeatState();
      const trackWidth = 55;
      const collisionDist = 25;
      const wallDist = trackWidth - 3;

      // ブースト発動まで蓄積
      for (let i = 0; i < 600; i++) {
        heat = updateHeat(heat, wallDist, 999, 1 / 60, 1, trackWidth, collisionDist);
        if (heat.boostRemaining > 0) break;
      }

      // Assert: クールダウン中
      expect(heat.cooldown).toBeGreaterThan(0);
      expect(heat.gauge).toBe(0);
    });
  });
});
