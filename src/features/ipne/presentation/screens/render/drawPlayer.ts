/**
 * プレイヤー描画層
 *
 * プレイヤー本体・オーラ・シールド・残像・武器光跡・衝撃波・パーティクルを描画する。
 * afterImageManagerRef の残像描画と残像記録（副作用）の両方を担う。
 * 描画ロジック・順序は元 renderGameFrame.ts と完全に同一（純粋な move）。
 */
import { SPRITE_SIZES } from '../../config';
import {
  getPlayerSpriteSheet,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  THIEF_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
  THIEF_DAMAGE_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  THIEF_IDLE_SPRITE_SHEETS,
} from '../../sprites';
import { drawPlayerAura } from '../../effects/aura';
import { drawWeaponTrail, getWeaponTier, WeaponTier, drawShockwave } from '../../effects/weaponEffect';
import { drawShieldGlow, drawAfterImage, drawSpinParticles, drawHealParticles } from '../../effects/stageVisual';
import {
  selectWalkFrameIndex,
  computeWalkBob,
  computeSquash,
  computeAttackTransform,
} from '../../sprites/motion';
import { drawGroundShadow } from './groundShadow';
import type { EnhanceOptions } from '../../sprites';
import type { FrameContext } from './renderContext';

/** 攻撃アニメーションの継続時間（ms） */
const ATTACK_DURATION_MS = 300;

/** プレイヤー補正：手描きの陰影を尊重し輪郭線のみ付与 */
const PLAYER_ENHANCE: EnhanceOptions = { outline: true, shade: false };

/**
 * プレイヤーを描画する
 *
 * 死亡エフェクト中と通常時で分岐し、通常時は優先度（攻撃 > 被弾 > 移動 > アイドル）で
 * アニメーションを選択する。残像の描画と記録も本関数が担う。
 */
