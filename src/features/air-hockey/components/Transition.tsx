import React, { useState, useEffect, useRef } from 'react';

type TransitionType = 'fade' | 'slide-left' | 'slide-right';

type TransitionProps = {
  isActive: boolean;
  type: TransitionType;
  duration?: number;
  onComplete?: () => void;
  children: React.ReactNode;
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
  duration = 300,
  onComplete,
  children,
}) => {
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
