import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSelector from './ThemeSelector';
import { Theme, PuzzleRecord } from '../../types/puzzle';

const mockThemes: Theme[] = [
  {
    id: 'illustration-gallery',
    name: 'イラストギャラリー',
    description: '美しいイラスト作品のコレクション',
    unlockCondition: { type: 'always' },
    images: [
      {
        id: 'snowy_mountain_ukiyoe',
        filename: 'snowy_mountain_ukiyoe.webp',
        alt: '雪山の浮世絵風イラスト',
        themeId: 'illustration-gallery',
        hasVideo: true,
      },
    ],
  },
  {
    id: 'sea-and-sky',
    name: '海と空',
    description: '海と空の美しい景色',
    unlockCondition: { type: 'clearCount', count: 5 },
    images: [
      {
        id: 'coral_reef_fish',
        filename: 'coral_reef_fish.webp',
        alt: 'サンゴ礁の熱帯魚',
        themeId: 'sea-and-sky',
        hasVideo: false,
      },
    ],
  },
];

describe('ThemeSelector', () => {
  const defaultProps = {
    themes: mockThemes,
    records: [] as PuzzleRecord[],
    totalClears: 0,
    onImageSelect: jest.fn(),
  };

  it('テーマタブが表示されること', () => {
    render(<ThemeSelector {...defaultProps} />);
    expect(screen.getByText('イラストギャラリー')).toBeInTheDocument();
  });

  it('ロック中のテーマにはロックアイコンが表示されること', () => {
    render(<ThemeSelector {...defaultProps} />);
    // 海と空は5回クリアで解放、totalClears=0なのでロック中
    const seaTab = screen.getByText(/海と空/);
    expect(seaTab.textContent).toContain('🔒');
  });

  it('初期解放テーマの画像が表示されること', () => {
    render(<ThemeSelector {...defaultProps} />);
    expect(screen.getByAltText('雪山の浮世絵風イラスト')).toBeInTheDocument();
  });

  it('アンロック条件を満たすとテーマが解放されること', () => {
    render(<ThemeSelector {...defaultProps} totalClears={5} />);
    const seaTab = screen.getByText('海と空');
    expect(seaTab.textContent).not.toContain('🔒');
  });

  it('ロック中テーマをクリックしても画像が表示されないこと', () => {
    render(<ThemeSelector {...defaultProps} />);
    fireEvent.click(screen.getByText(/海と空/));
    // ロック中テーマのクリックは無視されるため、イラストギャラリーの画像が表示されたまま
    expect(screen.getByAltText('雪山の浮世絵風イラスト')).toBeInTheDocument();
  });

  it('クリア済み画像にランクバッジが表示されること', () => {
    const records: PuzzleRecord[] = [
      {
        imageId: 'snowy_mountain_ukiyoe',
        division: 4,
        bestScore: 8500,
        bestRank: '★★★',
        bestTime: 60,
        bestMoves: 30,
        clearCount: 1,
        lastClearDate: '2026-01-01T00:00:00Z',
      },
    ];
    render(<ThemeSelector {...defaultProps} records={records} />);
    expect(screen.getByText('★★★')).toBeInTheDocument();
  });
});