export function drawPlayer(frame: FrameContext): void {
  const {
    ctx,
    now,
    player,
    playerScreen,
    spriteScale,
    spriteRenderer,
    viewport,
    deathEffectRef,
    afterImageManagerRef,
    playerAttackUntilRef,
    playerDamageUntilRef,
    movementStateRef,
    rewardEffects,
    toScreenPosition,
    isDying,
  } = frame;

  // プレイヤー描画（T-02.4: スプライト描画）
  const deathEff = deathEffectRef.current;
  const playerDrawSize = SPRITE_SIZES.base * spriteScale;

  if (isDying && deathEff.isActive()) {
    // 死亡アニメーション中
    const playerColors = player.playerClass === 'warrior'
      ? ['#667eea', '#5a67d8', '#4c51bf', '#ffffff']
      : ['#a78bfa', '#8b5cf6', '#7c3aed', '#ffffff'];

    deathEff.update(now, playerScreen.x, playerScreen.y, playerColors);

    // フェーズに応じてプレイヤースプライトを表示/非表示
    if (deathEff.isPlayerVisible(now)) {
      const playerSheet = getPlayerSpriteSheet(
        player.playerClass as 'warrior' | 'thief',
        player.direction as 'down' | 'up' | 'left' | 'right'
      );
      const playerDrawX = playerScreen.x - playerDrawSize / 2;
      const playerDrawY = playerScreen.y - playerDrawSize / 2;

      // 待機フレームで描画
      spriteRenderer.drawSprite(ctx, playerSheet.sprites[0], playerDrawX, playerDrawY, spriteScale);
    }

    // 死亡エフェクト描画（赤変色オーバーレイ + パーティクル分解）
    deathEff.draw(ctx, now, playerScreen.x, playerScreen.y, playerDrawSize);
  } else {
    // 通常時の描画（Phase 3: 優先度 攻撃 > 被弾 > 移動 > アイドルブリーズ）
    const isBlinkOff = player.isInvincible && Math.floor(now / 100) % 2 === 1;

    // パワーオーラ描画（スプライトの背面）
    if (!isBlinkOff) {
      drawPlayerAura(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, player.level, player.playerClass, now);

      // シールド輝き描画（maxHp強化時）
      if (rewardEffects.hasShieldGlow) {
        drawShieldGlow(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
      }

      // 残像描画（移動速度強化時、スプライト背面に描画）
      if (rewardEffects.hasAfterImage) {
        for (const img of afterImageManagerRef.current.getAfterImages()) {
          const imgScreen = toScreenPosition(img);
          drawAfterImage(ctx, imgScreen.x, imgScreen.y, viewport.tileSize, img.alpha);
        }
      }
    }

    if (!isBlinkOff) {
      const pClass = player.playerClass as 'warrior' | 'thief';
      const pDir = player.direction as 'down' | 'up' | 'left' | 'right';
      const playerDrawX = playerScreen.x - playerDrawSize / 2;
      const playerDrawY = playerScreen.y - playerDrawSize / 2;

      const isAttacking = now < playerAttackUntilRef.current;
      const isDamaged = now < playerDamageUntilRef.current;
      const isMoving = movementStateRef.current.activeDirection !== null;

      if (isAttacking) {
        // 攻撃アニメーション
        const attackSheets = pClass === 'warrior' ? WARRIOR_ATTACK_SPRITE_SHEETS : THIEF_ATTACK_SPRITE_SHEETS;
        const attackSheet = attackSheets[pDir];
        const attackFrameIndex = Math.floor(now / attackSheet.frameDuration) % attackSheet.sprites.length;

        // 攻撃進行度（攻撃は until-ATTACK_DURATION_MS から ATTACK_DURATION_MS 継続）
        const atkElapsed = now - (playerAttackUntilRef.current - ATTACK_DURATION_MS);
        const atkProgress = atkElapsed / ATTACK_DURATION_MS;
        const tf = computeAttackTransform(atkProgress, pDir);
        ctx.save();
        ctx.translate(tf.dx * spriteScale, tf.dy * spriteScale);
        ctx.translate(playerScreen.x, playerScreen.y);
        ctx.scale(tf.scale, tf.scale);
        ctx.translate(-playerScreen.x, -playerScreen.y);
        spriteRenderer.drawSprite(ctx, attackSheet.sprites[attackFrameIndex], playerDrawX, playerDrawY, spriteScale, PLAYER_ENHANCE);
        ctx.restore();

        // 武器光跡描画（攻撃アニメーション中のみ）
        const attackElapsed = now - (playerAttackUntilRef.current - ATTACK_DURATION_MS);
        const attackProgress = Math.min(1, Math.max(0, attackElapsed / ATTACK_DURATION_MS));
        drawWeaponTrail(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, player.direction, player.stats.attackPower, player.playerClass, attackProgress);

        // 衝撃波描画（RADIANT ティアのみ、攻撃ヒット時）
        if (getWeaponTier(player.stats.attackPower) === WeaponTier.RADIANT) {
          drawShockwave(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, attackElapsed);
        }
      } else if (isDamaged) {
        // 被弾フレーム（200ms表示）
        const damageSprites = pClass === 'warrior' ? WARRIOR_DAMAGE_SPRITES : THIEF_DAMAGE_SPRITES;
        spriteRenderer.drawSprite(ctx, damageSprites[pDir], playerDrawX, playerDrawY, spriteScale, PLAYER_ENHANCE);
      } else if (isMoving) {
        // 歩行アニメーション（4枚循環 + bob + squash + 接地シャドウ）
        const playerSheet = getPlayerSpriteSheet(pClass, pDir);
        const bob = computeWalkBob(now, playerSheet.frameDuration);
        const squash = computeSquash(now, playerSheet.frameDuration);
        const walkFrame = playerSheet.sprites[selectWalkFrameIndex(now, playerSheet.frameDuration)];
        drawGroundShadow(ctx, playerScreen.x, playerScreen.y, playerDrawSize, bob);
        const feetY = playerDrawY + playerDrawSize;
        ctx.save();
        ctx.translate(0, -bob * spriteScale);
        ctx.translate(playerScreen.x, feetY);
        ctx.scale(1, squash);
        ctx.translate(-playerScreen.x, -feetY);
        spriteRenderer.drawSprite(ctx, walkFrame, playerDrawX, playerDrawY, spriteScale, PLAYER_ENHANCE);
        ctx.restore();

        // 残像記録（移動速度強化時）
        if (rewardEffects.hasAfterImage) {
          afterImageManagerRef.current.recordPosition(player.x, player.y, player.direction, now);
        }
      } else {
        // アイドルブリーズアニメーション
        drawGroundShadow(ctx, playerScreen.x, playerScreen.y, playerDrawSize, 0);
        const idleSheets = pClass === 'warrior' ? WARRIOR_IDLE_SPRITE_SHEETS : THIEF_IDLE_SPRITE_SHEETS;
        const idleSheet = idleSheets[pDir];
        const idleFrameIndex = Math.floor(now / idleSheet.frameDuration) % idleSheet.sprites.length;
        spriteRenderer.drawSprite(ctx, idleSheet.sprites[idleFrameIndex], playerDrawX, playerDrawY, spriteScale, PLAYER_ENHANCE);
      }

      // 回転パーティクル描画（攻撃速度強化時、常時微小表示）
      if (rewardEffects.hasSpinParticles) {
        drawSpinParticles(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
      }

      // 回復パーティクル描画（回復量強化時）
      if (rewardEffects.hasHealParticles) {
        drawHealParticles(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, now);
      }
    }
  }
}
