/**
 * 灰燼の城壁 - 手札表示
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';

const Area = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Card = styled.button<{ $selected: boolean; $affordable: boolean }>`
  width: 96px;
  padding: 8px 6px;
  border-radius: 8px;
  border: 2px solid ${({ $selected }) => ($selected ? '#e8b04b' : '#463a42')};
  background: #241d22;
  color: ${({ $affordable }) => ($affordable ? '#e8ded2' : '#6b5f66')};
  cursor: ${({ $affordable }) => ($affordable ? 'pointer' : 'not-allowed')};
  font-size: 12px;
  text-align: center;
`;

const TYPE_LABEL: Record<string, string> = {
  tower: 'タワー',
  trap: '罠',
  spell: 'スペル',
  tactic: '戦術',
};

interface Props {
  hand: string[];
  mana: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export const HandArea: React.FC<Props> = ({ hand, mana, selectedIndex, onSelect }) => (
  <Area>
    {hand.map((cardId, i) => {
      const card = getCardDefinition(cardId);
      const affordable = card.cost <= mana;
      return (
        <Card
          key={`${cardId}-${i}`}
          data-testid="hand-card"
          $selected={selectedIndex === i}
          $affordable={affordable}
          disabled={!affordable}
          onClick={() => onSelect(i)}
        >
          <div>
            【{TYPE_LABEL[card.type]}】🔮{card.cost}
          </div>
          <strong>{card.name}</strong>
          <div>{card.description}</div>
        </Card>
      );
    })}
  </Area>
);
