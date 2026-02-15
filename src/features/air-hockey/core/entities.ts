import { CONSTANTS } from './constants';
import { GameState, Mallet, Puck, Item, ItemType, FieldConfig } from './types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const { ITEM: IR } = CONSTANTS.SIZES;

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
    fromTop: boolean
  ): Item => ({
    ...template,
    id: template.id as ItemType,
    x: randomRange(50, W - 50),
    y: fromTop ? 80 : H - 80,
    vx: randomRange(-1, 1),
    vy: fromTop ? 2 : -2,
    r: IR,
  }),
  createGameState: (field?: FieldConfig): GameState => ({
    player: EntityFactory.createMallet(W / 2, H - 70),
    cpu: EntityFactory.createMallet(W / 2, 70),
    pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), 1.5)],
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
    obstacleStates: field?.destructible
      ? field.obstacles.map(() => ({
          hp: field.obstacleHp ?? 3,
          maxHp: field.obstacleHp ?? 3,
          destroyedAt: null,
        }))
      : [],
  }),
};
