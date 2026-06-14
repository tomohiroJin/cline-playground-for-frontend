import { advanceTransition } from '../../core/transition';
import { TRANSITION_TOTAL, TRANSITION_MID } from '../../constants';
import { createTestEngine } from '../helpers/test-engine';

describe('advanceTransition', () => {
  it('残りカウントを1減らす', () => {
    const G = createTestEngine().G;
    G.transition = { t: TRANSITION_TOTAL, txt: '', fn: undefined, sub: '' };
    advanceTransition(G);
    expect(G.transition.t).toBe(TRANSITION_TOTAL - 1);
  });

  it('中点で登録コールバックを1回だけ実行する', () => {
    const G = createTestEngine().G;
    let calls = 0;
    G.transition = { t: TRANSITION_MID + 1, txt: '', fn: () => { calls++; }, sub: '' };
    advanceTransition(G); // t: MID+1 -> MID（中点でコールバック発火）
    expect(G.transition.t).toBe(TRANSITION_MID);
    expect(calls).toBe(1);
    advanceTransition(G); // t: MID -> MID-1（発火しない）
    expect(calls).toBe(1);
  });
});
