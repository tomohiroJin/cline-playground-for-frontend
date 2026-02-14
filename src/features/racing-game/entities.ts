// Racing Game エンティティ生成

import type { Player, Particle, Spark, Confetti, Decoration } from './types';
import { Config, Colors } from './constants';
import { Utils } from './utils';

export const Entity = {
  player: (
    x: number,
    y: number,
    angle: number,
    color: string,
    name: string,
    isCpu: boolean
  ): Player => ({
    x,
    y,
    angle,
    color,
    name,
    isCpu,
    lap: 1,
    checkpointFlags: 0,
    lapTimes: [],
    lapStart: 0,
    speed: 1,
    wallStuck: 0,
    progress: 0,
    lastSeg: -1,
  }),

  particle: (x: number, y: number, i: number): Particle => {
    const a = (i / Config.game.particleCount) * Math.PI * 2;
    return {
      x,
      y,
      vx: Math.cos(a) * 3,
      vy: Math.sin(a) * 3,
      life: 1,
      size: 3,
      color: Colors.particle[i % 3],
    };
  },

  spark: (x: number, y: number, angle: number, color: string): Spark => ({
    x: x - Math.cos(angle) * 20 + Utils.randRange(-15, 15),
    y: y - Math.sin(angle) * 20 + Utils.randRange(-15, 15),
    vx: -Math.cos(angle) * 8,
    vy: -Math.sin(angle) * 8,
    life: 0.5,
    color,
  }),

  confetti: (): Confetti => ({
    x: Math.random() * Config.canvas.width,
    y: Utils.randRange(-700, 0),
    vx: Utils.randRange(-2, 2),
    vy: Utils.randRange(3, 8),
    size: Utils.randRange(5, 15),
    color: Utils.randChoice(Colors.confetti)!,
    rot: Utils.randRange(0, 360),
    rotSpd: Utils.randRange(-7.5, 7.5),
  }),

  decoration: (x: number, y: number): Decoration => ({ x, y, variant: Utils.randInt(3) }),
};
