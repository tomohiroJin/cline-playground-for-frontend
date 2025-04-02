import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { completionOverlayVisibleAtom } from '../store/atoms';

/**
 * 完成オーバーレイの表示/非表示を管理するカスタムフック
 */
export const useCompletionOverlay = () => {
  // 状態
  const [overlayVisible, setOverlayVisible] = useAtom(completionOverlayVisibleAtom);

  /**
   * オーバーレイの表示状態を切り替える
   */
  const toggleOverlay = useCallback(() => {
    setOverlayVisible(prev => !prev);
  }, [setOverlayVisible]);

  /**
   * オーバーレイを表示する
   */
  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
  }, [setOverlayVisible]);

  /**
   * オーバーレイを非表示にする
   */
  const hideOverlay = useCallback(() => {
    setOverlayVisible(false);
  }, [setOverlayVisible]);

  return {
    overlayVisible,
    toggleOverlay,
    showOverlay,
    hideOverlay,
  };
};
