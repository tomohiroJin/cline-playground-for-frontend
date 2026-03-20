// InputProcessor のテスト

import { processInput } from '../../application/input-processor';
import { createTestPlayer } from '../helpers/test-factories';
import type { InputState } from '../../application/ports/input-port';

describe('InputProcessor', () => {
  describe('processInput（人間プレイヤー）', () => {
    it('左入力で負のステアリングを返す', () => {
      const player = createTestPlayer({ speed: 0.5 });
      const input: InputState = { left: true, right: false, handbrake: false };
      const cmd = processInput(player, input, null, [], 55);
      expect(cmd.steering).toBeLessThan(0);
    });

    it('右入力で正のステアリングを返す', () => {
      const player = createTestPlayer({ speed: 0.5 });
      const input: InputState = { left: false, right: true, handbrake: false };
      const cmd = processInput(player, input, null, [], 55);
      expect(cmd.steering).toBeGreaterThan(0);
    });

    it('入力なしでステアリング 0 を返す', () => {
      const player = createTestPlayer({ speed: 0.5 });
      const input: InputState = { left: false, right: false, handbrake: false };
      const cmd = processInput(player, input, null, [], 55);
      expect(cmd.steering).toBe(0);
    });

    it('ハンドブレーキ入力が反映される', () => {
      const player = createTestPlayer({ speed: 0.5 });
      const input: InputState = { left: false, right: true, handbrake: true };
      const cmd = processInput(player, input, null, [], 55);
      expect(cmd.handbrake).toBe(true);
    });
  });

  describe('processInput（CPU プレイヤー）', () => {
    it('CpuStrategy を使ってステアリングを計算する', () => {
      const player = createTestPlayer({ speed: 0.5, isCpu: true });
      const trackPoints = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
      ];
      const mockStrategy = {
        calculateTurn: () => 0.05,
        shouldDrift: () => false,
      };
      const input: InputState = { left: false, right: false, handbrake: false };
      const cmd = processInput(player, input, mockStrategy, trackPoints, 55);
      expect(cmd.steering).toBe(0.05);
    });

    it('CpuStrategy がドリフト推奨時はハンドブレーキが true', () => {
      const player = createTestPlayer({ speed: 0.5, isCpu: true });
      const trackPoints = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 },
      ];
      const mockStrategy = {
        calculateTurn: () => 0.05,
        shouldDrift: () => true,
      };
      const input: InputState = { left: false, right: false, handbrake: false };
      const cmd = processInput(player, input, mockStrategy, trackPoints, 55);
      expect(cmd.handbrake).toBe(true);
    });
  });

  describe('processInput（カード効果）', () => {
    it('turnMultiplier がステアリングに反映される', () => {
      const player = createTestPlayer({
        speed: 0.5,
        activeCards: [{ turnMultiplier: 2.0 }],
      });
      const input: InputState = { left: false, right: true, handbrake: false };
      const normal = processInput(createTestPlayer({ speed: 0.5 }), input, null, [], 55);
      const boosted = processInput(player, input, null, [], 55);
      expect(Math.abs(boosted.turnRate)).toBeGreaterThan(Math.abs(normal.turnRate));
    });
  });
});
