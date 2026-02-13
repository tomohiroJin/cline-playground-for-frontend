import { Entity } from '../entities';

describe('Racing Game Entities', () => {
  describe('player', () => {
    test('正しいプレイヤーを生成する', () => {
      const p = Entity.player(100, 200, Math.PI, '#f00', 'P1', false);
      expect(p.x).toBe(100);
      expect(p.y).toBe(200);
      expect(p.angle).toBe(Math.PI);
      expect(p.color).toBe('#f00');
      expect(p.name).toBe('P1');
      expect(p.isCpu).toBe(false);
      expect(p.lap).toBe(1);
      expect(p.checkpointFlags).toBe(0);
      expect(p.lapTimes).toEqual([]);
      expect(p.speed).toBe(1);
      expect(p.wallStuck).toBe(0);
    });

    test('CPUプレイヤーを生成する', () => {
      const p = Entity.player(0, 0, 0, '#00f', 'CPU', true);
      expect(p.isCpu).toBe(true);
      expect(p.name).toBe('CPU');
    });
  });

  describe('particle', () => {
    test('正しいパーティクルを生成する', () => {
      const p = Entity.particle(50, 60, 0);
      expect(p.x).toBe(50);
      expect(p.y).toBe(60);
      expect(p.life).toBe(1);
      expect(p.size).toBe(3);
      expect(typeof p.vx).toBe('number');
      expect(typeof p.vy).toBe('number');
    });
  });

  describe('spark', () => {
    test('正しいスパークを生成する', () => {
      const s = Entity.spark(100, 100, 0, '#fff');
      expect(s.life).toBe(0.5);
      expect(s.color).toBe('#fff');
      expect(typeof s.vx).toBe('number');
      expect(typeof s.vy).toBe('number');
    });
  });

  describe('confetti', () => {
    test('正しい紙吹雪を生成する', () => {
      const c = Entity.confetti();
      expect(typeof c.x).toBe('number');
      expect(typeof c.y).toBe('number');
      expect(typeof c.vx).toBe('number');
      expect(typeof c.vy).toBe('number');
      expect(typeof c.size).toBe('number');
      expect(typeof c.color).toBe('string');
      expect(typeof c.rot).toBe('number');
      expect(typeof c.rotSpd).toBe('number');
    });
  });

  describe('decoration', () => {
    test('正しいデコレーションを生成する', () => {
      const d = Entity.decoration(100, 200);
      expect(d.x).toBe(100);
      expect(d.y).toBe(200);
      expect([0, 1, 2]).toContain(d.variant);
    });
  });
});
