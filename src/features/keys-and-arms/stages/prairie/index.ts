/**
 * KEYS & ARMS — 草原ステージモジュール（オーケストレーター）
 * 背景描画・ロジック・レンダラーを組み立て、Stage インターフェースを返す。
 */

import type { EngineContext, Stage } from '../../types';
import { createPrairieBackground } from './prairie-background';
import { createPrairieLogic } from './prairie-logic';
import { createPrairieRenderer } from './prairie-renderer';

/**
 * 草原ステージファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createPrairieStage(ctx: EngineContext): Stage {
  const drawPrairieBG = createPrairieBackground(ctx);
  const { grsInit, grsUpdate } = createPrairieLogic(ctx);
  const grsDraw = createPrairieRenderer(ctx, drawPrairieBG);

  return { init: grsInit, update: grsUpdate, draw: grsDraw };
}
