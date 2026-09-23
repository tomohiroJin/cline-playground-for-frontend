/**
 * 遠征フック（反復7 段階1）
 *
 * 画面から勝敗を作るのは重いので、ここでは settleStage に勝敗を直接渡して
 * 遷移とログを検証する。実プレイの結線は AshenRampartGame.test.tsx が守る。
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { resolveEmptyOffer, useExpedition } from './useExpedition';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { presentOffer, completeStage } from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];
const SEED = 42;
const WIN = { won: true, lifeLeft: 10 };
const LOSS = { won: false, lifeLeft: 0 };

const createRecordingLog = (): PlayLogPort & { records: PlayLogEventBody[] } => {
  const records: PlayLogEventBody[] = [];
  return {
    records,
    record: (event) => {
      records.push(event);
    },
    exportAll: () => ({ version: 6, events: [] }),
  };
};

const kinds = (log: { records: PlayLogEventBody[] }, kind: PlayLogEventBody['kind']) =>
  log.records.filter((e) => e.kind === kind);

const setup = (strict = false) => {
  const log = createRecordingLog();
  const wrapper = strict
    ? ({ children }: { children: React.ReactNode }) => <React.StrictMode>{children}</React.StrictMode>
    : undefined;
  const hook = renderHook(() => useExpedition({ cards: swiftCards(), seed: SEED, playLog: log }), {
    wrapper,
  });
  return { log, hook };
};

describe('useExpedition', () => {
  it('開始時にステージ1 の戦闘状態があり、expedition_started と stage_started が1回ずつ記録される', () => {
    const { log, hook } = setup();

    expect(hook.result.current.expedition.phase).toBe('stage');
    expect(hook.result.current.stageCombat?.life).toBe(hook.result.current.expedition.life);
    expect(kinds(log, 'expedition_started')).toHaveLength(1);
    expect(kinds(log, 'expedition_started')[0]).toMatchObject({
      seed: SEED,
      stageIds: hook.result.current.expedition.stages.map((s) => s.id),
    });
    expect(kinds(log, 'stage_started')).toEqual([
      expect.objectContaining({ stageIndex: 0, tier: 1, life: 12 }),
    ]);
  });

  it('StrictMode でも遠征の各イベントは1回だけ記録される', () => {
    const { log, hook } = setup(true);
    act(() => hook.result.current.settleStage(WIN));

    expect(kinds(log, 'expedition_started')).toHaveLength(1);
    expect(kinds(log, 'stage_started')).toHaveLength(1);
    expect(kinds(log, 'card_offered')).toHaveLength(1);
  });

  it('ステージに勝つと獲得の3択が出て card_offered が記録され、戦闘状態は無くなる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));

    const { expedition, stageCombat } = hook.result.current;
    expect(expedition.phase).toBe('offer');
    expect(expedition.offer).toHaveLength(3);
    expect(stageCombat).toBeUndefined();
    expect(kinds(log, 'card_offered')).toEqual([
      expect.objectContaining({ offerIndex: 0, offered: [...expedition.offer] }),
    ]);
  });

  it('3択から選ぶと card_acquired に選ばなかった札も残り、次のステージが始まる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    const offered = [...hook.result.current.expedition.offer];

    act(() => hook.result.current.acquire(offered[1]!));

    expect(kinds(log, 'card_acquired')).toEqual([
      expect.objectContaining({ offerIndex: 0, cardId: offered[1], offered }),
    ]);
    expect(hook.result.current.expedition.stageIndex).toBe(1);
    expect(hook.result.current.expedition.deckCards).toHaveLength(13);
    expect(hook.result.current.stageCombat).toBeDefined();
    expect(kinds(log, 'stage_started')[1]).toMatchObject({ stageIndex: 1, tier: 2, life: 12 });
  });

  it('層1 で敗れると遠征が終わり、層3 未到達として expedition_ended が1回記録される', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(LOSS));

    expect(hook.result.current.expedition.phase).toBe('ended');
    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'failed', stagesCleared: 0, reachedTier3: false }),
    ]);
  });

  it('層3 で敗れても reachedTier3 は true になる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(LOSS));

    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'failed', stagesCleared: 2, reachedTier3: true }),
    ]);
  });

  it('3ステージとも勝つと踏破になる', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));
    act(() => hook.result.current.acquire(hook.result.current.expedition.offer[0]!));
    act(() => hook.result.current.settleStage(WIN));

    expect(hook.result.current.expedition.outcome).toBe('cleared');
    expect(kinds(log, 'expedition_ended')).toEqual([
      expect.objectContaining({ outcome: 'cleared', stagesCleared: 3, reachedTier3: true }),
    ]);
  });

  it('振り返りは expedition_note として遠征識別子つきで記録される', () => {
    const { log, hook } = setup();
    act(() => hook.result.current.noteExpedition('層2 の鴉で崩れた'));

    expect(kinds(log, 'expedition_note')).toEqual([
      { kind: 'expedition_note', expeditionId: hook.result.current.expeditionId, text: '層2 の鴉で崩れた' },
    ]);
  });
});

describe('resolveEmptyOffer', () => {
  const offerPhase = () =>
    completeStage(startExpedition(swiftCards(), SEED, createSeededRandom), WIN);

  it('候補が0枚の提示は自動で辞退して次のステージへ進める（画面が止まらない）', () => {
    const empty = presentOffer(offerPhase(), []);

    expect(resolveEmptyOffer(empty).phase).toBe('stage');
  });

  it('候補がある提示はそのまま返す（辞退はプレイヤーに見せない）', () => {
    const offered = presentOffer(offerPhase(), ['arrow-tower']);

    expect(resolveEmptyOffer(offered)).toBe(offered);
  });
});
