/**
 * セーブデータ上書き確認ダイアログ
 */
import React from 'react';
import { COLORS } from '../../constants';
import { Button } from '../styles';

interface OverwriteConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * セーブデータの上書き確認ダイアログ
 */
export const OverwriteConfirmDialog: React.FC<OverwriteConfirmDialogProps> = ({ onConfirm, onCancel }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border2}`,
        borderRadius: 12, padding: '24px 32px', maxWidth: 360, textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: COLORS.text, marginBottom: 16 }}>
          セーブデータがあります。新しいゲームを開始すると上書きされます。
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button $color={COLORS.red} onClick={onConfirm} style={{ padding: '10px 20px', fontSize: 12 }}>
            上書きして開始
          </Button>
          <Button $color={COLORS.muted} onClick={onCancel} style={{ padding: '10px 20px', fontSize: 12 }}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
};
