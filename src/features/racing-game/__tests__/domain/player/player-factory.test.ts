// プレイヤー生成ファクトリのテスト

import { createPlayer, createPlayers } from '../../../domain/player/player-factory';

describe('player-factory', () => {
  describe('createPlayer', () => {
    it('指定したパラメータでプレイヤーを生成する', () => {
      // Arrange & Act
      const player = createPlayer({
        x: 100, y: 200, angle: Math.PI / 2,
        color: '#ff0000', name: 'P1', isCpu: false,
      });

      // Assert
      expect(player.x).toBe(100);
      expect(player.y).toBe(200);
      expect(player.angle).toBe(Math.PI / 2);
      expect(player.color).toBe('#ff0000');
      expect(player.name).toBe('P1');
      expect(player.isCpu).toBe(false);
    });

    it('初期状態が正しく設定される', () => {
      const player = createPlayer({
        x: 0, y: 0, angle: 0,
        color: '#f00', name: 'P1', isCpu: false,
      });

      expect(player.lap).toBe(1);
      expect(player.checkpointFlags).toBe(0);
      expect(player.lapTimes).toEqual([]);
      expect(player.speed).toBe(1);
      expect(player.wallStuck).toBe(0);
      expect(player.drift.active).toBe(false);
      expect(player.heat.gauge).toBe(0);
      expect(player.activeCards).toEqual([]);
      expect(player.shieldCount).toBe(0);
    });
  });

  describe('createPlayers', () => {
    const startPoint = { x: 450, y: 650 };
    const startAngle = 0;

    it('solo モードでは 1 人のプレイヤーを生成する', () => {
      const players = createPlayers('solo', startPoint, startAngle, ['#f00', '#00f'], ['P1', 'P2']);

      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('P1');
      expect(players[0].isCpu).toBe(false);
    });

    it('cpu モードでは 2 人（人間 + CPU）のプレイヤーを生成する', () => {
      const players = createPlayers('cpu', startPoint, startAngle, ['#f00', '#00f'], ['P1', 'CPU']);

      expect(players).toHaveLength(2);
      expect(players[0].isCpu).toBe(false);
      expect(players[1].isCpu).toBe(true);
      expect(players[1].name).toBe('CPU');
    });

    it('2p モードでは 2 人の人間プレイヤーを生成する', () => {
      const players = createPlayers('2p', startPoint, startAngle, ['#f00', '#00f'], ['P1', 'P2']);

      expect(players).toHaveLength(2);
      expect(players[0].isCpu).toBe(false);
      expect(players[1].isCpu).toBe(false);
    });

    it('2 人モードではプレイヤーが横並びに配置される', () => {
      const players = createPlayers('2p', startPoint, startAngle, ['#f00', '#00f'], ['P1', 'P2']);

      // 2 人のプレイヤーは異なる位置に配置される
      const dx = players[0].x - players[1].x;
      const dy = players[0].y - players[1].y;
      const dist = Math.hypot(dx, dy);
      expect(dist).toBeGreaterThan(0);
    });

    it('指定した色と名前が正しく割り当てられる', () => {
      const players = createPlayers('2p', startPoint, startAngle, ['#f00', '#00f'], ['Alice', 'Bob']);

      expect(players[0].color).toBe('#f00');
      expect(players[0].name).toBe('Alice');
      expect(players[1].color).toBe('#00f');
      expect(players[1].name).toBe('Bob');
    });
  });
});
