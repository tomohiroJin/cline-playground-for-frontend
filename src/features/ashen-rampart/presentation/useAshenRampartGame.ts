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
import { stepTick, placeableCells as computePlaceableCells, type PlayerAction } from '../domain/combat/step-tick';
import { buildPlates, plateKeyOf, type PlateModel } from './board-plates';
import { nextWavePreview } from './wave-preview';
import { decideBattleAnnouncement } from './battle-announcement';
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
  /**
   * 集計の真値。`run_tally` の書き出しはこの ref を読む
   *
   * `setTally` はスケジュールされるだけで、決着した tick の**同じコミットでは
   * まだ反映されない**。`run_tally` の effect は同じコミット内で走るため、
   * state だけに頼ると「決着を決めた tick」が丸ごと落ちる。勝ったランの
   * 最終 tick には必ず撃破（`defeat`）が含まれる（`isCleared` の成立条件）ため、
   * この取りこぼしは偶発ではなく systematic だった。
   *
   * 累積の真値を ref に持ち、`setTally` は描画用のミラーに徹させることで、
   * ログの数値と画面の `RunSummary` が必ず一致する。
   */
  const tallyRef = useRef<RunTally>(tally);
  // 能力表示の対象。座標ではなく plateKeyOf の文字列で持つ。設置物が壊れて
  // 消えたときに、次の描画で自動的に対象が失われる（別途クリアする処理が要らない）
  const [inspectedKey, setInspectedKey] = useState<string | null>(null);
  // 決着時に run_tally へ載せる集計用 ref（判定項目2・3）
  const inspectOpensRef = useRef(0);
  const manualDiscardsRef = useRef(0);
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
  /** run_tally を記録済みの runId。1ランにつき1件だけに抑えるためのガード */
  const talliedRunIdRef = useRef<string | null>(null);
  /** 直前に記録した予告の内容。切り替わった tick でだけ記録するためのガード */
  const lastPreviewRef = useRef<string | undefined>(undefined);
  /** 直前に読み上げたウェーブ番号。切り替わった tick でだけ読み上げるためのガード */
  const lastAnnouncedWaveRef = useRef(0);

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

  // 判定用の集計を累積する。events は毎 tick 消えるため tick ごとに足す。
  // accumulateTick は state.events / state.enemies だけを見るため prevState は渡さない
  // （反復3 で配置時に選べたマス数の集計を廃止し、prevState が不要になった）。
  // ただし StrictMode の二重実行を弾くガードとしては prevStateRef を引き続き使う。
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;
    // ref を先に確定させる。この effect は run_tally の effect より前に定義されて
    // いるため、同じコミット内で必ず先に走る（React は effect を定義順に実行する）。
    // 二重計上は上の prevStateRef のガードが防ぐ。
    tallyRef.current = accumulateTick(tallyRef.current, state, PLAINS_MAP);
    setTally(tallyRef.current);
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

  // 支援技術への通知。頻度が低く取り返しがつかない出来事（漏れ・ウェーブ境界）だけを流す。
  // 両方が同じ tick に起きたら漏れを優先する（decideBattleAnnouncement 参照）
  useEffect(() => {
    const decision = decideBattleAnnouncement(state, lastAnnouncedWaveRef.current);
    if (decision) {
      lastAnnouncedWaveRef.current = decision.wave;
      setAnnouncement(decision.text);
      announceUntilRef.current = state.tick + ANNOUNCE_TICKS;
      return;
    }
    if (state.tick >= announceUntilRef.current) setAnnouncement(undefined);
  }, [state]);

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

  /**
   * 決着したランの集計をログへ書き出す
   *
   * 画面にしか出ていなかった数値を、コピー1回で判定者へ渡せるようにする。
   * runId ごとに1回だけ記録する（再レンダーで重複しない）。
   * rejectedTarget は表示用ラベル（RunSummaryView.rejectionDetail の
   * label 文字列）と突き合わせず、tally.rejectionCounts.target という
   * 型のついた生の値を直接使う。表示文言を変えただけで判定項目が
   * 静かに 0 になる事故を避けるため。
   *
   * 読むのは state の `tally` ではなく `tallyRef.current`。決着したコミットでは
   * `setTally` がまだ反映されておらず、state 側は1 tick 古いため
   * （tallyRef の宣言のコメントを参照）。
   */
  useEffect(() => {
    if (state.outcome === 'playing') return;
    if (talliedRunIdRef.current === runId) return;
    talliedRunIdRef.current = runId;
    const settled = tallyRef.current;
    const view = summarize(settled, cards);
    logRef.current.record({
      kind: 'run_tally',
      runId,
      iteration: CURRENT_ITERATION,
      unusedCardIds: view.unusedCardIds,
      manualDiscards: manualDiscardsRef.current,
      inspectOpens: inspectOpensRef.current,
      rejectedTarget: settled.rejectionCounts.target,
      laneAllocation: view.laneAllocation,
      placedOnPath: view.placedOnPath,
      placedOffPath: view.placedOffPath,
      unitsLost: view.unitsLost,
      ravenDefeatAverage: view.ravenDefeatAverage,
      ravenDefeatCount: view.ravenDefeatCount,
      costHistogram: view.costHistogram,
    });
  }, [state.outcome, runId, cards]);

  const placeableCells: CellPos[] = (() => {
    if (selectedIndex === null || isPaused) return [];
    const cardId = state.deck.hand[selectedIndex];
    if (cardId === undefined) return [];
    const card = getCardDefinition(cardId);
    if (placementKindOf(card) === 'none') return [];
    // 設置マスの規則が消え、カード種別ごとに置ける範囲が変わる（砦禁止・魔力炉は経路外限定等）。
    // 判定はドメイン（step-tick の placeableCells）に一元化し、ここでは呼ぶだけにする
    return computePlaceableCells(state, card, PLAINS_MAP);
  })();

  const selectCard = useCallback(
    (handIndex: number) => {
      if (isPaused) return;
      const cardId = state.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      // カードを選んだのに前の能力表示が残っていると誤読するため閉じる
      setInspectedKey(null);
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
      // 手動捨札を記録する（判定項目2「手動で捨てた回数」。run_tally にまとめて載る）
      logRef.current.record({
        kind: 'card_discarded_manual',
        runId,
        cardId: state.deck.hand[handIndex],
        tick: state.tick,
      });
      manualDiscardsRef.current += 1;
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
    [isPaused, runId, state]
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
   * 優先順位: 配置 > 再点火 > 能力表示（設計書 §5.2）。既存の2つを先に評価するため、
   * 能力表示を足しても従来の操作は1つも変わらない。カード選択中は配置を優先する
   * （選択済みという明示的な意図を尊重するため）。選択していないときに限り、
   * そのセルに再点火可能な燠火（cooldownLeft === 0）があれば再点火する。これが無いと
   * 「終盤に手札もマナも尽きても燠火だけは操作対象として残る」という設計（設計書 §4）
   * が UI から到達できない。再点火可能な燠火だけは能力表示を開けないが、
   * クールダウン中の燠火（再点火できない）は他の設置物と同じく能力表示を開ける。
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
      if (emberIndex !== -1) {
        reactivate(emberIndex);
        return;
      }
      const key = plateKeyOf(pos);
      const plate = buildPlates(state).find((candidate) => candidate.key === key);
      if (!plate) {
        setInspectedKey(null);
        return;
      }
      if (inspectedKey === key) {
        setInspectedKey(null);
        return;
      }
      // StrictMode は useState の関数型 updater を二重に呼ぶことがあるため、
      // 記録は updater の外で行う（togglePause と同じ理由）
      logRef.current.record({
        kind: 'inspect_opened',
        runId,
        cardId: plate.cardId,
        tick: state.tick,
      });
      inspectOpensRef.current += 1;
      setInspectedKey(key);
    },
    [isPaused, selectedIndex, state, clickCell, reactivate, inspectedKey, runId]
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
    setInspectedKey(null);
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
      setInspectedKey(null);
      setIsPaused(false);
      setOverflowNotice(undefined);
      setEffects([]);
      setAnnouncement(undefined);
      announceUntilRef.current = 0;
      setRejectionNotice(undefined);
      rejectionUntilRef.current = 0;
      lastPreviewRef.current = undefined;
      lastAnnouncedWaveRef.current = 0;
      tallyRef.current = emptyTally();
      setTally(tallyRef.current);
      inspectOpensRef.current = 0;
      manualDiscardsRef.current = 0;
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

  // 座標ではなく key で持つため、設置物が壊れて消えれば buildPlates の結果に
  // 現れなくなり自動的に undefined へ戻る
  const inspectedPlate: PlateModel | undefined =
    inspectedKey === null
      ? undefined
      : buildPlates(state).find((plate) => plate.key === inspectedKey);

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
    inspectedPlate,
  };
};
