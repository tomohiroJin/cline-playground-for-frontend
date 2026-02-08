import {
  clamp,
  computeRank,
  comboMult,
  calcEffBf,
  visLabel,
  mergeStyles,
  computePoints,
  computeStageBonus,
  buildSummary,
  isAdjacentTo,
} from './game-logic';

describe('clamp', () => {
  it('範囲内の値はそのまま返す', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('下限未満の値は下限を返す', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('上限超過の値は上限を返す', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('computeRank', () => {
  it('スコア0の場合はランクEを返す', () => {
    const result = computeRank(0, false, 0);
    expect(result.g).toBe('E');
  });

  it('高スコアで全クリアの場合は高ランクを返す', () => {
    const result = computeRank(10000, true, 5);
    expect(result.g).not.toBe('E');
  });
});

describe('comboMult', () => {
  it('コンボ0の場合は基本倍率を返す', () => {
    expect(comboMult(0, 0)).toBe(1);
  });

  it('コンボ3で1.5倍', () => {
    expect(comboMult(3, 0)).toBe(1.5);
  });

  it('コンボ5で2倍', () => {
    expect(comboMult(5, 0)).toBe(2);
  });

  it('コンボボーナスが加算される（コンボ3以上）', () => {
    expect(comboMult(3, 0.5)).toBe(2.0);
  });

  it('コンボ2以下ではボーナスは加算されない', () => {
    expect(comboMult(2, 0.5)).toBe(1);
  });
});

describe('calcEffBf', () => {
  it('基本予告段数を返す', () => {
    const bf0 = [2, 4, 6];
    expect(calcEffBf(bf0, 0, 0, -1, 0, 0)).toBe(2);
    expect(calcEffBf(bf0, 1, 0, -1, 0, 0)).toBe(4);
    expect(calcEffBf(bf0, 2, 0, -1, 0, 0)).toBe(6);
  });

  it('adj修正が適用される', () => {
    const bf0 = [2, 4, 6];
    expect(calcEffBf(bf0, 0, -1, -1, 0, 0)).toBe(1);
  });

  it('adjLane指定で追加修正', () => {
    const bf0 = [2, 4, 6];
    expect(calcEffBf(bf0, 1, 0, 1, -2, 0)).toBe(2);
  });

  it('結果は0〜ROWS-1にクランプされる', () => {
    const bf0 = [0, 0, 0];
    expect(calcEffBf(bf0, 0, -10, -1, 0, 0)).toBe(0);
    expect(calcEffBf(bf0, 0, 100, -1, 0, 0)).toBe(7);
  });
});

describe('visLabel', () => {
  it('7以上はSAFE', () => {
    expect(visLabel(7)).toBe('SAFE');
    expect(visLabel(8)).toBe('SAFE');
  });

  it('4〜6はMID', () => {
    expect(visLabel(4)).toBe('MID');
    expect(visLabel(6)).toBe('MID');
  });

  it('3以下はRISK', () => {
    expect(visLabel(3)).toBe('RISK');
    expect(visLabel(0)).toBe('RISK');
  });
});

describe('mergeStyles', () => {
  it('空配列でエラーを投げる', () => {
    expect(() => mergeStyles([])).toThrow('mergeStyles: empty');
  });

  it('standardスタイルをマージできる', () => {
    const result = mergeStyles(['standard']);
    expect(result.mu).toHaveLength(3);
    expect(result.rs).toEqual([]);
    expect(result.sf).toEqual([]);
  });
});

describe('computePoints', () => {
  it('基本ポイント計算', () => {
    const pts = computePoints(2, 1, 1, 1, 0);
    expect(pts).toBe(20);
  });

  it('コンボ倍率が反映される', () => {
    const pts = computePoints(2, 1.5, 1, 1, 0);
    expect(pts).toBe(30);
  });

  it('ベースボーナスが反映される', () => {
    const pts = computePoints(1, 1, 1, 1, 5);
    expect(pts).toBe(15);
  });
});

describe('computeStageBonus', () => {
  it('ステージ0の基本ボーナス', () => {
    const bn = computeStageBonus(0, 0, 1, 0, 0);
    expect(bn).toBe(50);
  });

  it('ステージ番号に応じてボーナス増加', () => {
    const bn = computeStageBonus(2, 0, 1, 0, 0);
    expect(bn).toBe(150);
  });

  it('高コンボでボーナス加算', () => {
    const bn1 = computeStageBonus(0, 0, 1, 3, 0);
    const bn2 = computeStageBonus(0, 0, 1, 5, 0);
    expect(bn1).toBe(80);
    expect(bn2).toBe(150);
  });

  it('ニアミス3回以上でボーナス加算', () => {
    const bn = computeStageBonus(0, 0, 1, 0, 3);
    expect(bn).toBe(100);
  });
});

describe('buildSummary', () => {
  it('基本状態では空文字列を返す', () => {
    const result = buildSummary({
      scoreMult: 1,
      st: { mu: [1, 2, 4], rs: [], sf: [], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6], autoBlock: 0 },
      slowMod: 0,
      speedMod: 0,
      revive: 0,
      comboBonus: 0,
    });
    expect(result).toBe('');
  });

  it('スコア倍率が表示される', () => {
    const result = buildSummary({
      scoreMult: 1.5,
      st: { mu: [1, 2, 4], rs: [], sf: [], wm: 0, cm: 0, sh: 0, sp: 0, db: 0, cb: 0, bfSet: [0, 4, 6], autoBlock: 0 },
      slowMod: 0,
      speedMod: 0,
      revive: 0,
      comboBonus: 0,
    });
    expect(result).toContain('SCORE×1.5');
  });
});

describe('isAdjacentTo', () => {
  it('隣接レーンを検知する', () => {
    expect(isAdjacentTo([0], 1)).toBe(true);
    expect(isAdjacentTo([2], 1)).toBe(true);
  });

  it('非隣接レーンはfalse', () => {
    expect(isAdjacentTo([0], 2)).toBe(false);
    expect(isAdjacentTo([2], 0)).toBe(false);
  });

  it('同一レーンはfalse', () => {
    expect(isAdjacentTo([1], 1)).toBe(false);
  });

  it('空配列はfalse', () => {
    expect(isAdjacentTo([], 1)).toBe(false);
  });
});
