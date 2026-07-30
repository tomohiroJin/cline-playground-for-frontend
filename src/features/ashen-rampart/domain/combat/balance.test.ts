/**
 * バランスの回帰テスト
 *
 * 前作は支配戦略の検算をせずに実装し、3回の実プレイを費やして初めて
 * 欠陥を知った。同じことを繰り返さないため、CI で常時検証する。
 */
import { startRun } from '../../application/use-cases/start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyHp, type WaveDefinition } from './waves';
import { createCombatState, LIFE_INITIAL } from './combat-state';
import { createDeck } from '../cards/deck';
import { validateDeck } from '../cards/deck-builder';
import { CARD_IDS, MAX_COPIES, DECK_SIZE, getCardDefinition } from '../cards/card-pool';
import { simulateRun, greedyStrategy } from './run-simulation';

const SEEDS = [1, 2, 3, 4, 5];

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * カードが対空の答えを持つか（スペックから判定。IDのハードコードは将来カードが
 * 増えたときに漏れるため避ける）
 *
 * 塔が飛行に当たる（hitsFlying）か、罠が飛行を地上化する（groundedTicks）かの
 * どちらかを対空の答えとみなす。
 */
const hasAntiAir = (id: string): boolean => {
  const card = getCardDefinition(id);
  return card.tower?.hitsFlying === true || card.trap?.groundedTicks !== undefined;
};

/**
 * カードが範囲攻撃を持つか（スペックから判定）
 *
 * 塔の splashRadius と燠火の radius のどちらも「同時に複数体を巻き込む」効果のため、
 * 片方だけを見ると業火のような ember 型の範囲攻撃を見落とす（Task 9 レビューで発覚）。
 */
const hasAreaDamage = (id: string): boolean => {
  const card = getCardDefinition(id);
  return (card.tower?.splashRadius ?? 0) > 0 || (card.ember?.radius ?? 0) > 0;
};

/**
 * 魔力炉3枚 + 指定した条件を満たさないカードで残り17枚を埋めた合法20枚デッキを作る
 *
 * 同名上限（MAX_COPIES）を守りながら、対象外カードを順番に巡回して埋める。
 * 除外基準はスペックから判定する述語で渡すため、将来カードを追加しても
 * 「対空/範囲を持つのに除外し忘れる」ことがない。
 */
const buildLegalDeckExcluding = (isExcluded: (id: string) => boolean): string[] => {
  const eligible = CARD_IDS.filter((id) => id !== 'reactor' && !isExcluded(id));
  const cards = repeat('reactor', 3);
  let cursor = 0;
  while (cards.length < DECK_SIZE) {
    const candidate = eligible[cursor % eligible.length] as string;
    if (cards.filter((c) => c === candidate).length < MAX_COPIES) {
      cards.push(candidate);
    }
    cursor++;
  }
  return cards;
};

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
    const cards = buildLegalDeckExcluding(hasAntiAir);
    expect(validateDeck(cards).errors).toEqual([]);
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
    // 前提: マナ枯渇で自明に負けたのではないこと
    expect(result.cardsPlayed).toBeGreaterThan(5);
  });

  it('範囲攻撃を入れないデッキでは勝てない', () => {
    const cards = buildLegalDeckExcluding(hasAreaDamage);
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

/**
 * 「対空を無視すると必ず負ける」を、鴉以外の要因を排除して直接検証する
 *
 * PLAINS_WAVES（4ウェーブ）を使った上のテストは、雑兵・俊足・重装の漏れも
 * 同時に起こりうるため、「鴉の漏れそのものが敗因か」は間接的にしか示せない
 * （Task 9 レビュー指摘）。鴉だけの単一ウェーブに対して対空なしデッキを走らせ、
 * 他の敵の影響を排除した上で敗北することを確認する。
 */
describe('鴉の直接検証（対空要求が拘束していることの証明）', () => {
  it('対空を持たないデッキは、鴉だけの波にも必ず負ける', () => {
    const cards = buildLegalDeckExcluding(hasAntiAir);
    expect(validateDeck(cards).errors).toEqual([]);
    const deck = createDeck(cards, () => 0.5);
    // LIFE_INITIAL を上回る数を漏らせば、対空が無い限り出血だけで確実に敗北する
    const ravenOnlyWaves: readonly WaveDefinition[] = [
      {
        startTick: 0,
        entries: [
          {
            enemyId: 'raven',
            count: LIFE_INITIAL + 1,
            spawnIntervalTicks: 10,
            spawnPathIndex: 5,
          },
        ],
      },
    ];
    const result = simulateRun(
      createCombatState(deck, ravenOnlyWaves),
      greedyStrategy,
      PLAINS_MAP
    );
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
  // 728 は Task 9（14種対応）の再較正値。COUNTDOWN_TICKS(90) 追加後、
  // 「素直な戦略でも全敗ではない」が全滅（survived=0）だったため、雑兵・俊足の早期ウェーブを
  // 段階的に削減（8→7→6→5→3 等）し、LIFE_INITIAL を 10→12 に上げて再較正した。
  //
  // その後のレビューで2つの是正を行った（いずれも「テストは緑だが不変条件を保証していない」
  // という指摘）:
  // - 鴉を 10→13（LIFE_INITIAL(12) を上回る数）に増やし、「対空を無視すると必ず負ける」を
  //   数学的に保証した。10のままでは全数漏らしても life=2残り、負けを強制できていなかった。
  // - 群れを 8→22・spawnIntervalTicks 3→1（密な同時侵入）に強化した。旧8体では
  //   範囲攻撃を一切持たない合法デッキ（単体攻撃のみ）でも life9残しで楽勝できており、
  //   「範囲要求」が実質何も拘束していなかった。
  // これに伴い brute を 2→1、ウェーブ4の雑兵を 5→3 に減らして帳尻を合わせた
  // （鴉・群れは難度較正の対象から除外し、他の敵で総難度を調整する方針）。
  // 「本当に鴉の漏れが敗因か」は上の「鴉の直接検証」で、「範囲攻撃なしで本当に負けるか」は
  // 「範囲攻撃を入れないデッキでは勝てない」で別途確認済み。
  it('敵の総HPが 728 から変わっていない', () => {
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(728);
  });
});
