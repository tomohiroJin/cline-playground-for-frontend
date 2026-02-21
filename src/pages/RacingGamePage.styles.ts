import styled, { css } from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
`;

export const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

export const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(79, 172, 254, 0.5);
  margin-bottom: 0.5rem;
`;

export const SubTitle = styled.div`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const CanvasContainer = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #000;
`;

export const Canvas = styled.canvas`
  display: block;
  width: 100%;
  max-width: 900px;
  height: auto;
  aspect-ratio: 900 / 700;
  touch-action: none;
`;

export const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

export const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
`;

export const Label = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #aaa;
  margin-right: 0.5rem;
`;

export const Button = styled.button<{ $active?: boolean; $color?: string }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${props =>
    props.$active
      ? css`
          background: ${props.$color || '#4facfe'};
          color: white;
          box-shadow: 0 0 15px ${props.$color || '#4facfe'}80;
          transform: translateY(-1px);
        `
      : css`
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          &:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
          }
        `}
`;

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  padding: 1rem 0;
  overflow-y: auto;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const ResultCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  min-width: 280px;
`;

export const ResultTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #fff;
`;

export const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 1rem;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
`;

export const ActionButton = styled.button`
  background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
  border: none;
  padding: 1rem 3rem;
  border-radius: 50px;
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const MobileControls = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  padding: 0 1rem;
  margin-top: 1rem;
  pointer-events: auto;

  @media (min-width: 1024px) {
    display: none;
  }
`;

export const TouchButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(55, 65, 81, 0.8);
  border: none;
  color: white;
  font-size: 1.875rem;
  display: flex;
  justify-content: center;
  align-items: center;
  touch-action: none;
  user-select: none;

  &:active {
    background: rgba(107, 114, 128, 1);
  }
`;

export const CheckpointAnnounce = styled.div`
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 900;
  color: #ffeb3b;
  text-shadow: 0 0 20px rgba(255, 235, 59, 0.8);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  pointer-events: none;
  white-space: nowrap;

  @keyframes popIn {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
`;

export const Btn = styled.button<{ $sel?: boolean; $color?: string }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  background: ${props => (props.$sel ? props.$color || '#4facfe' : 'rgba(255, 255, 255, 0.1)')};
  color: ${props => (props.$sel ? 'white' : 'rgba(255, 255, 255, 0.7)')};
  box-shadow: ${props => (props.$sel ? `0 0 15px ${props.$color || '#4facfe'}80` : 'none')};
  transform: ${props => (props.$sel ? 'translateY(-1px)' : 'none')};

  &:hover {
    background: ${props => (props.$sel ? props.$color || '#4facfe' : 'rgba(255, 255, 255, 0.15)')};
    color: white;
  }
`;

export const ColorBtn = styled.button<{ $color: string; $sel?: boolean; label?: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid ${props => (props.$sel ? '#fff' : 'transparent')};
  background-color: ${props => props.$color};
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: ${props => (props.$sel ? `0 0 10px ${props.$color}` : 'none')};
  transform: ${props => (props.$sel ? 'scale(1.2)' : 'scale(1)')};

  &:hover {
    transform: scale(1.2);
  }
`;
