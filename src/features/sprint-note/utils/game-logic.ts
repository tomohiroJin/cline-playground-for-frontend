import { GameState, Task, ReleaseType, RankId, RankResult } from '../types';
import { PARAM_MIN, PARAM_MAX } from '../constants/game-config';
import { evaluateGoalScore as evaluateGoalScoreFromGoals } from '../constants/goals';
import {
  getImprovementCandidates as getImprovementCandidatesFromImprovements,
} from '../constants/improvements';
import {
  DEVELOPMENT_FLAVOR_TEXTS,
  QUALITY_WARNING_TEXTS,
  FULL_RELEASE_RISK_TEXTS,
  USER_REVIEW_TEXTS,
  STAKEHOLDER_REVIEW_TEXTS,
  RETROSPECTIVE_NARRATIVES,
  PM_RESULT_TEXTS,
  USER_RESULT_TEXTS,
  STAKEHOLDER_RESULT_TEXTS,
  TEAM_RESULT_TEXTS,
} from '../constants/texts';
import { Improvement } from '../types';

// 値を範囲内にクランプする
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

// タスク効果を適用する（改善ボーナス含む）
export const applyTaskEffects = (
  state: GameState,
  tasks: Task[]
): GameState => {
  let { productProgress, qualityScore, teamTrust } = state;

  tasks.forEach((task, index) => {
    let progressBonus = 0;
    let qualityBonus = 0;
    let trustBonus = 0;

    // ボーナスはタスク 1 つ目にのみ適用（二重適用防止）
    if (index === 0) {
      if (state.activeImprovements.includes('improve_process')) {
        progressBonus += 3;
      }
      if (state.activeImprovements.includes('improve_quality')) {
        qualityBonus += 8;
      }
      if (state.activeImprovements.includes('improve_communication')) {
        progressBonus += 2;
        qualityBonus += 2;
        trustBonus += 2;
      }
      if (state.activeImprovements.includes('tech_study')) {
        qualityBonus += 5;
      }
      if (state.activeImprovements.includes('rest_and_recover')) {
        progressBonus += 2;
        qualityBonus += 2;
      }
    }

    productProgress = clamp(
      productProgress + task.effects.productProgress + progressBonus,
      PARAM_MIN,
      PARAM_MAX
    );
    qualityScore = clamp(
      qualityScore + task.effects.qualityScore + qualityBonus,
      PARAM_MIN,
      PARAM_MAX
    );
    teamTrust = clamp(
      teamTrust + task.effects.teamTrust + trustBonus,
      PARAM_MIN,
      PARAM_MAX
    );
  });

  return { ...state, productProgress, qualityScore, teamTrust };
};

// リリース判断効果を適用する
export const applyReleaseEffects = (
  state: GameState,
  releaseType: ReleaseType
): GameState => {
  let { teamTrust, productProgress } = state;

  switch (releaseType) {
    case 'full':
      teamTrust += state.qualityScore >= 50 ? 5 : 2;
      break;
    case 'partial':
      productProgress -= 5;
      break;
    case 'postpone':
      teamTrust -= 5;
      productProgress -= 10;
      break;
  }

  return {
    ...state,
    teamTrust: clamp(teamTrust, PARAM_MIN, PARAM_MAX),
    productProgress: clamp(productProgress, PARAM_MIN, PARAM_MAX),
  };
};

// 進捗ボーナス/ペナルティを計算する
export const applyProgressBonus = (
  teamTrust: number,
  progressBefore: number,
  progressAfter: number
): number => {
  const increment = progressAfter - progressBefore;
  if (increment >= 15) {
    return clamp(teamTrust + 3, PARAM_MIN, PARAM_MAX);
  }
  if (increment < 5) {
    return clamp(teamTrust - 3, PARAM_MIN, PARAM_MAX);
  }
  return teamTrust;
};

// ゴール別スコアを算出する
export const evaluateGoalScore = (
  state: GameState,
  goalId: string
): number => evaluateGoalScoreFromGoals(state, goalId);

// ランクを判定する
export const determineRank = (score: number): RankResult => {
  if (score >= 80) return { rank: 'A', rankName: '上出来' };
  if (score >= 60) return { rank: 'B', rankName: 'まずまず' };
  if (score >= 40) return { rank: 'C', rankName: '課題あり' };
  return { rank: 'D', rankName: '厳しかった' };
};

