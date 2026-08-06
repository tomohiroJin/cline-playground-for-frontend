/**
 * 灰燼の城壁 - 行動ログポート（スキーマ v4）
 *
 * 反復0の教訓により、記録する項目はすべて判定に使う。
 * 判定に使わない項目は記録しない（設計書 §11 ログスキーマ v2）。
 */

/** 現在の反復番号。反復を進めるたびに必ず更新する */
export const CURRENT_ITERATION = 5;

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
  | { kind: 'run_note'; runId: string; text: string }
  | { kind: 'inspect_opened'; runId: string; cardId: string; tick: number }
  | { kind: 'card_discarded_manual'; runId: string; cardId: string; tick: number }
  | {
      /**
       * 決着時の集計スナップショット（反復4で追加、反復5でスキーマ v4 へ拡張）
       *
       * 反復1〜3 は集計が判定者へ届かなかった。生イベント列だけを渡しても
       * 判定者が自分で集計し直す必要があったためである。判定に使う数値を
       * ここへ入れ、コピー1回で判定項目が揃うようにする（設計書 §9）。
       */
      kind: 'run_tally';
      runId: string;
      iteration: number;
      /** 判定項目1: 一度も出さなかった札 */
      unusedCardIds: string[];
      /** 判定項目2: 手動で捨てた回数 */
      manualDiscards: number;
      /** 判定項目3: 能力表示を開いた回数 */
      inspectOpens: number;
      /** 判定項目4: 置けない場所をタップした回数 */
      rejectedTarget: number;
      /** 反復3から継続観察する項目 */
      laneAllocation: number[];
      placedOnPath: number;
      placedOffPath: number;
      unitsLost: Record<string, number>;
      ravenDefeatAverage: number;
      ravenDefeatCount: number;
      costHistogram: number[];
      /** 判定項目2: 手札上限で墓地へ落ちた枚数（反復5） */
      overflowCount: number;
      /** ライフ内訳（反復5・設計書 §5.4） */
      lifeLostToOverflow: number;
      lifeLostToLeak: number;
      /** 判定項目6: 最後にカードを出した tick と決着 tick（反復5） */
      lastPlayTick: number;
      endTick: number;
      /** 山札が尽きた tick。0 なら尽きなかった（反復5） */
      drawPileExhaustedTick: number;
    };

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
