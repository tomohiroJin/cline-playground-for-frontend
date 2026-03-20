// HUD 描画（旧 Render オブジェクトへの委譲 + 旧 game-draw.ts の関数）

import type { Player } from '../../domain/player/types';
import type { HighlightEvent, HighlightType } from '../../domain/highlight/types';
import { Render } from '../../renderer';
import { drawHUD, drawCountdown, drawCpuNotification } from '../../game-draw';

/** ハイライト通知バナー描画 */
export const renderHighlightBanner = (
  ctx: CanvasRenderingContext2D,
  event: HighlightEvent & { displayTime: number },
  colors: Record<HighlightType, string>,
  index: number,
): void => {
  Render.highlightBanner(ctx, event, colors, index);
};

/** HUD 描画（ラップ情報、タイム等） */
export const renderHud = (
  ctx: CanvasRenderingContext2D,
  players: readonly Player[],
  courseName: string,
  maxLaps: number,
  raceStart: number,
): void => {
  drawHUD(ctx, players as Player[], courseName, maxLaps, raceStart);
};

/** カウントダウン描画 */
export const renderCountdown = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
): void => {
  drawCountdown(ctx, width, height, elapsed);
};

/** CPU カード通知描画 */
export const renderCpuNotification = (
  ctx: CanvasRenderingContext2D,
  notification: { cardName: string; cardIcon: string; startTime: number },
  width: number,
  height: number,
): boolean => {
  return drawCpuNotification(ctx, notification, width, height);
};
