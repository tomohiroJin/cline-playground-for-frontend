/**
 * テストデータビルダーのテスト
 */
import { aPlayer } from './playerBuilder';
import { anEnemy } from './enemyBuilder';
import { aMap } from './mapBuilder';
import { aGameState } from './gameStateBuilder';
import {
  Direction,
  PlayerClass,
  EnemyType,
  EnemyState,
  TileType,
  ScreenState,
} from '../../types';

describe('PlayerBuilder', () => {
  describe('デフォルト値', () => {
    it('デフォルトのプレイヤーを生成する', () => {
      const player = aPlayer().build();

      expect(player.x).toBe(1);
      expect(player.y).toBe(1);
      expect(player.hp).toBe(20);
      expect(player.maxHp).toBe(20);
      expect(player.direction).toBe(Direction.DOWN);
      expect(player.isInvincible).toBe(false);
      expect(player.invincibleUntil).toBe(0);
      expect(player.attackCooldownUntil).toBe(0);
      expect(player.playerClass).toBe(PlayerClass.WARRIOR);
      expect(player.level).toBe(1);
      expect(player.killCount).toBe(0);
      expect(player.slowedUntil).toBe(0);
      expect(player.hasKey).toBe(false);
      expect(player.lastRegenAt).toBe(0);
    });
  });

  describe('カスタマイズ', () => {
    it('at() で位置を設定する', () => {
      const player = aPlayer().at(5, 10).build();
      expect(player.x).toBe(5);
      expect(player.y).toBe(10);
    });

    it('withHp() でHPを設定する', () => {
      const player = aPlayer().withHp(5).build();
      expect(player.hp).toBe(5);
      expect(player.maxHp).toBe(20);
    });

    it('withHp() でHP/maxHPの両方を設定する', () => {
      const player = aPlayer().withHp(15, 30).build();
      expect(player.hp).toBe(15);
      expect(player.maxHp).toBe(30);
    });

    it('withClass() で職業を設定する', () => {
      const player = aPlayer().withClass(PlayerClass.THIEF).build();
      expect(player.playerClass).toBe(PlayerClass.THIEF);
    });

    it('withLevel() でレベルを設定する', () => {
      const player = aPlayer().withLevel(5).build();
      expect(player.level).toBe(5);
    });

    it('withStats() で能力値を部分的に設定する', () => {
      const player = aPlayer().withStats({ attackPower: 5, attackRange: 3 }).build();
      expect(player.stats.attackPower).toBe(5);
      expect(player.stats.attackRange).toBe(3);
      // 未設定の能力値はデフォルト値を保持
      expect(player.stats.moveSpeed).toBe(3);
    });

    it('withDirection() で向きを設定する', () => {
      const player = aPlayer().withDirection(Direction.RIGHT).build();
      expect(player.direction).toBe(Direction.RIGHT);
    });

    it('invincibleUntil() で無敵時間を設定する', () => {
      const player = aPlayer().invincibleUntil(5000).build();
      expect(player.isInvincible).toBe(true);
      expect(player.invincibleUntil).toBe(5000);
    });

    it('withKillCount() で撃破数を設定する', () => {
      const player = aPlayer().withKillCount(10).build();
      expect(player.killCount).toBe(10);
    });

    it('withKey() で鍵所持を設定する', () => {
      const player = aPlayer().withKey().build();
      expect(player.hasKey).toBe(true);
    });

    it('slowedUntil() で速度低下を設定する', () => {
      const player = aPlayer().slowedUntil(3000).build();
      expect(player.slowedUntil).toBe(3000);
    });
  });

  describe('メソッドチェーン', () => {
    it('複数のメソッドをチェーンできる', () => {
      const player = aPlayer()
        .at(3, 4)
        .withHp(10, 25)
        .withClass(PlayerClass.THIEF)
        .withLevel(3)
        .withStats({ attackPower: 3 })
        .withDirection(Direction.LEFT)
        .build();

      expect(player.x).toBe(3);
      expect(player.y).toBe(4);
      expect(player.hp).toBe(10);
      expect(player.maxHp).toBe(25);
      expect(player.playerClass).toBe(PlayerClass.THIEF);
      expect(player.level).toBe(3);
      expect(player.stats.attackPower).toBe(3);
      expect(player.direction).toBe(Direction.LEFT);
    });
  });

  describe('不変性', () => {
    it('build() は毎回新しいオブジェクトを返す', () => {
      const builder = aPlayer();
      const p1 = builder.build();
      const p2 = builder.build();
      expect(p1).not.toBe(p2);
      expect(p1).toEqual(p2);
    });
  });
});

