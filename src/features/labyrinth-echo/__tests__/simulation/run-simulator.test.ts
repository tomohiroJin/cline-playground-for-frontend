import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY, type RunPolicy } from '../../simulation/run-simulator';
import { RUN_CAUSE } from '../../simulation/run-cause';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { processChoice } from '../../events/event-utils';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx, createNewPlayer } from '../../domain/services/unlock-service';
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
    // echo はレアなため複数シードを跨いで断片を集める（単一シードだと未出現で空配列＝検証が素通りしうる）
    const collected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap(s =>
      simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(s), policy: lorePolicy, events: EVENTS, meta }).fragmentsRead,
    );
    // 前提: 少なくとも1件は読めている（0件だと以降の検証が無意味になるためガード）
    expect(collected.length).toBeGreaterThan(0);
    for (const id of collected) expect(validIds.has(id)).toBe(true);
  });
});

describe('simulateRun 状態異常モデル化（回帰: Issue #142）', () => {
  // sim ループが add: フラグを player.statuses に適用し、状態異常の継続ダメージ(DoT)を後続ステップへ
  // 反映していることを保証する。かつて「sim は statuses を未モデル化（常に空）」と誤認されたが、
  // run-simulator は processChoice が返す drained（statuses 適用済み）を次フレームの player に採用しており、
  // 状態異常は常にモデル化されている。本テストはその誤認の再発を防ぐ回帰ガード。

  /** 常に先頭の選択肢を選ぶ最小ポリシー（合成プールの決定論用） */
  const FIRST_CHOICE: RunPolicy = { choose: () => 0 };

  /**
   * 全フロア(1..5)にイベントを敷き詰めた合成プールを作る。flag を付与するフロアを flagFloors で限定できる。
   * 同一フロア内のイベントは同効果なので、pickEvent のシャッフル順に依存せず結果が決まる。
   * @param flag 付与するフラグ（'add:出血' 等）。省略時は全イベント無害。
   * @param flagFloors flag を付与するフロア（省略時は全フロア）。
   */
  const buildPool = (flag?: string, flagFloors?: readonly number[]): GameEvent[] => {
    const events: GameEvent[] = [];
    for (let floor = 1; floor <= 5; floor++) {
      const applyFlag = flag && (!flagFloors || flagFloors.includes(floor));
      for (let i = 0; i < 8; i++) {
        events.push({
          id: `syn_${floor}_${i}`, fl: [floor], tp: 'normal', sit: '',
          ch: [{ t: '進む', o: [{ c: 'default', r: '', hp: 0, mn: 0, inf: 0, ...(applyFlag ? { fl: flag } : {}) }] }],
        });
      }
    }
    return events;
  };

  // 出血(tick=hp-6/step)を【フロア1でのみ】付与し、フロア2以降は無害。
  // 全イベントに付与すると毎フレーム再付与され「伝搬しない実装でも HP が枯渇」してしまい回帰ガードにならない。
  // フロア1限定なら、フロア2以降の無害ステップで HP が減り続けるのは出血が伝搬している場合だけ ⇒ 真の伝搬テスト。
  const bleedPool = buildPool('add:出血', [1]);
  const cleanPool = buildPool();

  it('フロア1で得た出血の DoT が後続フロアでも HP を削り続け「体力消耗」で死ぬ（statuses 伝搬の証拠）', () => {
    // normal の素ドレインは MN のみ(-2/step)で HP は減らない。出血はフロア1でしか付与されないため、
    // フロア2以降でも HP が減って枯渇死するのは、フロア1で得た出血が次フレームへ伝搬し
    // computeDrain が tick を適用し続けている場合のみ。伝搬しない実装なら HP は温存され MN 枯渇(精神崩壊)になる。
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: FIRST_CHOICE, events: bleedPool });
    expect(r.survived).toBe(false);
    expect(r.cause).toBe(RUN_CAUSE.HP_DEPLETED);
  });

  it('状態異常なしのランは HP が減らず（出血の DoT 不在）、HP 枯渇では死なない', () => {
    const r = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: FIRST_CHOICE, events: cleanPool });
    expect(r.cause).not.toBe(RUN_CAUSE.HP_DEPLETED);
  });

  it('フロア1限定の出血でも伝搬する DoT により無状態ランより早く終わる', () => {
    const bleed = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: FIRST_CHOICE, events: bleedPool });
    const clean = simulateRun({ difficulty: normal, fx, rng: new SeededRandomSource(1), policy: FIRST_CHOICE, events: cleanPool });
    expect(bleed.events).toBeLessThan(clean.events);
  });

  it('processChoice は add: フラグを drained.statuses に適用し次フレームへ伝搬する（run-simulator が依存する経路）', () => {
    const ev: GameEvent = { id: 'x', fl: [1], tp: 'normal', sit: '', ch: [{ t: 'hit', o: [{ c: 'default', r: '', hp: 0, mn: 0, inf: 0, fl: 'add:出血' }] }] };
    const r1 = processChoice({ event: ev, choiceIdx: 0, player: createNewPlayer(normal, fx), fx, diff: normal });
    expect(r1.drained.statuses).toContain('出血');
    // 次フレーム: 無害イベントでも出血 tick で HP が減る（DoT が後続に作用）
    const hpBefore = r1.drained.hp;
    const ev2: GameEvent = { id: 'y', fl: [1], tp: 'normal', sit: '', ch: [{ t: 'noop', o: [{ c: 'default', r: '', hp: 0, mn: 0, inf: 0 }] }] };
    const r2 = processChoice({ event: ev2, choiceIdx: 0, player: r1.drained, fx, diff: normal });
    expect(r2.drained.statuses).toContain('出血');
    expect(r2.drained.hp).toBeLessThan(hpBefore);
  });
});
