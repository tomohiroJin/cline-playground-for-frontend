/**
 * 敵描画層（敵スプライト・撃破アニメ・ボスHPオーラ・HPバー・攻撃エフェクト）
 *
 * renderGameFrame.ts から抽出後、視覚位置補間・状態別フレーム選択・種別個性
 * エフェクトを追加済み。描画位置は VisualPositionTracker の補間座標を使う。
 */
import {
  EnemyState,
  EnemyType,
} from '../../../index';
import { SPRITE_SIZES } from '../../config';
import {
  getDeathPhase,
  getDeathScale,
  isDeathAnimationComplete,
  getBossAuraConfig,
} from '../../effects';
import {
  SpriteDefinition,
  getEnemySpriteSheet,
  ATTACK_SLASH_SPRITE_SHEET,
  PATROL_ATTACK_FRAME,
  CHARGE_RUSH_FRAME,
  RANGED_CAST_FRAME,
  SPECIMEN_MUTATE_FRAME,
  PATROL_DAMAGE_FRAME,
  CHARGE_DAMAGE_FRAME,
  RANGED_DAMAGE_FRAME,
  SPECIMEN_DAMAGE_FRAME,
  BOSS_ATTACK_FRAME,
  BOSS_DAMAGE_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MINI_BOSS_DAMAGE_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
  MEGA_BOSS_DAMAGE_FRAME,
  PATROL_WINDUP_FRAME,
  CHARGE_WINDUP_FRAME,
  RANGED_WINDUP_FRAME,
  SPECIMEN_WINDUP_FRAME,
  BOSS_WINDUP_FRAME,
  MINI_BOSS_WINDUP_FRAME,
  MEGA_BOSS_WINDUP_FRAME,
} from '../../sprites';
import { drawGroundShadow } from './groundShadow';
import type { EnhanceOptions } from '../../sprites';
import type { FrameContext } from './renderContext';
import { ENEMY_ATTACK_ANIM_DURATION } from '../../../domain/policies/enemyAi/attackState';
import { TRANSITION_MEMORY_MS } from './visualPosition';

/** 敵補正：輪郭線＋縁陰影 */
const ENEMY_ENHANCE: EnhanceOptions = { outline: true, shade: true };

/** 攻撃進行度の溜め→実行の境界（前 40% が溜め） */
export const ENEMY_WINDUP_RATIO = 0.4;

/**
 * 攻撃中の敵フレームを進行度（0〜1）で選択する（前40%は溜め、後60%は攻撃）
 *
 * @param enemyType - 敵タイプの文字列識別子
 * @param progress - 攻撃アニメーション開始からの経過割合（0〜1、クランプなし）
 * @returns 対応するフレーム。未知の敵タイプの場合は null
 */
export function selectEnemyAttackFrame(enemyType: string, progress: number): SpriteDefinition | null {
  const isWindup = progress < ENEMY_WINDUP_RATIO;
  switch (enemyType) {
    case EnemyType.PATROL: return isWindup ? PATROL_WINDUP_FRAME : PATROL_ATTACK_FRAME;
    case EnemyType.CHARGE: return isWindup ? CHARGE_WINDUP_FRAME : CHARGE_RUSH_FRAME;
    case EnemyType.RANGED: return isWindup ? RANGED_WINDUP_FRAME : RANGED_CAST_FRAME;
    case EnemyType.SPECIMEN: return isWindup ? SPECIMEN_WINDUP_FRAME : SPECIMEN_MUTATE_FRAME;
    case EnemyType.BOSS: return isWindup ? BOSS_WINDUP_FRAME : BOSS_ATTACK_FRAME;
    case EnemyType.MINI_BOSS: return isWindup ? MINI_BOSS_WINDUP_FRAME : MINI_BOSS_ATTACK_FRAME;
    case EnemyType.MEGA_BOSS: return isWindup ? MEGA_BOSS_WINDUP_FRAME : MEGA_BOSS_ATTACK_FRAME;
  }
  return null;
}

