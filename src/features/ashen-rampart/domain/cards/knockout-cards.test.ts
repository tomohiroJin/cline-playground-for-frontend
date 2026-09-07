import type { CardDefinition } from './card-definition';
import { axesOfCard, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from './axis-of-card';
import {
  KNOCKOUT_ID_PREFIX,
  baseIdOf,
  deriveKnockouts,
  knockoutIdOf,
} from './knockout-cards';

const THRESHOLDS = { blockHp: BLOCK_HP_THRESHOLD, heavyHitDamage: HEAVY_HIT_DAMAGE_THRESHOLD };

const wall: CardDefinition = {
  id: 'wall', name: '壁', type: 'tower', cost: 1, description: '',
  tower: { hp: 60, range: 0, damage: 0, cooldownTicks: 0, splashRadius: 0, hitsFlying: false },
};
const cannon: CardDefinition = {
  id: 'cannon', name: '砲', type: 'tower', cost: 3, description: '',
  tower: { hp: 16, range: 1.5, damage: 12, cooldownTicks: 18, splashRadius: 1, hitsFlying: false },
};
const net: CardDefinition = {
  id: 'net', name: '網', type: 'trap', cost: 2, description: '',
  trap: { damage: 0, uses: 3, groundedTicks: 120 },
};
const plainArrow: CardDefinition = {
  id: 'arrow', name: '弓', type: 'tower', cost: 1, description: '',
  tower: { hp: 8, range: 1.6, damage: 4, cooldownTicks: 8, splashRadius: 0, hitsFlying: false },
};
// mass-answer を **貫通だけ** で満たす札（範囲なし・damage 4 なので heavy-hit も付かない）
const pierceOnly: CardDefinition = {
  id: 'pierce', name: '貫', type: 'tower', cost: 4, description: '',
  tower: {
    hp: 14, range: 1.8, damage: 4, cooldownTicks: 12,
    splashRadius: 0, hitsFlying: false, piercing: true,
  },
};
// mass-answer を **燠火だけ** で満たす札（tower を持たないので他の軸は付かない）
const blast: CardDefinition = {
  id: 'blast', name: '燠', type: 'ember', cost: 2, description: '',
  ember: { radius: 2, damage: 8, cooldownTicks: 300 },
};

const variantOf = (cards: readonly CardDefinition[], axis: Parameters<typeof knockoutIdOf>[0], baseId: string) =>
  deriveKnockouts(cards, THRESHOLDS).find((c) => c.id === knockoutIdOf(axis, baseId));

describe('ID の規約', () => {
  it('変種の ID は接頭辞 + 軸 + 基礎IDでできている', () => {
    expect(knockoutIdOf('block', 'wall')).toBe(`${KNOCKOUT_ID_PREFIX}block/wall`);
  });

  it('baseIdOf は接頭辞を剥がして基礎IDへ戻す', () => {
    expect(baseIdOf(knockoutIdOf('heavy-hit', 'cannon'))).toBe('cannon');
  });

  it('baseIdOf は基礎IDをそのまま返す', () => {
    expect(baseIdOf('cannon')).toBe('cannon');
  });
});

describe('変種を作る対象は axesOfCard と一致する', () => {
  it('軸を持たない札には変種を作らない', () => {
    // 弓兵は4軸のどれも持たない（HP8・damage4・単体・地上のみ）
    expect(axesOfCard(plainArrow)).toEqual([]);
    expect(deriveKnockouts([plainArrow], THRESHOLDS)).toEqual([]);
  });

  it('軸を持つ札には、その軸ぶんだけ変種を作る', () => {
    expect(axesOfCard(cannon)).toEqual(['mass-answer', 'heavy-hit']);
    expect(deriveKnockouts([cannon], THRESHOLDS).map((c) => c.id)).toEqual([
      knockoutIdOf('mass-answer', 'cannon'),
      knockoutIdOf('heavy-hit', 'cannon'),
    ]);
  });
});

describe('落とした軸だけを失い、他の軸は保つ', () => {
  it.each([
    ['wall', wall],
    ['cannon', cannon],
    ['net', net],
    ['pierce', pierceOnly],
    ['blast', blast],
  ] as const)('%s のすべての変種', (baseId, card) => {
    const before = axesOfCard(card);
    deriveKnockouts([card], THRESHOLDS).forEach((variant) => {
      const axis = before.find((a) => variant.id === knockoutIdOf(a, baseId));
      expect(axis).toBeDefined();
      const after = axesOfCard(variant);
      expect(after).not.toContain(axis);
      expect([...after].sort()).toEqual(before.filter((a) => a !== axis).slice().sort());
    });
  });
});

describe('block は最小介入（閾値の1つ下）にする', () => {
  it('HP を閾値 - 1 にする。最小値 8 まで落とさない', () => {
    const v = variantOf([wall], 'block', 'wall');
    expect(v?.tower?.hp).toBe(BLOCK_HP_THRESHOLD - 1);
  });

  it('コスト・攻撃力・射程は変えない', () => {
    const v = variantOf([wall], 'block', 'wall');
    expect(v?.cost).toBe(wall.cost);
    expect(v?.tower?.damage).toBe(0);
    expect(v?.tower?.range).toBe(0);
  });
});

describe('anti-air は極性を保つ（フィールドを消さない）', () => {
  it('落網の groundedTicks は削除せず 0 にする', () => {
    const v = variantOf([net], 'anti-air', 'net');
    // undefined にすると applyTraps の targetsFlying が反転し、
    // 罠の対象が飛行から地上へ化ける（設計書 §8.2.15(a)1）
    expect(v?.trap?.groundedTicks).toBe(0);
  });

  it('罠の使用回数とダメージは変えない', () => {
    const v = variantOf([net], 'anti-air', 'net');
    expect(v?.trap?.uses).toBe(3);
    expect(v?.trap?.damage).toBe(0);
  });
});

describe('mass-answer は範囲・貫通・燠火の半径を消す（3経路すべてを検査する）', () => {
  it('splashRadius を 0 にし、1体あたりのダメージは保つ', () => {
    const v = variantOf([cannon], 'mass-answer', 'cannon');
    expect(v?.tower?.splashRadius).toBe(0);
    expect(v?.tower?.damage).toBe(12);
  });

  it('piercing を false にし、1体あたりのダメージは保つ', () => {
    const v = variantOf([pierceOnly], 'mass-answer', 'pierce');
    expect(v?.tower?.piercing).toBe(false);
    expect(v?.tower?.damage).toBe(4);
    expect(v?.tower?.range).toBe(1.8);
  });

  it('燠火は半径だけを 0 にし、ダメージと再点火間隔は保つ', () => {
    const v = variantOf([blast], 'mass-answer', 'blast');
    expect(v?.ember?.radius).toBe(0);
    expect(v?.ember?.damage).toBe(8);
    expect(v?.ember?.cooldownTicks).toBe(300);
  });
});

describe('heavy-hit は DPS を保って分割する', () => {
  it('damage と cooldownTicks を同じ整数比で割る', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    expect(v?.tower?.damage).toBe(6);
    expect(v?.tower?.cooldownTicks).toBe(9);
  });

  it('素の DPS が厳密に一致する（整数比で検算する）', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    const before = cannon.tower;
    const after = v?.tower;
    expect(after).toBeDefined();
    if (!before || !after) return;
    // 12/18 === 6/9 を浮動小数で比べない
    expect(before.damage * after.cooldownTicks).toBe(after.damage * before.cooldownTicks);
  });

  it('範囲は保つ（mass-answer を巻き込まない）', () => {
    const v = variantOf([cannon], 'heavy-hit', 'cannon');
    expect(v?.tower?.splashRadius).toBe(1);
  });

  it('割り切れない札は静かに歪めず例外にする', () => {
    const odd: CardDefinition = {
      id: 'odd', name: '奇', type: 'tower', cost: 3, description: '',
      tower: { hp: 10, range: 1, damage: 13, cooldownTicks: 12, splashRadius: 0, hitsFlying: false },
    };
    // damage 13 と cooldown 12 の公約数は 1 しかないので、DPS を保った分割ができない
    expect(() => deriveKnockouts([odd], THRESHOLDS)).toThrow(/heavy-hit/);
  });
});

describe('変種は入手経路を持たない', () => {
  it('すべての変種が retired である', () => {
    deriveKnockouts([wall, cannon, net], THRESHOLDS).forEach((v) => {
      expect(v.availability).toBe('retired');
    });
  });
});
