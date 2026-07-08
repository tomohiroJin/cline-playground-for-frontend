import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionView from './CollectionView';
import { Theme, PuzzleRecord } from '../../types/puzzle';

const themes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: 'desc-a',
    unlockCondition: { type: 'always' },
    images: [
      { id: 'img_a1', filename: 'a1.webp', alt: 'A1', themeId: 'illustration-gallery', hasVideo: false },
      { id: 'img_a2', filename: 'a2.webp', alt: 'A2', themeId: 'illustration-gallery', hasVideo: false },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: 'desc-b',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      { id: 'img_b1', filename: 'b1.webp', alt: 'B1', themeId: 'sea-and-sky', hasVideo: false },
    ],
  },
];

const records: PuzzleRecord[] = [
  { imageId: 'img_a1', division: 4, bestScore: 3000, bestRank: '★★☆', bestTime: 90, bestMoves: 30, clearCount: 1, lastClearDate: '2026-07-06T00:00:00.000Z' },
];

describe('CollectionView', () => {
  it('展示室名・収蔵率・未開館文言を表示する', () => {
    render(<CollectionView themes={themes} records={records} totalClears={1} onBack={() => {}} />);
    expect(screen.getByText('イラストギャラリー')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('海と空')).toBeInTheDocument();
    expect(screen.getByText(/あと 4 点で開館/)).toBeInTheDocument();
  });

  it('戻るボタンで onBack を呼ぶ', () => {
    const onBack = jest.fn();
    render(<CollectionView themes={themes} records={records} totalClears={1} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: '戻る' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
