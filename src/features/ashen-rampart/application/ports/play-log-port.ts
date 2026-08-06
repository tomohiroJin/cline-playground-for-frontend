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
      /** 使用したデッキのカードID列（反復4の判定項目1「使われなかったカード種」の分母） */
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
  /**
   * 守り手が壊されて盤面から消えた（反復5・最終レビュー指摘1）
   *
   * 反復5の判定項目5（`unitsLost`）はこの反復の看板指標であり、設計書 §8.5 の
   * 反証条件2本（3ラン合計0 なら No／1ランあたり10体以上なら No）の直接の入力である。
   * それが `run_tally` の集計値だけにしか無いと、**間違っていても判定者に
   * 確かめる手段が無い**（前反復で「画面は正しいのに貼り付けた JSON だけが
   * 間違っている」が出荷寸前まで行っている）。生イベントを残し、
   * 判定者が集計値を数え直せるようにする。
   */
  | { kind: 'unit_lost'; runId: string; cardId: string; tick: number; x: number; y: number }
  /** 敵が砦に到達した（漏れ）。`run_tally.lifeLostToLeak` を数え直すための生イベント */
  | { kind: 'enemy_leaked'; runId: string; tick: number }
  | {
      /**
       * 決着時の集計スナップショット（反復4で追加、反復5でスキーマ v4 へ拡張）
       *
       * 反復1〜3 は集計が判定者へ届かなかった。生イベント列だけを渡しても
       * 判定者が自分で集計し直す必要があったためである。判定に使う数値を
       * ここへ入れ、コピー1回で判定項目が揃うようにする（設計書 §9）。
       *
       * **判定項目の番号は必ず反復名とセットで書くこと。** 番号は反復ごとに
       * 振り直されるが、フィールドは積み上がって残るため、番号だけを書くと
       * 別の反復の項目と衝突する（実際に「判定項目2」が反復4の手動の捨札と
       * 反復5の溢れ回数の両方を指す状態になっていた）。
       */
      kind: 'run_tally';
      runId: string;
      iteration: number;
      /** 反復4の判定項目1: 一度も出さなかった札 */
      unusedCardIds: string[];
      /**
       * 反復4の判定項目2 ／ 反復5の判定項目1: 手動で捨てた回数
       *
       * 数えているのは**実際に捨てられた回数**（ドメインの `discarded` イベント）であり、
       * 捨札ボタンを押した回数ではない。生ログの `card_discarded_manual` は同じ
       * イベントから出るため、件数は必ず一致する（反復5・最終レビュー指摘3）。
       */
      manualDiscards: number;
      /** 反復4の判定項目3: 能力表示を開いた回数（反復5では継続観察） */
      inspectOpens: number;
      /** 反復4の判定項目4: 置けない場所をタップした回数 */
      rejectedTarget: number;
      /** 反復3から継続観察する項目 */
      laneAllocation: number[];
      placedOnPath: number;
      placedOffPath: number;
      /** 反復3から継続観察。**反復5では判定項目5**（看板指標。上の `unit_lost` で数え直せる） */
      unitsLost: Record<string, number>;
      ravenDefeatAverage: number;
      ravenDefeatCount: number;
      costHistogram: number[];
      /** 反復5の判定項目2: 手札上限で墓地へ落ちた枚数 */
      overflowCount: number;
      /** ライフ内訳（反復5・設計書 §5.4） */
      lifeLostToOverflow: number;
      lifeLostToLeak: number;
      /** 反復5の判定項目6: 最後にカードを出した tick と決着 tick */
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
