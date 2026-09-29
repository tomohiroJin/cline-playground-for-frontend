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

/**
 * 実物（LocalStoragePlayLog）と同じく「これまでに記録されたもの」を exportAll で返す
 *
 * 段階1 までは exportAll が空固定だったが、段階2 で放棄の検出がログを読み返すように
 * なったため実物に合わせた。`preloaded` は前の遠征までにブラウザへ溜まっていたログ。
 * `records` にはこのフックが記録したものだけが入る（既存の kinds() の数え方は変わらない）。
 */
const createRecordingLog = (
  preloaded: readonly PlayLogEventBody[] = []
): PlayLogPort & { records: PlayLogEventBody[] } => {
  const records: PlayLogEventBody[] = [];
  return {
    records,
    record: (event) => {
      records.push(event);
    },
    exportAll: () => ({
      version: 7,
      events: [...preloaded, ...records].map((event) => ({ ...event, at: 0 })),
    }),
  };
};

const kinds = (log: { records: PlayLogEventBody[] }, kind: PlayLogEventBody['kind']) =>
  log.records.filter((e) => e.kind === kind);

const setup = (strict = false, preloaded: readonly PlayLogEventBody[] = []) => {
  const log = createRecordingLog(preloaded);
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

  it('settleStage を1つの act 内で2回呼んでも例外にならず、決着は1回分だけ進む（PR #211 Fix B）', () => {
    // 二重クリック等で setExpedition の更新関数が再描画前に2回積まれても、
    // 2回目は 'stage' 以外のフェーズに対して advanceStage を呼ばないことを確かめる
    const { log, hook } = setup();

    act(() => {
      hook.result.current.settleStage(WIN);
      hook.result.current.settleStage(WIN);
    });

    expect(hook.result.current.expedition.stageIndex).toBe(1);
    expect(kinds(log, 'card_offered')).toHaveLength(1);
  });

  it('acquire を1つの act 内で2回呼んでも例外にならず、card_acquired は1回だけ記録される（PR #211 Fix A）', () => {
    // 二重クリック等で acquire が再描画前に2回呼ばれても、2回目は
    // 'offer' 以外のフェーズに対して chooseAcquisition を呼ばないことを確かめる
    const { log, hook } = setup();
    act(() => hook.result.current.settleStage(WIN));
    const offered = [...hook.result.current.expedition.offer];

    act(() => {
      hook.result.current.acquire(offered[0]!);
      hook.result.current.acquire(offered[0]!);
    });

    expect(kinds(log, 'card_acquired')).toHaveLength(1);
    expect(hook.result.current.expedition.deckCards).toHaveLength(13);
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

describe('途中でやめた遠征（反復7 段階2・設計書 §4.0 c）', () => {
  const startedEvent = (expeditionId: string): PlayLogEventBody => ({
    kind: 'expedition_started',
    expeditionId,
    iteration: 7,
    seed: 1,
    stageIds: ['prov-t1-a', 'prov-t2-a', 'prov-t3-a'],
    initialDeckCards: swiftCards(),
  });
  const stageStartedEvent = (expeditionId: string, stageIndex: number): PlayLogEventBody => ({
    kind: 'stage_started',
    expeditionId,
    stageIndex,
    stageId: 'prov-t1-a',
    tier: 1,
    life: 12,
    deckCards: swiftCards(),
  });
  const endedEvent = (expeditionId: string): PlayLogEventBody => ({
    kind: 'expedition_ended',
    expeditionId,
    outcome: 'failed',
    stagesCleared: 0,
    reachedTier3: false,
    acquired: [],
    life: 0,
  });

  it('前の遠征が決着していなければ、次の遠征の開始時に expedition_abandoned を1件記録する', () => {
    const { log } = setup(false, [
      startedEvent('exp-old'),
      stageStartedEvent('exp-old', 0),
      stageStartedEvent('exp-old', 1),
    ]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: 1 },
    ]);
  });

  // このテストが守るのは recordOnce による二重記録の防止。effect の順序により、
  // 走査の時点で今回の expedition_started はまだ無いので、自己除外
  // （id !== currentExpeditionId）そのものは record-abandoned-expeditions.test.ts が守る。
  it('StrictMode の二重実行でも1件だけで、今回の遠征自身は放棄にしない', () => {
    const { log, hook } = setup(true, [startedEvent('exp-old')]);

    const abandoned = kinds(log, 'expedition_abandoned');
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]).toMatchObject({ expeditionId: 'exp-old' });
    expect(abandoned).not.toContainEqual(
      expect.objectContaining({ expeditionId: hook.result.current.expeditionId })
    );
  });

  it('正常に決着した遠征は対象外', () => {
    const { log } = setup(false, [startedEvent('exp-done'), endedEvent('exp-done')]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([]);
  });

  it('既に放棄と記録された遠征を二度記録しない', () => {
    const { log } = setup(false, [
      startedEvent('exp-old'),
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: -1 },
    ]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([]);
  });

  it('ステージを1つも始めずにやめた遠征は lastStageIndex が -1', () => {
    const { log } = setup(false, [startedEvent('exp-old')]);

    expect(kinds(log, 'expedition_abandoned')).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'exp-old', lastStageIndex: -1 },
    ]);
  });

  it('放棄の記録は今回の expedition_started より前に並ぶ（ログを上から読むと時系列になる）', () => {
    const { log } = setup(false, [startedEvent('exp-old')]);

    const order = log.records.map((e) => e.kind);
    // 両方が記録されていることを先に確かめる（無いと indexOf が -1 になり、比較が空振りで通る）
    expect(order).toContain('expedition_abandoned');
    expect(order).toContain('expedition_started');
    expect(order.indexOf('expedition_abandoned')).toBeLessThan(order.indexOf('expedition_started'));
  });
});
