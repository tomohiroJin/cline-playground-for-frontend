import React from 'react';
import { ClearHistory } from '../../utils/storage-utils';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import styled from 'styled-components';

/**
 * クリア履歴リストのプロパティの型定義
 */
type ClearHistoryListProps = {
  history: ClearHistory[];
};

/**
 * クリア履歴リストコンポーネント
 *
 * @param history クリア履歴の配列
 */
const ClearHistoryList: React.FC<ClearHistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return <EmptyMessage>クリア履歴はありません</EmptyMessage>;
  }

  return (
    <HistoryContainer>
      <HistoryTitle>クリア履歴</HistoryTitle>
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

const HistoryTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 12px;
  color: #333;
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
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
