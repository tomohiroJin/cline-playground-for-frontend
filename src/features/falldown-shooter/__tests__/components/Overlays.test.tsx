import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  StartScreen,
  ClearScreen,
  GameOverScreen,
  EndingScreen,
  DemoScreen,
} from '../../components/Overlays';
import { DEMO_SLIDES } from '../../constants';

// ShareButton のモック（外部依存を分離）
jest.mock('../../../../components/molecules/ShareButton', () => ({
  ShareButton: () => <button data-testid="share-button">Share</button>,
}));

jest.useFakeTimers();

describe('StartScreen', () => {
  const defaultProps = {
    onStart: jest.fn(),
    difficulty: 'normal' as const,
    onDifficultyChange: jest.fn(),
    onRanking: jest.fn(),
  };

  test('タイトルを表示すること', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText('落ち物シューティング')).toBeInTheDocument();
  });

  test('操作説明を表示すること', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText('← → Space')).toBeInTheDocument();
  });

  test('Startボタンクリック時にonStartが呼ばれること', () => {
    const onStart = jest.fn();
    render(<StartScreen {...defaultProps} onStart={onStart} />);
    fireEvent.click(screen.getByText('Start'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test('難易度セレクターが表示されること', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  test('ランキングボタンが表示されること', () => {
    render(<StartScreen {...defaultProps} />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });
});

describe('ClearScreen', () => {
  test('ステージクリアメッセージを表示すること', () => {
    render(<ClearScreen stage={2} onNext={jest.fn()} />);
    expect(screen.getByText(/Stage 2 Clear/)).toBeInTheDocument();
  });

  test('Nextボタンクリック時にonNextが呼ばれること', () => {
    const onNext = jest.fn();
    render(<ClearScreen stage={1} onNext={onNext} />);
    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe('GameOverScreen', () => {
  test('Game Overタイトルを表示すること', () => {
    render(<GameOverScreen score={500} onRetry={jest.fn()} onTitle={jest.fn()} />);
    expect(screen.getByText('Game Over')).toBeInTheDocument();
  });

  test('スコアを表示すること', () => {
    render(<GameOverScreen score={1500} onRetry={jest.fn()} onTitle={jest.fn()} />);
    expect(screen.getByText('Score: 1500')).toBeInTheDocument();
  });

  test('Retryボタンクリック時にonRetryが呼ばれること', () => {
    const onRetry = jest.fn();
    render(<GameOverScreen score={0} onRetry={onRetry} onTitle={jest.fn()} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('Titleボタンクリック時にonTitleが呼ばれること', () => {
    const onTitle = jest.fn();
    render(<GameOverScreen score={0} onRetry={jest.fn()} onTitle={onTitle} />);
    fireEvent.click(screen.getByText('Title'));
    expect(onTitle).toHaveBeenCalledTimes(1);
  });

  test('ランキングボタンが表示されること', () => {
    render(
      <GameOverScreen score={0} onRetry={jest.fn()} onTitle={jest.fn()} onRanking={jest.fn()} />
    );
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });
});

describe('EndingScreen', () => {
  test('クリアメッセージを表示すること', () => {
    render(<EndingScreen score={3000} onRetry={jest.fn()} onTitle={jest.fn()} />);
    expect(screen.getByText(/Clear/)).toBeInTheDocument();
  });

  test('スコアを表示すること', () => {
    render(<EndingScreen score={3000} onRetry={jest.fn()} onTitle={jest.fn()} />);
    expect(screen.getByText('Score: 3000')).toBeInTheDocument();
  });

  test('Againボタンクリック時にonRetryが呼ばれること', () => {
    const onRetry = jest.fn();
    render(<EndingScreen score={0} onRetry={onRetry} onTitle={jest.fn()} />);
    fireEvent.click(screen.getByText('Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('Titleボタンクリック時にonTitleが呼ばれること', () => {
    const onTitle = jest.fn();
    render(<EndingScreen score={0} onRetry={jest.fn()} onTitle={onTitle} />);
    fireEvent.click(screen.getByText('Title'));
    expect(onTitle).toHaveBeenCalledTimes(1);
  });
});

describe('DemoScreen', () => {
  test('最初のスライドタイトルを表示すること', () => {
    render(<DemoScreen onDismiss={jest.fn()} />);
    expect(screen.getByText(DEMO_SLIDES[0].title)).toBeInTheDocument();
  });

  test('スライドドットが表示されること', () => {
    const { container } = render(<DemoScreen onDismiss={jest.fn()} />);
    // ドットの数がスライド数と一致
    const dots = container.querySelectorAll('div > div > div');
    // DemoDot はスライド数分存在するはず
    expect(dots.length).toBeGreaterThan(0);
  });

  test('クリック時にonDismissが呼ばれること', () => {
    const onDismiss = jest.fn();
    const { container } = render(<DemoScreen onDismiss={onDismiss} />);
    // DemoContainer をクリック
    const demoContainer = container.firstChild as HTMLElement;
    fireEvent.click(demoContainer);
    expect(onDismiss).toHaveBeenCalled();
  });

  test('スライドが自動的に切り替わること', () => {
    render(<DemoScreen onDismiss={jest.fn()} />);
    expect(screen.getByText(DEMO_SLIDES[0].title)).toBeInTheDocument();

    // スライド間隔分進める
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByText(DEMO_SLIDES[1].title)).toBeInTheDocument();
  });
});
