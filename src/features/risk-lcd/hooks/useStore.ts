import { useState, useCallback, useRef } from 'react';
import type { SaveData } from '../types';
import { SAVE_KEY, LEGACY_KEYS } from '../constants';

// デフォルトセーブデータ
const DEFAULT: SaveData = {
  pts: 0,
  plays: 0,
  best: 0,
  bestSt: 0,
  sty: ['standard'],
  ui: [],
  eq: ['standard'],
};

// localStorage 永続化フック
export function useStore() {
  const [data, setData] = useState<SaveData>(() => {
    try {
      // レガシーキーからのマイグレーション
      LEGACY_KEYS.forEach((k) => {
        const old = localStorage.getItem(k);
        if (old && !localStorage.getItem(SAVE_KEY)) {
          localStorage.setItem(SAVE_KEY, old);
          localStorage.removeItem(k);
        }
      });
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT, ...JSON.parse(raw) };
        // eq が文字列の場合は配列に変換
        if (typeof parsed.eq === 'string') parsed.eq = [parsed.eq];
        if (!Array.isArray(parsed.eq) || !parsed.eq.length)
          parsed.eq = ['standard'];
        return parsed;
      }
    } catch (e) {
      console.error('[Store] load:', e);
    }
    return { ...DEFAULT };
  });

  // データ参照用 ref（コールバック内で最新値を参照）
  const dataRef = useRef(data);
  dataRef.current = data;

  // 保存ヘルパー
  const persist = useCallback((next: SaveData) => {
    dataRef.current = next;
    setData(next);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('[Store] save:', e);
    }
  }, []);

  // PT追加
  const addPts = useCallback(
    (n: number) => {
      const d = { ...dataRef.current, pts: dataRef.current.pts + n };
      persist(d);
    },
    [persist],
  );

  // PT消費（足りなければ false）
  const spend = useCallback(
    (n: number): boolean => {
      if (dataRef.current.pts < n) return false;
      persist({ ...dataRef.current, pts: dataRef.current.pts - n });
      return true;
    },
    [persist],
  );

  // スタイル所持判定
  const hasStyle = useCallback(
    (id: string) => dataRef.current.sty.includes(id),
    [],
  );

  // アンロック所持判定
  const hasUnlock = useCallback(
    (id: string) => dataRef.current.ui.includes(id),
    [],
  );

  // スタイル購入
  const ownStyle = useCallback(
    (id: string) => {
      if (dataRef.current.sty.includes(id)) return;
      persist({ ...dataRef.current, sty: [...dataRef.current.sty, id] });
    },
    [persist],
  );

  // アンロック購入
  const ownUnlock = useCallback(
    (id: string) => {
      if (dataRef.current.ui.includes(id)) return;
      persist({ ...dataRef.current, ui: [...dataRef.current.ui, id] });
    },
    [persist],
  );

  // 最大装備スロット数
  const maxSlots = useCallback((): number => {
    const d = dataRef.current;
    return d.ui.includes('slot3') ? 3 : d.ui.includes('slot2') ? 2 : 1;
  }, []);

  // 装備中か
  const isEq = useCallback(
    (id: string) => dataRef.current.eq.includes(id),
    [],
  );

  // 装備トグル
  const toggleEq = useCallback(
    (id: string): boolean => {
      const d = dataRef.current;
      if (!d.sty.includes(id)) return false;
      if (d.eq.includes(id)) {
        if (d.eq.length <= 1) return false;
        persist({ ...d, eq: d.eq.filter((x) => x !== id) });
        return true;
      }
      const mx = d.ui.includes('slot3') ? 3 : d.ui.includes('slot2') ? 2 : 1;
      const newEq = [...d.eq];
      if (newEq.length >= mx) newEq.shift();
      newEq.push(id);
      persist({ ...d, eq: newEq });
      return true;
    },
    [persist],
  );

  // ベスト更新
  const updateBest = useCallback(
    (score: number, stage: number) => {
      const d = dataRef.current;
      persist({
        ...d,
        best: Math.max(d.best, score),
        bestSt: Math.max(d.bestSt, stage),
        plays: d.plays + 1,
      });
    },
    [persist],
  );

  return {
    data,
    addPts,
    spend,
    hasStyle,
    hasUnlock,
    ownStyle,
    ownUnlock,
    maxSlots,
    isEq,
    toggleEq,
    updateBest,
  };
}
