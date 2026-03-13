import { mergeStyles } from './style-merge';

describe('mergeStyles', () => {
  it('空配列でエラーを投げる', () => {
    expect(() => mergeStyles([])).toThrow('mergeStyles: empty');
  });

  describe('単一スタイル', () => {
    it('standardスタイルをマージできる', () => {
      const result = mergeStyles(['standard']);

      expect(result.mu).toEqual([1, 2, 4]);
      expect(result.rs).toEqual([]);
      expect(result.sf).toEqual([]);
      expect(result.sh).toBe(0);
      expect(result.sp).toBe(0);
      expect(result.db).toBe(0);
      expect(result.cb).toBe(0);
      expect(result.autoBlock).toBe(0);
    });

    it('highriskスタイルで倍率が最大値になる', () => {
      const result = mergeStyles(['highrisk']);

      expect(result.mu).toEqual([1, 2, 8]); // max([1,2,4], [1,2,8])
      expect(result.db).toBe(0.5);
      expect(result.autoBlock).toBe(1);
    });

    it('reversalスタイルでシールドが設定される', () => {
      const result = mergeStyles(['reversal']);

      expect(result.sh).toBe(1);
      expect(result.sp).toBe(5);
    });
  });

  describe('複数スタイルのマージ', () => {
    it('倍率は各レーンの最大値を取る', () => {
      const result = mergeStyles(['standard', 'cautious']);

      // standard: [1,2,4], cautious: [3,1,2] → max: [3,2,4]
      expect(result.mu).toEqual([3, 2, 4]);
    });

    it('速度修飾は加算される', () => {
      const result = mergeStyles(['standard', 'quickjudge']);

      expect(result.wm).toBe(-0.25); // 0 + (-0.25)
      expect(result.cm).toBe(-0.4);  // 0 + (-0.4)
    });

    it('クリアボーナスは最大値を取る', () => {
      const result = mergeStyles(['standard', 'cautious']);

      expect(result.cb).toBe(1); // max(0, 1)
    });

    it('シールドは加算される', () => {
      const result = mergeStyles(['reversal', 'standard']);

      expect(result.sh).toBe(1); // 0 + 1
    });

    it('予告セットは合計が小さい方が採用される', () => {
      const result = mergeStyles(['standard', 'quickjudge']);

      // standard: [0,4,6] sum=10, quickjudge: [0,2,4] sum=6 → [0,2,4]
      expect(result.bfSet).toEqual([0, 2, 4]);
    });
  });

  describe('存在しないスタイルID', () => {
    it('存在しないIDは無視される', () => {
      const result = mergeStyles(['standard', 'nonexistent']);

      expect(result.mu).toEqual([1, 2, 4]);
    });
  });
});
