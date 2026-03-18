/**
 * アプリケーション層 - 統一エクスポート
 *
 * 各ユースケースの関数と型をこのファイルから一括インポート可能にする。
 */

// ゲーム初期化
export { executeStartGame } from './start-game';
export type { StartGameInput, StartGameDeps, StartGameOutput } from './start-game';

// 回答処理
export { executeAnswerQuestion } from './answer-question';
export type { AnswerQuestionInput, AnswerQuestionDeps, AnswerQuestionOutput } from './answer-question';

// イベント進行
export { executeAdvanceEvent } from './advance-event';
export type { AdvanceEventInput, AdvanceEventDeps, AdvanceEventOutput } from './advance-event';

// スプリント終了
export { executeFinishSprint } from './finish-sprint';
export type { FinishSprintInput, FinishSprintOutput } from './finish-sprint';

// セーブ/ロード
export { executeSaveGame, executeLoadGame, executeBuildSaveState } from './save-load-game';
export type {
  SaveLoadDeps,
  LoadGameResult,
  BuildSaveStateInput,
} from './save-load-game';
