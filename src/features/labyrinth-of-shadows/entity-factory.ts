import { CONFIG } from './constants';
import type { Difficulty, EntityType, EnemyType, Player, Enemy, Item, Entity, GameState } from './types';
import { manhattan } from './utils';
import { MazeService } from './maze-service';

// ==================== ENTITY FACTORY ====================
export const EntityFactory = {
  createPlayer: (x: number, y: number): Player => ({
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    stamina: 100,
  }),
  createEnemy: (x: number, y: number, idx: number, type: EnemyType = 'chaser'): Enemy => ({
    x: x + 0.5,
    y: y + 0.5,
    dir: Math.random() * Math.PI * 2,
    active: false,
    actTime: 4000 + idx * 2500,
    lastSeenX: -1,
    lastSeenY: -1,
    type,
    path: [],
    pathTime: 0,
    teleportCooldown: 0,
  }),
  createItem: (x: number, y: number, type: EntityType): Item => ({ x, y, type, got: false }),
  createExit: (x: number, y: number): Entity => ({ x: x + 0.5, y: y + 0.5 }),
};

// ==================== GAME STATE FACTORY ====================
export const GameStateFactory = {
  create(difficulty: Difficulty): GameState {
    const cfg = CONFIG.difficulties[difficulty];
    const maze = difficulty === 'HARD' && Math.random() < 0.5
      ? MazeService.createPrim(cfg.size)
      : MazeService.create(cfg.size);
    const cells = MazeService.getEmptyCells(maze);

    const playerCell = cells.shift()!;
    const exitCell = cells.pop()!;
    const farCells = cells.filter(
      c => manhattan(c.x, c.y, playerCell.x, playerCell.y) >= CONFIG.enemy.minSpawnDist
    );

    const items: Item[] = [
      ...cells.splice(0, cfg.keys).map(c => EntityFactory.createItem(c.x, c.y, 'key')),
      ...cells.splice(0, cfg.traps).map(c => EntityFactory.createItem(c.x, c.y, 'trap')),
      ...cells.splice(0, cfg.heals).map(c => EntityFactory.createItem(c.x, c.y, 'heal')),
      ...cells.splice(0, cfg.speeds).map(c => EntityFactory.createItem(c.x, c.y, 'speed')),
      ...cells.splice(0, cfg.maps).map(c => EntityFactory.createItem(c.x, c.y, 'map')),
    ];

    // 敵タイプ別に生成
    const enemyTypes: EnemyType[] = [
      ...Array(cfg.wanderers).fill('wanderer' as EnemyType),
      ...Array(cfg.chasers).fill('chaser' as EnemyType),
      ...Array(cfg.teleporters).fill('teleporter' as EnemyType),
    ];

    const enemies: Enemy[] = enemyTypes.map((type, i) => {
      const c = farCells.shift() || cells.shift();
      return c ? EntityFactory.createEnemy(c.x, c.y, i, type) : null;
    }).filter((e): e is Enemy => e !== null);

    return {
      maze,
      items,
      enemies,
      difficulty,
      player: EntityFactory.createPlayer(playerCell.x, playerCell.y),
      exit: EntityFactory.createExit(exitCell.x, exitCell.y),
      keys: 0,
      reqKeys: cfg.keys,
      time: cfg.time * 1000,
      lives: cfg.lives,
      maxLives: cfg.lives,
      hiding: false,
      energy: 100,
      invince: 0,
      sprinting: false,
      speedBoost: 0,
      eSpeed: cfg.enemySpeed,
      gTime: 0,
      lastT: performance.now(),
      timers: { footstep: 0, enemySound: 0, heartbeat: 0 },
      msg: null,
      msgTimer: 0,
      score: 0,
      combo: 0,
      lastKeyTime: 0,
      explored: { [`${playerCell.x},${playerCell.y}`]: true },
    };
  },
};
