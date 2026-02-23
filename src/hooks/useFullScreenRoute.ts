import { useLocation } from 'react-router-dom';

/**
 * 現在のルートがゲーム画面（ヘッダー/フッター非表示）かどうかを判定するフック
 * `/` 以外のパスは全てゲームルートとみなす
 */
export const useFullScreenRoute = (): boolean => {
  const { pathname } = useLocation();
  return pathname !== '/';
};
