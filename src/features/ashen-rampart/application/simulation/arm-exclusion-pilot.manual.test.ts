/**
 * G1 反復6 やり直し・軸とコストを分離する腕の除外率パイロット（設計書 §8.2.11 反対解釈1）
 *
 * **これは標本サイズを決めるための下調べであり、勝敗の判定ではない。**
 * `pair.actual.outcome` / `pair.actual.stagesCleared` など、遠征の勝敗を表す
 * フィールドには**一切アクセスしない**。理由は次のとおり:
 *
 * これまでの `demandAwareAcquire` 対 `worstDemandAcquire` の対比は、
 * 軸適合とコストの同点処理が**両方とも**反転していた（`worstDemandAcquire` は
 * 軸昇順・コスト降順）。提示3枚の軸スコアが同点のとき、この対比は
 * 「最安」対「最も高い」という純粋なコスト対比になり、観測された差が
 * 軸によるものかコストによるものかを区別できない。
 *
 * これを分離するため `axisWorstAcquire`（軸だけ反転・A対B）と
 * `costWorstAcquire`（コストだけ反転・A対C）を用意した。次にこれらで
 * `G1''` と同じ McNemar 検定を組むには、**両腕が同じ札を取ってしまう
 * 提示（`swappedTo === undefined`）がどれだけ母集団を削るか**を先に知る
 * 必要がある。削れる数が多いほど必要な試行数が増えるため、これは
 * 事前登録の標本サイズを決める入力になる。
 *
 * **勝敗を見てから設計を決めることを避けるため、ここでは除外率だけを測る。**
 * 勝敗を出力に含めると、その後の事前登録が「観測を見てから書いたもの」に
 * なってしまう（§8.2.9 で一度それに近い失敗をしている）。
 *
 * 母集団の定義は `expedition-gate-redo.manual.test.ts`（§8.2.10(a)）に倣い、
 * 「提示が2回起きた遠征」＝実ランがステージ1・2 の両方に勝った遠征だけを対象にする
 * （`pair.lastOfferIndex === 1`）。これは処置前の変数（実ランの進行）だけで
 * 決まり、A/B/C のどの反実仮想を使っても同じ実ランから同じ値になる。
 *
 * **閾値の assert は置かない。**
 *
 * CI には常駐させない。実行するには:
 *   ASHEN_RAMPART_PILOT=1 npx jest arm-exclusion-pilot --silent=false
 */
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire } from './expedition-simulation';
import {
  runCounterfactual, axisWorstAcquire, costWorstAcquire, worstDemandAcquire,
  type CounterfactualPair,
} from './counterfactual';

/**
 * シード帯 621〜820（既存の測定が使った 1〜620 と重ならない帯）。
 *
 * **開始値 621 は固定する。** `ASHEN_RAMPART_PILOT_SEED_END` は
 * 動作確認・時間短縮のための縮小口であり、標本サイズの決定には使わない。
 */
const SEED_START = 621;
const SEED_END = Number(process.env.ASHEN_RAMPART_PILOT_SEED_END ?? 820);
const isEnabled = process.env.ASHEN_RAMPART_PILOT === '1';

/** 提示が2回起きた遠征のみを母集団とする添字（§8.2.10(a) に倣う） */
const POPULATION_LAST_OFFER_INDEX = 1;

/** 母集団の中で「両腕が同じ札を取ってしまった」組を数える */
interface ExclusionCount {
  population: number;
  excluded: number;
}

const countExclusion = (pairs: readonly CounterfactualPair[]): ExclusionCount => ({
  population: pairs.length,
  excluded: pairs.filter((pair) => pair.swappedTo === undefined).length,
});

const formatRate = ({ population, excluded }: ExclusionCount): string => {
  const rate = population === 0 ? 0 : (excluded / population) * 100;
  return `${excluded} / ${population}（${rate.toFixed(1)}%）`;
};

(isEnabled ? describe : describe.skip)('軸とコストを分離する腕の除外率パイロット', () => {
  jest.setTimeout(900000);

  it('母集団に入った数と、A対B・A対C・（参考）A対worstDemandAcquire の除外率', () => {
    const lines: string[] = [];

    let totalPopulation = 0;
    const totalAB: ExclusionCount = { population: 0, excluded: 0 };
    const totalAC: ExclusionCount = { population: 0, excluded: 0 };
    const totalAWorst: ExclusionCount = { population: 0, excluded: 0 };

    Object.values(PRESET_DECKS).forEach((preset) => {
      const pairsAB: CounterfactualPair[] = [];
      const pairsAC: CounterfactualPair[] = [];
      const pairsAWorst: CounterfactualPair[] = [];

      for (let seed = SEED_START; seed <= SEED_END; seed++) {
        const base = {
          initialDeck: preset.cards,
          seed,
          strategy: greedyStrategy,
          acquire: demandAwareAcquire,
          randomFactory: createSeededRandom,
        };

        const pairAB = runCounterfactual({ ...base, counterfactualAcquire: axisWorstAcquire });
        const pairAC = runCounterfactual({ ...base, counterfactualAcquire: costWorstAcquire });
        const pairAWorst = runCounterfactual({ ...base, counterfactualAcquire: worstDemandAcquire });

        // 母集団判定（§8.2.10(a)）は処置前の変数だけで決まるため、
        // どの反実仮想を使っても同じ実ランから同じ値になる。ここでは
        // pairAB の値を代表として使う（pairAC・pairAWorst と同一のはず）。
        if (pairAB.lastOfferIndex !== POPULATION_LAST_OFFER_INDEX) continue;

        pairsAB.push(pairAB);
        pairsAC.push(pairAC);
        pairsAWorst.push(pairAWorst);
      }

      const exclusionAB = countExclusion(pairsAB);
      const exclusionAC = countExclusion(pairsAC);
      const exclusionAWorst = countExclusion(pairsAWorst);

      totalPopulation += pairsAB.length;
      totalAB.population += exclusionAB.population;
      totalAB.excluded += exclusionAB.excluded;
      totalAC.population += exclusionAC.population;
      totalAC.excluded += exclusionAC.excluded;
      totalAWorst.population += exclusionAWorst.population;
      totalAWorst.excluded += exclusionAWorst.excluded;

      lines.push(
        `===== プリセット ${preset.id} =====`,
        `  母集団に入った数 ${pairsAB.length}`,
        `  A対B（axisWorstAcquire・軸だけ反転） 除外 ${formatRate(exclusionAB)}`,
        `  A対C（costWorstAcquire・コストだけ反転） 除外 ${formatRate(exclusionAC)}`,
        `  参考: A対worstDemandAcquire（既存・両方反転） 除外 ${formatRate(exclusionAWorst)}`
      );
    });

    lines.unshift(
      '########## 全体サマリー ##########',
      `  シード帯 ${SEED_START}〜${SEED_END}（プリセットごと）`,
      `  母集団に入った数（合算） ${totalPopulation}`,
      `  A対B（axisWorstAcquire） 除外 ${formatRate(totalAB)}`,
      `  A対C（costWorstAcquire） 除外 ${formatRate(totalAC)}`,
      `  参考: A対worstDemandAcquire 除外 ${formatRate(totalAWorst)}`,
      ''
    );
    console.log(lines.join('\n'));

    // **閾値ではない構造的な検査**: 試行が1件も母集団に入らなければ、
    // このパイロット自体が成立しない。ここが落ちたら、それ自体が発見である。
    expect(totalPopulation).toBeGreaterThan(0);
  });
});
