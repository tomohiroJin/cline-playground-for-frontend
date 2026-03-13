import { calculateDailyReward } from './scoring';

describe('calculateDailyReward', () => {
  it('初回プレイで50pt獲得する', () => {
    const result = calculateDailyReward({
      score: 100,
      previousBest: 0,
      isFirstPlay: true,
    });

    expect(result.reward).toBe(50 + 10); // 初回50 + ベスト更新10
    expect(result.isNewBest).toBe(true);
  });

  it('自己ベスト更新で差分の10%が加算される', () => {
    const result = calculateDailyReward({
      score: 500,
      previousBest: 200,
      isFirstPlay: false,
    });

    expect(result.reward).toBe(30); // (500-200)*0.1 = 30
    expect(result.isNewBest).toBe(true);
  });

  it('自己ベストを更新しない場合は0pt', () => {
    const result = calculateDailyReward({
      score: 100,
      previousBest: 500,
      isFirstPlay: false,
    });

    expect(result.reward).toBe(0);
    expect(result.isNewBest).toBe(false);
  });

  it('初回プレイかつベスト更新で両方加算される', () => {
    const result = calculateDailyReward({
      score: 1000,
      previousBest: 0,
      isFirstPlay: true,
    });

    // 初回50 + ベスト更新(1000*0.1)=100 = 150
    expect(result.reward).toBe(150);
    expect(result.isNewBest).toBe(true);
  });

  it('同点はベスト更新にならない', () => {
    const result = calculateDailyReward({
      score: 500,
      previousBest: 500,
      isFirstPlay: false,
    });

    expect(result.reward).toBe(0);
    expect(result.isNewBest).toBe(false);
  });
});
