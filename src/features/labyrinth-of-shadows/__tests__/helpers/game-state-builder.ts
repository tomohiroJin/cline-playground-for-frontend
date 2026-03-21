/**
 * テスト用 GameState ビルダー
 * テストデータの生成を明示的にし、if ガードを不要にする
 */
import type { GameState, Player, Enemy, Item, Entity, Difficulty, EnemyType, EntityType } from '../../types';
import { FIXED_MAZE_9X9, OPEN_MAZE_7X7 } from './fixed-maze';

/** デフォルトのプレイヤー状態 */
const DEFAULT_PLAYER: Player = {
  x: 1.5,
  y: 1.5,
  angle: 0,
  stamina: 100,
};

/** デフォルトの出口位置 */
const DEFAULT_EXIT: Entity = {
  x: 7.5,
  y: 7.5,
};

/**
 * テスト用 GameState ビルダー
 * メソッドチェーンでテスト用のゲーム状態を柔軟に構築できる
 */
export class GameStateBuilder {
  private state: GameState;

  private constructor(difficulty: Difficulty = 'EASY') {
    this.state = {
      maze: FIXED_MAZE_9X9,
      items: [],
      enemies: [],
      difficulty,
      player: { ...DEFAULT_PLAYER },
      exit: { ...DEFAULT_EXIT },
      keys: 0,
      reqKeys: 2,
      time: 200000,
      lives: 5,
      maxLives: 5,
      hiding: false,
      energy: 100,
      invince: 0,
      sprinting: false,
      speedBoost: 0,
      eSpeed: 0.006,
      gTime: 0,
      lastT: 0,
      timers: { footstep: 0, enemySound: 0, heartbeat: 0 },
      msg: null,
      msgTimer: 0,
      score: 0,
      combo: 0,
      lastKeyTime: 0,
      explored: { '1,1': true },
    };
  }

  /** 新しいビルダーを作成する */
  static create(difficulty: Difficulty = 'EASY'): GameStateBuilder {
    return new GameStateBuilder(difficulty);
  }

  /** プレイヤーの状態を上書きする */
  withPlayer(overrides: Partial<Player>): this {
    this.state.player = { ...this.state.player, ...overrides };
    return this;
  }

  /** 敵を追加する */
  withEnemy(type: EnemyType, overrides?: Partial<Enemy>): this {
    const defaultEnemy: Enemy = {
      x: 5.5,
      y: 5.5,
      dir: 0,
      active: true,
      actTime: 0,
      lastSeenX: -1,
      lastSeenY: -1,
      type,
      path: [],
      pathTime: 0,
      teleportCooldown: 0,
    };
    this.state.enemies.push({ ...defaultEnemy, ...overrides });
    return this;
  }

  /** アイテムを追加する */
  withItem(type: EntityType, x: number, y: number): this {
    const item: Item = { x, y, type, got: false };
    this.state.items.push(item);
    return this;
  }

  /** 迷路を設定する */
  withMaze(maze: number[][]): this {
    this.state.maze = maze;
    return this;
  }

  /** 開放的な迷路を設定する（移動テスト用） */
  withOpenMaze(): this {
    this.state.maze = OPEN_MAZE_7X7;
    return this;
  }

  /** 出口の位置を設定する */
  withExit(x: number, y: number): this {
    this.state.exit = { x, y };
    return this;
  }

  /** ライフを設定する */
  withLives(lives: number, maxLives?: number): this {
    this.state.lives = lives;
    this.state.maxLives = maxLives ?? lives;
    return this;
  }

  /** スコアを設定する */
  withScore(score: number): this {
    this.state.score = score;
    return this;
  }

  /** 隠れ状態を設定する */
  withHiding(hiding: boolean, energy?: number): this {
    this.state.hiding = hiding;
    if (energy !== undefined) {
      this.state.energy = energy;
    }
    return this;
  }

  /** 無敵時間を設定する */
  withInvincibility(time: number): this {
    this.state.invince = time;
    return this;
  }

  /** 加速ブーストを設定する */
  withSpeedBoost(time: number): this {
    this.state.speedBoost = time;
    return this;
  }

  /** ゲーム時間を設定する */
  withGameTime(time: number): this {
    this.state.gTime = time;
    return this;
  }

  /** コンボを設定する */
  withCombo(combo: number, lastKeyTime: number): this {
    this.state.combo = combo;
    this.state.lastKeyTime = lastKeyTime;
    return this;
  }

  /** 残り時間を設定する */
  withRemainingTime(time: number): this {
    this.state.time = time;
    return this;
  }

  /** 鍵の数を設定する */
  withKeys(collected: number, required: number): this {
    this.state.keys = collected;
    this.state.reqKeys = required;
    return this;
  }

  /** 敵の速度を設定する */
  withEnemySpeed(speed: number): this {
    this.state.eSpeed = speed;
    return this;
  }

  /** ダッシュ状態を設定する */
  withSprinting(sprinting: boolean): this {
    this.state.sprinting = sprinting;
    return this;
  }

  /** メッセージを設定する */
  withMessage(msg: string | null, timer?: number): this {
    this.state.msg = msg;
    this.state.msgTimer = timer ?? 0;
    return this;
  }

  /** 探索済み領域をリセットする */
  withEmptyExplored(): this {
    this.state.explored = {};
    return this;
  }

  /** GameState を構築して返す */
  build(): GameState {
    return { ...this.state };
  }
}
