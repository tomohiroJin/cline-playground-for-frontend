// コンボシステムフック

import { useState, useCallback, useRef, useEffect } from 'react';
import { COMBO_CONFIG } from '../constants';
import type { ComboState } from '../types';

/** コンボカウントから倍率を取得する */
const getMultiplier = (count: number): number => {
  const table = COMBO_CONFIG.multiplierTable;
  let multiplier = table[0].multiplier;
  for (const entry of table) {
    if (count >= entry.minCombo) {
      multiplier = entry.multiplier;
    }
  }
  return multiplier;
};

/** コンボカウントから表示テキストを生成する */
const getDisplayText = (count: number): string => {
  if (count < 2) return '';
  if (count >= 10) return 'MAX COMBO!!!!!';
  const exclamations = '!'.repeat(Math.min(count - 1, 4));
  return `${count} COMBO${exclamations}`;
};

/** コンボの初期状態 */
const INITIAL_STATE: ComboState = {
  count: 0,
  multiplier: 1.0,
  isActive: false,
  skillBonus: 0,
  displayText: '',
};

interface ComboHitResult {
  skillBonus: number;
}

interface UseComboSystemReturn {
  comboState: ComboState;
  registerHit: () => ComboHitResult;
  resetCombo: () => void;
}

/** コンボシステムを管理するフック */
export const useComboSystem = (): UseComboSystemReturn => {
  const [comboState, setComboState] = useState<ComboState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef = useRef(0);

  // アンマウント時のタイマークリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resetCombo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    countRef.current = 0;
    setComboState(INITIAL_STATE);
  }, []);

  const registerHit = useCallback((): ComboHitResult => {
    // タイマーをリセット
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // refで同期的にカウントを管理
    countRef.current += 1;
    const newCount = countRef.current;
    const multiplier = getMultiplier(newCount);
    const displayText = getDisplayText(newCount);

    // 5コンボごとにスキルゲージボーナス
    const skillBonus = (newCount > 0 && newCount % COMBO_CONFIG.skillBonusInterval === 0)
      ? COMBO_CONFIG.skillBonusAmount
      : 0;

    setComboState({
      count: newCount,
      multiplier,
      isActive: true,
      skillBonus,
      displayText,
    });

    // コンボウィンドウ後にリセット
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
      setComboState(INITIAL_STATE);
    }, COMBO_CONFIG.windowMs);

    return { skillBonus };
  }, []);

  return { comboState, registerHit, resetCombo };
};
