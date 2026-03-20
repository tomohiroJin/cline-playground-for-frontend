// 車体描画（旧 Render オブジェクトへの委譲）

import type { Player } from '../../domain/player/types';
import type { HeatState } from '../../domain/player/types';
import { Render } from '../../renderer';

/** カート描画 */
export const renderKart = (ctx: CanvasRenderingContext2D, player: Player): void => {
  Render.kart(ctx, player);
};

/** HEAT ゲージ描画 */
export const renderHeatGauge = (ctx: CanvasRenderingContext2D, heat: HeatState, x: number, y: number): void => {
  Render.heatGauge(ctx, heat, x, y);
};

/** ドリフトインジケーター描画 */
export const renderDriftIndicator = (ctx: CanvasRenderingContext2D, player: Player): void => {
  Render.driftIndicator(ctx, player);
};
