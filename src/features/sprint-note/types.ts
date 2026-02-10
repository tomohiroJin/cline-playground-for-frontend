// ゲームフェーズ（10 状態）
export type Phase =
  | 'TITLE'
  | 'PROJECT_INTRO'
  | 'TEAM_FORMATION'
  | 'GOAL_SELECTION'
  | 'PLANNING'
  | 'DEVELOPMENT'
  | 'RELEASE'
  | 'REVIEW'
  | 'RETROSPECTIVE'
  | 'RESULT';

// ゴール識別子
export type GoalId = 'stability' | 'value' | 'deadline' | 'quality';

// ゴール定義
export type Goal = {
  id: GoalId;
  name: string;
  description: string;
  evaluationAxis: string;
};

// タスクカテゴリ
export type TaskCategory = 'feature' | 'infra' | 'quality' | 'design' | 'debt';

// タスク定義
export type Task = {
  id: string;
  name: string;
  description: string;
  category: TaskCategory;
  effects: {
    productProgress: number;
    qualityScore: number;
    teamTrust: number;
  };
};

// リリース判断
export type ReleaseType = 'full' | 'partial' | 'postpone';

// レビュー結果
export type ReviewResult = {
  userReaction: string;
  stakeholderReaction: string;
  qualityComment: string;
};

// スプリント記録
export type SprintRecord = {
  sprintNumber: number;
  selectedTasks: Task[];
  releaseDecision: ReleaseType;
  selectedImprovement: string;
  reviewResult: ReviewResult;
  progressBefore: number;
};

// 改善アクション定義
export type Improvement = {
  id: string;
  name: string;
  description: string;
  duration: number;
};

// ランク識別子
export type RankId = 'A' | 'B' | 'C' | 'D';

// ランク結果
export type RankResult = {
  rank: RankId;
  rankName: string;
};

// ゲーム状態
export type GameState = {
  currentPhase: Phase;
  selectedGoal: Goal | undefined;
  currentSprint: number;
  teamTrust: number;
  productProgress: number;
  qualityScore: number;
  sprints: SprintRecord[];
  activeImprovements: string[];
};
