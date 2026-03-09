/**
 * バトルポップアップ管理フック
 * ダメージ/回復ポップアップの追加・自動除去・クリーンアップを管理
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { mkPopup } from '../../game-logic';

const MAX_POPUP_DISPLAY = 6;
const POPUP_DURATION_MS = 900;

/** DOM ポップアップ用エントリ */
export interface PopupEntry {
  id: number;
  v: number;
  x: number;
  cl: string;
  fs: number;
  heal: boolean;
}

/** ポップアップ管理フックの戻り値 */
export interface UseBattlePopupsResult {
  enPopups: PopupEntry[];
  plPopups: PopupEntry[];
  addPopup: (v: number, crit: boolean, heal: boolean, tgt: 'en' | 'pl') => void;
}

/** バトルポップアップの表示・消去を管理 */
export function useBattlePopups(): UseBattlePopupsResult {
  const [enPopups, setEnPopups] = useState<PopupEntry[]>([]);
  const [plPopups, setPlPopups] = useState<PopupEntry[]>([]);
  const popupIdRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // アンマウント時に全 setTimeout をクリーンアップ
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timersRef.current.clear();
    };
  }, []);

  const addPopup = useCallback((v: number, crit: boolean, heal: boolean, tgt: 'en' | 'pl') => {
    const base = mkPopup(v, crit, heal);
    const id = ++popupIdRef.current;
    // プレイヤー被ダメは赤に上書き
    const cl = tgt === 'pl' && !heal ? '#ff5050' : base.cl;
    const entry: PopupEntry = {
      id, v: base.v, x: 30 + Math.random() * 40, cl, fs: base.fs, heal,
    };
    const setter = tgt === 'en' ? setEnPopups : setPlPopups;
    setter(prev => [...prev, entry].slice(-MAX_POPUP_DISPLAY));

    // アニメーション後に自動除去
    const tid = setTimeout(() => {
      timersRef.current.delete(tid);
      setter(prev => prev.filter(p => p.id !== id));
    }, POPUP_DURATION_MS);
    timersRef.current.add(tid);
  }, []);

  return { enPopups, plPopups, addPopup };
}