describe('EnemyBuilder', () => {
  describe('デフォルト値', () => {
    it('デフォルトの敵を生成する', () => {
      const enemy = anEnemy().build();

      expect(enemy.id).toBeDefined();
      expect(enemy.x).toBe(5);
      expect(enemy.y).toBe(5);
      expect(enemy.type).toBe(EnemyType.PATROL);
      expect(enemy.hp).toBeGreaterThan(0);
      expect(enemy.maxHp).toBe(enemy.hp);
      expect(enemy.state).toBe(EnemyState.IDLE);
      expect(enemy.homePosition).toEqual({ x: 5, y: 5 });
    });
  });

  describe('カスタマイズ', () => {
    it('withId() でIDを設定する', () => {
      const enemy = anEnemy().withId('test-enemy-1').build();
      expect(enemy.id).toBe('test-enemy-1');
    });

    it('at() で位置を設定する', () => {
      const enemy = anEnemy().at(3, 7).build();
      expect(enemy.x).toBe(3);
      expect(enemy.y).toBe(7);
      expect(enemy.homePosition).toEqual({ x: 3, y: 7 });
    });

    it('withType() でタイプを設定する', () => {
      const enemy = anEnemy().withType(EnemyType.CHARGE).build();
      expect(enemy.type).toBe(EnemyType.CHARGE);
    });

    it('withHp() でHPを設定する', () => {
      const enemy = anEnemy().withHp(10).build();
      expect(enemy.hp).toBe(10);
      expect(enemy.maxHp).toBe(10);
    });

    it('withDamage() でダメージを設定する', () => {
      const enemy = anEnemy().withDamage(5).build();
      expect(enemy.damage).toBe(5);
    });

    it('withState() で状態を設定する', () => {
      const enemy = anEnemy().withState(EnemyState.CHASE).build();
      expect(enemy.state).toBe(EnemyState.CHASE);
    });

    it('dying() で撃破アニメーション中にする', () => {
      const enemy = anEnemy().dying(1000).build();
      expect(enemy.isDying).toBe(true);
      expect(enemy.deathStartTime).toBe(1000);
    });
  });

  describe('メソッドチェーン', () => {
    it('複数のメソッドをチェーンできる', () => {
      const enemy = anEnemy()
        .withId('e-1')
        .at(2, 3)
        .withType(EnemyType.BOSS)
        .withHp(50)
        .withDamage(10)
        .build();

      expect(enemy.id).toBe('e-1');
      expect(enemy.x).toBe(2);
      expect(enemy.y).toBe(3);
      expect(enemy.type).toBe(EnemyType.BOSS);
      expect(enemy.hp).toBe(50);
      expect(enemy.damage).toBe(10);
    });
  });
});

