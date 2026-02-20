import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { hintModeEnabledAtom, hintUsedAtom } from '../store/atoms';

/**
 * ヒントモードの状態と操作を管理するカスタムフック
 */
export const useHintMode = () => {
  // ヒントモードの状態
  const [hintModeEnabled, setHintModeEnabled] = useAtom(hintModeEnabledAtom);
  const [, setHintUsed] = useAtom(hintUsedAtom);

  /**
   * ヒントモードのトグル
   */
  const toggleHintMode = useCallback(() => {
    setHintModeEnabled(prev => {
      const next = !prev;
      if (next) {
        setHintUsed(true);
      }
      return next;
    });
  }, [setHintModeEnabled, setHintUsed]);

  /**
   * ヒントモードを有効にする
   */
  const enableHintMode = useCallback(() => {
    setHintModeEnabled(true);
    setHintUsed(true);
  }, [setHintModeEnabled, setHintUsed]);

  /**
   * ヒントモードを無効にする
   */
  const disableHintMode = useCallback(() => {
    setHintModeEnabled(false);
  }, [setHintModeEnabled]);

  return {
    hintModeEnabled,
    toggleHintMode,
    enableHintMode,
    disableHintMode,
  };
};
