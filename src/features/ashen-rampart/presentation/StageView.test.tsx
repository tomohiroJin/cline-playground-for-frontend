/**
 * StageView（反復7 段階1）: 1ステージの戦闘と決着パネル
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StageView, SETTLE_TO_OFFER_LABEL, SETTLE_TO_SUMMARY_LABEL } from './StageView';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import type { CombatState } from '../domain/combat/combat-state';
import { startExpedition, startStage } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';
import { TICK_INTERVAL_MS } from './useAshenRampartGame';

const expedition = startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);
const initial = startStage(expedition, createSeededRandom);

const renderStage = (initialState: CombatState, isFinalStage: boolean) => {
  const onSettled = jest.fn();
  render(
    <StageView
      cards={expedition.deckCards}
      seed={42}
      map={PLAINS_MAP}
      initialState={initialState}
      expeditionId="exp-test"
      stageIndex={0}
      isFinalStage={isFinalStage}
      banner={<p>帯のテスト</p>}
      onSettled={onSettled}
    />
  );
  return onSettled;
};

/** 1 tick 進めれば決着するよう、ライフ0・進行中の状態を作る（stepTick が敗北を確定させる） */
const aboutToLose = (): CombatState => ({ ...initial, life: 0 });

describe('StageView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it('帯・盤面・手札が出て、決着パネルはまだ出ない', () => {
    renderStage(initial, false);

    expect(screen.getByText('帯のテスト')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '手札' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_SUMMARY_LABEL })).not.toBeInTheDocument();
  });

  it('敗北すると「遠征の結果へ」だけが出て、押すと残ライフつきで onSettled が呼ばれる', () => {
    const onSettled = renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.getByText('城壁は灰燼に帰した')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SETTLE_TO_OFFER_LABEL })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: SETTLE_TO_SUMMARY_LABEL }));
    expect(onSettled).toHaveBeenCalledWith({ won: false, lifeLeft: 0 });
  });

  it('決着パネルには勝敗理由の記録欄・再挑戦・ログコピーを出さない（遠征の結果画面へ移した）', () => {
    renderStage(aboutToLose(), false);
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });

    expect(screen.queryByLabelText(/勝敗の理由を記録する/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
  });
});
