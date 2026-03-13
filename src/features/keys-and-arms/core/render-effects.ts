/**
 * 描画エフェクトモジュール
 *
 * engine.ts の render() から共通エフェクト描画を抽出。
 * 画面シェイク、スキャンライン、ビートパルス、ダメージフラッシュ、
 * LCD ベゼル影、ポーズ/リセット確認オーバーレイを管理する。
 */

import { W, H, BG } from '../constants';

export interface RenderEffects {
  applyScreenShake(shakeT: number, quake: number): void;
  drawScanlines(): void;
  drawBeatPulse(beatPulse: number): void;
  drawDamageFlash(hurtFlash: number): void;
  drawHitStopFlash(hitStop: number): void;
  drawLCDBevel(): void;
  drawPauseOverlay(tick: number): void;
  drawResetConfirmOverlay(tick: number): void;
}

/** 描画エフェクトを生成 */
export function createRenderEffects(
  $: CanvasRenderingContext2D,
  onFill: (a: number) => void,
  txtC: (text: string, x: number, y: number, size: number) => void,
): RenderEffects {
  return {
    applyScreenShake(shakeT, quake) {
      const total = shakeT + quake;
      if (total > 0) {
        const sx = (Math.random() - .5) * total * .7;
        const sy = (Math.random() - .5) * total * .5;
        $.translate(sx, sy);
      }
    },

    drawScanlines() {
      $.fillStyle = 'rgba(145,158,125,0.08)';
      for (let y = 0; y < H; y += 2) $.fillRect(0, y, W, 1);
    },

    drawBeatPulse(beatPulse) {
      if (beatPulse > 0) {
        onFill(beatPulse / 6 * .035);
        $.fillRect(0, 0, W, H);
        $.globalAlpha = 1;
      }
    },

    drawDamageFlash(hurtFlash) {
      if (hurtFlash > 0) {
        const hfa = Math.min(1, hurtFlash / 5);
        $.fillStyle = `rgba(40,10,0,${hfa * .2})`;
        $.fillRect(0, 0, W, H);
      }
    },

    drawHitStopFlash(hitStop) {
      if (hitStop > 0) {
        $.fillStyle = BG;
        $.globalAlpha = .1;
        $.fillRect(0, 0, W, H);
        $.globalAlpha = 1;
      }
    },

    drawLCDBevel() {
      onFill(.03);
      $.fillRect(0, 0, W, 3);
      $.fillRect(0, H - 3, W, 3);
      $.fillRect(0, 0, 3, H);
      $.fillRect(W - 3, 0, 3, H);
      $.globalAlpha = 1;
    },

    drawPauseOverlay(tick) {
      $.fillStyle = 'rgba(26,40,16,.65)';
      $.fillRect(0, 0, W, H);
      $.fillStyle = BG;
      txtC('PAUSED', W / 2, H / 2 - 20, 16);
      if (Math.floor(tick / 18) % 2) {
        txtC('P: RESUME    ESC: TITLE', W / 2, H / 2 + 14, 6);
      }
    },

    drawResetConfirmOverlay(tick) {
      $.fillStyle = 'rgba(26,40,16,.75)';
      $.fillRect(0, 0, W, H);
      $.fillStyle = BG;
      txtC('RETURN TO TITLE?', W / 2, H / 2 - 20, 10);
      if (Math.floor(tick / 12) % 2) {
        txtC('Z: YES    ESC: NO', W / 2, H / 2 + 10, 7);
      }
    },
  };
}
