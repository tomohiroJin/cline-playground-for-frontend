/**
 * 2P 対戦ユースケース
 * - ローカル 2P 対戦の設定・スコア管理・勝敗判定を担当
 * - 実績・アンロック判定は 2P 対戦では無効
 */
import type { Character, FieldConfig } from '../../core/types';
import type { PlayerSlot } from '../../domain/contracts/input';

/** 2P 対戦の設定 */
export type TwoPlayerConfig = {
  field: FieldConfig;
  winScore: number;
  player1Character: Character;
  player2Character: Character;
};

/** 2P 対戦の状態 */
type TwoPlayerState = {
  scores: { player1: number; player2: number };
  player1Character: Character;
  player2Character: Character;
  winScore: number;
  field: FieldConfig;
};

/**
 * 2P 対戦ユースケース
 */
export class TwoPlayerBattleUseCase {
  private state: TwoPlayerState | undefined;

  /** 対戦を初期化する */
  start(config: TwoPlayerConfig): void {
    this.state = {
      scores: { player1: 0, player2: 0 },
      player1Character: config.player1Character,
      player2Character: config.player2Character,
      winScore: config.winScore,
      field: config.field,
    };
  }

  /** スコアを加算する */
  addScore(playerSlot: PlayerSlot): void {
    if (!this.state) return;
    this.state.scores[playerSlot] += 1;
  }

  /** 勝者を取得する（未決着の場合は undefined） */
  getWinner(): PlayerSlot | undefined {
    if (!this.state) return undefined;
    const { scores, winScore } = this.state;
    if (scores.player1 >= winScore) return 'player1';
    if (scores.player2 >= winScore) return 'player2';
    return undefined;
  }

  /** 現在の状態を取得する */
  getState(): TwoPlayerState {
    if (!this.state) {
      throw new Error('対戦が開始されていません。start() を先に呼び出してください。');
    }
    return this.state;
  }

  /** 実績判定が有効かどうか（2P 対戦では常に無効） */
  isAchievementsEnabled(): boolean {
    return false;
  }
}
