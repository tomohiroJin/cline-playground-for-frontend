/**
 * ゲーム状態テストデータビルダー
 * テストで使用するGameStateを流暢なAPIで構築する
 */
import {
  GameState,
  GameMap,
  Player,
  Enemy,
  Item,
  Trap,
  Wall,
  ScreenState,
  ScreenStateValue,
} from '../../types';
import { aPlayer } from './playerBuilder';
import { aMap } from './mapBuilder';

export class GameStateBuilder {
  private data: GameState;

  constructor() {
    this.data = {
      map: aMap().build(),
      player: aPlayer().build(),
      screen: ScreenState.GAME,
      isCleared: false,
      enemies: [],
      items: [],
      traps: [],
      walls: [],
      isLevelUpPending: false,
    };
  }

  withMap(map: GameMap): this {
    this.data.map = map;
    return this;
  }

  withPlayer(player: Player): this {
    this.data.player = player;
    return this;
  }

  withEnemy(enemy: Enemy): this {
    this.data.enemies = [...this.data.enemies, enemy];
    return this;
  }

  withEnemies(enemies: Enemy[]): this {
    this.data.enemies = [...enemies];
    return this;
  }

  withItems(items: Item[]): this {
    this.data.items = [...items];
    return this;
  }

  withTraps(traps: Trap[]): this {
    this.data.traps = [...traps];
    return this;
  }

  withWalls(walls: Wall[]): this {
    this.data.walls = [...walls];
    return this;
  }

  withScreen(screen: ScreenStateValue): this {
    this.data.screen = screen;
    return this;
  }

  cleared(): this {
    this.data.isCleared = true;
    return this;
  }

  levelUpPending(): this {
    this.data.isLevelUpPending = true;
    return this;
  }

  build(): GameState {
    return {
      ...this.data,
      enemies: [...this.data.enemies],
      items: [...this.data.items],
      traps: [...this.data.traps],
      walls: [...this.data.walls],
    };
  }
}

/** GameStateBuilder のファクトリ関数 */
export const aGameState = (): GameStateBuilder => new GameStateBuilder();
