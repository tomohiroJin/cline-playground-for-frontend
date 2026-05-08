// ステージセレクト画面（spec §6.2）
//
// - 4×2 / 2×4 レスポンシブグリッド（モバイル幅 < 768px で縦長 2×4）
// - ランク 4 段階表示（GOLD/SILVER/BRONZE/未/ロック）
// - キーボード操作（←↑→↓ + Enter + Esc + Tab）
// - ロックステージのクリックは DENIED トースト
// - 右上に OPTIONS 歯車アイコン
// - 全クリア時に ALL CLEAR! リボン

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import type { Stage, StageId } from '../../domain/race/stage';
import type { CampaignProgress } from '../../domain/race/campaign-progress';
import { isCampaignCompleted } from '../../domain/race/campaign-progress';
import { TOKENS, focusRingStyle, PrimaryButton } from './campaign-styles';
import { StageCard } from './StageCard';

const Container = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: ${TOKENS.bgPrimary};
  color: ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontEnPixel};
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0;
  letter-spacing: 2px;
`;

const OptionsButton = styled.button`
  background: transparent;
  color: ${TOKENS.textPrimary};
  border: 2px solid ${TOKENS.textPrimary};
  font-size: 24px;
  padding: 0;
  width: 44px;
  height: 44px;
  cursor: pointer;
  ${focusRingStyle}

  &:hover {
    background: ${TOKENS.textPrimary};
    color: ${TOKENS.bgPrimary};
  }
`;

const AllClearRibbon = styled.div`
  font-size: 18px;
  color: ${TOKENS.accentGold};
  border: 2px solid ${TOKENS.accentGold};
  padding: 6px 18px;
  margin-bottom: 16px;
  letter-spacing: 2px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
  max-width: 800px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ToastBar = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: ${TOKENS.bgPanel};
  color: ${TOKENS.accentDanger};
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  padding: 12px 24px;
  border: 2px solid ${TOKENS.accentDanger};
  z-index: 60;
`;

const Footer = styled.div`
  margin-top: 24px;
`;

const TOAST_DURATION_MS = 1500;

export interface StageSelectScreenProps {
  readonly stages: readonly Stage[];
  readonly progress: CampaignProgress;
  readonly lastPlayedById?: Partial<Record<StageId, string>>;  // "M/D" 形式の文字列
  readonly onSelectStage: (stage: Stage) => void;
  readonly onBackToMenu: () => void;
  readonly onOpenOptions: () => void;
  /** ロック中ステージクリック時の SE 再生（任意） */
  readonly onPlayDeniedSe?: () => void;
}

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  stages,
  progress,
  lastPlayedById,
  onSelectStage,
  onBackToMenu,
  onOpenOptions,
  onPlayDeniedSe,
}) => {
  const [toast, setToast] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const showLockedToast = (stage: Stage) => {
    setToast(`STAGE LOCKED — CLEAR STAGE ${stage.id - 1} FIRST`);
    onPlayDeniedSe?.();
    window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  const handleSelectAt = (index: number) => {
    const stage = stages[index];
    if (!stage) return;
    const isLocked = stage.id > progress.highestUnlocked;
    if (isLocked) {
      showLockedToast(stage);
      return;
    }
    onSelectStage(stage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cols = 4;  // CSS grid と同じ列数（実 UI が 2 列でもキーは 4×2 ベースで動作）
    const total = stages.length;
    let next = focusedIndex;
    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(focusedIndex + 1, total - 1);
        break;
      case 'ArrowLeft':
        next = Math.max(focusedIndex - 1, 0);
        break;
      case 'ArrowDown':
        next = Math.min(focusedIndex + cols, total - 1);
        break;
      case 'ArrowUp':
        next = Math.max(focusedIndex - cols, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelectAt(focusedIndex);
        return;
      case 'Escape':
        onBackToMenu();
        return;
      default:
        return;
    }
    e.preventDefault();
    setFocusedIndex(next);
    cardRefs.current[next]?.focus();
  };

  useEffect(() => {
    cardRefs.current[focusedIndex]?.focus();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const completed = isCampaignCompleted(progress);

  return (
    <Container onKeyDown={handleKeyDown} tabIndex={-1}>
      <Header>
        <Title>STAGE SELECT</Title>
        <OptionsButton aria-label="OPTIONS" onClick={onOpenOptions}>⚙</OptionsButton>
      </Header>

      {completed && <AllClearRibbon>ALL CLEAR!</AllClearRibbon>}

      <Grid role="grid" aria-label="ステージグリッド">
        {stages.map((stage, idx) => {
          const isLocked = stage.id > progress.highestUnlocked;
          return (
            <StageCard
              key={stage.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              stage={stage}
              record={progress.records[stage.id]}
              isLocked={isLocked}
              lastPlayed={lastPlayedById?.[stage.id]}
              onSelect={() => handleSelectAt(idx)}
              onFocus={() => setFocusedIndex(idx)}
            />
          );
        })}
      </Grid>

      <Footer>
        <PrimaryButton onClick={onBackToMenu}>BACK TO MENU</PrimaryButton>
      </Footer>

      {toast && <ToastBar role="status">{toast}</ToastBar>}
    </Container>
  );
};
