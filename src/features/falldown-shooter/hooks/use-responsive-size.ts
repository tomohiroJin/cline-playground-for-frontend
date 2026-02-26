// レスポンシブセルサイズ計算フック

import { useState, useEffect } from 'react';
import { CONFIG } from '../constants';

const PADDING = 32; // 左右パディング合計

/** ウィンドウサイズに応じたセルサイズを計算する */
const calculateCellSize = (windowWidth: number): number => {
  const maxWidth = windowWidth - PADDING;
  const calculated = Math.floor(maxWidth / CONFIG.grid.width);
  return Math.min(calculated, CONFIG.grid.cellSize);
};

export const useResponsiveSize = (): number => {
  const [cellSize, setCellSize] = useState<number>(() =>
    typeof window !== 'undefined'
      ? calculateCellSize(window.innerWidth)
      : CONFIG.grid.cellSize
  );

  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return cellSize;
};