describe('MapBuilder', () => {
  describe('デフォルト値', () => {
    it('壁で囲まれた10x10のマップを生成する', () => {
      const map = aMap().build();

      expect(map.length).toBe(10);
      expect(map[0].length).toBe(10);
      // 外壁
      expect(map[0][0]).toBe(TileType.WALL);
      expect(map[0][5]).toBe(TileType.WALL);
      expect(map[9][9]).toBe(TileType.WALL);
      // 内部は床
      expect(map[1][1]).toBe(TileType.FLOOR);
      expect(map[5][5]).toBe(TileType.FLOOR);
    });
  });

  describe('カスタマイズ', () => {
    it('サイズを指定してマップを生成する', () => {
      const map = aMap(5, 8).build();
      expect(map.length).toBe(8);
      expect(map[0].length).toBe(5);
    });

    it('withWall() で壁を配置する', () => {
      const map = aMap().withWall(3, 3).build();
      expect(map[3][3]).toBe(TileType.WALL);
    });

    it('withGoal() でゴールを配置する', () => {
      const map = aMap().withGoal(8, 8).build();
      expect(map[8][8]).toBe(TileType.GOAL);
    });

    it('withStart() でスタートを配置する', () => {
      const map = aMap().withStart(1, 1).build();
      expect(map[1][1]).toBe(TileType.START);
    });

    it('withFloor() で床を配置する', () => {
      const map = aMap().withFloor(0, 0).build();
      expect(map[0][0]).toBe(TileType.FLOOR);
    });
  });

  describe('不変性', () => {
    it('build() は毎回新しいマップを返す', () => {
      const builder = aMap();
      const m1 = builder.build();
      const m2 = builder.build();
      expect(m1).not.toBe(m2);
      expect(m1).toEqual(m2);
    });
  });
});

describe('GameStateBuilder', () => {
  describe('デフォルト値', () => {
    it('デフォルトのゲーム状態を生成する', () => {
      const state = aGameState().build();

      expect(state.map).toBeDefined();
      expect(state.player).toBeDefined();
      expect(state.screen).toBe(ScreenState.GAME);
      expect(state.isCleared).toBe(false);
      expect(state.enemies).toEqual([]);
      expect(state.items).toEqual([]);
      expect(state.traps).toEqual([]);
      expect(state.walls).toEqual([]);
      expect(state.isLevelUpPending).toBe(false);
    });
  });

  describe('カスタマイズ', () => {
    it('withPlayer() でプレイヤーを設定する', () => {
      const player = aPlayer().at(3, 3).withHp(5).build();
      const state = aGameState().withPlayer(player).build();
      expect(state.player.x).toBe(3);
      expect(state.player.hp).toBe(5);
    });

    it('withEnemy() で敵を追加する', () => {
      const enemy = anEnemy().at(5, 5).build();
      const state = aGameState().withEnemy(enemy).build();
      expect(state.enemies).toHaveLength(1);
      expect(state.enemies[0].x).toBe(5);
    });

    it('withEnemies() で敵リストを設定する', () => {
      const enemies = [anEnemy().at(1, 1).build(), anEnemy().at(2, 2).build()];
      const state = aGameState().withEnemies(enemies).build();
      expect(state.enemies).toHaveLength(2);
    });

    it('withMap() でマップを設定する', () => {
      const map = aMap(5, 5).build();
      const state = aGameState().withMap(map).build();
      expect(state.map.length).toBe(5);
    });

    it('withScreen() で画面状態を設定する', () => {
      const state = aGameState().withScreen(ScreenState.TITLE).build();
      expect(state.screen).toBe(ScreenState.TITLE);
    });

    it('cleared() でクリア状態にする', () => {
      const state = aGameState().cleared().build();
      expect(state.isCleared).toBe(true);
    });

    it('withItems() でアイテムリストを設定する', () => {
      const state = aGameState().withItems([{ id: 'item-1', x: 1, y: 1, type: 'health_small', healAmount: 3 } as never]).build();
      expect(state.items).toHaveLength(1);
    });

    it('withTraps() で罠リストを設定する', () => {
      const state = aGameState().withTraps([]).build();
      expect(state.traps).toEqual([]);
    });

    it('withWalls() で壁リストを設定する', () => {
      const state = aGameState().withWalls([]).build();
      expect(state.walls).toEqual([]);
    });

    it('levelUpPending() でレベルアップ保留にする', () => {
      const state = aGameState().levelUpPending().build();
      expect(state.isLevelUpPending).toBe(true);
    });
  });
});
