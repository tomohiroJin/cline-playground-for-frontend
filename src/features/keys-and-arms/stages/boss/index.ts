/**
 * KEYS & ARMS — ボスステージモジュール（オーケストレーター）
 * 背景描画・ロジック・レンダラーを組み立て、Stage インターフェースを返す。
 */

import type { EngineContext, Stage } from '../../types';
import { createBossBackground } from './boss-background';
import { createBossLogic } from './boss-logic';
import { createBossRenderer } from './boss-renderer';

/**
 * ボスステージファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createBossStage(ctx: EngineContext): Stage {
  const drawCastleBG = createBossBackground(ctx);
  const { bosInit, bosUpdate } = createBossLogic(ctx);
  const bosDraw = createBossRenderer(ctx, drawCastleBG);

  return { init: bosInit, update: bosUpdate, draw: bosDraw };
}
