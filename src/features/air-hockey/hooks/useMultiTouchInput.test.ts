/**
 * マルチタッチ入力フックのテスト
 */
import { renderHook, act } from '@testing-library/react';
import { useMultiTouchInput } from './useMultiTouchInput';
import { CONSTANTS } from '../core/constants';

const { HEIGHT: H } = CONSTANTS.CANVAS;

describe('useMultiTouchInput', () => {
  const createMockCanvasRef = () => {
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, width: 450, height: 900,
      right: 450, bottom: 900, x: 0, y: 0, toJSON: jest.fn(),
    }));
    return { current: canvas };
  };

  it('初期状態では両プレイヤーの位置が undefined', () => {
    const canvasRef = createMockCanvasRef();
    const { result } = renderHook(() => useMultiTouchInput(canvasRef, true));

    expect(result.current.player1Position).toBeUndefined();
    expect(result.current.player2Position).toBeUndefined();
  });

  it('enabled が false の場合はリスナーが登録されない', () => {
    const canvasRef = createMockCanvasRef();
    const addSpy = jest.spyOn(canvasRef.current, 'addEventListener');

    renderHook(() => useMultiTouchInput(canvasRef, false));

    expect(addSpy).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it('enabled が true の場合はタッチリスナーが登録される', () => {
    const canvasRef = createMockCanvasRef();
    const addSpy = jest.spyOn(canvasRef.current, 'addEventListener');

    renderHook(() => useMultiTouchInput(canvasRef, true));

    const eventTypes = addSpy.mock.calls.map(c => c[0]);
    expect(eventTypes).toContain('touchstart');
    expect(eventTypes).toContain('touchmove');
    expect(eventTypes).toContain('touchend');
    expect(eventTypes).toContain('touchcancel');
    addSpy.mockRestore();
  });

  it('アンマウント時にリスナーが解除される', () => {
    const canvasRef = createMockCanvasRef();
    const removeSpy = jest.spyOn(canvasRef.current, 'removeEventListener');

    const { unmount } = renderHook(() => useMultiTouchInput(canvasRef, true));
    unmount();

    const eventTypes = removeSpy.mock.calls.map(c => c[0]);
    expect(eventTypes).toContain('touchstart');
    expect(eventTypes).toContain('touchmove');
    expect(eventTypes).toContain('touchend');
    expect(eventTypes).toContain('touchcancel');
    removeSpy.mockRestore();
  });
});
