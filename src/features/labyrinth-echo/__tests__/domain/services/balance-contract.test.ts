import { DIFFICULTY } from '../../../domain/constants/difficulty-defs';
import { CFG } from '../../../domain/constants/config';

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
