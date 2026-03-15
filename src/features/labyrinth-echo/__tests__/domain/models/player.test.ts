/**
 * Player 値オブジェクトのテスト
 */
import { createPlayer } from '../../../domain/models/player';
import type { StatusEffectId } from '../../../domain/models/player';

describe('Player', () => {
  describe('createPlayer', () => {
    describe('正常系', () => {
      it('デフォルト値で有効なPlayerを生成する', () => {
        // Arrange & Act
        const player = createPlayer({
          hp: 55,
          maxHp: 55,
          mn: 35,
          maxMn: 35,
          inf: 5,
        });

        // Assert
        expect(player.hp).toBe(55);
        expect(player.maxHp).toBe(55);
        expect(player.mn).toBe(35);
        expect(player.maxMn).toBe(35);
        expect(player.inf).toBe(5);
        expect(player.statuses).toEqual([]);
      });

      it('ステータス効果付きでPlayerを生成する', () => {
        // Arrange
        const statuses: StatusEffectId[] = ['負傷', '混乱'];

        // Act
        const player = createPlayer({
          hp: 50,
          maxHp: 55,
          mn: 30,
          maxMn: 35,
          inf: 10,
          statuses,
        });

        // Assert
        expect(player.statuses).toEqual(['負傷', '混乱']);
      });
    });

    describe('不変条件（DbC）', () => {
      // invariant 関数の console.error ノイズを抑制
      beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); });
      afterEach(() => { jest.restoreAllMocks(); });
      it('hpがmaxHpを超える場合にエラーを投げる', () => {
        // Arrange & Act & Assert
        expect(() =>
          createPlayer({ hp: 60, maxHp: 55, mn: 35, maxMn: 35, inf: 5 })
        ).toThrow('Invariant violation');
      });

      it('mnがmaxMnを超える場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: 55, maxHp: 55, mn: 40, maxMn: 35, inf: 5 })
        ).toThrow('Invariant violation');
      });

      it('hpが負の場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: -1, maxHp: 55, mn: 35, maxMn: 35, inf: 5 })
        ).toThrow('Invariant violation');
      });

      it('mnが負の場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: 55, maxHp: 55, mn: -1, maxMn: 35, inf: 5 })
        ).toThrow('Invariant violation');
      });

      it('infが負の場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: 55, maxHp: 55, mn: 35, maxMn: 35, inf: -1 })
        ).toThrow('Invariant violation');
      });

      it('maxHpが0以下の場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: 0, maxHp: 0, mn: 35, maxMn: 35, inf: 5 })
        ).toThrow('Invariant violation');
      });

      it('maxMnが0以下の場合にエラーを投げる', () => {
        expect(() =>
          createPlayer({ hp: 55, maxHp: 55, mn: 0, maxMn: 0, inf: 5 })
        ).toThrow('Invariant violation');
      });
    });

    describe('境界値', () => {
      it('HP=0の場合は正常に生成される', () => {
        // Arrange & Act
        const player = createPlayer({
          hp: 0,
          maxHp: 55,
          mn: 35,
          maxMn: 35,
          inf: 5,
        });

        // Assert
        expect(player.hp).toBe(0);
      });

      it('MN=0の場合は正常に生成される', () => {
        const player = createPlayer({
          hp: 55,
          maxHp: 55,
          mn: 0,
          maxMn: 35,
          inf: 5,
        });

        expect(player.mn).toBe(0);
      });

      it('INF=0の場合は正常に生成される', () => {
        const player = createPlayer({
          hp: 55,
          maxHp: 55,
          mn: 35,
          maxMn: 35,
          inf: 0,
        });

        expect(player.inf).toBe(0);
      });

      it('HP=maxHPの場合は正常に生成される', () => {
        const player = createPlayer({
          hp: 55,
          maxHp: 55,
          mn: 35,
          maxMn: 35,
          inf: 5,
        });

        expect(player.hp).toBe(player.maxHp);
      });
    });
  });
});
