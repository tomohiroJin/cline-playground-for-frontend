// ゲームループ内の更新ロジック（純粋関数）

import type { Player, Point, Particle, Spark, Confetti } from './types';
import { Config } from './constants';
import { Logic } from './game-logic';
import { getCardMultiplier } from './card-effects';

/** プレイヤー入力の型 */
export interface PlayerInput {
  readonly rot: number;
  readonly turnRate: number;
  readonly handbrake: boolean;
}

/** プレイヤー入力を収集（純粋関数、keys/touchの読み取りのみ） */
export const collectPlayerInputs = (
  players: readonly Player[],
  keys: Record<string, boolean>,
  touch: { L: boolean; R: boolean },
  mode: string,
  demo: boolean,
  cpuSkill: number,
  cpuMiss: number,
  pts: readonly Point[]
): PlayerInput[] =>
  players.map((p, i) => {
    let rot = 0;
    let handbrake = false;
    if (demo || p.isCpu) {
      rot = Logic.cpuTurn(p, pts as Point[], demo ? 0.7 : cpuSkill, demo ? 0.03 : cpuMiss);
      if (!demo && Logic.cpuShouldDrift(p, pts as Point[], cpuSkill)) {
        handbrake = true;
      }
    } else if (i === 0) {
      if (keys.a || keys.A || touch.L) rot = -Config.game.turnRate;
      if (keys.d || keys.D || touch.R) rot = Config.game.turnRate;
      handbrake = mode === '2p' ? !!keys['code:ShiftLeft'] : !!keys[' '];
    } else {
      if (keys.ArrowLeft) rot = -Config.game.turnRate;
      if (keys.ArrowRight) rot = Config.game.turnRate;
      handbrake = !!keys['code:ShiftRight'] || !!keys.Enter;
    }
    // カード効果: 旋回速度倍率
    const turnMul = getCardMultiplier(p.activeCards, 'turnMultiplier');
    // ドリフト中は旋回速度を増幅
    const turnRate = p.drift.active && rot !== 0
      ? Math.sign(rot) * (Config.game.turnRate * 1.8 * turnMul)
      : rot * turnMul;
    return { rot, turnRate, handbrake };
  });

/** パーティクル更新（純粋関数） */
export const updateParticles = (particles: readonly Particle[]): Particle[] =>
  particles
    .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
    .filter(p => p.life > 0);

/** スパーク更新（純粋関数） */
export const updateSparks = (sparks: readonly Spark[]): Spark[] =>
  sparks
    .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
    .filter(p => p.life > 0);

/** コンフェティ更新（ミューテーション） */
export const updateConfetti = (confetti: Confetti[], height: number): void => {
  confetti.forEach(i => {
    i.y += i.vy;
    i.rot += i.rotSpd;
    if (i.y > height) i.y = -20;
  });
};
