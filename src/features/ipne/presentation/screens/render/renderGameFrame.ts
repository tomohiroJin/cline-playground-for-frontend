/**
 * ゲームフレーム描画関数
 *
 * Game.tsx の描画 useEffect 本体を単一関数として抽出したもの。
 * 描画ロジック・順序は元 effect と完全に同一（純粋な move）。
 */
import {
  TileType,
  calculateViewport,
  calculateTileSize,
  getCanvasSize,
  EnemyType,
  drawAutoMap,
  findPath,
  drawDebugPanel,
  drawCoordinateOverlay,
} from '../../../index';
import { SPRITE_SIZES } from '../../config';
import {
  EffectType,
  calculatePowerLevel,
  shouldTriggerWarning,
  getWarningPhase,
  BOSS_WARNING_DURATION,
} from '../../effects';
import { isComboActive, COMBO_DISPLAY_MIN } from '../../../domain/services/comboService';
import {
  FLOOR_SPRITE,
  WALL_SPRITE,
  getStageFloorSprite,
  getStageWallSprite,
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
import { getStageIntroPhase, getStageIntroAlpha, getStageIntroTextAlpha, getGameOverTransitionAlpha } from '../../effects/screenTransition';
import type { RenderContext, FrameContext } from './renderContext';
import type { Position, Viewport } from '../../../index';
import { drawWorld } from './drawWorld';
import { drawEnemies } from './drawEnemies';

/**
 * ゲームフレームを描画する
 *
 * Game.tsx の描画 useEffect 本体を逐語移植したもの。
 * 描画順序・ロジックは元 effect と完全に同一。
 */
export function renderGameFrame(rc: RenderContext): void {
  const {
    ctx,
    canvas,
    canvasWrapperRef,
    now,
    map,
    player,
    enemies,
    mapState,
    goalPos,
    debugState,
    attackEffect,
    lastDamageAt,
    isDying,
    currentStage,
    rewardEffects,
    spriteRenderer,
    movementStateRef,
    effectManagerRef,
    deathEffectRef,
    bossWarningRef,
    afterImageManagerRef,
    stageStartTimeRef,
    dyingStartTimeRef,
    playerAttackUntilRef,
    playerDamageUntilRef,
    lastAttackEffectKeyRef,
    lastDamageAtRef,
    floatingTextManagerRef,
    comboStateRef,
    effectQueueRef,
  } = rc;

  // 空マップの場合は描画しない
  if (map.length === 0 || !map[0]) return;

  const mapWidth = map[0].length;
  const mapHeight = map.length;

  // デバッグモードで全体表示の場合とビューポート表示の場合で分岐
  const useFullMap = debugState.enabled && debugState.showFullMap;

  let tileSize: number;
  let offsetX = 0;
  let offsetY = 0;
  let viewport: Viewport;

  // CanvasWrapper サイズからタイルサイズを動的に計算
  const wrapper = canvasWrapperRef.current;
  const availableWidth = wrapper ? wrapper.clientWidth : window.innerWidth;
  const availableHeight = wrapper ? wrapper.clientHeight : window.innerHeight;
  const dynamicTileSize = calculateTileSize(availableWidth, availableHeight);

  if (useFullMap) {
    // 全体マップ表示：マップ全体が収まるようにタイルサイズを計算
    const canvasSize = getCanvasSize(dynamicTileSize);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    tileSize = Math.min(
      Math.floor(canvasSize.width / mapWidth),
      Math.floor(canvasSize.height / mapHeight)
    );
    // 中央揃え
    offsetX = Math.floor((canvasSize.width - mapWidth * tileSize) / 2);
    offsetY = Math.floor((canvasSize.height - mapHeight * tileSize) / 2);
    // ダミーのビューポート（全体表示用）
    viewport = { x: 0, y: 0, width: mapWidth, height: mapHeight, tileSize };
  } else {
    // 通常のビューポート表示（動的 tileSize を使用）
    viewport = calculateViewport(player, mapWidth, mapHeight, dynamicTileSize);
    tileSize = viewport.tileSize;
    const canvasSize = getCanvasSize(tileSize);
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }

  // スタート位置を探す（パス描画用）
  let startPos: Position | null = null;
  for (let y = 0; y < mapHeight && !startPos; y++) {
    for (let x = 0; x < mapWidth; x++) {
      if (map[y][x] === TileType.START) {
        startPos = { x, y };
        break;
      }
    }
  }

  // パス計算（デバッグモードでパス表示が有効な場合）
  let path: Position[] = [];
  if (debugState.enabled && debugState.showPath && startPos) {
    path = findPath(map, startPos, goalPos);
  }

  // マップ描画（T-02.2: スプライト描画）
  const drawWidth = useFullMap ? mapWidth : viewport.width;
  const drawHeight = useFullMap ? mapHeight : viewport.height;
  const spriteScale = tileSize / SPRITE_SIZES.base;

  // ステージ別パレットのタイルスプライトを使用
  const stageFloor = currentStage ? getStageFloorSprite(currentStage) : FLOOR_SPRITE;
  const stageWall = currentStage ? getStageWallSprite(currentStage) : WALL_SPRITE;

  const toScreenPosition = (pos: Position): Position => {
    if (useFullMap) {
      return {
        x: offsetX + pos.x * tileSize + tileSize / 2,
        y: offsetY + pos.y * tileSize + tileSize / 2,
      };
    }
    return {
      x: (pos.x - viewport.x) * tileSize + tileSize / 2,
      y: (pos.y - viewport.y) * tileSize + tileSize / 2,
    };
  };

  // プレイヤーのスクリーン座標を先行計算（FrameContext 構築に必要）
  const playerScreen = toScreenPosition(player);

  // シェイクオフセット取得（drawWorld で save/translate、後段で restore するため両側で参照）
  const shakeOffset = effectManagerRef.current.getShakeOffset();

  // FrameContext を構築してワールド描画層へ渡す
  const frame: FrameContext = {
    ...rc,
    viewport, tileSize, offsetX, offsetY, useFullMap, drawWidth, drawHeight,
    spriteScale, stageFloor, stageWall, startPos, path, playerScreen, toScreenPosition,
  };

  // ワールド描画（背景・マップ・パス・罠・壁・アイテム）
  drawWorld(frame, shakeOffset);

  // 敵描画（敵スプライト・撃破アニメ・ボスHPオーラ・攻撃エフェクト）
  drawEnemies(frame);

  // パーティクルエフェクトシステム
  const em = effectManagerRef.current;

  // 攻撃ヒットエフェクトのトリガー（パワーレベルスケーリング）
  if (attackEffect && now < attackEffect.until) {
    const key = `${attackEffect.position.x}-${attackEffect.position.y}-${attackEffect.until}`;
    if (lastAttackEffectKeyRef.current !== key) {
      lastAttackEffectKeyRef.current = key;
      playerAttackUntilRef.current = attackEffect.until;
      const screenPos = toScreenPosition(attackEffect.position);
      const powerLevel = calculatePowerLevel(player);
      em.addEffect(EffectType.ATTACK_HIT, screenPos.x, screenPos.y, now, { powerLevel });
    }
  }

  // ダメージエフェクトのトリガー
  if (lastDamageAt > lastDamageAtRef.current) {
    lastDamageAtRef.current = lastDamageAt;
    playerDamageUntilRef.current = now + 200; // 被弾フレーム200ms表示
    const screenPos = toScreenPosition(player);
    em.addEffect(EffectType.DAMAGE, screenPos.x, screenPos.y, now);
    // 画面シェイク（Phase 4）
    em.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 4 });
  }

  // 外部エフェクトキューの処理
  if (effectQueueRef && effectQueueRef.current.length > 0) {
    for (const evt of effectQueueRef.current) {
      const screenPos = toScreenPosition({ x: evt.x, y: evt.y });
      em.addEffect(evt.type, screenPos.x, screenPos.y, now, {
        enemyType: evt.enemyType as import('../../../types').EnemyTypeValue | undefined,
        comboMultiplier: evt.comboMultiplier,
        powerLevel: evt.powerLevel,
        variant: evt.variant as 'melee' | 'ranged' | 'boss' | undefined,
        itemType: evt.itemType as import('../../../types').ItemTypeValue | undefined,
      });
    }
    effectQueueRef.current = [];
  }

  // エフェクト更新・描画（100ms 間隔）
  em.update(0.1, now);
  em.draw(ctx, canvas.width, canvas.height);

  // フローティングテキスト更新・描画
  if (floatingTextManagerRef) {
    floatingTextManagerRef.current.update(now);
    floatingTextManagerRef.current.draw(ctx, now, (tx, ty) => toScreenPosition({ x: tx, y: ty }));
  }

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
        spriteRenderer.drawSprite(ctx, attackSheet.sprites[attackFrameIndex], playerDrawX, playerDrawY, spriteScale);

        // 武器光跡描画（攻撃アニメーション中のみ）
        const attackDuration = playerAttackUntilRef.current - (playerAttackUntilRef.current - 300);
        const attackElapsed = now - (playerAttackUntilRef.current - 300);
        const attackProgress = Math.min(1, Math.max(0, attackElapsed / attackDuration));
        drawWeaponTrail(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, player.direction, player.stats.attackPower, player.playerClass, attackProgress);

        // 衝撃波描画（RADIANT ティアのみ、攻撃ヒット時）
        if (getWeaponTier(player.stats.attackPower) === WeaponTier.RADIANT) {
          drawShockwave(ctx, playerScreen.x, playerScreen.y, viewport.tileSize, attackElapsed);
        }
      } else if (isDamaged) {
        // 被弾フレーム（200ms表示）
        const damageSprites = pClass === 'warrior' ? WARRIOR_DAMAGE_SPRITES : THIEF_DAMAGE_SPRITES;
        spriteRenderer.drawSprite(ctx, damageSprites[pDir], playerDrawX, playerDrawY, spriteScale);
      } else if (isMoving) {
        // 歩行アニメーション
        const playerSheet = getPlayerSpriteSheet(pClass, pDir);
        const walkFrameIndex = Math.floor(now / playerSheet.frameDuration) % 2;
        spriteRenderer.drawSprite(ctx, playerSheet.sprites[1 + walkFrameIndex], playerDrawX, playerDrawY, spriteScale);

        // 残像記録（移動速度強化時）
        if (rewardEffects.hasAfterImage) {
          afterImageManagerRef.current.recordPosition(player.x, player.y, player.direction, now);
        }
      } else {
        // アイドルブリーズアニメーション
        const idleSheets = pClass === 'warrior' ? WARRIOR_IDLE_SPRITE_SHEETS : THIEF_IDLE_SPRITE_SHEETS;
        const idleSheet = idleSheets[pDir];
        const idleFrameIndex = Math.floor(now / idleSheet.frameDuration) % idleSheet.sprites.length;
        spriteRenderer.drawSprite(ctx, idleSheet.sprites[idleFrameIndex], playerDrawX, playerDrawY, spriteScale);
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

  // 低HP警告描画（Phase 4: HP 25%以下でビネットパルス）
  if (player.hp > 0 && player.hp / player.maxHp <= 0.25) {
    const pulseT = (now % 1500) / 1500;
    const pulseAlpha = 0.15 + 0.1 * Math.sin(pulseT * Math.PI * 2);
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.7
    );
    gradient.addColorStop(0, 'rgba(220, 38, 38, 0)');
    gradient.addColorStop(1, `rgba(220, 38, 38, ${pulseAlpha})`);
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // コンボカウンター描画（画面上部中央）
  if (comboStateRef && isComboActive(comboStateRef.current, now) &&
      comboStateRef.current.count >= COMBO_DISPLAY_MIN) {
    const combo = comboStateRef.current;
    const comboText = `${combo.count} COMBO!`;
    const timeSinceKill = now - combo.lastKillTime;

    // ポップアニメーション（コンボ増加時に拡大→縮小）
    const popProgress = Math.min(1, timeSinceKill / 200);
    const popScale = popProgress < 0.5
      ? 1.0 + 0.4 * (1 - popProgress * 2)
      : 1.0;

    // フェードアウト（コンボ時間切れ前の500msでフェードアウト開始）
    const remaining = 3000 - timeSinceKill;
    const fadeAlpha = remaining < 500 ? remaining / 500 : 1.0;

    ctx.save();
    ctx.font = `bold ${Math.round(20 * popScale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = Math.max(0, fadeAlpha);

    // アウトライン
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(comboText, canvas.width / 2, 50);

    // 本文（金色）
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(comboText, canvas.width / 2, 50);
    ctx.restore();
  }

  // ボスWARNING演出
  const bossWarning = bossWarningRef.current;
  for (const enemy of enemies) {
    const isBoss = enemy.type === EnemyType.BOSS || enemy.type === EnemyType.MINI_BOSS || enemy.type === EnemyType.MEGA_BOSS;
    if (!isBoss || enemy.hp <= 0) continue;
    if (shouldTriggerWarning(bossWarning, enemy, player.x, player.y)) {
      bossWarningRef.current = {
        ...bossWarning,
        isActive: true,
        startTime: now,
        triggeredBossIds: [...bossWarning.triggeredBossIds, enemy.id],
      };
      break;
    }
  }

  if (bossWarningRef.current.isActive) {
    const warningElapsed = now - bossWarningRef.current.startTime;
    if (warningElapsed < BOSS_WARNING_DURATION) {
      const phase = getWarningPhase(warningElapsed);

      if (phase === 'darken' || phase === 'text') {
        // 画面暗転
        const darkenProgress = Math.min(1, warningElapsed / 300);
        ctx.save();
        ctx.globalAlpha = 0.5 * darkenProgress;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (phase === 'text') {
        // WARNING テキスト点滅（200ms間隔）
        const blink = Math.floor(now / 200) % 2 === 0;
        if (blink) {
          ctx.save();
          ctx.font = 'bold 32px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.strokeText('⚠ WARNING ⚠', canvas.width / 2, canvas.height / 2);
          ctx.fillText('⚠ WARNING ⚠', canvas.width / 2, canvas.height / 2);
          ctx.restore();
        }
      }

      if (phase === 'fadeout') {
        // フェードアウト
        const fadeProgress = (warningElapsed - 900) / 300;
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - fadeProgress);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    } else {
      // WARNING完了
      bossWarningRef.current = { ...bossWarningRef.current, isActive: false };
    }
  }

  // 画面シェイクオフセット復元（HUDはシェイクの影響を受けない）
  if (shakeOffset) {
    ctx.restore();
  }

  // ゲームオーバー暗転描画（DYING状態）
  if (isDying) {
    const dyingElapsed = now - dyingStartTimeRef.current;
    const gameOverAlpha = getGameOverTransitionAlpha(dyingElapsed);
    if (gameOverAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = gameOverAlpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // ステージ開始演出描画
  const stageIntroElapsed = now - stageStartTimeRef.current;
  const stageIntroPhase = getStageIntroPhase(stageIntroElapsed);
  if (stageIntroPhase !== 'done') {
    // 暗転フェードイン
    const introAlpha = getStageIntroAlpha(stageIntroElapsed);
    if (introAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = introAlpha;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // ステージ名テキスト
    const textAlpha = getStageIntroTextAlpha(stageIntroElapsed);
    if (textAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const stageText = currentStage ? `STAGE ${currentStage}` : 'STAGE 1';
      // テキストアウトライン
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(stageText, canvas.width / 2, canvas.height / 2);
      // テキスト本文
      ctx.fillStyle = '#ffffff';
      ctx.fillText(stageText, canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }

  // 自動マップ描画（全体表示モードでは非表示）
  if (mapState.isMapVisible && !useFullMap) {
    drawAutoMap(ctx, map, mapState.exploration, player, goalPos, mapState.isFullScreen);
  }

  // デバッグ情報描画
  if (debugState.enabled) {
    drawDebugPanel(ctx, debugState, {
      playerX: player.x,
      playerY: player.y,
      viewportX: viewport.x,
      viewportY: viewport.y,
      mapWidth,
      mapHeight,
    });

    // 座標オーバーレイ
    if (debugState.showCoordinates) {
      drawCoordinateOverlay(ctx, player.x, player.y, playerScreen.x, playerScreen.y);
    }
  }
}