/** 敵の状態に応じた特殊フレームを返す（Phase 3） */
function getEnemyStateFrame(enemyType: string, enemyState: string): SpriteDefinition | null {
  if (enemyState === EnemyState.ATTACK) {
    switch (enemyType) {
      case EnemyType.PATROL: return PATROL_ATTACK_FRAME;
      case EnemyType.CHARGE: return CHARGE_RUSH_FRAME;
      case EnemyType.RANGED: return RANGED_CAST_FRAME;
      case EnemyType.SPECIMEN: return SPECIMEN_MUTATE_FRAME;
      case EnemyType.BOSS: return BOSS_ATTACK_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_ATTACK_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_ATTACK_FRAME;
    }
  }
  if (enemyState === EnemyState.KNOCKBACK) {
    switch (enemyType) {
      case EnemyType.PATROL: return PATROL_DAMAGE_FRAME;
      case EnemyType.CHARGE: return CHARGE_DAMAGE_FRAME;
      case EnemyType.RANGED: return RANGED_DAMAGE_FRAME;
      case EnemyType.SPECIMEN: return SPECIMEN_DAMAGE_FRAME;
      case EnemyType.BOSS: return BOSS_DAMAGE_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_DAMAGE_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_DAMAGE_FRAME;
    }
  }
  return null;
}

/** CHARGE 残像の描画位置（from→to 線分上の到達率）と基準アルファ */
const CHARGE_AFTERIMAGE_POINTS: ReadonlyArray<{ ratio: number; alpha: number }> = [
  { ratio: 0.4, alpha: 0.35 },
  { ratio: 0.7, alpha: 0.18 },
];

/** RANGED 詠唱光の最大アルファ */
const RANGED_CAST_LIGHT_MAX_ALPHA = 0.4;

/**
 * CHARGE の突進残像を描画する。
 *
 * 直近の位置遷移がワープ（1.5タイル超（SNAP_DISTANCE_TILES）の跳躍）であれば、from→to 線分上の
 * 2点に本体スプライトを薄く重ね描きし、経過時間に応じて減衰させる。
 * 本体スプライトより先に呼ぶことで背後に配置する。
 */
function drawChargeAfterimage(
  frame: FrameContext,
  enemyId: string,
  sprite: SpriteDefinition,
  enemyDrawSize: number,
  spriteScale: number
): void {
  const { ctx, now, toScreenPosition, spriteRenderer, visualPositionsRef } = frame;
  const transition = visualPositionsRef.current.getRecentTransition(`enemy-${enemyId}`, now);
  if (!transition || !transition.isWarp) return;

  const elapsed = now - transition.startAt;
  const decay = 1 - elapsed / TRANSITION_MEMORY_MS;

  for (const { ratio, alpha } of CHARGE_AFTERIMAGE_POINTS) {
    const tileX = transition.from.x + (transition.to.x - transition.from.x) * ratio;
    const tileY = transition.from.y + (transition.to.y - transition.from.y) * ratio;
    const screen = toScreenPosition({ x: tileX, y: tileY });
    ctx.save();
    ctx.globalAlpha = alpha * decay;
    spriteRenderer.drawSprite(
      ctx, sprite,
      screen.x - enemyDrawSize / 2, screen.y - enemyDrawSize / 2,
      spriteScale
    );
    ctx.restore();
  }
}

/**
 * RANGED の詠唱中に足元へ光るラジアルグラデーション円を描画する。
 * windup 進行度（0〜ENEMY_WINDUP_RATIO）に応じてアルファを 0→0.4 でランプさせる。
 */
