import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExpeditionSummary, COPY_LOG_LABEL, expeditionHeadline } from './ExpeditionSummary';
import { PRESET_DECKS, getCardDefinition } from '../domain/cards/card-pool';
import {
  chooseAcquisition,
  completeStage,
  presentOffer,
  type ExpeditionState,
} from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';

const WIN = { won: true, lifeLeft: 10 };
const start = () => startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);
const winAndAcquire = (exp: ExpeditionState): ExpeditionState =>
  chooseAcquisition(presentOffer(completeStage(exp, WIN), ['arrow-tower']), 'arrow-tower');

/** 層2 で敗れた遠征（獲得1枚） */
const failedAtTier2 = (): ExpeditionState =>
  completeStage(winAndAcquire(start()), { won: false, lifeLeft: 0 });

const cleared = (): ExpeditionState => completeStage(winAndAcquire(winAndAcquire(start())), WIN);

const renderSummary = (expedition: ExpeditionState) => {
  const handlers = {
    onNote: jest.fn(),
    exportLogJson: jest.fn(() => '{"version":6,"events":[]}'),
    onRetry: jest.fn(),
    onRebuild: jest.fn(),
    onShowBriefing: jest.fn(),
  };
  render(<ExpeditionSummary expedition={expedition} {...handlers} />);
  return handlers;
};

const submitNote = (text: string) => {
  fireEvent.change(screen.getByLabelText(/遠征の振り返りを記録する/), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '記録する' }));
};

describe('expeditionHeadline', () => {
  it('踏破と、敗れた層を言い分ける', () => {
    expect(expeditionHeadline(cleared())).toBe('遠征を踏破した');
    expect(expeditionHeadline(failedAtTier2())).toBe('遠征は層2 で潰えた');
  });
});

describe('ExpeditionSummary', () => {
  it('振り返りを記録するまで結果とボタンは伏せる（記録が結果に引きずられないように）', () => {
    renderSummary(failedAtTier2());

    expect(screen.getByText('遠征は層2 で潰えた')).toBeInTheDocument();
    expect(screen.queryByText(/獲得した札/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COPY_LOG_LABEL })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '同じデッキで別のシードに挑む' })).not.toBeInTheDocument();
  });

  it('記録すると onNote に渡り、結果（獲得した札）と各ボタンが開く', () => {
    const handlers = renderSummary(failedAtTier2());
    submitNote('層2 の鴉で崩れた');

    expect(handlers.onNote).toHaveBeenCalledWith('層2 の鴉で崩れた');
    expect(screen.getByText(/獲得した札/)).toHaveTextContent(getCardDefinition('arrow-tower').name);
    ['同じデッキで別のシードに挑む', 'デッキを組み直す', '説明をもう一度見る', COPY_LOG_LABEL].forEach((name) =>
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    );
  });

  it('空白だけの記録は受け付けない', () => {
    const handlers = renderSummary(failedAtTier2());
    submitNote('   ');

    expect(handlers.onNote).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: COPY_LOG_LABEL })).not.toBeInTheDocument();
  });

  it('各ボタンがそれぞれのコールバックへ届く', () => {
    const handlers = renderSummary(cleared());
    submitNote('踏破した');

    fireEvent.click(screen.getByRole('button', { name: '同じデッキで別のシードに挑む' }));
    fireEvent.click(screen.getByRole('button', { name: 'デッキを組み直す' }));
    fireEvent.click(screen.getByRole('button', { name: '説明をもう一度見る' }));

    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
    expect(handlers.onRebuild).toHaveBeenCalledTimes(1);
    expect(handlers.onShowBriefing).toHaveBeenCalledTimes(1);
  });

  it('ログのコピーは exportLogJson の中身をクリップボードへ渡し、成否を出す', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderSummary(cleared());
    submitNote('踏破した');

    fireEvent.click(screen.getByRole('button', { name: COPY_LOG_LABEL }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('{"version":6,"events":[]}'));
    expect(await screen.findByText('判定用の記録をコピーしました')).toBeInTheDocument();
  });
});
