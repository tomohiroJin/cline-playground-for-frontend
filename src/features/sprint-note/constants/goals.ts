import { Goal, GameState } from '../types';

// ゴール別スコア算出関数
const evaluateStability = (state: GameState): number =>
  Math.round(state.qualityScore * 0.6 + state.teamTrust * 0.4);

const evaluateValue = (state: GameState): number =>
  Math.round(state.productProgress * 0.6 + state.teamTrust * 0.4);

const evaluateDeadline = (state: GameState): number => {
  // 各スプリントで進捗 +10 以上の回数を集計
  const steadyCount = state.sprints.filter(s => {
    const progressAfter = s.selectedTasks.reduce(
      (sum, t) => sum + t.effects.productProgress,
      s.progressBefore
    );
    // リリース判断による減算も考慮
    let adjusted = progressAfter;
    if (s.releaseDecision === 'partial') adjusted -= 5;
    if (s.releaseDecision === 'postpone') adjusted -= 10;
    const increment = adjusted - s.progressBefore;
    return increment >= 10;
  }).length;
  return Math.round(
    state.productProgress * 0.5 + steadyCount * 15 + state.teamTrust * 0.2
  );
};

const evaluateQuality = (state: GameState): number => {
  // quality 系タスク選択回数を集計
  const qualityTaskCount = state.sprints.reduce(
    (count, s) =>
      count + s.selectedTasks.filter(t => t.category === 'quality').length,
    0
  );
  return Math.round(
    state.qualityScore * 0.5 + qualityTaskCount * 10 + state.teamTrust * 0.2
  );
};

// 4 ゴール定義
export const GOALS: Goal[] = [
  {
    id: 'stability',
    name: '安定稼働',
    description: '障害やバグを抑え、信頼できるプロダクトを届ける。',
    evaluationAxis: '安定性と信頼の積み上げで判断される。',
  },
  {
    id: 'value',
    name: '価値最大化',
    description: 'ユーザーにとっての価値を最大限に引き出す。',
    evaluationAxis: 'プロダクトの充実度と進捗で判断される。',
  },
  {
    id: 'deadline',
    name: '納期死守',
    description: '期限内に約束したものを必ず届ける。',
    evaluationAxis: 'スプリントごとの着実な前進で判断される。',
  },
  {
    id: 'quality',
    name: '品質文化',
    description: '品質と改善の土台を作り、長く走れるチームになる。',
    evaluationAxis: '品質の維持と改善の積み重ねで判断される。',
  },
];

// ゴール ID からスコアを算出する
export const evaluateGoalScore = (state: GameState, goalId: string): number => {
  switch (goalId) {
    case 'stability':
      return evaluateStability(state);
    case 'value':
      return evaluateValue(state);
    case 'deadline':
      return evaluateDeadline(state);
    case 'quality':
      return evaluateQuality(state);
    default:
      return 0;
  }
};
