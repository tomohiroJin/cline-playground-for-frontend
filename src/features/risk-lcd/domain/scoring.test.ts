import { calculateDailyReward, wPick, buildSummary } from './scoring';

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

describe('wPick', () => {
  it('重みに基づいてインデックスを返す', () => {
    // rng を固定して最初の要素を選択
    const result = wPick([10, 0, 0], [], () => 0.05);
    expect(result).toBe(0);
  });

  it('rng が上限付近の値を返す場合にも有効なインデックスを返す', () => {
    const result = wPick([1, 1, 1], [], () => 0.9999);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(3);
  });

  it('全要素がexcludeされた場合に-1を返す', () => {
    const result = wPick([1, 2, 3], [0, 1, 2]);
    expect(result).toBe(-1);
  });
});

describe('buildSummary', () => {
  it('避難所情報を含むサマリーを生成する', () => {
    const game = {
      scoreMult: 1,
      st: { mu: [1, 2, 4], rs: [], sf: [0, 2], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6] },
      slowMod: 0,
      speedMod: 0,
      revive: 0,
      comboBonus: 0,
    };
    const result = buildSummary(game);
    expect(result).toContain('避難所:L,R');
  });

  it('速度増加（FAST）情報を含むサマリーを生成する', () => {
    const game = {
      scoreMult: 1,
      st: { mu: [1, 2, 4], rs: [], sf: [], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6] },
      slowMod: 0,
      speedMod: -0.2,
      revive: 0,
      comboBonus: 0,
    };
    const result = buildSummary(game);
    expect(result).toContain('FAST+20%');
  });

  it('全修飾が含まれるサマリーを生成する', () => {
    const game = {
      scoreMult: 1.5,
      st: { mu: [1, 2, 4], rs: [], sf: [1], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6] },
      slowMod: 0.15,
      speedMod: -0.2,
      revive: 1,
      comboBonus: 0.5,
    };
    const result = buildSummary(game);
    expect(result).toContain('SCORE×1.5');
    expect(result).toContain('避難所:C');
    expect(result).toContain('SLOW-15%');
    expect(result).toContain('FAST+20%');
    expect(result).toContain('REVIVE×1');
    expect(result).toContain('COMBO+0.5');
  });

  it('修飾がない場合は空文字列を返す', () => {
    const game = {
      scoreMult: 1,
      st: { mu: [1, 2, 4], rs: [], sf: [], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6] },
      slowMod: 0,
      speedMod: 0,
      revive: 0,
      comboBonus: 0,
    };
    const result = buildSummary(game);
    expect(result).toBe('');
  });
});
