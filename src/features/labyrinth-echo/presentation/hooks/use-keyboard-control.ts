/**
 * 迷宮の残響 - useKeyboardControl フック
 *
 * キーボード操作制御を管理する。
 */
import { useState, useEffect } from 'react';

export interface KeyboardControlParams {
  optionsCount: number;
  onSelect: (index: number) => void;
  onCancel?: () => void;
  isActive: boolean;
}

export const useKeyboardControl = ({ optionsCount, onSelect, onCancel, isActive }: KeyboardControlParams) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [optionsCount, isActive]);

  useEffect(() => {
    if (!isActive || optionsCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const numKey = parseInt(e.key, 10);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= optionsCount) {
        setSelectedIndex(numKey - 1);
        onSelect(numKey - 1);
        e.preventDefault();
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
        case 'Tab':
          if (e.key === 'Tab' && e.shiftKey) {
            setSelectedIndex(prev => (prev - 1 + optionsCount) % optionsCount);
          } else {
            setSelectedIndex(prev => (prev + 1) % optionsCount);
          }
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'k':
          setSelectedIndex(prev => (prev - 1 + optionsCount) % optionsCount);
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          onSelect(selectedIndex);
          e.preventDefault();
          break;
        case 'Escape':
        case 'Backspace':
          if (onCancel) {
            onCancel();
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, optionsCount, selectedIndex, onSelect, onCancel]);

  return { selectedIndex, setSelectedIndex };
};
