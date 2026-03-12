// テストモードインジケーター
// テストモード有効時に画面右上に「TEST」バッジを表示する

import React from 'react';

interface TestModeIndicatorProps {
  isTestMode: boolean;
}

/** テストモード有効時に表示される半透明バッジ */
export const TestModeIndicator: React.FC<TestModeIndicatorProps> = React.memo(({ isTestMode }) => {
  if (!isTestMode) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 8,
        padding: '2px 8px',
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        color: 'white',
        fontSize: '11px',
        fontWeight: 'bold',
        borderRadius: '4px',
        zIndex: 9999,
        pointerEvents: 'none',
        letterSpacing: '1px',
      }}
    >
      TEST
    </div>
  );
});

TestModeIndicator.displayName = 'TestModeIndicator';
