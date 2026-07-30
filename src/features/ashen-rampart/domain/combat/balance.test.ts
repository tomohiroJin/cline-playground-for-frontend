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
import { validateDeck } from '../cards/deck-builder';
import { simulateRun, greedyStrategy } from './run-simulation';

const SEEDS = [1, 2, 3, 4, 5];

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * カウンター要求を無視した合法デッキでは勝てないこと
 *
 * 前コンセプトを殺したのは「最効率カードに効かない相手がいない」ことだった。
 * 同名上限3枚・14種という構築規則のもとでは「単一カードへの偏り」自体が
 * 構築不能（20枚には必ず7種以上が入る）なため、意味のある問いは
 * 「合法デッキで、ある要求（対空/範囲/マナ源）を無視したら負けるか」である。
 *
 * 各デッキは validateDeck を通ることをテスト内で確認する（実在しないデッキを
 * 検査しないため）。cardsPlayed の下限アサートで「札は出せていた」ことを保証する。
 */
describe('支配戦略が存在しないこと', () => {
  it('対空の答えを一枚も入れないデッキでは勝てない', () => {
    // 弩砲・徹甲弩・落網（対空の3枚）を除いた合法20枚
    const cards = [
      ...repeat('reactor', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('catapult', 3),
      ...repeat('beacon', 2),
      ...repeat('forge', 2),
      ...repeat('spike-trap', 2),
      ...repeat('ember-blast', 2),
    ];
    expect(validateDeck(cards).errors).toEqual([]);
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });

  it('範囲攻撃を入れないデッキでは勝てない', () => {
    // 火砲台・投石機（範囲攻撃の2枚）を除いた合法20枚
    const cards = [
      ...repeat('reactor', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 3),
      ...repeat('piercer', 3),
      ...repeat('beacon', 2),
      ...repeat('forge', 2),
      ...repeat('spike-trap', 2),
      ...repeat('ember-blast', 2),
    ];
    expect(validateDeck(cards).errors).toEqual([]);
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });

  it('魔力炉を入れないデッキでは勝てない（マナ源なしでは何も出せない）', () => {
    const cards = [
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('catapult', 3),
      ...repeat('piercer', 3),
      ...repeat('beacon', 2),
      ...repeat('forge', 1),
      ...repeat('spike-trap', 1),
      ...repeat('levy', 1),
    ];
    expect(validateDeck(cards).errors).toEqual([]);
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
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
  // 668 は Task 9（14種対応）の再較正値。COUNTDOWN_TICKS(90) 追加後、
  // 「素直な戦略でも全敗ではない」が全滅（survived=0）だったため、雑兵・俊足・群れの
  // 早期ウェーブを段階的に削減（8→7→6→5→3 等）し、LIFE_INITIAL を 10→12 に上げて再較正した。
  // 鴉は 3→10（「対空を無視すると必ず負ける」を成立させるため）に増やしており、
  // これは難度較正の対象から除外している（brute/grunt/runner/swarm のみ調整）。
  it('敵の総HPが 668 から変わっていない', () => {
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(668);
  });
});
