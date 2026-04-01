/**
 * S6-8a: ゲーム終了確認ダイアログのモード別メッセージ
 */
import type { GameMode } from './types';

/** ゲーム中断時の確認メッセージをモードに応じて返す */
export const getExitConfirmMessage = (gameMode: GameMode): string => {
  switch (gameMode) {
    case '2v2-local':
      return 'チーム設定がリセットされます';
    case 'story':
      return '進行中のステージが中断されます';
    default:
      return '対戦が中断されます';
  }
};
