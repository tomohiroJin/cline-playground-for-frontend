import { LEGACY_STORAGE_KEY, STORAGE_KEY } from './constants';
import { loadHiScore, saveHiScore } from './storage';

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('新キーに保存したスコアを復元する', () => {
    saveHiScore(1234);
    expect(loadHiScore()).toBe(1234);
  });

  it('旧キー kaG から初回読み込み時に移行する', () => {
    window.localStorage.setItem(LEGACY_STORAGE_KEY, '777');

    const loaded = loadHiScore();

    expect(loaded).toBe(777);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('777');
  });

  it('不正値は 0 として扱う', () => {
    window.localStorage.setItem(STORAGE_KEY, '-1');
    expect(loadHiScore()).toBe(0);
  });
});
