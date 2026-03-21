// エッジケース・境界値・複合シナリオのテスト

import { clamp, normalizeAngle, distance, formatTime, safeIndex, min } from '../../../domain/shared/math-utils';
import { createDriftState, startDrift, updateDrift, endDrift, cancelDrift } from '../../../domain/player/drift';
import { updateHeat } from '../../../domain/player/heat';
import { movePlayer } from '../../../domain/player/player';
import { handleCollision } from '../../../domain/race/collision';
import { createTestPlayer, createTestTrackPoints } from '../../helpers/test-factories';
import { DRIFT } from '../../../domain/player/constants';

describe('エッジケース・境界値テスト', () => {
  describe('math-utils 境界値', () => {
    it('clamp: min === max のとき min を返す', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });

    it('normalizeAngle: ちょうど π のとき π を返す', () => {
      expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 10);
    });

    it('normalizeAngle: ちょうど -π のとき -π を返す', () => {
      expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI, 10);
    });

    it('distance: 負の座標でも正しく計算する', () => {
      expect(distance(-3, -4, 0, 0)).toBeCloseTo(5);
    });

    it('formatTime: 負の値でも絶対値でフォーマットする', () => {
      expect(formatTime(-1000)).toBe('0:01.0');
    });

    it('safeIndex: 空配列ではフォールバックを返す', () => {
      expect(safeIndex([], 0, 'default')).toBe('default');
    });

    it('min: 単一要素配列', () => {
      expect(min([42])).toBe(42);
    });

    it('min: 全て同じ値', () => {
      expect(min([5, 5, 5])).toBe(5);
    });
  });

  describe('ドリフト複合シナリオ', () => {
    it('ドリフト中の壁衝突でブーストなしリセットされる', () => {
      // Arrange: ドリフト中
      let drift = createDriftState();
      drift = startDrift(drift, 0.5);
      for (let i = 0; i < 30; i++) {
        drift = updateDrift(drift, 1, 0.5, 1 / 60);
      }
      expect(drift.active).toBe(true);
      expect(drift.duration).toBeGreaterThan(0);

      // Act: 壁衝突でキャンセル
      drift = cancelDrift(drift);

      // Assert: ブーストなし
      expect(drift.active).toBe(false);
      expect(drift.boostRemaining).toBe(0);
      expect(drift.boostPower).toBe(0);
    });

    it('ドリフト終了直後に再びドリフト開始できる', () => {
      let drift = createDriftState();
      drift = startDrift(drift, 0.5);
      drift = endDrift(drift);
      expect(drift.active).toBe(false);
      expect(drift.boostRemaining).toBeGreaterThan(0);

      // 再開始
      drift = startDrift(drift, 0.5);
      expect(drift.active).toBe(true);
    });

    it('speed が MIN_SPEED 境界値でドリフトが開始する', () => {
      const drift = createDriftState();
      const atBoundary = startDrift(drift, DRIFT.MIN_SPEED);
      expect(atBoundary.active).toBe(true);

      const belowBoundary = startDrift(drift, DRIFT.MIN_SPEED - 0.001);
      expect(belowBoundary.active).toBe(false);
    });
  });

  describe('HEAT 複合シナリオ', () => {
    it('ゲージ満タン直前で自然減衰する場合はブースト発動しない', () => {
      // gauge が 0.99 で、壁ニアミスなし → 減衰で 1.0 に届かない
      const heat = { gauge: 0.99, boostRemaining: 0, boostPower: 0, cooldown: 0 };
      const result = updateHeat(heat, 0, 999, 1 / 60, 1, 55, 25);
      expect(result.gauge).toBeLessThan(0.99); // 減衰
      expect(result.boostRemaining).toBe(0);
    });
  });

  describe('movePlayer 複合シナリオ', () => {
    it('速度 0 のプレイヤーでも移動処理がエラーにならない', () => {
      const player = createTestPlayer({ speed: 0, x: 50, y: 0 });
      const track = createTestTrackPoints(4);
      expect(() => movePlayer(player, 3, track, 55)).not.toThrow();
    });

    it('速度 1（最大）のプレイヤーが 1 を超えない', () => {
      const player = createTestPlayer({ speed: 1, x: 50, y: 0 });
      const track = createTestTrackPoints(4);
      const result = movePlayer(player, 3, track, 55);
      expect(result.player.speed).toBeLessThanOrEqual(1);
    });
  });

  describe('衝突 複合シナリオ', () => {
    it('両プレイヤーがドリフト中に衝突すると両方キャンセルされる', () => {
      const p1 = createTestPlayer({
        x: 100, y: 100,
        drift: { active: true, duration: 1.0, slipAngle: 0.3, boostRemaining: 0, boostPower: 0 },
      });
      const p2 = createTestPlayer({
        x: 110, y: 100, name: 'P2',
        drift: { active: true, duration: 0.5, slipAngle: -0.2, boostRemaining: 0, boostPower: 0 },
      });
      const result = handleCollision(p1, p2, 25);
      expect(result).not.toBeNull();
      expect(result!.player1.drift.active).toBe(false);
      expect(result!.player2.drift.active).toBe(false);
    });
  });
});
