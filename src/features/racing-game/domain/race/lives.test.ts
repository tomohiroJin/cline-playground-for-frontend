// lives.ts の単体テスト

import { decrementLives, isGameOver, INITIAL_LIVES } from './lives';

describe('INITIAL_LIVES', () => {
  it('キャンペーン開始時の残機は 3', () => {
    expect(INITIAL_LIVES).toBe(3);
  });
});

describe('decrementLives', () => {
  it('1 機減らす', () => {
    expect(decrementLives(3)).toBe(2);
  });

  it('0 から減らしても 0 で止まる', () => {
    expect(decrementLives(0)).toBe(0);
  });
});

describe('isGameOver', () => {
  it('残機 0 なら true', () => {
    expect(isGameOver(0)).toBe(true);
  });

  it('残機が正なら false', () => {
    expect(isGameOver(1)).toBe(false);
    expect(isGameOver(3)).toBe(false);
  });

  it('残機が負（理論上ない）でも true', () => {
    expect(isGameOver(-1)).toBe(true);
  });
});
