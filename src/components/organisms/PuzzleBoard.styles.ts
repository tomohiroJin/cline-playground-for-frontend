import styled from 'styled-components';

export const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const Board = styled.div<{ width: number; height: number }>`
  position: relative;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  background-color: #f0f0f0;
  border: 2px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  touch-action: none; /* タッチデバイスでのスクロールを防止 */
`;

export const BoardGrid = styled.div<{ division: number; $completed?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(${props => props.division}, 1fr);
  grid-template-rows: repeat(${props => props.division}, 1fr);
  pointer-events: none;
`;

export const GridCell = styled.div<{ $completed?: boolean }>`
  border: ${props => (props.$completed ? 'none' : '1px dashed rgba(0, 0, 0, 0.1)')};
`;

export const CompletionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 1.5rem;
  z-index: 20;
  cursor: pointer;
`;

export const CompletionMessage = styled.h2`
  margin-bottom: 20px;
`;

export const CompletionTime = styled.p`
  font-size: 1.2rem;
  margin-bottom: 20px;
`;

export const RestartButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
`;

export const StatusBar = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  margin-top: 10px;
  padding: 8px 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  gap: 4px;
`;

export const StatusItem = styled.div`
  font-size: 0.9rem;
  color: #333;
  text-align: center;
  white-space: nowrap;
`;

export const ElapsedTime = styled.div`
  font-size: 0.9rem;
  color: #333;
`;

export const HintToggleButton = styled.button<{ active: string }>`
  background-color: ${props => (props.active ? '#4caf50' : '#f8f8f8')};
  color: ${props => (props.active ? 'white' : '#333')};
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  margin-top: 8px;
  width: 100%;

  &:hover {
    background-color: ${props => (props.active ? '#45a049' : '#e8e8e8')};
  }
`;

export const HintImage = styled.div<{ $imageUrl: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$imageUrl});
  background-size: 100% 100%;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
`;

export const OverlayToggleButton = styled.button<{ active: string }>`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.7);
  color: #333;
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 30;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;

export const EyeIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`;

export const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 30;
`;

export const VideoPlayer = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px; /* 右上から左上に変更 */
  background-color: rgba(255, 255, 255, 0.7);
  color: #333;
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 40;

  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
  }
`;
