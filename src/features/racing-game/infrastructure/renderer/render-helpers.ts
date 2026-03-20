// 描画共通ヘルパー

/** Canvas コンテキストのスコープ管理 */
export const withContext = (ctx: CanvasRenderingContext2D, fn: (ctx: CanvasRenderingContext2D) => void): void => {
  ctx.save();
  fn(ctx);
  ctx.restore();
};

/** テキスト描画オプション */
export interface TextOptions {
  font?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  stroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
}

/** テキスト描画 */
export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TextOptions = {},
): void => {
  ctx.font = options.font ?? '14px sans-serif';
  ctx.textAlign = options.align ?? 'center';
  ctx.textBaseline = options.baseline ?? 'middle';
  if (options.stroke && options.strokeColor) {
    ctx.strokeStyle = options.strokeColor;
    ctx.lineWidth = options.strokeWidth ?? 3;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = options.color ?? '#fff';
  ctx.fillText(text, x, y);
};

/** 角丸矩形描画 */
export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};
