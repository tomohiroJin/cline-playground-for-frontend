// OPTIONS モーダル（spec §6.2.6）
//
// 機能: REPLAY ENDING / RESET PROGRESS / CLOSE
// RESET は二重確認モーダルで保護。

import React, { useState } from 'react';
import styled from 'styled-components';
import { Overlay, Panel, LargeTitle, PrimaryButton, DangerButton, TOKENS } from './campaign-styles';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
`;

const ConfirmText = styled.p`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  color: ${TOKENS.accentDanger};
  margin: 0 0 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

export interface OptionsModalProps {
  /** REPLAY ENDING ボタンを有効にするか（completed=true のとき true） */
  readonly canReplayEnding: boolean;
  readonly onReplayEnding: () => void;
  readonly onResetProgress: () => void;
  readonly onClose: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  canReplayEnding,
  onReplayEnding,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => setConfirmReset(true);
  const handleResetConfirm = () => {
    onResetProgress();
    setConfirmReset(false);
  };
  const handleResetCancel = () => setConfirmReset(false);

  return (
    <Overlay role="dialog" aria-label="OPTIONS">
      <Panel>
        <LargeTitle>OPTIONS</LargeTitle>
        {confirmReset ? (
          <>
            <ConfirmText>DELETE ALL RECORDS?</ConfirmText>
            <Row>
              <DangerButton onClick={handleResetConfirm} autoFocus>Y (DELETE)</DangerButton>
              <PrimaryButton onClick={handleResetCancel}>N (CANCEL)</PrimaryButton>
            </Row>
          </>
        ) : (
          <>
            <Stack>
              <PrimaryButton
                onClick={onReplayEnding}
                disabled={!canReplayEnding}
                aria-label="REPLAY ENDING"
              >
                ▶ REPLAY ENDING
              </PrimaryButton>
              <DangerButton onClick={handleResetClick} aria-label="RESET PROGRESS">
                ⚠ RESET PROGRESS
              </DangerButton>
            </Stack>
            <PrimaryButton onClick={onClose}>CLOSE</PrimaryButton>
          </>
        )}
      </Panel>
    </Overlay>
  );
};
