/**
 * バランスの回帰テスト
 *
 * 前作は支配戦略の検算をせずに実装し、3回の実プレイを費やして初めて
 * 欠陥を知った。同じことを繰り返さないため、CI で常時検証する。
 */
import { startRun } from '../../application/use-cases/start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyHp } from './waves';
import { createCombatState } from './combat-state';
import { createDeck } from '../cards/deck';
import { simulateRun, greedyStrategy } from './run-simulation';

const SEEDS = [1, 2, 3, 4, 5];

describe('支配戦略が存在しないこと', () => {
  // 弓兵20枚・業火20枚は初期マナ2・コスト2に対し魔力炉が0枚のため、1基置いた時点で
  // マナが永久に0になり「2枚目以降が一生出せない」まま自明に負ける。これでは
  // 「飛行に触れない」という本来の敗因を検証したことにならない（指摘2）。
  // 魔力炉を混ぜてマナ枯渇を排除し、それでも負けることを確認する。
  it('弓兵に偏ったデッキ（魔力炉3＋弓兵17）では勝てない（飛行に触れないため）', () => {
    const cards = [...Array(3).fill('reactor'), ...Array(17).fill('arrow-tower')];
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });

  it('魔力炉だけのデッキでは勝てない（火力が無いため）', () => {
    const deck = createDeck(Array.from({ length: 20 }, () => 'reactor'), () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });

  it('業火に偏ったデッキ（魔力炉3＋業火17）では勝てない（飛行に触れないため）', () => {
    const cards = [...Array(3).fill('reactor'), ...Array(17).fill('ember-blast')];
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });
});

describe('難度の較正', () => {
  it('素直な戦略では過半数のランで勝てない（配分の余地が残っている）', () => {
    const wins = SEEDS.filter(
      (seed) =>
        simulateRun(startRun('swift', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .outcome === 'won'
    ).length;
    expect(wins).toBeLessThanOrEqual(2);
  });

  it('素直な戦略でも全敗ではない（理不尽ではない）', () => {
    const survived = SEEDS.filter(
      (seed) =>
        simulateRun(startRun('swift', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .lifeLeft > 0 ||
        simulateRun(startRun('heavy', new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
          .lifeLeft > 0
    ).length;
    expect(survived).toBeGreaterThan(0);
  });

  it('プリセット2種の勝敗が極端に偏らない', () => {
    const winsOf = (preset: string) =>
      SEEDS.filter(
        (seed) =>
          simulateRun(startRun(preset, new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
            .outcome === 'won'
      ).length;
    expect(Math.abs(winsOf('swift') - winsOf('heavy'))).toBeLessThanOrEqual(3);
  });
});

describe('較正の基準値', () => {
  // 964 は Task 9 の較正値（1472 から 0.85 倍を3回適用）。その後 deck.ts の
  // コスト0札の手札溢れ詰みを修正した際に再較正したが、偶然にも同じ 964 に
  // 収束した（詰みの解消自体は勝敗にほぼ影響せず、山札内の魔力炉の位置という
  // 引き運が支配的だったため）。数値が同じでも再較正済みであることの記録として、
  // このコメント自体を較正のたびに更新すること。
  it('敵の総HPが 964 から変わっていない', () => {
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(964);
  });
});
