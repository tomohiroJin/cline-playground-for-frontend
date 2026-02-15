import { getConstants, GameConstants } from './constants';
import { GameState, Mallet, Puck, Item, ItemType, FieldConfig, ObstacleState } from './types';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const EntityFactory = {
  createMallet: (x: number, y: number): Mallet => ({ x, y, vx: 0, vy: 0 }),
  createPuck: (x: number, y: number, vx = 0, vy = 1.5): Puck => ({
    x,
    y,
    vx,
    vy,
    visible: true,
    invisibleCount: 0,
  }),
  createItem: (
    template: { id: string; name: string; color: string; icon: string },
    fromTop: boolean,
    consts: GameConstants = getConstants()
  ): Item => {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { ITEM: IR } = consts.SIZES;
    return {
      ...template,
      id: template.id as ItemType,
      x: randomRange(50, W - 50),
      y: fromTop ? 80 : H - 80,
      vx: randomRange(-1, 1),
      vy: fromTop ? 2 : -2,
      r: IR,
    };
  },
  // 障害物の破壊状態を初期化
  createObstacleStates: (field?: FieldConfig): ObstacleState[] => {
    if (!field?.destructible) return [];
    const hp = field.obstacleHp ?? 3;
    return field.obstacles.map(() => ({
      hp,
      maxHp: hp,
      destroyed: false,
      destroyedAt: 0,
    }));
  },
  createGameState: (consts: GameConstants = getConstants(), field?: FieldConfig): GameState => {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    return {
      player: EntityFactory.createMallet(W / 2, H - 70),
      cpu: EntityFactory.createMallet(W / 2, 70),
      pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), Math.random() > 0.5 ? 1.5 : -1.5)],
      items: [],
      effects: {
        player: { speed: null, invisible: 0 },
        cpu: { speed: null, invisible: 0 },
      },
      lastItemSpawn: Date.now(),
      flash: null,
      goalEffect: null,
      cpuTarget: null,
      cpuTargetTime: 0,
      cpuStuckTimer: 0,
      fever: { active: false, lastGoalTime: Date.now(), extraPucks: 0 },
      particles: [],
      obstacleStates: EntityFactory.createObstacleStates(field),
    };
  },
};
