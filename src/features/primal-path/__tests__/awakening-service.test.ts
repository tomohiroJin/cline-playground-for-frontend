/**
 * 覚醒サービス — awkMul（霊の祖）のテスト
 */
import { applyAwkFx } from '../game-logic';
import { makeRun } from './test-helpers';

describe('applyAwkFx — awkMul（覚醒効果増）', () => {
  it('awkMul=0.25 のとき覚醒の atk 効果が ×1.25 で適用される', () => {
    const base = makeRun({ atk: 100, awkMul: 0.25 });
    const r = applyAwkFx(base, { atk: 20 }, 'sa_test', 'テスト覚醒', 'rc', null);
    // 20 × 1.25 = 25 が加算される
    expect(r.atk).toBe(125);
  });

  it('awkMul 未設定（既定0）のとき従来どおり等倍で適用される', () => {
    const base = makeRun({ atk: 100 });
    const r = applyAwkFx(base, { atk: 20 }, 'sa_test', 'テスト覚醒', 'rc', null);
    expect(r.atk).toBe(120);
  });
});
