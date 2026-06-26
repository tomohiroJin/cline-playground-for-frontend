import { incrementEchoDepth, selectSafetyNetFragment } from '../../../domain/services/echo-service';
import { createMetaState } from '../../../domain/models/meta-state';

/**
 * handleEscapeOutcome の updateMeta が組み立てる echoDepth/fragments の
 * 計算ロジックを純粋関数の組み合わせとして検証する。
 * （副作用結合は Task 11 の手動確認・E2E で担保）
 */
describe('生還時の残響深度更新ロジック', () => {
  it('深度が +1 され、新深度でセーフティネット断片が選ばれる', () => {
    const prev = createMetaState({ echoDepth: 0, fragments: [] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    expect(newDepth).toBe(1);
    // depth1 未収集の最小 order → f_lian_1(order1,gate0) と f_twins_1(order1,gate1)
    // localeCompare で p_lian が先
    expect(safety?.id).toBe('f_lian_1');
  });

  it('既に収集済みの断片は重複付与されない', () => {
    const prev = createMetaState({ echoDepth: 1, fragments: ['f_lian_1', 'f_twins_1'] });
    const newDepth = incrementEchoDepth(prev.echoDepth);
    const safety = selectSafetyNetFragment(newDepth, prev.fragments);
    const next = safety && !prev.fragments.includes(safety.id)
      ? [...prev.fragments, safety.id] : prev.fragments;
    expect(next).toContain(safety!.id);
    expect(next.filter(id => id === safety!.id)).toHaveLength(1);
  });
});
