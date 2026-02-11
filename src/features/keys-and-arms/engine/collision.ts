import type { Stage } from '../types';

const resolveHitInterval = (stage: Stage, loop: number): number => {
  if (stage === 'cave') {
    return Math.max(75, 130 - loop * 8);
  }
  if (stage === 'grass') {
    return Math.max(65, 120 - loop * 10);
  }
  return Math.max(55, 110 - loop * 10);
};

/**
 * 元HTMLの挙動に合わせて、ステージごとに危険周期が短くなる判定を行う。
 */
export const checkPlayerHit = (stage: Stage, stageTick: number, loop: number): boolean => {
  const interval = resolveHitInterval(stage, loop);
  return stageTick > 0 && stageTick % interval === 0;
};
