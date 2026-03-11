// レスポンシブレイアウト計算フック

import { useState, useEffect } from 'react';
import { CONFIG, BREAKPOINTS } from '../constants';

const PADDING = 32; // 左右パディング合計
const LANDSCAPE_HEADER_HEIGHT = 80; // 横向き時のヘッダー高さ
const PORTRAIT_UI_HEIGHT = 200; // 縦向き時のUI高さ（Header + SkillGauge + StatusBar + Controller）
const MAX_CELL_SIZE = 50; // セルサイズの上限（大画面での見た目を制御）

/** レスポンシブレイアウト情報 */
export interface ResponsiveLayout {
  cellSize: number;
  isLandscape: boolean;
  isMobile: boolean;
  controllerPosition: 'bottom' | 'side';
}

/** 縦向き時のセルサイズを幅と高さ両方から計算する（デスクトップ以外では上限なし） */
const calculatePortraitCellSize = (width: number, height: number): number => {
  const widthBased = Math.floor((width - PADDING) / CONFIG.grid.width);
  const heightBased = Math.floor((height - PORTRAIT_UI_HEIGHT) / CONFIG.grid.height);
  return Math.min(widthBased, heightBased);
};

/** 横向き時のセルサイズを画面高さから計算する（デスクトップ以外では上限なし） */
const calculateLandscapeCellSize = (height: number): number => {
  return Math.floor((height - LANDSCAPE_HEADER_HEIGHT) / CONFIG.grid.height);
};

/** ウィンドウサイズからレスポンシブレイアウト情報を計算する */
const calculateLayout = (width: number, height: number): ResponsiveLayout => {
  const isMobile = width <= BREAKPOINTS.mobile;
  const isDesktop = width > BREAKPOINTS.desktop;
  const isLandscape = width > height && !isDesktop;

  let cellSize: number;

  if (isLandscape) {
    // 横向き: 高さベースで計算
    cellSize = calculateLandscapeCellSize(height);
  } else {
    // 縦向き（すべてのサイズ）: 幅と高さ両方から画面に収まる最大サイズ
    cellSize = calculatePortraitCellSize(width, height);
  }

  // セルサイズの下限・上限を適用
  cellSize = Math.max(cellSize, CONFIG.grid.cellSize);
  cellSize = Math.min(cellSize, MAX_CELL_SIZE);

  const controllerPosition = isLandscape ? 'side' : 'bottom';

  return { cellSize, isLandscape, isMobile, controllerPosition };
};

export const useResponsiveSize = (): ResponsiveLayout => {
  const [layout, setLayout] = useState<ResponsiveLayout>(() =>
    typeof window !== 'undefined'
      ? calculateLayout(window.innerWidth, window.innerHeight)
      : { cellSize: CONFIG.grid.cellSize, isLandscape: false, isMobile: false, controllerPosition: 'bottom' }
  );

  useEffect(() => {
    const handleResize = () => {
      setLayout(calculateLayout(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
};
