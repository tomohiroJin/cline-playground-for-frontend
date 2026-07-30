/**
 * 灰燼の城壁 - 徴発の選択
 *
 * 選択中もゲームは止まらない（止めると一時停止でマナを稼げる抜け道になる）。
 * したがって盤面を覆い隠さず、上部に横並びで出す。
 */
import React from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { COLORS } from './theme';

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: ${COLORS.dominant};
  border-bottom: 1px solid ${COLORS.opportunity};
  color: ${COLORS.secondary};
`;

const Option = styled.button`
  min-height: 44px;
  padding: 6px 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.opportunity};
  border-radius: 4px;
  cursor: pointer;
`;

const Note = styled.span`
  font-size: 12px;
`;

interface Props {
  options: readonly string[];
  onChoose: (index: number) => void;
}

export const LevyChoice: React.FC<Props> = ({ options, onChoose }) => {
  if (options.length === 0) return null;
  return (
    <Bar>
      <strong>徴発: 1枚選ぶ</strong>
      {options.map((id, index) => {
        const card = getCardDefinition(id);
        return (
          <Option
            key={`${id}-${index}`}
            type="button"
            aria-label={`${card.name} コスト${card.cost}`}
            onClick={() => onChoose(index)}
          >
            {card.name}（{card.cost}）
          </Option>
        );
      })}
      <Note>選ぶあいだも時間は進みます</Note>
    </Bar>
  );
};
