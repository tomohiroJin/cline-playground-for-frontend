/**
 * P1-07: VictoryCutIn コンポーネントのテスト
 * 勝利カットイン演出の表示・アニメーション・ユーザー入力を検証
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VictoryCutIn } from './VictoryCutIn';

describe('VictoryCutIn', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    imageUrl: '/assets/cutins/victory-ch1.png',
    onComplete: jest.fn(),
  };

  describe('表示', () => {
    it('カットイン画像が表示される', () => {
      render(<VictoryCutIn {...defaultProps} />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', defaultProps.imageUrl);
    });

    it('デフォルトメッセージ「TO BE CONTINUED...」が表示される', () => {
      render(<VictoryCutIn {...defaultProps} />);
      expect(screen.getByText('TO BE CONTINUED...')).toBeInTheDocument();
    });

    it('カスタムメッセージが指定された場合はそれが表示される', () => {
      render(<VictoryCutIn {...defaultProps} message="第1章 完" />);
      expect(screen.getByText('第1章 完')).toBeInTheDocument();
      expect(screen.queryByText('TO BE CONTINUED...')).not.toBeInTheDocument();
    });
  });

  describe('ユーザー入力による遷移', () => {
    it('テキスト表示前（3.5秒未満）のクリックではonCompleteが呼ばれない', () => {
      const { container } = render(<VictoryCutIn {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;

      // 2秒時点でクリック（テキスト表示前）
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        fireEvent.click(wrapper);
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });

    it('テキスト表示後のクリックでフェードアウト→onCompleteが呼ばれる', () => {
      const { container } = render(<VictoryCutIn {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;

      // テキスト表示完了まで待つ（3.5秒）
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // クリック
      act(() => {
        fireEvent.click(wrapper);
      });

      // フェードアウト（500ms）完了後にonComplete
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('Enterキーでフェードアウト→onCompleteが呼ばれる', () => {
      render(<VictoryCutIn {...defaultProps} />);

      // テキスト表示完了まで待つ
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // Enterキー
      act(() => {
        fireEvent.keyDown(window, { key: 'Enter' });
      });

      // フェードアウト後にonComplete
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('Spaceキーでフェードアウト→onCompleteが呼ばれる', () => {
      render(<VictoryCutIn {...defaultProps} />);

      // テキスト表示完了まで待つ
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // Spaceキー
      act(() => {
        fireEvent.keyDown(window, { key: ' ' });
      });

      // フェードアウト後にonComplete
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('onCompleteが二重に呼ばれない', () => {
      const { container } = render(<VictoryCutIn {...defaultProps} />);
      const wrapper = container.firstElementChild as HTMLElement;

      // テキスト表示完了まで待つ
      act(() => {
        jest.advanceTimersByTime(3500);
      });

      // 複数回クリック
      act(() => {
        fireEvent.click(wrapper);
      });
      act(() => {
        fireEvent.click(wrapper);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('自動遷移なし', () => {
    it('ユーザー入力なしでは10秒経ってもonCompleteが呼ばれない', () => {
      render(<VictoryCutIn {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });
  });
});
