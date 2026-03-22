import { Config } from '../../config';
import { EffectType } from '../../constants';
import { EffectTypeValue, InputState, Player, Ramp } from '../../types';
import { MathUtils } from '../math-utils';

/** 有限数であることを検証する（DbC） */
const assertFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`物理演算エラー: ${label}が有限数ではありません: ${value}`);
  }
};

/** 物理演算ドメインサービス */
export const Physics = {
  /** プレイヤーの移動を適用する */
  applyMovement: (player: Player, input: InputState, speed: number, dir: Ramp['dir']): Player => {
    assertFinite(speed, 'speed');
    assertFinite(player.x, 'player.x');
    let vx =
      player.vx + (input.left ? -Config.physics.moveAccel : 0) + (input.right ? Config.physics.moveAccel : 0);
    vx *= Config.physics.friction;
    return {
      ...player,
      x: MathUtils.clamp(player.x + dir * speed * 1.2 + vx, Config.player.moveMargin, Config.screen.width - Config.player.moveMargin),
      vx,
    };
  },
  /** ジャンプ処理を適用する */
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
  /** ランプ遷移の判定と処理を行う */
  checkTransition: (
    player: Player,
    ramps: Ramp[],
    width: number
  ): { transitioned: boolean; player: Player; isGoal?: boolean } => {
    const ramp = ramps[player.ramp];
    if (!ramp || player.jumping) return { transitioned: false, player };
    const atEnd =
      (ramp.dir === 1 && player.x >= width - Config.ramp.transitionMargin) || (ramp.dir === -1 && player.x <= Config.ramp.transitionMargin);
    if (!atEnd) return { transitioned: false, player };
    const next = player.ramp + 1;
    if (next >= ramps.length) return { transitioned: false, player, isGoal: true };
    return {
      transitioned: true,
      player: { ...player, ramp: next, x: ramps[next].dir === 1 ? Config.ramp.startOffset : width - Config.ramp.startOffset, y: 0 },
    };
  },
} as const;
