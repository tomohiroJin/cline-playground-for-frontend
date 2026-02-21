// ゲームループ内の描画ロジック（HUD/カウントダウン/通知）

import type { Player, HeatState } from './types';
import { Config } from './constants';
import { Utils } from './utils';
import { Render } from './renderer';

/** HUD描画（コース名、ラップ表示、HEATゲージ、ドリフトインジケータ、ラップタイム） */
export const drawHUD = (
  ctx: CanvasRenderingContext2D,
  players: readonly Player[],
  courseName: string,
  maxLaps: number,
  raceStart: number
): void => {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(courseName, 20, 20);

  players.forEach((p, i) => {
    const y = 50 + i * 55;
    ctx.fillStyle = p.color;
    ctx.fillText(`${p.name}: LAP ${Math.min(p.lap, maxLaps)}/${maxLaps}`, 20, y);

    // HEAT ゲージ
    Render.heatGauge(ctx, p.heat, 250, y + 2);

    // ドリフトインジケータ
    Render.driftIndicator(ctx, p);

    // ラップタイム表示
    if (raceStart > 0) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#ccc';
      const currentLapTime = Date.now() - p.lapStart;
      ctx.fillText(`⏱ ${Utils.formatTime(currentLapTime)}`, 20, y + 24);
      if (p.lapTimes.length > 0) {
        const lastLap = p.lapTimes[p.lapTimes.length - 1];
        ctx.fillStyle = '#999';
        ctx.fillText(`前: ${Utils.formatTime(lastLap)}`, 150, y + 24);
      }
      ctx.font = 'bold 20px Arial';
    }
  });
};

/** カウントダウン描画 */
export const drawCountdown = (
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  width: number,
  height: number
): void => {
  const count = Math.ceil((Config.timing.countdown - elapsed) / 1000);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (elapsed < Config.timing.countdown) {
    ctx.fillText(String(count), width / 2, height / 2);
  }
};

/** CPU通知バナー描画。表示終了時にfalseを返す */
export const drawCpuNotification = (
  ctx: CanvasRenderingContext2D,
  notification: { cardName: string; cardIcon: string; startTime: number },
  width: number,
  height: number
): boolean => {
  const elapsed = Date.now() - notification.startTime;
  const displayDuration = 3000;
  if (elapsed >= displayDuration) return false;

  const fadeIn = Math.min(1, elapsed / 200);
  const fadeOut = elapsed > displayDuration - 500 ? (displayDuration - elapsed) / 500 : 1;
  ctx.globalAlpha = Math.min(fadeIn, fadeOut) * 0.85;
  const bannerW = 280;
  const bannerH = 36;
  const bx = (width - bannerW) / 2;
  const by = height - 70;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(bx, by, bannerW, bannerH, 8);
  ctx.fill();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bannerW, bannerH, 8);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `CPU: ${notification.cardIcon} ${notification.cardName}`,
    width / 2, by + bannerH / 2
  );
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
  return true;
};
