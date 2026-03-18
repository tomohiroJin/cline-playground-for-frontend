/**
 * 保存完了トーストコンポーネント
 */
import React from 'react';
import { COLORS } from '../constants';

interface SaveToastProps {
  visible: boolean;
}

/** 保存完了トースト */
export const SaveToast: React.FC<SaveToastProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: COLORS.green,
      color: '#fff',
      padding: '10px 24px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      ✓ 保存しました
    </div>
  );
};
