import {
  noAcquire, cheapestAcquire, demandAwareAcquire, randomAcquireOf, simulateExpedition,
} from './expedition-simulation';
import { greedyStrategy } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';

describe('獲得戦略', () => {
  it('noAcquire は何も選ばない', () => {
    expect(noAcquire(['catapult', 'arrow-tower'], ['anti-air'], [])).toBeUndefined();
  });

  it('cheapestAcquire は最も安い札を選ぶ', () => {
    // 弓兵1 / 弩砲2 / 投石機5
    expect(cheapestAcquire(['catapult', 'ballista', 'arrow-tower'], [], [])).toBe('arrow-tower');
  });

  it('demandAwareAcquire は要求軸を満たす札を選ぶ', () => {
    // anti-air を満たすのは弩砲だけ（弓兵は hitsFlying: false、魔力炉は軸なし）
    expect(demandAwareAcquire(['arrow-tower', 'ballista', 'reactor'], ['anti-air'], [])).toBe('ballista');
  });

  it('demandAwareAcquire は満たす札が無ければ最も安い札に落ちる', () => {
    expect(demandAwareAcquire(['arrow-tower', 'reactor'], ['anti-air'], [])).toBe('reactor');
  });

  it('demandAwareAcquire は複数の軸を満たす札を優先する', () => {
    // 火砲台は mass-answer と heavy-hit の両方、徹甲弩は mass-answer と heavy-hit と anti-air
    const picked = demandAwareAcquire(
      ['cannon-tower', 'piercer', 'arrow-tower'],
      ['anti-air', 'mass-answer', 'heavy-hit'],
      []
    );
    expect(picked).toBe('piercer');
  });

  it('randomAcquireOf は提示の中から選ぶ', () => {
    const pick = randomAcquireOf(() => 0.99)(['a1', 'a2', 'a3'], [], []);
    expect(['a1', 'a2', 'a3']).toContain(pick);
  });

  it('randomAcquireOf は rng が 1 を返しても undefined を返さない（丸めのガード）', () => {
    // Task 8 のレビューで、同じ形の clamp がどのテストでも突かれていないことが
    // 判明したため、ここでは先に検査する。clamp が無いと添字が範囲外になり
    // undefined が返り、「取らない」と区別できなくなる。
    expect(randomAcquireOf(() => 1)(['a1', 'a2', 'a3'], [], [])).toBe('a3');
  });

  it('提示が空なら（候補が尽きていたら）どの戦略も undefined', () => {
    [cheapestAcquire, demandAwareAcquire, randomAcquireOf(() => 0.5)].forEach((strategy) => {
      expect(strategy([], ['anti-air'], [])).toBeUndefined();
    });
  });
});

describe('simulateExpedition', () => {
  const preset = PRESET_DECKS.swift.cards;

  it('遠征を最後まで回して結果を返す', () => {
    const result = simulateExpedition({ initialDeck: preset, seed: 1, strategy: greedyStrategy, acquire: demandAwareAcquire });
    expect(['cleared', 'failed']).toContain(result.outcome);
    expect(result.stageOutcomes.length).toBeGreaterThan(0);
    expect(result.stagesCleared).toBeLessThanOrEqual(3);
  });

  it('踏破したら stagesCleared が 3 で reachedTier3 が true', () => {
    const result = simulateExpedition({ initialDeck: preset, seed: 1, strategy: greedyStrategy, acquire: demandAwareAcquire });
    // 案A（else も検査する）を選ぶ。段階B・D でステージプールやバランスを変えると
    // このシードの決着が cleared から failed へ変わりうる。else を持たない if だけの
    // assertion は、その変化が起きた瞬間に「テストは緑のまま何も検査しない」状態に
    // 静かに堕ちる（レビュー指摘）。
    if (result.outcome === 'cleared') {
      expect(result.stagesCleared).toBe(3);
      expect(result.reachedTier3).toBe(true);
    } else {
      // 敗北なら踏破していないはず。
      expect(result.stagesCleared).toBeLessThan(3);
    }
  });

  it('同じ入力からは同じ結果（決定的）', () => {
    const args = { initialDeck: preset, seed: 5, strategy: greedyStrategy, acquire: demandAwareAcquire };
    const a = simulateExpedition(args);
    const b = simulateExpedition(args);
    expect(a).toEqual(b);
  });

  it('noAcquire ではデッキが増えない', () => {
    const result = simulateExpedition({ initialDeck: preset, seed: 5, strategy: greedyStrategy, acquire: noAcquire });
    expect(result.acquired).toEqual([]);
  });

  it('demandAwareAcquire では、層2 に到達すれば1枚以上獲得している', () => {
    const result = simulateExpedition({ initialDeck: preset, seed: 5, strategy: greedyStrategy, acquire: demandAwareAcquire });
    // 案A（else も検査する）を選ぶ。理由は上の「踏破したら...」と同じ。
    if (result.stagesCleared >= 1) {
      expect(result.acquired.length).toBeGreaterThanOrEqual(1);
    } else {
      // 1ステージも勝てなければ獲得の機会が無い。
      expect(result.acquired).toEqual([]);
    }
  });
});
