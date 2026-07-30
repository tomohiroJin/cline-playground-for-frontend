/**
 * バランスの回帰テスト
 *
 * 前作は支配戦略の検算をせずに実装し、3回の実プレイを費やして初めて
 * 欠陥を知った。同じことを繰り返さないため、CI で常時検証する。
 *
 * このファイルの鉄則: **テスト名で主張することだけを検証し、検証できないことは主張しない。**
 * 実際に「範囲攻撃なしのデッキは負ける」というテスト名が、0ダメージのオーラ札で
 * 埋めたデッキの敗北を根拠にしていた（レビュー是正）。以後、勝敗が確定しない要求に
 * ついては「勝率が落ちる」を複数シードで測る形にしてある。
 */
import { startRun } from '../../application/use-cases/start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyHp, type WaveDefinition } from './waves';
import { createCombatState, LIFE_INITIAL } from './combat-state';
import { createDeck } from '../cards/deck';
import { validateDeck } from '../cards/deck-builder';
import { CARD_IDS, MAX_COPIES, DECK_SIZE, getCardDefinition } from '../cards/card-pool';
import { simulateRun, greedyStrategy, type RunSimulationResult } from './run-simulation';

/** 勝率を測るためのシード群。1ラン ≒ 数ミリ秒なので20シードでも十分速い */
const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/** 指定デッキを全シードで回す。乱数はシードごとに新しく作るので互いに独立 */
const runAllSeeds = (cards: readonly string[]): RunSimulationResult[] =>
  SEEDS.map((seed) => {
    const random = new SeededRandom(seed);
    const deck = createDeck(cards, () => random.random());
    return simulateRun(createCombatState(deck, PLAINS_WAVES), greedyStrategy, PLAINS_MAP);
  });

/** 勝利数（20シード中）。lifeLeft や outcome==='playing' は勝利に数えない */
const winsOf = (cards: readonly string[]): number =>
  runAllSeeds(cards).filter((r) => r.outcome === 'won').length;

/** プリセットの勝利数（20シード中）。startRun 経由でプリセット定義そのものを検証する */
const presetWinsOf = (presetId: string): number =>
  SEEDS.filter(
    (seed) =>
      simulateRun(startRun(presetId, new SeededRandom(seed)), greedyStrategy, PLAINS_MAP)
        .outcome === 'won'
  ).length;

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
 * カードが自力でダメージを出すか（スペックから判定）
 *
 * 篝火・鍛冶場・落網・石壁・時泥・徴発・魔力炉はこれを満たさない。
 */
const hasDamage = (id: string): boolean => {
  const card = getCardDefinition(id);
  return (
    (card.tower?.damage ?? 0) > 0 || (card.trap?.damage ?? 0) > 0 || (card.ember?.damage ?? 0) > 0
  );
};

/**
 * 魔力炉3枚 + 指定した条件を満たさないカードで残り17枚を埋めた合法20枚デッキを作る
 *
 * **攻撃札を先に上限まで積む**のが要点。以前は CARD_IDS の並び順で巡回していたため、
 * 篝火2＋鍛冶場2（常に0ダメージのオーラ札）が混ざり、「除外したから負けた」のか
 * 「埋め札が弱いから負けた」のかを区別できなかった（レビュー是正）。
 * 除外条件を満たさない範囲で合法かつ最も攻撃的なデッキを作ることで、
 * 「その要求を無視すると何が起きるか」だけを見られるようにしている。
 *
 * 攻撃札だけでは20枚に届かない場合（対空除外時は攻撃札が5種=15枚しかない）に限り、
 * 残りを非攻撃札で埋める。埋め札の枚数は attackCardCountOf で検査できる。
 */
const buildLegalDeckExcluding = (isExcluded: (id: string) => boolean): string[] => {
  const eligible = CARD_IDS.filter((id) => id !== 'reactor' && !isExcluded(id));
  const ordered = [...eligible.filter(hasDamage), ...eligible.filter((id) => !hasDamage(id))];
  const cards = repeat('reactor', 3);
  ordered.forEach((id) => {
    while (cards.length < DECK_SIZE && cards.filter((c) => c === id).length < MAX_COPIES) {
      cards.push(id);
    }
  });
  if (cards.length !== DECK_SIZE) {
    throw new Error(`除外条件が厳しすぎて${DECK_SIZE}枚を作れません（${cards.length}枚）`);
  }
  return cards;
};

/** デッキに含まれる攻撃札の枚数 */
const attackCardCountOf = (cards: readonly string[]): number => cards.filter(hasDamage).length;

