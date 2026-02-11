import { loadHighScore, saveHighScore, shouldUpdateHighScore } from './storage';

describe('keys-and-arms storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('新キーを優先して読み込む', () => {
    localStorage.setItem('kaG', '1200');
    localStorage.setItem('game_score_keys_and_arms', '3400');
    expect(loadHighScore()).toBe(3400);
  });

  it('新キー未設定時は旧キーを読む', () => {
    localStorage.setItem('kaG', '900');
    expect(loadHighScore()).toBe(900);
  });

  it('保存時に整数へ正規化する', () => {
    saveHighScore(1234.9);
    expect(localStorage.getItem('game_score_keys_and_arms')).toBe('1234');
  });

  it('ハイスコア更新判定', () => {
    expect(shouldUpdateHighScore(100, 99)).toBe(true);
    expect(shouldUpdateHighScore(100, 100)).toBe(false);
  });
});
