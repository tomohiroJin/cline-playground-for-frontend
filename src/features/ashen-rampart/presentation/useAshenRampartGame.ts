/**
 * 灰燼の城壁 - ゲームフック
 *
 * ラン状態の保持・ユースケース呼び出し・戦闘リプレイの進行を担う。
 * ゲームルールは一切持たない（すべて application/use-cases 経由）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RandomPort } from '../application/ports/random-port';
import { DefaultRandom } from '../infrastructure/random/seeded-random';
import { startRun } from '../application/use-cases/start-run';
import { playCard } from '../application/use-cases/play-card';
import { startWave, finishWave } from '../application/use-cases/start-wave';
import { chooseReward } from '../application/use-cases/choose-reward';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { CellPos } from '../domain/board/stage-map';
import type { RunPhase, RunState } from '../domain/run/run-state';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';
import { createRunId } from '../application/ports/play-log-port';
import { LocalStoragePlayLog } from '../infrastructure/play-log/local-storage-play-log';

/** 戦闘リプレイの tick 間隔（ms） */
export const TICK_INTERVAL_MS = 100;

export const useAshenRampartGame = (rng?: RandomPort, playLog?: PlayLogPort) => {
  const rngRef = useRef<RandomPort>(rng ?? new DefaultRandom());
  const playLogRef = useRef<PlayLogPort>(playLog ?? new LocalStoragePlayLog());
  const [run, setRun] = useState<RunState>(() => startRun(rngRef.current));
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [replayTick, setReplayTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string>(() => createRunId());
  const runStartedAtRef = useRef<number>(Date.now());
  const prepStartedAtRef = useRef<number>(Date.now());
  const battleStartedAtRef = useRef<number>(0);
  /** StrictMode のマウント2重実行で run_started が重複しないためのガード */
  const loggedRunIdsRef = useRef<Set<string>>(new Set());

  const record = useCallback((event: PlayLogEventBody) => {
    playLogRef.current.record(event);
  }, []);

  // ラン開始の記録（runId が変わるたびに1回だけ）
  useEffect(() => {
    if (loggedRunIdsRef.current.has(runId)) return;
    loggedRunIdsRef.current.add(runId);
    record({ kind: 'run_started', runId, iteration: 0 });
  }, [runId, record]);

  // フェーズ遷移の記録（準備開始時刻の更新・wave_started・run_ended）
  const prevPhaseRef = useRef<RunPhase>('preparation');
  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (prev === run.phase) return;
    prevPhaseRef.current = run.phase;
    if (run.phase === 'preparation') prepStartedAtRef.current = Date.now();
    if (run.phase === 'combat') {
      battleStartedAtRef.current = Date.now();
      record({
        kind: 'wave_started',
        runId,
        wave: run.waveIndex,
        towerCount: run.board.towers.length,
      });
    }
    if (run.phase === 'result') {
      record({
        kind: 'run_ended',
        runId,
        outcome: run.status === 'won' ? 'won' : 'lost',
        totalSec: (Date.now() - runStartedAtRef.current) / 1000,
      });
    }
  }, [run.phase, run.waveIndex, run.board.towers.length, run.status, runId, record]);

  /**
   * ユースケース呼び出しを共通のエラーハンドリングで包む
   *
   * setState の updater 内で setError を呼ぶと StrictMode の二重実行時に
   * 副作用が二重に走るため、updater は使わずクロージャの run から次状態を計算する。
   *
   * 不変条件: クロージャの run を読むため、1つのハンドラ/エフェクト内で
   * dispatch を2回以上呼ぶと2回目が古い状態を見る。呼び出しは1回までにすること。
   */
  const dispatch = useCallback(
    (update: (state: RunState) => RunState) => {
      try {
        const next = update(run);
        setError(null);
        setRun(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
      }
    },
    [run]
  );

  const selectCard = useCallback(
    (handIndex: number) => {
      const cardId = run.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      if (card.type === 'spell' || card.type === 'tactic') {
        // 対象指定不要のカードは即時使用（成功・失敗を問わず試行として記録）
        record({
          kind: 'prep_action',
          runId,
          wave: run.waveIndex,
          action: card.type === 'spell' ? 'use-spell' : 'use-tactic',
          target: cardId,
          elapsedSec: (Date.now() - prepStartedAtRef.current) / 1000,
        });
        dispatch((s) => playCard(s, handIndex));
        setSelectedHandIndex(null);
        return;
      }
      // タワー/罠は選択トグル（同じカード再クリックで解除）
      setSelectedHandIndex((cur) => (cur === handIndex ? null : handIndex));
    },
    [run.deck.hand, run.waveIndex, runId, dispatch, record]
  );

  const placeAt = useCallback(
    (pos: CellPos) => {
      if (selectedHandIndex === null) return;
      const cardId = run.deck.hand[selectedHandIndex];
      // 選択中の手札インデックスが指すカードが存在しない場合（通常フローでは選択直後に
      // hand が変化しないため到達しないはずだが、防御的に record と dispatch を対称にスキップする）
      if (cardId === undefined) return;
      const type = getCardDefinition(cardId).type;
      record({
        kind: 'prep_action',
        runId,
        wave: run.waveIndex,
        action: type === 'trap' ? 'place-trap' : 'place-tower',
        target: `${cardId}@${pos.x},${pos.y}`,
        elapsedSec: (Date.now() - prepStartedAtRef.current) / 1000,
      });
      dispatch((s) => playCard(s, selectedHandIndex, pos));
      setSelectedHandIndex(null);
    },
    [selectedHandIndex, run.deck.hand, run.waveIndex, runId, dispatch, record]
  );

  const beginWave = useCallback(() => {
    setSelectedHandIndex(null);
    setReplayTick(0);
    dispatch((s) => startWave(s));
  }, [dispatch]);

  const pickReward = useCallback(
    (choiceIndex: number | null) => {
      dispatch((s) => chooseReward(s, choiceIndex, rngRef.current));
    },
    [dispatch]
  );

  const restart = useCallback(() => {
    setSelectedHandIndex(null);
    setReplayTick(0);
    setError(null);
    setRun(startRun(rngRef.current));
    runStartedAtRef.current = Date.now();
    prepStartedAtRef.current = Date.now();
    setRunId(createRunId());
  }, []);

  // 戦闘リプレイ: combat フェーズ中は tick を進める
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return undefined;
    const timer = setInterval(() => {
      setReplayTick((t) => t + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [run.phase, run.lastResult]);

  // リプレイ完走で結果を適用
  useEffect(() => {
    if (run.phase !== 'combat' || !run.lastResult) return;
    if (replayTick >= run.lastResult.ticks.length) {
      record({
        kind: 'wave_ended',
        runId,
        wave: run.waveIndex,
        durationSec: (Date.now() - battleStartedAtRef.current) / 1000,
        leaks: run.lastResult.leaked,
        lifeDelta: -run.lastResult.leaked,
      });
      dispatch((s) => finishWave(s, rngRef.current));
      setReplayTick(0);
    }
  }, [replayTick, run.phase, run.lastResult, run.waveIndex, runId, dispatch, record]);

  const exportLogJson = useCallback(
    () => JSON.stringify(playLogRef.current.exportAll(), null, 2),
    []
  );

  return {
    run,
    selectedHandIndex,
    replayTick,
    error,
    selectCard,
    placeAt,
    beginWave,
    pickReward,
    restart,
    runId,
    exportLogJson,
  };
};
