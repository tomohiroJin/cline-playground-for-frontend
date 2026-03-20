/**
 * ゲームループユースケース
 * - 1フレームの更新処理を純粋にオーケストレーション
 * - 副作用はポート経由で実行
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { AudioPort } from '../../domain/contracts/audio';
import type { GameRendererPort } from '../../domain/contracts/renderer';
import type { GameEvent, GameEventDispatcher } from '../../domain/events/game-events';
import type { GameState, GamePhase, FieldConfig } from '../../core/types';
import type { AiBehaviorConfig } from '../../core/story-balance';
import { Scoring, type Score } from '../../domain/services/scoring';
import { EntityFactory } from '../../core/entities';

/** ゲームループの依存関係 */
export type GameLoopDependencies = {
  storage: GameStoragePort;
  audio: AudioPort;
  renderer: GameRendererPort;
  eventDispatcher: GameEventDispatcher;
};

/** プレイヤー入力（R4 の update メソッドで使用予定） */
export type PlayerInput = {
  x: number;
  y: number;
};

/** フレーム更新入力（R4 の update メソッドで使用予定） */
export type GameLoopInput = {
  playerInput: PlayerInput;
  now: number;
  dt: number;
};

/**
 * ゲームループユースケース
 * 現在の useGameLoop.ts のゲームロジック部分をオーケストレーションするクラス。
 * Phase R4 で useGameLoop が薄いラッパーになった際の委譲先。
 */
export class GameLoopUseCase {
  private state: GameState;
  private phase: GamePhase = 'countdown';
  private score: Score;
  private winner: 'player' | 'cpu' | undefined = undefined;

  constructor(
    private readonly deps: GameLoopDependencies,
    private readonly field: FieldConfig,
    private readonly aiConfig: AiBehaviorConfig,
    private readonly winScore: number
  ) {
    this.state = EntityFactory.createGameState(undefined, field);
    this.score = Scoring.create();
  }

  /** 現在のゲーム状態を取得する */
  getState(): GameState {
    return this.state;
  }

  /** 現在のフェーズを取得する */
  getPhase(): GamePhase {
    return this.phase;
  }

  /** 現在のスコアを取得する */
  getScore(): Score {
    return this.score;
  }

  /** 勝者を取得する */
  getWinner(): 'player' | 'cpu' | undefined {
    return this.winner;
  }

  /** プレイ開始（countdown フェーズからのみ遷移可能） */
  startPlaying(): void {
    if (this.phase !== 'countdown') return;
    const prevPhase = this.phase;
    this.phase = 'playing';
    this.deps.eventDispatcher.dispatch({
      type: 'PHASE_CHANGED',
      from: prevPhase,
      to: 'playing',
    });
  }

  /** 一時停止 */
  pause(): void {
    if (this.phase !== 'playing') return;
    const prevPhase = this.phase;
    this.phase = 'paused';
    this.deps.eventDispatcher.dispatch({
      type: 'PHASE_CHANGED',
      from: prevPhase,
      to: 'paused',
    });
  }

  /** 再開 */
  resume(): void {
    if (this.phase !== 'paused') return;
    const prevPhase = this.phase;
    this.phase = 'playing';
    this.deps.eventDispatcher.dispatch({
      type: 'PHASE_CHANGED',
      from: prevPhase,
      to: 'playing',
    });
  }

  /** スコアを加算する */
  addScore(scorer: 'player' | 'cpu'): void {
    this.score = Scoring.addScore(this.score, scorer);

    // 勝利判定
    const winner = Scoring.getWinner(this.score, this.winScore);
    if (winner) {
      this.winner = winner;
      const prevPhase = this.phase;
      this.phase = 'finished';
      this.deps.eventDispatcher.dispatch({
        type: 'PHASE_CHANGED',
        from: prevPhase,
        to: 'finished',
      });
    }
  }

  /**
   * ドメインイベントのハンドリング
   * - 音声再生の委譲
   * - エフェクトのトリガー
   */
  handleEvents(events: ReadonlyArray<GameEvent>): void {
    const { audio } = this.deps;

    for (const event of events) {
      switch (event.type) {
        case 'GOAL_SCORED':
          audio.playGoal();
          break;
        case 'COLLISION':
          audio.playHit(event.speed);
          break;
        case 'WALL_BOUNCE':
          audio.playWall();
          break;
        case 'ITEM_COLLECTED':
          audio.playItem();
          break;
        case 'ITEM_SPAWNED':
          // アイテム出現演出（将来拡張用）
          break;
        case 'PHASE_CHANGED':
          // フェーズ遷移音の再生
          if (event.to === 'playing') {
            audio.playStart();
          }
          break;
        case 'COMBO_INCREASED':
          // コンボ音（将来拡張用）
          break;
        case 'FEVER_ACTIVATED':
          // フィーバー音（将来拡張用）
          break;
        case 'OBSTACLE_DESTROYED':
          audio.playWall();
          break;
        case 'ACHIEVEMENT_UNLOCKED':
          // 実績解除音（将来拡張用）
          break;
      }
    }
  }
}
