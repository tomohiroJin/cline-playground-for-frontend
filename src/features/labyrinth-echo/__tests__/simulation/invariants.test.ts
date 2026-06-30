import { checkCareer, checkRun, checkSurvivalMonotonic, checkEndingCoverage } from '../../simulation/invariants';
import type { CareerResult } from '../../simulation/career-simulator';
import type { RunResult } from '../../simulation/run-simulator';
import { simulateCareer } from '../../simulation/career-simulator';
import { CAREFUL_POLICY } from '../../simulation/policies';
import { EV } from '../../events/event-data';
import { ECHO_EVENTS } from '../../events/echo-events';
import { REVENANT_EVENTS } from '../../events/revenant-events';
import { DIFFICULTY } from '../../domain/constants/difficulty-defs';
import { computeFx } from '../../domain/services/unlock-service';

const EVENTS = [...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS];
const fx = computeFx([]);
const easy = DIFFICULTY.find(d => d.id === 'easy')!;

const baseStep = (over: Partial<import('../../simulation/career-simulator').CareerStep> = {}) => ({
  runIndex: 1, survived: true, cause: 'escape', floorReached: 5,
  depth: 1, fragmentCount: 1, fragsReadThisRun: 0, safetyNetGranted: true, ...over,
});

describe('checkCareer 実シムでは違反0件', () => {
  it('easy×careful キャリアは違反なし', () => {
    const career = simulateCareer({ difficulty: easy, fx, policy: CAREFUL_POLICY, events: EVENTS, careerSeed: 1, maxRuns: 100 });
    expect(checkCareer(career)).toEqual([]);
  });
});

describe('checkCareer 故意の不正を検出', () => {
  it('depth が 6 を超えたら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 7, finalFragments: 1, timeline: [baseStep({ depth: 7 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'depth_max')).toBe(true);
  });

  it('断片数が19を超えたら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 6, finalFragments: 20, timeline: [baseStep({ fragmentCount: 20 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'fragment_max')).toBe(true);
  });

  it('depth が減少したら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 2, escapesToUnlock: 2, deathsToUnlock: 0,
      finalDepth: 1, finalFragments: 2,
      timeline: [baseStep({ runIndex: 1, depth: 2 }), baseStep({ runIndex: 2, depth: 1 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'depth_monotonic')).toBe(true);
  });

  it('escapes+deaths != runs なら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 5, escapesToUnlock: 2, deathsToUnlock: 2,
      finalDepth: 2, finalFragments: 2, timeline: [baseStep()], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'run_count')).toBe(true);
  });

  it('真ルート解禁なのに depth<6 or 断片<19 なら error', () => {
    const bad: CareerResult = {
      unlocked: true, runsToUnlock: 1, escapesToUnlock: 1, deathsToUnlock: 0,
      finalDepth: 5, finalFragments: 10, timeline: [baseStep({ depth: 5, fragmentCount: 10 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'true_route_condition')).toBe(true);
  });

  it('断片数が減少したら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 2, escapesToUnlock: 2, deathsToUnlock: 0,
      finalDepth: 3, finalFragments: 2,
      timeline: [baseStep({ runIndex: 1, fragmentCount: 3 }), baseStep({ runIndex: 2, fragmentCount: 2 })], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'fragment_monotonic')).toBe(true);
  });

  it('escapes > runs なら error', () => {
    const bad: CareerResult = {
      unlocked: false, runsToUnlock: 2, escapesToUnlock: 3, deathsToUnlock: 0,
      finalDepth: 3, finalFragments: 5, timeline: [baseStep()], legacyUnlocks: [],
    };
    expect(checkCareer(bad).some(v => v.rule === 'escapes_le_runs')).toBe(true);
  });
});

describe('checkRun', () => {
  it('正常なrunは違反なし', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r)).toEqual([]);
  });
  it('floorReached が MAX_FLOOR 超過で error', () => {
    const r: RunResult = { survived: true, floorReached: 9, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r).some(v => v.rule === 'floor_range')).toBe(true);
  });
  it('未知の endingId で error', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'nonexistent_ending', cause: 'escape', events: 10, fragmentsRead: [] };
    expect(checkRun(r).some(v => v.rule === 'ending_valid')).toBe(true);
  });
  it('未知の断片IDで error', () => {
    const r: RunResult = { survived: true, floorReached: 5, endingId: 'perfect', cause: 'escape', events: 10, fragmentsRead: ['f_bogus'] };
    expect(checkRun(r).some(v => v.rule === 'fragment_valid')).toBe(true);
  });
  it('未知の cause で error', () => {
    const r: RunResult = { survived: false, floorReached: 3, endingId: null, cause: 'unknown_cause', events: 1, fragmentsRead: [] };
    expect(checkRun(r).some(v => v.rule === 'cause_valid')).toBe(true);
  });
});

describe('checkSurvivalMonotonic', () => {
  it('単調減少なら違反なし', () => {
    expect(checkSurvivalMonotonic([{ label: 'easy', rate: 1 }, { label: 'normal', rate: 0.8 }, { label: 'hard', rate: 0.1 }])).toEqual([]);
  });
  it('途中で増加したら survival_monotonic 違反を warn で報告する', () => {
    const violations = checkSurvivalMonotonic([{ label: 'easy', rate: 0.5 }, { label: 'normal', rate: 0.8 }]);
    // 統計的傾向違反は warn（CIを落とさない）として報告されることを確認
    expect(violations.some(v => v.rule === 'survival_monotonic')).toBe(true);
    expect(violations.find(v => v.rule === 'survival_monotonic')?.severity).toBe('warn');
  });
});

describe('checkEndingCoverage', () => {
  it('未到達ENDがあれば warn（ending_unreached）で報告する', () => {
    const v = checkEndingCoverage([
      { id: 'standard', reachCount: 50 },
      { id: 'madness', reachCount: 0 },
    ]);
    expect(v.some(x => x.rule === 'ending_unreached' && x.severity === 'warn')).toBe(true);
    expect(v.find(x => x.rule === 'ending_unreached')?.detail).toContain('madness');
  });

  it('全ENDが到達済みなら違反なし', () => {
    expect(checkEndingCoverage([{ id: 'standard', reachCount: 5 }, { id: 'perfect', reachCount: 2 }])).toEqual([]);
  });
});
