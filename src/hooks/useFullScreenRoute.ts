import { useLocation } from 'react-router-dom';

/** ヘッダー/フッターを表示するルートのホワイトリスト */
const LAYOUT_ROUTES = new Set(['/', '/about', '/privacy-policy', '/terms', '/contact']);

/**
 * 現在のルートがゲーム画面（ヘッダー/フッター非表示）かどうかを判定するフック
 * LAYOUT_ROUTES に含まれないパスはフルスクリーン（ゲーム）ルートとみなす
 */
export const useFullScreenRoute = (): boolean => {
  const { pathname } = useLocation();
  return !LAYOUT_ROUTES.has(pathname);
};
