// エンディング画面（簡易版・spec §6.7 / Phase 1 範囲）
//
// Phase 2 で独白 3 画面 + クレジットロール + ランク集計 + SOUND TEST を追加。

import React from 'react';
import styled from 'styled-components';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';

const Message = styled.p`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  color: ${TOKENS.textPrimary};
  margin: 8px 0 24px;
  letter-spacing: 1px;
`;

export interface EndingScreenProps {
  readonly onBackToStageSelect: () => void;
}

export const EndingScreen: React.FC<EndingScreenProps> = ({ onBackToStageSelect }) => (
  <Overlay role="dialog" aria-label="エンディング">
    <Panel>
      <LargeTitle style={{ color: TOKENS.accentGold }}>CONGRATULATIONS!</LargeTitle>
      <Message>YOU CLEARED ALL 8 STAGES.</Message>
      <Message>THANK YOU FOR PLAYING.</Message>
      <PrimaryButton onClick={onBackToStageSelect} autoFocus>BACK TO STAGE SELECT</PrimaryButton>
    </Panel>
  </Overlay>
);
