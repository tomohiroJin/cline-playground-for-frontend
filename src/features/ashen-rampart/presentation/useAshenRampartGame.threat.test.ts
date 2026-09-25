/**
 * 敵の射程のセル（反復7 段階2・設計書 §4.3 #5）
 *
 * カード選択中（置けるセルがある間）だけ、そのステージの台本から求めたセルを返す。
 */
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame } from './useAshenRampartGame';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { enemyReachCells } from '../domain/combat/enemy-reach';
import { getCardDefinition, PRESET_DECKS } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
import type { PlayLogPort } from '../application/ports/play-log-port';

const silentLog: PlayLogPort = { record: () => undefined, exportAll: () => ({ version: 7, events: [] }) };

describe('threatenedCells', () => {
  it('カードを選ぶ前は空で、置ける札を選ぶと台本から求めた射程のセルになる', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: [...PRESET_DECKS.swift!.cards], seed: 1, playLog: silentLog })
    );
    expect(result.current.threatenedCells).toEqual([]);
    const index = result.current.state.deck.hand.findIndex(
      (id) => placementKindOf(getCardDefinition(id)) !== 'none'
    );
    expect(index).toBeGreaterThanOrEqual(0);

    act(() => result.current.selectCard(index));

    expect(result.current.threatenedCells).toEqual(enemyReachCells(PLAINS_MAP, result.current.state.waves));
    expect(result.current.threatenedCells.length).toBeGreaterThan(0);
  });

  it('一時停止中は出さない（置けるセルも出ないため）', () => {
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: [...PRESET_DECKS.swift!.cards], seed: 1, playLog: silentLog })
    );
    const index = result.current.state.deck.hand.findIndex(
      (id) => placementKindOf(getCardDefinition(id)) !== 'none'
    );
    act(() => result.current.selectCard(index));
    act(() => result.current.togglePause());

    expect(result.current.threatenedCells).toEqual([]);
  });
});
