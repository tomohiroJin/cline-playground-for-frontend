import type { CardDefinition } from './card-definition';
import { axesOfCard, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from './axis-of-card';

/** 検査したいフィールドだけを与えるための最小のカード */
const tower = (spec: Partial<NonNullable<CardDefinition['tower']>>): CardDefinition => ({
  id: 'test-tower',
  name: 'テスト塔',
  type: 'tower',
  cost: 1,
  description: 'テスト用',
  tower: {
    hp: 8,
    range: 1,
    damage: 1,
    cooldownTicks: 10,
    splashRadius: 0,
    hitsFlying: false,
    ...spec,
  },
});

const trap = (spec: Partial<NonNullable<CardDefinition['trap']>>): CardDefinition => ({
  id: 'test-trap',
  name: 'テスト罠',
  type: 'trap',
  cost: 1,
  description: 'テスト用',
  trap: { damage: 0, uses: 3, ...spec },
});

const ember = (radius: number): CardDefinition => ({
  id: 'test-ember',
  name: 'テスト燠火',
  type: 'ember',
  cost: 2,
  description: 'テスト用',
  ember: { radius, damage: 8, cooldownTicks: 300 },
});

describe('axesOfCard（カード定義から要求軸を判定する）', () => {
  describe('block は HP の閾値', () => {
    it('閾値ちょうどは block を満たす', () => {
      expect(axesOfCard(tower({ hp: BLOCK_HP_THRESHOLD }))).toContain('block');
    });

    it('閾値の1つ下は block を満たさない（境界）', () => {
      expect(axesOfCard(tower({ hp: BLOCK_HP_THRESHOLD - 1 }))).not.toContain('block');
    });
  });

  describe('anti-air は「値が正か」で判定する（ノックアウトが 0 を使うため）', () => {
    it('hitsFlying の塔は anti-air', () => {
      expect(axesOfCard(tower({ hitsFlying: true }))).toContain('anti-air');
    });

    it('groundedTicks が正の罠は anti-air', () => {
      expect(axesOfCard(trap({ groundedTicks: 120 }))).toContain('anti-air');
    });

    it('groundedTicks が 0 の罠は anti-air を満たさない', () => {
      // フィールドを消すと applyTraps の targetsFlying が反転して罠の対象が
      // 飛行→地上へ化ける（設計書 §8.2.15(a)1）。ノックアウトは 0 を書き込むので、
      // ここが `!== undefined` のままだと軸が落ちない。
      expect(axesOfCard(trap({ groundedTicks: 0 }))).not.toContain('anti-air');
    });

    it('groundedTicks を持たない罠は anti-air を満たさない', () => {
      expect(axesOfCard(trap({ damage: 5 }))).not.toContain('anti-air');
    });
  });

  describe('mass-answer は「値が正か」で判定する', () => {
    it('範囲を持つ塔は mass-answer', () => {
      expect(axesOfCard(tower({ splashRadius: 1 }))).toContain('mass-answer');
    });

    it('貫通する塔は mass-answer', () => {
      expect(axesOfCard(tower({ piercing: true }))).toContain('mass-answer');
    });

    it('半径が正の燠火は mass-answer', () => {
      expect(axesOfCard(ember(2))).toContain('mass-answer');
    });

    it('半径 0 の燠火は mass-answer を満たさない', () => {
      // `card.ember !== undefined` のままだと、radius:0 の変種が軸を持ち続ける
      expect(axesOfCard(ember(0))).not.toContain('mass-answer');
    });
  });

  describe('heavy-hit はダメージの閾値', () => {
    it('閾値ちょうどは heavy-hit を満たす', () => {
      expect(axesOfCard(tower({ damage: HEAVY_HIT_DAMAGE_THRESHOLD }))).toContain('heavy-hit');
    });

    it('閾値の1つ下は heavy-hit を満たさない（境界）', () => {
      expect(axesOfCard(tower({ damage: HEAVY_HIT_DAMAGE_THRESHOLD - 1 }))).not.toContain('heavy-hit');
    });
  });

  it('どの軸も満たさないカードは空配列', () => {
    expect(axesOfCard(tower({}))).toEqual([]);
  });
});
