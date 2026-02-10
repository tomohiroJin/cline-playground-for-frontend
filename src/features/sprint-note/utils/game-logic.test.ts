import {
  clamp,
  applyTaskEffects,
  applyReleaseEffects,
  applyProgressBonus,
  evaluateGoalScore,
  determineRank,
  getImprovementCandidates,
  getQualityWarning,
  getFullReleaseRisk,
  getUserReview,
  getStakeholderReview,
  getDevelopmentFlavorText,
  getRetrospectiveNarrative,
  getResultTexts,
} from './game-logic';
import { GameState, Task } from '../types';
import { createInitialGameState } from '../constants/game-config';

// テスト用ヘルパー: 初期状態を生成する
const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  ...createInitialGameState(),
  ...overrides,
});

// テスト用タスク
const featureTask: Task = {
  id: 'test_feature',
  name: 'テスト機能',
  description: 'テスト用',
  category: 'feature',
  effects: { productProgress: 15, qualityScore: -5, teamTrust: 0 },
};

const qualityTask: Task = {
  id: 'test_quality',
  name: 'テスト品質',
  description: 'テスト用',
  category: 'quality',
  effects: { productProgress: 0, qualityScore: 15, teamTrust: 0 },
};

const infraTask: Task = {
  id: 'test_infra',
  name: 'テストインフラ',
  description: 'テスト用',
  category: 'infra',
  effects: { productProgress: 5, qualityScore: 10, teamTrust: 0 },
};

