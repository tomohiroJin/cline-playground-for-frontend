import React from 'react';
import { MinimapContainer } from '../../../pages/MazeHorrorPage.styles';

interface MinimapProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  size: number;
}

// Canvas ベースのミニマップ（描画はゲームループ内で MinimapRenderer が担当）
export const Minimap: React.FC<MinimapProps> = ({ canvasRef, size }) => (
  <MinimapContainer>
    <canvas
      ref={canvasRef}
      width={size * 4}
      height={size * 4}
      style={{ display: 'block' }}
    />
  </MinimapContainer>
);
