import {
  ECHO_DEPTH_MAX, incrementEchoDepth, isFragmentUnlockable,
  selectSafetyNetFragment, predecessorFragments, predecessorProgress,
  isPredecessorDiscovered, isPredecessorComplete, unlockedTruthLayers,
} from '../../../domain/services/echo-service';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const frag = (id: string) => ECHO_FRAGMENTS.find(f => f.id === id)!;

describe('echo-service', () => {
  it('incrementEchoDepth は +1 し ECHO_DEPTH_MAX で頭打ち', () => {
    expect(incrementEchoDepth(0)).toBe(1);
    expect(incrementEchoDepth(ECHO_DEPTH_MAX)).toBe(ECHO_DEPTH_MAX);
    expect(incrementEchoDepth(ECHO_DEPTH_MAX - 1)).toBe(ECHO_DEPTH_MAX);
  });

  it('isFragmentUnlockable は depthGate と echoDepth を比較', () => {
    expect(isFragmentUnlockable(frag('f_lian_1'), 0)).toBe(true); // gate0
    expect(isFragmentUnlockable(frag('f_lian_4'), 1)).toBe(false); // gate2
    expect(isFragmentUnlockable(frag('f_lian_4'), 2)).toBe(true);
  });

  it('selectSafetyNetFragment は解禁済み未収集の最小 order を返す', () => {
    const f = selectSafetyNetFragment(0, []);
    expect(f?.id).toBe('f_lian_1'); // depth0 で唯一 gate0
  });

  it('selectSafetyNetFragment は収集済みを除外する', () => {
    const f = selectSafetyNetFragment(1, ['f_lian_1']);
    // depth1: gate<=1 の未収集のうち order 最小 → f_lian_2 か f_twins_1（order2 vs order1）
    expect(f?.id).toBe('f_twins_1');
  });

  it('全断片を集め切ると null を返す', () => {
    const all = ECHO_FRAGMENTS.map(f => f.id);
    expect(selectSafetyNetFragment(ECHO_DEPTH_MAX, all)).toBeNull();
  });

  it('predecessorProgress は収集数/総数を返す', () => {
    expect(predecessorProgress('p_lian', ['f_lian_1', 'f_lian_2'])).toEqual({ collected: 2, total: 4 });
  });

  it('isPredecessorDiscovered は1片でも収集していれば true', () => {
    expect(isPredecessorDiscovered('p_lian', [])).toBe(false);
    expect(isPredecessorDiscovered('p_lian', ['f_lian_3'])).toBe(true);
  });

  it('isPredecessorComplete は全片収集で true', () => {
    expect(isPredecessorComplete('p_first', ['f_first_1', 'f_first_2'])).toBe(false);
    expect(isPredecessorComplete('p_first', ['f_first_1', 'f_first_2', 'f_first_3'])).toBe(true);
  });

  it('unlockedTruthLayers は depthGate<=echoDepth のレイヤーを返す', () => {
    expect(unlockedTruthLayers(0)).toHaveLength(0);
    expect(unlockedTruthLayers(1).map(t => t.layer)).toEqual([1]);
    expect(unlockedTruthLayers(6).map(t => t.layer)).toEqual([1, 2, 3, 4]);
  });

  it('predecessorFragments は order 昇順', () => {
    const orders = predecessorFragments('p_lian').map(f => f.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });
});
