import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY } from '../../simulation/run-simulator';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';
import { getLegacyById } from '../../domain/services/legacy-service';
import { SeededRandomSource } from '../../domain/events/random';

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
    // lg_first（被ダメ+40%・HP/精神+10・情報+6・回復×1.25・侵蝕無効）の適用を機能検証する。
    // 生還率の方向（lg_first が上がる/下がる）はバランス設計に依存するため、ここでは焼き付けない。
    // 設計意図「下振れが効く（生還率低下）」の方向検証は Task 8 のバランス契約で
    // lg_first 較正後に固定する。
    // TODO(2026-06-28): Task 8 完了後、not.toEqual → toBeLessThan 等に差し替えること
    const seeds = Array.from({ length: 80 }, (_, i) => i + 1);
    const rate = (legacy: ReturnType<typeof getLegacyById>) =>
      seeds.filter(s => simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS, pressure: 3, legacy }).survived).length / seeds.length;
    // legacy あり/なしで生還率が異なる（fx が効いていることの証跡）
    expect(rate(getLegacyById('lg_first'))).not.toEqual(rate(null));
  });
});
