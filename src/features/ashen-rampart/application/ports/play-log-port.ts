/**
 * 灰燼の城壁 - 行動ログポート
 *
 * 一人プレイテストのバイアス対策として、プレイ行動を機械記録するための
 * インターフェース。Epic #188 の事前登録判定項目（配置行動・非スキップ率）の
 * データ源になる。記録スキーマは v1（反復0〜3 で固定。変更時は版数を上げる）。
 */

/** 戦闘リプレイの再生速度（1x/2x/4x） */
export type BattleSpeed = 1 | 2 | 4;

/**
 * 現在の反復番号。反復を進めるたびに必ず更新する
 * （ログの反復間比較の基準。ハードコードで散らすとログが反復0〜3で混在してしまう）
 */
export const CURRENT_ITERATION = 0;

/** 準備フェーズの操作種別（現状のゲームに撤去操作は存在しない） */
export type PrepActionKind = 'place-tower' | 'place-trap' | 'use-spell' | 'use-tactic';

/** 記録イベント本体（at はアダプタが記録時に付与する） */
export type PlayLogEventBody =
  | { kind: 'run_started'; runId: string; iteration: number }
  | {
      kind: 'prep_action';
      runId: string;
      wave: number;
      action: PrepActionKind;
      /** カードID（配置はセル座標付き。例: "arrow-tower@2,3"） */
      target: string;
      /** 準備フェーズ開始からの経過秒 */
      elapsedSec: number;
    }
  | { kind: 'wave_started'; runId: string; wave: number; towerCount: number }
  | { kind: 'battle_speed'; runId: string; wave: number; speed: BattleSpeed | 'skip' }
  | {
      kind: 'wave_ended';
      runId: string;
      wave: number;
      /** 実際に観戦していた実時間（秒）。早送り・スキップで短くなる */
      durationSec: number;
      leaks: number;
      /** ウェーブ開始時点のライフ（実値） */
      lifeBefore: number;
      /** ウェーブ終了後のライフ（実値。0未満にはクランプされる） */
      lifeAfter: number;
    }
  | { kind: 'run_ended'; runId: string; outcome: 'won' | 'lost'; totalSec: number }
  | { kind: 'run_note'; runId: string; text: string };

/** 保存されるイベント（記録時刻付き） */
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
