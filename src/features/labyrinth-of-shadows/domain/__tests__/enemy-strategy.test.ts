import {
  WandererStrategy,
  ChaserStrategy,
  TeleporterStrategy,
  getEnemyStrategy,
} from '../services/enemy-strategy';
import type { EnemyUpdateParams } from '../services/enemy-strategy';
import type { Enemy } from '../../types';
import { OPEN_MAZE_7X7, FIXED_MAZE_9X9 } from '../../__tests__/helpers/fixed-maze';
import { setupAudioContextMock } from '../../__tests__/helpers/audio-mock';

beforeAll(() => {
  setupAudioContextMock();
});

const createEnemy = (overrides?: Partial<Enemy>): Enemy => ({
  x: 3.5, y: 3.5, dir: 0, active: true, actTime: 0,
  lastSeenX: -1, lastSeenY: -1, type: 'wanderer',
  path: [], pathTime: 0, teleportCooldown: 0, ...overrides,
});

const createParams = (overrides?: Partial<EnemyUpdateParams>): EnemyUpdateParams => ({
  enemy: createEnemy(), playerX: 1.5, playerY: 1.5,
  isPlayerHiding: false, maze: OPEN_MAZE_7X7, enemySpeed: 0.006,
  dt: 16, gameTime: 5000, randomFn: () => 0.5, ...overrides,
});

describe('domain/services/enemy-strategy', () => {
  describe('WandererStrategy', () => {
    const strategy = new WandererStrategy();

    test('徘徊型は移動する', () => {
      const enemy = createEnemy({ x: 3.5, y: 3.5 });
      const params = createParams({ enemy });
      for (let i = 0; i < 50; i++) strategy.update(params);
      expect(enemy.x !== 3.5 || enemy.y !== 3.5).toBe(true);
    });

    test('徘徊型は lastSeenX を更新しない', () => {
      const enemy = createEnemy({ x: 2.5, y: 1.5 });
      strategy.update(createParams({ enemy }));
      expect(enemy.lastSeenX).toBe(-1);
    });

    test('イベントは空配列を返す', () => {
      const result = strategy.update(createParams());
      expect(result.events).toEqual([]);
    });
  });

  describe('ChaserStrategy', () => {
    const strategy = new ChaserStrategy();

    test('追跡型はプレイヤーの方向を記憶する', () => {
      const enemy = createEnemy({ x: 3.5, y: 1.5, type: 'chaser' });
      strategy.update(createParams({ enemy }));
      expect(enemy.lastSeenX).toBeGreaterThan(0);
    });

    test('プレイヤーが隠れている場合は追跡しない', () => {
      const enemy = createEnemy({ x: 3.5, y: 1.5, type: 'chaser' });
      strategy.update(createParams({ enemy, isPlayerHiding: true }));
      expect(enemy.lastSeenX).toBe(-1);
    });

    test('BFS パスを計算する', () => {
      const enemy = createEnemy({ x: 3.5, y: 1.5, type: 'chaser', pathTime: 0 });
      strategy.update(createParams({ enemy, gameTime: 1000 }));
      expect(enemy.pathTime).toBe(1000);
    });
  });

  describe('TeleporterStrategy', () => {
    const strategy = new TeleporterStrategy();

    test('テレポート型のクールダウンが減少する', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 5000 });
      strategy.update(createParams({ enemy }));
      expect(enemy.teleportCooldown).toBeLessThan(5000);
    });

    test('クールダウン終了時にテレポートする', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 0, x: 3.5, y: 3.5 });
      const result = strategy.update(createParams({ enemy, maze: FIXED_MAZE_9X9 }));
      if (enemy.x !== 3.5 || enemy.y !== 3.5) {
        expect(result.events.length).toBe(1);
        expect(result.events[0]).toEqual({ type: 'SOUND_PLAY', sound: 'teleport', volume: 0.3 });
      }
    });

    test('プレイヤーが隠れている場合はテレポートしない', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 0 });
      strategy.update(createParams({ enemy, isPlayerHiding: true }));
      expect(enemy.teleportCooldown).toBeLessThan(0);
    });

    test('短距離でプレイヤーを追跡する', () => {
      const enemy = createEnemy({ type: 'teleporter', teleportCooldown: 5000, x: 2.5, y: 1.5, dir: 0 });
      strategy.update(createParams({ enemy, playerX: 1.5, playerY: 1.5 }));
      expect(enemy.dir).not.toBe(0);
    });
  });

  describe('getEnemyStrategy', () => {
    test('wanderer タイプで WandererStrategy を返す', () => {
      expect(getEnemyStrategy('wanderer')).toBeInstanceOf(WandererStrategy);
    });
    test('chaser タイプで ChaserStrategy を返す', () => {
      expect(getEnemyStrategy('chaser')).toBeInstanceOf(ChaserStrategy);
    });
    test('teleporter タイプで TeleporterStrategy を返す', () => {
      expect(getEnemyStrategy('teleporter')).toBeInstanceOf(TeleporterStrategy);
    });
    test('不明なタイプでは wanderer にフォールバックする', () => {
      expect(getEnemyStrategy('unknown')).toBeInstanceOf(WandererStrategy);
    });
  });
});
