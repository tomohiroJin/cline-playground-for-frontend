import React from 'react';
import { GameCanvas } from '../styles';
import { getConstants } from '../core/constants';
import { CanvasSize } from '../core/types';

type FieldProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onInput: (e: React.MouseEvent | React.TouchEvent) => void;
  canvasSize?: CanvasSize;
};

export const Field: React.FC<FieldProps> = ({ canvasRef, onInput, canvasSize = 'standard' }) => {
  const consts = getConstants(canvasSize);
  const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
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
    />
  );
};
