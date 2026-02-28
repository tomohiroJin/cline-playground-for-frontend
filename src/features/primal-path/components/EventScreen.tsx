/**
 * 原始進化録 - PRIMAL PATH - ランダムイベント画面
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { RandomEventDef, EventChoice, SfxType, RunState } from '../types';
import { Screen, SubTitle, GamePanel } from '../styles';

/* ===== Props ===== */

interface Props {
  event: RandomEventDef;
  run: RunState;
  onChoose: (choice: EventChoice) => void;
  playSfx: (t: SfxType) => void;
}

/* ===== スタイル ===== */

const eventGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #f0c04010; }
  50% { box-shadow: 0 0 20px #f0c04030, 0 0 30px #f0c04015; }
`;

const EventPanel = styled(GamePanel)`
  animation: ${eventGlow} 3s infinite;
  border-color: #f0c04040;
  max-width: 380px;
`;

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
  font-size: 11px;
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
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const ChoiceHint = styled.div`
  font-size: 9px;
  color: #908870;
`;

const CostTag = styled.span`
  font-size: 9px;
  color: #e0c060;
  margin-left: 6px;
`;

/* ===== コンポーネント ===== */

export const EventScreen: React.FC<Props> = ({ event, run, onChoose, playSfx }) => {
  const handleChoose = (choice: EventChoice) => {
    playSfx('click');
    onChoose(choice);
  };

  /** コスト不足判定 */
  const canAfford = (choice: EventChoice): boolean => {
    if (!choice.cost) return true;
    if (choice.cost.type === 'bone') return run.bE >= choice.cost.amount;
    return true;
  };

  return (
    <Screen $center>
      <SubTitle>🗺️ ランダムイベント</SubTitle>
      <EventPanel>
        <EventTitle>{event.name}</EventTitle>
        <EventDesc>{event.description}</EventDesc>

        {event.choices.map((choice, i) => {
          const affordable = canAfford(choice);
          return (
            <ChoiceBtn
              key={i}
              $risk={choice.riskLevel}
              $disabled={!affordable}
              onClick={() => handleChoose(choice)}
            >
              <ChoiceLabel>
                {RISK_ICONS[choice.riskLevel]} {choice.label}
                {choice.cost && (
                  <CostTag>
                    (🦴{choice.cost.amount}{!affordable && ' 不足'})
                  </CostTag>
                )}
              </ChoiceLabel>
              <ChoiceHint>→ {choice.description}</ChoiceHint>
            </ChoiceBtn>
          );
        })}
      </EventPanel>
    </Screen>
  );
};
