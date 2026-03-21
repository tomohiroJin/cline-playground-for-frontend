import { processItemPickup } from '../models/item';
import type { ItemPickupContext } from '../models/item';

describe('domain/models/item', () => {
  const baseContext: ItemPickupContext = {
    lives: 3,
    maxLives: 5,
    combo: 0,
    gameTime: 5000,
    lastKeyTime: 0,
    collectedKeys: 0,
    requiredKeys: 3,
  };

  describe('processItemPickup', () => {
    describe('鍵アイテム', () => {
      test('鍵を取得するとスコアが加算される', () => {
        // Arrange & Act
        const result = processItemPickup('key', 1, 1, baseContext);

        // Assert
        expect(result.stateChanges.keys).toBe(1);
        expect(result.stateChanges.score).toBe(100);
        expect(result.stateChanges.combo).toBe(1);
      });

      test('コンボ中は鍵のスコアが増加する', () => {
        // Arrange: 直前に鍵を取得済み（コンボ窓内）
        const comboContext = { ...baseContext, combo: 2, lastKeyTime: 4000 };

        // Act
        const result = processItemPickup('key', 1, 1, comboContext);

        // Assert: コンボ 3 で 300pt
        expect(result.stateChanges.combo).toBe(3);
        expect(result.stateChanges.score).toBe(300);
      });

      test('鍵取得でサウンドイベントが発生する', () => {
        const result = processItemPickup('key', 1, 1, baseContext);
        expect(result.events).toHaveLength(1);
        expect(result.events[0]).toEqual({ type: 'SOUND_PLAY', sound: 'key', volume: 0.45 });
      });
    });

    describe('罠アイテム', () => {
      test('罠で時間がペナルティされる', () => {
        const result = processItemPickup('trap', 1, 1, baseContext);
        expect(result.stateChanges.time).toBe(-12000);
      });

      test('罠でコンボがリセットされる', () => {
        const comboContext = { ...baseContext, combo: 3 };
        const result = processItemPickup('trap', 1, 1, comboContext);
        expect(result.stateChanges.combo).toBe(0);
      });
    });

    describe('回復薬アイテム', () => {
      test('ライフが最大未満の場合、ライフが回復する', () => {
        const result = processItemPickup('heal', 1, 1, baseContext);
        expect(result.stateChanges.lives).toBe(4);
      });

      test('ライフ満タンの場合、スコアボーナスが付与される', () => {
        const fullLifeContext = { ...baseContext, lives: 5 };
        const result = processItemPickup('heal', 1, 1, fullLifeContext);
        expect(result.stateChanges.score).toBe(50);
        expect(result.stateChanges.lives).toBeUndefined();
      });
    });

    describe('加速アイテム', () => {
      test('加速ブーストが設定される', () => {
        const result = processItemPickup('speed', 1, 1, baseContext);
        expect(result.stateChanges.speedBoost).toBe(10000);
      });
    });

    describe('地図アイテム', () => {
      test('地図公開の中心座標が返される', () => {
        const result = processItemPickup('map', 3, 5, baseContext);
        expect(result.mapRevealCenter).toEqual({ x: 3, y: 5 });
      });

      test('地図のサウンドイベントが発生する', () => {
        const result = processItemPickup('map', 1, 1, baseContext);
        expect(result.events[0]).toEqual({ type: 'SOUND_PLAY', sound: 'mapReveal', volume: 0.4 });
      });
    });
  });
});
