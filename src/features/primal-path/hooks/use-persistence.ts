/**
 * 原始進化録 - PRIMAL PATH - usePersistence フック
 *
 * localStorage との同期管理
 */
import { useState, useEffect, useRef } from 'react';
import type { GameState } from '../types';
import { Storage } from '../storage';
import type { GameAction } from './actions';

/** 永続化管理フック */
export function usePersistence(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
) {
  const [loaded, setLoaded] = useState(false);
  const prevSaveRef = useRef<string>('');

  // マウント時にロード
  useEffect(() => {
    const data = Storage.load();
    if (data) {
      dispatch({ type: 'LOAD_SAVE', save: data });
    }
    setLoaded(true);
  }, [dispatch]);

  // 変更時にセーブ
  useEffect(() => {
    if (!loaded) return;
    const json = JSON.stringify(state.save);
    if (json !== prevSaveRef.current) {
      prevSaveRef.current = json;
      Storage.save(state.save);
    }
  }, [state.save, loaded]);

  return { loaded };
}
