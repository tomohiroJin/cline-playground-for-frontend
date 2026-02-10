import { useReducer, useCallback } from 'react';
import { GameState, Goal, Task, ReleaseType, SprintRecord } from '../types';
import { createInitialGameState, MAX_SPRINT } from '../constants/game-config';
import {
  applyTaskEffects,
  applyReleaseEffects,
  applyProgressBonus,
  getUserReview,
  getStakeholderReview,
} from '../utils/game-logic';
import { QUALITY_COMMENT } from '../constants/texts';

// ゲームアクション型定義
export type GameAction =
  | { type: 'ADVANCE_PHASE' }
  | { type: 'SELECT_GOAL'; goal: Goal }
  | { type: 'SELECT_TASKS'; tasks: Task[] }
  | { type: 'SELECT_RELEASE'; releaseType: ReleaseType }
  | { type: 'SELECT_IMPROVEMENT'; improvementId: string }
  | { type: 'RESTART' };

// ゲームリデューサー
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ADVANCE_PHASE': {
      switch (state.currentPhase) {
        case 'TITLE':
          return { ...state, currentPhase: 'PROJECT_INTRO' };
        case 'PROJECT_INTRO':
          return { ...state, currentPhase: 'TEAM_FORMATION' };
        case 'TEAM_FORMATION':
          return { ...state, currentPhase: 'GOAL_SELECTION' };
        case 'DEVELOPMENT':
          return { ...state, currentPhase: 'RELEASE' };
        case 'REVIEW':
          return { ...state, currentPhase: 'RETROSPECTIVE' };
        case 'RETROSPECTIVE':
          // Sprint 3 → RESULT、それ以外 → 次スプリントの PLANNING
          if (state.currentSprint >= MAX_SPRINT) {
            return { ...state, currentPhase: 'RESULT' };
          }
          return {
            ...state,
            currentPhase: 'PLANNING',
            currentSprint: state.currentSprint + 1,
            activeImprovements: [], // 新スプリント開始時にリセット
          };
        default:
          return state;
      }
    }

    case 'SELECT_GOAL': {
      return {
        ...state,
        selectedGoal: action.goal,
        currentPhase: 'PLANNING',
      };
    }

    case 'SELECT_TASKS': {
      // プランニング開始時の progressBefore を記録
      const progressBefore = state.productProgress;

      // タスク効果を適用
      const updatedState = applyTaskEffects(state, action.tasks);

      // SprintRecord を作成（部分的。リリース判断以降で更新）
      const newRecord: SprintRecord = {
        sprintNumber: state.currentSprint,
        selectedTasks: action.tasks,
        releaseDecision: 'full', // 仮の値。SELECT_RELEASE で更新
        selectedImprovement: '',
        reviewResult: {
          userReaction: '',
          stakeholderReaction: '',
          qualityComment: '',
        },
        progressBefore,
      };

      return {
        ...updatedState,
        currentPhase: 'DEVELOPMENT',
        sprints: [...state.sprints, newRecord],
      };
    }

    case 'SELECT_RELEASE': {
      // リリース効果を適用
      const afterRelease = applyReleaseEffects(state, action.releaseType);

      // 進捗ボーナス/ペナルティ判定
      const currentRecord = state.sprints[state.sprints.length - 1];
      const newTeamTrust = applyProgressBonus(
        afterRelease.teamTrust,
        currentRecord.progressBefore,
        afterRelease.productProgress
      );

      const stateWithTrust = {
        ...afterRelease,
        teamTrust: newTeamTrust,
      };

      // レビュー結果を生成
      const userReaction = getUserReview(stateWithTrust, action.releaseType);
      const stakeholderReaction = getStakeholderReview(
        stateWithTrust,
        action.releaseType
      );
      const qualityComment =
        action.releaseType === 'full' && stateWithTrust.qualityScore < 40
          ? QUALITY_COMMENT
          : '';

      // SprintRecord を更新
      const updatedSprints = [...stateWithTrust.sprints];
      updatedSprints[updatedSprints.length - 1] = {
        ...updatedSprints[updatedSprints.length - 1],
        releaseDecision: action.releaseType,
        reviewResult: {
          userReaction,
          stakeholderReaction,
          qualityComment,
        },
      };

      return {
        ...stateWithTrust,
        currentPhase: 'REVIEW',
        sprints: updatedSprints,
      };
    }

    case 'SELECT_IMPROVEMENT': {
      // stakeholder_report は即時効果: teamTrust +5
      const trustBonus = action.improvementId === 'stakeholder_report' ? 5 : 0;
      const newTrust = Math.min(100, state.teamTrust + trustBonus);

      // activeImprovements に追加（stakeholder_report 以外は次スプリントで効果発動）
      const newActiveImprovements =
        action.improvementId === 'stakeholder_report'
          ? state.activeImprovements
          : [...state.activeImprovements, action.improvementId];

      // SprintRecord を更新
      const updatedSprints = [...state.sprints];
      updatedSprints[updatedSprints.length - 1] = {
        ...updatedSprints[updatedSprints.length - 1],
        selectedImprovement: action.improvementId,
      };

      return {
        ...state,
        teamTrust: newTrust,
        activeImprovements: newActiveImprovements,
        sprints: updatedSprints,
        // RETROSPECTIVE → 次スプリントへの遷移は ADVANCE_PHASE で行う
      };
    }

    case 'RESTART': {
      return createInitialGameState();
    }

    default:
      return state;
  }
};

// ゲームエンジンフック
export const useGameEngine = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  const advancePhase = useCallback(() => {
    dispatch({ type: 'ADVANCE_PHASE' });
  }, []);

  const selectGoal = useCallback((goal: Goal) => {
    dispatch({ type: 'SELECT_GOAL', goal });
  }, []);

  const selectTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SELECT_TASKS', tasks });
  }, []);

  const selectRelease = useCallback((releaseType: ReleaseType) => {
    dispatch({ type: 'SELECT_RELEASE', releaseType });
  }, []);

  const selectImprovement = useCallback((improvementId: string) => {
    dispatch({ type: 'SELECT_IMPROVEMENT', improvementId });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  return {
    state,
    advancePhase,
    selectGoal,
    selectTasks,
    selectRelease,
    selectImprovement,
    restart,
  };
};
