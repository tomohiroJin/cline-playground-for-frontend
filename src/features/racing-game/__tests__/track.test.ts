import { Track } from '../track';

describe('Racing Game Track', () => {
  const squareTrack = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  describe('getInfo', () => {
    test('トラック上の点は onTrack = true を返す', () => {
      const info = Track.getInfo(50, 0, squareTrack);
      expect(info.onTrack).toBe(true);
      expect(info.dist).toBeLessThan(55); // trackWidth = 55
    });

    test('トラックから離れた点は onTrack = false を返す', () => {
      // trackWidth=55 なので、十分離れた点を使用
      const info = Track.getInfo(50, -200, squareTrack);
      expect(info.onTrack).toBe(false);
    });

    test('最も近いセグメントのインデックスを返す', () => {
      const info = Track.getInfo(50, 1, squareTrack);
      expect(info.seg).toBe(0); // 上辺のセグメント
    });
  });

  describe('startLine', () => {
    test('正しいスタートラインを生成する', () => {
      const sl = Track.startLine(squareTrack);
      expect(sl.cx).toBe(0);
      expect(sl.cy).toBe(0);
      expect(sl.len).toBeGreaterThan(0);
    });

    test('点が2未満の場合はデフォルト値を返す', () => {
      const sl = Track.startLine([{ x: 0, y: 0 }]);
      expect(sl.cx).toBe(0);
      expect(sl.cy).toBe(0);
      expect(sl.len).toBe(100);
    });
  });

  describe('crossedStart', () => {
    test('スタートラインを横切らない場合はfalseを返す', () => {
      const player = { x: 50, y: 50, angle: 0, color: '', name: '', isCpu: false, lap: 1, checkpointFlags: 0, lapTimes: [], lapStart: 0, speed: 1, wallStuck: 0, progress: 0, lastSeg: 1 };
      const sl = Track.startLine(squareTrack);
      expect(Track.crossedStart(player, sl, 1, 2, 4)).toBe(false);
    });

    test('セグメント数が2未満の場合はfalseを返す', () => {
      const player = { x: 0, y: 0, angle: 0, color: '', name: '', isCpu: false, lap: 1, checkpointFlags: 0, lapTimes: [], lapStart: 0, speed: 1, wallStuck: 0, progress: 0, lastSeg: 0 };
      const sl = Track.startLine(squareTrack);
      expect(Track.crossedStart(player, sl, 0, 0, 1)).toBe(false);
    });
  });
});
