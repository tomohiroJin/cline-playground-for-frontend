/**
 * イベントカードコンポーネント
 * イベントの名前・説明・状況テキストを表示
 */
import React from 'react';
import styled from 'styled-components';

export interface EventCardProps {
  name: string;
  description: string;
  situationText: string;
}

const EventTitle = styled.div`
  font-size: 16px;
  color: #f0c040;
  text-shadow: 0 0 8px #f0c04040;
  text-align: center;
  margin-bottom: 6px;
`;

const EventDesc = styled.div`
  font-size: 11px;
  color: #c0b898;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 10px;
`;

const SituationText = styled.div`
  font-size: 13px;
  color: #e0d8c8;
  text-align: center;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 0 6px #f0c04030;
`;

export const EventCard: React.FC<EventCardProps> = ({ name, description, situationText }) => (
  <>
    <EventTitle>{name}</EventTitle>
    <EventDesc>{description}</EventDesc>
    <SituationText>{situationText}</SituationText>
  </>
);
