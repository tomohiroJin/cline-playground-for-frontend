/**
 * バランスの回帰テスト（反復3 の再較正）
 *
 * 前作は支配戦略の検算をせずに実装し、3回の実プレイを費やして初めて
 * 欠陥を知った。同じことを繰り返さないため、CI で常時検証する。
 *
 * このファイルの鉄則:
 * 1. **テスト名で主張することだけを検証し、検証できないことは主張しない。**
 * 2. **不変条件は両方向に置く。** 「弱い組み方が勝てない」だけでは較正が
 *    厳しすぎる方向を検出できず、「強い組み方が勝てる」だけでは緩すぎる方向を
 *    検出できない。反復1 では片側だけの不変条件で同じ欠陥を4回繰り返した。
 * 3. **緑になった理由まで確かめる。** 対照条件が「マナ枯渇」「手札詰まり」で
 *    負けていては、測りたいものを測っていない。各対照条件について
 *    「札は出せた上で押し切られた」ことを cardsPlayed で確認する。
 *
 * 反復2 までの較正（総HP728・全エントリがレーン0・魔力炉8枚）は2レーン化で
 * 前提ごと失われたため、閾値・対照条件をすべて測り直してある。
 */
import { startRun } from '../../application/use-cases/start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyHp, type WaveDefinition } from './waves';
import { getEnemySpec } from './enemies';
import { createCombatState, LIFE_INITIAL } from './combat-state';
import { createDeck } from '../cards/deck';
import { validateDeck } from '../cards/deck-builder';
import { DECK_SIZE, maxCopiesOf, getCardDefinition } from '../cards/card-pool';
import {
  simulateRun,
  greedyStrategy,
  offPathOnlyStrategy,
  noPureGroundAttackStrategy,
  deployThenIdleStrategy,
  DEPLOY_ONLY_UNTIL_TICK,
  type RunSimulationResult,
  type Strategy,
} from './run-simulation';
import { stepTick } from './step-tick';

// 1ランは約1000tick。20シード×十数条件を回すため、既定の5秒では足りない
jest.setTimeout(120_000);

/** 勝率を測るためのシード群 */
const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

const repeat = (id: string, count: number): string[] => Array.from({ length: count }, () => id);

/**
 * 同じ条件を測り直さないための記憶
 *
 * 「全要求充足 − 範囲なし」のような比較は同じ掃引を何度も要求する。
 * 素朴に回すとテスト1件あたり数秒かかり、閾値ではなく実行時間で落ちる。
 */
const sweepCache = new Map<string, RunSimulationResult[]>();

/** 指定デッキを全シードで回す。乱数はシードごとに新しく作るので互いに独立 */
const runAllSeeds = (
  cards: readonly string[],
  strategy: Strategy,
  strategyName: string
): RunSimulationResult[] => {
  const key = `${strategyName}|${cards.join(',')}`;
  const cached = sweepCache.get(key);
  if (cached) return cached;
  const results = SEEDS.map((seed) => {
    const random = new SeededRandom(seed);
    const deck = createDeck(cards, () => random.random());
    return simulateRun(createCombatState(deck, PLAINS_WAVES), strategy, PLAINS_MAP);
  });
  sweepCache.set(key, results);
  return results;
};

const winsOf = (
  cards: readonly string[],
  strategy: Strategy = greedyStrategy,
  strategyName = 'greedy'
): number => runAllSeeds(cards, strategy, strategyName).filter((r) => r.outcome === 'won').length;

/** 全シード中で最も札を出せなかったランの枚数（力負けかマナ枯渇かの判別に使う） */
const minCardsPlayedOf = (
  cards: readonly string[],
  strategy: Strategy = greedyStrategy,
  strategyName = 'greedy'
): number => Math.min(...runAllSeeds(cards, strategy, strategyName).map((r) => r.cardsPlayed));

const presetWinsCache = new Map<string, number>();

/** プリセットの勝利数。startRun 経由でプリセット定義そのものを検証する */
const presetWinsOf = (
  presetId: string,
  strategy: Strategy = greedyStrategy,
  strategyName = 'greedy'
): number => {
  const key = `${strategyName}|${presetId}`;
  const cached = presetWinsCache.get(key);
  if (cached !== undefined) return cached;
  const wins = SEEDS.filter(
    (seed) =>
      simulateRun(startRun(presetId, new SeededRandom(seed)), strategy, PLAINS_MAP).outcome ===
      'won'
  ).length;
  presetWinsCache.set(key, wins);
  return wins;
};

