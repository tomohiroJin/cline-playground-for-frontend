import React, { useState, useEffect, useRef, useCallback } from 'react';

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

/** アニメーション遷移: closed → opening → open → closing → closed */
type AnimationPhase = 'closed' | 'opening' | 'open' | 'closing';

/** opening → open の遷移時間（ms）。Material Design standard easing 推奨範囲 */
const OPENING_DURATION = 200;
/** open → closing → closed の遷移時間（ms）。closing はユーザー意図の結果のため短め */
const CLOSING_DURATION = 150;
/** onTransitionEnd 未発火時のフォールバック timer */
const FALLBACK_TIMEOUT = 300;

/** 共通確認ダイアログ（S-3: 他ゲームでも再利用可能、S8-2: アニメーション対応） */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<AnimationPhase>(isOpen ? 'open' : 'closed');
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // isOpen の変化に応じてアニメーションフェーズを更新
  useEffect(() => {
    if (isOpen) {
      setPhase('opening');
      // 次フレームで opening → open の遷移を開始
      const raf = requestAnimationFrame(() => {
        setPhase('open');
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // closed 状態から false が来た場合は何もしない
      setPhase(prev => prev === 'closed' ? 'closed' : 'closing');
    }
  }, [isOpen]);

  // closing フェーズのフォールバック timer（onTransitionEnd 未発火対策）
  useEffect(() => {
    if (phase === 'closing') {
      fallbackTimerRef.current = setTimeout(() => {
        setPhase('closed');
      }, FALLBACK_TIMEOUT);
      return () => clearTimeout(fallbackTimerRef.current);
    }
  }, [phase]);

  // onTransitionEnd で closing → closed（opacity のみで判定し、他プロパティ追加時の二重発火を防止）
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (phase === 'closing' && e.propertyName === 'opacity') {
      clearTimeout(fallbackTimerRef.current);
      setPhase('closed');
    }
  }, [phase]);

  // MF-1: 初期フォーカスを「続ける」（安全な操作）に設定
  useEffect(() => {
    if (phase === 'open') cancelRef.current?.focus();
  }, [phase]);

  // キーボードイベント: Escape + フォーカストラップ（closing/closed では無効）
  useEffect(() => {
    if (phase === 'closed' || phase === 'closing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
        const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey) {
          const nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
          focusable[nextIndex]?.focus();
        } else {
          const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
          focusable[nextIndex]?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase, onCancel]);

  // MF-1: キーボードフォーカス時にリングを表示
  const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid #fff';
  }, []);
  const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
    e.currentTarget.style.outline = '2px solid transparent';
  }, []);

  if (phase === 'closed') return null;

  const isClosing = phase === 'closing';
  const isVisible = phase === 'open';

  // prefers-reduced-motion 対応: モーション軽減時は transition を無効化
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDuration = prefersReducedMotion ? 0 : (isClosing ? CLOSING_DURATION : OPENING_DURATION);

  const currentOverlayStyle: React.CSSProperties = {
    ...overlayStyle,
    opacity: isVisible ? 1 : 0,
    transition: `opacity ${transitionDuration}ms ${isClosing ? 'ease-in' : 'ease-out'}`,
    pointerEvents: isClosing ? 'none' : 'auto',
  };

  const currentDialogStyle: React.CSSProperties = {
    ...dialogStyle,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: `opacity ${transitionDuration}ms ${isClosing ? 'ease-in' : 'ease-out'}, transform ${transitionDuration}ms ${isClosing ? 'ease-in' : 'ease-out'}`,
  };

  return (
    <div style={currentOverlayStyle} data-testid="confirm-dialog-overlay" onClick={isClosing ? undefined : onCancel} onTransitionEnd={handleTransitionEnd}>
      <div style={currentDialogStyle} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={buttonContainerStyle}>
          <button ref={cancelRef} onClick={isClosing ? undefined : onCancel} style={cancelButtonStyle} onFocus={handleFocus} onBlur={handleBlur}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} onClick={isClosing ? undefined : onConfirm} style={confirmButtonStyle} onFocus={handleFocus} onBlur={handleBlur}>
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
