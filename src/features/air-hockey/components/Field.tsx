import React from 'react';
import { GameCanvas } from '../styles';
import { CONSTANTS } from '../core/constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

type FieldProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onInput: (e: React.MouseEvent | React.TouchEvent) => void;
};

export const Field: React.FC<FieldProps> = ({ canvasRef, onInput }) => (
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
