import { Mallet } from './mallet';

describe('Mallet エンティティ', () => {
  describe('create', () => {
    it('指定した座標と半径でマレットを生成する', () => {
      const mallet = Mallet.create(225, 830, 42, 'player');
      expect(mallet.x).toBe(225);
      expect(mallet.y).toBe(830);
      expect(mallet.radius).toBe(42);
      expect(mallet.side).toBe('player');
    });
  });

  describe('moveTo', () => {
    it('ターゲット方向に移動する', () => {
      const mallet = Mallet.create(225, 830, 42, 'player');
      const result = Mallet.moveTo(mallet, 300, 830, 5);
      expect(result.x).toBeGreaterThan(225);
    });

    it('maxSpeed を超えない', () => {
      const mallet = Mallet.create(0, 0, 42, 'player');
      const result = Mallet.moveTo(mallet, 1000, 0, 5);
      const speed = Math.sqrt(result.vx ** 2 + result.vy ** 2);
      expect(speed).toBeLessThanOrEqual(5 + 0.001);
    });
  });

  describe('clampToSide', () => {
    it('プレイヤーマレットを下半分に制限する', () => {
      const mallet = Mallet.create(225, 100, 42, 'player');
      const result = Mallet.clampToSide(mallet, 450, 900);
      expect(result.y).toBeGreaterThanOrEqual(450);
    });

    it('CPU マレットを上半分に制限する', () => {
      const mallet = Mallet.create(225, 800, 42, 'cpu');
      const result = Mallet.clampToSide(mallet, 450, 900);
      expect(result.y).toBeLessThanOrEqual(450);
    });

    it('マレットを画面外に出さない', () => {
      const mallet = Mallet.create(-10, 500, 42, 'player');
      const result = Mallet.clampToSide(mallet, 450, 900);
      expect(result.x).toBeGreaterThanOrEqual(42);
    });
  });
});
