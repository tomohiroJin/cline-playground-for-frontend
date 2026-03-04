import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_SEO_DATA, SITE_BASE_URL } from '../constants/game-seo-data';
import { useStructuredData } from './useStructuredData';

/**
 * 現在のルートに応じたゲーム構造化データ（VideoGame + BreadcrumbList）を挿入するフック
 * ゲームページでのみ動作し、非ゲームページではスキップする
 */
export const useGameStructuredData = (): void => {
  const { pathname } = useLocation();
  const gameData = GAME_SEO_DATA[pathname];
  const isGamePage = gameData !== undefined;

  const videoGameData = useMemo(
    () => ({
      name: gameData?.name ?? '',
      description: gameData?.description ?? '',
      url: gameData ? `${SITE_BASE_URL}${gameData.path}` : '',
    }),
    [gameData]
  );

  const breadcrumbData = useMemo(
    () => ({
      items: gameData
        ? [
            { name: 'ホーム', url: `${SITE_BASE_URL}/` },
            { name: gameData.name, url: `${SITE_BASE_URL}${gameData.path}` },
          ]
        : [],
    }),
    [gameData]
  );

  // VideoGame スキーマ
  useStructuredData({
    type: 'VideoGame',
    data: videoGameData,
    skip: !isGamePage,
  });

  // BreadcrumbList スキーマ
  useStructuredData({
    type: 'BreadcrumbList',
    data: breadcrumbData,
    skip: !isGamePage,
  });
};
