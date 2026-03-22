/**
 * 入力管理フック
 *
 * キーボード・タッチ入力を統合管理する。
 */
import { useCallback, useRef } from 'react';
import React from 'react';
import type { TouchKeys } from '../../types';

/** 入力フックの戻り値 */
export interface UseInputResult {
  /** キーボードの押下状態 */
  readonly keys: React.MutableRefObject<Record<string, boolean>>;
  /** タッチ入力の状態 */
  readonly touchKeys: React.MutableRefObject<TouchKeys>;
  /** タッチ操作ハンドラ */
  readonly handleTouch: (
    key: keyof TouchKeys,
    value: boolean
  ) => (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
}

/** キーボード・タッチ入力を統合管理するフック */
export const useInput = (): UseInputResult => {
  const keys = useRef<Record<string, boolean>>({});
  const touchKeys = useRef<TouchKeys>({
    left: false,
    right: false,
    accel: false,
    jump: false,
  });

  const handleTouch = useCallback(
    (key: keyof TouchKeys, value: boolean) =>
      (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        touchKeys.current[key] = value;
      },
    []
  );

  return { keys, touchKeys, handleTouch };
};
