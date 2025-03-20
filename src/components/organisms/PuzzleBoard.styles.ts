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

export const BoardGrid = styled.div<{ division: number }>`
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

export const GridCell = styled.div`
  border: 1px dashed rgba(0, 0, 0, 0.1);
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
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
`;

export const ElapsedTime = styled.div`
  font-size: 0.9rem;
  color: #333;
`;

export const HintToggleButton = styled.button<{ active: string }>`
  background-color: ${props => (props.active ? '#4caf50' : '#f8f8f8')};
  color: ${props => (props.active ? 'white' : '#333')};
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => (props.active ? '#45a049' : '#e8e8e8')};
  }
`;

export const HintImage = styled.div<{ imageUrl: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  opacity: 0.3;
  pointer-events: none;
  z-index: 0;
`;
