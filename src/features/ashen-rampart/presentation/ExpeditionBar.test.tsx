import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExpeditionBar } from './ExpeditionBar';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import { chooseAcquisition, completeStage, presentOffer } from '../domain/expedition/expedition-state';
import { startExpedition } from '../application/use-cases/start-expedition';
import { createSeededRandom } from '../infrastructure/random/seeded-random';

const start = () => startExpedition([...PRESET_DECKS.swift!.cards], 42, createSeededRandom);

describe('ExpeditionBar', () => {
  it('層・ステージ名・獲得枚数を出す', () => {
    const exp = start();
    render(<ExpeditionBar expedition={exp} />);

    const bar = screen.getByRole('status', { name: '遠征の進み具合' });
    expect(bar).toHaveTextContent('層 1 / 3');
    expect(bar).toHaveTextContent(exp.stages[0]!.name);
    expect(bar).toHaveTextContent('獲得 0枚');
  });

  it('獲得した後は次の層と獲得枚数が増える', () => {
    const offered = presentOffer(completeStage(start(), { won: true, lifeLeft: 10 }), ['arrow-tower']);
    const exp = chooseAcquisition(offered, 'arrow-tower');
    render(<ExpeditionBar expedition={exp} />);

    expect(screen.getByRole('status', { name: '遠征の進み具合' })).toHaveTextContent('層 2 / 3');
    expect(screen.getByRole('status', { name: '遠征の進み具合' })).toHaveTextContent('獲得 1枚');
  });
});
