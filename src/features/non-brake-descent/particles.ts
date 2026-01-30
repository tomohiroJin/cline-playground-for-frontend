import { EntityFactory } from './entities';
import { MathUtils } from './domains/math-utils';
import { Cloud, NearMissEffect, Particle, ScorePopup } from './types';

export const ParticleSys = {
  updateParticle: (p: Particle): Particle => ({
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vy: p.vy + 0.25,
    life: p.life - 1,
  }),
  updatePopup: (p: ScorePopup): ScorePopup => ({ ...p, y: p.y + p.vy, life: p.life - 1 }),
  updateNearMiss: (e: NearMissEffect): NearMissEffect => ({ ...e, life: e.life - 1, scale: e.scale + 0.1 }),
  updateCloud: (c: Cloud, speed: number): Cloud => ({ ...c, x: c.x - c.speed * (1 + speed * 0.1) }),
  updateAndFilter: <T extends { life: number }>(items: T[], fn: (value: T) => T, pred = (i: T) => i.life > 0): T[] =>
    items.map(fn).filter(pred),
  updateClouds: (clouds: Cloud[], speed: number, max = 8): Cloud[] => {
    let updated = clouds
      .map(cloud => ParticleSys.updateCloud(cloud, speed))
      .filter(cloud => cloud.x > -cloud.size);
    if (updated.length < max && MathUtils.randomBool(0.02)) {
      updated = [...updated, EntityFactory.createCloud()];
    }
    return updated;
  },
} as const;
