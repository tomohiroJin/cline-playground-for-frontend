import { resolveMotionScale, scaleFrames } from './motion-scale';

describe('motion-scale', () => {
  describe('resolveMotionScale', () => {
    describe('正常系', () => {
      it('reduced-motion 無効時は係数1を返す', () => {
        // Arrange / Act / Assert
        expect(resolveMotionScale(false)).toBe(1);
      });

      it('reduced-motion 有効時は係数0を返す（時間操作を無効化）', () => {
        // Arrange / Act / Assert
        expect(resolveMotionScale(true)).toBe(0);
      });
    });
  });

  describe('scaleFrames', () => {
    describe('正常系', () => {
      it('係数1でフレーム数をそのまま返す', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(12, 1)).toBe(12);
      });

      it('係数0でフレーム数を0にする', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(12, 0)).toBe(0);
      });
    });

    describe('境界値', () => {
      it('小数係数は四捨五入する', () => {
        // Arrange / Act / Assert
        expect(scaleFrames(5, 0.5)).toBe(3);
      });
    });
  });
});
