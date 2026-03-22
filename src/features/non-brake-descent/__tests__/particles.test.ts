import { ParticleSys } from '../particles';
import {
  buildParticle,
  buildScorePopup,
  buildNearMissEffect,
} from './helpers/test-factories';
import type { Cloud } from '../types';

describe('ParticleSys', () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  describe('updateParticle', () => {
    describe('正常系', () => {
      it('パーティクルの位置が速度に基づいて更新される', () => {
        // Arrange
        const p = buildParticle({ x: 10, y: 20, vx: 3, vy: -2 });

        // Act
        const result = ParticleSys.updateParticle(p);

        // Assert
        expect(result.x).toBe(13);
        expect(result.y).toBe(18);
      });

      it('重力が vy に加算される', () => {
        // Arrange
        const p = buildParticle({ vy: 0 });

        // Act
        const result = ParticleSys.updateParticle(p);

        // Assert
        expect(result.vy).toBe(0.25);
      });

      it('life が 1 減少する', () => {
        // Arrange
        const p = buildParticle({ life: 10 });

        // Act
        const result = ParticleSys.updateParticle(p);

        // Assert
        expect(result.life).toBe(9);
      });
    });
  });

  describe('updatePopup', () => {
    describe('正常系', () => {
      it('ポップアップの y 座標が vy 分移動する', () => {
        // Arrange
        const popup = buildScorePopup({ y: 100, vy: -2 });

        // Act
        const result = ParticleSys.updatePopup(popup);

        // Assert
        expect(result.y).toBe(98);
      });

      it('life が 1 減少する', () => {
        // Arrange
        const popup = buildScorePopup({ life: 30 });

        // Act
        const result = ParticleSys.updatePopup(popup);

        // Assert
        expect(result.life).toBe(29);
      });
    });
  });

  describe('updateNearMiss', () => {
    describe('正常系', () => {
      it('life が 1 減少する', () => {
        // Arrange
        const effect = buildNearMissEffect({ life: 20 });

        // Act
        const result = ParticleSys.updateNearMiss(effect);

        // Assert
        expect(result.life).toBe(19);
      });

      it('scale が 0.1 増加する', () => {
        // Arrange
        const effect = buildNearMissEffect({ scale: 1.0 });

        // Act
        const result = ParticleSys.updateNearMiss(effect);

        // Assert
        expect(result.scale).toBeCloseTo(1.1);
      });
    });
  });

  describe('updateCloud', () => {
    describe('正常系', () => {
      it('雲が左方向に移動する', () => {
        // Arrange
        const cloud: Cloud = {
          x: 100,
          y: 50,
          size: 40,
          speed: 0.5,
          opacity: 0.2,
        };
        const gameSpeed = 5;

        // Act
        const result = ParticleSys.updateCloud(cloud, gameSpeed);

        // Assert
        // x = 100 - 0.5 * (1 + 5 * 0.1) = 100 - 0.5 * 1.5 = 100 - 0.75 = 99.25
        expect(result.x).toBeCloseTo(99.25);
      });

      it('速度が 0 の場合、雲自身の speed のみで移動する', () => {
        // Arrange
        const cloud: Cloud = {
          x: 200,
          y: 30,
          size: 50,
          speed: 1.0,
          opacity: 0.1,
        };

        // Act
        const result = ParticleSys.updateCloud(cloud, 0);

        // Assert
        // x = 200 - 1.0 * (1 + 0 * 0.1) = 200 - 1.0 = 199.0
        expect(result.x).toBeCloseTo(199.0);
      });
    });
  });

  describe('updateAndFilter', () => {
    describe('正常系', () => {
      it('各アイテムに更新関数を適用し、life が 0 以下のものを除外する', () => {
        // Arrange
        const items = [
          buildParticle({ life: 2 }),
          buildParticle({ life: 1 }),
          buildParticle({ life: 0 }),
        ];

        // Act
        const result = ParticleSys.updateAndFilter(
          items,
          ParticleSys.updateParticle
        );

        // Assert
        // life 2→1 (残る), life 1→0 (除外), life 0→-1 (除外)
        expect(result).toHaveLength(1);
        expect(result[0].life).toBe(1);
      });

      it('全て生存している場合、全て残る', () => {
        // Arrange
        const items = [
          buildParticle({ life: 10 }),
          buildParticle({ life: 20 }),
        ];

        // Act
        const result = ParticleSys.updateAndFilter(
          items,
          ParticleSys.updateParticle
        );

        // Assert
        expect(result).toHaveLength(2);
      });

      it('空配列の場合、空配列を返す', () => {
        // Arrange & Act
        const result = ParticleSys.updateAndFilter(
          [],
          ParticleSys.updateParticle
        );

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('カスタムフィルタ', () => {
      it('カスタム述語関数でフィルタリングできる', () => {
        // Arrange
        const items = [
          buildParticle({ life: 5 }),
          buildParticle({ life: 3 }),
          buildParticle({ life: 1 }),
        ];

        // Act: life > 2 のものだけ残す
        const result = ParticleSys.updateAndFilter(
          items,
          ParticleSys.updateParticle,
          (p) => p.life > 2
        );

        // Assert
        // life 5→4 (残る), life 3→2 (除外), life 1→0 (除外)
        expect(result).toHaveLength(1);
        expect(result[0].life).toBe(4);
      });
    });
  });

  describe('updateClouds', () => {
    describe('正常系', () => {
      it('雲を更新して画面外のものを除外する', () => {
        // Arrange
        const clouds: Cloud[] = [
          { x: 100, y: 50, size: 40, speed: 0.5, opacity: 0.2 },
          { x: -50, y: 30, size: 30, speed: 0.3, opacity: 0.1 }, // size=30, x=-50 → x > -size は -50 > -30 → false → 除外
        ];

        // Act
        const result = ParticleSys.updateClouds(clouds, 5);

        // Assert
        expect(result).toHaveLength(1);
      });

      it('雲の数が max 未満かつ randomBool(0.02) が true の場合、新しい雲が追加される', () => {
        // Arrange: randomBool(0.02) が true になるよう 0.01 を返す
        randomSpy.mockReturnValue(0.01);
        const clouds: Cloud[] = [
          { x: 100, y: 50, size: 40, speed: 0.5, opacity: 0.2 },
        ];

        // Act
        const result = ParticleSys.updateClouds(clouds, 1, 8);

        // Assert
        expect(result.length).toBe(2);
      });

      it('雲の数が max 以上の場合、新しい雲は追加されない', () => {
        // Arrange
        randomSpy.mockReturnValue(0.01);
        const clouds: Cloud[] = Array.from({ length: 8 }, (_, i) => ({
          x: 100 + i * 50,
          y: 50,
          size: 40,
          speed: 0.5,
          opacity: 0.2,
        }));

        // Act
        const result = ParticleSys.updateClouds(clouds, 1, 8);

        // Assert
        expect(result.length).toBeLessThanOrEqual(8);
      });
    });

    describe('境界値', () => {
      it('空の雲配列でも動作する', () => {
        // Arrange
        randomSpy.mockReturnValue(0.01);

        // Act
        const result = ParticleSys.updateClouds([], 5);

        // Assert
        // randomBool(0.02) が true で 0 < max(8) なので 1つ追加
        expect(result).toHaveLength(1);
      });
    });
  });
});
