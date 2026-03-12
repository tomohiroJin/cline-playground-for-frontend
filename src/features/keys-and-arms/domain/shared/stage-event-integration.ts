/**
 * ステージイベント統合モジュール
 *
 * イベントバスを介して、ステージロジックから Audio/HUD への
 * 通知を疎結合にする。ゲームループ内のホットパスは直接呼び出しを
 * 維持し、非クリティカルなイベント（ステージクリア、スコア加算等）のみ
 * イベントバス経由にする。
 */

import type { GameEventBus, GameEventType } from './game-events';

/** ステージイベント発行ヘルパー */
export interface StageEventEmitter {
  /** スコア加算イベント */
  scoreAdd(points: number, source: string): void;
  /** ステージクリアイベント */
  stageClear(stage: string, bonusPoints: number): void;
  /** ステージ遷移イベント */
  stageTransition(from: string, to: string, subtitle: string): void;
  /** ボス撃破イベント */
  bossDefeat(loop: number, noDamage: boolean): void;
  /** ゲーム完了イベント */
  gameComplete(loop: number): void;
  /** ゲームオーバーイベント */
  gameOver(score: number, highScore: number): void;
}

/** イベントバスからステージイベント発行ヘルパーを作成 */
export function createStageEventEmitter(bus: GameEventBus): StageEventEmitter {
  return {
    scoreAdd(points, source) {
      bus.emit({ type: 'score:add', payload: { points, source } });
    },
    stageClear(stage, bonusPoints) {
      bus.emit({ type: 'stage:clear', payload: { stage, bonusPoints } });
    },
    stageTransition(from, to, subtitle) {
      bus.emit({ type: 'stage:transition', payload: { from, to, subtitle } });
    },
    bossDefeat(loop, noDamage) {
      bus.emit({ type: 'boss:defeat', payload: { loop, noDamage } });
    },
    gameComplete(loop) {
      bus.emit({ type: 'game:complete', payload: { loop } });
    },
    gameOver(score, highScore) {
      bus.emit({ type: 'game:over', payload: { score, highScore } });
    },
  };
}

/** SFX トリガーマッピング型 */
export type SfxTriggerMap = Partial<Record<GameEventType, () => void>>;

/**
 * イベントバスに SFX トリガーを登録
 * 非クリティカルパスの音声（クリアファンファーレ等）をイベント駆動にする。
 * ホットパス（敵撃破音、攻撃音等）は引き続きステージから直接呼び出す。
 */
export function subscribeSfxTriggers(bus: GameEventBus, triggers: SfxTriggerMap): () => void {
  const unsubscribers: Array<() => void> = [];

  for (const [eventType, handler] of Object.entries(triggers)) {
    if (handler) {
      unsubscribers.push(bus.on(eventType as GameEventType, handler));
    }
  }

  // 全購読を一括解除する関数を返す
  return () => unsubscribers.forEach(unsub => unsub());
}

/**
 * HUD トランジションをイベントバス経由で発火するアダプター
 * ステージクリア時のトランジション表示をイベント駆動にする。
 */
export function subscribeTransitionHandler(
  bus: GameEventBus,
  transTo: (text: string, fn: () => void, sub: string) => void,
  stageInitMap: Record<string, () => void>,
): () => void {
  return bus.on('stage:transition', (event) => {
    const { to, subtitle } = event.payload as { from: string; to: string; subtitle: string };
    const initFn = stageInitMap[to];
    if (initFn) {
      transTo(to, initFn, subtitle);
    }
  });
}
