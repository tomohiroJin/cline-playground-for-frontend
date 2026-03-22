/**
 * InputSource インターフェース + PlayerSlot 型のテスト
 * 型が正しく定義されていることを確認する
 */
import { PlayerSlot } from './input';

describe('PlayerSlot', () => {
  it('player1 が有効な値として使用できる', () => {
    const slot: PlayerSlot = 'player1';
    expect(slot).toBe('player1');
  });

  it('player2 が有効な値として使用できる', () => {
    const slot: PlayerSlot = 'player2';
    expect(slot).toBe('player2');
  });
});
