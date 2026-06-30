import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY, type RunPolicy } from '../../simulation/run-simulator';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';
import { getLegacyById } from '../../domain/services/legacy-service';
import { SeededRandomSource } from '../../domain/events/random';
import { createMetaState } from '../../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../../domain/constants/echo-fragment-defs';
import type { GameEvent } from '../../events/event-utils';
import type { Player } from '../../domain/models/player';
import type { FxState } from '../../domain/models/unlock';
import type { DifficultyDef } from '../../domain/models/difficulty';
import type { RandomSource } from '../../domain/events/random';

const EVENTS = [...EV, ...ECHO_EVENTS];
const normal = DIFFICULTY.find(d => d.id === 'normal')!;
const fx = computeFx([]);

describe('simulateRun', () => {
  it('同一シード・同一ポリシーなら結果は再現する（決定論）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(12345), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(12345), policy: CAREFUL_POLICY, events: EVENTS });
    expect(a).toEqual(b);
  });

  it('RunResult の形が妥当（cause は既知集合、floorReached は 1..MAX_FLOOR、events>0）', () => {
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(7), policy: CAREFUL_POLICY, events: EVENTS });
    expect(['escape', '体力消耗', '精神崩壊']).toContain(r.cause);
    expect(r.floorReached).toBeGreaterThanOrEqual(1);
    expect(r.floorReached).toBeLessThanOrEqual(5);
    expect(r.events).toBeGreaterThan(0);
    expect(r.survived).toBe(r.cause === 'escape');
  });

  it('careful の生還率は random 以上（同一シード集合・normal）', () => {
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    const rate = (policy: typeof CAREFUL_POLICY) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy, events: EVENTS }).survived).length / seeds.length;
    expect(rate(CAREFUL_POLICY)).toBeGreaterThanOrEqual(rate(RANDOM_POLICY));
  });
});

describe('simulateRun 圧対応', () => {
  it('pressure 未指定（既定0）は現状と同一結果（回帰）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(999), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(999), policy: CAREFUL_POLICY, events: EVENTS, pressure: 0 });
    expect(a).toEqual(b);
  });

  it('高圧ほど careful 生還率が下がる（normal 圧0 >= 圧6、複数シード集計）', () => {
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1);
    const rate = (pressure: number) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure }).survived).length / seeds.length;
    expect(rate(0)).toBeGreaterThanOrEqual(rate(6));
  });
});

describe('simulateRun legacy 対応', () => {
  it('legacy 未指定（既定null）は現状と同一結果（回帰）', () => {
    const a = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(321), policy: CAREFUL_POLICY, events: EVENTS });
    const b = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(321), policy: CAREFUL_POLICY, events: EVENTS, legacy: null });
    expect(a).toEqual(b);
  });

  it('legacy 指定で結果が変化する（lg_first の fx が適用される）', () => {
    // lg_first（被ダメ+65%・HP/精神+10・情報+6、drainImmune なし）の適用を機能検証する。
    // Task 8 較正完了: 「ガラスの大砲」設計で圧3では継承なしより生還率が下がる方向を確認。
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1);
    const rate = (legacy: ReturnType<typeof getLegacyById>) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure: 3, legacy }).survived).length / seeds.length;
    // 圧3では lg_first の下振れが効き、継承なしより生還率が低い（ガラスの大砲）
    expect(rate(getLegacyById('lg_first'))).toBeLessThanOrEqual(rate(null));
  });
});

describe('simulateRun fragmentsRead', () => {
  it('echo を必ず読むポリシーでは fragmentsRead に断片IDが入る', () => {
    // depth1 + 断片未収集で echo イベントが出現しうる状態
    const meta = createMetaState({ echoDepth: 6 });
    const lorePolicy: RunPolicy = {
      choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number {
        const idx = event.ch.findIndex((c) => c.o?.some((o) => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
        return idx >= 0 ? idx : CAREFUL_POLICY.choose(event, player, fx, diff, rng);
      },
    };
    // 複数シードを試し、どれかで断片を読めることを確認（echoはレアなため）
    const anyRead = [1, 2, 3, 4, 5, 6, 7, 8].some(s => {
      const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: lorePolicy, events: EVENTS, meta });
      return r.fragmentsRead.length > 0;
    });
    expect(anyRead).toBe(true);
  });

  it('careful ポリシーでは fragmentsRead は空（読み解かない＝MN温存）', () => {
    const meta = createMetaState({ echoDepth: 6 });
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: CAREFUL_POLICY, events: EVENTS, meta });
    expect(r.fragmentsRead).toEqual([]);
  });

  it('読み解いた断片IDはすべて有効な ECHO_FRAGMENTS のID', () => {
    const meta = createMetaState({ echoDepth: 6 });
    const lorePolicy: RunPolicy = {
      choose(event: GameEvent, player: Player, fx: FxState, diff: DifficultyDef, rng: RandomSource): number {
        const idx = event.ch.findIndex((c) => c.o?.some((o) => typeof o.fl === 'string' && o.fl.startsWith('frag:')));
        return idx >= 0 ? idx : CAREFUL_POLICY.choose(event, player, fx, diff, rng);
      },
    };
    const validIds = new Set(ECHO_FRAGMENTS.map(f => f.id));
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(3), policy: lorePolicy, events: EVENTS, meta });
    for (const id of r.fragmentsRead) expect(validIds.has(id)).toBe(true);
  });
});
