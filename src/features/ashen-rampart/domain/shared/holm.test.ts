import { holmAdjust } from './holm';

describe('holmAdjust（Holm-Bonferroni の補正後 p 値）', () => {
  it('空配列は空配列', () => {
    expect(holmAdjust([])).toEqual([]);
  });

  it('1本なら補正しない', () => {
    expect(holmAdjust([0.03])).toEqual([0.03]);
  });

  it('昇順の i 番目に (m - i + 1) を掛ける', () => {
    // m=3。p=(0.01, 0.02, 0.04) → (0.03, 0.04, 0.04)
    // 3番目は 0.04 * 1 = 0.04 だが、単調化で2番目の 0.04 以上に保たれる。
    // **浮動小数なので toEqual で比べない**（0.01 * 3 がたまたま 0.03 と一致するかは
    // この式の意図ではない）
    const adjusted = holmAdjust([0.01, 0.02, 0.04]);
    expect(adjusted[0]).toBeCloseTo(0.03, 10);
    expect(adjusted[1]).toBeCloseTo(0.04, 10);
    expect(adjusted[2]).toBeCloseTo(0.04, 10);
  });

  it('入力の順序で返す（昇順に並べ替えない）', () => {
    const adjusted = holmAdjust([0.04, 0.01, 0.02]);
    expect(adjusted[0]).toBeCloseTo(0.04, 10);
    expect(adjusted[1]).toBeCloseTo(0.03, 10);
    expect(adjusted[2]).toBeCloseTo(0.04, 10);
  });

  it('単調化する（生 p の昇順に並べ直すと非減少になる）', () => {
    // 単調化しないと、3番目（0.022 * 3 = 0.066）が
    // 4番目（0.023 * 2 = 0.046）を上回って順序が逆転する
    const input = [0.02, 0.021, 0.022, 0.023, 0.024];
    const adjusted = holmAdjust(input);
    for (let i = 1; i < adjusted.length; i++) {
      expect(adjusted[i]).toBeGreaterThanOrEqual(adjusted[i - 1] as number);
    }
  });

  it('1 で頭打ちにする', () => {
    expect(holmAdjust([0.5, 0.6])).toEqual([1, 1]);
  });

  it('0 以上 1 以下でない値は契約違反', () => {
    expect(() => holmAdjust([1.5])).toThrow();
    expect(() => holmAdjust([-0.1])).toThrow();
  });
});