// --- カードの性質を判定する述語（IDのハードコードは将来カードが増えたときに漏れる） ---

/** 対空の答えを持つか（飛行に当たる守り手か、飛行を地上化する罠か） */
const hasAntiAir = (id: string): boolean => {
  const card = getCardDefinition(id);
  return card.tower?.hitsFlying === true || card.trap?.groundedTicks !== undefined;
};

/** 範囲攻撃を持つか（塔の splashRadius と燠火の radius の両方を見る） */
const hasAreaDamage = (id: string): boolean => {
  const card = getCardDefinition(id);
  return (card.tower?.splashRadius ?? 0) > 0 || (card.ember?.radius ?? 0) > 0;
};

/** 貫通するか（直線上の敵をまとめて貫く） */
const hasPiercing = (id: string): boolean => getCardDefinition(id).tower?.piercing === true;

/**
 * 群れをまとめて削る手段を持つか（範囲攻撃 または 貫通）
 *
 * 設計書 §7 は 単体／範囲／貫通 を3つの軸として置いている。1マス幅のレーンで
 * 群れが縦に詰まると、範囲（半径内の全員）と貫通（直線上の全員）は同じ集団を
 * まとめて捉えるため、**互いの代替になる**。実測でも範囲だけを抜いた
 * デッキは 10/20 勝ち、拘束として成立しない。拘束が成立するのは
 * 「群れをまとめて削る手段が1つも無い」ときで、その形で不変条件を置く。
 */
const hasMassAnswer = (id: string): boolean => hasAreaDamage(id) || hasPiercing(id);

/** 自力でダメージを出すか（篝火・鍛冶場・落網・石壁・時泥・徴発・魔力炉は満たさない） */
const hasDamage = (id: string): boolean => {
  const card = getCardDefinition(id);
  return (
    (card.tower?.damage ?? 0) > 0 || (card.trap?.damage ?? 0) > 0 || (card.ember?.damage ?? 0) > 0
  );
};

/**
 * 全要求充足デッキ（壁・射手・対空・範囲・貫通・支援を含む20枚）
 *
 * 較正の基準となる1本。ここから述語で札を抜いたものが対照条件になる。
 * 対照条件を「別に組んだデッキ」にすると、抜いた性質以外も同時に変わって
 * しまうため、必ずこの1本の近傍として作る。
 */
const FULL_DECK: readonly string[] = [
  ...repeat('reactor', 4),
  ...repeat('stone-wall', 3),
  ...repeat('arrow-tower', 3),
  ...repeat('ballista', 3),
  ...repeat('cannon-tower', 2),
  ...repeat('spike-trap', 2),
  'piercer',
  'beacon',
  'levy',
];

/**
 * 抜いた枚数を埋めて20枚に戻す
 *
 * 対照条件は「特定の性質を持つ札が無い」ことだけを変えたい。枚数まで減ると
 * 「デッキが薄いから負けた」という別の理由が混ざる。
 *
 * **埋め札は元のデッキに既にある攻撃札を同名上限まで優先する。** 0ダメージの札や
 * 魔力炉で埋めると「除外したから負けた」のか「埋め札が弱いから負けた」のかを
 * 区別できなくなる（反復1 のレビュー是正）。実際、魔力炉だけで埋めた版では
 * 範囲攻撃なしデッキが 5/20、攻撃札で埋めた版では 10/20 と結論が反転した。
 * 攻撃札の上限を使い切ってなお足りないぶんだけ魔力炉で埋める（同名3枚上限が
 * ある以上、これは避けられない——そしてそれ自体が設計書 §7 の意図した拘束）。
 */
const padToDeckSize = (cards: readonly string[]): string[] => {
  const padded = [...cards];
  [...new Set(cards)].filter(hasDamage).forEach((id) => {
    while (padded.length < DECK_SIZE && padded.filter((c) => c === id).length < maxCopiesOf(id)) {
      padded.push(id);
    }
  });
  while (padded.length < DECK_SIZE) padded.push('reactor');
  return padded.slice(0, DECK_SIZE);
};

/** FULL_DECK から述語を満たす札を抜き、20枚に戻した対照条件デッキ */
const deckWithout = (isExcluded: (id: string) => boolean): string[] =>
  padToDeckSize(FULL_DECK.filter((id) => !isExcluded(id)));

/**
 * 対照条件の作り方が結論を作っていないこと
 *
 * このファイルの結論は FULL_DECK と deckWithout が作るデッキに全面的に依存する。
 * 生成器そのものを先に検査しておく。
 */
