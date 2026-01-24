import { CONSTANTS } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const { MALLET: MR, PUCK: BR, ITEM: IR } = CONSTANTS.SIZES;

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const EntityFactory = {
  createMallet: (x: number, y: number) => ({ x, y, vx: 0, vy: 0 }),
  createPuck: (x: number, y: number, vx = 0, vy = 1.5) => ({
    x,
    y,
    vx,
    vy,
    visible: true,
    invisibleCount: 0,
  }),
  createItem: (template: any, fromTop: boolean) => ({
    ...template,
    x: randomRange(50, W - 50),
    y: fromTop ? 80 : H - 80,
    vx: randomRange(-1, 1),
    vy: fromTop ? 2 : -2,
    r: IR,
  }),
  createGameState: () => ({
    player: EntityFactory.createMallet(W / 2, H - 70),
    cpu: EntityFactory.createMallet(W / 2, 70),
    pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), 1.5)],
    items: [] as any[],
    effects: {
      player: { speed: null as any, invisible: 0 },
      cpu: { speed: null as any, invisible: 0 },
    },
    lastItemSpawn: Date.now(),
    flash: null as any,
    goalEffect: null as any,
    cpuTarget: null as any,
    cpuTargetTime: 0,
  }),
};
