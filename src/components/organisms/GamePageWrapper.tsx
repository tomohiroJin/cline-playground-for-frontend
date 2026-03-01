import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_NOTICES } from '../../constants/game-notices';
import { GameNotice } from '../molecules/GameNotice';
import { stopAllAudio } from '../../utils/audio-cleanup';
import ErrorBoundary from '../ErrorBoundary';

/** localStorage のキー接頭辞 */
const NOTICE_ACCEPTED_PREFIX = 'game-notice-accepted:';

interface GamePageWrapperProps {
  readonly children: React.ReactNode;
}

/**
 * ゲームページをラップし、プラットフォームとゲームの境界として機能するコンポーネント
 *
 * 責務:
 * 1. 初回アクセス時の注意書きモーダル表示
 * 2. アンマウント時の全音声停止
 * 3. ゲーム固有の ErrorBoundary ラップ
 */
export const GamePageWrapper: React.FC<GamePageWrapperProps> = ({ children }) => {
  const { pathname } = useLocation();
  const notice = GAME_NOTICES[pathname];
  const storageKey = `${NOTICE_ACCEPTED_PREFIX}${pathname}`;

  const [isAccepted, setIsAccepted] = useState(() => {
    if (!notice) return true;
    return localStorage.getItem(storageKey) === 'true';
  });

  // パス変更時に受諾状態をリセット
  useEffect(() => {
    if (!notice) {
      setIsAccepted(true);
      return;
    }
    setIsAccepted(localStorage.getItem(storageKey) === 'true');
  }, [pathname, notice, storageKey]);

  // ゲームページからの離脱時に全音声を停止
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [pathname]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setIsAccepted(true);
  }, [storageKey]);

  // 注意事項がないルートか、既に受諾済みの場合はそのまま表示
  if (isAccepted) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return <GameNotice notice={notice} onAccept={handleAccept} />;
};
