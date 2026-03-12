/**
 * KEYS & ARMS — 洞窟ステージモジュール（オーケストレーター）
 * 背景描画・ロジック・レンダラーを組み立て、Stage インターフェースを返す。
 */

import type { EngineContext, Stage } from '../../types';
import { createCaveBackground } from './cave-background';
import { createCaveLogic } from './cave-logic';
import { createCaveRenderer } from './cave-renderer';

/**
 * 洞窟ステージファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createCaveStage(ctx: EngineContext): Stage {
  const drawCaveBG = createCaveBackground(ctx);
  const { cavInit, cavUpdate } = createCaveLogic(ctx);
  const cavDraw = createCaveRenderer(ctx, drawCaveBG);

  return { init: cavInit, update: cavUpdate, draw: cavDraw };
}
