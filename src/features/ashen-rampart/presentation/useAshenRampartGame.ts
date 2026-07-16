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
import type { RunState } from '../domain/run/run-state';

/** 戦闘リプレイの tick 間隔（ms） */
export const TICK_INTERVAL_MS = 100;

export const useAshenRampartGame = (rng?: RandomPort) => {
  const rngRef = useRef<RandomPort>(rng ?? new DefaultRandom());
  const [run, setRun] = useState<RunState>(() => startRun(rngRef.current));
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [replayTick, setReplayTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** ユースケース呼び出しを共通のエラーハンドリングで包む */
  const dispatch = useCallback((update: (state: RunState) => RunState) => {
    setRun((current) => {
      try {
        setError(null);
        return update(current);
      } catch (e) {
        setError(e instanceof Error ? e.message : '不明なエラーが発生しました');
        return current;
      }
    });
  }, []);

  const selectCard = useCallback(
    (handIndex: number) => {
      const cardId = run.deck.hand[handIndex];
      if (cardId === undefined) return;
      const card = getCardDefinition(cardId);
      if (card.type === 'spell' || card.type === 'tactic') {
        // 対象指定不要のカードは即時使用
        dispatch((s) => playCard(s, handIndex));
        setSelectedHandIndex(null);
        return;
      }
      // タワー/罠は選択トグル（同じカード再クリックで解除）
      setSelectedHandIndex((cur) => (cur === handIndex ? null : handIndex));
    },
    [run.deck.hand, dispatch]
  );

  const placeAt = useCallback(
    (pos: CellPos) => {
      if (selectedHandIndex === null) return;
      dispatch((s) => playCard(s, selectedHandIndex, pos));
      setSelectedHandIndex(null);
    },
    [selectedHandIndex, dispatch]
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
      dispatch((s) => finishWave(s, rngRef.current));
      setReplayTick(0);
    }
  }, [replayTick, run.phase, run.lastResult, dispatch]);

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
  };
};
