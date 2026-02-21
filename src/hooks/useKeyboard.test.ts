import { renderHook } from '@testing-library/react';
import { useKeyboard } from './useKeyboard';

describe('useKeyboard', () => {
  const mockHandlers = {
    onMove: jest.fn(),
    onToggleHint: jest.fn(),
    onReset: jest.fn(),
    enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('矢印キーで移動を検出すること', () => {
    renderHook(() => useKeyboard(mockHandlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('up');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('down');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('left');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('right');
  });

  it('WASDキーで移動を検出すること', () => {
    renderHook(() => useKeyboard(mockHandlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('up');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('down');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('left');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(mockHandlers.onMove).toHaveBeenCalledWith('right');
  });

  it('Hキーでヒントトグルを検出すること', () => {
    renderHook(() => useKeyboard(mockHandlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(mockHandlers.onToggleHint).toHaveBeenCalledTimes(1);
  });

  it('Rキーでリセットを検出すること', () => {
    renderHook(() => useKeyboard(mockHandlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    expect(mockHandlers.onReset).toHaveBeenCalledTimes(1);
  });

  it('enabled=false の場合はキーイベントを無視すること', () => {
    renderHook(() => useKeyboard({ ...mockHandlers, enabled: false }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(mockHandlers.onMove).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(mockHandlers.onToggleHint).not.toHaveBeenCalled();
  });
});
