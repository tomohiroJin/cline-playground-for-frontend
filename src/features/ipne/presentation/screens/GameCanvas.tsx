/**
 * ゲームCanvasラッパーコンポーネント
 * Canvas要素とそのラッパーを React.memo でメモ化
 */
import React from 'react';
import {
  CanvasWrapper,
  Canvas,
} from '../../../../pages/IpnePage.styles';

/** GameCanvas の Props 定義 */
export interface GameCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Canvas要素のメモ化ラッパーコンポーネント
 * Canvas描画useEffectはGameScreenに残すが、DOM要素のみを分離
 */
export const GameCanvas = React.memo<GameCanvasProps>(
  ({ canvasRef, canvasWrapperRef }) => (
    <CanvasWrapper ref={canvasWrapperRef}>
      <Canvas
        ref={canvasRef}
        role="img"
        aria-label="迷路ゲーム画面"
        tabIndex={0}
      />
    </CanvasWrapper>
  ),
  // Canvas要素自体はref経由で操作されるため、propsの比較は不要（常に同じrefオブジェクト）
  () => true
);

GameCanvas.displayName = 'GameCanvas';