/** 対空3種・範囲3種・マナ源をすべて含む20枚（同名3枚以内）。比較の基準になる良デッキ */
const FULL_ANSWER_DECK: readonly string[] = [
  ...repeat('reactor', 3),
  ...repeat('ballista', 3),
  ...repeat('piercer', 3),
  ...repeat('cannon-tower', 3),
  ...repeat('catapult', 2),
  ...repeat('ember-blast', 2),
  ...repeat('snare-net', 2),
  ...repeat('levy', 2),
];

/**
 * 埋め札が結論を作っていないこと
 *
 * このファイルの結論は buildLegalDeckExcluding が作るデッキの強さに全面的に依存する。
 * 埋め札に0ダメージ札を並べれば、どんな除外条件でも「負ける」が出てしまう。
 * 生成器そのものを先に検査しておく。
 */
describe('反例デッキの生成器', () => {
  it('範囲攻撃を除外したデッキは、攻撃札を上限まで積んでいる', () => {
    const cards = buildLegalDeckExcluding(hasAreaDamage);
    expect(validateDeck(cards).errors).toEqual([]);
    // 範囲なしで残る攻撃札は 弓兵・弩砲・棘罠・徹甲弩 の4種（各3枚=12枚）
    expect(attackCardCountOf(cards)).toBe(12);
    expect(cards.some(hasAreaDamage)).toBe(false);
  });

  it('対空を除外したデッキは、攻撃札を上限まで積んでいる', () => {
    const cards = buildLegalDeckExcluding(hasAntiAir);
    expect(validateDeck(cards).errors).toEqual([]);
    // 対空なしで残る攻撃札は 弓兵・火砲台・棘罠・業火・投石機 の5種（各3枚=15枚）
    expect(attackCardCountOf(cards)).toBe(15);
    expect(cards.some(hasAntiAir)).toBe(false);
  });
});

/**
 * カウンター要求を無視した合法デッキが不利になること
 *
 * 前コンセプトを殺したのは「最効率カードに効かない相手がいない」ことだった。
 * 同名上限3枚・14種という構築規則のもとでは「単一カードへの偏り」自体が
 * 構築不能（20枚には必ず7種以上が入る）なため、意味のある問いは
 * 「合法デッキで、ある要求（対空/範囲/マナ源）を無視したらどれだけ不利になるか」である。
 *
 * 要求ごとに拘束の強さが違うので、主張も分けてある:
 * - 対空・マナ源 … 全シードで敗北（「必ず負ける」を主張できる）
 * - 範囲 …… 勝率が著しく落ちる（「必ず負ける」は成立しないので主張しない）
 */
describe('支配戦略が存在しないこと', () => {
  it('対空の答えを一枚も入れないデッキは、全シードで負ける', () => {
    const cards = buildLegalDeckExcluding(hasAntiAir);
    const results = runAllSeeds(cards);
    expect(results.filter((r) => r.outcome === 'won')).toHaveLength(0);
    expect(results.every((r) => r.outcome === 'lost')).toBe(true);
    // 前提: マナ枯渇で自明に負けたのではないこと。最も出せなかったシードでも
    // 5枚は盤面に出ている（＝札が出せずに負けたのではなく、出した上で押し切られた）
    expect(Math.min(...results.map((r) => r.cardsPlayed))).toBeGreaterThanOrEqual(5);
  });

  it('魔力炉を入れないデッキは、全シードで負ける（マナ源なしでは何も出せない）', () => {
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
    const results = runAllSeeds(cards);
    expect(results.filter((r) => r.outcome === 'won')).toHaveLength(0);
  });
});

/**
 * 範囲攻撃の要求は「必ず負ける」ではなく「勝率が著しく落ちる」
 *
 * 実測（シード1〜20・greedyStrategy）:
 * - 範囲攻撃を持たない合法デッキ（攻撃札を上限まで積んだもの）… 6/20
 * - 全要求を満たしたデッキ ………………………………………………… 14/20
 *
 * 単体塔だけでも群れ22体を捌き切れるシードが実在するため、「範囲攻撃なしでは負ける」は
 * 偽である。群れをさらに増やせば真にできるが、実プレイ判定の直前に敵側の較正を動かす
 * リスクを避け、数値は据え置いて主張の側を実態に合わせた（設計書 §3.2 の注記も参照）。
 *
 * 下限・上限の両方を絶対値で固定してあるのは、片方だけだと「どちらも弱くなった」
 * 「どちらも強くなった」という較正のズレを検出できないため。
 */
