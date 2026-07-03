import React from 'react';
import { GameCanvas } from '../styles';
import { CONSTANTS } from '../core/constants';

type FieldProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onInput: (e: React.MouseEvent | React.TouchEvent) => void;
};

// 画面シェイクは useGameLoop が rAF ループ内で canvas.style.transform を
// 毎フレーム更新して適用する（本コンポーネントは transform を触らない）。
export const Field: React.FC<FieldProps> = ({ canvasRef, onInput }) => {
  const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

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
    />
  );
};
