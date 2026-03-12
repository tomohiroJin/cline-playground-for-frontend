/**
 * プレイヤー状態管理のテスト
 */
import {
  createPlayerState,
  applyDamage,
  applyHeal,
  addScore,
  isPlayerDead,
  canBeHurt,
} from '../../domain/player/player-state';

describe('player/player-state', () => {
  describe('createPlayerState', () => {
    it('初期 HP で生成される', () => {
      const player = createPlayerState(3, 3);
      expect(player.hp).toBe(3);
      expect(player.maxHp).toBe(3);
    });

    it('初期スコアは 0', () => {
      const player = createPlayerState(3, 3);
      expect(player.score).toBe(0);
    });

    it('初期状態はノーダメージ', () => {
      const player = createPlayerState(3, 3);
      expect(player.noDmg).toBe(true);
    });
  });

  describe('applyDamage', () => {
    it('HP が 1 減少する', () => {
      const player = createPlayerState(3, 3);
      const result = applyDamage(player);
      expect(result.hp).toBe(2);
    });

    it('noDmg フラグが false になる', () => {
      const player = createPlayerState(3, 3);
      const result = applyDamage(player);
      expect(result.noDmg).toBe(false);
    });

    it('HP が 0 以下にはならない', () => {
      const player = createPlayerState(1, 3);
      const result = applyDamage(player);
      expect(result.hp).toBe(0);
    });
  });

  describe('applyHeal', () => {
    it('HP が 1 増加する', () => {
      const player = createPlayerState(2, 3);
      const result = applyHeal(player);
      expect(result.hp).toBe(3);
    });

    it('maxHp を超えない', () => {
      const player = createPlayerState(3, 3);
      const result = applyHeal(player);
      expect(result.hp).toBe(3);
    });
  });

  describe('addScore', () => {
    it('スコアが加算される', () => {
      const player = createPlayerState(3, 3);
      const result = addScore(player, 500);
      expect(result.score).toBe(500);
    });

    it('累積加算される', () => {
      let player = createPlayerState(3, 3);
      player = addScore(player, 100);
      player = addScore(player, 200);
      expect(player.score).toBe(300);
    });

    it('負のスコア加算はエラーになる', () => {
      const player = createPlayerState(3, 3);
      expect(() => addScore(player, -10)).toThrow('[Contract]');
    });
  });

  describe('isPlayerDead', () => {
    it('HP 0 で死亡', () => {
      const player = { ...createPlayerState(0, 3) };
      expect(isPlayerDead(player)).toBe(true);
    });

    it('HP 1 以上で生存', () => {
      const player = createPlayerState(1, 3);
      expect(isPlayerDead(player)).toBe(false);
    });
  });

  describe('canBeHurt', () => {
    it('hurtCD が 0 ならダメージを受けられる', () => {
      expect(canBeHurt(0)).toBe(true);
    });

    it('hurtCD が 0 より大きいならダメージを受けられない', () => {
      expect(canBeHurt(5)).toBe(false);
    });
  });
});
