import styled from 'styled-components';

export const HistoryContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
`;

export const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${props => (props.$active ? 'var(--success-color)' : 'transparent')};
  color: ${props => (props.$active ? '#fff' : '#333')};
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => (props.$active ? 'var(--success-color)' : '#e0e0e0')};
  }
`;

export const ScrollableList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const ListItemBase = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #ddd;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #eaeaea;
  }
`;

export const RecordItem = styled(ListItemBase)``;

export const HistoryItem = styled(ListItemBase).attrs({ as: 'li' })`
  padding: 12px;
`;

export const RecordLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const RecordImageName = styled.div`
  font-weight: bold;
  color: #2196f3;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RecordDivision = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

export const RecordCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 12px;
`;

export const RecordRank = styled.div`
  font-size: 0.9rem;
  color: #ffd700;
`;

export const RecordScore = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  color: #333;
`;

export const RecordRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

export const RecordTime = styled.div`
  font-weight: bold;
  color: var(--success-color);
  font-size: 0.85rem;
`;

export const RecordClears = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

export const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
`;

export const ImageName = styled.div`
  font-weight: bold;
  color: #2196f3;
`;

export const ClearInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

export const ClearTime = styled.div`
  font-weight: bold;
  color: var(--success-color);
`;

export const ClearDate = styled.div`
  font-size: 12px;
  color: #757575;
  margin-top: 4px;
`;

export const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #757575;
  font-style: italic;
`;
