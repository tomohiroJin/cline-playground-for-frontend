import React, { useEffect, useRef, useCallback } from 'react';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  /** 破壊的操作ラベル（例: 「メニューに戻る」） */
  confirmLabel: string;
  /** 安全操作ラベル（例: 「続ける」） */
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** 共通確認ダイアログ（S-3: 他ゲームでも再利用可能） */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // MF-1: 初期フォーカスを「続ける」（安全な操作）に設定
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  // Escape キーで onCancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // MF-1: キーボードフォーカス時にリングを表示
  const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid #fff';
  }, []);
  const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid transparent';
  }, []);

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} data-testid="confirm-dialog-overlay" onClick={onCancel}>
      <div style={dialogStyle} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={buttonContainerStyle}>
          <button ref={cancelRef} onClick={onCancel} style={cancelButtonStyle} onFocus={handleFocus} onBlur={handleBlur}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} style={confirmButtonStyle} onFocus={handleFocus} onBlur={handleBlur}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── スタイル定義 ────────────────

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  // R-1: アニメーション（CSS で対応。prefers-reduced-motion は media query で制御）
};

const dialogStyle: React.CSSProperties = {
  background: '#2c3e50',
  borderRadius: '12px',
  padding: '24px 32px',
  maxWidth: '400px',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const messageStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: '14px',
  margin: '0 0 24px 0',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
};

const baseButtonStyle: React.CSSProperties = {
  minHeight: '44px',
  minWidth: '120px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer',
  // MF-1: フォーカスリングを有効にする（WCAG 2.4.7 Focus Visible）
  outline: '2px solid transparent',
  outlineOffset: '2px',
};

/** 安全な操作（続ける）— 視覚的に目立たせる */
const cancelButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: '#3498db',
  color: '#fff',
};

/** 破壊的操作（メニューに戻る）— ゴーストスタイルで視覚的重みを下げる */
const confirmButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  background: 'transparent',
  border: '1px solid #e74c3c',
  color: '#e74c3c',
};