// 改善アクション候補を選出する
export const getImprovementCandidates = (
  sprint: number,
  state: GameState
): [Improvement, Improvement] | undefined =>
  getImprovementCandidatesFromImprovements(sprint, state);

// 品質警告テキストを取得する
export const getQualityWarning = (qualityScore: number): string => {
  if (qualityScore >= 70) return QUALITY_WARNING_TEXTS.excellent;
  if (qualityScore >= 50) return QUALITY_WARNING_TEXTS.good;
  if (qualityScore >= 30) return QUALITY_WARNING_TEXTS.risky;
  return QUALITY_WARNING_TEXTS.dangerous;
};

// リリースリスクテキストを取得する
export const getFullReleaseRisk = (qualityScore: number): string => {
  if (qualityScore >= 50) return FULL_RELEASE_RISK_TEXTS.safe;
  return FULL_RELEASE_RISK_TEXTS.risky;
};

// ユーザー反応テキスト（レビュー用）を取得する
export const getUserReview = (
  state: GameState,
  releaseDecision: ReleaseType
): string => {
  if (releaseDecision === 'postpone') return USER_REVIEW_TEXTS.postpone;
  if (state.productProgress >= 70) return USER_REVIEW_TEXTS.high;
  if (state.productProgress >= 40) return USER_REVIEW_TEXTS.mid;
  return USER_REVIEW_TEXTS.low;
};

// ステークホルダー反応テキスト（レビュー用）を取得する
export const getStakeholderReview = (
  state: GameState,
  releaseDecision: ReleaseType
): string => {
  if (releaseDecision === 'postpone') return STAKEHOLDER_REVIEW_TEXTS.postpone;
  if (state.teamTrust >= 70) return STAKEHOLDER_REVIEW_TEXTS.high;
  if (state.teamTrust >= 40) return STAKEHOLDER_REVIEW_TEXTS.mid;
  return STAKEHOLDER_REVIEW_TEXTS.low;
};

// 開発フレーバーテキストを取得する
export const getDevelopmentFlavorText = (
  sprint: number,
  qualityScore: number
): string => {
  if (sprint === 1) return DEVELOPMENT_FLAVOR_TEXTS.sprint1;
  if (sprint === 2) {
    return qualityScore >= 50
      ? DEVELOPMENT_FLAVOR_TEXTS.sprint2_high
      : DEVELOPMENT_FLAVOR_TEXTS.sprint2_low;
  }
  return qualityScore >= 50
    ? DEVELOPMENT_FLAVOR_TEXTS.sprint3_high
    : DEVELOPMENT_FLAVOR_TEXTS.sprint3_low;
};

// 振り返りナレーションを取得する
export const getRetrospectiveNarrative = (state: GameState): string => {
  const highProgress = state.productProgress >= 70;
  const highQuality = state.qualityScore >= 50;

  if (highProgress && highQuality) return RETROSPECTIVE_NARRATIVES.both_high;
  if (highProgress && !highQuality)
    return RETROSPECTIVE_NARRATIVES.progress_high_quality_low;
  if (!highProgress && highQuality)
    return RETROSPECTIVE_NARRATIVES.progress_low_quality_high;
  return RETROSPECTIVE_NARRATIVES.both_low;
};

// リザルト 4 視点テキストを取得する
export const getResultTexts = (
  state: GameState,
  rank: RankId
): {
  pmText: string;
  userText: string;
  stakeholderText: string;
  teamText: string;
} => {
  // PM の一言
  const pmText = PM_RESULT_TEXTS[rank];

  // ユーザーの反応
  let userText: string;
  if (state.productProgress >= 70) userText = USER_RESULT_TEXTS.high;
  else if (state.productProgress >= 40) userText = USER_RESULT_TEXTS.mid;
  else userText = USER_RESULT_TEXTS.low;

  // ステークホルダーの態度
  let stakeholderText: string;
  if (state.teamTrust >= 70) stakeholderText = STAKEHOLDER_RESULT_TEXTS.high;
  else if (state.teamTrust >= 40)
    stakeholderText = STAKEHOLDER_RESULT_TEXTS.mid;
  else stakeholderText = STAKEHOLDER_RESULT_TEXTS.low;

  // チームの空気
  let teamText: string;
  if (rank === 'A' || rank === 'B') teamText = TEAM_RESULT_TEXTS.good;
  else if (rank === 'C') teamText = TEAM_RESULT_TEXTS.ok;
  else teamText = TEAM_RESULT_TEXTS.tough;

  return { pmText, userText, stakeholderText, teamText };
};
