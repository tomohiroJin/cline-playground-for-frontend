/**
 * ボスステージレンダラー（オーケストレータ）
 * 背景、アリーナ、シーン（顔/台座/プレイヤー/HUD/勝利演出）を組み立てる。
 */

import type { EngineContext } from '../../types';
import { createBossArenaRenderer } from './boss-arena-renderer';
import { createBossSceneRenderer } from './boss-scene-renderer';

/**
 * ボスレンダラーファクトリ
 * @param ctx ゲームコンテキスト
 * @param drawCastleBG 背景描画関数
 * @returns bosDraw 関数
 */
export function createBossRenderer(ctx: EngineContext, drawCastleBG: () => void) {
  const drawBossArena = createBossArenaRenderer(ctx);
  const drawBossScene = createBossSceneRenderer(ctx);

  return function bosDraw() {
    drawCastleBG();
    drawBossArena();
    drawBossScene();
  };
}
