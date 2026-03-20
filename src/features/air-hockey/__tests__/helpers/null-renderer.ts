/**
 * テスト用 Null レンダラーアダプタ
 * - 何もしない実装（テスト時の描画抑制）
 * - jest.fn() による呼び出し記録付き
 */
import type { GameRendererPort } from '../../domain/contracts/renderer';

/** テスト用レンダラーを生成する */
export function createNullRenderer(): GameRendererPort {
  return {
    clear: jest.fn(),
    drawField: jest.fn(),
    drawPuck: jest.fn(),
    drawMallet: jest.fn(),
    drawItem: jest.fn(),
    drawEffectZones: jest.fn(),
    drawFlash: jest.fn(),
    drawGoalEffect: jest.fn(),
    drawFeverEffect: jest.fn(),
    drawParticles: jest.fn(),
    drawShockwave: jest.fn(),
    drawVignette: jest.fn(),
    drawShield: jest.fn(),
    drawMagnetEffect: jest.fn(),
    drawReaction: jest.fn(),
    drawHUD: jest.fn(),
    drawHelp: jest.fn(),
    drawCountdown: jest.fn(),
    drawPauseOverlay: jest.fn(),
    drawCombo: jest.fn(),
  };
}
