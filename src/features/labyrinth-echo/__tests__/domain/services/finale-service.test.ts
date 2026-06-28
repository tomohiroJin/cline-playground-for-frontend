import {
  TRUE_ROUTE_DEPTH_GATE, isTrueRouteUnlocked, determineTrueEnding, hasReachedTrueEnding,
} from '../../../domain/services/finale-service';
import { createMetaState } from '../../../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const allFrags = ECHO_FRAGMENTS.map(f => f.id);

describe('finale-service', () => {
  it('解禁しきい値は 6', () => {
    expect(TRUE_ROUTE_DEPTH_GATE).toBe(6);
  });

  it('isTrueRouteUnlocked: echoDepth≥6 かつ 全断片収集で true', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 6, fragments: allFrags }))).toBe(true);
  });
  it('isTrueRouteUnlocked: echoDepth不足で false', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 5, fragments: allFrags }))).toBe(false);
  });
  it('isTrueRouteUnlocked: 断片欠落で false', () => {
    expect(isTrueRouteUnlocked(createMetaState({ echoDepth: 6, fragments: allFrags.slice(0, -1) }))).toBe(false);
  });

  it('determineTrueEnding: 継ぐ×非昇格→継承者、断つ×非昇格→解放者', () => {
    expect(determineTrueEnding('inherit', 0, null).id).toBe('te_inheritor');
    expect(determineTrueEnding('sever', 0, null).id).toBe('te_liberator');
  });
  it('determineTrueEnding: 圧≥5 で昇格', () => {
    expect(determineTrueEnding('inherit', 5, null).id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 6, null).id).toBe('te_liberator_true');
  });
  it('determineTrueEnding: 起源の継承(lg_first)で昇格', () => {
    expect(determineTrueEnding('inherit', 0, 'lg_first').id).toBe('te_inheritor_true');
    expect(determineTrueEnding('sever', 0, 'lg_first').id).toBe('te_liberator_true');
  });

  it('hasReachedTrueEnding: endings に te_ を含むとき true', () => {
    expect(hasReachedTrueEnding(createMetaState({ endings: ['standard'] }))).toBe(false);
    expect(hasReachedTrueEnding(createMetaState({ endings: ['standard', 'te_liberator'] }))).toBe(true);
  });
});
