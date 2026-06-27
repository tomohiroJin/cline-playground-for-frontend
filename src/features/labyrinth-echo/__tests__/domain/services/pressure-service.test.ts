import {
  PRESSURE_MAX, escalationFromPressure, applyPressureToDifficulty, maxSelectablePressure,
} from '../../../domain/services/pressure-service';
import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';

const normal = DIFFICULTY.find(d => d.id === 'normal')!;

describe('pressure-service', () => {
  it('PRESSURE_MAX は 6', () => {
    expect(PRESSURE_MAX).toBe(6);
  });

  it('圧0は escalation 全項目0', () => {
    expect(escalationFromPressure(0)).toEqual({ hpMod: 0, mnMod: 0, drainMod: 0, dmgMult: 0 });
  });

  it('圧6の escalation は設計値', () => {
    expect(escalationFromPressure(6)).toEqual({ hpMod: -6, mnMod: -6, drainMod: -3, dmgMult: 0.48 });
  });

  it('escalation は圧で単調に厳しくなる', () => {
    for (let p = 1; p <= PRESSURE_MAX; p++) {
      const cur = escalationFromPressure(p);
      const prev = escalationFromPressure(p - 1);
      expect(cur.hpMod).toBeLessThanOrEqual(prev.hpMod);
      expect(cur.drainMod).toBeLessThanOrEqual(prev.drainMod);
      expect(cur.dmgMult).toBeGreaterThanOrEqual(prev.dmgMult);
    }
  });

  it('applyPressureToDifficulty(圧0) は diff を不変返し（回帰ガード）', () => {
    expect(applyPressureToDifficulty(normal, 0)).toEqual(normal);
  });

  it('applyPressureToDifficulty は modifiers のみ変え id/rewards は基底のまま', () => {
    const eff = applyPressureToDifficulty(normal, 6);
    expect(eff.id).toBe('normal');
    expect(eff.rewards).toEqual(normal.rewards);
    expect(eff.modifiers.dmgMult).toBeCloseTo(normal.modifiers.dmgMult + 0.48, 5);
    expect(eff.modifiers.drainMod).toBe(normal.modifiers.drainMod - 3);
    expect(eff.modifiers.hpMod).toBe(normal.modifiers.hpMod - 6);
  });

  it('maxSelectablePressure は echoDepth を 0..PRESSURE_MAX にクランプ', () => {
    expect(maxSelectablePressure(0)).toBe(0);
    expect(maxSelectablePressure(3)).toBe(3);
    expect(maxSelectablePressure(99)).toBe(6);
    expect(maxSelectablePressure(-1)).toBe(0);
  });
});