function drawRangedCastLight(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  enemyDrawSize: number,
  windupProgress: number
): void {
  const radius = enemyDrawSize * 0.5;
  const feetY = screenY + enemyDrawSize / 2;
  // 負 progress（凍結中の攻撃開始）で globalAlpha に負値が入るのを防ぐ
  const t = Math.max(0, Math.min(1, windupProgress / ENEMY_WINDUP_RATIO));
  const alpha = RANGED_CAST_LIGHT_MAX_ALPHA * t;

  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(screenX, feetY, 0, screenX, feetY, radius);
  gradient.addColorStop(0, 'rgba(251, 146, 60, 0.9)');
  gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(screenX, feetY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 敵描画層
 *
 * 敵スプライト・撃破アニメ・ボスHPオーラ・HPバー・攻撃エフェクト（斬撃アニメーション）を描画する。
 * パーティクルエフェクトシステム（effectManagerRef を変更する副作用節）は含まない（Task 6 の範囲）。
 */
export function drawEnemies(frame: FrameContext): void {
  const {
    ctx,
    enemies,
    viewport,
    useFullMap,
    spriteScale,
    toScreenPosition,
    now,
    spriteRenderer,
    attackEffect,
    visualPositionsRef,
  } = frame;

  // 敵描画（T-02.3: スプライト描画）
  for (const enemy of enemies) {
    if (
      enemy.x < viewport.x - 1 ||
      enemy.x > viewport.x + viewport.width + 1 ||
      enemy.y < viewport.y - 1 ||
      enemy.y > viewport.y + viewport.height + 1
    ) {
      if (!useFullMap) continue;
    }

    const enemyVisual = visualPositionsRef.current.resolve(`enemy-${enemy.id}`, enemy, now);
    const enemyScreen = toScreenPosition(enemyVisual);
    const enemySpriteSize =
      enemy.type === EnemyType.MEGA_BOSS ? SPRITE_SIZES.megaBoss :
      enemy.type === EnemyType.BOSS ? SPRITE_SIZES.boss :
      enemy.type === EnemyType.MINI_BOSS ? SPRITE_SIZES.miniBoss :
      SPRITE_SIZES.base;
    const enemyDrawSize = enemySpriteSize * spriteScale;
    const enemyDrawX = enemyScreen.x - enemyDrawSize / 2;
    const enemyDrawY = enemyScreen.y - enemyDrawSize / 2;

    // 撃破アニメーション中の描画
    if (enemy.isDying && enemy.deathStartTime) {
      const elapsed = now - enemy.deathStartTime;
      if (isDeathAnimationComplete(elapsed)) continue;

      const phase = getDeathPhase(elapsed);
      const scale = getDeathScale(elapsed);

      if (phase === 1) {
        // フェーズ1: 縮小描画（100ms）
        ctx.save();
        ctx.translate(enemyScreen.x, enemyScreen.y);
        ctx.scale(scale, scale);
        const scaledDrawX = -enemyDrawSize / 2;
        const scaledDrawY = -enemyDrawSize / 2;
        const enemySheet = getEnemySpriteSheet(enemy.type);
        spriteRenderer.drawSprite(ctx, enemySheet.sprites[0], scaledDrawX, scaledDrawY, spriteScale);
        ctx.restore();
      } else if (phase === 2) {
        // フェーズ2: 白フラッシュ（50ms）
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(enemyScreen.x, enemyScreen.y, enemyDrawSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // フェーズ3: スプライト非表示（パーティクルのみ）
      continue;
    }

    // ボスHP残量オーラ描画
    const isBossType = enemy.type === EnemyType.BOSS ||
      enemy.type === EnemyType.MINI_BOSS || enemy.type === EnemyType.MEGA_BOSS;
    if (isBossType && enemy.hp > 0) {
      const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
      const auraConfig = getBossAuraConfig(hpRatio);
      if (auraConfig) {
        const pulseT = (now % auraConfig.pulsePeriod) / auraConfig.pulsePeriod;
        const pulseAlpha = 0.15 + 0.15 * Math.sin(pulseT * Math.PI * 2);
        ctx.save();
        ctx.globalAlpha = pulseAlpha;
        const gradient = ctx.createRadialGradient(
          enemyScreen.x, enemyScreen.y, enemyDrawSize * 0.3,
          enemyScreen.x, enemyScreen.y, enemyDrawSize * 0.8
        );
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
        gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          enemyScreen.x - enemyDrawSize,
          enemyScreen.y - enemyDrawSize,
          enemyDrawSize * 2,
          enemyDrawSize * 2
        );
        ctx.restore();
      }
    }

    const blinkOff = enemy.state === EnemyState.KNOCKBACK && Math.floor(now / 100) % 2 === 1;
    if (blinkOff) continue;

    // 接地シャドウ描画（死亡・点滅中には描かない）
    drawGroundShadow(ctx, enemyScreen.x, enemyScreen.y, enemyDrawSize, 0);

    const enemySheet = getEnemySpriteSheet(enemy.type);

    // 攻撃進行度（0〜1、クランプなし）。ATTACK 中以外は windup 判定に使わないため undefined
    const attackProgress =
      enemy.state === EnemyState.ATTACK && enemy.attackAnimUntil !== undefined
        ? (now - (enemy.attackAnimUntil - ENEMY_ATTACK_ANIM_DURATION)) / ENEMY_ATTACK_ANIM_DURATION
        : undefined;
    const isWindup = attackProgress !== undefined && attackProgress < ENEMY_WINDUP_RATIO;

    // 種別個性エフェクト（Phase 3-5）: 本体スプライトより先に描画し背後に配置する
    if (enemy.type === EnemyType.CHARGE) {
      drawChargeAfterimage(frame, enemy.id, enemySheet.sprites[0], enemyDrawSize, spriteScale);
    }
    if (enemy.type === EnemyType.RANGED && isWindup && attackProgress !== undefined) {
      drawRangedCastLight(ctx, enemyScreen.x, enemyScreen.y, enemyDrawSize, attackProgress);
    }

    // 敵状態別フレーム選択（Phase 3）。攻撃中は attackAnimUntil から進行度を逆算し、
    // 前40%は溜め・後60%は攻撃の2段モーションにする（Phase 3-4）。
    // attackAnimUntil が未設定の場合は従来の静的攻撃フレームへフォールバックする。
    const enemyStateFrame =
      attackProgress !== undefined
        ? selectEnemyAttackFrame(enemy.type, attackProgress)
        : getEnemyStateFrame(enemy.type, enemy.state);

    const drawSprite = (): void => {
      if (enemyStateFrame) {
        spriteRenderer.drawSprite(ctx, enemyStateFrame, enemyDrawX, enemyDrawY, spriteScale, ENEMY_ENHANCE);
      } else {
        spriteRenderer.drawAnimatedSprite(ctx, enemySheet, now, enemyDrawX, enemyDrawY, spriteScale, ENEMY_ENHANCE);
      }
    };

    // SPECIMEN 変異の脈動: 溜め中に本体をスケール変形させて描画する（drawPlayer の squash と同じパターン）
    if (enemy.type === EnemyType.SPECIMEN && isWindup && attackProgress !== undefined) {
      const pulse = 1 + 0.06 * Math.sin(attackProgress * Math.PI * 4);
      ctx.save();
      ctx.translate(enemyScreen.x, enemyScreen.y);
      ctx.scale(pulse, pulse);
      ctx.translate(-enemyScreen.x, -enemyScreen.y);
      drawSprite();
      ctx.restore();
    } else {
      drawSprite();
    }
  }

  // 攻撃エフェクト描画（T-02.8: 斬撃アニメーション）
  if (attackEffect && now < attackEffect.until) {
    const effectPos = attackEffect.position;
    const screen = toScreenPosition(effectPos);
    const slashDrawSize = SPRITE_SIZES.base * spriteScale;
    const slashDrawX = screen.x - slashDrawSize / 2;
    const slashDrawY = screen.y - slashDrawSize / 2;

    spriteRenderer.drawAnimatedSprite(ctx, ATTACK_SLASH_SPRITE_SHEET, now, slashDrawX, slashDrawY, spriteScale);
  }
}
