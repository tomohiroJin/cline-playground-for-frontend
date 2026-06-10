/**
 * CameraZoom サービスのユニットテスト
 * 速度に応じたカメラズーム率のロジックを検証する
 */

import { cameraZoomForSpeed } from './camera-zoom-service';

/** テスト用定数 */
const MIN_SPEED = 5;
const MAX_SPEED = 15;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 1.05;

describe('cameraZoomForSpeed', () => {
  describe('正常系', () => {
    it('speed が minSpeed のとき 1.0 を返す', () => {
      // Arrange & Act
      const result = cameraZoomForSpeed(MIN_SPEED, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(MIN_ZOOM);
    });

    it('speed が maxSpeed のとき 1.05 を返す', () => {
      // Arrange & Act
      const result = cameraZoomForSpeed(MAX_SPEED, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(MAX_ZOOM);
    });

    it('speed が中間値のとき線形補間された値を返す', () => {
      // Arrange: minSpeed=5, maxSpeed=15, speed=10（中間）
      const midSpeed = (MIN_SPEED + MAX_SPEED) / 2;
      const expectedZoom = (MIN_ZOOM + MAX_ZOOM) / 2; // 1.025

      // Act
      const result = cameraZoomForSpeed(midSpeed, MIN_SPEED, MAX_SPEED);

      // Assert: 1.025 に近い値
      expect(result).toBeCloseTo(expectedZoom, 5);
    });

    it('speed が 25% 地点のとき正しく補間される', () => {
      // Arrange: speed = 5 + (15-5)*0.25 = 7.5
      const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * 0.25;
      const expected = MIN_ZOOM + (MAX_ZOOM - MIN_ZOOM) * 0.25; // 1.0125

      // Act
      const result = cameraZoomForSpeed(speed, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(expected, 5);
    });
  });

  describe('異常系（範囲外のクランプ）', () => {
    it('speed が minSpeed より小さい場合 1.0 にクランプされる', () => {
      // Arrange: 速度が最小を下回る
      const tooSlow = MIN_SPEED - 10;

      // Act
      const result = cameraZoomForSpeed(tooSlow, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(MIN_ZOOM);
    });

    it('speed が maxSpeed より大きい場合 1.05 にクランプされる', () => {
      // Arrange: 速度が最大を超える
      const tooFast = MAX_SPEED + 100;

      // Act
      const result = cameraZoomForSpeed(tooFast, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(MAX_ZOOM);
    });

    it('負の speed でも 1.0 にクランプされる', () => {
      // Arrange
      const negativeSpeed = -50;

      // Act
      const result = cameraZoomForSpeed(negativeSpeed, MIN_SPEED, MAX_SPEED);

      // Assert
      expect(result).toBeCloseTo(MIN_ZOOM);
    });
  });

  describe('境界値', () => {
    it('minSpeed と maxSpeed が同じ場合 1.0 を返す（ゼロ除算回避）', () => {
      // Arrange: minSpeed === maxSpeed は normalize で 0 を返す
      const speed = 10;

      // Act
      const result = cameraZoomForSpeed(speed, 10, 10);

      // Assert: ゼロ除算にならず 1.0 を返す
      expect(result).toBeCloseTo(MIN_ZOOM);
    });

    it('speed が minSpeed をわずかに超える場合、わずかに 1.0 より大きい', () => {
      // Arrange
      const slightlyAboveMin = MIN_SPEED + 0.001;

      // Act
      const result = cameraZoomForSpeed(slightlyAboveMin, MIN_SPEED, MAX_SPEED);

      // Assert: 1.0 より少し大きく 1.05 未満
      expect(result).toBeGreaterThan(MIN_ZOOM);
      expect(result).toBeLessThan(MAX_ZOOM);
    });

    it('返り値は常に 1.0 以上 1.05 以下の範囲に収まる', () => {
      // Arrange: さまざまな速度で検証
      const testSpeeds = [-100, 0, MIN_SPEED, (MIN_SPEED + MAX_SPEED) / 2, MAX_SPEED, MAX_SPEED + 100];

      // Act & Assert
      testSpeeds.forEach((speed) => {
        const result = cameraZoomForSpeed(speed, MIN_SPEED, MAX_SPEED);
        expect(result).toBeGreaterThanOrEqual(MIN_ZOOM);
        expect(result).toBeLessThanOrEqual(MAX_ZOOM);
      });
    });
  });
});
