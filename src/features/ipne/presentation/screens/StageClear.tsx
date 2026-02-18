/**
 * ステージクリア画面コンポーネント
 */
import React from 'react';
import styled from 'styled-components';
import {
  Overlay,
} from '../../../../pages/IpnePage.styles';
import { StageNumber } from '../../types';

const StageClearContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
  text-align: center;
`;

const StageClearTitle = styled.h2`
  font-size: 2.5rem;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  margin: 0;
`;

const StageNumber_ = styled.div`
  font-size: 1.2rem;
  color: #94a3b8;
`;

const StatusSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  min-width: 200px;
`;

const StatusRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  font-size: 0.9rem;
  color: #e2e8f0;
`;

const StatusLabel = styled.span`
  color: #94a3b8;
`;

const NextButton = styled.button`
  padding: 0.8rem 2rem;
  font-size: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;

  &:hover {
    background: #2563eb;
  }
`;

/**
 * ステージクリア画面
 */
export const StageClearScreen: React.FC<{
  stage: StageNumber;
  playerLevel: number;
  playerHp: number;
  playerMaxHp: number;
  onNext: () => void;
}> = ({ stage, playerLevel, playerHp, playerMaxHp, onNext }) => {
  return (
    <Overlay>
      <StageClearContainer>
        <StageNumber_>STAGE {stage}</StageNumber_>
        <StageClearTitle>クリア！</StageClearTitle>
        <StatusSummary>
          <StatusRow>
            <StatusLabel>レベル</StatusLabel>
            <span>{playerLevel}</span>
          </StatusRow>
          <StatusRow>
            <StatusLabel>HP</StatusLabel>
            <span>{playerHp} / {playerMaxHp}</span>
          </StatusRow>
        </StatusSummary>
        <NextButton onClick={onNext}>次へ</NextButton>
      </StageClearContainer>
    </Overlay>
  );
};
