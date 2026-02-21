import React, { useState } from 'react';
import { ClearHistory } from '../../utils/storage-utils';
import { PuzzleRecord } from '../../types/puzzle';
import { formatElapsedTime } from '../../utils/puzzle-utils';
import {
  HistoryContainer,
  TabRow,
  Tab,
  ScrollableList,
  RecordItem,
  RecordLeft,
  RecordImageName,
  RecordDivision,
  RecordCenter,
  RecordRank,
  RecordScore,
  RecordRight,
  RecordTime,
  RecordClears,
  HistoryList,
  HistoryItem,
  ImageName,
  ClearInfo,
  ClearTime,
  ClearDate,
  EmptyMessage,
} from './ClearHistoryList.styles';

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
        <ScrollableList>
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
        </ScrollableList>
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

export default ClearHistoryList;
