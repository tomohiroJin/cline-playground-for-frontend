import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { CFG } from '../../../domain/constants/config';
import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY } from '../../../simulation/run-simulator';
import type { RunPolicy } from '../../../simulation/run-simulator';
import { EV } from '../../../events/event-data';
import { ECHO_EVENTS } from '../../../events/echo-events';
import { REVENANT_EVENTS } from '../../../events/revenant-events';
import { computeFx } from '../../../domain/services/unlock-service';
import { SeededRandomSource } from '../../../domain/events/random';
import { createMetaState } from '../../../domain/models/meta-state';
import { ECHO_FRAGMENTS } from '../../../domain/constants/echo-fragment-defs';

const d = (id: string) => DIFFICULTY.find(x => x.id === id)!;

describe('難易度テーブル 静的不変量', () => {
  const easy = d('easy'), normal = d('normal'), hard = d('hard'), abyss = d('abyss');

  it('hpMod は easy > normal >= 0 > hard > abyss', () => {
    expect(easy.modifiers.hpMod).toBeGreaterThan(normal.modifiers.hpMod);
    expect(normal.modifiers.hpMod).toBeGreaterThanOrEqual(0);
    expect(0).toBeGreaterThan(hard.modifiers.hpMod);
    expect(hard.modifiers.hpMod).toBeGreaterThan(abyss.modifiers.hpMod);
  });

  it('drainMod は easy > normal > hard > abyss（小さいほど厳しい）', () => {
    expect(easy.modifiers.drainMod).toBeGreaterThan(normal.modifiers.drainMod);
    expect(normal.modifiers.drainMod).toBeGreaterThan(hard.modifiers.drainMod);
    expect(hard.modifiers.drainMod).toBeGreaterThan(abyss.modifiers.drainMod);
  });

  it('dmgMult は easy < normal < hard < abyss（骨抜き防止：strict）', () => {
    expect(easy.modifiers.dmgMult).toBeLessThan(normal.modifiers.dmgMult);
    expect(normal.modifiers.dmgMult).toBeLessThan(hard.modifiers.dmgMult);
    expect(hard.modifiers.dmgMult).toBeLessThan(abyss.modifiers.dmgMult);
  });

  it('kpOnWin は難度に比例して増加', () => {
    expect(easy.rewards.kpOnWin).toBeLessThan(normal.rewards.kpOnWin);
    expect(normal.rewards.kpOnWin).toBeLessThan(hard.rewards.kpOnWin);
    expect(hard.rewards.kpOnWin).toBeLessThan(abyss.rewards.kpOnWin);
  });

  it('全難易度で初期 HP/MN が正（破綻防止）', () => {
    for (const diff of DIFFICULTY) {
      expect(CFG.BASE_HP + diff.modifiers.hpMod).toBeGreaterThan(0);
      expect(CFG.BASE_MN + diff.modifiers.mnMod).toBeGreaterThan(0);
    }
  });
});

const EVENTS = [...EV, ...ECHO_EVENTS];
const BASE_FX = computeFx([]);
const N = 200;
const SEEDS = Array.from({ length: N }, (_, i) => i + 1);

/** 指定難易度・ポリシーの生還率（0..1）を決定論的に算出 */
const survivalRate = (diffId: string, policy: RunPolicy): number => {
  const difficulty = DIFFICULTY.find(x => x.id === diffId)!;
  const survived = SEEDS.filter(s =>
    simulateRun({ difficulty, fx: BASE_FX, rng: new SeededRandomSource(s), policy, events: EVENTS }).survived,
  ).length;
  return survived / N;
};

/** 亡霊込みテスト用: 全断片発見済み + 最大echoDepth */
const ALL_DISCOVERED = createMetaState({
  echoDepth: 6,
  fragments: ECHO_FRAGMENTS.map(f => f.id),
});

/** Phase 3 全イベントプール（基本＋残響＋亡霊） */
const EVENTS_P3 = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];

