/**
 * 接地シャドウ描画
 *
 * キャラクター足元に楕円シャドウを描き、接地感を与える。
 * lift（浮き上がり px）が大きいほど影は小さく薄くなる。
 */

/** lift 1px あたりの縮小率 */
const SHRINK_PER_LIFT = 0.06;
/** 縮小率の上限 */
const MAX_SHRINK = 0.4;
/** 接地時の基準不透明度 */
const BASE_ALPHA = 0.32;
/** 影の横半径（drawSize 比） */
const RADIUS_RATIO = 0.3;
/** 影の縦横比 */
const FLATNESS = 0.32;

export function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  drawSize: number,
  lift: number
): void {
  const shrink = Math.min(MAX_SHRINK, lift * SHRINK_PER_LIFT);
  const rw = drawSize * RADIUS_RATIO * (1 - shrink);
  const rh = rw * FLATNESS;
  const feetY = screenY + drawSize / 2 - rh;
  ctx.save();
  ctx.globalAlpha = BASE_ALPHA * (1 - shrink);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(screenX, feetY, rw, rh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
