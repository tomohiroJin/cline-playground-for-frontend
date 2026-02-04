import { Config } from './config';
import { ObstacleType, RampType } from './constants';
import { EntityFactory } from './entities';
import { MathUtils } from './domains/math-utils';
import { Obstacle, Ramp } from './types';

const isDefined = <T,>(value: T | undefined): value is T => value !== undefined;

type ObstacleGenEntry = {
  maxProb: number;
  type: Obstacle['t'];
  extras?: () => Partial<Obstacle>;
};

const obstacleTable: ObstacleGenEntry[] = [
    { maxProb: 0.1, type: ObstacleType.HOLE_S },
    { maxProb: 0.18, type: ObstacleType.HOLE_L },
    { maxProb: 0.28, type: ObstacleType.ROCK },
    {
      maxProb: 0.4,
      type: ObstacleType.ENEMY,
      extras: () => ({
        phase: MathUtils.randomRange(0, Math.PI * 2),
        moveDir: MathUtils.randomBool() ? 1 : -1,
        walkPos: MathUtils.randomRange(0, 100),
      }),
    },
    {
      maxProb: 0.48,
      type: ObstacleType.ENEMY_V,
      extras: () => ({
        phase: MathUtils.randomRange(0, Math.PI * 2),
        vSpeed: MathUtils.randomRange(0.1, 0.2),
      }),
    },
    { maxProb: 0.62, type: ObstacleType.SCORE },
    { maxProb: 0.72, type: ObstacleType.REVERSE },
    { maxProb: 0.8, type: ObstacleType.FORCE_JUMP },
];

export const ObstacleGen = {
  table: obstacleTable,
  generate: (pos: number): Obstacle | undefined => {
    const entry = ObstacleGen.table.find(candidate => Math.random() < candidate.maxProb);
    return entry ? EntityFactory.createObstacle(entry.type, pos, entry.extras ? entry.extras() : {}) : undefined;
  },
} as const;

export const RampGen = {
  genObs: (i: number, total: number): Obstacle[] => {
    if (i <= 2 || i >= total - 2) return [];
    const diff = Math.min(1, i / 60);
    const count = MathUtils.randomBool(0.2 + diff * 0.2) ? 2 : 1;
    return (count === 2
      ? [MathUtils.randomRange(0.2, 0.4), MathUtils.randomRange(0.6, 0.8)]
      : [MathUtils.randomRange(0.3, 0.7)]
    )
      .map(ObstacleGen.generate)
      .filter(isDefined);
  },
  selectType: (i: number): Ramp['type'] =>
    i <= 5 || !MathUtils.randomBool(0.25)
      ? RampType.NORMAL
      : ([RampType.STEEP, RampType.GENTLE, RampType.V_SHAPE][
          Math.floor(Math.random() * 3)
        ] ?? RampType.NORMAL),
  generate: (total: number): Ramp[] => {
    let dir: Ramp['dir'] = 1;
    return Array.from({ length: total }, (_, i) => {
      const ramp = EntityFactory.createRamp(dir, RampGen.genObs(i, total), RampGen.selectType(i), i === total - 1);
      dir = dir * -1 as Ramp['dir'];
      return ramp;
    });
  },
} as const;

export const BackgroundGen = {
  initBuildings: (): ReturnType<typeof EntityFactory.createBuilding>[] => {
    const buildings: ReturnType<typeof EntityFactory.createBuilding>[] = [];
    for (let x = 0; x < Config.screen.width + 200; x += MathUtils.randomRange(50, 90)) {
      buildings.push(EntityFactory.createBuilding(x));
    }
    return buildings;
  },
  initClouds: (n = 6): ReturnType<typeof EntityFactory.createCloud>[] =>
    Array.from({ length: n }, () => EntityFactory.createCloud()),
} as const;
