/**
 * echo イベントの選出統合テスト
 *
 * pickEvent と ECHO_EVENTS の結合仕様を固定する。
 * 深度・収集状況により echo イベントが正しく選出・除外されることを検証する。
 */
import { pickEvent, validateEvents } from '../../events/event-utils';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { createMetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';

// 通常イベント + echo イベントの統合プール
const EVENTS = validateEvents([...EV, ...ECHO_EVENTS], EVENT_TYPE);
const FX = {} as FxState;

describe('echo イベントの選出統合', () => {
  it('深度を満たす未収集の echo イベントがプールに含まれる', () => {
    // floor1, echoDepth0 → echo_f_lian_1 (gate0) のみが残る候補。
    // 通常イベントを全て usedIds に入れると floor1 で選出可能なのは echo_f_lian_1 だけ
    // → プール要素数1のため rng に依存せず必ず返る（rng は省略）。
    const meta = createMetaState({ echoDepth: 0, fragments: [] });
    const floor1NormalIds = EV.filter(e => (e.fl as number[]).includes(1)).map(e => e.id);
    const picked = pickEvent({ events: EVENTS, floor: 1, usedIds: floor1NormalIds, meta, fx: FX });
    expect(picked?.id).toBe('echo_f_lian_1');
  });

  it('収集済みの断片に対応する echo イベントは選出されない', () => {
    // f_lian_1 を収集済みにすると echo_f_lian_1 の metaCond は false。
    // floor1 通常も全て used → 選出可能イベントが無くなり null になる。
    const meta = createMetaState({ echoDepth: 0, fragments: ['f_lian_1'] });
    const floor1NormalIds = EV.filter(e => (e.fl as number[]).includes(1)).map(e => e.id);
    const picked = pickEvent({ events: EVENTS, floor: 1, usedIds: floor1NormalIds, meta, fx: FX });
    expect(picked?.id).not.toBe('echo_f_lian_1');
  });
});
