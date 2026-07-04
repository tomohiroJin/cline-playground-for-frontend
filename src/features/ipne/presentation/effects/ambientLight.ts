/**
 * 環境光・ヴィネット演出
 *
 * プレイヤー中心の光の減衰（ヴィネット）とステージ別の色調オーバーレイで
 * 平板だったワールドに奥行きと雰囲気を与える。drawOverlays の冒頭
 * （シェイク変換内・HUD 警告より下層）から呼ばれる。
 */
import type { StageNumber } from '../../domain/types/stage';

/** ステージ別アンビエント設定 */
export interface StageAmbient {
  /** 光円半径（キャンバス短辺に対する比率）。小さいほど暗所感が増す */
  lightRadiusRatio: number;
  /** 画面端の暗さ（0..1） */
  vignetteAlpha: number;
  /** ステージ色調オーバーレイの色 */
  tintColor: string;
  /** 色調オーバーレイの強さ（ごく薄く） */
  tintAlpha: number;
}

const STAGE_AMBIENTS: Record<StageNumber, StageAmbient> = {
  1: { lightRadiusRatio: 0.85, vignetteAlpha: 0.22, tintColor: '#8a6a3a', tintAlpha: 0.05 },
  2: { lightRadiusRatio: 0.85, vignetteAlpha: 0.22, tintColor: '#4b5563', tintAlpha: 0.03 },
  3: { lightRadiusRatio: 0.8, vignetteAlpha: 0.25, tintColor: '#1a8a8a', tintAlpha: 0.05 },
  4: { lightRadiusRatio: 0.55, vignetteAlpha: 0.4, tintColor: '#3d2470', tintAlpha: 0.06 },
  5: { lightRadiusRatio: 0.7, vignetteAlpha: 0.3, tintColor: '#8a2e2e', tintAlpha: 0.06 },
};

/** ステージ別アンビエント設定を返す（未指定はデフォルト＝S2 相当） */
export function getStageAmbient(stage: StageNumber | undefined): StageAmbient {
  return STAGE_AMBIENTS[stage ?? 2];
}

/**
 * 光円＋ヴィネット＋色調オーバーレイを描画する。
 * プレイヤー中心の透明領域から画面端に向けて暗くなるラジアルグラデーション。
 */
export function drawAmbientOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerX: number,
  playerY: number,
  ambient: StageAmbient
): void {
  const lightRadius = Math.min(width, height) * ambient.lightRadiusRatio;
  const outerRadius = Math.hypot(width, height);

  ctx.save();

  // 色調オーバーレイ（ごく薄いステージカラー）
  if (ambient.tintAlpha > 0) {
    ctx.globalAlpha = ambient.tintAlpha;
    ctx.fillStyle = ambient.tintColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 光円＋ヴィネット（プレイヤー周辺は透明、外周に向けて暗く）
  const gradient = ctx.createRadialGradient(
    playerX, playerY, lightRadius * 0.45,
    playerX, playerY, outerRadius
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${ambient.vignetteAlpha})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
