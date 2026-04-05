/**
 * イベント選択肢コンポーネント
 * リスクレベル・コスト・エフェクトヒント付きの選択肢ボタン群
 */
import React from 'react';
import styled, { css } from 'styled-components';
import type { EventChoice } from '../../types';
import { getEffectHintColor, getEffectHintIcon } from '../../game-logic';

export interface EventChoicesProps {
  choices: readonly EventChoice[];
  currentBones: number;
  onChoose: (choice: EventChoice) => void;
}

/** リスクレベル別カラー */
const RISK_COLORS: Record<string, string> = {
  safe: '#50e090',
  risky: '#f0c040',
  dangerous: '#f05050',
};

const RISK_ICONS: Record<string, string> = {
  safe: '🟢',
  risky: '🟡',
  dangerous: '🔴',
};

const ChoiceBtn = styled.button<{ $risk: string; $disabled?: boolean }>`
  display: block;
  width: 100%;
  background: linear-gradient(180deg, #14141e, #0e0e16);
  border: 1px solid ${p => RISK_COLORS[p.$risk] ?? '#333'}40;
  color: #e0d8c8;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--fs-small, 12px);
  text-align: left;
  border-radius: 3px;
  transition: all 0.15s;
  user-select: none;

  &:hover {
    border-color: ${p => RISK_COLORS[p.$risk] ?? '#f0c040'};
    box-shadow: 0 0 8px ${p => (RISK_COLORS[p.$risk] ?? '#f0c040')}30;
  }
  &:active { transform: scale(0.97); }

  ${p => p.$disabled && css`
    opacity: 0.35;
    pointer-events: none;
  `}
`;

const ChoiceLabel = styled.div`
  font-size: var(--fs-small, 12px);
  font-weight: bold;
  margin-bottom: 2px;
`;

const ChoiceHint = styled.div`
  font-size: var(--fs-tiny, 11px);
  color: #908870;
`;

const CostTag = styled.span`
  font-size: var(--fs-tiny, 11px);
  color: #e0c060;
  margin-left: 6px;
`;

const EffectHintBadge = styled.span<{ $color: string }>`
  font-size: var(--fs-tiny, 11px);
  color: ${p => p.$color};
  margin-left: 6px;
  opacity: 0.85;
`;

/** コスト不足判定 */
const canAfford = (choice: EventChoice, currentBones: number): boolean => {
  if (!choice.cost) return true;
  if (choice.cost.type === 'bone') return currentBones >= choice.cost.amount;
  return true;
};

/** コスト表示テキスト */
const costLabel = (choice: EventChoice): string => {
  if (!choice.cost) return '';
  if (choice.cost.type === 'bone') return `🦴${choice.cost.amount}`;
  if (choice.cost.type === 'hp_damage') return `❤️-${choice.cost.amount}`;
  return '';
};

export const EventChoices: React.FC<EventChoicesProps> = ({ choices, currentBones, onChoose }) => (
  <>
    {choices.map((choice) => {
      const affordable = canAfford(choice, currentBones);
      return (
        <ChoiceBtn
          key={choice.label}
          $risk={choice.riskLevel}
          $disabled={!affordable}
          disabled={!affordable}
          onClick={() => onChoose(choice)}
          style={{ borderLeftWidth: 3, borderLeftColor: `${getEffectHintColor(choice.effect)}60` }}
        >
          <ChoiceLabel>
            {RISK_ICONS[choice.riskLevel]} {choice.label}
            <EffectHintBadge $color={getEffectHintColor(choice.effect)}>
              {getEffectHintIcon(choice.effect)}
            </EffectHintBadge>
            {choice.cost && (
              <CostTag>
                ({costLabel(choice)}{!affordable && ' 不足'})
              </CostTag>
            )}
          </ChoiceLabel>
          <ChoiceHint>→ {choice.description}</ChoiceHint>
        </ChoiceBtn>
      );
    })}
  </>
);
