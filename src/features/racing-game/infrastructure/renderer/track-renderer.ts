// トラック描画（旧 Render オブジェクトへの委譲）

import type { Point } from '../../domain/shared/types';
import type { Checkpoint } from '../../domain/shared/types';
import type { StartLine, Course } from '../../domain/track/types';
import { Render } from '../../renderer';

/** 背景描画 */
export const renderBackground = (ctx: CanvasRenderingContext2D, course: Course): void => {
  Render.background(ctx, course);
};

/** トラック描画 */
export const renderTrack = (ctx: CanvasRenderingContext2D, pts: readonly Point[]): void => {
  Render.track(ctx, pts as Point[]);
};

/** スタートライン描画 */
export const renderStartLine = (ctx: CanvasRenderingContext2D, sl: StartLine): void => {
  Render.startLine(ctx, sl);
};

/** チェックポイント描画 */
export const renderCheckpoints = (ctx: CanvasRenderingContext2D, coords: readonly Checkpoint[]): void => {
  Render.checkpoints(ctx, coords as Checkpoint[]);
};

/** コース環境エフェクト描画 */
export const renderCourseEffect = (ctx: CanvasRenderingContext2D, effect: string, time: number): void => {
  Render.courseEffect(ctx, effect, time);
};
