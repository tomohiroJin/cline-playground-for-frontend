import React, { useState, useEffect, useRef } from 'react';

type TransitionType = 'fade' | 'slide-left' | 'slide-right';

type TransitionProps = {
  isActive: boolean;
  type: TransitionType;
  duration?: number;
  onComplete?: () => void;
  children: React.ReactNode;
};

/** E2E テストモード判定（`?e2e=1` で遷移を即時完了させる） */
const isE2ETestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('e2e');
};

const getTransitionStyles = (type: TransitionType, phase: 'enter' | 'exit'): React.CSSProperties => {
  const isEnter = phase === 'enter';
  switch (type) {
    case 'fade':
      return { opacity: isEnter ? 1 : 0 };
    case 'slide-left':
      return { transform: isEnter ? 'translateX(0)' : 'translateX(-100%)' };
    case 'slide-right':
      return { transform: isEnter ? 'translateX(0)' : 'translateX(100%)' };
  }
};

export const Transition: React.FC<TransitionProps> = ({
  isActive,
  type,
  duration: rawDuration = 300,
  onComplete,
  children,
}) => {
  // E2E モード時は遷移を即時完了（VRT の flaky 対策）
  const duration = isE2ETestMode() ? 0 : rawDuration;
  const [visible, setVisible] = useState(isActive);
  const [phase, setPhase] = useState<'enter' | 'exit'>(isActive ? 'enter' : 'exit');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      // 次フレームで enter を適用（アニメーション発火のため）
      requestAnimationFrame(() => setPhase('enter'));
    } else {
      setPhase('exit');
      const timer = setTimeout(() => {
        setVisible(false);
        onCompleteRef.current?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  if (!visible) return null;

  return (
    <div
      style={{
        ...getTransitionStyles(type, phase),
        transition: `all ${duration}ms ease-in-out`,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
};