describe('対照条件の作り方', () => {
  it('全要求充足デッキは構築規則を満たし、対空・範囲・貫通・壁・マナ源を備えている', () => {
    expect(FULL_DECK).toHaveLength(DECK_SIZE);
    expect(validateDeck(FULL_DECK).errors).toEqual([]);
    // 「全要求を満たしている」ことをスペックから判定する（IDの並びを目視で信じない）
    expect(FULL_DECK.some(hasAntiAir)).toBe(true);
    expect(FULL_DECK.some(hasAreaDamage)).toBe(true);
    expect(FULL_DECK.some((id) => getCardDefinition(id).tower?.piercing === true)).toBe(true);
    expect(FULL_DECK).toContain('stone-wall');
    expect(FULL_DECK).toContain('reactor');
  });

  it.each([
    ['対空', hasAntiAir],
    ['群れをまとめて削る手段', hasMassAnswer],
    ['範囲攻撃', hasAreaDamage],
  ])('%s を抜いたデッキも 20枚の合法デッキで、その性質を1枚も持たない', (_name, isExcluded) => {
    const deck = deckWithout(isExcluded);
    expect(deck).toHaveLength(DECK_SIZE);
    expect(validateDeck(deck).errors).toEqual([]);
    expect(deck.filter(isExcluded)).toHaveLength(0);
  });

  it('埋め札に使える攻撃札を使い切っている（0ダメージ札で弱くしていない）', () => {
    // 攻撃札が上限に達していないのに魔力炉で埋めていたら、埋め札の弱さが結論を作る
    const deck = deckWithout(hasMassAnswer);
    const attackers = [...new Set(deck)].filter(hasDamage);
    attackers.forEach((id) => {
      expect(deck.filter((c) => c === id)).toHaveLength(maxCopiesOf(id));
    });
  });
});

/**
 * 【反復5 の診断】配備が終わると判断が消える
 *
 * **Task 9 でこの診断を「配備後に何もしない戦略は 4/20 未満」という不変条件へ
 * 反転させる計画だったが、達成できていない。** 反転は保留のままで、判断は
 * 実プレイの判定者へ差し戻してある（.superpowers の task-9-report.md）。
 * 較正後の実測は 素直な戦略 12/20 対 配備後に何もしない 10/20（差2）。
 *
 * 反転できない理由は数値ではなく測定器の構造にある。DEPLOY_ONLY_UNTIL_TICK は
 * 「山札が尽きる tick」として定義されており（run-simulation.ts）、その時点で
 * 素直な戦略の手には札がほとんど残らない。20シード中**11シードでは素直な戦略も
 * tick 680 以降に一切操作せず、2つの戦略は完全に同一のラン**になる（20ラン合計で
 * 680以降に打たれた札は12枚）。つまり2つの戦略の勝率差には構造的な上限があり、
 * ウェーブをどう動かしても「素直な戦略 12/20 以上」と「配備後に何もしない 4/20 未満」は
 * 同時に成立しない。実際、30通り以上の組み合わせで素直な戦略が 12/20 以上に
 * 留まる限り、配備後に何もしない戦略は 8/20 を下回らなかった。
 * 詳細と全組み合わせの実測は task-9-report.md にある。
 */
