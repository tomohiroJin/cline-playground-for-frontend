import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from './ShareButton';

describe('ShareButton', () => {
  const defaultProps = {
    text: 'パズルをクリアしました！',
    url: 'https://example.com',
    hashtags: ['PuzzleGame', 'GamePlatform'],
  };

  let originalShare: typeof navigator.share;
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    originalShare = navigator.share;
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      value: originalShare,
      writable: true,
      configurable: true,
    });
    windowOpenSpy.mockRestore();
  });

  it('ボタンがレンダリングされること', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByText('共有する')).toBeInTheDocument();
  });

  it('navigator.share成功時にTwitterが開かれないこと', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText('共有する'));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Game Platform',
        text: 'パズルをクリアしました！\n#PuzzleGame #GamePlatform',
        url: 'https://example.com',
      });
    });
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('AbortError（キャンセル）ではTwitterを開かないこと', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const mockShare = jest.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText('共有する'));

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalled();
    });
    expect(windowOpenSpy).not.toHaveBeenCalled();
  });

  it('その他のエラーでTwitterフォールバックが開かれること', async () => {
    const error = new Error('Share failed');
    error.name = 'NotAllowedError';
    const mockShare = jest.fn().mockRejectedValue(error);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
      configurable: true,
    });

    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText('共有する'));

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    const openUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(openUrl).toContain('twitter.com/intent/tweet');
    expect(openUrl).toContain(encodeURIComponent(defaultProps.text));
  });

  it('navigator.share未対応でTwitterが直接開かれること', () => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(<ShareButton {...defaultProps} />);
    fireEvent.click(screen.getByText('共有する'));

    expect(windowOpenSpy).toHaveBeenCalled();
    const openUrl = windowOpenSpy.mock.calls[0][0] as string;
    expect(openUrl).toContain('twitter.com/intent/tweet');
    expect(openUrl).toContain('hashtags=PuzzleGame%2CGamePlatform');
  });
});
