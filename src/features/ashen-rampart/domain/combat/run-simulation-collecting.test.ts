import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState } from './combat-state';
import { greedyStrategy, simulateRun, simulateRunCollecting } from './run-simulation';
import { PROVISIONAL_STAGES } from '../expedition/stage-pool';

// `tsconfig.json` は `noUncheckedIndexedAccess` を持たないので添字は要素型を返すが、
// 前提が壊れたときに黙って空ウェーブで走らないよう明示的に落とす
const stage = PROVISIONAL_STAGES.find((s) => s.id === 'prov-t1-a');
if (!stage) throw new Error('前提が壊れています: prov-t1-a が見つかりません');

const runOf = () => {
  const deck = createDeck(
    ['reactor', 'reactor', 'reactor', 'stone-wall', 'stone-wall', 'arrow-tower'],
    () => 0.5
  );
  return createCombatState(deck, stage.waves);
};

describe('simulateRunCollecting', () => {
  it('simulateRun と同じ結果を返す（委譲していることの裏取り）', () => {
    const a = simulateRun(runOf(), greedyStrategy, PLAINS_MAP);
    const b = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    expect(b.outcome).toBe(a.outcome);
    expect(b.ticks).toBe(a.ticks);
    expect(b.lifeLeft).toBe(a.lifeLeft);
    expect(b.cardsPlayed).toBe(a.cardsPlayed);
  });

  it('最後の tick だけでなく、全 tick のイベントを集める', () => {
    const result = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    // 前提: このランでは実際に札が出ている（0 なら比較が空虚になる）
    expect(result.cardsPlayed).toBeGreaterThan(0);
    // finalState.events は最後の tick のぶんだけ。eventLog はそれより多い
    expect(result.eventLog.length).toBeGreaterThan(result.finalState.events.length);
  });

  it('集めたイベントに、札を出した記録が含まれる', () => {
    const result = simulateRunCollecting(runOf(), greedyStrategy, PLAINS_MAP);
    expect(result.eventLog.filter((e) => e.kind === 'played').length).toBe(result.cardsPlayed);
  });
});
