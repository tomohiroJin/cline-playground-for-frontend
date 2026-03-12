// テストモード管理フック
// タイトル画面で「jin」を3回タイプすると有効化/無効化するトグル式の裏技モード

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameStatus } from '../types';

/** 隠しコマンド文字列（「jin」× 3回 = 9文字） */
const SECRET_COMMAND = 'jinjinjin';
/** キー入力バッファの最大長 */
const BUFFER_LENGTH = SECRET_COMMAND.length;

export interface UseTestModeReturn {
  isTestMode: boolean;
}

/**
 * テストモードの隠しコマンド検知と状態管理を行うフック
 * idle状態でのみキー入力を監視し、「jinjinjin」でトグル動作する
 */
export const useTestMode = (status: GameStatus): UseTestModeReturn => {
  const [isTestMode, setIsTestMode] = useState(false);
  const bufferRef = useRef('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // idle 状態でのみ検知
    if (status !== 'idle') return;

    // 1文字のキーのみバッファに追加
    if (e.key.length !== 1) return;

    bufferRef.current = (bufferRef.current + e.key).slice(-BUFFER_LENGTH);

    if (bufferRef.current === SECRET_COMMAND) {
      setIsTestMode(prev => !prev);
      bufferRef.current = '';
    }
  }, [status]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { isTestMode };
};