// ── 1. clamp ──
describe('clamp', () => {
  it('範囲内の値はそのまま返す', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('下限を下回る場合は下限を返す', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('上限を上回る場合は上限を返す', () => {
    expect(clamp(120, 0, 100)).toBe(100);
  });

  it('境界値: 下限と同じ値', () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it('境界値: 上限と同じ値', () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

// ── 2. applyTaskEffects ──
describe('applyTaskEffects', () => {
  it('タスク効果が加算される', () => {
    const state = makeState();
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    expect(result.productProgress).toBe(0 + 15 + 0); // 15
    expect(result.qualityScore).toBe(50 - 5 + 15); // 60
  });

  it('値は 0〜100 にクランプされる', () => {
    const state = makeState({ qualityScore: 5 });
    const bigNegTask: Task = {
      ...featureTask,
      effects: { productProgress: 0, qualityScore: -20, teamTrust: 0 },
    };
    const result = applyTaskEffects(state, [bigNegTask, bigNegTask]);
    expect(result.qualityScore).toBe(0);
  });

  it('improve_process ボーナス: productProgress +3（1つ目のタスクにのみ）', () => {
    const state = makeState({ activeImprovements: ['improve_process'] });
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    // featureTask: 15 + 3(ボーナス) = 18, qualityTask: 0
    expect(result.productProgress).toBe(18);
  });

  it('improve_quality ボーナス: qualityScore +8', () => {
    const state = makeState({ activeImprovements: ['improve_quality'] });
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    // featureTask: -5 + 8(ボーナス) = 3, qualityTask: +15
    expect(result.qualityScore).toBe(50 + 3 + 15); // 68
  });

  it('improve_communication ボーナス: 全パラメータ +2', () => {
    const state = makeState({ activeImprovements: ['improve_communication'] });
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    // progress: 15 + 2 + 0 = 17
    // quality: 50 + (-5 + 2) + 15 = 62
    expect(result.productProgress).toBe(17);
    expect(result.qualityScore).toBe(62);
  });

  it('tech_study ボーナス: qualityScore +5', () => {
    const state = makeState({ activeImprovements: ['tech_study'] });
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    // quality: 50 + (-5 + 5) + 15 = 65
    expect(result.qualityScore).toBe(65);
  });

  it('rest_and_recover ボーナス: productProgress +2, qualityScore +2', () => {
    const state = makeState({ activeImprovements: ['rest_and_recover'] });
    const result = applyTaskEffects(state, [featureTask, qualityTask]);
    expect(result.productProgress).toBe(17); // 15 + 2
    expect(result.qualityScore).toBe(62); // 50 + (-5+2) + 15
  });

  it('ボーナスは 1 つ目のタスクにのみ適用（二重適用防止）', () => {
    const state = makeState({ activeImprovements: ['improve_process'] });
    // 両方とも featureTask だと progress: (15+3) + 15 = 33
    const result = applyTaskEffects(state, [featureTask, featureTask]);
    expect(result.productProgress).toBe(33);
  });

  it('teamTrust もタスク効果で変動する', () => {
    const trustTask: Task = {
      ...featureTask,
      effects: { productProgress: 0, qualityScore: 0, teamTrust: 5 },
    };
    const state = makeState();
    const result = applyTaskEffects(state, [trustTask, trustTask]);
    expect(result.teamTrust).toBe(60); // 50 + 5 + 5
  });
});

// ── 3. applyReleaseEffects ──
describe('applyReleaseEffects', () => {
  it('全機能リリース（品質≧50）: teamTrust +5', () => {
    const state = makeState({ qualityScore: 60, teamTrust: 50 });
    const result = applyReleaseEffects(state, 'full');
    expect(result.teamTrust).toBe(55);
    expect(result.productProgress).toBe(state.productProgress);
  });

  it('全機能リリース（品質<50）: teamTrust +2', () => {
    const state = makeState({ qualityScore: 40, teamTrust: 50 });
    const result = applyReleaseEffects(state, 'full');
    expect(result.teamTrust).toBe(52);
  });

  it('一部削ってリリース: teamTrust +0, productProgress -5', () => {
    const state = makeState({ productProgress: 30, teamTrust: 50 });
    const result = applyReleaseEffects(state, 'partial');
    expect(result.teamTrust).toBe(50);
    expect(result.productProgress).toBe(25);
  });

  it('リリース延期: teamTrust -5, productProgress -10', () => {
    const state = makeState({ productProgress: 30, teamTrust: 50 });
    const result = applyReleaseEffects(state, 'postpone');
    expect(result.teamTrust).toBe(45);
    expect(result.productProgress).toBe(20);
  });

  it('値は 0〜100 にクランプされる', () => {
    const state = makeState({ productProgress: 3, teamTrust: 2 });
    const result = applyReleaseEffects(state, 'postpone');
    expect(result.productProgress).toBe(0);
    expect(result.teamTrust).toBe(0);
  });
});

// ── 4. applyProgressBonus ──
describe('applyProgressBonus', () => {
  it('増分≧15: teamTrust +3', () => {
    expect(applyProgressBonus(50, 10, 25)).toBe(53);
  });

  it('増分<5: teamTrust -3', () => {
    expect(applyProgressBonus(50, 10, 12)).toBe(47);
  });

  it('中間（5≦増分<15）: teamTrust ±0', () => {
    expect(applyProgressBonus(50, 10, 20)).toBe(50);
  });

  it('増分ちょうど 15: teamTrust +3', () => {
    expect(applyProgressBonus(50, 0, 15)).toBe(53);
  });

  it('増分ちょうど 5: teamTrust ±0', () => {
    expect(applyProgressBonus(50, 0, 5)).toBe(50);
  });

  it('クランプ処理', () => {
    expect(applyProgressBonus(99, 0, 30)).toBe(100);
    expect(applyProgressBonus(1, 10, 10)).toBe(0);
  });
});

// ── 5. evaluateGoalScore ──
describe('evaluateGoalScore', () => {
  it('stability: qualityScore*0.6 + teamTrust*0.4', () => {
    const state = makeState({ qualityScore: 80, teamTrust: 60 });
    expect(evaluateGoalScore(state, 'stability')).toBe(
      Math.round(80 * 0.6 + 60 * 0.4)
    ); // 72
  });

  it('value: productProgress*0.6 + teamTrust*0.4', () => {
    const state = makeState({ productProgress: 70, teamTrust: 80 });
    expect(evaluateGoalScore(state, 'value')).toBe(
      Math.round(70 * 0.6 + 80 * 0.4)
    ); // 74
  });

  it('deadline: productProgress*0.5 + 着実スプリント数*15 + teamTrust*0.2', () => {
    const state = makeState({
      productProgress: 60,
      teamTrust: 50,
      sprints: [
        {
          sprintNumber: 1,
          selectedTasks: [
            { ...featureTask, effects: { productProgress: 15, qualityScore: 0, teamTrust: 0 } },
            infraTask,
          ],
          releaseDecision: 'full',
          selectedImprovement: '',
          reviewResult: { userReaction: '', stakeholderReaction: '', qualityComment: '' },
          progressBefore: 0,
        },
      ],
    });
    // sprint 1: progressBefore=0, tasks give 15+5=20, full release → no deduction, increment=20≧10 → count=1
    const expected = Math.round(60 * 0.5 + 1 * 15 + 50 * 0.2); // 30+15+10=55
    expect(evaluateGoalScore(state, 'deadline')).toBe(expected);
  });

  it('quality: qualityScore*0.5 + qualityタスク数*10 + teamTrust*0.2', () => {
    const state = makeState({
      qualityScore: 70,
      teamTrust: 60,
      sprints: [
        {
          sprintNumber: 1,
          selectedTasks: [qualityTask, featureTask],
          releaseDecision: 'full',
          selectedImprovement: '',
          reviewResult: { userReaction: '', stakeholderReaction: '', qualityComment: '' },
          progressBefore: 0,
        },
      ],
    });
    // qualityTaskCount=1
    const expected = Math.round(70 * 0.5 + 1 * 10 + 60 * 0.2); // 35+10+12=57
    expect(evaluateGoalScore(state, 'quality')).toBe(expected);
  });
});

// ── 6. determineRank ──
describe('determineRank', () => {
  it('スコア 80 → ランク A', () => {
    expect(determineRank(80)).toEqual({ rank: 'A', rankName: '上出来' });
  });

  it('スコア 100 → ランク A', () => {
    expect(determineRank(100)).toEqual({ rank: 'A', rankName: '上出来' });
  });

  it('スコア 60 → ランク B', () => {
    expect(determineRank(60)).toEqual({ rank: 'B', rankName: 'まずまず' });
  });

  it('スコア 79 → ランク B', () => {
    expect(determineRank(79)).toEqual({ rank: 'B', rankName: 'まずまず' });
  });

  it('スコア 40 → ランク C', () => {
    expect(determineRank(40)).toEqual({ rank: 'C', rankName: '課題あり' });
  });

  it('スコア 59 → ランク C', () => {
    expect(determineRank(59)).toEqual({ rank: 'C', rankName: '課題あり' });
  });

  it('スコア 39 → ランク D', () => {
    expect(determineRank(39)).toEqual({ rank: 'D', rankName: '厳しかった' });
  });

  it('スコア 0 → ランク D', () => {
    expect(determineRank(0)).toEqual({ rank: 'D', rankName: '厳しかった' });
  });
});

// ── 7. getImprovementCandidates ──
describe('getImprovementCandidates', () => {
  it('Sprint 1, qualityScore < 50: improve_process + improve_quality', () => {
    const state = makeState({ qualityScore: 40 });
    const result = getImprovementCandidates(1, state);
    expect(result).toBeDefined();
    expect(result![0].id).toBe('improve_process');
    expect(result![1].id).toBe('improve_quality');
  });

  it('Sprint 1, qualityScore ≧ 50: improve_process + improve_communication', () => {
    const state = makeState({ qualityScore: 50 });
    const result = getImprovementCandidates(1, state);
    expect(result![0].id).toBe('improve_process');
    expect(result![1].id).toBe('improve_communication');
  });

  it('Sprint 2, teamTrust < 40 かつ qualityScore < 50: stakeholder_report + improve_quality', () => {
    const state = makeState({ teamTrust: 30, qualityScore: 40 });
    const result = getImprovementCandidates(2, state);
    expect(result![0].id).toBe('stakeholder_report');
    expect(result![1].id).toBe('improve_quality');
  });

  it('Sprint 2, teamTrust ≧ 40 かつ qualityScore ≧ 50: tech_study + rest_and_recover', () => {
    const state = makeState({ teamTrust: 50, qualityScore: 60 });
    const result = getImprovementCandidates(2, state);
    expect(result![0].id).toBe('tech_study');
    expect(result![1].id).toBe('rest_and_recover');
  });

  it('Sprint 2, teamTrust < 40 かつ qualityScore ≧ 50: stakeholder_report + rest_and_recover', () => {
    const state = makeState({ teamTrust: 30, qualityScore: 60 });
    const result = getImprovementCandidates(2, state);
    expect(result![0].id).toBe('stakeholder_report');
    expect(result![1].id).toBe('rest_and_recover');
  });

  it('Sprint 2, teamTrust ≧ 40 かつ qualityScore < 50: tech_study + improve_quality', () => {
    const state = makeState({ teamTrust: 50, qualityScore: 40 });
    const result = getImprovementCandidates(2, state);
    expect(result![0].id).toBe('tech_study');
    expect(result![1].id).toBe('improve_quality');
  });

  it('Sprint 3: undefined（選択式ではない）', () => {
    const state = makeState();
    expect(getImprovementCandidates(3, state)).toBeUndefined();
  });
});

// ── 8. getQualityWarning ──
describe('getQualityWarning', () => {
  it('qualityScore ≧ 70: excellent', () => {
    expect(getQualityWarning(70)).toContain('自信を持って出せる');
  });

  it('50 ≦ qualityScore < 70: good', () => {
    expect(getQualityWarning(50)).toContain('大きな問題はなさそう');
  });

  it('30 ≦ qualityScore < 50: risky', () => {
    expect(getQualityWarning(30)).toContain('不安が残る');
  });

  it('qualityScore < 30: dangerous', () => {
    expect(getQualityWarning(29)).toContain('かなり荒い');
  });
});

// ── 9. getFullReleaseRisk ──
describe('getFullReleaseRisk', () => {
  it('qualityScore ≧ 50: safe', () => {
    expect(getFullReleaseRisk(50)).toContain('大きな問題はないだろう');
  });

  it('qualityScore < 50: risky', () => {
    expect(getFullReleaseRisk(49)).toContain('信頼に影響する');
  });
});

// ── 10. getUserReview ──
describe('getUserReview', () => {
  it('postpone: 機能が届かなかった', () => {
    const state = makeState({ productProgress: 80 });
    expect(getUserReview(state, 'postpone')).toContain('届かなかった');
  });

  it('productProgress ≧ 70: 使える機能が増えてきた', () => {
    const state = makeState({ productProgress: 70 });
    expect(getUserReview(state, 'full')).toContain('使える機能が増えてきた');
  });

  it('40 ≦ productProgress < 70: 少しずつ形になってきている', () => {
    const state = makeState({ productProgress: 40 });
    expect(getUserReview(state, 'full')).toContain('少しずつ形になってきている');
  });

  it('productProgress < 40: まだ使えるものが少ない', () => {
    const state = makeState({ productProgress: 30 });
    expect(getUserReview(state, 'full')).toContain('まだ使えるものが少ない');
  });
});

// ── 11. getStakeholderReview ──
describe('getStakeholderReview', () => {
  it('postpone: 進捗は大丈夫か', () => {
    const state = makeState({ teamTrust: 80 });
    expect(getStakeholderReview(state, 'postpone')).toContain('進捗は大丈夫か');
  });

  it('teamTrust ≧ 70: 順調だな', () => {
    const state = makeState({ teamTrust: 70 });
    expect(getStakeholderReview(state, 'full')).toContain('順調だな');
  });

  it('40 ≦ teamTrust < 70: 悪くはない', () => {
    const state = makeState({ teamTrust: 40 });
    expect(getStakeholderReview(state, 'full')).toContain('悪くはない');
  });

  it('teamTrust < 40: 心配している', () => {
    const state = makeState({ teamTrust: 30 });
    expect(getStakeholderReview(state, 'full')).toContain('心配している');
  });
});

// ── 12. getDevelopmentFlavorText ──
describe('getDevelopmentFlavorText', () => {
  it('Sprint 1: 初めてのスプリント', () => {
    expect(getDevelopmentFlavorText(1, 50)).toContain('初めてのスプリント');
  });

  it('Sprint 2, qualityScore ≧ 50: 要領がわかってきた', () => {
    expect(getDevelopmentFlavorText(2, 50)).toContain('要領がわかってきた');
  });

  it('Sprint 2, qualityScore < 50: コードの粗さ', () => {
    expect(getDevelopmentFlavorText(2, 49)).toContain('コードの粗さ');
  });

  it('Sprint 3, qualityScore ≧ 50: 走り切ろう', () => {
    expect(getDevelopmentFlavorText(3, 50)).toContain('走り切ろう');
  });

  it('Sprint 3, qualityScore < 50: 積み残しが重い', () => {
    expect(getDevelopmentFlavorText(3, 49)).toContain('積み残しが重い');
  });
});

// ── 13. getRetrospectiveNarrative ──
describe('getRetrospectiveNarrative', () => {
  it('progress ≧ 70 かつ quality ≧ 50: 悪くない仕事', () => {
    const state = makeState({ productProgress: 70, qualityScore: 50 });
    expect(getRetrospectiveNarrative(state)).toContain('悪くない仕事');
  });

  it('progress ≧ 70 かつ quality < 50: 品質には不安', () => {
    const state = makeState({ productProgress: 70, qualityScore: 49 });
    expect(getRetrospectiveNarrative(state)).toContain('品質には不安');
  });

  it('progress < 70 かつ quality ≧ 50: 品質は守れた', () => {
    const state = makeState({ productProgress: 69, qualityScore: 50 });
    expect(getRetrospectiveNarrative(state)).toContain('品質は守れた');
  });

  it('progress < 70 かつ quality < 50: 厳しいスプリント', () => {
    const state = makeState({ productProgress: 69, qualityScore: 49 });
    expect(getRetrospectiveNarrative(state)).toContain('厳しいスプリント');
  });
});

// ── 14. getResultTexts ──
describe('getResultTexts', () => {
  it('ランク A: PM「よくやった」', () => {
    const texts = getResultTexts(makeState(), 'A');
    expect(texts.pmText).toContain('よくやった');
  });

  it('ランク D: PM「厳しい結果」', () => {
    const texts = getResultTexts(makeState(), 'D');
    expect(texts.pmText).toContain('厳しい結果');
  });

  it('productProgress ≧ 70: ユーザー「必要な機能が揃ってきた」', () => {
    const texts = getResultTexts(makeState({ productProgress: 70 }), 'A');
    expect(texts.userText).toContain('必要な機能が揃ってきた');
  });

  it('40 ≦ productProgress < 70: ユーザー「方向性は悪くない」', () => {
    const texts = getResultTexts(makeState({ productProgress: 40 }), 'B');
    expect(texts.userText).toContain('方向性は悪くない');
  });

  it('productProgress < 40: ユーザー「まだ実用には遠い」', () => {
    const texts = getResultTexts(makeState({ productProgress: 30 }), 'D');
    expect(texts.userText).toContain('まだ実用には遠い');
  });

  it('teamTrust ≧ 70: SH「安心して任せられる」', () => {
    const texts = getResultTexts(makeState({ teamTrust: 70 }), 'A');
    expect(texts.stakeholderText).toContain('安心して任せられる');
  });

  it('40 ≦ teamTrust < 70: SH「悪くはない」', () => {
    const texts = getResultTexts(makeState({ teamTrust: 40 }), 'B');
    expect(texts.stakeholderText).toContain('悪くはない');
  });

  it('teamTrust < 40: SH「期待を下回っている」', () => {
    const texts = getResultTexts(makeState({ teamTrust: 30 }), 'D');
    expect(texts.stakeholderText).toContain('期待を下回っている');
  });

  it('ランク A or B: チーム「やりきった」', () => {
    const texts = getResultTexts(makeState(), 'A');
    expect(texts.teamText).toContain('やりきった');
  });

  it('ランク C: チーム「反省点は多い」', () => {
    const texts = getResultTexts(makeState(), 'C');
    expect(texts.teamText).toContain('反省点は多い');
  });

  it('ランク D: チーム「きつかった」', () => {
    const texts = getResultTexts(makeState(), 'D');
    expect(texts.teamText).toContain('きつかった');
  });
});