describe('範囲攻撃を無視すると勝率が著しく落ちること', () => {
  it('範囲攻撃を持たない合法デッキの勝率は半数を大きく下回る', () => {
    const wins = winsOf(buildLegalDeckExcluding(hasAreaDamage));
    expect(wins).toBeLessThanOrEqual(8);
  });

  it('全要求を満たしたデッキの勝率は半数を上回る', () => {
    expect(winsOf(FULL_ANSWER_DECK)).toBeGreaterThanOrEqual(12);
  });

  it('範囲攻撃なしのデッキは、全要求を満たしたデッキより明確に勝率が低い', () => {
    const noAreaWins = winsOf(buildLegalDeckExcluding(hasAreaDamage));
    const fullAnswerWins = winsOf(FULL_ANSWER_DECK);
    // 5シード分（25ポイント）以上の差。誤差ではないと言える幅を要求する
    expect(fullAnswerWins - noAreaWins).toBeGreaterThanOrEqual(5);
  });

  it('範囲攻撃なしのデッキも、マナ枯渇ではなく力負けしている', () => {
    const results = runAllSeeds(buildLegalDeckExcluding(hasAreaDamage));
    expect(Math.min(...results.map((r) => r.cardsPlayed))).toBeGreaterThanOrEqual(5);
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
    const result = simulateRun(createCombatState(deck, ravenOnlyWaves), greedyStrategy, PLAINS_MAP);
    expect(result.outcome).toBe('lost');
  });
});

/**
 * 全要求を満たした合法デッキは勝てること（検証の残り半分）
 *
 * ここまでの検証は「要求を無視したデッキは不利になる」だけを見ていた。それだけでは
 * 「どう組んでも勝てない」状態（較正の行き過ぎ）と区別できず、実プレイの判定が
 * 「難しすぎる」という別の理由で濁る。対空・範囲・マナ源のすべてを満たした
 * 合法デッキが十分な勝率を持つことを対の不変条件として固定する。
 *
 * 敵数を削る較正を行うときは、上の「無視したら不利になる」テスト群とこのテストの
 * 両方が同時に成立する範囲を探すこと。片方だけを見て動かすと必ずどちらかが壊れる。
 */
describe('全要求を満たしたデッキは勝てること', () => {
  it('デッキが構築規則を満たし、対空・範囲・マナ源をすべて備えている', () => {
    const cards = [...FULL_ANSWER_DECK];
    expect(cards).toHaveLength(DECK_SIZE);
    expect(validateDeck(cards).errors).toEqual([]);
    // 「全要求を満たしている」ことをスペックから判定する（IDの並びを目視で信じない）
    expect(cards.some(hasAntiAir)).toBe(true);
    expect(cards.some(hasAreaDamage)).toBe(true);
    expect(cards).toContain('reactor');
  });

  it('素直な戦略でも過半数のシードで勝てる', () => {
    expect(winsOf(FULL_ANSWER_DECK)).toBeGreaterThan(SEEDS.length / 2);
  });
});

/**
 * プリセットの難度較正
 *
 * プリセットは構築画面の「たたき台として読み込む」導線から使われるため、ここが弱いと
 * 引き運ではなくプリセットの弱さで連敗し、設計書 §7 の反証条件を誤って踏む。
 * 逆に強すぎると「配分の判断」という仮説そのものが検証できない。
 * 実測（シード1〜20・greedyStrategy）は swift 10/20・heavy 10/20。
 *
 * 上限・下限・偏りを別々のテストに分け、それぞれ2プリセットを独立にアサートする。
 * 論理和（どちらかが満たせば緑）にすると、片方が壊れても検出できない。
 */
describe('プリセットの難度較正', () => {
  it('素直な戦略では全勝しない（配分の余地が残っている）', () => {
    expect(presetWinsOf('swift')).toBeLessThanOrEqual(14);
    expect(presetWinsOf('heavy')).toBeLessThanOrEqual(14);
  });

  it('素直な戦略でも十分に勝てる（理不尽ではない）', () => {
    expect(presetWinsOf('swift')).toBeGreaterThanOrEqual(6);
    expect(presetWinsOf('heavy')).toBeGreaterThanOrEqual(6);
  });

  it('プリセット2種の勝率が極端に偏らない', () => {
    expect(Math.abs(presetWinsOf('swift') - presetWinsOf('heavy'))).toBeLessThanOrEqual(5);
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
  //
  // さらに続くレビューで、群れ22体でも「範囲攻撃なしでは必ず負ける」までは達していないと
  // 判明した（範囲なし合法デッキが 6/20 で勝つ）。実プレイ判定の直前に敵側の較正を
  // 動かすリスクを避け、数値は据え置いて主張を「勝率が著しく落ちる」に改めてある。
  it('敵の総HPが 728 から変わっていない', () => {
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(728);
  });
});