describe('【反復5 の診断】配備が終わると判断が消える', () => {
  // ここで緑になることが、設計書 §2.1 の診断（経路外の守り手は仕様として無敵）の証拠になる。
  it('配備後に何もしない戦略が、素直な戦略とほとんど変わらない勝率を出す', () => {
    const idle = winsOf(FULL_DECK, deployThenIdleStrategy, 'deployThenIdle');
    const greedy = winsOf(FULL_DECK);
    // **絶対値ではなく差で見る。** 「ランの後半4割で操作を完全に止めても、素直に打ち続けた
    // 場合と4本差以内にしか落ちない」＝配備が終わった後の操作が勝敗にほとんど寄与していない。
    // 絶対値の閾値を置くと、後の較正で素直な戦略の勝率が動いたときに、この閾値の意味も
    // 黙って変わってしまう。greedy の掃引は runAllSeeds のキャッシュに載るので実行コストは増えない
    expect(greedy - idle).toBeLessThanOrEqual(4);
  });

  it('DEPLOY_ONLY_UNTIL_TICK までに、素直な戦略で進めると山札が尽きている', () => {
    // DEPLOY_ONLY_UNTIL_TICK は式から導出せず実数で置いている（意図的）。
    // その実数が「山札を尽きさせるのに十分な tick」だという根拠は、このテストだけが持つ。
    // DECK_SIZE や DRAW_INTERVAL_TICKS が将来変わったとき、この診断が黙って
    // 無関係な tick を測るようになることを防ぐ。
    //
    // 「ちょうどこの tick で尽きる」とまでは主張しない。FULL_DECK は徴発（levy）を
    // 1枚含み、これを打つと山札の上から3枚が一度に取り除かれる（drawOne による
    // 40tick 周期のドローとは別経路）。そのため実際に尽きる tick は徴発をいつ
    // 打てたかに左右され、680 より前に尽きることがある（実測: シード1で560）。
    // DEPLOY_ONLY_UNTIL_TICK が保証するのは「この tick には尽きている」ことだけ。
    const random = new SeededRandom(1);
    const deck = createDeck(FULL_DECK, () => random.random());
    let state = createCombatState(deck, PLAINS_WAVES);
    for (let i = 0; i < DEPLOY_ONLY_UNTIL_TICK; i++) {
      state = stepTick(state, greedyStrategy(state, PLAINS_MAP), PLAINS_MAP);
    }
    expect(state.deck.drawPile).toHaveLength(0);
  });
});

/**
 * 較正の不変条件（反復3・反復5 で再測定）— 本ファイルの中核
 *
 * 5本を両方向に置く。上限（勝ちすぎない）と下限（勝てなくはない）の両方を
 * 同時に課さないと、較正が厳しすぎても緩すぎても検出できない。
 *
 * 実測（greedyStrategy・シード1〜20）:
 *
 * | 条件                     | 反復3 | 反復5 |
 * |--------------------------|-------|-------|
 * | 全要求充足               | 14/20 | 12/20 |
 * | 対空なし                 |  0/20 |  0/20 |
 * | 範囲も貫通も無し         |  0/20 |  0/20 |
 * | 経路外のみ               |  0/20 |  0/20 |
 * | 地上専用の攻撃札なし     |  6/20 |  6/20 |
 *
 * 反復5 の再測定は、摩耗（敵の射程攻撃）・溢れのライフ対価・速攻型への徹甲弩
 * 追加がすべて入った後の値。動かしたのは waves.ts の数とタイミングだけで、
 * 閾値は1つも動かしていない。**6本目（配備後に何もしない戦略）は追加できて
 * いない。** 理由は上の診断ブロックの docstring を参照。
 */
describe('較正の不変条件（反復3・反復5 で再測定）', () => {
  it('全要求充足デッキは 12/20 以上・18/20 以下で勝つ', () => {
    const wins = winsOf(FULL_DECK);
    // 下限: どう組んでも勝てない（較正の行き過ぎ）状態を検出する
    expect(wins).toBeGreaterThanOrEqual(12);
    // 上限: 「良いデッキを組めば自動で勝てる」方向への悪化を検出する
    expect(wins).toBeLessThanOrEqual(18);
  });

  it('対空を含まないデッキは 4/20 未満しか勝てない', () => {
    expect(winsOf(deckWithout(hasAntiAir))).toBeLessThan(4);
  });

  it('群れをまとめて削る手段（範囲・貫通）を含まないデッキは 4/20 未満しか勝てない', () => {
    expect(winsOf(deckWithout(hasMassAnswer))).toBeLessThan(4);
  });

  it('経路上に一切置かない戦略は 4/20 未満しか勝てない（ブロックが必要か）', () => {
    // デッキ構成では検査できない不変条件。すべての守り手がブロックできる以上、
    // 石壁を抜いたデッキでも弓兵を経路上に置けば成立してしまう。行為のほうを絞る
    expect(winsOf(FULL_DECK, offPathOnlyStrategy, 'offPath')).toBeLessThan(4);
  });

  it('地上専用の攻撃札を持たない戦略は 10/20 未満しか勝てない（ブロックが強すぎないか）', () => {
    // 上の対と必ずセットで見る。片側だけでは較正のズレを検出できない
    expect(winsOf(FULL_DECK, noPureGroundAttackStrategy, 'wallAir')).toBeLessThan(10);
  });
});

/**
 * 対照条件が「力負け」であること（緑の理由の検査）
 *
 * 対照条件が負けても、それが「マナが無くて何も出せなかった」「置かない札で
 * 手札が詰まって以後の札が全部墓地へ落ちた」ためなら、測りたいものを
 * 測っていない。実際 offPathOnlyStrategy は当初この手札詰まりで負けており、
 * 置けない札を捨てる処理を入れて初めて正しい理由で負けるようになった。
 */
