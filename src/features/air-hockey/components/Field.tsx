import React from 'react';
import { GameCanvas } from '../styles';
import { CONSTANTS } from '../core/constants';
import { ShakeState } from '../core/types';

type FieldProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onInput: (e: React.MouseEvent | React.TouchEvent) => void;
  shake?: ShakeState | null;
};

export const Field: React.FC<FieldProps> = ({ canvasRef, onInput, shake }) => {
  const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

  // シェイク状態に応じた transform を計算
  const getShakeTransform = (): string => {
    if (!shake) return 'none';
    const now = Date.now();
    const elapsed = now - shake.startTime;
    if (elapsed >= shake.duration) return 'none';
    const decay = 1 - elapsed / shake.duration;
    const offsetX = (Math.random() - 0.5) * 2 * shake.intensity * decay;
    const offsetY = (Math.random() - 0.5) * 2 * shake.intensity * decay;
    return `translate(${offsetX}px, ${offsetY}px)`;
  };

  return (
    <GameCanvas
      ref={canvasRef}
      width={W}
      height={H}
      onMouseMove={onInput}
      onMouseDown={onInput}
      onTouchMove={onInput}
      onTouchStart={onInput}
      role="img"
      aria-label="エアホッケーゲーム画面"
      tabIndex={0}
      data-testid="air-hockey-canvas"
      style={{ transform: getShakeTransform() }}
    />
  );
};
