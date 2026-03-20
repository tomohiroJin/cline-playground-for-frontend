import { useState, useCallback, useRef, useEffect } from 'react';

/** 画面の種類 */
export type ScreenType =
  | 'menu'
  | 'game'
  | 'result'
  | 'achievements'
  | 'daily'
  | 'stageSelect'
  | 'preDialogue'
  | 'vsScreen'
  | 'postDialogue'
  | 'chapterTitle'
  | 'victoryCutIn'
  | 'characterDex';

/** トランジション遅延のデフォルト値（ミリ秒） */
const DEFAULT_TRANSITION_DELAY = 300;

/** 画面遷移管理フックの返り値 */
export type UseScreenNavigationReturn = {
  screen: ScreenType;
  transitioning: boolean;
  navigateTo: (screen: ScreenType) => void;
  navigateWithTransition: (screen: ScreenType, delay?: number) => void;
  goToMenu: () => void;
};

/**
 * 画面遷移管理フック
 * - 画面状態の遷移管理のみ
 */
export function useScreenNavigation(): UseScreenNavigationReturn {
  const [screen, setScreen] = useState<ScreenType>('menu');
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /** 即座に画面遷移 */
  const navigateTo = useCallback((newScreen: ScreenType) => {
    setScreen(newScreen);
  }, []);

  /** トランジション付き画面遷移 */
  const navigateWithTransition = useCallback((newScreen: ScreenType, delay = DEFAULT_TRANSITION_DELAY) => {
    // 前のトランジションタイマーをキャンセル
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    setTransitioning(true);
    timerRef.current = setTimeout(() => {
      setScreen(newScreen);
      setTransitioning(false);
      timerRef.current = null;
    }, delay);
  }, []);

  /** メニューに戻る */
  const goToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  return {
    screen,
    transitioning,
    navigateTo,
    navigateWithTransition,
    goToMenu,
  };
}