describe('対照条件はマナ枯渇や手札詰まりではなく力負けしていること', () => {
  it.each([
    ['対空なし', deckWithout(hasAntiAir), greedyStrategy, 'greedy'],
    ['範囲も貫通も無し', deckWithout(hasMassAnswer), greedyStrategy, 'greedy'],
    ['経路外のみ', [...FULL_DECK], offPathOnlyStrategy, 'offPath'],
    ['地上専用の攻撃札なし', [...FULL_DECK], noPureGroundAttackStrategy, 'wallAir'],
  ])('%s は、最も出せなかったランでも10枚以上を盤面に出している', (_name, deck, strategy, key) => {
    expect(minCardsPlayedOf(deck, strategy, key)).toBeGreaterThanOrEqual(10);
  });
});

/**
 * 範囲攻撃「だけ」を抜いても決定打にならないこと（測定結果の明示）
 *
 * ブリーフの目標は「範囲攻撃を含まないデッキは 6/20 未満」だったが**未達**。
 * 実測 10/20 で、閾値を通すための調整は行っていない。原因は数値ではなく構造で、
 * 群れの投入数を 22→30 に増やしても、南北へ分けても 8〜11/20 から動かなかった。
 *
 * 1マス幅のレーンでは、ブロックされた群れが縦にほぼ同一座標へ積み上がる。
 * 半径1の範囲攻撃も直線の貫通も同じ塊をまとめて捉えるため、徹甲弩が火砲台の
 * 完全な代替になる（貫通は §7 の「並んだ相手には効率が跳ね上がる」性質そのもの）。
 * したがって拘束は「範囲攻撃」ではなく「群れをまとめて削る手段」に掛かっており、
 * 上の不変条件はその形で置いてある。
 *
 * ここでは相対差だけをラチェットとして固定する。片方が完全に無意味化する
 * （差が消える）方向への悪化を検出したい。
 *
 * **範囲側と貫通側の両方に置くこと。** 片方だけだと、無力化した側の回帰が
 * 上の「範囲も貫通も無し < 4/20」と残った側の寄与テストの両方をすり抜ける
 * （どちらも「もう一方が効いている」だけで緑になれてしまう）。
 */
describe('範囲攻撃と貫通のそれぞれの寄与', () => {
  it('範囲攻撃を抜くと勝率は落ちるが、貫通が代替するため決定打にはならない', () => {
    const full = winsOf(FULL_DECK);
    const noArea = winsOf(deckWithout(hasAreaDamage));
    // 寄与はある（実測 14/20 → 10/20）
    expect(full - noArea).toBeGreaterThanOrEqual(3);
    // が、単独では拘束にならない（実測 10/20）。この事実を数値で残す
    expect(noArea).toBeGreaterThanOrEqual(6);
    expect(noArea).toBeLessThanOrEqual(12);
  });

  it('貫通を抜いても勝率が落ちる（範囲だけでは代替しきれない）', () => {
    const full = winsOf(FULL_DECK);
    const noPiercing = winsOf(deckWithout(hasPiercing));
    // 実測 14/20 → 8/20。範囲側（寄与3以上）と同じ形でラチェットを掛ける。
    // 現状の寄与は範囲(4)より貫通(6)のほうが大きい——3軸が実態として
    // 貫通>範囲 に崩れている件は実プレイ判定への申し送りとし、ここでは調整しない
    expect(full - noPiercing).toBeGreaterThanOrEqual(3);
  });
});

/**
 * 対空要求の形式的な保証（設計書 §6）
 *
 * 「対空を無視すると必ず負ける」を勝率ではなく**体数の不等式**で保証する。
 * 飛行はブロックを無視するため、この保証はレーン構成やブロックの有無に依存しない。
 */
