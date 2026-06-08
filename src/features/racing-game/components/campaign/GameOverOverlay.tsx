// ゲームオーバー オーバーレイ（spec §6.6）
//
// 残機 0 + 時間切れで表示。spec の決定により Retry は出さず STAGE SELECT のみ。

import React from 'react';
import styled from 'styled-components';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';

const StageInfo = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 18px;
  color: ${TOKENS.textPrimary};
  margin: 12px 0 24px;
`;

export interface GameOverOverlayProps {
  readonly stageNumber: number;
  readonly totalStages: number;
  readonly onBackToStageSelect: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  stageNumber,
  totalStages,
  onBackToStageSelect,
}) => (
  <Overlay role="dialog" aria-label="ゲームオーバー">
    <Panel>
      <LargeTitle style={{ color: '#E63946' }}>GAME OVER</LargeTitle>
      <StageInfo>STAGE {stageNumber} / {totalStages}</StageInfo>
      <PrimaryButton onClick={onBackToStageSelect} autoFocus>STAGE SELECT</PrimaryButton>
    </Panel>
  </Overlay>
);