/** 指定難易度・残響圧・メタ状態での careful 生還率（0..1）を決定論的に算出 */
const survivalAtPressure = (diffId: string, pressure: number, meta = undefined as ReturnType<typeof createMetaState> | undefined): number => {
  const difficulty = DIFFICULTY.find(x => x.id === diffId)!;
  const survived = SEEDS.filter(s =>
    simulateRun({ difficulty, fx: BASE_FX, rng: new SeededRandomSource(s), policy: CAREFUL_POLICY, events: EVENTS_P3, pressure, meta }).survived,
  ).length;
  return survived / N;
};

describe('バランス契約 決定論シミュレーション', () => {
  // 値はキャッシュ（各 describe 内で再計算を避ける）
  const carefulEasy = survivalRate('easy', CAREFUL_POLICY);
  const carefulNormal = survivalRate('normal', CAREFUL_POLICY);
  const carefulHard = survivalRate('hard', CAREFUL_POLICY);
  const carefulAbyss = survivalRate('abyss', CAREFUL_POLICY);

  it('careful 生還率は単調減少 easy > normal > hard > abyss（主軸）', () => {
    expect(carefulEasy).toBeGreaterThan(carefulNormal);
    expect(carefulNormal).toBeGreaterThan(carefulHard);
    expect(carefulHard).toBeGreaterThan(carefulAbyss);
  });

  it('random 生還率も単調減少 easy > normal > hard >= abyss', () => {
    const re = survivalRate('easy', RANDOM_POLICY);
    const rn = survivalRate('normal', RANDOM_POLICY);
    const rh = survivalRate('hard', RANDOM_POLICY);
    const ra = survivalRate('abyss', RANDOM_POLICY);
    expect(re).toBeGreaterThan(rn);
    expect(rn).toBeGreaterThan(rh);
    // random ポリシーでは hard/abyss は最下層で≈0に収束するため >= が正しい
    expect(rh).toBeGreaterThanOrEqual(ra);
  });

  it('同一難易度では careful >= random（normal で確認）', () => {
    expect(carefulNormal).toBeGreaterThanOrEqual(survivalRate('normal', RANDOM_POLICY));
  });

  it('生還率バンド: easy 高 / normal 中 / abyss 低', () => {
    expect(carefulEasy).toBeGreaterThanOrEqual(0.65);
    expect(carefulNormal).toBeGreaterThanOrEqual(0.45);
    expect(carefulNormal).toBeLessThanOrEqual(0.85);
    expect(carefulAbyss).toBeLessThanOrEqual(0.35);
  });
});

describe('バランス契約 残響圧', () => {
  it('圧0 は Phase 2 と同等の生還率（回帰: normal が依然 0.45–0.85）', () => {
    const s = survivalAtPressure('normal', 0);
    expect(s).toBeGreaterThanOrEqual(0.45);
    expect(s).toBeLessThanOrEqual(0.85);
  });

  it('圧が上がるほど careful 生還率が単調減少（normal: 0 >= 3 >= 6）', () => {
    const p0 = survivalAtPressure('normal', 0);
    const p3 = survivalAtPressure('normal', 3);
    const p6 = survivalAtPressure('normal', 6);
    expect(p0).toBeGreaterThanOrEqual(p3);
    expect(p3).toBeGreaterThanOrEqual(p6);
  });

  it('高圧 normal はバンド上限が下がる（圧6 careful <= 0.55）', () => {
    expect(survivalAtPressure('normal', 6)).toBeLessThanOrEqual(0.55);
  });

  it('亡霊込み（全先人発見済み）でも単調性が保たれる（normal: 0 >= 6）', () => {
    expect(survivalAtPressure('normal', 0, ALL_DISCOVERED)).toBeGreaterThanOrEqual(survivalAtPressure('normal', 6, ALL_DISCOVERED));
  });
});
