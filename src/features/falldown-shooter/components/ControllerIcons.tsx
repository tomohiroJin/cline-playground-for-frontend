// コントローラー用SVGアイコンコンポーネント

import React from 'react';

/** 左移動ボタン用シェブロンアイコン */
export const ChevronLeftIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" width="24" height="24">
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

/** 右移動ボタン用シェブロンアイコン */
export const ChevronRightIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" width="24" height="24">
    <polyline points="9,6 15,12 9,18" />
  </svg>
);

/** 射撃ボタン用クロスヘアアイコン */
export const CrosshairIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="28" height="28">
    <circle cx="12" cy="12" r="6" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);
