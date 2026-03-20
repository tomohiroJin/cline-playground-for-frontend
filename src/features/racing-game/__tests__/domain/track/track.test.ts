// トラック幾何学計算のテスト

import { getTrackInfo, calculateStartLine, getWallNormal } from '../../../domain/track/track';

// テスト用正方形トラック
const squareTrack = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe('track', () => {
  describe('getTrackInfo', () => {
    it('トラック上の点では onTrack が true になる', () => {
      const info = getTrackInfo(50, 0, squareTrack, 55);
      expect(info.onTrack).toBe(true);
      expect(info.dist).toBeLessThan(55);
    });

    it('トラック外の点では onTrack が false になる', () => {
      const info = getTrackInfo(50, 50, squareTrack, 10);
      expect(info.onTrack).toBe(false);
    });

    it('最近接セグメントのインデックスを返す', () => {
      // セグメント 0 (0,0)→(100,0) の中点付近
      const info = getTrackInfo(50, 1, squareTrack, 55);
      expect(info.seg).toBe(0);
    });

    it('最近接点を返す', () => {
      const info = getTrackInfo(50, 10, squareTrack, 55);
      expect(info.pt.x).toBeCloseTo(50, 0);
      expect(info.pt.y).toBeCloseTo(0, 0);
    });

    it('points が 2 未満の場合はアサーションエラーになる', () => {
      expect(() => getTrackInfo(0, 0, [{ x: 0, y: 0 }], 55)).toThrow();
    });

    it('trackWidth が 0 以下の場合はアサーションエラーになる', () => {
      expect(() => getTrackInfo(0, 0, squareTrack, 0)).toThrow();
    });
  });

  describe('calculateStartLine', () => {
    it('正しいスタートライン情報を返す', () => {
      const sl = calculateStartLine(squareTrack, 55);
      expect(sl.cx).toBe(0);
      expect(sl.cy).toBe(0);
      expect(sl.len).toBe(110);
    });

    it('points が 2 未満の場合はデフォルト値を返す', () => {
      const sl = calculateStartLine([{ x: 5, y: 5 }], 55);
      expect(sl.cx).toBe(0);
      expect(sl.len).toBe(100);
    });
  });

  describe('getWallNormal', () => {
    it('セグメントに垂直な法線ベクトルを返す', () => {
      // セグメント 0: (0,0)→(100,0) → 法線は (0,-1) or (0,1)
      const normal = getWallNormal(0, squareTrack);
      expect(Math.abs(normal.nx)).toBeCloseTo(0, 5);
      expect(Math.abs(normal.ny)).toBeCloseTo(1, 5);
    });
  });
});
