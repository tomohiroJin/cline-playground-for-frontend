import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { hintModeEnabledAtom } from '../store/atoms';

/**
 * ヒントモードの状態と操作を管理するカスタムフック
 */
export const useHintMode = () => {
  // ヒントモードの状態
  const [hintModeEnabled, setHintModeEnabled] = useAtom(hintModeEnabledAtom);

  /**
   * ヒントモードのトグル
   */
  const toggleHintMode = useCallback(() => {
    setHintModeEnabled(prev => !prev);
  }, [setHintModeEnabled]);

  /**
   * ヒントモードを有効にする
   */
  const enableHintMode = useCallback(() => {
    setHintModeEnabled(true);
  }, [setHintModeEnabled]);

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
