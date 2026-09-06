import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { createSeededRandom } from '../../infrastructure/random/seeded-random';
import { demandAwareAcquire, noAcquire } from './expedition-simulation';
import {
  runCounterfactual, worstDemandAcquire, axisWorstAcquire, costWorstAcquire,
} from './counterfactual';

const swift = PRESET_DECKS.swift?.cards ?? [];
const base = {
  initialDeck: swift,
  strategy: greedyStrategy,
  acquire: demandAwareAcquire,
  randomFactory: createSeededRandom,
};

describe('worstDemandAcquire（demandAware の裏返し）', () => {
  it('要求軸を1つも満たさない札があればそれを選ぶ', () => {
    // reactor は軸を1つも持たない。arrow-tower より必ず後ろに来る
    const pick = worstDemandAcquire(['piercer', 'reactor'], ['heavy-hit'], []);
    expect(pick).toBe('reactor');
  });

  it('demandAware と同じ提示で、必ず異なる札を選ぶ（軸のスコアに差があるとき）', () => {
    const offer = ['piercer', 'reactor'];
    const demands = ['heavy-hit'] as const;
    expect(worstDemandAcquire(offer, demands, [])).not.toBe(
      demandAwareAcquire(offer, demands, [])
    );
  });

  it('空の提示では undefined', () => {
    expect(worstDemandAcquire([], ['block'], [])).toBeUndefined();
  });
});

describe('axisWorstAcquire（軸だけを反転させた腕）', () => {
  it('要求軸を満たす数が最も少ない札を選ぶ', () => {
    // piercer は 'heavy-hit' を満たす（axes=[anti-air, mass-answer, heavy-hit]）。
    // reactor は何も満たさない（axes=[]）。軸が最少の reactor を選ぶ
    const pick = axisWorstAcquire(['piercer', 'reactor'], ['heavy-hit'], []);
    expect(pick).toBe('reactor');
  });

  it('軸スコアが同点なら最安の札を選ぶ（worstDemandAcquire とは逆）', () => {
    // reactor（cost 0）・arrow-tower（cost 1）はどちらも 'heavy-hit' を満たさない（同点）
    const offer = ['reactor', 'arrow-tower'];
    const demands = ['heavy-hit'] as const;
    expect(axisWorstAcquire(offer, demands, [])).toBe('reactor');
    // 対比: worstDemandAcquire は同点なら最も高い札（arrow-tower）を選ぶ
    expect(worstDemandAcquire(offer, demands, [])).toBe('arrow-tower');
  });

  it('空の提示では undefined', () => {
    expect(axisWorstAcquire([], ['block'], [])).toBeUndefined();
  });
});

describe('costWorstAcquire（コストの同点処理だけを反転させた腕）', () => {
  it('要求軸を満たす数が最も多い札を選ぶ（demandAwareAcquire と同じ向き）', () => {
    // piercer は 'anti-air' を満たす。arrow-tower は満たさない
    const pick = costWorstAcquire(['piercer', 'arrow-tower'], ['anti-air'], []);
    expect(pick).toBe('piercer');
  });

  it('軸スコアが同点なら最高コストの札を選ぶ（demandAwareAcquire とは逆）', () => {
    // reactor（cost 0）・arrow-tower（cost 1）はどちらも 'heavy-hit' を満たさない（同点）
    const offer = ['reactor', 'arrow-tower'];
    const demands = ['heavy-hit'] as const;
    expect(costWorstAcquire(offer, demands, [])).toBe('arrow-tower');
    // 対比: demandAwareAcquire は同点なら最安（reactor）を選ぶ
    expect(demandAwareAcquire(offer, demands, [])).toBe('reactor');
  });

  it('軸スコアに差があるとき、demandAwareAcquire と同じ札を選ぶ（コストでしか違わない）', () => {
    // piercer（axes=3）と reactor（axes=0）は 'heavy-hit' で軸スコアに差が付く。
    // このときコストの向きは選択に影響しないため、両戦略は一致する
    const offer = ['piercer', 'reactor'];
    const demands = ['heavy-hit'] as const;
    expect(costWorstAcquire(offer, demands, [])).toBe(
      demandAwareAcquire(offer, demands, [])
    );
  });

  it('空の提示では undefined', () => {
    expect(costWorstAcquire([], ['block'], [])).toBeUndefined();
  });
});

