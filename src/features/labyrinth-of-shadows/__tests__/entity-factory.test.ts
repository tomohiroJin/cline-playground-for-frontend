import { EntityFactory, GameStateFactory } from '../entity-factory';

describe('labyrinth-of-shadows/entity-factory', () => {
  describe('EntityFactory', () => {
    test('プレイヤーを正しく生成する', () => {
      const player = EntityFactory.createPlayer(1, 2);
      expect(player.x).toBe(1.5);
      expect(player.y).toBe(2.5);
      expect(player.angle).toBe(0);
      expect(player.stamina).toBe(100);
    });

    test('敵を正しく生成する', () => {
      const enemy = EntityFactory.createEnemy(3, 4, 0);
      expect(enemy.x).toBe(3.5);
      expect(enemy.y).toBe(4.5);
      expect(enemy.active).toBe(false);
      expect(enemy.actTime).toBe(4000);
      expect(enemy.lastSeenX).toBe(-1);
    });

    test('敵の活性化時間はインデックスで変わる', () => {
      const enemy0 = EntityFactory.createEnemy(0, 0, 0);
      const enemy1 = EntityFactory.createEnemy(0, 0, 1);
      expect(enemy1.actTime).toBe(enemy0.actTime + 2500);
    });

    test('アイテムを正しく生成する', () => {
      const item = EntityFactory.createItem(2, 3, 'key');
      expect(item.x).toBe(2);
      expect(item.y).toBe(3);
      expect(item.type).toBe('key');
      expect(item.got).toBe(false);
    });

    test('出口を正しく生成する', () => {
      const exit = EntityFactory.createExit(5, 6);
      expect(exit.x).toBe(5.5);
      expect(exit.y).toBe(6.5);
    });
  });

  describe('GameStateFactory', () => {
    test('EASYモードでゲーム状態を正しく初期化する', () => {
      const state = GameStateFactory.create('EASY');
      expect(state.difficulty).toBe('EASY');
      expect(state.reqKeys).toBe(2);
      expect(state.lives).toBe(5);
      expect(state.maxLives).toBe(5);
      expect(state.maze.length).toBe(9);
      expect(state.keys).toBe(0);
      expect(state.hiding).toBe(false);
      expect(state.energy).toBe(100);
      expect(state.score).toBe(0);
    });

    test('NORMALモードでゲーム状態を正しく初期化する', () => {
      const state = GameStateFactory.create('NORMAL');
      expect(state.difficulty).toBe('NORMAL');
      expect(state.reqKeys).toBe(3);
      expect(state.lives).toBe(3);
      expect(state.maze.length).toBe(11);
    });

    test('HARDモードでゲーム状態を正しく初期化する', () => {
      const state = GameStateFactory.create('HARD');
      expect(state.difficulty).toBe('HARD');
      expect(state.reqKeys).toBe(4);
      expect(state.lives).toBe(2);
      expect(state.maze.length).toBe(14);
    });

    test('鍵アイテムの数が正しい', () => {
      const state = GameStateFactory.create('EASY');
      const keyItems = state.items.filter(i => i.type === 'key');
      expect(keyItems.length).toBe(2);
    });

    test('罠アイテムの数が正しい', () => {
      const state = GameStateFactory.create('NORMAL');
      const trapItems = state.items.filter(i => i.type === 'trap');
      expect(trapItems.length).toBe(2);
    });

    test('敵の数が正しい', () => {
      const state = GameStateFactory.create('HARD');
      expect(state.enemies.length).toBeLessThanOrEqual(3);
    });
  });
});
