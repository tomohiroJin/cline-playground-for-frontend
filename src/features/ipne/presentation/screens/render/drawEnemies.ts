/**
 * 敵描画層（敵スプライト・撃破アニメ・ボスHPオーラ・HPバー・攻撃エフェクト）
 *
 * renderGameFrame.ts から逐語移植。描画ロジック・順序は元コードと完全に同一。
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
  BOSS_ATTACK_FRAME,
  BOSS_DAMAGE_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MINI_BOSS_DAMAGE_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
  MEGA_BOSS_DAMAGE_FRAME,
} from '../../sprites';
import type { FrameContext } from './renderContext';

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
      case EnemyType.BOSS: return BOSS_DAMAGE_FRAME;
      case EnemyType.MINI_BOSS: return MINI_BOSS_DAMAGE_FRAME;
      case EnemyType.MEGA_BOSS: return MEGA_BOSS_DAMAGE_FRAME;
    }
  }
  return null;
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

    const enemyScreen = toScreenPosition(enemy);
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

    const enemySheet = getEnemySpriteSheet(enemy.type);

    // 敵状態別フレーム選択（Phase 3）
    const enemyStateFrame = getEnemyStateFrame(enemy.type, enemy.state);
    if (enemyStateFrame) {
      spriteRenderer.drawSprite(ctx, enemyStateFrame, enemyDrawX, enemyDrawY, spriteScale);
    } else {
      spriteRenderer.drawAnimatedSprite(ctx, enemySheet, now, enemyDrawX, enemyDrawY, spriteScale);
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
