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

/** 自動消去付きトースト管理（責務分離） */
function useAutoExpireToast() {
  const [toast, setToast] = useState<GamepadToast | undefined>(undefined);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string) => {
    setToast({ message, timestamp: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(undefined), []);

  return { toast, showToast, clearToast };
}

export function useGamepadInput(): UseGamepadInputReturn {
  const [connectedCount, setConnectedCount] = useState(0);
  const { toast, showToast, clearToast } = useAutoExpireToast();

  const updateCount = useCallback(() => {
    if (!isGamepadSupported()) return;
    const count = navigator.getGamepads().filter(gp => gp !== null).length;
    setConnectedCount(count);
  }, []);

  useEffect(() => {
    if (!isGamepadSupported()) return;
    updateCount();

    const handleConnect = (e: GamepadEvent) => {
      updateCount();
      showToast(`🎮 コントローラー ${e.gamepad.index + 1} が接続されました`);
    };
    const handleDisconnect = (e: GamepadEvent) => {
      updateCount();
      showToast(`🎮 コントローラー ${e.gamepad.index + 1} が切断されました`);
    };

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, [updateCount, showToast]);

  return { connectedCount, toast, clearToast };
}
