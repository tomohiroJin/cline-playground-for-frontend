import { pickEvent, validateEvents } from '../../events/event-utils';
import type { GameEvent } from '../../events/event-utils';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { createMetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';

const FX = {} as FxState;
const META = createMetaState();
// minPressure を持つ合成イベント
const guarded: GameEvent = {
  id: 'rv_test', fl: [1], tp: 'revenant', minPressure: 2,
  sit: 'テスト亡霊', ch: [{ t: '戦う', o: [{ c: 'default', r: '結果', hp: -10 }] }],
};
const normal: GameEvent = {
  id: 'n_test', fl: [1], tp: 'trap',
  sit: '通常', ch: [{ t: '進む', o: [{ c: 'default', r: '結果', hp: -1 }] }],
};

describe('pickEvent 圧ゲート', () => {
  it('EVENT_TYPE.revenant が登録され validateEvents を通る', () => {
    expect(EVENT_TYPE.revenant).toBeDefined();
    expect(() => validateEvents([guarded], EVENT_TYPE)).not.toThrow();
  });

  it('圧不足では minPressure イベントが選ばれない', () => {
    // floor1 で通常を used にし、圧1 だと guarded(min2) は除外 → null
    const picked = pickEvent({ events: [guarded, normal], floor: 1, usedIds: ['n_test'], meta: META, fx: FX, pressure: 1 });
    expect(picked).toBeNull();
  });

  it('圧が閾値以上なら minPressure イベントが選ばれうる', () => {
    const picked = pickEvent({ events: [guarded], floor: 1, usedIds: [], meta: META, fx: FX, pressure: 2 });
    expect(picked?.id).toBe('rv_test');
  });

  it('pressure 未指定（既定0）では minPressure イベントは出ない（回帰ガード）', () => {
    const picked = pickEvent({ events: [guarded], floor: 1, usedIds: [], meta: META, fx: FX });
    expect(picked).toBeNull();
  });
});
