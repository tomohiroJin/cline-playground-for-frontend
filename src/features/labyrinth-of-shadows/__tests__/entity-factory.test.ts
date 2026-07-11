import { EntityFactory, GameStateFactory } from '../entity-factory';
import { CONFIG } from '../constants';
import { GAME_BALANCE } from '../domain/constants';

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
      expect(state.maze.length).toBe(18); // 2セル幅化で 9×2
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
      expect(state.maze.length).toBe(22); // 2セル幅化で 11×2
    });

    test('HARDモードでゲーム状態を正しく初期化する', () => {
      const state = GameStateFactory.create('HARD');
      expect(state.difficulty).toBe('HARD');
      expect(state.reqKeys).toBe(4);
      expect(state.lives).toBe(2);
      expect(state.maze.length).toBe(28); // 2セル幅化で 14×2
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
      expect(state.enemies.length).toBeLessThanOrEqual(4);
    });

    test('新アイテム（回復薬）が生成される', () => {
      const state = GameStateFactory.create('EASY');
      const healItems = state.items.filter(i => i.type === 'heal');
      expect(healItems.length).toBe(2);
    });

    test('新アイテム（加速）が生成される', () => {
      const state = GameStateFactory.create('NORMAL');
      const speedItems = state.items.filter(i => i.type === 'speed');
      expect(speedItems.length).toBe(1);
    });

    test('敵タイプが正しく割り当てられる（EASYは徘徊型のみ）', () => {
      const state = GameStateFactory.create('EASY');
      const wanderers = state.enemies.filter(e => e.type === 'wanderer');
      expect(wanderers.length).toBe(1);
    });

    test('敵タイプが正しく割り当てられる（NORMALは徘徊+追跡）', () => {
      const state = GameStateFactory.create('NORMAL');
      const wanderers = state.enemies.filter(e => e.type === 'wanderer');
      const chasers = state.enemies.filter(e => e.type === 'chaser');
      expect(wanderers.length).toBe(1);
      expect(chasers.length).toBe(1);
    });

    test('敵タイプが正しく割り当てられる（HARDはテレポート型含む）', () => {
      const state = GameStateFactory.create('HARD');
      const teleporters = state.enemies.filter(e => e.type === 'teleporter');
      expect(teleporters.length).toBeLessThanOrEqual(1);
    });

    test('speedBoostが0で初期化される', () => {
      const state = GameStateFactory.create('EASY');
      expect(state.speedBoost).toBe(0);
    });

    test('敵にBFS関連フィールドが初期化されている', () => {
      const enemy = EntityFactory.createEnemy(3, 4, 0, 'chaser');
      expect(enemy.type).toBe('chaser');
      expect(enemy.path).toEqual([]);
      expect(enemy.pathTime).toBe(0);
      expect(enemy.teleportCooldown).toBe(0);
    });
  });
});

describe('Phase2: 敵の状態機械フィールド', () => {
  it('createEnemy は patrol 状態・タイマー0で初期化する', () => {
    const e = EntityFactory.createEnemy(2, 3, 0, 'chaser');
    expect(e.aiState).toBe('patrol');
    expect(e.searchTimer).toBe(0);
    expect(e.loseSightTimer).toBe(0);
  });
});

describe('通路2セル幅化', () => {
  it('生成される迷路はグリッドが難易度サイズの2倍（各セル2x2拡大）', () => {
    const g = GameStateFactory.create('NORMAL');
    expect(g.maze).toHaveLength(CONFIG.difficulties.NORMAL.size * 2);
    expect(g.maze[0]).toHaveLength(CONFIG.difficulties.NORMAL.size * 2);
  });

  it('プレイヤーの初期位置は通路上にある', () => {
    const g = GameStateFactory.create('NORMAL');
    const cx = Math.floor(g.player.x);
    const cy = Math.floor(g.player.y);
    expect(g.maze[cy][cx]).toBe(0);
  });
});

describe('Phase2: 石と索敵の初期状態', () => {
  it('GameState は石の初期所持数・視界パラメータを難易度から引き継ぐ', () => {
    const g = GameStateFactory.create('NORMAL');
    expect(g.stones).toBe(GAME_BALANCE.stone.INITIAL_COUNT);
    expect(g.stoneProjectiles).toEqual([]);
    expect(g.sightRange).toBe(CONFIG.difficulties.NORMAL.sightRange);
    expect(g.searchDuration).toBe(CONFIG.difficulties.NORMAL.searchDuration);
  });

  it('小石アイテムが難易度定義の個数だけ配置される', () => {
    const g = GameStateFactory.create('NORMAL');
    const stones = g.items.filter(i => i.type === 'stone');
    expect(stones).toHaveLength(CONFIG.difficulties.NORMAL.stonePickups);
  });

  it('敵速度はプレイヤー速度の MAX_SPEED_RATIO 以下', () => {
    for (const d of ['EASY', 'NORMAL', 'HARD'] as const) {
      expect(CONFIG.difficulties[d].enemySpeed).toBeLessThanOrEqual(
        GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO
      );
    }
  });
});
