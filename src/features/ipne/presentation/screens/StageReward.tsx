/**
 * ステージ報酬選択画面コンポーネント
 */
import React from 'react';
import styled from 'styled-components';
import {
  Overlay,
} from '../../../../pages/IpnePage.styles';
import { StageRewardType } from '../../types';
import { STAGE_REWARD_CHOICES } from '../../story';

const RewardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  text-align: center;
  width: 100%;
  max-width: 40rem;
`;

const RewardTitle = styled.h2`
  font-size: 1.5rem;
  color: #fbbf24;
  margin: 0;
`;

const RewardSubtitle = styled.p`
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
`;

const RewardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  width: 100%;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const RewardCard = styled.button<{ $disabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1rem;
  background: ${({ $disabled }) => ($disabled ? 'rgba(107, 114, 128, 0.2)' : 'rgba(59, 130, 246, 0.15)')};
  border: 1px solid ${({ $disabled }) => ($disabled ? '#4b5563' : '#3b82f6')};
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  color: white;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${({ $disabled }) => ($disabled ? 'rgba(107, 114, 128, 0.2)' : 'rgba(59, 130, 246, 0.3)')};
    transform: ${({ $disabled }) => ($disabled ? 'none' : 'translateY(-2px)')};
  }
`;

const RewardLabel = styled.div`
  font-size: 1rem;
  font-weight: bold;
  color: #e2e8f0;
`;

const RewardEffect = styled.div`
  font-size: 0.8rem;
  color: #3b82f6;
`;

const RewardDescription = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
`;

/**
 * ステージ報酬選択画面
 */
export const StageRewardScreen: React.FC<{
  onSelect: (rewardType: StageRewardType) => void;
  canChoose: (rewardType: StageRewardType) => boolean;
}> = ({ onSelect, canChoose }) => {
  return (
    <Overlay>
      <RewardContainer>
        <RewardTitle>報酬を選択</RewardTitle>
        <RewardSubtitle>次のステージに向けて強化しましょう</RewardSubtitle>
        <RewardGrid>
          {STAGE_REWARD_CHOICES.map((choice) => {
            const disabled = !canChoose(choice.type);
            return (
              <RewardCard
                key={choice.type}
                $disabled={disabled}
                disabled={disabled}
                onClick={() => !disabled && onSelect(choice.type)}
              >
                <RewardLabel>{choice.label}</RewardLabel>
                <RewardEffect>{choice.effect}</RewardEffect>
                <RewardDescription>{choice.description}</RewardDescription>
              </RewardCard>
            );
          })}
        </RewardGrid>
      </RewardContainer>
    </Overlay>
  );
};