describe('対空要求の形式的な保証', () => {
  it('飛行の体数が LIFE_INITIAL を上回る（漏れだけでライフが0を下回る）', () => {
    const flyingCount = PLAINS_WAVES.flatMap((w) => w.entries)
      .filter((entry) => getEnemySpec(entry.enemyId).flying)
      .reduce((sum, entry) => sum + entry.count, 0);
    expect(flyingCount).toBeGreaterThan(LIFE_INITIAL);
  });

  it('対空を持たないデッキは、鴉だけの波にも必ず負ける', () => {
    // PLAINS_WAVES を使ったテストは他の敵の漏れも同時に起こりうるため、
    // 「鴉の漏れそのものが敗因か」は間接的にしか示せない。鴉だけの波で直接示す
    const cards = deckWithout(hasAntiAir);
    const ravenOnlyWaves: readonly WaveDefinition[] = [
      {
        startTick: 0,
        entries: [
          { enemyId: 'raven', count: LIFE_INITIAL + 1, spawnIntervalTicks: 10, laneIndex: 0 },
        ],
      },
    ];
    const deck = createDeck(cards, () => 0.5);
    const result = simulateRun(
      createCombatState(deck, ravenOnlyWaves),
      greedyStrategy,
      PLAINS_MAP
    );
    expect(result.outcome).toBe('lost');
  });
});

/**
 * 支配戦略が存在しないこと
 *
 * 前コンセプトを殺したのは「最効率カードに効かない相手がいない」ことだった。
 * 同名上限3枚・14種という構築規則のもとでは「単一カードへの偏り」自体が
 * 構築不能（20枚には必ず7種以上が入る）なため、意味のある問いは
 * 「合法デッキで、ある要求を無視したらどれだけ不利になるか」である。
 */
describe('支配戦略が存在しないこと', () => {
  it('魔力炉を入れないデッキは全シードで負ける（マナ源なしでは何も出せない）', () => {
    const cards = [
      ...repeat('stone-wall', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('catapult', 3),
      ...repeat('piercer', 3),
      ...repeat('spike-trap', 1),
      ...repeat('levy', 1),
    ];
    expect(validateDeck(cards).errors).toEqual([]);
    expect(winsOf(cards)).toBe(0);
  });
});

/**
 * プリセットの難度較正
 *
 * プリセットは構築画面の「たたき台として読み込む」導線から使われるため、ここが
 * 弱いと引き運ではなくプリセットの弱さで連敗し、設計書 §7 の反証条件を誤って踏む。
 * 逆に強すぎると「配分の判断」という仮説そのものが検証できない。
 *
 * 実測（greedyStrategy・シード1〜20）: 反復3 は 速攻型 8/20・重厚型 7/20、
 * **反復5 は 速攻型 13/20・重厚型 8/20**（差5）。反復5 で速攻型に徹甲弩2枚が
 * 入って 14/20 まで上がり、重厚型 7/20 との差が7 になって下の偏りの不変条件を
 * 割った。戻したのはプリセットではなくウェーブ側で、重厚型が20ラン合計で鴉を
 * 125体漏らしていた（速攻型は15体）ことが分かったため、鴉の出現間隔を
 * 10 → 18 tick に緩めてある（waves.ts の docstring 参照）。
 *
 * 上限・下限・偏りを別々のテストに分け、それぞれ2プリセットを独立にアサートする。
 * 論理和（どちらかが満たせば緑）にすると、片方が壊れても検出できない。
 */
describe('プリセットの難度較正', () => {
  it.each(['swift', 'heavy'])('%s は素直な戦略では全勝しない（配分の余地が残っている）', (id) => {
    expect(presetWinsOf(id)).toBeLessThanOrEqual(14);
  });

  it.each(['swift', 'heavy'])('%s は素直な戦略でも十分に勝てる（理不尽ではない）', (id) => {
    expect(presetWinsOf(id)).toBeGreaterThanOrEqual(6);
  });

  it('プリセット2種の勝率が極端に偏らない', () => {
    expect(Math.abs(presetWinsOf('swift') - presetWinsOf('heavy'))).toBeLessThanOrEqual(5);
  });

  it.each(['swift', 'heavy'])('%s も経路上に置かなければ 4/20 未満しか勝てない', (id) => {
    // 不変条件をプリセットでも確かめる。FULL_DECK でだけ成立する性質ではないこと
    expect(presetWinsOf(id, offPathOnlyStrategy, 'offPath')).toBeLessThan(4);
  });
});

describe('較正の基準値', () => {
  it('敵の総HPが 808 から変わっていない', () => {
    // 反復2 は単一レーンで728、反復3 の2レーン化で648、反復5 の再較正で808。
    // 増分160 はウェーブ4 北の重装2体(120)と雑兵2体(40)で、鴉の出現間隔を
    // 緩めたぶんの難度を地上へ戻したもの（waves.ts の docstring 参照）。
    // 敵数を変えたら §9.3 の描画密度（スタック表示）を再計算すること
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(808);
  });
});
