// プレイヤー移動ロジックのテスト

import { movePlayer } from '../../../domain/player/player';
import { createTestPlayer, createTestTrackPoints } from '../../helpers/test-factories';
import type { Player } from '../../../domain/player/types';

const simpleTrack = createTestTrackPoints(4);
const trackWidth = 55;

const makePlayer = (overrides: Partial<Player> = {}): Player =>
  createTestPlayer({ x: 50, y: 0, ...overrides });

describe('player', () => {
  describe('movePlayer', () => {
    it('トラック上の移動で速度が回復する', () => {
      // Arrange
      const player = makePlayer({ speed: 0.5 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.player.speed).toBeGreaterThan(0.5);
      expect(result.wallHit).toBe(false);
    });

    it('オフトラック時に wallStuck が増加する', () => {
      // Arrange
      const player = makePlayer({ x: 500, y: 500, speed: 0.5, wallStuck: 0 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.wallHit).toBe(true);
      expect(result.player.wallStuck).toBeGreaterThan(0);
    });

    it('wallStuck >= WARP_THRESHOLD でワープする', () => {
      // Arrange: ワープしきい値直前
      const player = makePlayer({ x: 500, y: 500, speed: 0.5, wallStuck: 2 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.wallHit).toBe(true);
      expect(result.player.wallStuck).toBe(0);
      expect(result.player.speed).toBe(0.3);
      expect(result.wallStage).toBe(3);
    });

    it('ドリフト中の壁接触でドリフトが強制終了する', () => {
      // Arrange
      const player = makePlayer({
        x: 500, y: 500, speed: 0.8,
        drift: { active: true, duration: 1.0, slipAngle: 0.3, boostRemaining: 0, boostPower: 0 },
      });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth, {
        handbrake: true, steering: 1,
      });

      // Assert
      expect(result.wallHit).toBe(true);
      expect(result.player.drift.active).toBe(false);
      expect(result.player.drift.boostRemaining).toBe(0);
    });

    it('シールド所持時は壁ダメージが無効化される', () => {
      // Arrange
      const player = makePlayer({ x: 500, y: 500, speed: 0.8, wallStuck: 0, shieldCount: 1 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.wallHit).toBe(true);
      expect(result.player.shieldCount).toBe(0);
      expect(result.player.speed).toBeGreaterThanOrEqual(0.5);
    });

    it('ハンドブレーキ + ステアリングでドリフトが開始する', () => {
      // Arrange
      const player = makePlayer({ speed: 0.5 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth, {
        handbrake: true, steering: 1,
      });

      // Assert
      expect(result.player.drift.active).toBe(true);
    });

    it('ドリフトブースト中は速度が加算される', () => {
      // Arrange
      const player = makePlayer({
        speed: 0.5,
        drift: { active: false, duration: 0, slipAngle: 0, boostRemaining: 0.5, boostPower: 0.3 },
      });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.velocity).toBeGreaterThan(3 * 0.5);
    });

    it('accelMultiplier が速度回復に反映される', () => {
      // Arrange
      const player = makePlayer({ speed: 0.5 });

      // Act
      const normal = movePlayer(player, 3, simpleTrack, trackWidth);
      const boosted = movePlayer(player, 3, simpleTrack, trackWidth, { accelMultiplier: 2 });

      // Assert
      expect(boosted.player.speed).toBeGreaterThan(normal.player.speed);
    });

    it('MoveResult 型の全フィールドが返される', () => {
      // Arrange
      const player = makePlayer({ speed: 0.5 });

      // Act
      const result = movePlayer(player, 3, simpleTrack, trackWidth);

      // Assert
      expect(result.player).toBeDefined();
      expect(typeof result.velocity).toBe('number');
      expect(typeof result.wallHit).toBe('boolean');
      expect(typeof result.wallStage).toBe('number');
    });
  });
});
