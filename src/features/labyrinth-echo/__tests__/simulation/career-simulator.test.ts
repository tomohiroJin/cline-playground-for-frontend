import { simulateCareer } from '../../simulation/career-simulator';
import { CAREFUL_POLICY, LORE_POLICY } from '../../simulation/policies';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { REVENANT_EVENTS } from '../../events/revenant-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';

const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const fx = computeFx([]);
const easy = DIFFICULTY.find(d => d.id === 'easy')!;
const normal = DIFFICULTY.find(d => d.id === 'normal')!;

describe('simulateCareer', () => {
  it('easy×careful は19脱出で真ルート解禁（セーフティネット1/脱出）', () => {
    const r = simulateCareer({ difficulty: easy, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(r.unlocked).toBe(true);
    expect(r.escapesToUnlock).toBe(19);
    expect(r.finalDepth).toBe(6);
    expect(r.finalFragments).toBe(19);
  });

  it('timeline は runs と同数で depth/断片は非減少', () => {
    const r = simulateCareer({ difficulty: normal, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 2, maxRuns: 200 });
    expect(r.timeline.length).toBe(r.runsToUnlock);
    for (let i = 1; i < r.timeline.length; i++) {
      expect(r.timeline[i].depth).toBeGreaterThanOrEqual(r.timeline[i - 1].depth);
      expect(r.timeline[i].fragmentCount).toBeGreaterThanOrEqual(r.timeline[i - 1].fragmentCount);
    }
  });

  it('escapes + deaths == runs', () => {
    const r = simulateCareer({ difficulty: normal, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 3, maxRuns: 200 });
    expect(r.escapesToUnlock + r.deathsToUnlock).toBe(r.runsToUnlock);
  });

  it('legacyUnlocks は5件記録され runIndex 昇順（先人完収集の順）', () => {
    const r = simulateCareer({ difficulty: easy, fx, policy: LORE_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(r.legacyUnlocks.length).toBe(5);
    for (let i = 1; i < r.legacyUnlocks.length; i++) {
      expect(r.legacyUnlocks[i].runIndex).toBeGreaterThanOrEqual(r.legacyUnlocks[i - 1].runIndex);
    }
  });

  it('maxRuns 到達で未解禁なら unlocked=false（censored）', () => {
    const abyss = DIFFICULTY.find(d => d.id === 'abyss')!;
    const r = simulateCareer({ difficulty: abyss, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 5 });
    expect(r.unlocked).toBe(false);
    expect(r.runsToUnlock).toBe(5);
  });
});
