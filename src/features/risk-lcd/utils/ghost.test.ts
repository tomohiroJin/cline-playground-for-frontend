import { GhostRecorder, GhostPlayer } from './ghost';
import type { LaneIndex } from '../types';

describe('GhostRecorder / GhostPlayer', () => {
  it('記録→圧縮→展開で元データと一致する', () => {
    const rec = new GhostRecorder();
    const data: LaneIndex[] = [1, 1, 1, 0, 0, 2, 2, 1];
    data.forEach(l => rec.record(l));
    const compressed = rec.compress();
    const player = new GhostPlayer(compressed);
    expect(player.getPosition(0)).toBe(1);
    expect(player.getPosition(1)).toBe(1);
    expect(player.getPosition(2)).toBe(1);
    expect(player.getPosition(3)).toBe(0);
    expect(player.getPosition(4)).toBe(0);
    expect(player.getPosition(5)).toBe(2);
    expect(player.getPosition(6)).toBe(2);
    expect(player.getPosition(7)).toBe(1);
    expect(player.length).toBe(8);
  });

  it('空データの圧縮は空文字列を返す', () => {
    const rec = new GhostRecorder();
    expect(rec.compress()).toBe('');
  });

  it('空文字列のプレイヤーはデフォルト位置を返す', () => {
    const player = new GhostPlayer('');
    expect(player.getPosition(0)).toBe(1);
    expect(player.length).toBe(0);
  });

  it('1エントリのデータ', () => {
    const rec = new GhostRecorder();
    rec.record(2 as LaneIndex);
    const compressed = rec.compress();
    const player = new GhostPlayer(compressed);
    expect(player.getPosition(0)).toBe(2);
    expect(player.length).toBe(1);
  });

  it('最大80エントリのデータ', () => {
    const rec = new GhostRecorder();
    const log: LaneIndex[] = [];
    for (let i = 0; i < 80; i++) {
      const lane = (i % 3) as LaneIndex;
      log.push(lane);
      rec.record(lane);
    }
    const compressed = rec.compress();
    const player = new GhostPlayer(compressed);
    expect(player.length).toBe(80);
    for (let i = 0; i < 80; i++) {
      expect(player.getPosition(i)).toBe(log[i]);
    }
  });

  it('tick がデータ長を超えた場合は最後の位置を返す', () => {
    const rec = new GhostRecorder();
    rec.record(0 as LaneIndex);
    rec.record(2 as LaneIndex);
    const compressed = rec.compress();
    const player = new GhostPlayer(compressed);
    expect(player.getPosition(100)).toBe(2);
  });

  it('reset でログがクリアされる', () => {
    const rec = new GhostRecorder();
    rec.record(1 as LaneIndex);
    rec.record(2 as LaneIndex);
    rec.reset();
    expect(rec.compress()).toBe('');
  });
});
