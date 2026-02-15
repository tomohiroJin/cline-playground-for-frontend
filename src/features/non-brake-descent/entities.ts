import { Config } from './config';
import { MathUtils } from './domains/math-utils';
import { Building, Cloud, NearMissEffect, Obstacle, Particle, Player, Ramp, ScorePopup } from './types';
import { RampType } from './constants';

const randomBool = MathUtils.randomBool;

export const EntityFactory = {
  createPlayer: (): Player => ({
    x: 60,
    y: 0,
    ramp: 0,
    vx: 0,
    vy: 0,
    jumping: false,
    jumpCD: 0,
    onGround: true,
  }),
  createParticle: (x: number, y: number, color: string, lifetime = Config.particle.lifetime): Particle => ({
    x,
    y,
    color,
    vx: MathUtils.randomRange(-3, 3),
    vy: -Math.random() * 5,
    life: lifetime,
  }),
  createParticles: (
    x: number,
    y: number,
    color: string,
    count: number = Config.particle.defaultCount
  ): Particle[] =>
    Array.from({ length: count }, () => EntityFactory.createParticle(x, y, color)),
  createJetParticle: (x: number, y: number, dir: number): Particle => ({
    x: x - dir * 10 + MathUtils.randomRange(-4, 4),
    y: y + 5,
    color: randomBool() ? '#ff6600' : '#ffaa00',
    vx: -dir * MathUtils.randomRange(2, 5),
    vy: MathUtils.randomRange(-1, 1),
    life: MathUtils.randomRange(15, 25),
  }),
  createScorePopup: (x: number, y: number, text: string, color = '#fff'): ScorePopup => ({
    x,
    y,
    text,
    color,
    life: 60,
    vy: -2,
  }),
  createNearMissEffect: (x: number, y: number): NearMissEffect => ({ x, y, life: 30, scale: 1 }),
  createObstacle: (type: Obstacle['t'], pos: number, extras: Partial<Obstacle> = {}): Obstacle => ({
    t: type,
    pos,
    passed: false,
    ...extras,
  }),
  createRamp: (dir: Ramp['dir'], obs: Obstacle[], type: (typeof RampType)[keyof typeof RampType], isGoal: boolean): Ramp => ({
    dir,
    obs,
    type,
    isGoal,
  }),
  createCloud: (): Cloud => ({
    x: Config.screen.width + MathUtils.randomRange(0, 100),
    y: MathUtils.randomRange(0, Config.screen.height * 0.4),
    size: MathUtils.randomRange(30, 80),
    speed: MathUtils.randomRange(0.3, 0.8),
    opacity: MathUtils.randomRange(0.1, 0.3),
  }),
  createBuilding: (x: number): Building => {
    const width = MathUtils.randomRange(30, 90);
    const windows = Math.floor(MathUtils.randomRange(3, 8));
    const cols = Math.floor(width / 12);
    return {
      x,
      width,
      height: MathUtils.randomRange(100, 300),
      windows,
      color: `hsl(${MathUtils.randomRange(200, 240)}, 30%, ${MathUtils.randomRange(15, 25)}%)`,
      windowLit: Array.from({ length: windows }, () =>
        Array.from({ length: cols }, () => MathUtils.randomBool(0.7))
      ),
    };
  },
} as const;
