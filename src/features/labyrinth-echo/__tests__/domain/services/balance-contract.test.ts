import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { CFG } from '../../../domain/constants/config';
import { simulateRun, CAREFUL_POLICY, RANDOM_POLICY } from '../../../simulation/run-simulator';
import type { RunPolicy } from '../../../simulation/run-simulator';
import { EV } from '../../../events/event-data';
import { ECHO_EVENTS } from '../../../events/echo-events';
import { computeFx } from '../../../domain/services/unlock-service';
import { SeededRandomSource } from '../../../domain/events/random';

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

  it('dmgMult は easy < normal <= hard < abyss', () => {
    expect(easy.modifiers.dmgMult).toBeLessThan(normal.modifiers.dmgMult);
    expect(normal.modifiers.dmgMult).toBeLessThanOrEqual(hard.modifiers.dmgMult);
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
