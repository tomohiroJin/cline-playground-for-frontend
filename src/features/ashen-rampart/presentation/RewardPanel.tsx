/**
 * 灰燼の城壁 - 報酬選択パネル
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
`;

const Choices = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 12px 0;
`;

const Choice = styled.button`
  width: 140px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid #e8b04b;
  background: #241d22;
  color: #e8ded2;
  cursor: pointer;
`;

interface Props {
  choices: string[];
  onPick: (index: number | null) => void;
}

export const RewardPanel: React.FC<Props> = ({ choices, onPick }) => (
  <Panel>
    <h3>報酬を選択</h3>
    <Choices>
      {choices.map((cardId, i) => {
        const card = getCardDefinition(cardId);
        return (
          <Choice key={`${cardId}-${i}`} data-testid="reward-card" onClick={() => onPick(i)}>
            <strong>{card.name}</strong>
            <div>🔮{card.cost}</div>
            <div>{card.description}</div>
          </Choice>
        );
      })}
    </Choices>
    <button onClick={() => onPick(null)}>スキップ</button>
  </Panel>
);
