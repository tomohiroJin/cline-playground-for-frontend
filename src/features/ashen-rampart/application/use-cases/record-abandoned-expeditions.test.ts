/**
 * 途中でやめた遠征の検出と記録（反復7 段階2・設計書 §4.0 c）
 */
import {
  findAbandonedExpeditions,
  recordAbandonedExpeditions,
  NO_STAGE_STARTED,
} from './record-abandoned-expeditions';
import type { PlayLogEvent, PlayLogEventBody, PlayLogPort } from '../ports/play-log-port';

const at = (body: PlayLogEventBody): PlayLogEvent => ({ ...body, at: 0 });

const started = (expeditionId: string): PlayLogEvent =>
  at({
    kind: 'expedition_started',
    expeditionId,
    iteration: 7,
    seed: 1,
    stageIds: ['prov-t1-a', 'prov-t2-a', 'prov-t3-a'],
    initialDeckCards: [],
  });

const stageStarted = (expeditionId: string, stageIndex: number): PlayLogEvent =>
  at({ kind: 'stage_started', expeditionId, stageIndex, stageId: 'prov-t1-a', tier: 1, life: 12, deckCards: [] });

const ended = (expeditionId: string): PlayLogEvent =>
  at({
    kind: 'expedition_ended',
    expeditionId,
    outcome: 'failed',
    stagesCleared: 0,
    reachedTier3: false,
    acquired: [],
    life: 0,
  });

const abandoned = (expeditionId: string): PlayLogEvent =>
  at({ kind: 'expedition_abandoned', expeditionId, lastStageIndex: 0 });

/** 記録したものを exportAll で返す、実物（LocalStoragePlayLog）と同じ振る舞いの偽物 */
const createLog = (initial: readonly PlayLogEvent[]): PlayLogPort & { recorded: PlayLogEventBody[] } => {
  const recorded: PlayLogEventBody[] = [];
  return {
    recorded,
    record: (event) => {
      recorded.push(event);
    },
    exportAll: () => ({ version: 7, events: [...initial, ...recorded.map(at)] }),
  };
};

describe('findAbandonedExpeditions', () => {
  it('決着の無い遠征だけを、開始順に、最後に始めたステージ番号つきで返す', () => {
    // Arrange: A は決着済み・B はステージ1まで・C はステージ未開始・D は放棄記録済み・E は今回
    const events = [
      started('A'), stageStarted('A', 0), ended('A'),
      started('B'), stageStarted('B', 0), stageStarted('B', 1),
      started('C'),
      started('D'), abandoned('D'),
      started('E'), stageStarted('E', 0),
    ];

    // Act
    const result = findAbandonedExpeditions(events, 'E');

    // Assert
    expect(result).toEqual([
      { expeditionId: 'B', lastStageIndex: 1 },
      { expeditionId: 'C', lastStageIndex: NO_STAGE_STARTED },
    ]);
  });

  it('ステージを1つも始めていない遠征の lastStageIndex は -1', () => {
    expect(NO_STAGE_STARTED).toBe(-1);
    expect(findAbandonedExpeditions([started('X')], 'now')).toEqual([
      { expeditionId: 'X', lastStageIndex: -1 },
    ]);
  });

  it('今回の遠征は決着が無くても放棄とみなさない（StrictMode の再マウント対策）', () => {
    expect(findAbandonedExpeditions([started('now')], 'now')).toEqual([]);
  });

  it('ログが空なら何も返さない', () => {
    expect(findAbandonedExpeditions([], 'now')).toEqual([]);
  });
});

describe('recordAbandonedExpeditions', () => {
  it('見つけた遠征ごとに expedition_abandoned を1件ずつ記録する', () => {
    const log = createLog([started('B'), stageStarted('B', 2), started('C')]);

    recordAbandonedExpeditions(log, 'now');

    expect(log.recorded).toEqual([
      { kind: 'expedition_abandoned', expeditionId: 'B', lastStageIndex: 2 },
      { kind: 'expedition_abandoned', expeditionId: 'C', lastStageIndex: -1 },
    ]);
  });

  it('二度呼んでも二重に記録しない（記録済みの放棄はログから読み取れる）', () => {
    const log = createLog([started('B')]);

    recordAbandonedExpeditions(log, 'now');
    recordAbandonedExpeditions(log, 'now');

    expect(log.recorded).toHaveLength(1);
  });
});
