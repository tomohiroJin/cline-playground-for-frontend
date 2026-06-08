// 分岐ルート選択画面（spec §8 / Phase 3.1）
//
// 分岐ステージで Stage.branch.a / Stage.branch.b を選択させる。
// キーボード ←→ で移動、Enter で確定。

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { Stage, Branch } from '../../domain/race/stage';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS, focusRingStyle } from './campaign-styles';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
`;

const BranchButton = styled.button<{ $selected: boolean }>`
  background: ${(p) => (p.$selected ? TOKENS.textPrimary : 'transparent')};
  color: ${(p) => (p.$selected ? TOKENS.bgPrimary : TOKENS.textPrimary)};
  border: 2px solid ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  padding: 12px 24px;
  cursor: pointer;
  min-width: 240px;
  min-height: 44px;
  ${focusRingStyle}
`;

const StageHeader = styled.p`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 16px;
  margin: 0 0 8px;
  color: ${TOKENS.textSecondary};
`;

const Hint = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 11px;
  color: ${TOKENS.textSecondary};
  margin-top: 8px;
`;

export interface BranchSelectScreenProps {
  readonly stage: Stage;
  readonly defaultChoice?: 'a' | 'b';
  readonly onConfirm: (choice: 'a' | 'b', branch: Branch) => void;
  readonly onCancel?: () => void;
}

export const BranchSelectScreen: React.FC<BranchSelectScreenProps> = ({
  stage,
  defaultChoice = 'a',
  onConfirm,
  onCancel,
}) => {
  const [selected, setSelected] = useState<'a' | 'b'>(defaultChoice);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelected('a');
      } else if (e.key === 'ArrowRight') {
        setSelected('b');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!stage.branch) return;
        onConfirm(selected, stage.branch[selected]);
      } else if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, selected, onConfirm, onCancel]);

  if (!stage.branch) return null;

  return (
    <Overlay role="dialog" aria-label="ルート選択">
      <Panel>
        <StageHeader>{stage.numberLabel}</StageHeader>
        <LargeTitle>{stage.title}</LargeTitle>
        <Stack>
          <BranchButton
            $selected={selected === 'a'}
            onClick={() => setSelected('a')}
            onDoubleClick={() => onConfirm('a', stage.branch!.a)}
            aria-label={`A ルート: ${stage.branch.a.label}`}
          >
            A: {stage.branch.a.label}
          </BranchButton>
          <BranchButton
            $selected={selected === 'b'}
            onClick={() => setSelected('b')}
            onDoubleClick={() => onConfirm('b', stage.branch!.b)}
            aria-label={`B ルート: ${stage.branch.b.label}`}
          >
            B: {stage.branch.b.label}
          </BranchButton>
        </Stack>
        <PrimaryButton onClick={() => onConfirm(selected, stage.branch![selected])}>
          CONFIRM
        </PrimaryButton>
        <Hint>← → で選択 / Enter で決定</Hint>
      </Panel>
    </Overlay>
  );
};
