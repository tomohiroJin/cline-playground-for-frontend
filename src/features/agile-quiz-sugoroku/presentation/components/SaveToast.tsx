/**
 * 保存完了トーストコンポーネント
 */
import React from 'react';
import { DESIGN_TOKENS } from '../styles/design-tokens';

interface SaveToastProps {
  visible: boolean;
}

/** 保存完了トースト */
export const SaveToast: React.FC<SaveToastProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: DESIGN_TOKENS.spacing.lg,
      left: '50%',
      transform: 'translateX(-50%)',
      background: DESIGN_TOKENS.colors.secondary,
      color: '#fff',
      padding: '10px 24px',
      borderRadius: DESIGN_TOKENS.borderRadius.md,
      fontSize: 13,
      fontWeight: 700,
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      ✓ 保存しました
    </div>
  );
};
