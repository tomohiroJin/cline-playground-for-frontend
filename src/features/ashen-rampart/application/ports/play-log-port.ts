/**
 * 灰燼の城壁 - 行動ログポート（スキーマ v2）
 *
 * 反復0の教訓により、記録する項目はすべて判定に使う。
 * 判定に使わない項目は記録しない（設計書 §11 ログスキーマ v2）。
 */

/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 1;

export type PlayLogEventBody =
  | {
      kind: 'run_started';
      runId: string;
      iteration: number;
      seed: number;
      /** 使用したデッキのカードID列（判定項目2「使われなかったカード種」の分母） */
      deckCards: string[];
    }
  | { kind: 'card_drawn'; runId: string; cardId: string; tick: number }
  | { kind: 'card_played'; runId: string; cardId: string; tick: number; mana: number; x?: number; y?: number }
  | { kind: 'card_discarded_overflow'; runId: string; cardId: string; tick: number }
  | { kind: 'wave_preview_shown'; runId: string; tick: number; content: string }
  | { kind: 'reactivated'; runId: string; tick: number }
  | { kind: 'paused'; runId: string; tick: number }
  | { kind: 'resumed'; runId: string; tick: number }
  | { kind: 'run_ended'; runId: string; outcome: 'won' | 'lost'; tick: number; handRemaining: string[] }
  | { kind: 'run_note'; runId: string; text: string };

export type PlayLogEvent = PlayLogEventBody & { at: number };

export interface PlayLogExport {
  version: number;
  events: PlayLogEvent[];
}

export interface PlayLogPort {
  record(event: PlayLogEventBody): void;
  exportAll(): PlayLogExport;
}

/** ラン識別子を生成する（決定性は不要。ドメイン乱数とは無関係） */
export const createRunId = (): string =>
  `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
