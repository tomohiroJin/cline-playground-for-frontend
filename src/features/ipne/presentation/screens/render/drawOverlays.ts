/**
 * オーバーレイ描画層
 *
 * 低HP警告・コンボカウンター・ボスWARNING演出・画面シェイク復元・
 * ゲームオーバー暗転・ステージ開始演出・自動マップ・デバッグ情報を描画する。
 * renderGameFrame から逐語移植（ロジック・順序は元のまま）。
 */
import {
  EnemyType,
  drawAutoMap,
  drawDebugPanel,
  drawCoordinateOverlay,
} from '../../../index';
import {
  shouldTriggerWarning,
  getWarningPhase,
  BOSS_WARNING_DURATION,
} from '../../effects';
import { isComboActive, COMBO_DISPLAY_MIN } from '../../../domain/services/comboService';
import {
  getStageIntroPhase,
  getStageIntroAlpha,
  getStageIntroTextAlpha,
  getGameOverTransitionAlpha,
} from '../../effects/screenTransition';
import { getStageAmbient, drawAmbientOverlay } from '../../effects/ambientLight';
import type { FrameContext } from './renderContext';

/**
 * オーバーレイ層をまとめて描画する
 *
 * 描画順（元 renderGameFrame の順序を厳守）:
 *   0. 環境光・ヴィネット・ステージ色調（シェイク変換内。全体マップ表示では非表示）
 *   1. 低HP警告（ビネットパルス）
 *   2. コンボカウンター
 *   3. ボスWARNING演出（副作用: bossWarningRef を更新）
 *   4. 画面シェイクオフセット復元（HUD はシェイク影響を受けない）
 *   5. ゲームオーバー暗転
 *   6. ステージ開始演出
 *   7. 自動マップ描画
 *   8. デバッグ情報描画
 *
 * @param frame - フレーム描画コンテキスト
 * @param shakeOffset - drawWorld で save/translate したシェイクオフセット（null なら restore しない）
 */
export function drawOverlays(
  frame: FrameContext,
  shakeOffset: { x: number; y: number } | null,
): void {
  const {
    ctx,
    canvas,
    now,
    player,
    enemies,
    isDying,
    mapState,
    map,
    goalPos,
    debugState,
    useFullMap,
    viewport,
    playerScreen,
    bossWarningRef,
    comboStateRef,
    stageStartTimeRef,
    dyingStartTimeRef,
    currentStage,
  } = frame;

  const mapWidth = map[0]?.length ?? 0;
  const mapHeight = map.length;

  // 環境光・ヴィネット（ワールド追従＝シェイク変換内。HUD 警告より下層）
  if (!useFullMap) {
    drawAmbientOverlay(
      ctx, canvas.width, canvas.height,
      playerScreen.x, playerScreen.y,
      getStageAmbient(currentStage)
    );
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