describe('runCounterfactual（最後の獲得だけを差し替えた再生）', () => {
  it('クリーンな組では、差し替えた提示より前のステージが実ランと完全に一致する', () => {
    const clean = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((seed) => runCounterfactual({ ...base, seed }))
      .filter((p) => p.isClean && p.ablated);
    expect(clean.length).toBeGreaterThan(0);

    clean.forEach((pair) => {
      const ablated = pair.ablated;
      const cutIndex = pair.lastOfferIndex;
      if (!ablated || cutIndex === undefined) {
        throw new Error('isClean なら ablated と lastOfferIndex は存在する');
      }
      // **提示 i はステージ i の後に起きるので、影響を受けるのはステージ i+1 以降。**
      // ステージ 0..i は両腕で完全に同一でなければならない（前提 P1・P3・P4）。
      // 添字を固定で 0 と 1 に書くと、ステージ2 で敗北した遠征
      //（提示は1回だけ＝ステージ1 の後）で誤って落ちる。
      for (let j = 0; j <= cutIndex; j++) {
        expect(ablated.stageOutcomes[j]).toEqual(pair.actual.stageOutcomes[j]);
      }
      // 差し替えた提示の直後のステージは、少なくとも実行されていれば比較対象になる
      expect(cutIndex).toBeGreaterThanOrEqual(0);
    });
  });

  it('抜いた腕の獲得枚数は実ランより1枚少ない', () => {
    const pair = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((seed) => runCounterfactual({ ...base, seed }))
      .find((p) => p.isClean && p.ablated);
    if (!pair?.ablated) throw new Error('クリーンな組が1つも無い');
    expect(pair.ablated.acquired.length).toBe(pair.actual.acquired.length - 1);
  });

  it('差し替えた札は最後の提示に含まれ、実ランで取った札とは異なる', () => {
    const pairs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((seed) => runCounterfactual({ ...base, seed }))
      .filter((p) => p.swapped !== undefined);
    expect(pairs.length).toBeGreaterThan(0);

    pairs.forEach((pair) => {
      expect(pair.lastOffer).toContain(pair.swappedTo);
      expect(pair.swappedTo).not.toBe(pair.lastTaken);
      // 差し替えた腕の獲得枚数は実ランと同じ（抜いたのではなく替えた）
      const swapped = pair.swapped;
      if (!swapped) throw new Error('filter 済みなので存在する');
      expect(swapped.acquired.length).toBe(pair.actual.acquired.length);
    });
  });

  it('一度も獲得しない戦略では ablated も swapped も undefined', () => {
    const pair = runCounterfactual({ ...base, seed: 1, acquire: noAcquire });
    expect(pair.ablated).toBeUndefined();
    expect(pair.swapped).toBeUndefined();
    expect(pair.lastTaken).toBeUndefined();
    expect(pair.isClean).toBe(false);
  });

  it('同じ入力を2度実行すると完全に同じ結果になる（決定性）', () => {
    const a = runCounterfactual({ ...base, seed: 7 });
    const b = runCounterfactual({ ...base, seed: 7 });
    expect(b).toEqual(a);
  });

  it('再生で提示が増える組は交絡として除外される（isClean=false）', () => {
    // **このテストは `isClean` の `noExtraOffers` 節を守る唯一のテストである。**
    // heavy プリセットはステージ2 で敗北することがあり（40シード中7回）、
    // そのとき最後の獲得はステージ1 後の提示になる。獲得を抜いた再生で
    // ステージ2 に勝ってしまうと、**実ランには存在しなかった2回目の提示**が
    // 現れる。この組を測定に使うと、比較していない選択の差が結果に混ざる。
    //
    // swift プリセットでは 40/40 でステージ1・2 を必勝するため、この経路は
    // 一度も通らない。**プリセットを変えるとこのテストは何も検査しなくなる。**
    const heavy = PRESET_DECKS.heavy?.cards ?? [];
    // 実測で要因が `!noExtraOffers` だと確認済みのシード（2026-09-06）
    const confoundedSeeds = [20, 21, 34, 39, 54];
    confoundedSeeds.forEach((seed) => {
      const pair = runCounterfactual({
        ...base, initialDeck: heavy, seed,
      });
      expect(pair.lastTaken).toBeDefined();
      // **発火要因を要因B（!noExtraOffers）に固定する。**
      // stagesCleared < 2 は「実ランがステージ2 までに敗北した」ことを意味し、
      // そのとき提示は1回しか起きていないので lastOfferIndex 0 は最後の提示であり、
      // `isLastOffer` は必ず true。したがって isClean=false の原因は
      // `noExtraOffers` 以外にありえない。
      //
      // **この2行が無いと、将来この組の発火要因が要因A（!isLastOffer）へ移ったとき、**
      // **テストは緑のまま `noExtraOffers` 節が無防備に戻る**（レビュー指摘 R1）。
      expect(pair.lastOfferIndex).toBe(0);
      expect(pair.actual.stagesCleared).toBeLessThan(2);
      expect(pair.isClean).toBe(false);
    });
  });
});
