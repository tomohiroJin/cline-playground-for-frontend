/**
 * ゲームパッド入力管理フック
 * gamepadconnected/gamepaddisconnected イベントで接続状態を監視し、
 * ゲームループ内でのポーリングに必要な connectedCount を提供する
 */
import { useState, useEffect, useCallback } from 'react';
import { isGamepadSupported } from '../core/gamepad';

export type GamepadToast = {
  message: string;
  timestamp: number;
};

export type UseGamepadInputReturn = {
  connectedCount: number;
  toast: GamepadToast | undefined;
  clearToast: () => void;
};

/** トースト表示時間（ms） */
const TOAST_DURATION = 3000;

export function useGamepadInput(): UseGamepadInputReturn {
  const [connectedCount, setConnectedCount] = useState(0);
  const [toast, setToast] = useState<GamepadToast | undefined>(undefined);

  const updateCount = useCallback(() => {
    if (!isGamepadSupported()) return;
    const gamepads = navigator.getGamepads();
    const count = gamepads.filter(gp => gp !== null).length;
    setConnectedCount(count);
  }, []);

  useEffect(() => {
    if (!isGamepadSupported()) return;
    updateCount();

    const handleConnect = (e: GamepadEvent) => {
      updateCount();
      setToast({ message: `🎮 コントローラー ${e.gamepad.index + 1} が接続されました`, timestamp: Date.now() });
    };
    const handleDisconnect = (e: GamepadEvent) => {
      updateCount();
      setToast({ message: `🎮 コントローラー ${e.gamepad.index + 1} が切断されました`, timestamp: Date.now() });
    };

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, [updateCount]);

  // トースト自動消去
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  const clearToast = useCallback(() => setToast(undefined), []);

  return { connectedCount, toast, clearToast };
}
