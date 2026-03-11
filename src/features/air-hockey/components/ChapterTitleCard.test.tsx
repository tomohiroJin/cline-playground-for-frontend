/**
 * P1-06: ChapterTitleCard コンポーネントのテスト
 * 章タイトル演出カードの表示・アニメーション・スキップ機能を検証
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { ChapterTitleCard } from './ChapterTitleCard';

describe('ChapterTitleCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    chapter: 1,
    title: '第1章',
    subtitle: 'はじめの一打',
    backgroundUrl: '/assets/backgrounds/bg-clubroom.webp',
    onComplete: jest.fn(),
  };

  describe('表示', () => {
    it('章番号が表示される', () => {
      render(<ChapterTitleCard {...defaultProps} />);
      expect(screen.getByText(`Chapter ${defaultProps.chapter}`)).toBeInTheDocument();
    });

    it('タイトルが表示される', () => {
      render(<ChapterTitleCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('サブタイトルが表示される', () => {
      render(<ChapterTitleCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.subtitle as string)).toBeInTheDocument();
    });

    it('サブタイトルが未指定の場合は表示されない', () => {
      const { subtitle: _, ...propsWithoutSubtitle } = defaultProps;
      render(<ChapterTitleCard {...propsWithoutSubtitle} />);

      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
      expect(screen.queryByText('はじめの一打')).not.toBeInTheDocument();
    });

    it('背景画像が設定される', () => {
      const { container } = render(<ChapterTitleCard {...defaultProps} />);
      const bgElement = container.querySelector('[data-testid="chapter-title-bg"]');
      expect(bgElement).toBeInTheDocument();
      expect(bgElement).toHaveStyle({
        backgroundImage: `url(${defaultProps.backgroundUrl})`,
      });
    });

    it('背景URL未指定時は黒背景にフォールバックする', () => {
      const { backgroundUrl: _, ...propsWithoutBg } = defaultProps;
      const { container } = render(<ChapterTitleCard {...propsWithoutBg} />);
      const bgElement = container.querySelector('[data-testid="chapter-title-bg"]');
      expect(bgElement).toBeInTheDocument();
      expect(bgElement).toHaveStyle({
        backgroundColor: '#000',
      });
    });
  });

  describe('自動遷移', () => {
    it('4秒後にonCompleteが呼ばれる', () => {
      render(<ChapterTitleCard {...defaultProps} />);
      expect(defaultProps.onComplete).not.toHaveBeenCalled();

      // 4秒後（背景500ms + タイトル500ms + サブタイトル500ms + 待機2000ms + フェードアウト500ms）
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('3.5秒時点ではまだonCompleteが呼ばれない', () => {
      render(<ChapterTitleCard {...defaultProps} />);
      act(() => {
        jest.advanceTimersByTime(3500);
      });
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });
  });

  describe('スキップ操作', () => {
    it('クリックでスキップするとonCompleteが呼ばれる', () => {
      const { container } = render(<ChapterTitleCard {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;

      act(() => {
        fireEvent.click(wrapper);
      });

      // フェードアウト（500ms）完了後にonComplete
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('スキップ後に自動遷移のonCompleteが二重に呼ばれない', () => {
      const { container } = render(<ChapterTitleCard {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;

      // スキップ
      act(() => {
        fireEvent.click(wrapper);
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);

      // さらに時間を進めても再度呼ばれない
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
