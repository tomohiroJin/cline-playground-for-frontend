/**
 * ゲームフックが遠征のステージを受け取れること（反復7 段階1）
 */
import { renderHook } from '@testing-library/react';
import { useAshenRampartGame } from './useAshenRampartGame';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];

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

describe('useAshenRampartGame（ステージ入力）', () => {
  const expedition = startExpedition(swiftCards(), 42, createSeededRandom);
  const stageState = { ...startStage(expedition, createSeededRandom), life: 7 };
  const stageMap = { ...PLAINS_MAP, id: 'stage-test-map' };

  it('初期状態を渡すと、その状態（持ち越しライフ）から始まる', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: expedition.deckCards, seed: 42, initialState: stageState, map: stageMap })
    );

    expect(result.current.state.life).toBe(7);
    expect(result.current.state.deck.hand).toEqual(stageState.deck.hand);
  });

  it('渡したマップを返す（盤面の描画に使う）', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: expedition.deckCards, seed: 42, initialState: stageState, map: stageMap })
    );

    expect(result.current.map).toBe(stageMap);
  });

  it('マップを省略すると PLAINS_MAP になる（既存の呼び出しの互換）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));

    expect(result.current.map).toBe(PLAINS_MAP);
  });

  it('run_started に遠征識別子とステージ番号が載る', () => {
    const log = createRecordingLog();

    renderHook(() =>
      useAshenRampartGame({
        cards: expedition.deckCards,
        seed: 42,
        initialState: stageState,
        map: stageMap,
        playLog: log,
        expeditionId: 'exp-test',
        stageIndex: 1,
      })
    );

    const started = log.records.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 42, expeditionId: 'exp-test', stageIndex: 1 });
  });

  it('遠征識別子を渡さなければ run_started に載らない（単発ランの互換）', () => {
    const log = createRecordingLog();

    renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log }));

    const started = log.records.find((e) => e.kind === 'run_started');
    expect(started).not.toHaveProperty('expeditionId');
  });
});
