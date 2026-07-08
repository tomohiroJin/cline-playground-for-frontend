import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtworkFrame from './ArtworkFrame';
import { ArtworkStatus } from '../../domain/collection/types';

const collected: ArtworkStatus = {
  imageId: 'moonlight_dancer',
  title: '月明かりのダンサー',
  filename: 'moonlight_dancer.webp',
  isCollected: true,
  bestRank: '★★★',
  bestScore: 5000,
  bestTime: 80,
  bestMoves: 40,
  clearCount: 3,
  lastClearDate: '2026-07-05T00:00:00.000Z',
};

const notCollected: ArtworkStatus = {
  imageId: 'unseen',
  title: '未収蔵の作品',
  filename: 'unseen.webp',
  isCollected: false,
  bestScore: 0,
  clearCount: 0,
};

describe('ArtworkFrame', () => {
  it('収蔵済みは画像と鑑定評価を表示する', () => {
    render(<ArtworkFrame artwork={collected} />);
    const img = screen.getByAltText('月明かりのダンサー') as HTMLImageElement;
    expect(img.src).toContain('/images/default/moonlight_dancer.webp');
    expect(screen.getByText('★★★')).toBeInTheDocument();
  });

  it('未収蔵は空フレーム（画像なし）を表示する', () => {
    render(<ArtworkFrame artwork={notCollected} />);
    expect(screen.queryByAltText('未収蔵の作品')).not.toBeInTheDocument();
    expect(screen.getByText('未収蔵')).toBeInTheDocument();
  });
});
