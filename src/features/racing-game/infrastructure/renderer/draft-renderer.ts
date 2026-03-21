// ドラフト UI 描画（旧 Render オブジェクトへの委譲）

import type { Card } from '../../domain/card/types';
import { Render } from '../../renderer';

/** ドラフト UI 描画 */
export const renderDraftUI = (
  ctx: CanvasRenderingContext2D,
  cards: readonly Card[],
  selectedIndex: number,
  timer: number,
  maxTimer: number,
  playerName: string,
  lap: number,
  confirmed: boolean,
  animProgress: number,
): void => {
  Render.draftUI(ctx, cards as Card[], selectedIndex, timer, maxTimer, playerName, lap, confirmed, animProgress);
};
