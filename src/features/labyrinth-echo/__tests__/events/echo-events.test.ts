import { ECHO_EVENTS, buildEchoEvents } from '../../events/echo-events';
import { ECHO_FRAGMENTS } from '../../domain/constants/echo-fragment-defs';
import { EVENT_TYPE } from '../../domain/constants/event-type-defs';
import { validateEvents } from '../../events/event-utils';
import { createMetaState } from '../../domain/models/meta-state';

describe('echo-events', () => {
  it('断片1件につき echo イベント1件を生成する', () => {
    expect(ECHO_EVENTS).toHaveLength(ECHO_FRAGMENTS.length);
  });

  it('全 echo イベントが tp:"echo" でフラグ frag: を持つ', () => {
    for (const e of ECHO_EVENTS) {
      expect(e.tp).toBe('echo');
      const fragFlags = e.ch.flatMap(c => c.o).map(o => o.fl).filter(Boolean);
      expect(fragFlags.some(fl => fl!.startsWith('frag:'))).toBe(true);
    }
  });

  it('各断片IDが echo イベントで付与可能', () => {
    const grantedIds = ECHO_EVENTS.flatMap(e =>
      e.ch.flatMap(c => c.o).map(o => o.fl).filter((fl): fl is string => !!fl && fl.startsWith('frag:')).map(fl => fl.slice(5)),
    );
    for (const f of ECHO_FRAGMENTS) expect(grantedIds).toContain(f.id);
  });

  it('metaCond は深度不足だと false、満たすと true、収集済みだと false', () => {
    const e = ECHO_EVENTS.find(ev => ev.id === 'echo_f_lian_4')!; // depthGate 2
    expect(e.metaCond!(createMetaState({ echoDepth: 1, fragments: [] }))).toBe(false);
    expect(e.metaCond!(createMetaState({ echoDepth: 2, fragments: [] }))).toBe(true);
    expect(e.metaCond!(createMetaState({ echoDepth: 2, fragments: ['f_lian_4'] }))).toBe(false);
  });

  it('EVENT_TYPE.echo が登録され validateEvents を通過する', () => {
    expect(EVENT_TYPE.echo).toBeDefined();
    expect(() => validateEvents([...ECHO_EVENTS], EVENT_TYPE)).not.toThrow();
  });

  it('buildEchoEvents は ECHO_EVENTS と同数を返す', () => {
    expect(buildEchoEvents()).toHaveLength(ECHO_FRAGMENTS.length);
  });
});
