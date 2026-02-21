import styled from 'styled-components';

export const ResultOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  z-index: 20;
  padding: 16px;
  overflow-y: auto;
`;

export const ResultTitle = styled.h2`
  font-size: 1.4rem;
  margin: 0 0 12px;
`;

export const ResultList = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 12px;
  margin: 0 0 12px;
  font-size: 0.9rem;
  width: 100%;
  max-width: 280px;
`;

export const ResultLabel = styled.dt`
  text-align: right;
  opacity: 0.8;
`;

export const ResultValue = styled.dd`
  margin: 0;
  font-weight: bold;
`;

export const BestScoreBadge = styled.div`
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #333;
  padding: 4px 14px;
  border-radius: 999px;
  font-weight: bold;
  font-size: 0.85rem;
  margin-bottom: 12px;
`;

export const ResultButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`;

export const ResultButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background-color: ${props => (props.$variant === 'secondary' ? '#2196F3' : 'var(--success-color)')};
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;
