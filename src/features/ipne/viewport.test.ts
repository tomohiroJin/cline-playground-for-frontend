/**
 * ビューポートシステムのテスト
 */
import {
  calculateViewport,
  worldToScreen,
  isPlayerInViewport,
  getCanvasSize,
  calculateTileSize,
  VIEWPORT_CONFIG,
} from './viewport';

describe('viewport', () => {
  const mapWidth = 70;
  const mapHeight = 70;

  describe('VIEWPORT_CONFIG', () => {
    it('タイル数が正しく定義されている', () => {
      expect(VIEWPORT_CONFIG.tilesX).toBe(15);
      expect(VIEWPORT_CONFIG.tilesY).toBe(11);
    });

    it('タイルサイズの範囲が正しく定義されている', () => {
      expect(VIEWPORT_CONFIG.minTileSize).toBe(32);
      expect(VIEWPORT_CONFIG.maxTileSize).toBe(128);
    });
  });

  describe('calculateTileSize', () => {
    it('利用可能領域から最適なタイルサイズを計算する', () => {
      // フルHD: 1880x1020 -> min(1880/15, 1020/11) = min(125.3, 92.7) = 92
      const tileSize = calculateTileSize(1880, 1020);
      expect(tileSize).toBe(92);
    });

    it('幅が制約となる場合のタイルサイズを計算する', () => {
      // 幅が狭い: 600x1000 -> min(600/15, 1000/11) = min(40, 90.9) = 40
      const tileSize = calculateTileSize(600, 1000);
      expect(tileSize).toBe(40);
    });

    it('高さが制約となる場合のタイルサイズを計算する', () => {
      // 高さが狭い: 2000x440 -> min(2000/15, 440/11) = min(133.3, 40) = 40
      const tileSize = calculateTileSize(2000, 440);
      expect(tileSize).toBe(40);
    });

    it('minTileSize でクランプされる', () => {
      // 非常に小さい: 300x200 -> min(300/15, 200/11) = min(20, 18.1) = 18 -> minTileSize(32)
      const tileSize = calculateTileSize(300, 200);
      expect(tileSize).toBe(32);
    });

    it('maxTileSize でクランプされる', () => {
      // 非常に大きい: 4000x3000 -> min(4000/15, 3000/11) = min(266.6, 272.7) = 266 -> maxTileSize(128)
      const tileSize = calculateTileSize(4000, 3000);
      expect(tileSize).toBe(128);
    });

    it('整数値に丸められる', () => {
      // 端数が出る場合: 1000x700 -> min(1000/15, 700/11) = min(66.6, 63.6) = floor(63.6) = 63
      const tileSize = calculateTileSize(1000, 700);
      expect(Number.isInteger(tileSize)).toBe(true);
      expect(tileSize).toBe(63);
    });

    it('WQHD PCでのタイルサイズを計算する', () => {
      // 2520x1380 -> min(2520/15, 1380/11) = min(168, 125.4) = 125 -> maxTileSize(128)でクランプ = 125
      const tileSize = calculateTileSize(2520, 1380);
      expect(tileSize).toBe(125);
    });

    it('iPadでのタイルサイズを計算する', () => {
      // 984x708 -> min(984/15, 708/11) = min(65.6, 64.3) = floor(64.3) = 64
      const tileSize = calculateTileSize(984, 708);
      expect(tileSize).toBe(64);
    });
  });

  describe('getCanvasSize', () => {
    it('tileSize からキャンバスサイズを正しく計算する', () => {
      const size = getCanvasSize(48);
      expect(size.width).toBe(720); // 15 * 48
      expect(size.height).toBe(528); // 11 * 48
    });

    it('異なる tileSize でもキャンバスサイズを正しく計算する', () => {
      const size = getCanvasSize(92);
      expect(size.width).toBe(1380); // 15 * 92
      expect(size.height).toBe(1012); // 11 * 92
    });

    it('minTileSize でのキャンバスサイズを計算する', () => {
      const size = getCanvasSize(32);
      expect(size.width).toBe(480); // 15 * 32
      expect(size.height).toBe(352); // 11 * 32
    });
  });

  describe('calculateViewport', () => {
    it('プレイヤーを中心にビューポートを計算する', () => {
      const player = { x: 35, y: 35 }; // マップの中央
      const viewport = calculateViewport(player, mapWidth, mapHeight, 48);

      // プレイヤーがビューポートの中心付近にいることを確認
      const halfW = Math.floor(VIEWPORT_CONFIG.tilesX / 2);
      const halfH = Math.floor(VIEWPORT_CONFIG.tilesY / 2);

      expect(viewport.x).toBe(player.x - halfW);
      expect(viewport.y).toBe(player.y - halfH);
      expect(viewport.width).toBe(VIEWPORT_CONFIG.tilesX);
      expect(viewport.height).toBe(VIEWPORT_CONFIG.tilesY);
      expect(viewport.tileSize).toBe(48);
    });

    it('マップ左上端でビューポートがクランプされる', () => {
      const player = { x: 5, y: 5 }; // 左上付近
      const viewport = calculateViewport(player, mapWidth, mapHeight, 48);

      // ビューポートが0未満にならないことを確認
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
    });

    it('マップ右下端でビューポートがクランプされる', () => {
      const player = { x: 65, y: 65 }; // 右下付近
      const viewport = calculateViewport(player, mapWidth, mapHeight, 48);

      // ビューポートがマップ外に出ないことを確認
      expect(viewport.x).toBe(mapWidth - VIEWPORT_CONFIG.tilesX);
      expect(viewport.y).toBe(mapHeight - VIEWPORT_CONFIG.tilesY);
    });

    it('マップがビューポートより小さい場合は0に固定される', () => {
      const player = { x: 5, y: 5 };
      const smallMapWidth = 20;
      const smallMapHeight = 15;
      const viewport = calculateViewport(player, smallMapWidth, smallMapHeight, 48);

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
        const viewport = calculateViewport(player, mapWidth, mapHeight, 48);
        expect(isPlayerInViewport(player, viewport)).toBe(true);
      });
    });

    it('動的 tileSize を使用してビューポートを計算する', () => {
      const player = { x: 35, y: 35 };
      const viewport = calculateViewport(player, mapWidth, mapHeight, 92);

      expect(viewport.tileSize).toBe(92);
      expect(viewport.width).toBe(VIEWPORT_CONFIG.tilesX);
      expect(viewport.height).toBe(VIEWPORT_CONFIG.tilesY);
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

    it('動的 tileSize で正しく変換する', () => {
      const viewport = {
        x: 10,
        y: 10,
        width: 15,
        height: 11,
        tileSize: 92,
      };

      const result = worldToScreen(15, 15, viewport);
      expect(result).not.toBeNull();
      expect(result!.x).toBe(5 * 92);
      expect(result!.y).toBe(5 * 92);
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
