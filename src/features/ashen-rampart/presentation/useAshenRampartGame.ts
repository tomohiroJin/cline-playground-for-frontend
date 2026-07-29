/**
 * 灰燼の城壁 - ゲームループ
 *
 * 時間を進めるのは setInterval だけで、ロジックは一切持たない（設計書 §8.2）。
 * 一時停止はループ制御であり、ドメインの状態ではない（§8.6）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CellPos } from '../domain/board/stage-map';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { CombatState } from '../domain/combat/combat-state';
import { stepTick, canPlaceAt, type PlayerAction } from '../domain/combat/step-tick';
import { nextWavePreview } from './wave-preview';
import { startRun } from '../application/use-cases/start-run';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';
import {
  createRunId,
  CURRENT_ITERATION,
  type PlayLogPort,
} from '../application/ports/play-log-port';

export const TICK_INTERVAL_MS = 100;

/** 溢れ通知を表示し続ける tick 数（0.6秒） */
const OVERFLOW_NOTICE_TICKS = 6;

const PRESET_ID = 'swift';

export const useAshenRampartGame = (seed = 1, playLog?: PlayLogPort) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [runId, setRunId] = useState(() => createRunId());
  const [state, setState] = useState<CombatState>(() => startRun(PRESET_ID, new SeededRandom(seed)));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [overflowNotice, setOverflowNotice] = useState<string | undefined>(undefined);
  const noticeUntilRef = useRef(0);
  const pendingRef = useRef<PlayerAction[]>([]);
  const loggedRunIdsRef = useRef<Set<string>>(new Set());
  /** 直前に記録した予告の内容。切り替わった tick でだけ記録するためのガード */
  const lastPreviewRef = useRef<string | undefined>(undefined);

  // ラン開始の記録（StrictMode の二重マウントでも1回）
  useEffect(() => {
    if (loggedRunIdsRef.current.has(runId)) return;
    loggedRunIdsRef.current.add(runId);
    logRef.current.record({
      kind: 'run_started',
      runId,
      iteration: CURRENT_ITERATION,
      seed,
      presetId: PRESET_ID,
    });
  }, [runId, seed]);

  // ゲームループ。一時停止中と決着後は進めない
  useEffect(() => {
    if (isPaused || state.outcome !== 'playing') return undefined;
    const timer = setInterval(() => {
      setState((current) => {
        const actions = pendingRef.current;
        pendingRef.current = [];
        return stepTick(current, actions, PLAINS_MAP);
      });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, state.outcome]);

  // tick イベントをログと通知へ流す
  useEffect(() => {
    state.events.forEach((event) => {
      if (event.kind === 'draw') {
        logRef.current.record({ kind: 'card_drawn', runId, cardId: event.cardId, tick: state.tick });
      }
      if (event.kind === 'overflow') {
        logRef.current.record({
          kind: 'card_discarded_overflow',
          runId,
          cardId: event.cardId,
          tick: state.tick,
        });
        setOverflowNotice(getCardDefinition(event.cardId).name);
        noticeUntilRef.current = state.tick + OVERFLOW_NOTICE_TICKS;
      }
      if (event.kind === 'played') {
        logRef.current.record({
          kind: 'card_played',
          runId,
          cardId: event.cardId,
          tick: state.tick,
          mana: state.mana,
          x: event.pos?.x,
          y: event.pos?.y,
        });
      }
      if (event.kind === 'ember') {
        logRef.current.record({ kind: 'reactivated', runId, tick: state.tick });
      }
    });
    if (state.tick >= noticeUntilRef.current) setOverflowNotice(undefined);
  }, [state.events, state.tick, state.mana, runId]);

  // 次ウェーブ予告の記録（内容が切り替わった tick でだけ記録する。判定項目3
  // 「予告を見た後に配置を変えたか」の起点になるため、毎 tick 記録してはいけない）
  useEffect(() => {
    const preview = nextWavePreview(state);
    if (lastPreviewRef.current === preview) return;
    lastPreviewRef.current = preview;
    logRef.current.record({
      kind: 'wave_preview_shown',
      runId,
      tick: state.tick,
      content: preview,
    });
  }, [state, runId]);

  // 決着の記録
  useEffect(() => {
    if (state.outcome === 'playing') return;
    logRef.current.record({
      kind: 'run_ended',
      runId,
      outcome: state.outcome,
      tick: state.tick,
      handRemaining: state.deck.hand,
    });
  }, [state.outcome, state.tick, state.deck.hand, runId]);

  const placeableCells: CellPos[] = (() => {
    if (selectedIndex === null || isPaused) return [];
    const cardId = state.deck.hand[selectedIndex];
    if (cardId === undefined) return [];
    const card = getCardDefinition(cardId);
    const kind = placementKindOf(card);
    if (kind === 'none') return [];
    const candidates = kind === 'path' ? PLAINS_MAP.path : PLAINS_MAP.buildSlots;
    return candidates.filter((pos) => canPlaceAt(state, card, pos, PLAINS_MAP));
  })();

  const selectCard = useCallback(
    (handIndex: number) => {
      if (isPaused) return;
      const cardId = state.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      if (placementKindOf(card) === 'none') {
        pendingRef.current.push({ kind: 'play-card', handIndex });
        setSelectedIndex(null);
        return;
      }
      setSelectedIndex((current) => (current === handIndex ? null : handIndex));
    },
    [isPaused, state.deck.hand]
  );

  const clickCell = useCallback(
    (pos: CellPos) => {
      if (isPaused || selectedIndex === null) return;
      pendingRef.current.push({ kind: 'play-card', handIndex: selectedIndex, pos });
      setSelectedIndex(null);
    },
    [isPaused, selectedIndex]
  );

  const reactivate = useCallback(
    (emberIndex: number) => {
      if (isPaused) return;
      pendingRef.current.push({ kind: 'reactivate', emberIndex });
    },
    [isPaused]
  );

  /**
   * 盤面セルへの唯一の入口（UI はこれだけを呼ぶ）
   *
   * カード選択中は配置を優先する（選択済みという明示的な意図を尊重するため）。
   * 選択していないときに限り、そのセルに再点火可能な燠火（cooldownLeft === 0）が
   * あれば再点火する。これが無いと「終盤に手札もマナも尽きても燠火だけは
   * 操作対象として残る」という設計（設計書 §4）が UI から到達できない。
   */
  const interactCell = useCallback(
    (pos: CellPos) => {
      if (isPaused) return;
      if (selectedIndex !== null) {
        clickCell(pos);
        return;
      }
      const emberIndex = state.embers.findIndex(
        (ember) => ember.pos.x === pos.x && ember.pos.y === pos.y && ember.cooldownLeft === 0
      );
      if (emberIndex === -1) return;
      reactivate(emberIndex);
    },
    [isPaused, selectedIndex, state.embers, clickCell, reactivate]
  );

  // StrictMode は useState の関数型 updater を二重に呼び出すことがあるため、
  // ログ記録は updater の外（レンダー時点の isPaused を使うコールバック本体）で行う
  const togglePause = useCallback(() => {
    logRef.current.record({
      kind: isPaused ? 'resumed' : 'paused',
      runId,
      tick: state.tick,
    });
    setIsPaused((current) => !current);
    setSelectedIndex(null);
  }, [isPaused, runId, state.tick]);

  const restart = useCallback(() => {
    pendingRef.current = [];
    setSelectedIndex(null);
    setIsPaused(false);
    setOverflowNotice(undefined);
    lastPreviewRef.current = undefined;
    setState(startRun(PRESET_ID, new SeededRandom(seed)));
    setRunId(createRunId());
  }, [seed]);

  const noteRun = useCallback(
    (text: string) => {
      logRef.current.record({ kind: 'run_note', runId, text });
    },
    [runId]
  );

  const exportLogJson = useCallback(
    () => JSON.stringify(logRef.current.exportAll(), null, 2),
    []
  );

  return {
    state,
    selectedIndex,
    placeableCells,
    isPaused,
    overflowNotice,
    selectCard,
    clickCell,
    reactivate,
    interactCell,
    togglePause,
    restart,
    noteRun,
    exportLogJson,
  };
};
