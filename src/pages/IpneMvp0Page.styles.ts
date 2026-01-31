import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  flex-grow: 1;
  min-height: 100vh;
  min-height: 0;
  position: relative;
  background-color: #222;
  color: #fff;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Overlay = styled.div<{ $bgImage?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.85);
  background-image: ${({ $bgImage }) =>
    $bgImage
      ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${$bgImage})`
      : 'none'};
  background-size: cover;
  background-position: center;
  color: white;
  z-index: 20;
  padding: 2rem;
  text-align: center;

  h1 {
    font-size: 3rem;
    margin-bottom: 2rem;
    color: #a0c0ff;
    text-shadow: 0 0 10px rgba(160, 192, 255, 0.5);
  }

  p {
    font-size: 1.5rem;
    line-height: 1.6;
    max-width: 600px;
  }
`;

export const CanvasContainer = styled.canvas`
  background-color: #000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  max-width: 100%;
  max-height: 100%;
  display: block;
`;

export const MobileTouchLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30; /* Higher than Overlay for priority? No, Overlay needs to be clickable. But during Game, Overlay is gone. */
  /* Overlay is z-index 20. If we want TouchLayer to be active during game, it should be high. */
  opacity: 0; /* Fully transparent as requested */
  touch-action: none; /* Prevent browser scrolling/gestures */
`;

export const TouchZone = styled.div<{ $area: string }>`
  grid-area: ${({ $area }) => $area};
  /* background: rgba(255, 255, 255, 0.1); */ /* Debug visual */
`;
