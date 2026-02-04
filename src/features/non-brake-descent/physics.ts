import { Config } from './config';
import { EffectType } from './constants';
import { EffectTypeValue, InputState, Player, Ramp } from './types';
import { MathUtils } from './domains/math-utils';

export const Physics = {
  applyMovement: (player: Player, input: InputState, speed: number, dir: Ramp['dir']): Player => {
    let vx =
      player.vx + (input.left ? -Config.physics.moveAccel : 0) + (input.right ? Config.physics.moveAccel : 0);
    vx *= Config.physics.friction;
    return {
      ...player,
      x: MathUtils.clamp(player.x + dir * speed * 1.2 + vx, 25, Config.screen.width - 25),
      vx,
    };
  },
  applyJump: (
    player: Player,
    input: InputState,
    effType: EffectTypeValue | undefined,
    effTimer: number
  ): { player: Player; didJump: boolean } => {
    let { y, vy, jumping, jumpCD, onGround } = player;
    let didJump = false;
    const forceJ =
      effType === EffectType.FORCE_JUMP &&
      effTimer % Config.effect.forceJumpInterval === 0 &&
      onGround &&
      jumpCD <= 0;
    if ((forceJ || (input.jump && onGround && jumpCD <= 0))) {
      jumping = true;
      vy = forceJ ? Config.jump.forcedPower : Config.jump.power;
      onGround = false;
      jumpCD = Config.jump.cooldown;
      didJump = true;
    }
    if (jumping) {
      vy += Config.physics.gravity;
      y += vy;
      if (y >= 0) {
        y = 0;
        vy = 0;
        jumping = false;
        jumpCD = Config.jump.landingCooldown;
      }
    }
    if (jumpCD > 0) jumpCD--;
    if (jumpCD <= 0 && !jumping) onGround = true;
    return { player: { ...player, y, vy, jumping, jumpCD, onGround }, didJump };
  },
  checkTransition: (
    player: Player,
    ramps: Ramp[],
    width: number
  ): { transitioned: boolean; player: Player; isGoal?: boolean } => {
    const ramp = ramps[player.ramp];
    if (!ramp || player.jumping) return { transitioned: false, player };
    const atEnd =
      (ramp.dir === 1 && player.x >= width - 30) || (ramp.dir === -1 && player.x <= 30);
    if (!atEnd) return { transitioned: false, player };
    const next = player.ramp + 1;
    if (next >= ramps.length) return { transitioned: false, player, isGoal: true };
    return {
      transitioned: true,
      player: { ...player, ramp: next, x: ramps[next].dir === 1 ? 45 : width - 45, y: 0 },
    };
  },
} as const;
