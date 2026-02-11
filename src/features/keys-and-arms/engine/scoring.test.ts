import { applyLoopScore, scoreForEvent, scoreNoDamageBonus } from './scoring';

describe('scoring', () => {
  it('ループ倍率を適用する', () => {
    expect(applyLoopScore(100, 1)).toBe(100);
    expect(applyLoopScore(100, 3)).toBe(300);
  });

  it('イベントスコアを返す', () => {
    expect(scoreForEvent('cave-key', 2)).toBe(600);
    expect(scoreForEvent('boss-clear', 1)).toBeGreaterThan(0);
  });

  it('ノーダメージボーナスを制御する', () => {
    expect(scoreNoDamageBonus(2, false)).toBe(0);
    expect(scoreNoDamageBonus(2, true)).toBeGreaterThan(0);
  });
});
