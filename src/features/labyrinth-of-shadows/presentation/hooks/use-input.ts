/**
 * 入力管理カスタムフック
 * キーボード入力の状態を管理する
 */
import { useRef, useEffect, useCallback } from 'react';

/** プレイヤー入力の構造体 */
export interface PlayerInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly forward: boolean;
  readonly backward: boolean;
  readonly hide: boolean;
  readonly sprint: boolean;
}

/**
 * キーボード入力を管理するカスタムフック
 * @param screen - 現在の画面状態
 * @param onEscape - Escape キー押下時のコールバック
 */
export const useInput = (
  screen: string,
  onEscape: () => void
) => {
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen === 'playing') {
        e.preventDefault();
        onEscape();
        return;
      }
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen, onEscape]);

  /** 現在のキー状態からプレイヤー入力を生成する */
  const getPlayerInput = useCallback((): PlayerInput => {
    const k = keysRef.current;
    return {
      left: k['a'] || k['arrowleft'] || false,
      right: k['d'] || k['arrowright'] || false,
      forward: k['w'] || k['arrowup'] || false,
      backward: k['s'] || k['arrowdown'] || false,
      hide: k[' '] || false,
      sprint: k['shift'] || false,
    };
  }, []);

  return { keysRef, getPlayerInput };
};
