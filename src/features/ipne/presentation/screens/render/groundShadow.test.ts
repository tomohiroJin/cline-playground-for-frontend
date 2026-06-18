import { drawGroundShadow } from './groundShadow';

/** ellipse / globalAlpha の呼び出しを記録するスタブ ctx */
function createStubCtx() {
  const calls: { ellipseArgs: number[][]; alphas: number[]; fills: number } = {
    ellipseArgs: [],
    alphas: [],
    fills: 0,
  };
  const stub = {
    globalAlpha: 1,
    fillStyle: '',
    save() {},
    restore() {},
    beginPath() {},
    ellipse(x: number, y: number, rw: number, rh: number) {
      calls.ellipseArgs.push([x, y, rw, rh]);
      calls.alphas.push(stub.globalAlpha);
    },
    fill() {
      calls.fills += 1;
    },
  };
  const ctx = stub as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('drawGroundShadow', () => {
  it('は楕円を1つ塗る', () => {
    const { ctx, calls } = createStubCtx();
    drawGroundShadow(ctx, 100, 100, 64, 0);
    expect(calls.ellipseArgs).toHaveLength(1);
    expect(calls.fills).toBe(1);
  });

  it('は lift が大きいほど影が小さく薄くなる', () => {
    const { ctx, calls } = createStubCtx();
    drawGroundShadow(ctx, 100, 100, 64, 0); // 接地
    drawGroundShadow(ctx, 100, 100, 64, 2); // 浮き
    const [grounded, lifted] = calls.ellipseArgs;
    const [groundedAlpha, liftedAlpha] = calls.alphas;
    expect(lifted[2]).toBeLessThan(grounded[2]); // rw が小さい
    expect(liftedAlpha).toBeLessThan(groundedAlpha); // alpha が小さい
  });
});
