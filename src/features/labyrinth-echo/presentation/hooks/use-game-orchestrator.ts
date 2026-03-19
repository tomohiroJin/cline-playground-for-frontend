/**
 * 迷宮の残響 - GameReducer & useGameOrchestrator
 *
 * GameInner の 20+ useState を useReducer に統合し、
 * 状態遷移を純粋関数で一元管理する。
 * 副作用は useEffect + ChoiceFeedback で分離。
 */
import { useReducer, useMemo, createContext, useContext } from 'react';
import type { Player } from '../../domain/models/player';
import type { DifficultyDef } from '../../domain/models/difficulty';
import type { EndingDef } from '../../domain/models/ending';
import type { LogEntry } from '../../domain/models/game-state';
import type { GameEvent } from '../../events/event-utils';

/** UI フェーズ（プレゼンテーション層固有のフェーズ一覧） */
export type UIPhase =
  | 'title'
  | 'diff_select'
  | 'floor_intro'
  | 'event'
  | 'result'
  | 'gameover'
  | 'victory'
  | 'unlocks'
  | 'titles'
  | 'records'
  | 'settings'
  | 'reset_confirm1'
  | 'reset_confirm2';

/** ステータス変化情報 */
export interface ResChg {
  readonly hp: number;
  readonly mn: number;
  readonly inf: number;
  readonly fl?: string;
}

/** ドレイン情報 */
export interface DrainInfo {
  readonly hp: number;
  readonly mn: number;
}

/** GameReducer の状態型 */
export interface GameReducerState {
  // フェーズ・ナビゲーション
  readonly phase: UIPhase;

  // ゲーム状態
  readonly player: Player | null;
  readonly diff: DifficultyDef | null;
  readonly event: GameEvent | null;
  readonly floor: number;
  readonly step: number;
  readonly usedIds: readonly string[];
  readonly log: readonly LogEntry[];
  readonly chainNext: string | null;
  readonly usedSecondLife: boolean;

  // イベント結果
  readonly resTxt: string;
  readonly resChg: ResChg | null;
  readonly drainInfo: DrainInfo | null;

  // エンディング
  readonly ending: EndingDef | null;
  readonly isNewEnding: boolean;
  readonly isNewDiffClear: boolean;

  // UI 状態
  readonly showLog: boolean;
  readonly lastBought: string | null;
}

/** ゲームアクション（Discriminated Union） */
export type GameAction =
  // ナビゲーション
  | { type: 'START_RUN' }
  | { type: 'NAVIGATE_MENU'; screen: UIPhase }
  | { type: 'BACK_TO_TITLE' }
  | { type: 'TOGGLE_LOG' }
  | { type: 'SET_LAST_BOUGHT'; id: string | null }

  // ゲームフロー（事前計算済みの結果を受け取る）
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyDef; player: Player }
  | { type: 'SET_EVENT'; event: GameEvent }
  | { type: 'APPLY_CHOICE'; player: Player; resTxt: string; resChg: ResChg; drainInfo: DrainInfo | null; logEntry: LogEntry; chainNext: string | null; usedSecondLife: boolean }
  | { type: 'SET_VICTORY'; ending: EndingDef; isNewEnding: boolean; isNewDiffClear: boolean }
  | { type: 'SET_GAME_OVER' }
  | { type: 'ADVANCE_STEP'; event: GameEvent; step: number; usedIds: readonly string[] }
  | { type: 'CHANGE_FLOOR'; floor: number };

/** 初期状態を生成する */
export const createInitialState = (): GameReducerState => ({
  phase: 'title',
  player: null,
  diff: null,
  event: null,
  floor: 1,
  step: 0,
  usedIds: [],
  log: [],
  chainNext: null,
  usedSecondLife: false,
  resTxt: '',
  resChg: null,
  drainInfo: null,
  ending: null,
  isNewEnding: false,
  isNewDiffClear: false,
  showLog: false,
  lastBought: null,
});

/** ゲーム状態の Reducer（純粋関数） */
export const gameReducer = (state: GameReducerState, action: GameAction): GameReducerState => {
  switch (action.type) {
    case 'START_RUN':
      return { ...state, phase: 'diff_select' };

    case 'SELECT_DIFFICULTY':
      return {
        ...state,
        phase: 'floor_intro',
        diff: action.difficulty,
        player: action.player,
        floor: 1,
        step: 0,
        usedIds: [],
        log: [],
        chainNext: null,
        usedSecondLife: false,
        ending: null,
        isNewEnding: false,
        isNewDiffClear: false,
        drainInfo: null,
        resTxt: '',
        resChg: null,
      };

    case 'SET_EVENT':
      return {
        ...state,
        phase: 'event',
        event: action.event,
      };

    case 'APPLY_CHOICE':
      return {
        ...state,
        phase: 'result',
        player: action.player,
        resTxt: action.resTxt,
        resChg: action.resChg,
        drainInfo: action.drainInfo,
        log: [...state.log, action.logEntry],
        chainNext: action.chainNext,
        usedSecondLife: action.usedSecondLife,
      };

    case 'SET_VICTORY':
      return {
        ...state,
        phase: 'victory',
        ending: action.ending,
        isNewEnding: action.isNewEnding,
        isNewDiffClear: action.isNewDiffClear,
      };

    case 'SET_GAME_OVER':
      return { ...state, phase: 'gameover' };

    case 'ADVANCE_STEP':
      return {
        ...state,
        phase: 'event',
        event: action.event,
        step: action.step,
        usedIds: [...action.usedIds],
        drainInfo: null,
      };

    case 'CHANGE_FLOOR':
      return {
        ...state,
        phase: 'floor_intro',
        floor: action.floor,
        step: 0,
      };

    case 'NAVIGATE_MENU':
      return { ...state, phase: action.screen };

    case 'BACK_TO_TITLE':
      return {
        ...createInitialState(),
        showLog: state.showLog,
      };

    case 'TOGGLE_LOG':
      return { ...state, showLog: !state.showLog };

    case 'SET_LAST_BOUGHT':
      return { ...state, lastBought: action.id };

    default:
      return state;
  }
};

/** GameContext の型定義 */
export interface GameContextValue {
  readonly state: GameReducerState;
  readonly dispatch: React.Dispatch<GameAction>;
}

/** GameContext（状態とディスパッチを子コンポーネントに提供） */
export const GameContext = createContext<GameContextValue | null>(null);

/** GameContext を使用するフック */
export const useGameState = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState は GameContext.Provider 内で使用してください');
  return ctx;
};

/** useGameOrchestrator フック — useReducer でゲーム状態を一元管理 */
export const useGameOrchestrator = () => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const contextValue: GameContextValue = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return { state, dispatch, contextValue };
};
