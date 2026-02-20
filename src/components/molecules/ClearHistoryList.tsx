import React, { useState } from 'react';
import { ClearHistory } from '../../utils/storage-utils';
import { PuzzleRecord } from '../../types/puzzle';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import styled from 'styled-components';

/**
 * クリア履歴リストのプロパティの型定義
 */
type ClearHistoryListProps = {
  history: ClearHistory[];
  records?: PuzzleRecord[];
};

/**
 * クリア履歴リストコンポーネント
 */
const ClearHistoryList: React.FC<ClearHistoryListProps> = ({ history, records = [] }) => {
  const [tab, setTab] = useState<'best' | 'history'>(records.length > 0 ? 'best' : 'history');

  if (history.length === 0 && records.length === 0) {
    return <EmptyMessage>クリア履歴はありません</EmptyMessage>;
  }

  return (
    <HistoryContainer>
      <TabRow>
        {records.length > 0 && (
          <Tab $active={tab === 'best'} onClick={() => setTab('best')}>
            ベストスコア
          </Tab>
        )}
        <Tab $active={tab === 'history'} onClick={() => setTab('history')}>
          クリア履歴
        </Tab>
      </TabRow>

      {tab === 'best' && records.length > 0 && (
        <RecordList>
          {records.map(record => (
            <RecordItem key={`${record.imageId}-${record.division}`}>
              <RecordLeft>
                <RecordImageName>{record.imageId}</RecordImageName>
                <RecordDivision>{record.division}x{record.division}</RecordDivision>
              </RecordLeft>
              <RecordCenter>
                <RecordRank>{record.bestRank}</RecordRank>
                <RecordScore>{record.bestScore.toLocaleString()}pts</RecordScore>
              </RecordCenter>
              <RecordRight>
                <RecordTime>{formatElapsedTime(record.bestTime)}</RecordTime>
                <RecordClears>{record.clearCount}回クリア</RecordClears>
              </RecordRight>
            </RecordItem>
          ))}
        </RecordList>
      )}

      {tab === 'history' && (
        <HistoryList>
          {history.map(entry => (
            <HistoryItem key={entry.id}>
              <ImageName>{entry.imageName}</ImageName>
              <ClearInfo>
                <ClearTime>クリアタイム: {formatElapsedTime(entry.clearTime)}</ClearTime>
                <ClearDate>
                  {new Date(entry.clearDate).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ClearDate>
              </ClearInfo>
            </HistoryItem>
          ))}
        </HistoryList>
      )}
    </HistoryContainer>
  );
};

// スタイル定義
const HistoryContainer = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 600px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background-color: ${props => (props.$active ? '#4caf50' : 'transparent')};
  color: ${props => (props.$active ? '#fff' : '#333')};
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => (props.$active ? '#4caf50' : '#e0e0e0')};
  }
`;

const RecordList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const RecordItem = styled.div`
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

const RecordLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

const RecordImageName = styled.div`
  font-weight: bold;
  color: #2196f3;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RecordDivision = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const RecordCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 12px;
`;

const RecordRank = styled.div`
  font-size: 0.9rem;
  color: #ffd700;
`;

const RecordScore = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  color: #333;
`;

const RecordRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const RecordTime = styled.div`
  font-weight: bold;
  color: #4caf50;
  font-size: 0.85rem;
`;

const RecordClears = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
`;

const HistoryItem = styled.li`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #eaeaea;
  }
`;

const ImageName = styled.div`
  font-weight: bold;
  color: #2196f3;
`;

const ClearInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const ClearTime = styled.div`
  font-weight: bold;
  color: #4caf50;
`;

const ClearDate = styled.div`
  font-size: 12px;
  color: #757575;
  margin-top: 4px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #757575;
  font-style: italic;
`;

export default ClearHistoryList;
