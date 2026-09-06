/**
 * 灰燼の城壁 - 遠征の完全再生（反復6・設計書 §4.4 / §10.2）
 *
 * 反復5 の判定記録は、初版の因果の主張を**3ランを完全に再生して
 * 反実仮想を実測すること**で覆した（勝敗・決着 tick・unit_lost の座標まで一致）。
 * 遠征でも同じことができなければ、反復6 の判定記録は推論しか書けない。
 */
import { greedyStrategy, simulateRun } from '../../domain/combat/run-simulation';
import { PRESET_DECKS } from '../../domain/cards/card-pool';
import { startExpedition, startStage } from '../use-cases/start-expedition';
import { currentStage } from '../../domain/expedition/expedition-state';
import { simulateExpedition, demandAwareAcquire } from './expedition-simulation';

const preset = PRESET_DECKS.swift.cards;

describe('遠征の完全再生', () => {
  it('同じシード・同じ戦略なら、決着tick・勝敗・残ライフまで完全に一致する', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const args = { initialDeck: preset, seed, strategy: greedyStrategy, acquire: demandAwareAcquire };
      expect(simulateExpedition(args)).toEqual(simulateExpedition(args));
    }
  });

  // 注: 徴発は Task 5 で到達不能になったため、操作列に choose-levy は含めない。
  it('獲得の選択を記録しておけば、その選択列から遠征を再生できる', () => {
    const seed = 7;
    // 1回目: 戦略に選ばせ、選択列を記録する
    const original = simulateExpedition({ initialDeck: preset, seed, strategy: greedyStrategy, acquire: demandAwareAcquire });

    // 2回目: 記録した選択列をそのまま再生する（戦略ではなく記録から選ぶ）
    let index = 0;
    const replayAcquire = (offer: readonly string[]): string | undefined => {
      const picked = original.acquired[index++];
      return picked !== undefined && offer.includes(picked) ? picked : undefined;
    };
    const replayed = simulateExpedition({ initialDeck: preset, seed, strategy: greedyStrategy, acquire: replayAcquire });

    expect(replayed.acquired).toEqual(original.acquired);
    expect(replayed.stageOutcomes).toEqual(original.stageOutcomes);
    expect(replayed.outcome).toBe(original.outcome);
    expect(replayed.lifeLeft).toBe(original.lifeLeft);
  });

  it('ステージ単体でも、同じ遠征状態からは同じランになる', () => {
    const exp = startExpedition(preset, 3);
    const stage = currentStage(exp)!;
    const first = simulateRun(startStage(exp), greedyStrategy, stage.map);
    const second = simulateRun(startStage(exp), greedyStrategy, stage.map);
    expect(second.ticks).toBe(first.ticks);
    expect(second.outcome).toBe(first.outcome);
    expect(second.lifeLeft).toBe(first.lifeLeft);
    // 盤面の最終状態まで一致する（座標レベルの再生可能性）
    expect(second.finalState.units.map((u) => u.pos)).toEqual(
      first.finalState.units.map((u) => u.pos)
    );
  });

  it('獲得した札が違えば結果も違いうる（再生が自明に成立しているのではない）', () => {
    // すべてのシードで結果が同じなら「再生できた」ことに意味が無い。
    // 獲得を変えると結果が動くシードが存在することを先に示す。
    let differing = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const base = { initialDeck: preset, seed, strategy: greedyStrategy };
      const withDemand = simulateExpedition({ ...base, acquire: demandAwareAcquire });
      const withNone = simulateExpedition({ ...base, acquire: () => undefined });
      if (
        withDemand.outcome !== withNone.outcome ||
        withDemand.stagesCleared !== withNone.stagesCleared ||
        withDemand.lifeLeft !== withNone.lifeLeft
      ) {
        differing++;
      }
    }
    console.log(`獲得の有無で結果が動いたシード: ${differing}/20`);
    expect(differing).toBeGreaterThan(0);
  });
});
