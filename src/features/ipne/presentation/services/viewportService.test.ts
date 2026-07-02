import { calculateCameraOrigin, calculateViewport, VIEWPORT_CONFIG } from './viewportService';

describe('calculateCameraOrigin', () => {
  const mapW = 40;
  const mapH = 40;

  it('整数タイル位置では calculateViewport の原点と一致する', () => {
    const center = { x: 20, y: 20 };
    const viewport = calculateViewport(center, mapW, mapH, 48);
    const origin = calculateCameraOrigin(center, mapW, mapH);
    expect(origin.x).toBe(viewport.x);
    expect(origin.y).toBe(viewport.y);
  });

  it('小数タイル位置では小数の原点を返す（滑らかな追従）', () => {
    const origin = calculateCameraOrigin({ x: 20.5, y: 20 }, mapW, mapH);
    const originNext = calculateCameraOrigin({ x: 21, y: 20 }, mapW, mapH);
    expect(origin.x).toBeGreaterThan(calculateCameraOrigin({ x: 20, y: 20 }, mapW, mapH).x);
    expect(origin.x).toBeLessThan(originNext.x);
  });

  it('マップ左上端でクランプする', () => {
    const origin = calculateCameraOrigin({ x: 0.5, y: 0.5 }, mapW, mapH);
    expect(origin.x).toBe(0);
    expect(origin.y).toBe(0);
  });

  it('マップ右下端でクランプする', () => {
    const origin = calculateCameraOrigin({ x: 39.5, y: 39.5 }, mapW, mapH);
    expect(origin.x).toBe(mapW - VIEWPORT_CONFIG.tilesX);
    expect(origin.y).toBe(mapH - VIEWPORT_CONFIG.tilesY);
  });

  it('ビューポートよりマップが小さい場合は 0 に固定する', () => {
    const origin = calculateCameraOrigin({ x: 3, y: 3 }, 10, 8);
    expect(origin).toEqual({ x: 0, y: 0 });
  });
});
