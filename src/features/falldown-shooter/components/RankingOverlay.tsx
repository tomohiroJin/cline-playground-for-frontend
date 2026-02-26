// ランキング表示コンポーネント

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { Difficulty } from '../types';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../difficulty';
import { getScores, type ScoreRecord } from '../../../utils/score-storage';
import {
  RankingContainer,
  OverlayContent,
  OverlayTitle,
  Button,
} from '../../../pages/FallingShooterPage.styles';

interface RankingOverlayProps {
  onClose: () => void;
}

const RANKING_LIMIT = 10;

const RankingList = styled.div`
  margin: 0.75rem 0;
  text-align: left;
`;

const RankingRow = styled.div<{ $isFirst: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: ${props => (props.$isFirst ? '#facc15' : '#d1d5db')};
  border-bottom: 1px solid #374151;
`;

const RankNumber = styled.span`
  width: 1.5rem;
  text-align: right;
  margin-right: 0.5rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  justify-content: center;
`;

const Tab = styled.button<{ $color: string; $isActive: boolean }>`
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  background-color: ${props => props.$color};
  opacity: ${props => (props.$isActive ? 1 : 0.5)};

  &:hover {
    opacity: 0.8;
  }
`;

/** 日付をフォーマットする */
const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

export const RankingOverlay: React.FC<RankingOverlayProps> = ({ onClose }) => {
  const [tab, setTab] = useState<Difficulty>('normal');
  const [scores, setScores] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    getScores('falling-shooter', RANKING_LIMIT, tab).then(setScores);
  }, [tab]);

  return (
    <RankingContainer>
      <OverlayContent>
        <OverlayTitle $color="#facc15">🏆 ランキング</OverlayTitle>

        <TabContainer>
          {DIFFICULTY_ORDER.map(key => (
            <Tab
              key={key}
              $color={DIFFICULTIES[key].color}
              $isActive={tab === key}
              onClick={() => setTab(key)}
            >
              {DIFFICULTIES[key].label}
            </Tab>
          ))}
        </TabContainer>

        <RankingList>
          {scores.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center' }}>
              スコアがありません
            </p>
          )}
          {scores.map((record, i) => (
            <RankingRow key={`${record.timestamp}-${i}`} $isFirst={i === 0}>
              <span>
                <RankNumber>{i + 1}.</RankNumber>
                {record.score.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                {formatDate(record.timestamp)}
              </span>
            </RankingRow>
          ))}
        </RankingList>

        <Button onClick={onClose} $variant="secondary">
          Close
        </Button>
      </OverlayContent>
    </RankingContainer>
  );
};
