/**
 * ビューポートシステムのテスト
 */
import {
  calculateViewport,
  worldToScreen,
  isPlayerInViewport,
  getCanvasSize,
  VIEWPORT_CONFIG,
} from './viewport';

describe('viewport', () => {
  const mapWidth = 70;
  const mapHeight = 70;

  describe('VIEWPORT_CONFIG', () => {
    it('設定値が正しく定義されている', () => {
      expect(VIEWPORT_CONFIG.tilesX).toBe(15);
      expect(VIEWPORT_CONFIG.tilesY).toBe(11);
      expect(VIEWPORT_CONFIG.tileSize).toBe(48);
    });
  });

  describe('getCanvasSize', () => {
    it('キャンバスサイズを正しく計算する', () => {
      const size = getCanvasSize();
      expect(size.width).toBe(720); // 15 * 48
      expect(size.height).toBe(528); // 11 * 48
    });
  });

  describe('calculateViewport', () => {
    it('プレイヤーを中心にビューポートを計算する', () => {
      const player = { x: 35, y: 35 }; // マップの中央
      const viewport = calculateViewport(player, mapWidth, mapHeight);

      // プレイヤーがビューポートの中心付近にいることを確認
      const halfW = Math.floor(VIEWPORT_CONFIG.tilesX / 2);
      const halfH = Math.floor(VIEWPORT_CONFIG.tilesY / 2);

      expect(viewport.x).toBe(player.x - halfW);
      expect(viewport.y).toBe(player.y - halfH);
      expect(viewport.width).toBe(VIEWPORT_CONFIG.tilesX);
      expect(viewport.height).toBe(VIEWPORT_CONFIG.tilesY);
      expect(viewport.tileSize).toBe(VIEWPORT_CONFIG.tileSize);
    });

    it('マップ左上端でビューポートがクランプされる', () => {
      const player = { x: 5, y: 5 }; // 左上付近
      const viewport = calculateViewport(player, mapWidth, mapHeight);

      // ビューポートが0未満にならないことを確認
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
    });

    it('マップ右下端でビューポートがクランプされる', () => {
      const player = { x: 65, y: 65 }; // 右下付近
      const viewport = calculateViewport(player, mapWidth, mapHeight);

      // ビューポートがマップ外に出ないことを確認
      expect(viewport.x).toBe(mapWidth - VIEWPORT_CONFIG.tilesX);
      expect(viewport.y).toBe(mapHeight - VIEWPORT_CONFIG.tilesY);
    });

    it('マップがビューポートより小さい場合は0に固定される', () => {
      const player = { x: 5, y: 5 };
      const smallMapWidth = 20;
      const smallMapHeight = 15;
      const viewport = calculateViewport(player, smallMapWidth, smallMapHeight);

      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
    });

    it('プレイヤーがビューポート内に収まる', () => {
      const testCases = [
        { x: 0, y: 0 },
        { x: 35, y: 35 },
        { x: 69, y: 69 },
        { x: 10, y: 50 },
      ];

      testCases.forEach(player => {
        const viewport = calculateViewport(player, mapWidth, mapHeight);
        expect(isPlayerInViewport(player, viewport)).toBe(true);
      });
    });
  });

  describe('worldToScreen', () => {
    it('ビューポート内の座標を正しく変換する', () => {
      const viewport = {
        x: 10,
        y: 10,
        width: 15,
        height: 11,
        tileSize: 48,
      };

      const result = worldToScreen(15, 15, viewport);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(5 * 48); // (15 - 10) * 48
      expect(result!.y).toBe(5 * 48); // (15 - 10) * 48
    });

    it('ビューポート外の座標はnullを返す', () => {
      const viewport = {
        x: 10,
        y: 10,
        width: 15,
        height: 11,
        tileSize: 48,
      };

      // 左側
      expect(worldToScreen(5, 15, viewport)).toBeNull();
      // 上側
      expect(worldToScreen(15, 5, viewport)).toBeNull();
      // 右側
      expect(worldToScreen(30, 15, viewport)).toBeNull();
      // 下側
      expect(worldToScreen(15, 25, viewport)).toBeNull();
    });

    it('ビューポートの端の座標も正しく変換する', () => {
      const viewport = {
        x: 10,
        y: 10,
        width: 15,
        height: 11,
        tileSize: 48,
      };

      // 左上端
      const topLeft = worldToScreen(10, 10, viewport);
      expect(topLeft).not.toBeNull();
      expect(topLeft!.x).toBe(0);
      expect(topLeft!.y).toBe(0);

      // 右下端（ビューポート内の最後のタイル）
      const bottomRight = worldToScreen(24, 20, viewport);
      expect(bottomRight).not.toBeNull();
      expect(bottomRight!.x).toBe(14 * 48);
      expect(bottomRight!.y).toBe(10 * 48);
    });
  });

  describe('isPlayerInViewport', () => {
    const viewport = {
      x: 10,
      y: 10,
      width: 15,
      height: 11,
      tileSize: 48,
    };

    it('ビューポート内のプレイヤーはtrueを返す', () => {
      expect(isPlayerInViewport({ x: 15, y: 15 }, viewport)).toBe(true);
      expect(isPlayerInViewport({ x: 10, y: 10 }, viewport)).toBe(true);
      expect(isPlayerInViewport({ x: 24, y: 20 }, viewport)).toBe(true);
    });

    it('ビューポート外のプレイヤーはfalseを返す', () => {
      expect(isPlayerInViewport({ x: 5, y: 15 }, viewport)).toBe(false);
      expect(isPlayerInViewport({ x: 15, y: 5 }, viewport)).toBe(false);
      expect(isPlayerInViewport({ x: 30, y: 15 }, viewport)).toBe(false);
      expect(isPlayerInViewport({ x: 15, y: 25 }, viewport)).toBe(false);
    });
  });
});
