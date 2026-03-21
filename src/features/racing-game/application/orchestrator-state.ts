// オーケストレーター状態の型定義と初期化

import type { Player } from '../domain/player/types';
import type { Course } from '../domain/track/types';
import type { DeckState } from '../domain/card/types';
import type { GamePhase, RaceConfig } from '../domain/race/types';
import type { Particle, Spark, Confetti } from '../types';
import type { HighlightTrackerState } from '../domain/highlight/highlight';
import type { RendererPort } from './ports/renderer-port';
import type { AudioPort } from './ports/audio-port';
import type { StoragePort } from './ports/storage-port';
import type { InputPort } from './ports/input-port';
import { createPlayers } from '../domain/player/player-factory';
import { createDeck } from '../domain/card/deck';
import { createTracker } from '../domain/highlight/highlight';

/** オーケストレーター設定 */
export interface GameOrchestratorConfig {
  readonly renderer: RendererPort;
  readonly audio: AudioPort;
  readonly storage: StoragePort;
  readonly input: InputPort;
  readonly raceConfig: RaceConfig;
  readonly course: Course;
  /** プレイヤーの色（Presentation 層から注入） */
  readonly playerColors: readonly [string, string];
  /** プレイヤーの名前（Presentation 層から注入） */
  readonly playerNames: readonly [string, string];
}

/** ドラフトトリガー情報 */
export interface DraftTrigger {
  readonly playerIndex: number;
  readonly lap: number;
}

/** カード効果をプレイヤーに適用する共通ヘルパー */
export const applyCardEffectsToPlayer = (player: Player, deck: { active: readonly { shieldCount?: number }[] }): Player => ({
  ...player,
  activeCards: [...deck.active],
  shieldCount: player.shieldCount + deck.active.reduce((acc, e) => acc + (e.shieldCount ?? 0), 0),
});

/** オーケストレーター状態 */
export interface GameOrchestratorState {
  phase: GamePhase;
  players: Player[];
  particles: Particle[];
  sparks: Spark[];
  confetti: Confetti[];
  shake: number;
  decks: DeckState[];
  highlightTracker: HighlightTrackerState;
  raceStartTime: number;
  countdownStartTime: number;
  winner: string | null;
  paused: boolean;
  engineOn: boolean;
  /** ドラフト待ちキュー */
  draftQueue: DraftTrigger[];
  /** 実施済みドラフトの記録（"playerIndex-lap" 形式） */
  draftedLaps: Set<string>;
  /** 現在ドラフト中のプレイヤーインデックス */
  draftCurrentPlayer: number;
  /** ドラフトの選択インデックス */
  draftSelectedIndex: number;
  /** ドラフトが確定済みか */
  draftConfirmed: boolean;
  /** ドラフトタイマー（秒） */
  draftTimer: number;
  /** ドラフト開始時刻 */
  draftStartTime: number;
}

/** 初期状態の生成 */
export const createInitialState = (config: GameOrchestratorConfig): GameOrchestratorState => {
  const { course, raceConfig, playerColors, playerNames } = config;
  const pts = course.points;
  const startAngle = pts.length >= 2 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0;
  const players = createPlayers(raceConfig.mode, pts[0], startAngle, playerColors, playerNames);

  return {
    phase: 'countdown',
    players,
    particles: [],
    sparks: [],
    confetti: [],
    shake: 0,
    decks: players.map(() => createDeck()),
    highlightTracker: createTracker(players.length),
    raceStartTime: 0,
    countdownStartTime: Date.now(),
    winner: null,
    paused: false,
    engineOn: false,
    draftQueue: [],
    draftedLaps: new Set(),
    draftCurrentPlayer: 0,
    draftSelectedIndex: 1,
    draftConfirmed: false,
    draftTimer: 15,
    draftStartTime: 0,
  };
};
