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
import { advanceEffects, type Effect } from './combat-effects';
import { rejectionText } from './rejection-text';
import { accumulateTick, emptyTally, summarize, type RunTally } from './run-summary';
import { startRunWithDeck, createSeed } from '../application/use-cases/start-run';
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

/** 読み上げを保持する tick 数 */
const ANNOUNCE_TICKS = 20;

/** 拒否通知を表示し続ける tick 数（0.6秒） */
const REJECTION_NOTICE_TICKS = 6;

export interface UseAshenRampartGameOptions {
  /** 使用するデッキ。構築 UI から渡す */
  cards: readonly string[];
  /** 固定シード。省略すると毎ラン新しいシードになる */
  seed?: number;
  playLog?: PlayLogPort;
}

export const useAshenRampartGame = ({ cards, seed, playLog }: UseAshenRampartGameOptions) => {
  const logRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [runId, setRunId] = useState(() => createRunId());
  // runSeed は初回レンダー内で解決した値を使う。同じレンダーの中で先に確定させることで、
  // 直後の state 初期化（startRunWithDeck）に同じシードを渡せる（seed ?? createSeed() の二重呼び出しを避ける）。
  const [runSeed, setRunSeed] = useState<number>(() => seed ?? createSeed());
  const [state, setState] = useState<CombatState>(() =>
    startRunWithDeck(cards, new SeededRandom(runSeed))
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [overflowNotice, setOverflowNotice] = useState<string | undefined>(undefined);
  const [effects, setEffects] = useState<readonly Effect[]>([]);
  const [announcement, setAnnouncement] = useState<string | undefined>(undefined);
  const announceUntilRef = useRef(0);
  const [rejectionNotice, setRejectionNotice] = useState<string | undefined>(undefined);
  const rejectionUntilRef = useRef(0);
  const [tally, setTally] = useState<RunTally>(() => emptyTally());
  const prevStateRef = useRef<CombatState>(state);
  // レンダーごとに matchMedia を読まないよう、初期化関数で1度だけ解決する
  const [prefersReducedMotion] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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
      seed: runSeed,
      deckCards: [...cards],
    });
  }, [runId, runSeed, cards]);

  // ゲームループ。一時停止中と決着後は進めない
  useEffect(() => {
    if (isPaused || state.outcome !== 'playing') return undefined;
    const timer = setInterval(() => {
      // StrictMode は useState の関数型 updater を二重に呼び出すことがあるため、
      // ref の読み取り・クリアは updater の外（副作用なし）で行う（togglePause と同じ対策）
      const actions = pendingRef.current;
      pendingRef.current = [];
      setState((current) => stepTick(current, actions, PLAINS_MAP));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPaused, state.outcome]);

  // tick イベントを寿命付きエフェクトへ変換する。
  // events は毎 tick 置き換わるため、この tick のうちに座標へ解決する
  useEffect(() => {
    setEffects((current) =>
      advanceEffects(current, state, PLAINS_MAP, { reducedMotion: prefersReducedMotion })
    );
  }, [state, prefersReducedMotion]);

  // 判定用の集計を累積する。events は毎 tick 消えるため tick ごとに足す
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;
    setTally((current) => accumulateTick(current, prev, state, PLAINS_MAP));
  }, [state]);

  // 拒否理由の通知。同一 tick に複数出た場合は最初の1件だけを出し、
  // 同じ理由が続いた場合は件数を添える（表示欄は1つしかないため）
  useEffect(() => {
    const rejections = state.events.filter(
      (e): e is Extract<typeof e, { kind: 'rejected' }> => e.kind === 'rejected'
    );
    const first = rejections[0];
    if (first) {
      const sameReason = rejections.filter((e) => e.reason === first.reason).length;
      const text = rejectionText(first.reason, state);
      setRejectionNotice(sameReason > 1 ? `${text} ×${sameReason}` : text);
      rejectionUntilRef.current = state.tick + REJECTION_NOTICE_TICKS;
      return;
    }
    if (state.tick >= rejectionUntilRef.current) setRejectionNotice(undefined);
  }, [state]);

  // 支援技術への通知。頻度が低く取り返しがつかない出来事だけを流す
  useEffect(() => {
    const leaks = state.events.filter((e) => e.kind === 'leak').length;
    if (leaks > 0) {
      setAnnouncement(`${leaks}体が砦に到達。残りライフ ${state.life}`);
      announceUntilRef.current = state.tick + ANNOUNCE_TICKS;
      return;
    }
    if (state.tick >= announceUntilRef.current) setAnnouncement(undefined);
  }, [state.events, state.tick, state.life]);

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
   * 手札から1枚捨てる（UI から到達する唯一の入口）
   *
   * 一時停止中・決着後は無反応にする（他の操作と同じ防御）。
   */
  const discardCard = useCallback(
    (handIndex: number) => {
      if (isPaused || state.outcome !== 'playing') return;
      pendingRef.current.push({ kind: 'discard', handIndex });
      // 手札は配列で、捨てると後続の札が前へ詰まる。選択中の札そのものを
      // 捨てたら選択解除、選択中より前を捨てたら選択位置も1つ前へずらさないと、
      // selectedIndex が別の実在カードを指したままになり、盤面クリックで
      // ユーザーが選んだつもりのないカードが置かれてしまう。
      setSelectedIndex((current) => {
        if (current === null) return null;
        if (current === handIndex) return null;
        return current > handIndex ? current - 1 : current;
      });
    },
    [isPaused, state.outcome]
  );

  /**
   * 徴発の候補から1枚選ぶ。UI から到達する唯一の入口（DeckBuilder の validateDeck と同様、判定はドメイン側）
   *
   * 一時停止中・決着後は選んでも無反応にする（LevyChoice 側の disabled 表示と合わせた二重の防御。指摘B）
   */
  const chooseLevy = useCallback(
    (index: number) => {
      if (isPaused || state.outcome !== 'playing') return;
      pendingRef.current.push({ kind: 'choose-levy', optionIndex: index });
    },
    [isPaused, state.outcome]
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

  /**
   * ランを再開始する（同じデッキで、シードだけ変える）
   *
   * デッキを組み直したい場合は呼び出し側（AshenRampartGame）が構築画面に戻すため、
   * ここでは扱わない。引数を省略すると毎回新しいシードになる（`createSeed`）。
   */
  const restart = useCallback(
    (nextSeed?: number) => {
      const seedToUse = nextSeed ?? createSeed();
      pendingRef.current = [];
      setSelectedIndex(null);
      setIsPaused(false);
      setOverflowNotice(undefined);
      setEffects([]);
      setAnnouncement(undefined);
      announceUntilRef.current = 0;
      setRejectionNotice(undefined);
      rejectionUntilRef.current = 0;
      lastPreviewRef.current = undefined;
      setTally(emptyTally());
      setRunSeed(seedToUse);
      const nextState = startRunWithDeck(cards, new SeededRandom(seedToUse));
      setState(nextState);
      prevStateRef.current = nextState;
      setRunId(createRunId());
    },
    [cards]
  );

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
    runSeed,
    levyOptions: state.levyOptions,
    selectedIndex,
    placeableCells,
    isPaused,
    overflowNotice,
    effects,
    announcement,
    rejectionNotice,
    selectCard,
    clickCell,
    reactivate,
    discardCard,
    chooseLevy,
    interactCell,
    togglePause,
    restart,
    noteRun,
    exportLogJson,
    summary: summarize(tally, cards),
  };
};
