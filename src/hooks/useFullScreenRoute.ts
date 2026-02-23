import { useLocation } from 'react-router-dom';

/** フルスクリーン表示のゲームルート一覧 */
const FULL_SCREEN_ROUTES: ReadonlyArray<string> = [
  '/ipne',
  '/risk-lcd',
  '/maze-horror',
  '/primal-path',
];

/**
 * 現在のルートがフルスクリーンゲームかどうかを判定するフック
 */
export const useFullScreenRoute = (): boolean => {
  const { pathname } = useLocation();
  return FULL_SCREEN_ROUTES.includes(pathname);
};
