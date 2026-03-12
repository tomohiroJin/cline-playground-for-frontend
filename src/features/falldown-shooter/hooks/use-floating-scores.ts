// フローティングスコア管理フック

import { useState, useCallback, useRef, useEffect } from 'react';
import type { FloatingScoreItem } from '../components/FloatingScore';
import { MAX_FLOATING_SCORES } from '../constants';

const FLOAT_DURATION = 800; // フローティングスコアの表示時間（ms）

interface UseFloatingScoresReturn {
  items: FloatingScoreItem[];
  addScore: (x: number, y: number, score: number, multiplier: number) => void;
}

/** フローティングスコアの表示・自動消去を管理するフック */
export const useFloatingScores = (): UseFloatingScoresReturn => {
  const [items, setItems] = useState<FloatingScoreItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // アンマウント時のタイマークリーンアップ
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const addScore = useCallback((x: number, y: number, score: number, multiplier: number) => {
    counterRef.current += 1;
    const id = `fs-${counterRef.current}`;
    const newItem: FloatingScoreItem = { id, x, y, score, multiplier };

    // 最大表示数を超えた場合は古いアイテムを削除
    setItems(prev => {
      const updated = [...prev, newItem];
      return updated.length > MAX_FLOATING_SCORES ? updated.slice(-MAX_FLOATING_SCORES) : updated;
    });

    // 表示時間後に自動削除
    const timer = setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id));
      timersRef.current.delete(timer);
    }, FLOAT_DURATION);
    timersRef.current.add(timer);
  }, []);

  return { items, addScore };
};
